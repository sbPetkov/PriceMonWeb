from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    PasswordChangeView,
    LogoutView,
    check_email_exists,
    verify_email,
    resend_verification_email,
)

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Email verification
    path('verify-email/<str:uid>/<str:token>/', verify_email, name='verify_email'),
    path('resend-verification/', resend_verification_email, name='resend_verification'),

    # User profile
    path('me/', UserProfileView.as_view(), name='profile'),
    path('change-password/', PasswordChangeView.as_view(), name='change_password'),

    # Utilities
    path('check-email/', check_email_exists, name='check_email'),
]
