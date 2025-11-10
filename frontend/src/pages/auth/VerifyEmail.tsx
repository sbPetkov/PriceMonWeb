import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const VerifyEmail: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!uid || !token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${uid}/${token}/`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        setEmail(response.data.email || '');
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err.response?.data?.error ||
          'Failed to verify email. The link may be invalid or expired.'
        );
      }
    };

    verifyEmail();
  }, [uid, token]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            {status === 'verifying' && (
              <svg
                className="w-10 h-10 text-white animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {status === 'success' && (
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {status === 'error' && (
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Verifying Your Email...
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
              <div className="mt-6">
                <LoadingSpinner />
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Email Verified! 🎉
              </h1>
              <p className="text-gray-600 mb-2">{message}</p>
              {email && (
                <p className="text-sm text-gray-500 mb-6">
                  Account: <span className="font-medium text-gray-700">{email}</span>
                </p>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  ✓ Your account is now active! You can log in and start using PriceMon.
                </p>
              </div>

              <button
                onClick={handleGoToLogin}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-3">
                  This verification link may have expired or already been used.
                </p>
                <p className="text-sm text-red-700">
                  Please request a new verification email from the login page.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-center"
                >
                  Go to Login
                </Link>
                <Link
                  to="/signup"
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center"
                >
                  Create New Account
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
