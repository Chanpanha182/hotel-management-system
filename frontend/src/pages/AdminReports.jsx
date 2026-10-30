
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileBarChart,
  CalendarDays,
  DollarSign,
  BedDouble,
  CalendarCheck,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import AdminSidebar from "../components/AdminSidebar";

function ReportCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 wrap-break-word text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${color}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeCSV(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function AdminReports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [report, setReport] = useState({
    total_bookings: 0,
    booking_value: 0,
    total_revenue: 0,
    total_rooms: 0,
    monthlyBookings: [],
    monthlyRevenue: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please log in to view reports.");
        }

        const query = new URLSearchParams();

        if (startDate) query.set("startDate", startDate);
        if (endDate) query.set("endDate", endDate);

        const queryString = query.toString();

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/reports${
            queryString ? `?${queryString}` : ""
          }`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load report data."
          );
        }

        setReport({
          total_bookings: Number(result.data.total_bookings || 0),
          booking_value: Number(result.data.booking_value || 0),
          total_revenue: Number(result.data.total_revenue || 0),
          total_rooms: Number(result.data.total_rooms || 0),

          monthlyBookings: Array.isArray(result.data.monthlyBookings)
            ? result.data.monthlyBookings
            : [],

          monthlyRevenue: Array.isArray(result.data.monthlyRevenue)
            ? result.data.monthlyRevenue
            : [],
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message || "Unable to connect to the report API."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => controller.abort();
  }, [startDate, endDate]);

  const downloadCSV = () => {
    const rows = [
      ["Hotel Management System - Report"],
      ["Start Date", startDate || "All dates"],
      ["End Date", endDate || "All dates"],
      [],
      ["Summary", "Value"],
      ["Total Revenue", report.total_revenue],
      ["Total Bookings", report.total_bookings],
      ["Total Rooms", report.total_rooms],
      ["Booking Value", report.booking_value],
      [],
      ["Monthly Bookings"],
      ["Month", "Bookings"],
      ...report.monthlyBookings.map((item) => [
        item.month,
        item.bookings,
      ]),
      [],
      ["Monthly Revenue"],
      ["Month", "Revenue"],
      ...report.monthlyRevenue.map((item) => [
        item.month,
        item.revenue,
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "hotel-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <header className="mb-8">
            <Link
              to="/admin"
              className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <FileBarChart size={18} />
                  HOTEL MANAGEMENT
                </div>

                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Reports & Analytics
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Review hotel bookings and revenue performance.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  disabled={loading || (!startDate && !endDate)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={17} />
                  Reset Dates
                </button>

                <button
                  type="button"
                  onClick={downloadCSV}
                  disabled={loading || Boolean(error)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={17} />
                  Export CSV
                </button>
              </div>
            </div>
          </header>

          {/* Date filters */}
          <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={20} className="text-blue-600" />
              <h2 className="font-bold text-gray-900">Report Period</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Start date
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-2 block min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                End date
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-2 block min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3"
                />
              </label>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Select dates to reload booking and revenue reports.
              Leave both dates empty to view all dates.
            </p>
          </section>

          {/* Loading */}
          {loading && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              Loading report data from the server...
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load reports</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Report Summary
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReportCard
                title="Paid Revenue"
                value={`$${formatMoney(report.total_revenue)}`}
                icon={DollarSign}
                color="bg-emerald-50 text-emerald-600"
              />

              <ReportCard
                title="Total Bookings"
                value={report.total_bookings.toLocaleString()}
                icon={CalendarCheck}
                color="bg-blue-50 text-blue-600"
              />

              <ReportCard
                title="Total Rooms"
                value={report.total_rooms.toLocaleString()}
                icon={BedDouble}
                color="bg-violet-50 text-violet-600"
              />

              <ReportCard
                title="Booking Value"
                value={`$${formatMoney(report.booking_value)}`}
                icon={CalendarDays}
                color="bg-amber-50 text-amber-600"
              />
            </div>
          </section>

          {/* Monthly Booking Chart */}
          <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Monthly Booking Trends
            </h2>

            <p className="mb-5 mt-1 text-sm text-gray-500">
              Number of bookings created each month in the selected period.
            </p>

            <div className="h-80 w-full">
              {!loading && !error && report.monthlyBookings.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No booking data found for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.monthlyBookings}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="bookings"
                      name="Bookings"
                      fill="#2563eb"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Monthly Revenue Chart */}
          <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Monthly Revenue
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Paid payment amounts grouped by month.
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Total:{" "}
                <span className="font-bold text-emerald-600">
                  ${formatMoney(report.total_revenue)}
                </span>
              </p>
            </div>

            <div className="mt-5 h-80 w-full">
              {!loading && !error && report.monthlyRevenue.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No paid revenue data found for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(value) =>
                        Number(value).toLocaleString("en-US")
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        `$${formatMoney(value)}`,
                        "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#16a34a"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <footer className="py-6 text-center text-xs text-gray-400">
            Hotel Management System · Reports
          </footer>
        </div>
      </main>
    </div>
  );
}
