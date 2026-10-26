import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, RotateCcw, CalendarDays } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoomCard from "../components/RoomCard";
import { useLanguage } from "../i18n/useLanguage";

const today = new Date().toISOString().split("T")[0];

const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Luxury", "Family", "Presidential"];

function Rooms() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");

  // Only ask the server about availability once both dates make sense
  const datesReady = Boolean(checkIn && checkOut && checkIn < checkOut);
  const queryKey = datesReady ? `?checkIn=${checkIn}&checkOut=${checkOut}` : "";

  // Result of the last request, tagged with the query it was for
  const [result, setResult] = useState({ key: null, rooms: [], error: "" });
  const loading = result.key !== queryKey;
  const rooms = result.rooms;
  const error = loading ? "" : result.error;

  const [roomType, setRoomType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [guests, setGuests] = useState(searchParams.get("guests") || "");

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + "/api/rooms" + queryKey)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch rooms");
        }

        return response.json();
      })
      .then((data) => {
        setResult({ key: queryKey, rooms: data.data, error: "" });
      })
      .catch((error) => {
        console.error(error);
        setResult({
          key: queryKey,
          rooms: [],
          error: "rooms.loadError",
        });
      });
  }, [queryKey]);

  const filteredRooms = rooms.filter((room) => {
    const typeMatch =
      roomType === "" || room.room_type === roomType;

    const priceMatch =
      maxPrice === "" || Number(room.price) <= Number(maxPrice);

    const guestMatch =
      guests === "" || Number(room.capacity) >= Number(guests);

    // "available" is only sent when dates were given
    const dateMatch = !datesReady || Boolean(room.available);

    return typeMatch && priceMatch && guestMatch && dateMatch;
  });

  const bookedCount = datesReady
    ? rooms.filter((room) => !room.available).length
    : 0;

  // Carry the dates from the home page search into the room page
  const carry = new URLSearchParams();
  Object.entries({ checkIn, checkOut, guests }).forEach(([key, value]) => {
    if (value) carry.set(key, value);
  });
  const carryString = carry.toString() ? `?${carry.toString()}` : "";

  const hasFilters = roomType || maxPrice || guests || checkIn || checkOut;

  const resetFilters = () => {
    setRoomType("");
    setMaxPrice("");
    setGuests("");
    setCheckIn("");
    setCheckOut("");
  };

  return (
    <div className="min-h-screen">

      <Navbar />

      {/* Header */}
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=2000&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-ink/70"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-white">
          <p className="eyebrow text-gold-300">{t("rooms.eyebrow")}</p>

          <h1 className="mt-4 text-5xl md:text-6xl font-semibold">
            {t("rooms.title")}
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            {t("rooms.subtitle")}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-14">

        {/* Filters */}
        <div className="mb-12 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">

          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-gold-600" />
              <h2 className="font-sans text-base font-semibold text-ink">
                {t("rooms.filter")}
              </h2>
            </div>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-600"
              >
                <RotateCcw size={14} />
                {t("common.reset")}
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

            <label className="block">
              <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <CalendarDays size={13} className="text-gold-600" />
                {t("common.checkIn")}
              </span>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="field"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <CalendarDays size={13} className="text-gold-600" />
                {t("common.checkOut")}
              </span>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="field"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("rooms.roomType")}
              </span>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="field"
              >
                <option value="">{t("rooms.allTypes")}</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`roomType.${type}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("rooms.maxPrice")}
              </span>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="field"
              >
                <option value="">{t("rooms.anyPrice")}</option>
                {[100, 150, 200, 300, 500].map((price) => (
                  <option key={price} value={price}>
                    {t("rooms.priceOrLess", { price })}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("common.guests")}
              </span>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="field"
              >
                <option value="">{t("common.any")}</option>
                <option value="1">{t("home.guestOption1")}</option>
                <option value="2">{t("home.guestOptionN", { count: 2 })}</option>
                <option value="3">{t("home.guestOptionN", { count: 3 })}</option>
                <option value="4">{t("home.guestOption4")}</option>
              </select>
            </label>

          </div>
        </div>

        {/* Count */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-gray-500">
            {t(
              `rooms.${datesReady ? "countAvailable" : "countAll"}${
                filteredRooms.length === 1 ? "1" : ""
              }`,
              { count: filteredRooms.length }
            )}
            {bookedCount > 0 && (
              <span className="text-gray-400">
                {" "}· {t("rooms.alreadyBooked", { count: bookedCount })}
              </span>
            )}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[440px] animate-pulse rounded-3xl bg-gray-200/70"></div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 p-5 text-red-700 ring-1 ring-red-100">
            {t(error)}
          </div>
        )}

        {/* No Rooms */}
        {!loading && !error && filteredRooms.length === 0 && (
          <div className="rounded-3xl bg-white py-20 text-center ring-1 ring-black/5">
            <h2 className="text-3xl font-semibold text-ink">
              {t("rooms.noneFound")}
            </h2>

            <p className="mt-2 text-gray-500">
              {datesReady
                ? t("rooms.allBooked")
                : t("rooms.changeFilters")}
            </p>

            <button onClick={resetFilters} className="btn-gold mt-6">
              {t("rooms.showAll")}
            </button>
          </div>
        )}

        {/* Rooms */}
        {!loading && !error && filteredRooms.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} search={carryString} />
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default Rooms;
