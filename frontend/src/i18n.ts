import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enProducts from './locales/en/products.json';
import enShopping from './locales/en/shopping.json';
import enAuth from './locales/en/auth.json';
import enProfile from './locales/en/profile.json';
import enInstall from './locales/en/install.json';
import enAbout from './locales/en/about.json';
import enHowItWorks from './locales/en/howItWorks.json';
import enContact from './locales/en/contact.json';

import bgCommon from './locales/bg/common.json';
import bgNavigation from './locales/bg/navigation.json';
import bgProducts from './locales/bg/products.json';
import bgShopping from './locales/bg/shopping.json';
import bgAuth from './locales/bg/auth.json';
import bgProfile from './locales/bg/profile.json';
import bgInstall from './locales/bg/install.json';
import bgAbout from './locales/bg/about.json';
import bgHowItWorks from './locales/bg/howItWorks.json';
import bgContact from './locales/bg/contact.json';

// Translation resources
const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    products: enProducts,
    shopping: enShopping,
    auth: enAuth,
    profile: enProfile,
    install: enInstall,
    about: enAbout,
    howItWorks: enHowItWorks,
    contact: enContact,
  },
  bg: {
    common: bgCommon,
    navigation: bgNavigation,
    products: bgProducts,
    shopping: bgShopping,
    auth: bgAuth,
    profile: bgProfile,
    install: bgInstall,
    about: bgAbout,
    howItWorks: bgHowItWorks,
    contact: bgContact,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    defaultNS: 'common', // Default namespace
    ns: ['common', 'navigation', 'products', 'shopping', 'auth', 'profile', 'install', 'about', 'howItWorks', 'contact'], // Available namespaces

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Cache user language preference
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false, // Disable suspense for simplicity
    },
  });

export default i18n;
