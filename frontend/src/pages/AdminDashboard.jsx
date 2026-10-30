import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  BedDouble,
  CalendarCheck,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  LayoutDashboard,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import AdminSidebar from "../components/AdminSidebar";

const INITIAL_STATS = {
  total_users: 0,
  total_rooms: 0,
  total_bookings: 0,
  total_revenue: 0,
  pending_payments: 0,
  paid_payments: 0,
  failed_payments: 0,
  refunded_payments: 0,
};

const STAT_CARDS = [
  {
    key: "total_users",
    title: "Total Users",
    icon: Users,
    color: "blue",
  },
  {
    key: "total_rooms",
    title: "Total Rooms",
    icon: BedDouble,
    color: "violet",
  },
  {
    key: "total_bookings",
    title: "Total Bookings",
    icon: CalendarCheck,
    color: "emerald",
  },
  {
    key: "total_revenue",
    title: "Paid Revenue",
    icon: DollarSign,
    color: "amber",
    money: true,
  },
];

const PAYMENT_CARDS = [
  {
    key: "pending_payments",
    title: "Pending",
    icon: Clock,
    color: "amber",
  },
  {
    key: "paid_payments",
    title: "Paid",
    icon: CheckCircle,
    color: "emerald",
  },
  {
    key: "failed_payments",
    title: "Failed",
    icon: XCircle,
    color: "rose",
  },
  {
    key: "refunded_payments",
    title: "Refunded",
    icon: RotateCcw,
    color: "blue",
  },
];

const COLOR_STYLES = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    value: "text-blue-700",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600",
    value: "text-violet-700",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    value: "text-emerald-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    value: "text-amber-700",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    value: "text-rose-700",
  },
};

const QUICK_ACTIONS = [
  {
    title: "Manage Rooms",
    description: "View and update hotel rooms",
    path: "/admin/rooms",
    icon: BedDouble,
    color: "blue",
  },
  {
    title: "Manage Bookings",
    description: "Review customer reservations",
    path: "/admin/bookings",
    icon: CalendarCheck,
    color: "emerald",
  },
  {
    title: "Manage Users",
    description: "View registered customers",
    path: "/admin/users",
    icon: Users,
    color: "violet",
  },
  {
    title: "Manage Payments",
    description: "Review payment records",
    path: "/admin/payments",
    icon: DollarSign,
    color: "amber",
  },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value) {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function getBookingStatus(status) {
  const normalized = String(status || "pending").toLowerCase();

  const styles = {
    confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
    checked_in: "bg-blue-50 text-blue-700 ring-blue-600/20",
    checked_out: "bg-gray-100 text-gray-700 ring-gray-500/20",
  };

  return {
    label: normalized.replaceAll("_", " "),
    className:
      styles[normalized] ||
      "bg-gray-100 text-gray-700 ring-gray-500/20",
  };
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(INITIAL_STATS);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        navigate("/login");
        return;
      }

      let user;

      try {
        user = JSON.parse(userData);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (user?.role !== "admin") {
        navigate("/");
        return;
      }

      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/admin/dashboard",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load dashboard."
        );
      }

      const dashboardData = data?.data;

      if (!dashboardData) {
        throw new Error("The server returned an unexpected response.");
      }

      setStats({
        ...INITIAL_STATS,
        ...(dashboardData.stats || {}),
      });

      setRecentBookings(
        Array.isArray(dashboardData.recentBookings)
          ? dashboardData.recentBookings
          : []
      );
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.message ||
          "Unable to load dashboard. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const bookingChartData = useMemo(() => {
    const counts = recentBookings.reduce((acc, booking) => {
      const status = String(booking.booking_status || "unknown")
        .toLowerCase()
        .replaceAll(" ", "_");

      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([status, total]) => ({
      status: status
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      total,
    }));
  }, [recentBookings]);

  const paymentChartData = useMemo(
    () => [
      { name: "Pending", value: Number(stats.pending_payments || 0), color: "#f59e0b" },
      { name: "Paid", value: Number(stats.paid_payments || 0), color: "#16a34a" },
      { name: "Failed", value: Number(stats.failed_payments || 0), color: "#dc2626" },
      { name: "Refunded", value: Number(stats.refunded_payments || 0), color: "#2563eb" },
    ],
    [stats],
  );

  const visiblePaymentData = paymentChartData.filter((item) => item.value > 0);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />

        <main className="flex min-w-0 flex-1 items-center justify-center p-6">
          <div className="text-center">
            <RefreshCw
              size={34}
              className="mx-auto animate-spin text-blue-600"
            />
            <p className="mt-4 font-medium text-gray-700">
              Loading your dashboard...
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Please wait a moment.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <header className="mb-8">
            <Link
              to="/"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Back to Website
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <LayoutDashboard size={17} />
                  HOTEL MANAGEMENT
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Admin Dashboard
                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Monitor hotel performance, bookings, and payments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </header>

          {/* Error notice */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <AlertCircle
                  size={21}
                  className="mt-0.5 shrink-0 text-rose-600"
                />
                <div>
                  <p className="font-semibold text-rose-800">
                    Could not refresh dashboard data
                  </p>
                  <p className="mt-1 wrap-break-word text-sm text-rose-700">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Main statistics */}
          <section className="mb-9">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Hotel Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                A summary of your hotel's current activity.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STAT_CARDS.map((card) => {
                const Icon = card.icon;
                const colors = COLOR_STYLES[card.color];
                const value = stats[card.key] ?? 0;

                return (
                  <article
                    key={card.key}
                    className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500">
                          {card.title}
                        </p>

                        <p
                          className={`mt-3 wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl ${
                            colors.value
                          }`}
                        >
                          {card.money
                            ? `$${formatMoney(value)}`
                            : Number(value).toLocaleString()}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 rounded-xl p-3 ${colors.icon}`}
                      >
                        <Icon size={23} />
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-400">
                        Current recorded total
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Payment overview */}
          <section className="mb-9">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Payment Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Payment counts recorded by the system.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              {PAYMENT_CARDS.map((card) => {
                const Icon = card.icon;
                const colors = COLOR_STYLES[card.color];

                return (
                  <article
                    key={card.key}
                    className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`shrink-0 rounded-lg p-2.5 ${colors.icon}`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500 sm:text-sm">
                          {card.title}
                        </p>

                        <p
                          className={`mt-1 text-2xl font-bold ${colors.value}`}
                        >
                          {Number(stats[card.key] ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Quick actions */}
          <section className="mb-9">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Open a management section.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                const colors = COLOR_STYLES[action.color];

                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className="group flex min-w-0 items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div
                      className={`shrink-0 rounded-xl p-3 ${colors.icon}`}
                    >
                      <Icon size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {action.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-gray-400 transition group-hover:text-blue-600"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Booking analytics */}
          <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">Booking Statistics</h2>
            <p className="mb-5 mt-1 text-sm text-gray-500">
              Recent bookings grouped by status
            </p>
            {bookingChartData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" name="Bookings" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-gray-500">
                No recent booking data available.
              </p>
            )}
          </section>

          {/* Payment analytics */}
          <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">Payment Analytics</h2>
            <p className="mb-5 mt-1 text-sm text-gray-500">
              Breakdown of recorded payment statuses
            </p>
            {visiblePaymentData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visiblePaymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius="65%"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {visiblePaymentData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-gray-500">
                No payment data available.
              </p>
            )}
          </section>

          {/* Recent bookings */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Recent Bookings
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Latest reservations recorded by your hotel.
                </p>
              </div>

              <Link
                to="/admin/bookings"
                className="inline-flex items-center gap-2 self-start text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                View All
                <ArrowUpRight size={16} />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <CalendarCheck
                  size={36}
                  className="mx-auto text-gray-300"
                />
                <p className="mt-3 font-semibold text-gray-700">
                  No bookings yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  New reservations will appear here.
                </p>
              </div>
            ) : (
              <>
              
                {/* Desktop/tablet table */}
                <div className="hidden md:block">
                  <table className="w-full table-fixed text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-[24%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                          Customer
                        </th>
                        <th className="w-[18%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                          Room
                        </th>
                        <th className="w-[15%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                          Check-in
                        </th>
                        <th className="w-[15%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                          Check-out
                        </th>
                        <th className="w-[13%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                          Amount
                        </th>
                        <th className="w-[15%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {recentBookings.map((booking) => {
                        const status = getBookingStatus(
                          booking.booking_status
                        );

                        return (
                          <tr
                            key={booking.id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="px-4 py-4 lg:px-6">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {booking.customer_name || "Guest"}
                              </p>
                              <p className="mt-1 truncate text-xs text-gray-500">
                                {booking.customer_email || "No email"}
                              </p>
                            </td>

                            <td className="px-4 py-4 lg:px-6">
                              <p className="truncate text-sm font-medium text-gray-800">
                                {booking.room_name || "Hotel Room"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Room {booking.room_number ?? "—"}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-600 lg:px-6">
                              {formatDate(booking.check_in)}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-600 lg:px-6">
                              {formatDate(booking.check_out)}
                            </td>

                            <td className="px-4 py-4 text-sm font-bold text-gray-900 lg:px-6">
                              ${formatMoney(booking.total_amount)}
                            </td>

                            <td className="px-4 py-4 lg:px-6">
                              <span
                                className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile booking cards */}
                <div className="space-y-3 p-4 md:hidden">
                  {recentBookings.map((booking) => {
                    const status = getBookingStatus(
                      booking.booking_status
                    );

                    return (
                      <article
                        key={booking.id}
                        className="rounded-xl border border-gray-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {booking.customer_name || "Guest"}
                            </p>
                            <p className="mt-1 break-all text-xs text-gray-500">
                              {booking.customer_email || "No email"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">
                              Room
                            </p>
                            <p className="mt-1 truncate text-sm font-medium text-gray-800">
                              {booking.room_name || "Hotel Room"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Room {booking.room_number ?? "—"}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">
                              Total Amount
                            </p>
                            <p className="mt-1 font-bold text-blue-700">
                              ${formatMoney(booking.total_amount)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Check-in
                            </p>
                            <p className="mt-1 text-sm text-gray-800">
                              {formatDate(booking.check_in)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Check-out
                            </p>
                            <p className="mt-1 text-sm text-gray-800">
                              {formatDate(booking.check_out)}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 sm:px-6">
              <p className="text-xs text-gray-500">
                Showing {recentBookings.length} recent booking
                {recentBookings.length === 1 ? "" : "s"}.
              </p>
            </div>
          </section>

          <footer className="py-6 text-center text-xs text-gray-400">
            Hotel Management System · Admin Dashboard
          </footer>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;