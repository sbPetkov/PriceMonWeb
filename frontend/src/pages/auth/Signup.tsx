import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getFieldErrors } from '../../services/api';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import AuthFooter from '../../components/AuthFooter';
import PublicNavbar from '../../components/PublicNavbar';
import LegalModal from '../../components/common/LegalModal';
import type { RegisterRequest } from '../../types';

const Signup: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { register, setUser, error: authError, clearError } = useAuth();

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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
      errors.email = t('messages.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('messages.invalidEmail');
    }

    if (!formData.password) {
      errors.password = t('messages.passwordRequired');
    } else if (formData.password.length < 8) {
      errors.password = t('messages.weakPassword');
    }

    if (!formData.password_confirm) {
      errors.password_confirm = t('messages.passwordConfirmRequired');
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = t('messages.passwordMismatch');
    }

    // Check if terms are accepted
    if (!acceptedTerms) {
      errors.terms = t('legal.acceptTerms');
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

  // Handle Google signup response
  const handleGoogleSignup = async (response: any) => {
    try {
      setIsLoading(true);
      clearError();

      // Send the Google token to our backend
      const { data } = await api.post('/auth/google/', {
        token: response.credential
      });

      // Store tokens
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      // Set user in context
      setUser(data.user);

      // Redirect to home
      navigate('/');
    } catch (err: any) {
      console.error('Google signup failed:', err);
      const message = err.response?.data?.error || 'Google signup failed. Please try again.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Sign-In
  useEffect(() => {
    if (registrationSuccess) return; // Don't initialize if registration was successful

    // Load the Google Identity Services library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize Google Sign-In
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '703616712607-mj9p47i65t9gsol47un2nm4srue1p301.apps.googleusercontent.com',
          callback: handleGoogleSignup,
        });

        // Render the button
        const buttonDiv = document.getElementById('google-signup-button');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(
            buttonDiv,
            {
              theme: 'outline',
              size: 'large',
              width: buttonDiv.offsetWidth || 350,
              text: 'signup_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              locale: 'en' // Force English text
            }
          );
        }
      }
    };

    return () => {
      // Cleanup - only remove if script exists
      const scripts = document.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]');
      scripts.forEach(s => s.remove());
    };
  }, [registrationSuccess]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Public Navigation */}
      <PublicNavbar />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-500 to-secondary-700 p-12 items-center justify-center">
        <div className="max-w-md text-white">
          <h1 className="text-5xl font-bold mb-6">{t('signup.welcome')}</h1>
          <p className="text-xl mb-8 text-secondary-50">
            {t('signup.branding.tagline')}
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <p className="text-secondary-50">{t('signup.branding.feature1')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <p className="text-secondary-50">{t('signup.branding.feature2')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <p className="text-secondary-50">{t('signup.branding.feature3')}</p>
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
            <p className="text-text-secondary">{t('signup.createFreeAccount')}</p>
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
                  {t('signup.success.title')}
                </h2>

                <p className="text-text-secondary mb-6">
                  {t('signup.success.sentTo')}
                </p>

                <p className="font-medium text-primary mb-6">
                  {registeredEmail}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-blue-900 font-medium mb-2">
                    {t('signup.success.nextSteps')}
                  </p>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>{t('signup.success.step1')}</li>
                    <li>{t('signup.success.step2')}</li>
                    <li>{t('signup.success.step3')}</li>
                  </ol>
                </div>

                <Link to="/login">
                  <Button variant="primary" size="lg" fullWidth>
                    {t('signup.success.goToLogin')}
                  </Button>
                </Link>

                <p className="mt-4 text-sm text-text-secondary">
                  {t('signup.success.didntReceive')}{' '}
                  <button className="text-primary hover:underline font-medium">
                    {t('signup.success.resendEmail')}
                  </button>
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                    {t('signup.createAccountTitle')}
                  </h2>
                  <p className="text-text-secondary">
                    {t('signup.joinSmartShoppers')}
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
                label={t('signup.email')}
                placeholder={t('signup.emailPlaceholder')}
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
                  label={t('signup.firstName')}
                  placeholder={t('signup.firstNamePlaceholder')}
                  value={formData.first_name}
                  onChange={handleChange}
                  error={fieldErrors.first_name}
                  autoComplete="given-name"
                />

                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  label={t('signup.lastName')}
                  placeholder={t('signup.lastNamePlaceholder')}
                  value={formData.last_name}
                  onChange={handleChange}
                  error={fieldErrors.last_name}
                  autoComplete="family-name"
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('signup.preferredCurrency')}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, preferred_currency: 'BGN' }))}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      formData.preferred_currency === 'BGN'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    BGN (Bulgarian Lev)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, preferred_currency: 'EUR' }))}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      formData.preferred_currency === 'EUR'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    EUR (Euro)
                  </button>
                </div>
              </div>

              <Input
                id="password"
                name="password"
                type="password"
                label={t('signup.password')}
                placeholder={t('signup.passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange}
                error={fieldErrors.password}
                required
                autoComplete="new-password"
                helperText={t('signup.passwordHelper')}
              />

              <Input
                id="password_confirm"
                name="password_confirm"
                type="password"
                label={t('signup.confirmPassword')}
                placeholder={t('signup.confirmPasswordPlaceholder')}
                value={formData.password_confirm}
                onChange={handleChange}
                error={fieldErrors.password_confirm}
                required
                autoComplete="new-password"
              />

              {/* Terms and Privacy acceptance */}
              <div className="space-y-2">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (fieldErrors.terms) {
                        setFieldErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.terms;
                          return newErrors;
                        });
                      }
                    }}
                    className="w-4 h-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="ml-3 text-sm text-text-secondary">
                    {t('legal.iAgree')}{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="text-primary hover:text-primary-600 hover:underline font-medium transition-colors"
                    >
                      {t('signup.termsLink')}
                    </button>
                    {' '}{t('signup.and')}{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacyModal(true);
                      }}
                      className="text-primary hover:text-primary-600 hover:underline font-medium transition-colors"
                    >
                      {t('signup.privacyLink')}
                    </button>
                  </span>
                </label>
                {fieldErrors.terms && (
                  <p className="text-sm text-red-600 ml-7">{fieldErrors.terms}</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  {t('signup.submit')}
                </Button>
              </div>
            </form>

                {/* Divider OR */}
                <div className="mt-6 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-surface text-text-secondary">OR</span>
                    </div>
                  </div>
                </div>

                {/* Google Signup Button with custom styling wrapper */}
                <div className="google-button-wrapper">
                  <div id="google-signup-button" className="flex justify-center"></div>
                </div>

                {/* Divider */}
                <div className="mt-6 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-surface text-text-secondary">
                        {t('signup.hasAccount')}
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
                    {t('signup.signIn')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            {t('signup.termsText')}{' '}
            <a href="#" className="text-primary hover:text-primary-600 transition-colors">
              {t('signup.termsLink')}
            </a>{' '}
            {t('signup.and')}{' '}
            <a href="#" className="text-primary hover:text-primary-600 transition-colors">
              {t('signup.privacyLink')}
            </a>
          </p>

          {/* Public Pages Footer */}
          <AuthFooter />
          </div>
        </div>
      </div>

      {/* Legal Modals */}
      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        type="terms"
      />
      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        type="privacy"
      />
    </div>
  );
};

export default Signup;
