import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Star,
  RefreshCw,
  LayoutDashboard,
  Eye,
  EyeOff,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";
import Stars from "../components/Stars";

const API_URL = import.meta.env.VITE_API_URL + "/api/admin/reviews";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "visible", label: "Visible" },
  { key: "hidden", label: "Hidden" },
  { key: "low", label: "1–2 stars" },
];

function AdminReviews() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const request = useCallback(
    async (path = "", options = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
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

  const fetchReviews = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);

      try {
        const result = await request();
        setReviews(Array.isArray(result.data) ? result.data : []);
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
    // Load once when the page opens
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
  }, [fetchReviews]);

  const toggleStatus = async (review) => {
    const status = review.status === "visible" ? "hidden" : "visible";

    setUpdatingId(review.id);

    try {
      await request(`/${review.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      setReviews((current) =>
        current.map((item) => (item.id === review.id ? { ...item, status } : item))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const visible = reviews.filter((review) => review.status === "visible");
    const average = visible.length
      ? visible.reduce((sum, review) => sum + review.rating, 0) / visible.length
      : 0;

    return {
      total: reviews.length,
      average,
      hidden: reviews.length - visible.length,
      low: reviews.filter((review) => review.rating <= 2).length,
    };
  }, [reviews]);

  const filtered = reviews.filter((review) => {
    if (filter === "visible") return review.status === "visible";
    if (filter === "hidden") return review.status === "hidden";
    if (filter === "low") return review.rating <= 2;
    return true;
  });

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
                  <Star size={17} />
                  GUEST FEEDBACK
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Reviews
                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Read what guests say. Hide reviews that are rude or not about the stay.
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
                  onClick={() => fetchReviews(true)}
                  disabled={refreshing || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </header>

          {/* Summary */}
          <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Total Reviews" value={stats.total} />
            <StatCard
              label="Average Rating"
              value={stats.average ? stats.average.toFixed(1) : "—"}
              extra={stats.average ? <Stars value={stats.average} size={14} /> : null}
            />
            <StatCard label="Hidden" value={stats.hidden} />
            <StatCard label="1–2 Star Reviews" value={stats.low} />
          </section>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
            <div className="mb-6 flex flex-wrap gap-2">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter === key
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100"></div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <MessageSquare className="mx-auto mb-3 text-gray-300" size={40} />
                {reviews.length === 0
                  ? "No reviews yet. Guests can review a booking after check-out."
                  : "No reviews match this filter."}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((review) => (
                  <li
                    key={review.id}
                    className={`flex flex-col gap-4 py-5 sm:flex-row sm:items-start ${
                      review.status === "hidden" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Stars value={review.rating} size={16} />
                        <span className="font-semibold text-gray-900">{review.guest_name}</span>
                        <span className="text-sm text-gray-400">{review.guest_email}</span>
                        {review.status === "hidden" && (
                          <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                            Hidden
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {review.room_name} (Room {review.room_number}) · Booking #{review.booking_id} ·{" "}
                        {new Date(review.created_at).toLocaleDateString("en-GB")}
                      </p>

                      <p className="mt-3 whitespace-pre-line text-gray-700">
                        {review.comment || <span className="italic text-gray-400">No comment</span>}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStatus(review)}
                      disabled={updatingId === review.id}
                      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                        review.status === "visible"
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {review.status === "visible" ? (
                        <>
                          <EyeOff size={16} />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Show
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, extra }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  );
}

export default AdminReviews;
