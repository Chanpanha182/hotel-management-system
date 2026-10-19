import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section
        className="relative min-h-screen bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80')",
        }}
      >

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        <Navbar />

        {/* Hero Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center text-center text-white px-6">

          <div className="max-w-3xl">

            <p className="uppercase tracking-[5px] text-sm mb-5">
              Welcome to Grand Hotel
            </p>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Experience Luxury & Comfort
            </h1>

            <p className="text-lg md:text-xl text-gray-200 mb-8">
              Discover an unforgettable stay with elegant rooms,
              exceptional service, and world-class facilities.
            </p>

            <Link
              to="/rooms"
              className="inline-block bg-yellow-500 text-black px-8 py-4 rounded-full font-semibold hover:bg-yellow-400 transition"
            >
              Book Your Stay
            </Link>

          </div>

        </div>

      </section>

      {/* Search Section */}
      <section className="relative -mt-16 z-20 px-6">

        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6">

          <h2 className="text-2xl font-bold mb-5">
            Find Your Perfect Room
          </h2>

          <div className="grid md:grid-cols-4 gap-4">

            <div>
              <label className="block text-sm font-medium mb-2">
                Check-in
              </label>

              <input
                type="date"
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Check-out
              </label>

              <input
                type="date"
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Guests
              </label>

              <select className="w-full border rounded-lg px-4 py-3">
                <option>1 Guest</option>
                <option>2 Guests</option>
                <option>3 Guests</option>
                <option>4 Guests</option>
              </select>
            </div>

            <div className="flex items-end">

              <button className="w-full bg-black text-white rounded-lg px-4 py-3 hover:bg-gray-800">
                Search Rooms
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* Featured Rooms */}
      <section className="py-24 px-6">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-12">

            <p className="text-yellow-600 uppercase tracking-widest">
              Stay With Us
            </p>

            <h2 className="text-4xl font-bold mt-3">
              Featured Rooms
            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-8">

            <RoomCard
              image="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80"
              name="Deluxe Room"
              price="120"
            />

            <RoomCard
              image="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"
              name="Executive Suite"
              price="180"
            />

            <RoomCard
              image="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80"
              name="Luxury Suite"
              price="250"
            />

          </div>

        </div>

      </section>

    </div>
  );
}

function RoomCard({ image, name, price }) {

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition">

      <img
        src={image}
        alt={name}
        className="w-full h-64 object-cover"
      />

      <div className="p-6">

        <h3 className="text-2xl font-bold">
          {name}
        </h3>

        <p className="text-gray-500 mt-2">
          Comfortable and elegant accommodation.
        </p>

        <div className="flex items-center justify-between mt-5">

          <p>
            <span className="text-2xl font-bold">
              ${price}
            </span>
            <span className="text-gray-500">
              /night
            </span>
          </p>

          <Link
            to="/rooms"
            className="bg-black text-white px-5 py-2 rounded-full"
          >
            View Room
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Home;