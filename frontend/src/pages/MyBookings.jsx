import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH BOOKINGS + PAYMENTS
  // ========================================

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setError("");

        // ----------------------------------------
        // GET BOOKINGS
        // ----------------------------------------

        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/bookings/my-bookings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch bookings."
          );
        }

        const bookingList = data.data || [];

        setBookings(bookingList);

        // ----------------------------------------
        // GET PAYMENT FOR EACH BOOKING
        // ----------------------------------------

        const paymentResults = await Promise.all(
          bookingList.map(async (booking) => {
            try {
              const paymentResponse = await fetch(
                `${import.meta.env.VITE_API_URL}/api/payments/booking/${booking.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const paymentData =
                await paymentResponse.json();

              return {
                bookingId: booking.id,
                payment: paymentData.data || null,
              };
            } catch (paymentError) {
              console.error(
                `Failed to load payment for booking ${booking.id}:`,
                paymentError
              );

              return {
                bookingId: booking.id,
                payment: null,
              };
            }
          })
        );

        // ----------------------------------------
        // CREATE PAYMENT MAP
        // ----------------------------------------

        const paymentMap = {};

        paymentResults.forEach((item) => {
          paymentMap[item.bookingId] = item.payment;
        });

        setPayments(paymentMap);

      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    fetchBookings();

    // ----------------------------------------
    // REFRESH WHEN USER RETURNS TO THIS PAGE
    // ----------------------------------------

    const handleFocus = () => {
      fetchBookings();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };

  }, [navigate]);

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ========================================
  // BOOKING STATUS STYLE
  // ========================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "checked_in":
        return "bg-blue-100 text-blue-700";

      case "checked_out":
        return "bg-gray-100 text-gray-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ========================================
  // PAYMENT STATUS STYLE
  // ========================================

  const getPaymentStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "paid":
        return "bg-green-100 text-green-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ========================================
  // PAYMENT STATUS TEXT
  // ========================================

  const getPaymentStatusText = (status) => {
    switch (status) {
      case "pending":
        return "🟡 Payment Pending";

      case "paid":
        return "🟢 Paid";

      case "failed":
        return "🔴 Payment Failed";

      case "refunded":
        return "🔵 Refunded";

      default:
        return "Payment";
    }
  };

  // ========================================
  // CANCEL BOOKING
  // ========================================

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to cancel booking."
        );
      }

      // Update booking status immediately
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                booking_status: "cancelled",
              }
            : booking
        )
      );

      alert("Booking cancelled successfully!");

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // ========================================
  // PAYMENT SECTION
  // ========================================

  const renderPaymentSection = (booking) => {
    const payment = payments[booking.id];

    // Cancelled booking
    if (booking.booking_status === "cancelled") {
      return null;
    }

    // No payment yet
    if (!payment) {
      return (
        <button
          onClick={() =>
            navigate(`/payment/${booking.id}`)
          }
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          💳 Pay Now
        </button>
      );
    }

// Payment is pending
if (payment.payment_status === "pending") {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      
      <div
        className={`inline-block px-4 py-2 rounded-lg font-semibold ${getPaymentStatusStyle(
          payment.payment_status
        )}`}
      >
        {getPaymentStatusText(payment.payment_status)}
      </div>

      <button
        onClick={() => navigate(`/payment/${booking.id}`)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
      >
        💳 Continue Payment
      </button>

    </div>
  );
}

    // Payment is paid
    if (payment.payment_status === "paid") {
      return (
        <div
          className={`inline-block px-4 py-2 rounded-lg font-semibold ${getPaymentStatusStyle(
            payment.payment_status
          )}`}
        >
          {getPaymentStatusText(
            payment.payment_status
          )}
        </div>
      );
    }

    // Payment failed
    if (payment.payment_status === "failed") {
      return (
        <button
          onClick={() =>
            navigate(`/payment/${booking.id}`)
          }
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          🔴 Payment Failed — Try Again
        </button>
      );
    }

    // Payment refunded
    if (payment.payment_status === "refunded") {
      return (
        <div
          className={`inline-block px-4 py-2 rounded-lg font-semibold ${getPaymentStatusStyle(
            payment.payment_status
          )}`}
        >
          {getPaymentStatusText(
            payment.payment_status
          )}
        </div>
      );
    }

    return null;
  };

  // ========================================
  // RETURN
  // ========================================

  return (
    <div className="min-h-screen">

      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="mb-8">

          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-5"
          >
            <ArrowLeft size={18} />
            Browse Rooms
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">
            My Bookings
          </h1>

          <p className="text-gray-500 mt-2">
            View and manage your hotel reservations.
          </p>

        </div>

        {/* ========================================
            LOADING
        ======================================== */}

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-gray-500">
              Loading your bookings...
            </p>
          </div>
        )}

        {/* ========================================
            ERROR
        ======================================== */}

        {!loading && error && (
          <div className="bg-red-100 text-red-700 p-5 rounded-xl">
            {error}
          </div>
        )}

        {/* ========================================
            NO BOOKINGS
        ======================================== */}

        {!loading &&
          !error &&
          bookings.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">

              <CalendarDays
                size={50}
                className="mx-auto text-gray-400 mb-4"
              />

              <h2 className="text-xl font-bold text-gray-900">
                No bookings yet
              </h2>

              <p className="text-gray-500 mt-2 mb-6">
                You haven't made any reservations yet.
              </p>

              <Link
                to="/rooms"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Browse Rooms
              </Link>

            </div>
          )}

        {/* ========================================
            BOOKINGS
        ======================================== */}

        {!loading &&
          !error &&
          bookings.length > 0 && (
            <div className="space-y-6">

              {bookings.map((booking) => (

                <div
                  key={booking.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >

                  <div className="grid md:grid-cols-4">

                    {/* ========================================
                        ROOM IMAGE
                    ======================================== */}

                    <div className="md:col-span-1">

                      <img
                        src={booking.image}
                        alt={booking.room_name}
                        className="w-full h-full min-h-[220px] object-cover"
                      />

                    </div>

                    {/* ========================================
                        BOOKING INFORMATION
                    ======================================== */}

                    <div className="md:col-span-3 p-6">

                      {/* ROOM + BOOKING STATUS */}

                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                        <div>

                          <p className="text-blue-600 font-medium">
                            {booking.room_type}
                          </p>

                          <h2 className="text-2xl font-bold text-gray-900">
                            {booking.room_name}
                          </h2>

                          <p className="text-gray-500 mt-1">
                            Room {booking.room_number}
                          </p>

                        </div>

                        {/* BOOKING STATUS */}

                        <span
                          className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${getStatusStyle(
                            booking.booking_status
                          )}`}
                        >
                          {booking.booking_status.replace(
                            "_",
                            " "
                          )}
                        </span>

                      </div>

                      {/* ========================================
                          DETAILS
                      ======================================== */}

                      <div className="grid sm:grid-cols-3 gap-4 mt-6">

                        {/* CHECK IN */}

                        <div className="flex items-center gap-3">

                          <CalendarDays
                            size={20}
                            className="text-blue-600"
                          />

                          <div>

                            <p className="text-xs text-gray-500">
                              Check-in
                            </p>

                            <p className="font-medium">
                              {formatDate(
                                booking.check_in
                              )}
                            </p>

                          </div>

                        </div>

                        {/* CHECK OUT */}

                        <div className="flex items-center gap-3">

                          <CalendarDays
                            size={20}
                            className="text-blue-600"
                          />

                          <div>

                            <p className="text-xs text-gray-500">
                              Check-out
                            </p>

                            <p className="font-medium">
                              {formatDate(
                                booking.check_out
                              )}
                            </p>

                          </div>

                        </div>

                        {/* GUESTS */}

                        <div className="flex items-center gap-3">

                          <Users
                            size={20}
                            className="text-blue-600"
                          />

                          <div>

                            <p className="text-xs text-gray-500">
                              Guests
                            </p>

                            <p className="font-medium">
                              {booking.guests}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* ========================================
                          BOTTOM
                      ======================================== */}

                      <div className="border-t mt-6 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        <div>

                          <p className="text-sm text-gray-500">
                            Total Amount
                          </p>

                          <p className="text-2xl font-bold text-blue-600">
                            $
                            {Number(
                              booking.total_amount
                            ).toFixed(2)}
                          </p>

                          {/* PAYMENT STATUS / BUTTON */}

                          <div className="mt-4">
                            {renderPaymentSection(
                              booking
                            )}
                          </div>

                        </div>

                        <div className="text-sm text-gray-500">
                          Booking #{booking.id}
                        </div>

                      </div>

                      {/* ========================================
                          CANCEL BOOKING
                      ======================================== */}

                      {booking.booking_status !== "cancelled" &&
                        booking.booking_status !== "checked_out" && (
                          <div className="mt-5 pt-5 border-t">

                            <button
                              onClick={() =>
                                handleCancelBooking(
                                  booking.id
                                )
                              }
                              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
                            >
                              <XCircle size={18} />
                              Cancel Booking
                            </button>

                          </div>
                        )}

                      {/* ========================================
                          PAYMENT INFORMATION
                      ======================================== */}

                      {payments[booking.id] && (
                        <div className="mt-5 bg-gray-50 rounded-lg p-4">

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                            <div>

                              <p className="text-sm font-semibold text-gray-700">
                                Payment Information
                              </p>

                              <p className="text-sm text-gray-600 mt-1">
                                Method:{" "}
                                {payments[booking.id]
                                  .payment_method ||
                                  "Not specified"}
                              </p>

                            </div>

                            <span
                              className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${getPaymentStatusStyle(
                                payments[booking.id]
                                  .payment_status
                              )}`}
                            >
                              {payments[booking.id]
                                .payment_status}
                            </span>

                          </div>

                        </div>
                      )}

                      {/* ========================================
                          SPECIAL REQUEST
                      ======================================== */}

                      {booking.special_request && (
                        <div className="mt-5 bg-gray-50 rounded-lg p-4">

                          <p className="text-sm font-semibold text-gray-700">
                            Special Request
                          </p>

                          <p className="text-sm text-gray-600 mt-1">
                            {booking.special_request}
                          </p>

                        </div>
                      )}

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

      </main>

      <Footer />
    </div>
  );
}

export default MyBookings;