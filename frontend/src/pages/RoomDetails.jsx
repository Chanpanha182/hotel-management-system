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
      room_image: room.image,
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
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gold-700 mb-8"
        >
          <ArrowLeft size={18} />
          {t("common.backToRooms")}
        </Link>


        <div className="grid lg:grid-cols-3 gap-8">

          {/* ========================================
              ROOM INFORMATION
          ======================================== */}

          <div className="lg:col-span-2">

            <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden">

              <RoomGallery
                photos={getRoomPhotos(room)}
                alt={room.room_name}
              />

              <div className="p-8">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>

                    <p className="eyebrow">
                      {t(`roomType.${room.room_type}`)}
                    </p>

                    <h1 className="text-4xl font-semibold text-ink mt-2">
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
                    <span className="font-display text-4xl font-semibold text-ink">
                      ${Number(room.price).toFixed(2)}
                    </span>

                    <span className="text-gray-500">
                      {" "} {t("common.perNight")}
                    </span>
                  </div>

                </div>


                {/* Room Features */}

                <div className="grid sm:grid-cols-3 gap-4 mt-8">

                  <div className="flex items-center gap-3 bg-cream p-4 rounded-2xl">
                    <Users className="text-gold-600" />

                    <div>
                      <p className="text-sm text-gray-500">
                        {t("common.guests")}
                      </p>

                      <p className="font-semibold">
                        {t("common.guestsCount", { count: room.capacity })}
                      </p>
                    </div>
                  </div>


                  <div className="flex items-center gap-3 bg-cream p-4 rounded-2xl">
                    <BedDouble className="text-gold-600" />

                    <div>
                      <p className="text-sm text-gray-500">
                        {t("common.bed")}
                      </p>

                      <p className="font-semibold">
                        {room.bed_type}
                      </p>
                    </div>
                  </div>


                  <div className="flex items-center gap-3 bg-cream p-4 rounded-2xl">
                    <span className="text-gold-600 text-xl">
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

                  <h2 className="text-2xl font-semibold text-ink mb-3">
                    {t("room.about")}
                  </h2>

                  <p className="text-gray-600 leading-7">
                    {room.description}
                  </p>

                </div>


                {/* Facilities */}

                <div className="mt-8">

                  <h2 className="text-2xl font-semibold text-ink mb-4">
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
                          className="text-gold-600"
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

            <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-6 md:p-7 sticky top-28">

              <h2 className="text-2xl font-semibold text-ink mb-6">
                {t("room.bookThisRoom")}
              </h2>


              {/* Success */}

              {success && (
                <div className="bg-green-50 text-green-700 ring-1 ring-green-100 p-4 rounded-xl mb-5">
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
                <div className="bg-red-50 text-red-700 ring-1 ring-red-100 p-4 rounded-xl mb-5 text-sm">
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
                    className="absolute left-3.5 top-3.5 text-gold-600"
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
                    className="field pl-11"
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
                    className="absolute left-3.5 top-3.5 text-gold-600"
                  />

                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) =>
                      setCheckOut(e.target.value)
                    }
                    min={checkIn || undefined}
                    className="field pl-11"
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
                  className="field mb-5"
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
                  className="field mb-6"
                />


                {/* Price */}

                {nights > 0 && (
                  <div className="bg-cream rounded-2xl p-4 mb-5">

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

                    <div className="border-t border-gold-100 pt-3 mt-3 flex items-end justify-between font-semibold text-ink">
                      <span>{t("common.total")}</span>

                      <span className="font-display text-2xl">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>

                  </div>
                )}


                {/* Book Button */}

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="btn-gold w-full py-4"
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