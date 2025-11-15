import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AuthFooter = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-white border-t border-gray-200 mt-12 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Contact Link */}
          <div className="flex justify-center text-sm">
            <Link
              to="/contact"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              {t('nav.contactUs')}
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} PriceMon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
