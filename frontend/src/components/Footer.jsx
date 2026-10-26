import { Link } from "react-router-dom";
import { Phone, Mail } from "lucide-react";
import { useLanguage } from "../i18n/useLanguage";

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-ink text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-4">

        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold-500 font-display text-lg font-bold text-gold-500">
              G
            </span>
            <span className="font-display text-2xl font-semibold text-white">
              Grand Hotel
            </span>
          </div>

          <p className="max-w-sm leading-relaxed">
            {t("footer.about")}
          </p>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">
            {t("footer.explore")}
          </h4>
          <ul className="space-y-3">
            <li><Link to="/" className="hover:text-gold-400">{t("nav.home")}</Link></li>
            <li><Link to="/rooms" className="hover:text-gold-400">{t("footer.roomsSuites")}</Link></li>
            <li><Link to="/my-bookings" className="hover:text-gold-400">{t("nav.myBookings")}</Link></li>
            <li><Link to="/login" className="hover:text-gold-400">{t("nav.login")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">
            {t("footer.contact")}
          </h4>
          <ul className="space-y-3">
            <li>
              <a href="tel:+85510679527" className="flex items-center gap-3 hover:text-gold-400">
                <Phone size={18} className="shrink-0 text-gold-500" />
                010 679 527
              </a>
            </li>
            <li>
              <a href="mailto:cpanha683@gmail.com" className="flex items-center gap-3 break-all hover:text-gold-400">
                <Mail size={18} className="shrink-0 text-gold-500" />
                cpanha683@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="shrink-0 text-gold-500" aria-hidden="true">
                <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
              </svg>
              Bunthoeun Chanpanha
            </li>
          </ul>
        </div>

      </div>

      <div className="border-t border-white/10">
        <p className="max-w-7xl mx-auto px-6 py-6 text-sm">
          © {new Date().getFullYear()} Grand Hotel. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
