import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle,
  CalendarDays,
  Users,
  BedDouble,
  CreditCard,
  Home,
  ClipboardList,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../i18n/useLanguage";

function BookingConfirmation() {
  const location = useLocation();
  const { t, formatDate } = useLanguage();

  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center px-6 py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {t("confirm.notFoundTitle")}
          </h1>

          <p className="text-gray-500 mb-6">
            {t("confirm.notFoundText")}
          </p>

          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            <ClipboardList size={18} />
            {t("nav.myBookings")}
          </Link>
        </div>
      </div>
      <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Success Header */}
        <div className="text-center mb-10">
          <CheckCircle
            size={72}
            className="mx-auto text-green-500 mb-5"
          />

          <h1 className="text-3xl font-bold text-gray-900">
            {t("confirm.title")}
          </h1>

          <p className="text-gray-500 mt-2">
            {t("confirm.text")}
          </p>

          <p className="text-gray-600 mt-3">
            {t("confirm.bookingId")}
            <span className="font-bold text-blue-600 ml-2">
              #{booking.booking_id}
            </span>
          </p>
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Room Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center gap-3">
              <BedDouble size={28} />

              <div>
                <h2 className="text-xl font-bold">
                  {booking.room_name}
                </h2>

                <p className="text-blue-100">
                  {t("common.roomNumber", { number: booking.room_number })}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6">

            <div className="grid md:grid-cols-2 gap-5">

              {/* Check In */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                <CalendarDays className="text-blue-600" size={24} />

                <div>
                  <p className="text-sm text-gray-500">
                    {t("common.checkIn")}
                  </p>

                  <p className="font-semibold text-gray-900">
                    {formatDate(booking.check_in)}
                  </p>
                </div>
              </div>

              {/* Check Out */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                <CalendarDays className="text-blue-600" size={24} />

                <div>
                  <p className="text-sm text-gray-500">
                    {t("common.checkOut")}
                  </p>

                  <p className="font-semibold text-gray-900">
                    {formatDate(booking.check_out)}
                  </p>
                </div>
              </div>

              {/* Guests */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                <Users className="text-blue-600" size={24} />

                <div>
                  <p className="text-sm text-gray-500">
                    {t("common.guests")}
                  </p>

                  <p className="font-semibold text-gray-900">
                    {booking.guests === 1
                      ? t("home.guestOption1")
                      : t("home.guestOptionN", { count: booking.guests })}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />

                <div>
                  <p className="text-sm text-gray-500">
                    {t("confirm.bookingStatus")}
                  </p>

                  <p className="font-semibold text-yellow-600 capitalize">
                    {t(`status.${booking.booking_status}`)}
                  </p>
                </div>
              </div>

            </div>

            {/* Special Request */}
            {booking.special_request && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t("common.specialRequest")}
                </h3>

                <p className="bg-gray-50 rounded-xl p-4 text-gray-600">
                  {booking.special_request}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="border-t mt-8 pt-6">
              <div className="flex justify-between items-center">

                <div className="flex items-center gap-3">
                  <CreditCard className="text-blue-600" />

                  <span className="text-lg font-semibold">
                    {t("common.totalAmount")}
                  </span>
                </div>

                <span className="text-2xl font-bold text-blue-600">
                  ${Number(booking.total_amount).toFixed(2)}
                </span>

              </div>
            </div>

            {/* Actions */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8">

              <Link
                to={`/payment/${booking.booking_id}`}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
              >
                <CreditCard size={18} />
                {t("confirm.goToPayment")}
              </Link>

              <Link
                to="/my-bookings"
                className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-semibold transition"
              >
                <ClipboardList size={18} />
                {t("nav.myBookings")}
              </Link>

            </div>

            <Link
              to="/"
              className="flex items-center justify-center gap-2 mt-4 text-gray-500 hover:text-blue-600 transition"
            >
              <Home size={18} />
              {t("confirm.backHome")}
            </Link>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BookingConfirmation;