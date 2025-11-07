from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model with PriceMon fields"""

    list_display = ('email', 'username', 'first_name', 'last_name', 'trust_score', 'trust_level', 'is_admin', 'is_staff', 'date_joined')
    list_filter = ('is_admin', 'is_staff', 'is_superuser', 'is_active', 'preferred_currency')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('PriceMon Settings', {
            'fields': ('preferred_currency', 'trust_score', 'total_products_added', 'total_prices_added', 'is_admin')
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('PriceMon Settings', {
            'fields': ('preferred_currency', 'is_admin')
        }),
    )

    readonly_fields = ('date_joined', 'last_login', 'created_at', 'updated_at')
