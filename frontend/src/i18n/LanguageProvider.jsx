import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./LanguageContext";
import en from "./en";
import km from "./km";

const DICTIONARIES = { en, km };
const STORAGE_KEY = "language";

// Many browsers have no Khmer month names built in, so format Khmer dates ourselves
const KHMER_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
];

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "km" ? "km" : "en";
  } catch {
    return "en";
  }
}

function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readSavedLanguage);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode etc. – the choice just won't be remembered
    }
  }, []);

  // Lets CSS pick the Khmer font and spacing via :lang(km)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // t("key") or t("key", { name: "Dara" }) – falls back to English, then the key
  const t = useCallback(
    (key, vars) => {
      let text = DICTIONARIES[lang][key] ?? en[key] ?? key;

      if (vars) {
        Object.entries(vars).forEach(([name, value]) => {
          text = text.split(`{${name}}`).join(value);
        });
      }

      return text;
    },
    [lang]
  );

  // Dates like "26 October 2026" / "26 តុលា 2026"
  const formatDate = useCallback(
    (value, options = { day: "numeric", month: "long", year: "numeric" }) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";

      if (lang === "km") {
        return `${date.getDate()} ${KHMER_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      }

      return date.toLocaleDateString("en-GB", options);
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, formatDate }),
    [lang, setLang, t, formatDate]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;
