from django.contrib import admin
from .models import Category, Store, Product, ProductPrice, Favorite, ScanHistory, PriceVerification, PriceReport


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'icon', 'created_at')
    list_filter = ('parent',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'chain', 'is_active', 'created_at')
    list_filter = ('is_active', 'chain')
    search_fields = ('name', 'chain')
    ordering = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'barcode', 'brand', 'category', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('name', 'barcode', 'brand')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    actions = ['approve_products', 'reject_products']

    def approve_products(self, request, queryset):
        count = queryset.update(status='approved')
        self.message_user(request, f'{count} products approved.')
    approve_products.short_description = 'Approve selected products'

    def reject_products(self, request, queryset):
        count = queryset.update(status='rejected')
        self.message_user(request, f'{count} products rejected.')
    reject_products.short_description = 'Reject selected products'


@admin.register(ProductPrice)
class ProductPriceAdmin(admin.ModelAdmin):
    list_display = ('product', 'store', 'price_entered', 'currency_entered', 'status', 'is_outlier', 'submitted_by', 'created_at')
    list_filter = ('status', 'is_outlier', 'currency_entered', 'store', 'created_at')
    search_fields = ('product__name', 'product__barcode', 'store__name')
    readonly_fields = ('created_at', 'updated_at', 'price_eur')
    ordering = ('-created_at',)
    actions = ['approve_prices', 'reject_prices']

    def approve_prices(self, request, queryset):
        count = queryset.update(status='approved')
        self.message_user(request, f'{count} prices approved.')
    approve_prices.short_description = 'Approve selected prices'

    def reject_prices(self, request, queryset):
        count = queryset.update(status='rejected')
        self.message_user(request, f'{count} prices rejected.')
    reject_prices.short_description = 'Reject selected prices'


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'product__name')
    ordering = ('-created_at',)


@admin.register(ScanHistory)
class ScanHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'barcode', 'scan_type', 'scanned_at')
    list_filter = ('scan_type', 'scanned_at')
    search_fields = ('user__email', 'product__name', 'barcode')
    readonly_fields = ('scanned_at',)
    ordering = ('-scanned_at',)


@admin.register(PriceVerification)
class PriceVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'price', 'verified_at')
    list_filter = ('verified_at',)
    search_fields = ('user__email', 'price__product__name')
    readonly_fields = ('verified_at',)
    ordering = ('-verified_at',)


@admin.register(PriceReport)
class PriceReportAdmin(admin.ModelAdmin):
    list_display = ('reported_by', 'price', 'reason', 'reported_at')
    list_filter = ('reason', 'reported_at')
    search_fields = ('reported_by__email', 'price__product__name', 'comment')
    readonly_fields = ('reported_at',)
    ordering = ('-reported_at',)
    actions = ['mark_as_reviewed']

    def mark_as_reviewed(self, request, queryset):
        # You could add a 'reviewed' field if needed
        count = queryset.count()
        self.message_user(request, f'{count} reports marked as reviewed.')
    mark_as_reviewed.short_description = 'Mark selected reports as reviewed'
