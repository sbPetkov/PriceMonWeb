import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicNavbar from '../../components/PublicNavbar';

const HowItWorks = () => {
  const { t } = useTranslation('howItWorks');

  const steps = [
    {
      number: 1,
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
      image: 'step1-signup.jpg',
      color: 'from-blue-500 to-blue-600',
    },
    {
      number: 2,
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
      image: 'step2-search.jpg',
      color: 'from-green-500 to-green-600',
    },
    {
      number: 3,
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
      image: 'step3-scan.jpg',
      color: 'from-purple-500 to-purple-600',
    },
    {
      number: 4,
      title: t('steps.step4.title'),
      description: t('steps.step4.description'),
      image: 'step4-details.jpg',
      color: 'from-orange-500 to-orange-600',
    },
    {
      number: 5,
      title: t('steps.step5.title'),
      description: t('steps.step5.description'),
      image: 'step5-list.jpg',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Navigation */}
      <PublicNavbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-600 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-4">{t('header.title')}</h1>
          <p className="text-white/90 text-lg">
            {t('header.subtitle')}
          </p>
        </div>
      </div>

      {/* Tutorial Steps */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                index % 2 === 0 ? '' : ''
              }`}
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Image Section */}
                <div
                  className={`${
                    index % 2 === 0 ? 'md:order-1' : 'md:order-2'
                  } relative`}
                >
                  <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden rounded-l-2xl">
                    <img
                      src={`/images/tutorial/${step.image}`}
                      alt={step.title}
                      className="w-auto h-auto max-w-full max-h-full object-contain p-4"
                    />
                    <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div
                  className={`${
                    index % 2 === 0 ? 'md:order-2' : 'md:order-1'
                  } p-8 sm:p-12 flex flex-col justify-center`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${step.color} rounded-lg mb-4`}
                  >
                    <span className="text-xl font-bold text-white">
                      {step.number}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 sm:p-12 border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('tips.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                {t('tips.tip1.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('tips.tip1.description')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                {t('tips.tip2.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('tips.tip2.description')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                {t('tips.tip3.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('tips.tip3.description')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-primary to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
            >
              {t('cta.createAccount')}
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 bg-white border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary-50 transition-all text-lg"
            >
              {t('cta.learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
