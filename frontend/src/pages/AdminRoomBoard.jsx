import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  RefreshCw,
  AlertCircle,
  BedDouble,
  LogIn,
  LogOut,
  Sparkles,
  Wrench,
  User,
  Phone,
  CalendarDays,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";

const API = import.meta.env.VITE_API_URL + "/api/admin";

// Colour and label for each board status
const STATUS = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    card: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
  },
  arriving: {
    label: "Arriving today",
    dot: "bg-sky-500",
    card: "border-sky-200 bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
  },
  occupied: {
    label: "Occupied",
    dot: "bg-rose-500",
    card: "border-rose-200 bg-rose-50",
    badge: "bg-rose-100 text-rose-700",
  },
  cleaning: {
    label: "Needs cleaning",
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-gray-400",
    card: "border-gray-200 bg-gray-100",
    badge: "bg-gray-200 text-gray-700",
  },
};

const ORDER = ["available", "arriving", "occupied", "cleaning", "maintenance"];

// "2026-11-20" -> "20 Nov"
function shortDate(value) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function AdminRoomBoard() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const request = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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

  const fetchBoard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);

      try {
        const result = await request("/room-board");
        setRooms(Array.isArray(result.data) ? result.data : []);
        setToday(result.today || "");
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [request]
  );

  useEffect(() => {
    // Load when the page opens, then keep the board fresh every minute
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBoard();
    const timer = setInterval(() => fetchBoard(), 60000);
    return () => clearInterval(timer);
  }, [fetchBoard]);

  // Run an action for one room, then reload the board
  const runAction = async (roomId, path, body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;

    setBusyId(roomId);

    try {
      await request(path, { method: "PUT", body: JSON.stringify(body) });
      await fetchBoard();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const checkIn = (room) =>
    runAction(
      room.id,
      `/bookings/${room.arrival.id}/status`,
      { booking_status: "checked_in" },
      `Check in ${room.arrival.guest_name} to Room ${room.room_number}?`
    );

  const checkOut = (room) =>
    runAction(
      room.id,
      `/bookings/${room.stay.id}/status`,
      { booking_status: "checked_out" },
      `Check out ${room.stay.guest_name} from Room ${room.room_number}?`
    );

  const markClean = (room) =>
    runAction(room.id, `/room-board/${room.id}/housekeeping`, { housekeeping: "clean" });

  const setMaintenance = (room, on) =>
    runAction(
      room.id,
      `/room-board/${room.id}/maintenance`,
      { maintenance: on },
      on ? `Put Room ${room.room_number} under maintenance? Guests cannot stay in it.` : null
    );

  const counts = useMemo(() => {
    const result = Object.fromEntries(ORDER.map((key) => [key, 0]));
    rooms.forEach((room) => {
      result[room.board_status] += 1;
    });
    return result;
  }, [rooms]);

  const visibleRooms =
    filter === "all" ? rooms : rooms.filter((room) => room.board_status === filter);

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
                  <LayoutGrid size={17} />
                  FRONT DESK
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Room Board
                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  See every room at a glance
                  {today && <> · Today is {shortDate(today)}</>}. Check guests in and out,
                  and mark rooms clean after housekeeping.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/admin/bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
                >
                  <CalendarDays size={16} />
                  Bookings
                </Link>

                <button
                  type="button"
                  onClick={() => fetchBoard(true)}
                  disabled={refreshing || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </header>

          {/* Summary: also works as a filter */}
          <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <FilterCard
              label="All rooms"
              value={rooms.length}
              dot="bg-gray-900"
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            {ORDER.map((key) => (
              <FilterCard
                key={key}
                label={STATUS[key].label}
                value={counts[key]}
                dot={STATUS[key].dot}
                active={filter === key}
                onClick={() => setFilter(filter === key ? "all" : key)}
              />
            ))}
          </section>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100"></div>
              ))}
            </div>
          ) : visibleRooms.length === 0 ? (
            <div className="rounded-2xl bg-white py-16 text-center text-gray-500 ring-1 ring-black/5">
              <BedDouble className="mx-auto mb-3 text-gray-300" size={40} />
              {rooms.length === 0 ? "No rooms yet. Add rooms in Admin → Rooms." : "No rooms with this status."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleRooms.map((room) => (
                <RoomTile
                  key={room.id}
                  room={room}
                  busy={busyId === room.id}
                  onCheckIn={() => checkIn(room)}
                  onCheckOut={() => checkOut(room)}
                  onClean={() => markClean(room)}
                  onMaintenance={(on) => setMaintenance(room, on)}
                  today={today}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FilterCard({ label, value, dot, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition hover:ring-gray-300 ${
        active ? "ring-2 ring-gray-900" : "ring-black/5"
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-gray-500">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`}></span>
        {label}
      </span>
      <span className="mt-1 block text-2xl font-bold text-gray-900">{value}</span>
    </button>
  );
}

function RoomTile({ room, busy, onCheckIn, onCheckOut, onClean, onMaintenance, today }) {
  const style = STATUS[room.board_status] || STATUS.available;
  const { stay, arrival, next } = room;

  return (
    <article className={`flex flex-col rounded-2xl border-2 p-5 ${style.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-bold text-gray-900">{room.room_number}</p>
          <p className="truncate text-sm text-gray-600">
            {room.room_name} · {room.room_type}
          </p>
        </div>

        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {/* Who is here / who is coming */}
      <div className="mt-4 flex-1 space-y-2 text-sm text-gray-700">
        {stay && (
          <GuestLine
            guest={stay}
            text={
              stay.check_out <= today
                ? "Checks out today"
                : `Until ${shortDate(stay.check_out)}`
            }
            warn={stay.check_out < today}
          />
        )}

        {!stay && room.board_status === "occupied" && (
          <p className="text-gray-500">Marked occupied in Rooms (no booking linked).</p>
        )}

        {!stay && arrival && (
          <GuestLine
            guest={arrival}
            text={
              arrival.check_in < today
                ? `Was due ${shortDate(arrival.check_in)}`
                : `Arriving today · ${arrival.guests} guest${arrival.guests > 1 ? "s" : ""}`
            }
            warn={arrival.check_in < today}
          />
        )}

        {!stay && arrival && arrival.booking_status === "pending" && (
          <p className="text-xs font-medium text-amber-700">
            Booking is still pending — confirm payment first.
          </p>
        )}

        {!stay && !arrival && room.board_status !== "maintenance" && (
          <p className="text-gray-500">No guest today.</p>
        )}

        {next && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarDays size={13} />
            Next booking: {shortDate(next.check_in)} – {shortDate(next.check_out)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        {stay && (
          <ActionButton onClick={onCheckOut} disabled={busy} icon={LogOut} tone="rose">
            Check out
          </ActionButton>
        )}

        {!stay && arrival && arrival.booking_status === "confirmed" &&
          room.board_status !== "maintenance" && (
            <ActionButton onClick={onCheckIn} disabled={busy} icon={LogIn} tone="sky">
              Check in
            </ActionButton>
          )}

        {room.housekeeping === "dirty" && !stay && (
          <ActionButton onClick={onClean} disabled={busy} icon={Sparkles} tone="amber">
            Mark clean
          </ActionButton>
        )}

        {room.board_status === "maintenance" ? (
          <ActionButton onClick={() => onMaintenance(false)} disabled={busy} icon={Wrench} tone="gray">
            End maintenance
          </ActionButton>
        ) : (
          !stay && (
            <ActionButton onClick={() => onMaintenance(true)} disabled={busy} icon={Wrench} tone="ghost">
              Maintenance
            </ActionButton>
          )
        )}
      </div>
    </article>
  );
}

function GuestLine({ guest, text, warn }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 font-semibold text-gray-900">
        <User size={14} />
        <span className="truncate">{guest.guest_name}</span>
      </p>
      {guest.guest_phone && (
        <p className="flex items-center gap-1.5 text-gray-600">
          <Phone size={13} />
          <a href={`tel:${guest.guest_phone}`} className="hover:underline">
            {guest.guest_phone}
          </a>
        </p>
      )}
      <p className={warn ? "font-medium text-red-600" : "text-gray-600"}>{text}</p>
    </div>
  );
}

const TONES = {
  rose: "bg-rose-600 text-white hover:bg-rose-700",
  sky: "bg-sky-600 text-white hover:bg-sky-700",
  amber: "bg-amber-500 text-white hover:bg-amber-600",
  gray: "bg-gray-700 text-white hover:bg-gray-800",
  ghost: "bg-white/70 text-gray-600 ring-1 ring-black/10 hover:bg-white",
};

function ActionButton({ onClick, disabled, icon: Icon, tone, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${TONES[tone]}`}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

export default AdminRoomBoard;
