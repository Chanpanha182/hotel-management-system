const express = require("express");

const router = express.Router();

const db = require("../config/db");
const adminMiddleware = require("../middleware/adminMiddleware");


// ==========================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// ==========================================

router.get("/dashboard", adminMiddleware, (req, res) => {

    const statsSql = `
        SELECT

            (
                SELECT COUNT(*)
                FROM users
            ) AS total_users,

            (
                SELECT COUNT(*)
                FROM rooms
            ) AS total_rooms,

            (
                SELECT COUNT(*)
                FROM bookings
            ) AS total_bookings,

            (
                SELECT COALESCE(
                    SUM(amount),
                    0
                )
                FROM payments
                WHERE payment_status = 'paid'
            ) AS total_revenue,

            (
                SELECT COUNT(*)
                FROM payments
                WHERE payment_status = 'pending'
            ) AS pending_payments,

            (
                SELECT COUNT(*)
                FROM payments
                WHERE payment_status = 'paid'
            ) AS paid_payments,

            (
                SELECT COUNT(*)
                FROM payments
                WHERE payment_status = 'failed'
            ) AS failed_payments,

            (
                SELECT COUNT(*)
                FROM payments
                WHERE payment_status = 'refunded'
            ) AS refunded_payments
    `;


    const recentBookingsSql = `
        SELECT
            bookings.id,
            bookings.check_in,
            bookings.check_out,
            bookings.guests,
            bookings.total_amount,
            bookings.booking_status,

            users.name AS customer_name,
            users.email AS customer_email,

            rooms.room_number,
            rooms.room_name

        FROM bookings

        INNER JOIN users
            ON bookings.user_id = users.id

        INNER JOIN rooms
            ON bookings.room_id = rooms.id

        ORDER BY bookings.created_at DESC

        LIMIT 10
    `;


    // ==========================================
    // GET STATISTICS
    // ==========================================

    db.query(statsSql, (err, statsResults) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch dashboard statistics."
            });
        }


        // ==========================================
        // GET RECENT BOOKINGS
        // ==========================================

        db.query(
            recentBookingsSql,
            (err, bookingResults) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to fetch recent bookings."
                    });
                }


                res.json({
                    success: true,

                    data: {
                        stats: statsResults[0],

                        recentBookings: bookingResults
                    }
                });

            }
        );
        

    });

});


module.exports = router;