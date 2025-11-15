import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import PublicNavbar from '../../components/PublicNavbar';

const ContactUs = () => {
  const { t } = useTranslation('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // For now, we'll use the same backend endpoint but make it accept public requests
      const apiUrl = import.meta.env.VITE_API_URL ||
                     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                       ? 'http://localhost:8000/api'
                       : `http://${window.location.hostname}:8000/api`);

      await axios.post(`${apiUrl}/auth/contact-public/`, {
        name,
        email,
        subject,
        message,
      });

      setSubmitStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');

      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setSubmitStatus('error');
      const errorMsg =
        error.response?.data?.error || error.message || t('errors.defaultError');
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Navigation */}
      <PublicNavbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-4">{t('header.title')}</h1>
          <p className="text-white/90 text-lg">
            {t('header.subtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-1">{t('success.title')}</h3>
                <p className="text-green-800">
                  {t('success.message')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('form.title')}</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.nameLabel')} <span className="text-red-500">{t('form.required')}</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={t('form.namePlaceholder')}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.emailLabel')} <span className="text-red-500">{t('form.required')}</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={100}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={t('form.emailPlaceholder')}
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.subjectLabel')} <span className="text-red-500">{t('form.required')}</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={200}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={t('form.subjectPlaceholder')}
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.messageLabel')} <span className="text-red-500">{t('form.required')}</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={6}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={t('form.messagePlaceholder')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('form.characterCount', { count: message.length })}
                </p>
              </div>

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !email.trim() || !subject.trim() || message.length < 10}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('form.sending')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t('form.sendButton')}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('info.title')}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{t('info.email')}</h3>
                    <a href="mailto:svilen.petkov@price-mon.com" className="text-primary hover:text-primary-600 transition-colors">
                      svilen.petkov@price-mon.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{t('info.responseTime')}</h3>
                    <p className="text-gray-600">{t('info.responseTimeValue')}</p>
                  </div>
                </div>

                {/* Social Media Placeholder */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3">{t('info.followUs')}</h3>
                  <div className="flex gap-3">
                    {/* Placeholders for social links - to be added later */}
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center opacity-50">
                      <span className="text-xs">FB</span>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center opacity-50">
                      <span className="text-xs">X</span>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center opacity-50">
                      <span className="text-xs">IN</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{t('info.socialComingSoon')}</p>
                </div>
              </div>
            </div>

            {/* FAQ Quick Links */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('quickLinks.title')}</h3>
              <div className="space-y-3">
                <Link
                  to="/about"
                  className="flex items-center gap-2 text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('quickLinks.about')}
                </Link>
                <Link
                  to="/how-it-works"
                  className="flex items-center gap-2 text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {t('quickLinks.howItWorks')}
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {t('quickLinks.createAccount')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 sm:p-12 border-2 border-purple-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t('support.title')}
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('support.description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <a
              href="https://www.buymeacoffee.com/s.petkov"
              target="_blank"
              rel="noopener noreferrer"
              className="transform hover:scale-105 transition-transform duration-200"
            >
              <img
                src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=s.petkov&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
                alt={t('support.buyMeCoffee')}
                className="h-12"
              />
            </a>

            <a
              href="https://revolut.me/svileng3la"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              {t('support.revolut')}
            </a>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('support.thanks')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
