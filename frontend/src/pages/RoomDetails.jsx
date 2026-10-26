import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Check,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoomGallery from "../components/RoomGallery";
import RoomReviews from "../components/RoomReviews";
import Stars from "../components/Stars";
import { getRoomPhotos } from "../utils/roomPhotos";
import { useLanguage } from "../i18n/useLanguage";

function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState(Number(searchParams.get("guests")) || 1);
  const [specialRequest, setSpecialRequest] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // ========================================
  // GET ROOM
  // ========================================

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/rooms/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t("room.loadError"));
        }

        setRoom(data.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id, t]);

  // ========================================
  // CALCULATE NIGHTS
  // ========================================

  const calculateNights = () => {
    if (!checkIn || !checkOut) {
      return 0;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const difference = end - start;

    if (difference <= 0) {
      return 0;
    }

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  };

  const nights = calculateNights();

  const totalAmount =
    room && nights > 0
      ? Number(room.price) * nights
      : 0;

  // ========================================
  // BOOK ROOM
  // ========================================

  const handleBooking = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check login
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    // Validate dates
    if (!checkIn || !checkOut) {
      setError(t("room.errorDates"));
      return;
    }

    if (nights <= 0) {
      setError(t("room.errorOrder"));
      return;
    }

    // Validate guests
    if (guests < 1 || guests > room.capacity) {
      setError(
        t("room.errorGuests", { max: room.capacity })
      );
      return;
    }

    setBookingLoading(true);

    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/bookings",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            room_id: room.id,
            check_in: checkIn,
            check_out: checkOut,
            guests: Number(guests),
            special_request: specialRequest,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || t("room.bookingFailed")
        );
      }

     navigate("/booking-confirmation", {
  state: {
    // The API reply has no room details, so add them for the summary page
    booking: {
      ...data.data,
      room_name: room.room_name,
      room_number: room.room_number,
    },
  },
});
    } catch (error) {
      setError(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />

        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">
            {t("room.loading")}
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (!room) {
    return (
      <div className="min-h-screen">
        <Navbar />

        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("room.notFound")}
          </h1>

          <Link
            to="/rooms"
            className="inline-block mt-5 text-blue-600 hover:underline"
          >
            {t("common.backToRooms")}
          </Link>
        </div>
      </div>
    );
  }

  // ========================================
  // FACILITIES
  // ========================================

  const facilities = room.facilities
    ? room.facilities.split(",")
    : [];

  return (
    <div className="min-h-screen">

      <Navbar />

      {/* ========================================
          MAIN CONTENT
      ======================================== */}

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Back button */}

        <Link
          to="/rooms"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8"
        >
          <ArrowLeft size={18} />
          {t("common.backToRooms")}
        </Link>


        <div className="grid lg:grid-cols-3 gap-8">

          {/* ========================================
              ROOM INFORMATION
          ======================================== */}

          <div className="lg:col-span-2">

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

              <RoomGallery
                photos={getRoomPhotos(room)}
                alt={room.room_name}
              />

              <div className="p-8">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>

                    <p className="text-blue-600 font-medium">
                      {t(`roomType.${room.room_type}`)}
                    </p>

                    <h1 className="text-3xl font-bold text-gray-900 mt-1">
                      {room.room_name}
                    </h1>

                    <p className="text-gray-500 mt-2">
                      {t("common.roomNumber", { number: room.room_number })}
                    </p>

                    {Number(room.review_count) > 0 && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Stars value={Number(room.avg_rating)} />
                        <span className="font-semibold text-ink">
                          {Number(room.avg_rating).toFixed(1)}
                        </span>
                        ({Number(room.review_count) === 1
                          ? t("reviews.count1")
                          : t("reviews.countN", { count: room.review_count })})
                      </p>
                    )}

                  </div>

                  <div>
                    <span className="text-3xl font-bold text-blue-600">
                      ${Number(room.price).toFixed(2)}
                    </span>

                    <span className="text-gray-500">
                      {" "} {t("common.perNight")}
                    </span>
                  </div>

                </div>


                {/* Room Features */}

                <div className="grid sm:grid-cols-3 gap-4 mt-8">

                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    <Users className="text-blue-600" />

                    <div>
                      <p className="text-sm text-gray-500">
                        {t("common.guests")}
                      </p>

                      <p className="font-semibold">
                        {t("common.guestsCount", { count: room.capacity })}
                      </p>
                    </div>
                  </div>


                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    <BedDouble className="text-blue-600" />

                    <div>
                      <p className="text-sm text-gray-500">
                        {t("common.bed")}
                      </p>

                      <p className="font-semibold">
                        {room.bed_type}
                      </p>
                    </div>
                  </div>


                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    <span className="text-blue-600 text-xl">
                      📐
                    </span>

                    <div>
                      <p className="text-sm text-gray-500">
                        {t("common.roomSize")}
                      </p>

                      <p className="font-semibold">
                        {room.room_size}
                      </p>
                    </div>
                  </div>

                </div>


                {/* Description */}

                <div className="mt-10">

                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {t("room.about")}
                  </h2>

                  <p className="text-gray-600 leading-7">
                    {room.description}
                  </p>

                </div>


                {/* Facilities */}

                <div className="mt-8">

                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {t("room.facilities")}
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-3">

                    {facilities.map((facility, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-gray-600"
                      >
                        <Check
                          size={18}
                          className="text-green-600"
                        />

                        {facility.trim()}
                      </div>
                    ))}

                  </div>

                </div>

              </div>

            </div>

            <RoomReviews roomId={room.id} />

          </div>


          {/* ========================================
              BOOKING FORM
          ======================================== */}

          <div>

            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t("room.bookThisRoom")}
              </h2>


              {/* Success */}

              {success && (
                <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-5">
                  {success}

                  <button
                    onClick={() => navigate("/my-bookings")}
                    className="block mt-2 font-semibold underline"
                  >
                    {t("room.viewMyBookings")}
                  </button>
                </div>
              )}


              {/* Error */}

              {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-5">
                  {error}
                </div>
              )}


              <form onSubmit={handleBooking}>

                {/* Check In */}

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.checkIn")}
                </label>

                <div className="relative mb-5">

                  <CalendarDays
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />

                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) =>
                      setCheckIn(e.target.value)
                    }
                    min={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    className="w-full border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                </div>


                {/* Check Out */}

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.checkOut")}
                </label>

                <div className="relative mb-5">

                  <CalendarDays
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />

                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) =>
                      setCheckOut(e.target.value)
                    }
                    min={checkIn || undefined}
                    className="w-full border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                </div>


                {/* Guests */}

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.guests")}
                </label>

                <select
                  value={guests}
                  onChange={(e) =>
                    setGuests(Number(e.target.value))
                  }
                  className="w-full border rounded-lg px-4 py-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from(
                    { length: room.capacity },
                    (_, index) => index + 1
                  ).map((number) => (
                    <option
                      key={number}
                      value={number}
                    >
                      {number === 1
                        ? t("home.guestOption1")
                        : t("home.guestOptionN", { count: number })}
                    </option>
                  ))}
                </select>


                {/* Special Request */}

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common.specialRequest")}
                </label>

                <textarea
                  value={specialRequest}
                  onChange={(e) =>
                    setSpecialRequest(e.target.value)
                  }
                  placeholder={t("room.requestPlaceholder")}
                  rows="3"
                  className="w-full border rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />


                {/* Price */}

                {nights > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-5">

                    <div className="flex justify-between text-gray-600 mb-2">
                      <span>
                        ${Number(room.price).toFixed(2)} ×{" "}
                        {nights === 1
                          ? t("room.night")
                          : t("room.nights", { count: nights })}
                      </span>

                      <span>
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                      <span>{t("common.total")}</span>

                      <span className="text-blue-600">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>

                  </div>
                )}


                {/* Book Button */}

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {bookingLoading
                    ? t("room.booking")
                    : t("room.bookNow")}
                </button>

              </form>

            </div>

          </div>

        </div>

      </main>

      <Footer />

    </div>
  );
}

export default RoomDetails;