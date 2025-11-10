from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with email and password"""
        if not email:
            raise ValueError('Users must have an email address')

        email = self.normalize_email(email)

        # Auto-generate username from email if not provided
        if 'username' not in extra_fields or not extra_fields['username']:
            username = email.split('@')[0]
            # Ensure uniqueness
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            extra_fields['username'] = username

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with email and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds PriceMon-specific fields for trust scoring and preferences.
    Uses email as the primary authentication field instead of username.
    """

    # Override email to make it unique and required
    email = models.EmailField(
        unique=True,
        blank=False,
        null=False,
        help_text="User's email address (used for login)"
    )

    # Make username optional (auto-generated from email if not provided)
    username = models.CharField(
        max_length=150,
        unique=True,
        blank=True,
        null=True,
        help_text="Username (auto-generated if not provided)"
    )

    # User preferences
    preferred_currency = models.CharField(
        max_length=3,
        choices=[('BGN', 'Bulgarian Lev'), ('EUR', 'Euro')],
        default='BGN',
        help_text="User's preferred currency for displaying prices"
    )

    # Gamification and trust system
    trust_score = models.IntegerField(
        default=0,
        help_text="Trust score earned through contributions. Higher score = more privileges"
    )

    total_products_added = models.IntegerField(
        default=0,
        help_text="Total number of products added by this user"
    )

    total_prices_added = models.IntegerField(
        default=0,
        help_text="Total number of prices submitted by this user"
    )

    # Admin privileges
    is_admin = models.BooleanField(
        default=False,
        help_text="Admin users can approve products and prices"
    )

    # Email verification
    email_verified = models.BooleanField(
        default=False,
        help_text="Whether the user has verified their email address"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Set email as the username field for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email is USERNAME_FIELD, so don't include it here

    # Use custom manager
    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    @property
    def trust_level(self):
        """
        Returns user trust level based on trust score:
        - Bronze: 0-49 points
        - Silver: 50-99 points
        - Gold: 100+ points
        """
        if self.trust_score >= 100:
            return 'Gold'
        elif self.trust_score >= 50:
            return 'Silver'
        else:
            return 'Bronze'

    @property
    def can_auto_approve_products(self):
        """Products from users with 100+ trust score are auto-approved"""
        return self.is_admin or self.trust_score >= 100

    @property
    def can_auto_approve_prices(self):
        """Prices from users with 50+ trust score are auto-approved"""
        return self.is_admin or self.trust_score >= 50
