import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicNavbar from '../../components/PublicNavbar';

const About = () => {
  const { t } = useTranslation('about');

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
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 space-y-8">
          {/* Mission Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('mission.title')}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              {t('mission.description')}
            </p>
          </div>

          {/* Features Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('findingDeals.title')}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              {t('findingDeals.description')}
            </p>
          </div>

          {/* Inflation Tracking Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('inflation.title')}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              {t('inflation.description')}
            </p>
          </div>

          {/* Community Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('community.title')}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              {t('community.description')}
            </p>
          </div>

          {/* CTA Section */}
          <div className="pt-8 border-t border-gray-200 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {t('cta.title')}
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/try-scanner"
                className="px-8 py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Try Scanner Demo
              </Link>
              <Link
                to="/register"
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                {t('cta.signUp')}
              </Link>
              <Link
                to="/how-it-works"
                className="px-8 py-3 bg-white border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition-all"
              >
                {t('cta.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
