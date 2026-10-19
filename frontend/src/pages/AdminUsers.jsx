import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  LayoutDashboard,
  CalendarCheck,
  Mail,
  Phone,
  Trash2,
  Loader2,
  Lock,
  X,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";

const API_URL = import.meta.env.VITE_API_URL + "/api/admin/users";

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Admin" },
];

const ROLE_STYLES = {
  admin: "bg-violet-50 text-violet-700 ring-violet-600/20",
  customer: "bg-gray-100 text-gray-700 ring-gray-500/20",
};

const AVATAR_STYLES = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name (A–Z)" },
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

function getInitials(name) {
  const parts = String(name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (
    (parts[0]?.[0] || "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

function avatarStyle(id) {
  return AVATAR_STYLES[Math.abs(Number(id) || 0) % AVATAR_STYLES.length];
}

function getStoredUserId() {
  try {
    const stored = JSON.parse(localStorage.getItem("user"));
    return stored?.id ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Small presentational components                                     */
/* ------------------------------------------------------------------ */

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        ROLE_STYLES[role] || ROLE_STYLES.customer
      }`}
    >
      {role || "customer"}
    </span>
  );
}

function Avatar({ user, size = "h-10 w-10" }) {
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarStyle(
        user.id
      )}`}
      aria-hidden="true"
    >
      {getInitials(user.name)}
    </div>
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

function RoleControl({ user, isSelf, updating, onChange, fullWidth = false }) {
  if (isSelf) {
    return (
      <div
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500 ${
          fullWidth ? "w-full" : ""
        }`}
      >
        <Lock size={14} />
        This is you
      </div>
    );
  }

  return (
    <div className={`relative ${fullWidth ? "w-full" : "inline-block"}`}>
      <select
        value={user.role}
        disabled={updating}
        onChange={(e) => onChange(user, e.target.value)}
        aria-label={`Change role for ${user.name}`}
        className={`${INPUT_CLASS} py-2 pr-9 disabled:opacity-60 ${
          fullWidth ? "" : "w-auto min-w-[8.5rem]"
        }`}
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
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

// One dialog used for both "change role" and "delete user".
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

  const destructive = dialog.tone === "danger";
  const Icon = dialog.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={() => !working && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
            destructive
              ? "bg-rose-50 text-rose-600"
              : "bg-violet-50 text-violet-600"
          }`}
        >
          <Icon size={20} />
        </div>

        <h3 id="confirm-title" className="text-lg font-bold text-gray-900">
          {dialog.title}
        </h3>

        <p className="mt-2 text-sm text-gray-500">{dialog.message}</p>

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
              destructive
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {working && <Loader2 size={16} className="animate-spin" />}
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

function AdminUsers() {
  const navigate = useNavigate();

  const currentUserId = useMemo(() => getStoredUserId(), []);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [workingId, setWorkingId] = useState(null);
  const [dialog, setDialog] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  const isSelf = (user) =>
    currentUserId !== null && Number(user.id) === Number(currentUserId);

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

  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setLoadError("");

      try {
        const result = await api();
        setUsers(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error("Fetch users error:", err);
        setLoadError(err.message || "Unable to load users.");
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

    fetchUsers();
  }, [navigate, fetchUsers]);

  /* ------------------------------ Actions ----------------------------- */

  const requestRoleChange = (user, role) => {
    if (role === user.role) return;

    const promoting = role === "admin";

    setDialog({
      type: "role",
      user,
      role,
      icon: ShieldCheck,
      tone: promoting ? "danger" : "neutral",
      title: promoting ? "Make this user an admin?" : "Remove admin access?",
      message: promoting
        ? `${user.name} will get full access to the admin panel, including rooms, bookings, payments and other users.`
        : `${user.name} will become a regular customer and lose access to the admin panel.`,
      confirmLabel: promoting ? "Make Admin" : "Make Customer",
    });
  };

  const requestDelete = (user) => {
    setDialog({
      type: "delete",
      user,
      icon: Trash2,
      tone: "danger",
      title: "Delete this user?",
      message: `${user.name} (${user.email}) will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete User",
    });
  };

  const confirmDialog = async () => {
    if (!dialog) return;

    const { type, user, role } = dialog;
    setWorkingId(user.id);

    try {
      const result =
        type === "role"
          ? await api(`/${user.id}/role`, {
              method: "PUT",
              body: JSON.stringify({ role }),
            })
          : await api(`/${user.id}`, { method: "DELETE" });

      setToast({
        type: "success",
        message:
          result.message ||
          (type === "role" ? "Role updated." : "User deleted."),
      });

      setDialog(null);
      await fetchUsers(true);
    } catch (err) {
      console.error("User action error:", err);
      setToast({ type: "error", message: err.message });
      setDialog(null);
    } finally {
      setWorkingId(null);
    }
  };

  /* --------------------- Derived data (stats, list) ------------------- */

  const stats = useMemo(() => {
    const now = new Date();

    const newThisMonth = users.filter((u) => {
      const created = new Date(u.created_at);
      return (
        !Number.isNaN(created.getTime()) &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      customers: users.filter((u) => u.role !== "admin").length,
      newThisMonth,
    };
  }, [users]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;

      if (!query) return true;

      return [user.id, user.name, user.email, user.phone]
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(query));
    });

    const time = (value) => {
      const t = new Date(value).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    const sorters = {
      newest: (a, b) => time(b.created_at) - time(a.created_at),
      oldest: (a, b) => time(a.created_at) - time(b.created_at),
      name: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
    };

    return [...filtered].sort(sorters[sortBy]);
  }, [users, search, roleFilter, sortBy]);

  const hasActiveFilters = search.trim() !== "" || roleFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
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
                  <Users size={17} />
                  USER MANAGEMENT
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Users
                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Manage registered customers and administrators.
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
                  onClick={() => fetchUsers(true)}
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
          <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Total Users"
              value={stats.total}
              icon={Users}
              tone="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Customers"
              value={stats.customers}
              icon={UserCheck}
              tone="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Admins"
              value={stats.admins}
              icon={ShieldCheck}
              tone="bg-violet-50 text-violet-600"
            />
            <StatCard
              label="New This Month"
              value={stats.newThisMonth}
              icon={UserPlus}
              tone="bg-amber-50 text-amber-600"
            />
          </section>

          {/* User list */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">All Users</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {visibleUsers.length} of {users.length} user
                  {users.length === 1 ? "" : "s"}.
                </p>
              </div>

              {/* Role tabs */}
              <div
                className="mb-4 flex gap-2 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Filter by role"
              >
                {[
                  { value: "all", label: "All" },
                  { value: "customer", label: "Customers" },
                  { value: "admin", label: "Admins" },
                ].map((tab) => {
                  const active = roleFilter === tab.value;
                  const count =
                    tab.value === "all"
                      ? users.length
                      : tab.value === "admin"
                      ? stats.admins
                      : stats.customers;

                  return (
                    <button
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setRoleFilter(tab.value)}
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
                    placeholder="Search by name, email, phone or user #..."
                    aria-label="Search users"
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort users"
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
                  Loading users...
                </p>
              </div>
            ) : loadError ? (
              <div className="px-5 py-14 text-center">
                <AlertCircle size={34} className="mx-auto text-rose-400" />
                <p className="mt-3 font-semibold text-gray-800">
                  Couldn't load users
                </p>
                <p className="mt-1 text-sm text-gray-500">{loadError}</p>
                <button
                  type="button"
                  onClick={() => fetchUsers(true)}
                  className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Try Again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <Users size={36} className="mx-auto text-gray-300" />
                <p className="mt-3 font-semibold text-gray-700">
                  No users yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Registered accounts will appear here.
                </p>
              </div>
            ) : visibleUsers.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <Search size={32} className="mx-auto text-gray-300" />
                <p className="mt-3 font-semibold text-gray-700">
                  No users match your filters
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
                        {["User", "Phone", "Role", "Registered", "Actions"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className={`px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6 ${
                                heading === "Actions" ? "text-right" : ""
                              }`}
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {visibleUsers.map((user) => {
                        const self = isSelf(user);
                        const working = workingId === user.id;

                        return (
                          <tr
                            key={user.id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="px-4 py-4 lg:px-6">
                              <div className="flex items-center gap-3">
                                <Avatar user={user} />
                                <div className="min-w-0">
                                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    {user.name}
                                    {self && (
                                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                                        You
                                      </span>
                                    )}
                                  </p>
                                  <p className="mt-0.5 break-all text-xs text-gray-500">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700 lg:px-6">
                              {user.phone || "—"}
                            </td>

                            <td className="px-4 py-4 lg:px-6">
                              <RoleBadge role={user.role} />
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 lg:px-6">
                              {formatDate(user.created_at)}
                            </td>

                            <td className="px-4 py-4 lg:px-6">
                              <div className="flex items-center justify-end gap-2">
                                <RoleControl
                                  user={user}
                                  isSelf={self}
                                  updating={working}
                                  onChange={requestRoleChange}
                                />

                                <button
                                  type="button"
                                  disabled={self || working}
                                  onClick={() => requestDelete(user)}
                                  aria-label={`Delete ${user.name}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-4 p-4 md:hidden">
                  {visibleUsers.map((user) => {
                    const self = isSelf(user);
                    const working = workingId === user.id;

                    return (
                      <article
                        key={user.id}
                        className="rounded-xl border border-gray-100 bg-white p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar user={user} size="h-11 w-11" />

                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-400">
                              User #{user.id}
                            </p>
                            <h3 className="flex items-center gap-2 truncate font-bold text-gray-900">
                              {user.name}
                              {self && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                                  You
                                </span>
                              )}
                            </h3>
                          </div>

                          <div className="shrink-0">
                            <RoleBadge role={user.role} />
                          </div>
                        </div>

                        <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                          <p className="flex items-center gap-2 break-all">
                            <Mail
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            {user.email}
                          </p>

                          <p className="flex items-center gap-2">
                            <Phone
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            {user.phone || "No phone"}
                          </p>

                          <p className="flex items-center gap-2">
                            <CalendarCheck
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            Joined {formatDate(user.created_at)}
                          </p>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <p className="mb-2 text-xs text-gray-500">
                            User actions
                          </p>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <RoleControl
                              user={user}
                              isSelf={self}
                              updating={working}
                              onChange={requestRoleChange}
                              fullWidth
                            />

                            <button
                              type="button"
                              disabled={self || working}
                              onClick={() => requestDelete(user)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 sm:w-auto"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>

                          {self && (
                            <p className="mt-2 text-xs text-gray-500">
                              You can't change or delete your own account.
                            </p>
                          )}
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

      <ConfirmDialog
        dialog={dialog}
        working={dialog ? workingId === dialog.user.id : false}
        onClose={() => setDialog(null)}
        onConfirm={confirmDialog}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

export default AdminUsers;