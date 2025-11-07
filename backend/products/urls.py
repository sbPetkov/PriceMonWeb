from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, StoreViewSet, ProductViewSet, ProductPriceViewSet,
    ScanHistoryViewSet, PriceVerificationViewSet, PriceReportViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'stores', StoreViewSet, basename='store')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'prices', ProductPriceViewSet, basename='productprice')
router.register(r'scan-history', ScanHistoryViewSet, basename='scanhistory')
router.register(r'verifications', PriceVerificationViewSet, basename='verification')
router.register(r'reports', PriceReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
