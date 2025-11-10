"""
Utility functions for user management
"""
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from .models import User


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """
    Token generator for email verification.
    Similar to password reset tokens but used for email verification.
    """
    def _make_hash_value(self, user, timestamp):
        # Include email_verified status to invalidate token after verification
        return (
            str(user.pk) + str(timestamp) + str(user.email_verified)
        )


# Create a token generator instance
email_verification_token = EmailVerificationTokenGenerator()


def generate_verification_token(user):
    """
    Generate a verification token for a user.

    Args:
        user: User instance

    Returns:
        tuple: (uid, token) where uid is the base64 encoded user id
    """
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    return uid, token


def verify_token(uid, token):
    """
    Verify a token and return the user if valid.

    Args:
        uid: Base64 encoded user id
        token: Verification token

    Returns:
        User instance if valid, None otherwise
    """
    try:
        # Decode the user id
        user_id = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=user_id)

        # Check if token is valid
        if email_verification_token.check_token(user, token):
            return user
        return None
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None


def send_verification_email(user, request=None):
    """
    Send an email verification email to the user.

    Args:
        user: User instance
        request: Optional request object to get the domain

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Generate verification token
    uid, token = generate_verification_token(user)

    # Build verification URL
    frontend_url = settings.FRONTEND_URL
    verification_url = f"{frontend_url}/verify-email/{uid}/{token}"

    # Prepare email context
    context = {
        'user': user,
        'verification_url': verification_url,
        'site_name': 'PriceMon',
    }

    # Render HTML email
    html_content = render_to_string('emails/verify_email.html', context)

    # Create email
    subject = 'Verify your PriceMon account'
    from_email = settings.DEFAULT_FROM_EMAIL
    to_email = user.email

    # Create message with both plain text and HTML
    email = EmailMultiAlternatives(
        subject=subject,
        body=f"Please verify your email by clicking this link: {verification_url}",
        from_email=from_email,
        to=[to_email]
    )
    email.attach_alternative(html_content, "text/html")

    try:
        email.send()
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False
