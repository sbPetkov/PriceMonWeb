from django.db import models
from django.conf import settings


class Category(models.Model):
    """
    Product categories with hierarchical structure (parent-child relationships).
    Examples: Food -> Dairy -> Milk
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories',
        help_text="Parent category for hierarchical structure"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Icon name or emoji for display"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} → {self.name}"
        return self.name

    @property
    def is_parent(self):
        """Check if this is a top-level category"""
        return self.parent is None

    @property
    def full_path(self):
        """Get full category path (e.g., 'Food → Dairy → Milk')"""
        if self.parent:
            return f"{self.parent.full_path} → {self.name}"
        return self.name


class Store(models.Model):
    """
    Physical stores/chains in Bulgaria where products can be purchased.
    Examples: Kaufland, Lidl, Billa, etc.
    """
    name = models.CharField(max_length=100, unique=True)
    chain = models.CharField(
        max_length=100,
        help_text="Store chain name (e.g., Kaufland, Lidl)",
        blank=True,
        default=''
    )
    address = models.CharField(
        max_length=255,
        help_text="Store address or location",
        blank=True,
        default=''
    )
    city = models.CharField(
        max_length=100,
        help_text="City where the store is located",
        blank=True,
        default=''
    )
    logo_url = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    # Store colors for UI
    primary_color = models.CharField(
        max_length=7,
        default='#DC143C',
        help_text="Hex color code for store branding"
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Whether this store is currently operational"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stores'
        verbose_name = 'Store'
        verbose_name_plural = 'Stores'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Products in the database with barcodes.
    Products go through approval workflow before being publicly visible.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    # Basic product info
    barcode = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Product barcode (EAN-13, UPC, etc.)"
    )
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)

    # Categorization
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products',
        help_text="Product category"
    )

    # Images
    image_url = models.URLField(blank=True, null=True)

    # Approval workflow
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text="Approval status of this product"
    )

    # User who added this product
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products_added',
        help_text="User who added this product"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['barcode']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['category', 'status']),
        ]

    def __str__(self):
        return f"{self.name} ({self.barcode})"

    @property
    def is_approved(self):
        """Check if product is approved and visible to all users"""
        return self.status == 'approved'

    @property
    def is_pending(self):
        """Check if product is awaiting approval"""
        return self.status == 'pending'

    def approve(self):
        """Approve this product (admin action)"""
        self.status = 'approved'
        self.save()

    def reject(self):
        """Reject this product (admin action)"""
        self.status = 'rejected'
        self.save()


class ProductPrice(models.Model):
    """
    Price submissions for products at specific stores.
    Includes price validation and community verification.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    CURRENCY_CHOICES = [
        ('BGN', 'Bulgarian Lev'),
        ('EUR', 'Euro'),
    ]

    # Relationships
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='prices',
        help_text="Product this price is for"
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='prices',
        help_text="Store where this price was found"
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='prices_submitted',
        help_text="User who submitted this price"
    )

    # Price data - ALWAYS store in EUR for consistency
    price_eur = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price in EUR (normalized for storage)"
    )

    # User-entered price (for display)
    price_entered = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price as entered by user"
    )
    currency_entered = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='BGN',
        help_text="Currency user entered the price in"
    )

    # Validation and verification
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='approved',
        db_index=True,
        help_text="Approval status"
    )
    is_outlier = models.BooleanField(
        default=False,
        help_text="Flagged as statistical outlier"
    )
    positive_votes = models.IntegerField(
        default=0,
        help_text="Number of positive votes (price is accurate)"
    )
    negative_votes = models.IntegerField(
        default=0,
        help_text="Number of negative votes (price is not accurate)"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_prices'
        verbose_name = 'Product Price'
        verbose_name_plural = 'Product Prices'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'store', '-created_at']),
            models.Index(fields=['product', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f"{self.product.name} at {self.store.name}: {self.price_entered} {self.currency_entered}"

    @property
    def display_price(self):
        """Get formatted price for display"""
        return f"{self.price_entered:.2f} {self.currency_entered}"

    def approve(self):
        """Approve this price (admin action)"""
        self.status = 'approved'
        self.save()

    def reject(self):
        """Reject this price (admin action)"""
        self.status = 'rejected'
        self.save()


class Favorite(models.Model):
    """
    User's favorite products for quick access.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites',
        help_text="User who favorited this product"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        help_text="Favorited product"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorites'
        verbose_name = 'Favorite'
        verbose_name_plural = 'Favorites'
        ordering = ['-created_at']
        unique_together = ['user', 'product']  # Prevent duplicate favorites
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} -> {self.product.name}"


class ScanHistory(models.Model):
    """
    Tracks user's barcode scans for history and analytics.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scan_history',
        help_text="User who scanned the product"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='scans',
        help_text="Product that was scanned"
    )
    barcode = models.CharField(
        max_length=50,
        help_text="Barcode that was scanned"
    )
    scan_type = models.CharField(
        max_length=20,
        choices=[('camera', 'Camera'), ('manual', 'Manual Entry')],
        default='camera',
        help_text="How the barcode was scanned"
    )
    scanned_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'scan_history'
        verbose_name = 'Scan History'
        verbose_name_plural = 'Scan Histories'
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['user', '-scanned_at']),
            models.Index(fields=['product', '-scanned_at']),
        ]

    def __str__(self):
        return f"{self.user.email} scanned {self.product.name} at {self.scanned_at}"


class PriceVerification(models.Model):
    """
    Community verification of price submissions.
    Users earn points for verifying others' prices (positive or negative vote).
    """
    VOTE_TYPE_CHOICES = [
        ('positive', 'Positive (Price is accurate)'),
        ('negative', 'Negative (Price is not accurate)'),
    ]

    price = models.ForeignKey(
        ProductPrice,
        on_delete=models.CASCADE,
        related_name='verifications',
        help_text="Price being verified"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='price_verifications',
        help_text="User who verified this price"
    )
    vote_type = models.CharField(
        max_length=10,
        choices=VOTE_TYPE_CHOICES,
        default='positive',
        help_text="Type of vote: positive (accurate) or negative (inaccurate)"
    )
    verified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'price_verifications'
        verbose_name = 'Price Verification'
        verbose_name_plural = 'Price Verifications'
        ordering = ['-verified_at']
        unique_together = ['price', 'user']  # Prevent duplicate verifications
        indexes = [
            models.Index(fields=['price', '-verified_at']),
            models.Index(fields=['user', '-verified_at']),
        ]

    def __str__(self):
        return f"{self.user.email} voted {self.vote_type} on price #{self.price.id}"


class PriceReport(models.Model):
    """
    User reports of suspicious or incorrect prices.
    Multiple reports trigger admin review.
    """
    REASON_CHOICES = [
        ('too_high', 'Price too high'),
        ('too_low', 'Price too low'),
        ('wrong_product', 'Wrong product'),
        ('wrong_store', 'Wrong store'),
        ('outdated', 'Outdated price'),
        ('duplicate', 'Duplicate submission'),
        ('other', 'Other reason'),
    ]

    price = models.ForeignKey(
        ProductPrice,
        on_delete=models.CASCADE,
        related_name='reports',
        help_text="Price being reported"
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='price_reports',
        help_text="User who reported this price"
    )
    reason = models.CharField(
        max_length=20,
        choices=REASON_CHOICES,
        help_text="Reason for reporting"
    )
    comment = models.TextField(
        blank=True,
        help_text="Additional details about the report"
    )
    reported_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'price_reports'
        verbose_name = 'Price Report'
        verbose_name_plural = 'Price Reports'
        ordering = ['-reported_at']
        unique_together = ['price', 'reported_by']  # Prevent duplicate reports from same user
        indexes = [
            models.Index(fields=['price', '-reported_at']),
            models.Index(fields=['reported_by', '-reported_at']),
        ]

    def __str__(self):
        return f"{self.reported_by.email} reported price #{self.price.id} for {self.get_reason_display()}"
