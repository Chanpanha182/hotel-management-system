import { useLanguage } from "../i18n/useLanguage";

// dark: for use on top of photos / dark backgrounds
function LanguageSwitch({ dark = false, className = "" }) {
  const { lang, setLang } = useLanguage();

  const option = (code, label) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      aria-pressed={lang === code}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
        lang === code
          ? "bg-gold-600 text-white"
          : dark
          ? "text-white/80 hover:text-white"
          : "text-gray-600 hover:text-gold-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full p-0.5 ring-1 ${
        dark ? "ring-white/40" : "ring-gray-200"
      } ${className}`}
      role="group"
      aria-label="Language"
    >
      {option("en", "EN")}
      {option("km", "ខ្មែរ")}
    </div>
  );
}

export default LanguageSwitch;
