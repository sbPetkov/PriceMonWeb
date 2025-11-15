import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PublicNavbar = () => {
  const { t, i18n } = useTranslation('common');
  const location = useLocation();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentLanguage = i18n.language;

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);

    // Sync with backend if user is logged in
    if (user) {
      try {
        await api.put('/users/profile', { preferred_language: lang });
      } catch (error) {
        console.error('Failed to sync language with backend:', error);
      }
    }
  };

  const navLinks = [
    { path: '/about', label: t('nav.about') },
    { path: '/how-it-works', label: t('nav.howItWorks') },
    { path: '/install', label: t('nav.installApp') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PriceMon</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="ml-4 flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentLanguage === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('bg')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentLanguage === 'bg'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                BG
              </button>
            </div>

            {/* Auth Buttons */}
            {!user && (
              <div className="ml-4 flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 font-medium hover:text-primary transition-colors"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-primary to-primary-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Language Switcher */}
              <div className="px-4 py-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      currentLanguage === 'en'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => changeLanguage('bg')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      currentLanguage === 'bg'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600'
                    }`}
                  >
                    BG
                  </button>
                </div>
              </div>

              {/* Mobile Auth Buttons */}
              {!user && (
                <div className="px-4 pt-2 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-4 py-2 text-center text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-4 py-2 text-center bg-gradient-to-r from-primary to-primary-600 text-white font-medium rounded-lg shadow-md"
                  >
                    {t('nav.signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;
