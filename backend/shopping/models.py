from django.db import models
from django.conf import settings
from products.models import Product


class ShoppingList(models.Model):
    """
    Shopping list created by users to track products they want to buy.
    Can be shared with other users.
    """
    name = models.CharField(max_length=200, help_text="Shopping list name")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_lists',
        help_text="User who created this list"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shopping_lists'
        verbose_name = 'Shopping List'
        verbose_name_plural = 'Shopping Lists'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['owner', '-updated_at']),
        ]

    def __str__(self):
        return f"{self.name} (by {self.owner.email})"


class ShoppingListMember(models.Model):
    """
    Members of a shopping list with different permission levels.
    Allows collaborative shopping lists.
    """
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('editor', 'Editor'),
    ]

    shopping_list = models.ForeignKey(
        ShoppingList,
        on_delete=models.CASCADE,
        related_name='members',
        help_text="Shopping list"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='list_memberships',
        help_text="Member user"
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='editor',
        help_text="Member's permission level"
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shopping_list_members'
        verbose_name = 'Shopping List Member'
        verbose_name_plural = 'Shopping List Members'
        unique_together = ['shopping_list', 'user']  # User can only be added once per list
        indexes = [
            models.Index(fields=['shopping_list', 'user']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.shopping_list.name} ({self.role})"


class ShoppingListItem(models.Model):
    """
    Items in a shopping list. Can be either:
    - A product from the database (product field)
    - A custom item (custom_name field)
    """
    shopping_list = models.ForeignKey(
        ShoppingList,
        on_delete=models.CASCADE,
        related_name='items',
        help_text="Shopping list this item belongs to"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='list_items',
        help_text="Product from database (if applicable)"
    )
    custom_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Custom item name (if not a product from database)"
    )
    quantity = models.PositiveIntegerField(
        default=1,
        help_text="Quantity needed"
    )
    checked = models.BooleanField(
        default=False,
        help_text="Whether this item has been purchased/checked off"
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='added_list_items',
        help_text="User who added this item"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shopping_list_items'
        verbose_name = 'Shopping List Item'
        verbose_name_plural = 'Shopping List Items'
        ordering = ['checked', '-created_at']  # Unchecked items first
        indexes = [
            models.Index(fields=['shopping_list', 'checked']),
            models.Index(fields=['shopping_list', '-created_at']),
        ]

    def __str__(self):
        item_name = self.product.name if self.product else self.custom_name
        status = "✓" if self.checked else "○"
        return f"{status} {item_name} x{self.quantity}"

    @property
    def name(self):
        """Get item name (from product or custom)"""
        return self.product.name if self.product else self.custom_name

    def clean(self):
        """Ensure either product or custom_name is set, but not both"""
        from django.core.exceptions import ValidationError
        if not self.product and not self.custom_name:
            raise ValidationError("Item must have either a product or custom_name")
        if self.product and self.custom_name:
            raise ValidationError("Item cannot have both product and custom_name")
