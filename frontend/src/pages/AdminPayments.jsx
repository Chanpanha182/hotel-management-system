import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  RefreshCw,
  AlertCircle,
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Loader2,
  Lock,
  X,
} from "lucide-react";


import AdminSidebar from "../components/AdminSidebar";

const API_URL = import.meta.env.VITE_API_URL + "/api/admin/payments";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  refunded: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
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

function statusLabel(status) {
  return (
    STATUSES.find((s) => s.value === status)?.label ||
    String(status || "Unknown")
  );
}

/*
 * Which statuses can this payment move to? (Same rules as before.)
 *  - refunded                          -> locked
 *  - paid                              -> can only be refunded
 *  - unpaid + cancelled booking        -> locked
 *  - pending / failed                  -> pending, paid or failed
 */
function getPaymentControl(payment) {
  const status = payment.payment_status;
  const bookingCancelled = payment.booking_status === "cancelled";

  if (status === "refunded") {
    return { locked: true, label: "Refunded", tone: "blue" };
  }

  if (status === "paid") {
    return {
      locked: false,
      options: [
        { value: "paid", label: "Paid" },
        { value: "refunded", label: "Refunded" },
      ],
    };
  }

  if (bookingCancelled) {
    return { locked: true, label: "Booking Cancelled", tone: "rose" };
  }

  return {
    locked: false,
    options: [
      { value: "pending", label: "Pending" },
      { value: "paid", label: "Paid" },
      { value: "failed", label: "Failed" },
    ],
  };
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

function BookingBadge({ status }) {
  const cancelled = status === "cancelled";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        cancelled
          ? "bg-rose-50 text-rose-700 ring-rose-600/20"
          : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      }`}
    >
      {cancelled ? "Cancelled" : "Active"}
    </span>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone, valueTone }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className={`shrink-0 rounded-xl p-3 ${tone}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p
          className={`truncate text-2xl font-bold tracking-tight ${
            valueTone || "text-gray-900"
          }`}
        >
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
      </div>
    </article>
  );
}

function PaymentControl({ payment, updating, onChange, fullWidth = false }) {
  const control = getPaymentControl(payment);

  if (control.locked) {
    const tones = {
      blue: "bg-blue-50 text-blue-600",
      rose: "bg-rose-50 text-rose-600",
    };

    return (
      <div
        className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
          fullWidth ? "w-full" : ""
        } ${tones[control.tone]}`}
      >
        <Lock size={14} />
        {control.label}
      </div>
    );
  }

  return (
    <div className={`relative ${fullWidth ? "w-full" : "inline-block"}`}>
      <select
        value={payment.payment_status}
        disabled={updating}
        onChange={(e) => onChange(payment, e.target.value)}
        aria-label={`Change status for payment ${payment.id}`}
        className={`${INPUT_CLASS} py-2 pr-9 disabled:opacity-60 ${
          fullWidth ? "" : "w-auto min-w-[8.5rem]"
        }`}
      >
        {control.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
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

function ConfirmDialog({ dialog, working, onClose, onConfirm }) {
  useEffect(() => {
    if (!dialog) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape" && !working) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, working, onClose]);

  if (!dialog) return null;

  const refund = dialog.status === "refunded";
  const Icon = refund ? RotateCcw : CheckCircle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={() => !working && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
            refund ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <Icon size={22} />
        </div>

        <h3
          id="payment-confirm-title"
          className="text-lg font-bold text-gray-900"
        >
          {refund ? "Refund this payment?" : "Mark this payment as paid?"}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">
            ${formatMoney(dialog.payment.amount)}
          </span>{" "}
          from{" "}
          <span className="font-semibold text-gray-700">
            {dialog.payment.customer_name || "this customer"}
          </span>{" "}
          (booking #{dialog.payment.booking_id}).{" "}
          {refund
            ? "A refunded payment can't be changed again."
            : "A paid payment can only be refunded afterwards."}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={working}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
              refund
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {working && <Loader2 size={16} className="animate-spin" />}
            {refund ? "Refund Payment" : "Mark as Paid"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

function AdminPayments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [updatingId, setUpdatingId] = useState(null);
  const [dialog, setDialog] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
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

  const fetchPayments = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setLoadError("");

      try {
        const result = await api();
        setPayments(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error("Fetch payments error:", err);
        setLoadError(err.message || "Unable to load payments.");
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

    fetchPayments();
  }, [navigate, fetchPayments]);

  /* --------------------------- Status updates ------------------------- */

  const applyStatus = async (payment, status) => {
    setUpdatingId(payment.id);

    try {
      const result = await api(`/${payment.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ payment_status: status }),
      });

      setToast({
        type: "success",
        message: result.message || "Payment status updated.",
      });

      setDialog(null);
      await fetchPayments(true);
    } catch (err) {
      console.error("Update payment error:", err);
      setToast({ type: "error", message: err.message });
      setDialog(null);
      // Refresh so the dropdown goes back to the real value
      fetchPayments(true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = (payment, status) => {
    if (status === payment.payment_status) return;

    // Marking as paid or refunding moves money, so ask first.
    if (status === "paid" || status === "refunded") {
      setDialog({ payment, status });
      return;
    }

    applyStatus(payment, status);
  };

  /* --------------------- Derived data (stats, list) ------------------- */

  const stats = useMemo(() => {
    const sum = (status) =>
      payments
        .filter((p) => p.payment_status === status)
        .reduce((total, p) => total + (Number(p.amount) || 0), 0);

    const count = (status) =>
      payments.filter((p) => p.payment_status === status).length;

    return {
      total: payments.length,
      paidAmount: sum("paid"),
      paidCount: count("paid"),
      refundedAmount: sum("refunded"),
      refundedCount: count("refunded"),
      pendingAmount: sum("pending"),
      pendingCount: count("pending"),
    };
  }, [payments]);

  const methodOptions = useMemo(
    () =>
      Array.from(
        new Set(payments.map((p) => p.payment_method).filter(Boolean))
      ).sort(),
    [payments]
  );

  const visiblePayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = payments.filter((payment) => {
      if (statusFilter !== "all" && payment.payment_status !== statusFilter) {
        return false;
      }

      if (methodFilter !== "all" && payment.payment_method !== methodFilter) {
        return false;
      }

      if (!query) return true;

      return [
        payment.id,
        payment.booking_id,
        payment.customer_name,
        payment.customer_email,
        payment.room_name,
        payment.room_number,
        payment.payment_method,
      ]
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(query));
    });

    const sorters = {
      newest: (a, b) => Number(b.id) - Number(a.id),
      amount_desc: (a, b) => Number(b.amount) - Number(a.amount),
      amount_asc: (a, b) => Number(a.amount) - Number(b.amount),
      name: (a, b) =>
        String(a.customer_name || "").localeCompare(
          String(b.customer_name || "")
        ),
    };

    return [...filtered].sort(sorters[sortBy]);
  }, [payments, search, statusFilter, methodFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || methodFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
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
                  <CreditCard size={17} />
                  PAYMENT MANAGEMENT
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Payments
                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Monitor and manage customer payments.
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
                  onClick={() => fetchPayments(true)}
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
                  to="/admin/bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  <CalendarCheck size={16} />
                  Bookings
                </Link>
              </div>
            </div>
          </header>

          {/* Summary */}
          <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Total Payments"
              value={stats.total}
              hint="All payment records"
              icon={Wallet}
              tone="bg-violet-50 text-violet-600"
            />
            <StatCard
              label="Total Paid"
              value={`$${formatMoney(stats.paidAmount)}`}
              hint={`${stats.paidCount} paid payment${
                stats.paidCount === 1 ? "" : "s"
              }`}
              icon={CheckCircle}
              tone="bg-emerald-50 text-emerald-600"
              valueTone="text-emerald-700"
            />
            <StatCard
              label="Total Refunded"
              value={`$${formatMoney(stats.refundedAmount)}`}
              hint={`${stats.refundedCount} refund${
                stats.refundedCount === 1 ? "" : "s"
              }`}
              icon={RotateCcw}
              tone="bg-blue-50 text-blue-600"
              valueTone="text-blue-700"
            />
            <StatCard
              label="Awaiting Payment"
              value={`$${formatMoney(stats.pendingAmount)}`}
              hint={`${stats.pendingCount} pending payment${
                stats.pendingCount === 1 ? "" : "s"
              }`}
              icon={Clock}
              tone="bg-amber-50 text-amber-600"
              valueTone="text-amber-700"
            />
          </section>

          {/* Payment list */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  All Payments
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {visiblePayments.length} of {payments.length} payment
                  {payments.length === 1 ? "" : "s"}.
                </p>
              </div>

              {/* Status tabs */}
              <div
                className="mb-4 flex gap-2 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Filter by payment status"
              >
                {[{ value: "all", label: "All" }, ...STATUSES].map((tab) => {
                  const active = statusFilter === tab.value;
                  const count =
                    tab.value === "all"
                      ? payments.length
                      : payments.filter((p) => p.payment_status === tab.value)
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

              {/* Search + filters */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by customer, email, room, booking # or method..."
                    aria-label="Search payments"
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  aria-label="Filter by payment method"
                  className={`${INPUT_CLASS} lg:w-44`}
                >
                  <option value="all">All methods</option>
                  {methodOptions.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort payments"
                  className={`${INPUT_CLASS} lg:w-52`}
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
                  Loading payments...
                </p>
              </div>
            ) : loadError ? (
              <div className="px-5 py-14 text-center">
                <AlertCircle size={34} className="mx-auto text-rose-400" />
                <p className="mt-3 font-semibold text-gray-800">
                  Couldn't load payments
                </p>
                <p className="mt-1 text-sm text-gray-500">{loadError}</p>
                <button
                  type="button"
                  onClick={() => fetchPayments(true)}
                  className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Try Again
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <CreditCard size={36} className="mx-auto text-gray-300" />
                <p className="mt-3 font-semibold text-gray-700">
                  No payment records yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Payments will appear here once customers book.
                </p>
              </div>
            ) : visiblePayments.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <Search size={32} className="mx-auto text-gray-300" />
                <p className="mt-3 font-semibold text-gray-700">
                  No payments match your filters
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
                          "Booking",
                          "Amount",
                          "Method",
                          "Booking Status",
                          "Payment Status",
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
                      {visiblePayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-4 py-4 lg:px-6">
                            <p className="text-sm font-semibold text-gray-900">
                              {payment.customer_name || "Guest"}
                            </p>
                            <p className="mt-0.5 break-all text-xs text-gray-500">
                              {payment.customer_email || "No email"}
                            </p>
                          </td>

                          <td className="px-4 py-4 lg:px-6">
                            <p className="text-sm font-medium text-gray-900">
                              {payment.room_name || "Hotel Room"}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Room {payment.room_number ?? "—"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 lg:px-6">
                            <p className="text-sm font-medium text-gray-900">
                              #{payment.booking_id}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {formatDate(payment.check_in)}
                              <span className="mx-1 text-gray-300">→</span>
                              {formatDate(payment.check_out)}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-sm font-bold text-gray-900 lg:px-6">
                            ${formatMoney(payment.amount)}
                          </td>

                          <td className="px-4 py-4 text-sm capitalize text-gray-700 lg:px-6">
                            {payment.payment_method || "—"}
                          </td>

                          <td className="px-4 py-4 lg:px-6">
                            <BookingBadge status={payment.booking_status} />
                          </td>

                          <td className="px-4 py-4 lg:px-6">
                            <StatusBadge status={payment.payment_status} />
                          </td>

                          <td className="px-4 py-4 lg:px-6">
                            <PaymentControl
                              payment={payment}
                              updating={updatingId === payment.id}
                              onChange={handleStatusChange}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-4 p-4 md:hidden">
                  {visiblePayments.map((payment) => (
                    <article
                      key={payment.id}
                      className="rounded-xl border border-gray-100 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">
                            Payment #{payment.id}
                          </p>
                          <h3 className="truncate font-bold text-gray-900">
                            {payment.customer_name || "Guest"}
                          </h3>
                          <p className="mt-0.5 break-all text-xs text-gray-500">
                            {payment.customer_email || "No email"}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <StatusBadge status={payment.payment_status} />
                        </div>
                      </div>

                      <div className="mt-4 flex items-end justify-between rounded-lg bg-gray-50 p-3">
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-xl font-bold text-gray-900">
                            ${formatMoney(payment.amount)}
                          </p>
                        </div>

                        <p className="text-sm font-medium capitalize text-gray-600">
                          {payment.payment_method || "—"}
                        </p>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <BedDouble size={14} />
                            Room
                          </span>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {payment.room_name || "Hotel Room"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Room {payment.room_number ?? "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <CalendarCheck size={14} />
                            Booking
                          </span>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              #{payment.booking_id}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(payment.check_in)} →{" "}
                              {formatDate(payment.check_out)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <XCircle size={14} />
                            Booking status
                          </span>
                          <BookingBadge status={payment.booking_status} />
                        </div>
                      </div>

                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="mb-2 text-xs text-gray-500">
                          Update payment
                        </p>
                        <PaymentControl
                          payment={payment}
                          updating={updatingId === payment.id}
                          onChange={handleStatusChange}
                          fullWidth
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <ConfirmDialog
        dialog={dialog}
        working={dialog ? updatingId === dialog.payment.id : false}
        onClose={() => setDialog(null)}
        onConfirm={() => dialog && applyStatus(dialog.payment, dialog.status)}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

export default AdminPayments;