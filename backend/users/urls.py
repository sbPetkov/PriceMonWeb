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
    request_password_reset,
    reset_password,
    verify_password_reset_link,
    contact_support,
    contact_public,
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

    # Password reset
    path('forgot-password/', request_password_reset, name='forgot_password'),
    path('reset-password/<str:uid>/<str:token>/', reset_password, name='reset_password'),
    path('verify-reset-link/<str:uid>/<str:token>/', verify_password_reset_link, name='verify_reset_link'),

    # User profile
    path('me/', UserProfileView.as_view(), name='profile'),
    path('change-password/', PasswordChangeView.as_view(), name='change_password'),

    # Utilities
    path('check-email/', check_email_exists, name='check_email'),

    # Contact
    path('contact/', contact_support, name='contact_support'),
    path('contact-public/', contact_public, name='contact_public'),
]
