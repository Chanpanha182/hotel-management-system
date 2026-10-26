import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import LanguageSwitch from "./LanguageSwitch";
import { useLanguage } from "../i18n/useLanguage";

// transparent: sits over a hero image until the page is scrolled
function Navbar({ transparent = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  // Check login status
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [scrolled, setScrolled] = useState(() => window.scrollY > 40);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setIsOpen(false);

    navigate("/");
  };

  const solid = !transparent || scrolled || isOpen;

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive
        ? "text-gold-500"
        : solid
        ? "text-gray-700 hover:text-gold-600"
        : "text-white/90 hover:text-white"
    }`;

  const links = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/rooms", label: t("nav.rooms") },
    ...(user ? [{ to: "/my-bookings", label: t("nav.myBookings") }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: t("nav.admin") }] : []),
  ];

  return (
    <nav
      className={`${transparent ? "fixed" : "sticky"} top-0 inset-x-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-white/95 backdrop-blur shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold-500 font-display text-lg font-bold text-gold-500">
              G
            </span>
            <span
              className={`font-display text-2xl font-semibold tracking-wide ${
                solid ? "text-ink" : "text-white"
              }`}
            >
              Grand Hotel
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">

            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}

            {user ? (
              <div className="flex items-center gap-4 pl-6 border-l border-gray-300/40">
                <div
                  className={`flex items-center gap-2 text-sm ${
                    solid ? "text-gray-700" : "text-white"
                  }`}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-100 text-gold-700">
                    <User size={16} />
                  </span>
                  <span className="font-medium">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  title={t("nav.logout")}
                  className={`rounded-full p-2 transition ${
                    solid
                      ? "text-gray-500 hover:bg-gray-100 hover:text-red-600"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <NavLink to="/login" className={linkClass}>
                  {t("nav.login")}
                </NavLink>

                <Link to="/rooms" className="btn-gold px-5 py-2.5 text-sm">
                  {t("nav.bookNow")}
                </Link>
              </div>
            )}

            <LanguageSwitch dark={!solid} />

          </div>

          {/* Mobile Button */}
          <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitch dark={!solid} />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden ${solid ? "text-ink" : "text-white"}`}
            aria-label={t("nav.toggleMenu")}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          </div>

        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-6 pt-2 space-y-1 border-t border-gray-100">

            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-3 font-medium ${
                    isActive ? "bg-gold-50 text-gold-700" : "text-gray-700"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-3 text-gray-700">
                  <User size={18} />
                  <span>{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-3 text-red-600"
                >
                  <LogOut size={18} />
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-3 font-medium text-gray-700"
                >
                  {t("nav.login")}
                </NavLink>

                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="btn-gold w-full mt-2"
                >
                  {t("nav.createAccount")}
                </Link>
              </>
            )}

          </div>
        )}

      </div>
    </nav>
  );
}

export default Navbar;
