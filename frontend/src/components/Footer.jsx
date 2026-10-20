import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";

function Footer() {
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
            Elegant rooms, warm hospitality and thoughtful service —
            everything you need for an unforgettable stay.
          </p>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">
            Explore
          </h4>
          <ul className="space-y-3">
            <li><Link to="/" className="hover:text-gold-400">Home</Link></li>
            <li><Link to="/rooms" className="hover:text-gold-400">Rooms & Suites</Link></li>
            <li><Link to="/my-bookings" className="hover:text-gold-400">My Bookings</Link></li>
            <li><Link to="/login" className="hover:text-gold-400">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">
            Contact
          </h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-gold-500" />
              Phnom Penh, Cambodia
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="shrink-0 text-gold-500" />
              +855 12 345 678
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="shrink-0 text-gold-500" />
              info@grandhotel.com
            </li>
          </ul>
        </div>

      </div>

      <div className="border-t border-white/10">
        <p className="max-w-7xl mx-auto px-6 py-6 text-sm">
          © {new Date().getFullYear()} Grand Hotel. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
