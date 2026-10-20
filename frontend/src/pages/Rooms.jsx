import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoomCard from "../components/RoomCard";

const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Luxury", "Family", "Presidential"];

function Rooms() {
  const [searchParams] = useSearchParams();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roomType, setRoomType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [guests, setGuests] = useState(searchParams.get("guests") || "");

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + "/api/rooms")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch rooms");
        }

        return response.json();
      })
      .then((data) => {
        setRooms(data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Unable to load rooms. Please try again in a moment.");
        setLoading(false);
      });
  }, []);

  const filteredRooms = rooms.filter((room) => {
    const typeMatch =
      roomType === "" || room.room_type === roomType;

    const priceMatch =
      maxPrice === "" || Number(room.price) <= Number(maxPrice);

    const guestMatch =
      guests === "" || Number(room.capacity) >= Number(guests);

    return typeMatch && priceMatch && guestMatch;
  });

  // Carry the dates from the home page search into the room page
  const carry = new URLSearchParams();
  ["checkIn", "checkOut", "guests"].forEach((key) => {
    const value = key === "guests" ? guests : searchParams.get(key);
    if (value) carry.set(key, value);
  });
  const carryString = carry.toString() ? `?${carry.toString()}` : "";

  const hasFilters = roomType || maxPrice || guests;

  const resetFilters = () => {
    setRoomType("");
    setMaxPrice("");
    setGuests("");
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
          <p className="eyebrow text-gold-300">Accommodation</p>

          <h1 className="mt-4 text-5xl md:text-6xl font-semibold">
            Rooms & Suites
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            Choose the perfect room for your stay and enjoy
            comfort, quality and excellent service.
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
                Filter Rooms
              </h2>
            </div>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-600"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Room Type
              </span>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="field"
              >
                <option value="">All Room Types</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Maximum Price
              </span>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="field"
              >
                <option value="">Any Price</option>
                <option value="100">$100 or less</option>
                <option value="150">$150 or less</option>
                <option value="200">$200 or less</option>
                <option value="300">$300 or less</option>
                <option value="500">$500 or less</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Guests
              </span>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="field"
              >
                <option value="">Any</option>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4+ Guests</option>
              </select>
            </label>

          </div>
        </div>

        {/* Count */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-gray-500">
            Showing <span className="font-semibold text-ink">{filteredRooms.length}</span>{" "}
            {filteredRooms.length === 1 ? "room" : "rooms"}
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
            {error}
          </div>
        )}

        {/* No Rooms */}
        {!loading && !error && filteredRooms.length === 0 && (
          <div className="rounded-3xl bg-white py-20 text-center ring-1 ring-black/5">
            <h2 className="text-3xl font-semibold text-ink">
              No rooms found
            </h2>

            <p className="mt-2 text-gray-500">
              Try changing your filters.
            </p>

            <button onClick={resetFilters} className="btn-gold mt-6">
              Show All Rooms
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
