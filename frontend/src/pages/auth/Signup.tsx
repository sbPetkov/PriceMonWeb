import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFieldErrors } from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import type { RegisterRequest } from '../../types';

const Signup: React.FC = () => {
  const { register, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    preferred_currency: 'BGN',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear auth error
    if (authError) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password_confirm) {
      errors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await register(formData);
      // Show success message instead of navigating
      setRegistrationSuccess(true);
      setRegisteredEmail(response.email);
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-500 to-secondary-700 p-12 items-center justify-center">
        <div className="max-w-md text-white">
          <h1 className="text-5xl font-bold mb-6">Join PriceMon</h1>
          <p className="text-xl mb-8 text-secondary-50">
            Start tracking prices and saving money today. It's free!
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <p className="text-secondary-50">No credit card required</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <p className="text-secondary-50">Community-driven pricing</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <p className="text-secondary-50">Earn rewards for contributions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">PriceMon</h1>
            <p className="text-text-secondary">Create your free account</p>
          </div>

          {/* Signup Card */}
          <div className="card animate-fadeIn">
            {registrationSuccess ? (
              /* Success Message */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-text-primary mb-3">
                  Check Your Email! 📧
                </h2>

                <p className="text-text-secondary mb-6">
                  We've sent a verification link to:
                </p>

                <p className="font-medium text-primary mb-6">
                  {registeredEmail}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-blue-900 font-medium mb-2">
                    📌 Next Steps:
                  </p>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>Return here to log in</li>
                  </ol>
                </div>

                <Link to="/login">
                  <Button variant="primary" size="lg" fullWidth>
                    Go to Login
                  </Button>
                </Link>

                <p className="mt-4 text-sm text-text-secondary">
                  Didn't receive the email?{' '}
                  <button className="text-primary hover:underline font-medium">
                    Resend verification email
                  </button>
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                    Create Account
                  </h2>
                  <p className="text-text-secondary">
                    Join thousands of smart shoppers
                  </p>
                </div>

                {/* Error message */}
                {authError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-800">{authError}</p>
                  </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                error={fieldErrors.email}
                required
                autoComplete="email"
                autoFocus
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  label="First Name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={fieldErrors.first_name}
                  autoComplete="given-name"
                />

                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  label="Last Name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={fieldErrors.last_name}
                  autoComplete="family-name"
                />
              </div>

              <div className="w-full">
                <label
                  htmlFor="preferred_currency"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Preferred Currency
                </label>
                <select
                  id="preferred_currency"
                  name="preferred_currency"
                  value={formData.preferred_currency}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="BGN">BGN (Bulgarian Lev)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                error={fieldErrors.password}
                required
                autoComplete="new-password"
                helperText="Use at least 8 characters"
              />

              <Input
                id="password_confirm"
                name="password_confirm"
                type="password"
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={formData.password_confirm}
                onChange={handleChange}
                error={fieldErrors.password_confirm}
                required
                autoComplete="new-password"
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </div>
            </form>

                {/* Divider */}
                <div className="mt-6 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-surface text-text-secondary">
                        Already have an account?
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sign in link */}
                <Link to="/login">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    fullWidth
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary hover:text-primary-600 transition-colors">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:text-primary-600 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
