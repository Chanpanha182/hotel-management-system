import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wifi,
  UtensilsCrossed,
  Waves,
  Car,
  Sparkles,
  ConciergeBell,
  CalendarDays,
  Users,
  Search,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoomCard from "../components/RoomCard";
import { useLanguage } from "../i18n/useLanguage";

const today = new Date().toISOString().split("T")[0];

const amenities = [
  { icon: Wifi, key: "wifi" },
  { icon: UtensilsCrossed, key: "restaurant" },
  { icon: Waves, key: "pool" },
  { icon: Sparkles, key: "spa" },
  { icon: Car, key: "transfer" },
  { icon: ConciergeBell, key: "reception" },
];

function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState({
    checkIn: "",
    checkOut: "",
    guests: "1",
  });

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + "/api/rooms")
      .then((response) => response.json())
      .then((data) => setRooms(data.data || []))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams({ guests: search.guests });
    if (search.checkIn) params.set("checkIn", search.checkIn);
    if (search.checkOut) params.set("checkOut", search.checkOut);

    navigate(`/rooms?${params.toString()}`);
  };

  const featuredRooms = rooms
    .filter((room) => room.status !== "maintenance")
    .slice(0, 3);

  return (
    <div className="min-h-screen">

      <Navbar transparent />

      {/* Hero */}
      <section
        className="relative flex min-h-[92vh] items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70"></div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-24 pb-40 text-center text-white">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.4em] text-gold-300">
            {t("home.welcome")}
          </p>

          <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
            {t("home.heroTitle1")}
            <span className="block italic text-gold-300">{t("home.heroTitle2")}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-200 md:text-xl">
            {t("home.heroText")}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/rooms" className="btn-gold px-8 py-4">
              {t("home.exploreRooms")}
            </Link>
            <a
              href="#amenities"
              className="inline-flex items-center rounded-full border border-white/60 px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-ink"
            >
              {t("home.ourAmenities")}
            </a>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="relative z-20 -mt-24 px-6">
        <form
          onSubmit={handleSearch}
          className="mx-auto grid max-w-5xl gap-4 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5 md:grid-cols-[1fr_1fr_1fr_auto] md:p-8"
        >
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <CalendarDays size={14} className="text-gold-600" />
              {t("common.checkIn")}
            </span>
            <input
              type="date"
              min={today}
              value={search.checkIn}
              onChange={(e) => setSearch({ ...search, checkIn: e.target.value })}
              className="field"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <CalendarDays size={14} className="text-gold-600" />
              {t("common.checkOut")}
            </span>
            <input
              type="date"
              min={search.checkIn || today}
              value={search.checkOut}
              onChange={(e) => setSearch({ ...search, checkOut: e.target.value })}
              className="field"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <Users size={14} className="text-gold-600" />
              {t("common.guests")}
            </span>
            <select
              value={search.guests}
              onChange={(e) => setSearch({ ...search, guests: e.target.value })}
              className="field"
            >
              <option value="1">{t("home.guestOption1")}</option>
              <option value="2">{t("home.guestOptionN", { count: 2 })}</option>
              <option value="3">{t("home.guestOptionN", { count: 3 })}</option>
              <option value="4">{t("home.guestOption4")}</option>
            </select>
          </label>

          <div className="flex items-end">
            <button type="submit" className="btn-dark w-full py-3.5 md:w-auto md:px-8">
              <Search size={18} />
              {t("home.search")}
            </button>
          </div>
        </form>
      </section>

      {/* About */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 md:grid-cols-2">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
              alt="Hotel lobby"
              className="h-[460px] w-full rounded-3xl object-cover shadow-xl"
            />
            <div className="absolute -bottom-8 -right-4 hidden rounded-3xl bg-ink p-6 text-white shadow-xl md:block">
              <ConciergeBell size={26} className="text-gold-400" />
              <p className="mt-3 font-display text-2xl font-semibold">{t("home.bookDirect")}</p>
              <p className="text-sm text-gray-400">{t("home.instantConfirmation")}</p>
            </div>
          </div>

          <div>
            <p className="eyebrow">{t("home.aboutEyebrow")}</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-ink md:text-5xl">
              {t("home.aboutTitle")}
            </h2>
            <p className="mt-6 leading-relaxed text-gray-600">
              {t("home.aboutText")}
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-gray-200 pt-8">
              <div>
                <p className="font-display text-4xl font-semibold text-gold-600">{rooms.length || "—"}</p>
                <p className="mt-1 text-sm text-gray-500">{t("home.statRooms")}</p>
              </div>
              <div>
                <p className="font-display text-4xl font-semibold text-gold-600">24/7</p>
                <p className="mt-1 text-sm text-gray-500">{t("home.statService")}</p>
              </div>
              <div>
                <p className="font-display text-4xl font-semibold text-gold-600">100%</p>
                <p className="mt-1 text-sm text-gray-500">{t("home.statSecure")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">{t("home.featuredEyebrow")}</p>
              <h2 className="mt-4 text-4xl font-semibold text-ink md:text-5xl">
                {t("home.featuredTitle")}
              </h2>
            </div>
            <Link to="/rooms" className="btn-dark">
              {t("home.viewAllRooms")}
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-8 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[440px] animate-pulse rounded-3xl bg-gray-100"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow">{t("home.facilitiesEyebrow")}</p>
            <h2 className="mt-4 text-4xl font-semibold text-ink md:text-5xl">
              {t("home.facilitiesTitle")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="rounded-3xl bg-white p-8 ring-1 ring-black/5 transition hover:shadow-lg"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-50 text-gold-600">
                  <Icon size={26} />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-ink">{t(`home.amenity.${key}`)}</h3>
                <p className="mt-2 text-gray-500">{t(`home.amenity.${key}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-6 pb-24">
        <div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-cover bg-center px-8 py-20 text-center text-white"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-ink/70"></div>
          <div className="relative">
            <h2 className="text-4xl font-semibold md:text-5xl">
              {t("home.ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-200">
              {t("home.ctaText")}
            </p>
            <Link to="/rooms" className="btn-gold mt-8 px-8 py-4">
              {t("home.ctaButton")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
