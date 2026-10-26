import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  ArrowLeft,
  XCircle,
  Star,
  Moon,
  CreditCard,
  RotateCcw,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReviewModal from "../components/ReviewModal";
import Stars from "../components/Stars";
import { useLanguage } from "../i18n/useLanguage";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80";

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewBooking, setReviewBooking] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const { t, formatDate: formatLocalDate } = useLanguage();

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
    return formatLocalDate(date, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ========================================
  // STATUS STYLES
  // ========================================

  const STATUS_STYLES = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    confirmed: "bg-green-50 text-green-700 ring-green-200",
    checked_in: "bg-sky-50 text-sky-700 ring-sky-200",
    checked_out: "bg-gray-100 text-gray-600 ring-gray-200",
    cancelled: "bg-red-50 text-red-600 ring-red-200",
  };

  const PAYMENT_STYLES = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-600",
    refunded: "bg-sky-50 text-sky-700",
  };

  // ========================================
  // CANCEL BOOKING
  // ========================================

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      t("myBookings.cancelConfirm")
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
          data.message || t("myBookings.cancelFailed")
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

      alert(t("myBookings.cancelled"));

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // ========================================
  // GROUP BOOKINGS INTO TABS
  // ========================================

  const today = new Date().toISOString().split("T")[0];

  const tabOf = (booking) => {
    if (booking.booking_status === "cancelled") return "cancelled";
    if (
      booking.booking_status === "checked_out" ||
      String(booking.check_out).slice(0, 10) < today
    ) {
      return "past";
    }
    return "upcoming";
  };

  const counts = bookings.reduce(
    (total, booking) => ({ ...total, [tabOf(booking)]: total[tabOf(booking)] + 1 }),
    { upcoming: 0, past: 0, cancelled: 0 }
  );

  // Open the first tab that has bookings unless the guest picked one
  const activeTab =
    selectedTab ||
    ["upcoming", "past", "cancelled"].find((tab) => counts[tab] > 0) ||
    "upcoming";

  const visibleBookings = bookings.filter(
    (booking) => tabOf(booking) === activeTab
  );

  const nightsBetween = (checkIn, checkOut) =>
    Math.max(
      1,
      Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    );

  // ========================================
  // PAYMENT ACTION
  // ========================================

  const renderPaymentAction = (booking) => {
    const payment = payments[booking.id];

    if (booking.booking_status === "cancelled" || tabOf(booking) === "past") {
      return null;
    }

    if (!payment) {
      return (
        <Link to={`/payment/${booking.id}`} className="btn-gold px-5 py-2.5 text-sm">
          <CreditCard size={16} />
          {t("myBookings.payNowBtn")}
        </Link>
      );
    }

    if (payment.payment_status === "pending") {
      return (
        <Link
          to={`/payment/${booking.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-gold-300 px-5 py-2.5 text-sm font-semibold text-gold-700 transition hover:bg-gold-50"
        >
          <CreditCard size={16} />
          {t("payment.continue")}
        </Link>
      );
    }

    if (payment.payment_status === "failed") {
      return (
        <Link
          to={`/payment/${booking.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <RotateCcw size={16} />
          {t("myBookings.retryBtn")}
        </Link>
      );
    }

    return null;
  };

  // ========================================
  // UI
  // ========================================

  const tabs = [
    { key: "upcoming", label: t("myBookings.tabUpcoming") },
    { key: "past", label: t("myBookings.tabPast") },
    { key: "cancelled", label: t("myBookings.tabCancelled") },
  ];

  return (
    <div className="min-h-screen">

      <Navbar />

      {/* Header */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-gold-300"
          >
            <ArrowLeft size={16} />
            {t("common.browseRooms")}
          </Link>

          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
            {t("myBookings.title")}
          </h1>

          <p className="mt-3 text-gray-400">{t("myBookings.subtitle")}</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            {[0, 1].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-gray-200/70"></div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl bg-red-50 p-5 text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        )}

        {/* No bookings at all */}
        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-3xl bg-white px-6 py-20 text-center shadow-sm ring-1 ring-black/5">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-50 text-gold-600">
              <CalendarDays size={30} />
            </span>

            <h2 className="mt-6 text-3xl font-semibold text-ink">
              {t("myBookings.empty")}
            </h2>

            <p className="mt-2 text-gray-500">{t("myBookings.emptyText")}</p>

            <Link to="/rooms" className="btn-gold mt-8">
              {t("common.browseRooms")}
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <>
            {/* Tabs */}
            <div className="mb-8 flex flex-wrap gap-2">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTab(key)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    activeTab === key
                      ? "bg-ink text-white"
                      : "bg-white text-gray-600 ring-1 ring-black/5 hover:text-ink"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      activeTab === key ? "bg-white/15" : "bg-gray-100"
                    }`}
                  >
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>

            {visibleBookings.length === 0 && (
              <div className="rounded-3xl bg-white px-6 py-14 text-center text-gray-500 ring-1 ring-black/5">
                {t("myBookings.emptyTab")}
              </div>
            )}

            <div className="space-y-6">
              {visibleBookings.map((booking) => {
                const payment = payments[booking.id];
                const nights = nightsBetween(booking.check_in, booking.check_out);
                const canCancel = ["pending", "confirmed"].includes(booking.booking_status) &&
                  tabOf(booking) === "upcoming";

                return (
                  <article
                    key={booking.id}
                    className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 md:grid md:grid-cols-[260px_1fr] ${
                      booking.booking_status === "cancelled" ? "opacity-75" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-48 md:h-full">
                      <img
                        src={booking.image || FALLBACK_IMAGE}
                        onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                        alt={booking.room_name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gold-700 backdrop-blur">
                        {t(`roomType.${booking.room_type}`)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col p-6 md:p-7">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-2xl font-semibold text-ink">
                            {booking.room_name}
                          </h2>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {t("common.roomNumber", { number: booking.room_number })} ·{" "}
                            {t("common.bookingNumber", { id: booking.id })}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            STATUS_STYLES[booking.booking_status] || STATUS_STYLES.checked_out
                          }`}
                        >
                          {t(`status.${booking.booking_status}`)}
                        </span>
                      </div>

                      {/* Stay details */}
                      <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-cream p-4 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-gray-500">{t("common.checkIn")}</p>
                          <p className="font-semibold text-ink">{formatDate(booking.check_in)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t("common.checkOut")}</p>
                          <p className="font-semibold text-ink">{formatDate(booking.check_out)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t("common.guests")}</p>
                          <p className="flex items-center gap-1.5 font-semibold text-ink">
                            <Users size={15} className="text-gold-600" />
                            {booking.guests}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t("confirm.nightsLabel")}</p>
                          <p className="flex items-center gap-1.5 font-semibold text-ink">
                            <Moon size={15} className="text-gold-600" />
                            {nights === 1 ? t("room.night") : t("room.nights", { count: nights })}
                          </p>
                        </div>
                      </div>

                      {booking.special_request && (
                        <p className="mt-4 text-sm text-gray-500">
                          <span className="font-semibold text-gray-700">
                            {t("common.specialRequest")}:
                          </span>{" "}
                          {booking.special_request}
                        </p>
                      )}

                      {/* Review */}
                      {Number(booking.can_review) === 1 && (
                        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-gold-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-gray-700">
                            {t("myBookings.reviewPrompt")}
                          </p>

                          <button
                            onClick={() => setReviewBooking(booking)}
                            className="btn-gold shrink-0 px-5 py-2.5 text-sm"
                          >
                            <Star size={16} />
                            {t("myBookings.writeReview")}
                          </button>
                        </div>
                      )}

                      {booking.review_rating && (
                        <p className="mt-5 flex items-center gap-2 text-sm text-gray-600">
                          {t("myBookings.yourReview")}
                          <Stars value={Number(booking.review_rating)} size={15} />
                          {t("myBookings.thanks")}
                        </p>
                      )}

                      {/* Footer: total, payment, actions */}
                      <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                          <div>
                            <p className="text-xs text-gray-500">{t("common.totalAmount")}</p>
                            <p className="font-display text-2xl font-semibold text-ink">
                              ${Number(booking.total_amount).toFixed(2)}
                            </p>
                          </div>

                          {payment && (
                            <div className="text-sm">
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                  PAYMENT_STYLES[payment.payment_status] || "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {t(`payStatusShort.${payment.payment_status}`)}
                              </span>
                              <span className="ml-2 text-gray-500">
                                {payment.payment_method || t("myBookings.notSpecified")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <XCircle size={16} />
                              {t("myBookings.cancel")}
                            </button>
                          )}

                          {renderPaymentAction(booking)}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

      </main>

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSaved={(rating) => {
            // Show the new rating on the card without reloading
            setBookings((current) =>
              current.map((booking) =>
                booking.id === reviewBooking.id
                  ? { ...booking, can_review: 0, review_rating: rating }
                  : booking
              )
            );
            setReviewBooking(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}

export default MyBookings;
