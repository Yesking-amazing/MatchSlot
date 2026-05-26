import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './de.json';
import en from './en.json';
import fr from './fr.json';
import it from './it.json';

const LANGUAGE_KEY = 'match_slot_language';

const resources = {
    en: { translation: en },
    de: { translation: de },
    fr: { translation: fr },
    it: { translation: it },
};

const SUPPORTED_LANGS = ['en', 'de', 'fr', 'it'];

function getSystemLanguage(): string {
    // expo-localization returns locale like 'en-US', 'de-DE', 'fr-FR', etc.
    const locale = Localization.getLocales?.()?.[0]?.languageCode ?? 'en';
    return SUPPORTED_LANGS.includes(locale) ? locale : 'en';
}

// Initialize i18n
i18n.use(initReactI18next).init({
    resources,
    lng: getSystemLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false, // React already escapes
    },
    compatibilityJSON: 'v4',
});

// Load saved language preference (async — overrides system language if user set one)
AsyncStorage.getItem(LANGUAGE_KEY).then((savedLang) => {
    if (savedLang && SUPPORTED_LANGS.includes(savedLang)) {
        i18n.changeLanguage(savedLang);
    }
});

/**
 * Change the app language and persist the choice
 * Pass null to reset to system language
 */
export async function setAppLanguage(lang: string | null): Promise<void> {
    if (lang === null) {
        await AsyncStorage.removeItem(LANGUAGE_KEY);
        i18n.changeLanguage(getSystemLanguage());
    } else if (SUPPORTED_LANGS.includes(lang)) {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
        i18n.changeLanguage(lang);
    }
}

/**
 * Get the currently saved language preference (null = system default)
 */
export async function getSavedLanguage(): Promise<string | null> {
    return AsyncStorage.getItem(LANGUAGE_KEY);
}

export default i18n;
