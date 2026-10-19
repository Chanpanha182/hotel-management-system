import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  LogIn,
  LogOut,
  XCircle,
  Search,
  RefreshCw,
  AlertCircle,
  LayoutDashboard,
  BedDouble,
  Users,
  Mail,
  Phone,
  Moon,
  Loader2,
  Lock,
  X,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";

const API_URL = import.meta.env.VITE_API_URL + "/api/admin/bookings";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "checked_out", label: "Checked Out" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  checked_in: "bg-blue-50 text-blue-700 ring-blue-600/20",
  checked_out: "bg-gray-100 text-gray-700 ring-gray-500/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "check_in", label: "Check-in date" },
  { value: "total_desc", label: "Highest total" },
  { value: "name", label: "Customer (A–Z)" },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

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

function getNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : null;
}

function statusLabel(status) {
  return (
    STATUSES.find((s) => s.value === status)?.label ||
    String(status || "Unknown")
  );
}

function isLockedStatus(status) {
  return status === "cancelled" || status === "checked_out";
}

/* ------------------------------------------------------------------ */
/* Small presentational components                                     */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-700 ring-gray-500/20"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`shrink-0 rounded-xl p-3 ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </article>
  );
}

// Dropdown to change a booking's status, or a locked label once it's final.
function StatusControl({ booking, updating, onChange, fullWidth = false }) {
  if (isLockedStatus(booking.booking_status)) {
    const cancelled = booking.booking_status === "cancelled";

    return (
      <div
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
          fullWidth ? "w-full" : ""
        } ${
          cancelled ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500"
        }`}
      >
        <Lock size={14} />
        {cancelled ? "Cancelled" : "Completed"}
      </div>
    );
  }

  return (
    <div className={`relative ${fullWidth ? "w-full" : "inline-block"}`}>
      <select
        value={booking.booking_status}
        onChange={(e) => onChange(booking, e.target.value)}
        disabled={updating}
        aria-label={`Change status for booking ${booking.id}`}
        className={`${INPUT_CLASS} py-2 pr-9 disabled:opacity-60 ${
          fullWidth ? "" : "w-auto min-w-[9.5rem]"
        }`}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {updating && (
        <Loader2
          size={15}
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
        />
      )}
    </div>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="ml-1 shrink-0 opacity-60 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function CancelDialog({ booking, working, onClose, onConfirm }) {
  useEffect(() => {
    if (!booking) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape" && !working) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booking, working, onClose]);

  if (!booking) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={() => !working && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <XCircle size={22} />
        </div>

        <h3
          id="cancel-booking-title"
          className="text-lg font-bold text-gray-900"
        >
          Cancel this booking?
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Booking #{booking.id} for{" "}
          <span className="font-semibold text-gray-700">
            {booking.customer_name || "this guest"}
          </span>{" "}
          ({formatDate(booking.check_in)} – {formatDate(booking.check_out)})
          will be marked as cancelled. A cancelled booking can't be changed
          again.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Keep Booking
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={working}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            {working && <Loader2 size={16} className="animate-spin" />}
            {working ? "Cancelling..." : "Cancel Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

function AdminBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [updatingId, setUpdatingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  /* ---------------------------- API helper ---------------------------- */

  const api = useCallback(
    async (path = "", options = {}) => {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(result?.message || "Something went wrong.");
      }

      return result;
    },
    [navigate]
  );

  const fetchBookings = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setLoadError("");

      try {
        const result = await api();
        setBookings(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error("Fetch bookings error:", err);
        setLoadError(err.message || "Unable to load bookings.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [api]
  );

  /* ---------------------------- Admin guard --------------------------- */

  useEffect(() => {
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

    fetchBookings();
  }, [navigate, fetchBookings]);

  /* --------------------------- Status updates ------------------------- */

  const applyStatus = async (booking, status) => {
    setUpdatingId(booking.id);

    try {
      const result = await api(`/${booking.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ booking_status: status }),
      });

      setToast({
        type: "success",
        message: result.message || "Booking status updated.",
      });

      await fetchBookings(true);
    } catch (err) {
      console.error("Update status error:", err);
      setToast({ type: "error", message: err.message });
    } finally {
      setUpdatingId(null);
      setCancelTarget(null);
    }
  };

  const handleStatusChange = (booking, status) => {
    if (status === booking.booking_status) return;

    // Cancelling is final, so ask first.
    if (status === "cancelled") {
      setCancelTarget(booking);
      return;
    }

    applyStatus(booking, status);
  };

  /* --------------------- Derived data (stats, list) ------------------- */

  const stats = useMemo(() => {
    const count = (status) =>
      bookings.filter((b) => b.booking_status === status).length;

    return {
      total: bookings.length,
      pending: count("pending"),
      confirmed: count("confirmed"),
      checkedIn: count("checked_in"),
    };
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.booking_status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return [
        booking.id,
        booking.customer_name,
        booking.customer_email,
        booking.customer_phone,
        booking.room_name,
        booking.room_number,
      ]
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(query));
    });

    const time = (value) => {
      const t = new Date(value).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    const sorters = {
      newest: (a, b) => Number(b.id) - Number(a.id),
      check_in: (a, b) => time(a.check_in) - time(b.check_in),
      total_desc: (a, b) => Number(b.total_amount) - Number(a.total_amount),
      name: (a, b) =>
        String(a.customer_name || "").localeCompare(
          String(b.customer_name || "")
        ),
    };

    return [...filtered].sort(sorters[sortBy]);
  }, [bookings, search, statusFilter, sortBy]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  /* ------------------------------ Render ------------------------------ */

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          {/* Header */}
          <header className="mb-8 pt-12 lg:pt-0">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <CalendarCheck size={17} />
                  BOOKING MANAGEMENT
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Bookings
                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  View and manage customer reservations.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={() => fetchBookings(true)}
                  disabled={refreshing || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <Link
                  to="/admin/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  <BedDouble size={16} />
                  Manage Rooms
                </Link>
              </div>
            </div>
          </header>

          {/* Summary */}
          <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Total Bookings"
              value={stats.total}
              icon={CalendarCheck}
              tone="bg-violet-50 text-violet-600"
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              tone="bg-amber-50 text-amber-600"
            />
            <StatCard
              label="Confirmed"
              value={stats.confirmed}
              icon={CheckCircle}
              tone="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Checked In"
              value={stats.checkedIn}
              icon={LogIn}
              tone="bg-blue-50 text-blue-600"
            />
          </section>

          {/* Booking list */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  All Bookings
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {visibleBookings.length} of {bookings.length} booking
                  {bookings.length === 1 ? "" : "s"}.
                </p>
              </div>

              {/* Status tabs */}
              <div
                className="mb-4 flex gap-2 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Filter by status"
              >
                {[{ value: "all", label: "All" }, ...STATUSES].map((tab) => {
                  const active = statusFilter === tab.value;
                  const count =
                    tab.value === "all"
                      ? bookings.length
                      : bookings.filter((b) => b.booking_status === tab.value)
                          .length;

                  return (
                    <button
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStatusFilter(tab.value)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                        active
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`rounded-full px-1.5 text-xs ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-white text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search + sort */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by customer, email, phone, room or booking #..."
                    aria-label="Search bookings"
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort bookings"
                  className={`${INPUT_CLASS} sm:w-52`}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      Sort: {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="px-5 py-16 text-center">
                <RefreshCw
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />
                <p className="mt-3 text-sm font-medium text-gray-600">
                  Loading bookings...
                </p>
              </div>
            ) : loadError ? (
              <div className="px-5 py-14 text-center">
                <AlertCircle size={34} className="mx-auto text-rose-400" />
                <p className="mt-3 font-semibold text-gray-800">
                  Couldn't load bookings
                </p>
                <p className="mt-1 text-sm text-gray-500">{loadError}</p>
                <button
                  type="button"
                  onClick={() => fetchBookings(true)}
                  className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Try Again
                </button>
              </div>
            ) : bookings.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <CalendarCheck size={36} className="mx-auto text-gray-300" />
                <p className="mt-3 font-semibold text-gray-700">
                  No bookings yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  New reservations will appear here.
                </p>
              </div>
            ) : visibleBookings.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <Search size={32} className="mx-auto text-gray-300" />
                <p className="mt-3 font-semibold text-gray-700">
                  No bookings match your filters
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          "Customer",
                          "Room",
                          "Stay",
                          "Guests",
                          "Total",
                          "Status",
                          "Action",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {visibleBookings.map((booking) => {
                        const nights = getNights(
                          booking.check_in,
                          booking.check_out
                        );

                        return (
                          <tr
                            key={booking.id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="px-4 py-4 lg:px-6">
                              <p className="text-sm font-semibold text-gray-900">
                                {booking.customer_name || "Guest"}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {booking.customer_email || "No email"}
                              </p>
                              {booking.customer_phone && (
                                <p className="text-xs text-gray-500">
                                  {booking.customer_phone}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4 lg:px-6">
                              <p className="text-sm font-semibold text-gray-900">
                                {booking.room_name || "Hotel Room"}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Room {booking.room_number ?? "—"}
                                {booking.room_type
                                  ? ` · ${booking.room_type}`
                                  : ""}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 lg:px-6">
                              <p className="text-sm text-gray-900">
                                {formatDate(booking.check_in)}
                                <span className="mx-1.5 text-gray-300">→</span>
                                {formatDate(booking.check_out)}
                              </p>
                              {nights && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {nights} night{nights === 1 ? "" : "s"}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700 lg:px-6">
                              {booking.guests ?? "—"}
                            </td>

                            <td className="px-4 py-4 text-sm font-bold text-gray-900 lg:px-6">
                              ${formatMoney(booking.total_amount)}
                            </td>

                            <td className="px-4 py-4 lg:px-6">
                              <StatusBadge status={booking.booking_status} />
                            </td>

                            <td className="px-4 py-4 lg:px-6">
                              <StatusControl
                                booking={booking}
                                updating={updatingId === booking.id}
                                onChange={handleStatusChange}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-4 p-4 md:hidden">
                  {visibleBookings.map((booking) => {
                    const nights = getNights(
                      booking.check_in,
                      booking.check_out
                    );

                    return (
                      <article
                        key={booking.id}
                        className="rounded-xl border border-gray-100 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">
                              Booking #{booking.id}
                            </p>
                            <h3 className="truncate font-bold text-gray-900">
                              {booking.customer_name || "Guest"}
                            </h3>
                          </div>

                          <div className="shrink-0">
                            <StatusBadge status={booking.booking_status} />
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                          <p className="flex items-center gap-2 break-all">
                            <Mail
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            {booking.customer_email || "No email"}
                          </p>

                          {booking.customer_phone && (
                            <p className="flex items-center gap-2">
                              <Phone
                                size={14}
                                className="shrink-0 text-gray-400"
                              />
                              {booking.customer_phone}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 rounded-lg bg-gray-50 p-3">
                          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <BedDouble
                              size={15}
                              className="shrink-0 text-gray-400"
                            />
                            {booking.room_name || "Hotel Room"}
                          </p>
                          <p className="mt-0.5 pl-[23px] text-xs text-gray-500">
                            Room {booking.room_number ?? "—"}
                            {booking.room_type ? ` · ${booking.room_type}` : ""}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                          <div>
                            <p className="text-xs text-gray-500">Check-in</p>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {formatDate(booking.check_in)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Check-out</p>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {formatDate(booking.check_out)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Guests</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                              <Users size={14} className="text-gray-400" />
                              {booking.guests ?? "—"}
                              {nights && (
                                <span className="flex items-center gap-1 pl-1 text-xs font-normal text-gray-500">
                                  <Moon size={12} />
                                  {nights}
                                </span>
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="mt-1 text-sm font-bold text-blue-700">
                              ${formatMoney(booking.total_amount)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <p className="mb-2 text-xs text-gray-500">
                            Update status
                          </p>
                          <StatusControl
                            booking={booking}
                            updating={updatingId === booking.id}
                            onChange={handleStatusChange}
                            fullWidth
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <CancelDialog
        booking={cancelTarget}
        working={updatingId !== null && updatingId === cancelTarget?.id}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && applyStatus(cancelTarget, "cancelled")}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

export default AdminBookings;