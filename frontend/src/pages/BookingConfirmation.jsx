import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  CalendarDays,
  Users,
  Moon,
  CreditCard,
  ClipboardList,
  ArrowLeft,
  Mail,
  QrCode,
  BadgeCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../i18n/useLanguage";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80";

function BookingConfirmation() {
  const location = useLocation();
  const { t, formatDate } = useLanguage();

  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="min-h-screen">
        <Navbar />

        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-50 text-gold-600">
            <ClipboardList size={30} />
          </span>

          <h1 className="mt-6 text-3xl font-semibold text-ink">
            {t("confirm.notFoundTitle")}
          </h1>

          <p className="mt-3 text-gray-500">{t("confirm.notFoundText")}</p>

          <Link to="/my-bookings" className="btn-gold mt-8">
            <ClipboardList size={18} />
            {t("nav.myBookings")}
          </Link>
        </main>

        <Footer />
      </div>
    );
  }

  const nights = Number(booking.nights) || 0;

  const details = [
    { icon: CalendarDays, label: t("common.checkIn"), value: formatDate(booking.check_in) },
    { icon: CalendarDays, label: t("common.checkOut"), value: formatDate(booking.check_out) },
    {
      icon: Users,
      label: t("common.guests"),
      value:
        Number(booking.guests) === 1
          ? t("home.guestOption1")
          : t("home.guestOptionN", { count: booking.guests }),
    },
    {
      icon: Moon,
      label: t("confirm.nightsLabel"),
      value: nights === 1 ? t("room.night") : t("room.nights", { count: nights }),
    },
  ];

  const steps = [
    { icon: Mail, title: t("confirm.step1Title"), text: t("confirm.step1Text") },
    { icon: QrCode, title: t("confirm.step2Title"), text: t("confirm.step2Text") },
    { icon: BadgeCheck, title: t("confirm.step3Title"), text: t("confirm.step3Text") },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">

        {/* Success header */}
        <div className="text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 text-green-600 ring-8 ring-green-50/50">
            <CheckCircle2 size={44} />
          </span>

          <h1 className="mt-6 text-4xl font-semibold text-ink md:text-5xl">
            {t("confirm.title")}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-500">{t("confirm.text")}</p>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm shadow-sm ring-1 ring-black/5">
            <span className="text-gray-500">{t("confirm.bookingId")}</span>
            <span className="font-semibold text-gold-700">#{booking.booking_id}</span>
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">

          {/* Booking card */}
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="relative h-48 md:h-56">
              <img
                src={booking.room_image || FALLBACK_IMAGE}
                onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                alt={booking.room_name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent"></div>

              <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4 text-white">
                <div>
                  <h2 className="text-2xl font-semibold">{booking.room_name}</h2>
                  <p className="text-sm text-white/80">
                    {t("common.roomNumber", { number: booking.room_number })}
                  </p>
                </div>

                <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-ink">
                  {t(`status.${booking.booking_status}`)}
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 rounded-2xl bg-cream p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-gold-600 shadow-sm">
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="font-semibold text-ink">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {booking.special_request && (
                <div className="mt-6 rounded-2xl border border-dashed border-gold-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">
                    {t("common.specialRequest")}
                  </p>
                  <p className="mt-1 text-gray-600">{booking.special_request}</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                <span className="text-gray-500">{t("common.totalAmount")}</span>
                <span className="font-display text-3xl font-semibold text-ink">
                  ${Number(booking.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* Next steps + actions */}
          <aside className="flex flex-col gap-6">
            <section className="rounded-3xl bg-ink p-6 text-white md:p-8">
              <h2 className="text-2xl font-semibold">{t("confirm.nextTitle")}</h2>

              <ol className="mt-6 space-y-5">
                {steps.map(({ icon: Icon, title, text }, index) => (
                  <li key={title} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-500/20 text-gold-300">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="font-semibold">
                        {index + 1}. {title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-400">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <Link to={`/payment/${booking.booking_id}`} className="btn-gold w-full py-4">
              <CreditCard size={18} />
              {t("confirm.goToPayment")}
            </Link>

            <Link
              to="/my-bookings"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3.5 font-semibold text-gray-700 transition hover:border-gold-400 hover:text-gold-700"
            >
              <ClipboardList size={18} />
              {t("nav.myBookings")}
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gold-700"
            >
              <ArrowLeft size={16} />
              {t("confirm.backHome")}
            </Link>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BookingConfirmation;
