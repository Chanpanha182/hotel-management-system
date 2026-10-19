import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BedDouble,
  Plus,
  X,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  LayoutDashboard,
  Users,
  Loader2,
  ImageOff,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";

const API_URL = import.meta.env.VITE_API_URL + "/api/admin/rooms";

const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Luxury"];

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
];

const STATUS_STYLES = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  occupied: "bg-amber-50 text-amber-700 ring-amber-600/20",
  maintenance: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const SORT_OPTIONS = [
  { value: "number", label: "Room number" },
  { value: "name", label: "Name (A–Z)" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const EMPTY_FORM = {
  room_number: "",
  room_name: "",
  room_type: "Deluxe",
  price: "",
  capacity: "",
  bed_type: "",
  room_size: "",
  description: "",
  facilities: "",
  image: "",
  status: "available",
};

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function formatMoney(value) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function parseFacilities(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Small presentational components                                     */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        STATUS_STYLES[key] || "bg-gray-100 text-gray-700 ring-gray-500/20"
      }`}
    >
      {key || "unknown"}
    </span>
  );
}

function RoomThumb({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  // Reset the error state whenever the URL changes
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`}
        aria-hidden="true"
      >
        <ImageOff size={22} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

function Field({ id, label, hint, className = "", children }) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
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

function ConfirmDialog({ room, deleting, onCancel, onConfirm }) {
  useEffect(() => {
    if (!room) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape" && !deleting) onCancel();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [room, deleting, onCancel]);

  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={() => !deleting && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-room-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 size={20} />
        </div>

        <h3 id="delete-room-title" className="text-lg font-bold text-gray-900">
          Delete this room?
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">
            {room.room_name} (Room {room.room_number})
          </span>{" "}
          will be permanently removed. This can't be undone.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting && <Loader2 size={16} className="animate-spin" />}
            {deleting ? "Deleting..." : "Delete Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

function AdminRooms() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("number");

  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  /* ---------------------------- API helper ---------------------------- */

  // Wraps fetch: adds the token, parses JSON, and handles expired sessions.
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

  const fetchRooms = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setLoadError("");

      try {
        const result = await api();
        setRooms(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error("Fetch rooms error:", err);
        setLoadError(err.message || "Unable to load rooms.");
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

    fetchRooms();
  }, [navigate, fetchRooms]);

  /* ------------------------------ Form ------------------------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeForm = () => {
    setForm(EMPTY_FORM);
    setEditingRoom(null);
    setFormError("");
    setShowForm(false);
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingRoom(null);
    setFormError("");
    setShowForm(true);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormError("");

    setForm({
      room_number: room.room_number ?? "",
      room_name: room.room_name ?? "",
      room_type: room.room_type || "Deluxe",
      price: room.price ?? "",
      capacity: room.capacity ?? "",
      bed_type: room.bed_type ?? "",
      room_size: room.room_size ?? "",
      description: room.description ?? "",
      facilities: room.facilities ?? "",
      image: room.image ?? "",
      status: room.status || "available",
    });

    setShowForm(true);
  };

  // Scroll the form into view whenever it opens
  useEffect(() => {
    if (showForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm, editingRoom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const roomNumber = String(form.room_number).trim();

    const duplicate = rooms.some(
      (room) =>
        String(room.room_number).trim().toLowerCase() ===
          roomNumber.toLowerCase() && room.id !== editingRoom?.id
    );

    if (duplicate) {
      setFormError(`Room ${roomNumber} already exists.`);
      return;
    }

    const price = Number(form.price);
    const capacity = Number(form.capacity);

    if (!Number.isFinite(price) || price < 0) {
      setFormError("Please enter a valid price.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      setFormError("Capacity must be a whole number of at least 1.");
      return;
    }

    const payload = {
      ...form,
      room_number: roomNumber,
      room_name: form.room_name.trim(),
      bed_type: form.bed_type.trim(),
      room_size: form.room_size.trim(),
      description: form.description.trim(),
      facilities: parseFacilities(form.facilities).join(", "),
      image: form.image.trim(),
      price,
      capacity,
    };

    setSaving(true);

    try {
      const result = await api(editingRoom ? `/${editingRoom.id}` : "", {
        method: editingRoom ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setToast({
        type: "success",
        message:
          result.message ||
          (editingRoom ? "Room updated." : "Room added."),
      });

      closeForm();
      fetchRooms(true);
    } catch (err) {
      console.error("Save room error:", err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------- Delete ------------------------------ */

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const result = await api(`/${deleteTarget.id}`, { method: "DELETE" });

      setToast({
        type: "success",
        message: result.message || "Room deleted.",
      });

      // If the deleted room was being edited, close the form
      if (editingRoom?.id === deleteTarget.id) closeForm();

      setDeleteTarget(null);
      fetchRooms(true);
    } catch (err) {
      console.error("Delete room error:", err);
      setToast({ type: "error", message: err.message });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  /* --------------------- Derived data (stats, list) ------------------- */

  const stats = useMemo(
    () => ({
      total: rooms.length,
      available: rooms.filter((r) => r.status === "available").length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      maintenance: rooms.filter((r) => r.status === "maintenance").length,
    }),
    [rooms]
  );

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set([...ROOM_TYPES, ...rooms.map((r) => r.room_type)].filter(Boolean))
      ),
    [rooms]
  );

  const visibleRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = rooms.filter((room) => {
      if (statusFilter !== "all" && room.status !== statusFilter) return false;
      if (typeFilter !== "all" && room.room_type !== typeFilter) return false;

      if (!query) return true;

      return [room.room_name, room.room_number, room.room_type, room.bed_type]
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(query));
    });

    const sorters = {
      number: (a, b) =>
        String(a.room_number).localeCompare(String(b.room_number), undefined, {
          numeric: true,
        }),
      name: (a, b) =>
        String(a.room_name).localeCompare(String(b.room_name)),
      price_asc: (a, b) => Number(a.price) - Number(b.price),
      price_desc: (a, b) => Number(b.price) - Number(a.price),
    };

    return [...filtered].sort(sorters[sortBy]);
  }, [rooms, search, statusFilter, typeFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
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
                  <BedDouble size={17} />
                  ROOM MANAGEMENT
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Rooms
                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Add, edit, and manage your hotel rooms.
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
                  onClick={() => fetchRooms(true)}
                  disabled={refreshing || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={showForm ? closeForm : openAddForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  {showForm ? <X size={16} /> : <Plus size={16} />}
                  {showForm ? "Close Form" : "Add Room"}
                </button>
              </div>
            </div>
          </header>

          {/* Summary */}
          <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Total Rooms"
              value={stats.total}
              icon={BedDouble}
              tone="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Available"
              value={stats.available}
              icon={CheckCircle}
              tone="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Occupied"
              value={stats.occupied}
              icon={Users}
              tone="bg-amber-50 text-amber-600"
            />
            <StatCard
              label="Maintenance"
              value={stats.maintenance}
              icon={AlertCircle}
              tone="bg-rose-50 text-rose-600"
            />
          </section>

          {/* Add / edit form */}
          {showForm && (
            <section
              ref={formRef}
              className="mb-8 scroll-mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingRoom
                      ? `Edit Room ${editingRoom.room_number}`
                      : "Add New Room"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Fields marked with * are required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close form"
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-5 md:grid-cols-2"
              >
                <Field id="room_number" label="Room Number *">
                  <input
                    id="room_number"
                    name="room_number"
                    value={form.room_number}
                    onChange={handleChange}
                    placeholder="e.g. 101"
                    className={INPUT_CLASS}
                    required
                  />
                </Field>

                <Field id="room_name" label="Room Name *">
                  <input
                    id="room_name"
                    name="room_name"
                    value={form.room_name}
                    onChange={handleChange}
                    placeholder="e.g. Ocean View Deluxe"
                    className={INPUT_CLASS}
                    required
                  />
                </Field>

                <Field id="room_type" label="Room Type">
                  <select
                    id="room_type"
                    name="room_type"
                    value={form.room_type}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="status" label="Status">
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="price" label="Price Per Night ($) *">
                  <input
                    id="price"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={INPUT_CLASS}
                    required
                  />
                </Field>

                <Field id="capacity" label="Guest Capacity *">
                  <input
                    id="capacity"
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="e.g. 2"
                    min="1"
                    step="1"
                    className={INPUT_CLASS}
                    required
                  />
                </Field>

                <Field id="bed_type" label="Bed Type">
                  <input
                    id="bed_type"
                    name="bed_type"
                    value={form.bed_type}
                    onChange={handleChange}
                    placeholder="e.g. King bed"
                    className={INPUT_CLASS}
                  />
                </Field>

                <Field id="room_size" label="Room Size">
                  <input
                    id="room_size"
                    name="room_size"
                    value={form.room_size}
                    onChange={handleChange}
                    placeholder="e.g. 35 m²"
                    className={INPUT_CLASS}
                  />
                </Field>

                <Field
                  id="image"
                  label="Image URL"
                  className="md:col-span-2"
                >
                  <div className="flex items-start gap-3">
                    <input
                      id="image"
                      type="url"
                      name="image"
                      value={form.image}
                      onChange={handleChange}
                      placeholder="https://..."
                      className={INPUT_CLASS}
                    />

                    <RoomThumb
                      src={form.image.trim()}
                      alt="Room preview"
                      className="h-11 w-16 shrink-0 rounded-lg border border-gray-100"
                    />
                  </div>
                </Field>

                <Field
                  id="description"
                  label="Description"
                  className="md:col-span-2"
                >
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the room for guests"
                    rows={4}
                    className={INPUT_CLASS}
                  />
                </Field>

                <Field
                  id="facilities"
                  label="Facilities"
                  hint="Separate each facility with a comma."
                  className="md:col-span-2"
                >
                  <textarea
                    id="facilities"
                    name="facilities"
                    value={form.facilities}
                    onChange={handleChange}
                    placeholder="e.g. Free Wi-Fi, Smart TV, Mini Bar"
                    rows={3}
                    className={INPUT_CLASS}
                  />

                  {parseFacilities(form.facilities).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {parseFacilities(form.facilities).map((item, i) => (
                        <span
                          key={`${item}-${i}`}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </Field>

                <div className="flex flex-col gap-3 sm:flex-row md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {saving
                      ? "Saving..."
                      : editingRoom
                      ? "Update Room"
                      : "Add Room"}
                  </button>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Room list */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">All Rooms</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {visibleRooms.length} of {rooms.length} room
                  {rooms.length === 1 ? "" : "s"}.
                </p>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, number, type or bed..."
                    aria-label="Search rooms"
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                  className={INPUT_CLASS}
                >
                  <option value="all">All statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by type"
                  className={INPUT_CLASS}
                >
                  <option value="all">All types</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort rooms"
                  className={INPUT_CLASS}
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
                  Loading rooms...
                </p>
              </div>
            ) : loadError ? (
              <div className="px-5 py-14 text-center">
                <AlertCircle size={34} className="mx-auto text-rose-400" />
                <p className="mt-3 font-semibold text-gray-800">
                  Couldn't load rooms
                </p>
                <p className="mt-1 text-sm text-gray-500">{loadError}</p>
                <button
                  type="button"
                  onClick={() => fetchRooms(true)}
                  className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Try Again
                </button>
              </div>
            ) : rooms.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <BedDouble size={36} className="mx-auto text-gray-300" />
                <p className="mt-3 font-semibold text-gray-700">
                  No rooms yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first room to get started.
                </p>
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  <Plus size={16} />
                  Add Room
                </button>
              </div>
            ) : visibleRooms.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <Search size={32} className="mx-auto text-gray-300" />
                <p className="mt-3 font-semibold text-gray-700">
                  No rooms match your filters
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
                <div className="hidden md:block">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Room", "Type", "Price", "Capacity", "Status", ""].map(
                          (heading, i) => (
                            <th
                              key={heading || i}
                              className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:px-6"
                            >
                              {heading || (
                                <span className="sr-only">Actions</span>
                              )}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {visibleRooms.map((room) => (
                        <tr
                          key={room.id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-4 py-4 lg:px-6">
                            <div className="flex items-center gap-3">
                              <RoomThumb
                                src={room.image}
                                alt={room.room_name}
                                className="h-12 w-16 shrink-0 rounded-lg"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {room.room_name}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  Room {room.room_number}
                                  {room.bed_type ? ` · ${room.bed_type}` : ""}
                                  {room.room_size ? ` · ${room.room_size}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-700 lg:px-6">
                            {room.room_type}
                          </td>

                          <td className="px-4 py-4 text-sm font-bold text-gray-900 lg:px-6">
                            ${formatMoney(room.price)}
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              / night
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-700 lg:px-6">
                            {room.capacity} guest
                            {Number(room.capacity) === 1 ? "" : "s"}
                          </td>

                          <td className="px-4 py-4 lg:px-6">
                            <StatusBadge status={room.status} />
                          </td>

                          <td className="px-4 py-4 lg:px-6">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(room)}
                                aria-label={`Edit ${room.room_name}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-600"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(room)}
                                aria-label={`Delete ${room.room_name}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-4 p-4 md:hidden">
                  {visibleRooms.map((room) => {
                    const facilities = parseFacilities(room.facilities);

                    return (
                      <article
                        key={room.id}
                        className="overflow-hidden rounded-xl border border-gray-100 bg-white"
                      >
                        <RoomThumb
                          src={room.image}
                          alt={room.room_name}
                          className="h-44 w-full"
                        />

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-gray-900">
                                {room.room_name}
                              </h3>
                              <p className="mt-0.5 text-sm text-gray-500">
                                Room {room.room_number} · {room.room_type}
                              </p>
                            </div>

                            <div className="shrink-0">
                              <StatusBadge status={room.status} />
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                            <div>
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="mt-1 text-sm font-bold text-blue-700">
                                ${formatMoney(room.price)}
                                <span className="font-normal text-gray-400">
                                  {" "}
                                  / night
                                </span>
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">Capacity</p>
                              <p className="mt-1 text-sm font-medium text-gray-800">
                                {room.capacity} guest
                                {Number(room.capacity) === 1 ? "" : "s"}
                              </p>
                            </div>

                            {room.bed_type && (
                              <div>
                                <p className="text-xs text-gray-500">Bed</p>
                                <p className="mt-1 text-sm text-gray-800">
                                  {room.bed_type}
                                </p>
                              </div>
                            )}

                            {room.room_size && (
                              <div>
                                <p className="text-xs text-gray-500">Size</p>
                                <p className="mt-1 text-sm text-gray-800">
                                  {room.room_size}
                                </p>
                              </div>
                            )}
                          </div>

                          {facilities.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {facilities.slice(0, 4).map((item, i) => (
                                <span
                                  key={`${item}-${i}`}
                                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                                >
                                  {item}
                                </span>
                              ))}
                              {facilities.length > 4 && (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                                  +{facilities.length - 4} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => handleEdit(room)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(room)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
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
        room={deleteTarget}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

export default AdminRooms;