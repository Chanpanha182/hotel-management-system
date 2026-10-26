import { Link } from "react-router-dom";
import LanguageSwitch from "./LanguageSwitch";
import { useLanguage } from "../i18n/useLanguage";

function AuthLayout({ title, subtitle, image, children }) {
  const { t } = useLanguage();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* Image side */}
      <div
        className="relative hidden bg-cover bg-center lg:block"
        style={{ backgroundImage: `url('${image}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/20"></div>

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold-400 font-display text-lg font-bold text-gold-400">
              G
            </span>
            <span className="font-display text-2xl font-semibold">Grand Hotel</span>
          </Link>

          <div>
            <p className="font-display text-4xl font-semibold leading-tight">
              {t("auth.quote1")}
              <br />
              {t("auth.quote2")}
            </p>
            <p className="mt-4 text-gray-300">Grand Hotel</p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center bg-cream px-6 py-12">
        <LanguageSwitch className="absolute right-6 top-6" />

        <div className="w-full max-w-md">

          <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold-500 font-display text-lg font-bold text-gold-500">
              G
            </span>
            <span className="font-display text-2xl font-semibold text-ink">Grand Hotel</span>
          </Link>

          <h1 className="text-4xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 mb-8 text-gray-500">{subtitle}</p>

          {children}
        </div>
      </div>

    </div>
  );
}

export default AuthLayout;
