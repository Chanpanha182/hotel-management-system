
const express = require("express");
const router = express.Router();

const db = require("../config/db");
const adminMiddleware = require("../middleware/adminMiddleware");

// GET /api/admin/reports?startDate=2026-01-01&endDate=2026-12-31
router.get("/", adminMiddleware, (req, res) => {
  const { startDate, endDate } = req.query;

  // Validate date format.
  const validDate = (value) => {
    if (typeof value !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  };

  if (
    (startDate && !validDate(startDate)) ||
    (endDate && !validDate(endDate))
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid dates in YYYY-MM-DD format.",
    });
  }

  if (startDate && endDate && startDate > endDate) {
    return res.status(400).json({
      success: false,
      message: "Start date must not be after end date.",
    });
  }

  // Booking date filters.
  const bookingConditions = [];
  const bookingParams = [];

  if (startDate) {
    bookingConditions.push("b.created_at >= ?");
    bookingParams.push(`${startDate} 00:00:00`);
  }

  if (endDate) {
    bookingConditions.push("b.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
    bookingParams.push(endDate);
  }

  const bookingWhere = bookingConditions.length
    ? `WHERE ${bookingConditions.join(" AND ")}`
    : "";

  // Total bookings and booking value.
  const summarySql = `
    SELECT
      COUNT(*) AS total_bookings,
      COALESCE(SUM(b.total_amount), 0) AS booking_value
    FROM bookings b
    ${bookingWhere}
  `;

  // Paid revenue within the selected payment dates.
  const revenueConditions = ["p.payment_status = 'paid'"];
  const revenueParams = [];

  if (startDate) {
    revenueConditions.push("p.payment_date >= ?");
    revenueParams.push(`${startDate} 00:00:00`);
  }

  if (endDate) {
    revenueConditions.push("p.payment_date < DATE_ADD(?, INTERVAL 1 DAY)");
    revenueParams.push(endDate);
  }

  const revenueSql = `
    SELECT COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM payments p
    WHERE ${revenueConditions.join(" AND ")}
  `;

  // Total rooms.
  const roomsSql = `
    SELECT COUNT(*) AS total_rooms
    FROM rooms
  `;

  // Monthly bookings.
  const monthlySql = `
    SELECT
      DATE_FORMAT(b.created_at, '%Y-%m') AS month,
      COUNT(*) AS bookings
    FROM bookings b
    ${bookingWhere}
    GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
    ORDER BY month ASC
  `;

  // Monthly paid revenue.
  const monthlyRevenueConditions = ["p.payment_status = 'paid'"];
  const monthlyRevenueParams = [];

  if (startDate) {
    monthlyRevenueConditions.push("p.payment_date >= ?");
    monthlyRevenueParams.push(`${startDate} 00:00:00`);
  }

  if (endDate) {
    monthlyRevenueConditions.push(
      "p.payment_date < DATE_ADD(?, INTERVAL 1 DAY)"
    );
    monthlyRevenueParams.push(endDate);
  }

  const monthlyRevenueSql = `
    SELECT
      DATE_FORMAT(p.payment_date, '%Y-%m') AS month,
      COALESCE(SUM(p.amount), 0) AS revenue
    FROM payments p
    WHERE ${monthlyRevenueConditions.join(" AND ")}
    GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m')
    ORDER BY month ASC
  `;

  // Run the report queries in sequence.
  db.query(summarySql, bookingParams, (summaryError, summaryResults) => {
    if (summaryError) {
      console.error("Report summary error:", summaryError);
      return res.status(500).json({
        success: false,
        message: "Failed to load report summary.",
      });
    }

    db.query(revenueSql, revenueParams, (revenueError, revenueResults) => {
      if (revenueError) {
        console.error("Report revenue error:", revenueError);
        return res.status(500).json({
          success: false,
          message: "Failed to load revenue report.",
        });
      }

      db.query(roomsSql, (roomsError, roomsResults) => {
        if (roomsError) {
          console.error("Report rooms error:", roomsError);
          return res.status(500).json({
            success: false,
            message: "Failed to load rooms report.",
          });
        }

        db.query(
          monthlySql,
          bookingParams,
          (monthlyError, monthlyResults) => {
            if (monthlyError) {
              console.error("Report monthly error:", monthlyError);
              return res.status(500).json({
                success: false,
                message: "Failed to load monthly booking report.",
              });
            }

            db.query(
              monthlyRevenueSql,
              monthlyRevenueParams,
              (monthlyRevenueError, monthlyRevenueResults) => {
                if (monthlyRevenueError) {
                  console.error(
                    "Monthly revenue report error:",
                    monthlyRevenueError
                  );

                  return res.status(500).json({
                    success: false,
                    message: "Failed to load monthly revenue report.",
                  });
                }

                return res.json({
                  success: true,
                  data: {
                    total_bookings: Number(
                      summaryResults[0].total_bookings
                    ),
                    booking_value: Number(
                      summaryResults[0].booking_value
                    ),
                    total_revenue: Number(
                      revenueResults[0].total_revenue
                    ),
                    total_rooms: Number(roomsResults[0].total_rooms),

                    monthlyBookings: monthlyResults.map((row) => ({
                      month: row.month,
                      bookings: Number(row.bookings),
                    })),

                    monthlyRevenue: monthlyRevenueResults.map((row) => ({
                      month: row.month,
                      revenue: Number(row.revenue),
                    })),
                  },
                });
              }
            );
          }
        );
      });
    });
  });
});

module.exports = router;
