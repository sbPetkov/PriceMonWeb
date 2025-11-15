import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
}

const LanguageSwitcher = ({ variant = 'default' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'bg', name: 'Български', flag: '🇧🇬' },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    if (isChanging || languageCode === i18n.language) return;

    setIsChanging(true);

    try {
      // Change language in i18next (persisted in localStorage automatically)
      await i18n.changeLanguage(languageCode);

      // If user is logged in, sync with backend
      if (user) {
        try {
          await api.patch('/auth/me/', {
            preferred_language: languageCode,
          });
        } catch (err) {
          console.error('Failed to sync language preference with backend:', err);
          // Don't revert the language change even if backend sync fails
        }
      }
    } catch (err) {
      console.error('Failed to change language:', err);
    } finally {
      setIsChanging(false);
    }
  };

  if (variant === 'compact') {
    return (
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isChanging}
        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Language / Език
      </label>
      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => {
          const isActive = lang.code === i18n.language;
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isChanging}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary/50 hover:bg-primary/5'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          );
        })}
      </div>
      {isChanging && (
        <p className="text-xs text-gray-500 text-center">
          Changing language...
        </p>
      )}
    </div>
  );
};

export default LanguageSwitcher;
