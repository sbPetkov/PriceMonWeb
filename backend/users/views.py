from rest_framework import status, generics, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings

from .models import User
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer
)
from .utils import (
    send_verification_email,
    verify_token,
    send_password_reset_email,
    verify_password_reset_token
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer to include user data in response and use email for login"""

    username_field = User.USERNAME_FIELD  # Use email field

    def validate(self, attrs):
        # Django's TokenObtainPairSerializer expects 'username' field
        # but we want to accept 'email' field instead
        data = super().validate(attrs)

        # Check if email is verified
        if not self.user.email_verified:
            raise serializers.ValidationError({
                'email': 'Please verify your email address before logging in. Check your inbox for the verification email.'
            })

        # Add user data to response
        data['user'] = UserSerializer(self.user).data

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view"""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(APIView):
    """
    API endpoint for user registration.
    POST /api/auth/register/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            # Send verification email
            email_sent = send_verification_email(user, request)

            if not email_sent:
                # If email fails, still register user but warn them
                return Response({
                    'message': 'User registered successfully, but we encountered an error sending the verification email. Please contact support.',
                    'email': user.email
                }, status=status.HTTP_201_CREATED)

            return Response({
                'message': 'Registration successful! Please check your email to verify your account.',
                'email': user.email
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    Get or update current user profile.
    GET /api/auth/me/ - Get current user
    PATCH /api/auth/me/ - Update current user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update current user profile"""
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """
    Change user password.
    POST /api/auth/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Logout user by blacklisting refresh token.
    POST /api/auth/logout/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# Optional: Public endpoint to check if email exists (for registration form)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def check_email_exists(request):
    """
    Check if email already exists in database.
    POST /api/auth/check-email/
    """
    email = request.data.get('email')

    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    exists = User.objects.filter(email=email).exists()

    return Response({'exists': exists})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_email(request, uid, token):
    """
    Verify user email with token.
    GET /api/auth/verify-email/<uid>/<token>/
    """
    # Verify the token and get the user
    user = verify_token(uid, token)

    if not user:
        return Response({
            'error': 'Invalid or expired verification link. Please request a new verification email.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if already verified
    if user.email_verified:
        return Response({
            'message': 'Email already verified. You can now log in.',
            'email': user.email
        }, status=status.HTTP_200_OK)

    # Mark email as verified
    user.email_verified = True
    user.save()

    return Response({
        'message': 'Email verified successfully! You can now log in.',
        'email': user.email
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def resend_verification_email(request):
    """
    Resend verification email.
    POST /api/auth/resend-verification/
    """
    email = request.data.get('email')

    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)

        # Check if already verified
        if user.email_verified:
            return Response({
                'message': 'Email is already verified. You can log in now.'
            }, status=status.HTTP_200_OK)

        # Send verification email
        email_sent = send_verification_email(user, request)

        if not email_sent:
            return Response({
                'error': 'Failed to send verification email. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': 'Verification email sent! Please check your inbox.'
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return Response({
            'message': 'If an account with this email exists, a verification email will be sent.'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    """
    Request password reset email.
    POST /api/auth/forgot-password/
    """
    email = request.data.get('email')

    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)

        # Send password reset email
        email_sent = send_password_reset_email(user, request)

        if not email_sent:
            return Response({
                'error': 'Failed to send password reset email. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': 'Password reset email sent! Please check your inbox.'
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        # Still return success to prevent email enumeration
        return Response({
            'message': 'If an account with this email exists, a password reset email will be sent.'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request, uid, token):
    """
    Reset password with token.
    POST /api/auth/reset-password/<uid>/<token>/
    """
    new_password = request.data.get('new_password')
    new_password_confirm = request.data.get('new_password_confirm')

    # Validate input
    if not new_password or not new_password_confirm:
        return Response({
            'error': 'Both password fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    if new_password != new_password_confirm:
        return Response({
            'error': 'Passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({
            'error': 'Password must be at least 8 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify the token and get the user
    user = verify_password_reset_token(uid, token)

    if not user:
        return Response({
            'error': 'Invalid or expired password reset link. Please request a new one.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Set new password
    user.set_password(new_password)
    user.save()

    return Response({
        'message': 'Password reset successfully! You can now log in with your new password.',
        'email': user.email
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_password_reset_link(request, uid, token):
    """
    Verify if password reset link is valid (before showing reset form).
    GET /api/auth/verify-reset-link/<uid>/<token>/
    """
    user = verify_password_reset_token(uid, token)

    if not user:
        return Response({
            'error': 'Invalid or expired password reset link',
            'valid': False
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Link is valid',
        'valid': True,
        'email': user.email
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def contact_support(request):
    """
    Send a contact message to support.
    POST /api/auth/contact/
    """
    subject = request.data.get('subject', '').strip()
    message = request.data.get('message', '').strip()

    # Validate input
    if not subject or not message:
        return Response({
            'error': 'Both subject and message are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(message) < 10:
        return Response({
            'error': 'Message must be at least 10 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(subject) > 200:
        return Response({
            'error': 'Subject must be less than 200 characters'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(message) > 2000:
        return Response({
            'error': 'Message must be less than 2000 characters'
        }, status=status.HTTP_400_BAD_REQUEST)

    user = request.user

    # Compose email
    email_subject = f"[PriceMon Contact] {subject}"
    email_body = f"""
New contact form submission from PriceMon user:

From: {user.first_name} ({user.email})
User ID: {user.id}
Trust Level: {user.trust_level}
Subject: {subject}

Message:
{message}

---
This message was sent via the PriceMon contact form.
Reply directly to this email to respond to the user.
"""

    # Try to send email, but don't fail if email service isn't configured
    email_sent = False
    try:
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['svilen.petkov@price-mon.com'],
            fail_silently=False
        )
        email_sent = True
    except Exception as e:
        # Log the error but don't fail the request
        print(f"[CONTACT] Email send failed: {str(e)}")
        print(f"[CONTACT] Message from {user.email} ({user.first_name}): {subject}")
        print(f"[CONTACT] Content: {message[:100]}...")

    # Always return success - message was received even if email failed
    return Response({
        'message': 'Your message has been sent successfully! We\'ll get back to you soon.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def contact_public(request):
    """
    Send a contact message from public (non-authenticated) users.
    POST /api/auth/contact-public/
    """
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    subject = request.data.get('subject', '').strip()
    message = request.data.get('message', '').strip()

    # Validate input
    if not name or not email or not subject or not message:
        return Response({
            'error': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(message) < 10:
        return Response({
            'error': 'Message must be at least 10 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(subject) > 200:
        return Response({
            'error': 'Subject must be less than 200 characters'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(message) > 2000:
        return Response({
            'error': 'Message must be less than 2000 characters'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(name) > 100:
        return Response({
            'error': 'Name must be less than 100 characters'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Compose email
    email_subject = f"[PriceMon Contact - Public] {subject}"
    email_body = f"""
New contact form submission from public visitor:

From: {name} ({email})
Subject: {subject}

Message:
{message}

---
This message was sent via the public PriceMon contact form.
Reply directly to this email to respond to the visitor.
"""

    # Try to send email, but don't fail if email service isn't configured
    email_sent = False
    try:
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['svilen.petkov@price-mon.com'],
            fail_silently=False,
            reply_to=[email],  # Allow direct reply to visitor
        )
        email_sent = True
    except Exception as e:
        # Log the error but don't fail the request
        print(f"[CONTACT-PUBLIC] Email send failed: {str(e)}")
        print(f"[CONTACT-PUBLIC] Message from {email} ({name}): {subject}")
        print(f"[CONTACT-PUBLIC] Content: {message[:100]}...")

    # Always return success - message was received even if email failed
    return Response({
        'message': 'Your message has been sent successfully! We\'ll get back to you soon.'
    }, status=status.HTTP_200_OK)
