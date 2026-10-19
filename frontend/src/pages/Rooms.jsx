import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Users,
  BedDouble,
  Maximize,
  Search,
} from "lucide-react";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roomType, setRoomType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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
        setError("Unable to load rooms.");
        setLoading(false);
      });
  }, []);

  const filteredRooms = rooms.filter((room) => {
    const typeMatch =
      roomType === "" || room.room_type === roomType;

    const priceMatch =
      maxPrice === "" || Number(room.price) <= Number(maxPrice);

    return typeMatch && priceMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      {/* Header */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our Rooms
          </h1>

          <p className="text-gray-300 max-w-2xl">
            Choose the perfect room for your stay and enjoy
            comfort, quality, and excellent service.
          </p>

        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-10">

          <div className="flex items-center gap-2 mb-5">
            <Search size={20} className="text-blue-600" />

            <h2 className="text-xl font-bold">
              Find Your Room
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {/* Room Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Room Type
              </label>

              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full border rounded-lg px-4 py-3"
              >
                <option value="">All Room Types</option>

                <option value="Standard">
                  Standard
                </option>

                <option value="Deluxe">
                  Deluxe
                </option>

                <option value="Suite">
                  Suite
                </option>

                <option value="Luxury">
                  Luxury
                </option>

                <option value="Family">
                  Family
                </option>

                <option value="Presidential">
                  Presidential
                </option>
              </select>
            </div>

            {/* Maximum Price */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Price
              </label>

              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border rounded-lg px-4 py-3"
              >
                <option value="">Any Price</option>
                <option value="100">$100 or less</option>
                <option value="150">$150 or less</option>
                <option value="200">$200 or less</option>
                <option value="300">$300 or less</option>
                <option value="500">$500 or less</option>
              </select>
            </div>

          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              Loading rooms...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* No Rooms */}
        {!loading && !error && filteredRooms.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">
              No rooms found
            </h2>

            <p className="text-gray-500">
              Try changing your filters.
            </p>
          </div>
        )}

        {/* Rooms */}
        {!loading && !error && filteredRooms.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            {filteredRooms.map((room) => (

              <div
                key={room.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition"
              >

                {/* Image */}
                <img
                  src={room.image}
                  alt={room.room_name}
                  className="w-full h-56 object-cover"
                />

                {/* Content */}
                <div className="p-6">

                  <div className="flex justify-between items-start mb-3">

                    <div>
                      <p className="text-blue-600 text-sm font-medium">
                        {room.room_type}
                      </p>

                      <h3 className="text-2xl font-bold">
                        {room.room_name}
                      </h3>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        ${room.price}
                      </p>

                      <p className="text-xs text-gray-500">
                        / night
                      </p>
                    </div>

                  </div>

                  {/* Room Info */}
                  <div className="grid grid-cols-3 gap-3 py-4 border-y my-4">

                    <div className="text-center">
                      <Users
                        size={18}
                        className="mx-auto text-blue-600 mb-1"
                      />

                      <p className="text-xs text-gray-500">
                        Guests
                      </p>

                      <p className="text-sm font-medium">
                        {room.capacity}
                      </p>
                    </div>

                    <div className="text-center">
                      <BedDouble
                        size={18}
                        className="mx-auto text-blue-600 mb-1"
                      />

                      <p className="text-xs text-gray-500">
                        Bed
                      </p>

                      <p className="text-sm font-medium">
                        {room.bed_type}
                      </p>
                    </div>

                    <div className="text-center">
                      <Maximize
                        size={18}
                        className="mx-auto text-blue-600 mb-1"
                      />

                      <p className="text-xs text-gray-500">
                        Size
                      </p>

                      <p className="text-sm font-medium">
                        {room.room_size}
                      </p>
                    </div>

                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm line-clamp-2 mb-5">
                    {room.description}
                  </p>

                  {/* Button */}
                  <Link
                    to={`/rooms/${room.id}`}
                    className="block text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    View Details
                  </Link>

                </div>

              </div>

            ))}

          </div>
        )}

      </main>
    </div>
  );
}

export default Rooms;