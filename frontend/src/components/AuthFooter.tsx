import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LegalModal from './common/LegalModal';

const AuthFooter = () => {
  const { t } = useTranslation('common');
  const { t: tAuth } = useTranslation('auth');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Links */}
            <div className="flex justify-center items-center gap-4 text-sm">
              <Link
                to="/contact"
                className="text-gray-600 hover:text-primary font-medium transition-colors"
              >
                {t('nav.contactUs')}
              </Link>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-gray-600 hover:text-primary font-medium transition-colors"
              >
                {tAuth('login.termsLink')}
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-gray-600 hover:text-primary font-medium transition-colors"
              >
                {tAuth('login.privacyLink')}
              </button>
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-500 text-center">
              © {new Date().getFullYear()} PriceMon. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

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
    </>
  );
};

export default AuthFooter;
