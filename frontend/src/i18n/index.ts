import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { ar } from "./locales/ar";

export const LANGS = ["en", "fr", "ar"] as const;
export type Lang = (typeof LANGS)[number];

const RTL_LANGS: Lang[] = ["ar"];
const STORAGE_KEY = "fj_lang";

export function applyDirection(lang: string) {
  const dir = RTL_LANGS.includes(lang as Lang) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && LANGS.includes(saved)) return saved;
  const browser = navigator.language.slice(0, 2) as Lang;
  return LANGS.includes(browser) ? browser : "en";
}

const startLang = initialLang();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: startLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

applyDirection(startLang);

export function setLanguage(lang: Lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  void i18n.changeLanguage(lang);
  applyDirection(lang);
}

export function currentLanguage(): Lang {
  return (i18n.language as Lang) ?? "en";
}

export default i18n;
