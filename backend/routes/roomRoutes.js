const express = require("express");
const router = express.Router();

const db = require("../config/db");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Get all rooms
// Optional ?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD adds an "available"
// flag to each room (false when a non-cancelled booking overlaps).
router.get("/", (req, res) => {
    const { checkIn, checkOut } = req.query;

    const hasDates =
        DATE_PATTERN.test(checkIn || "") &&
        DATE_PATTERN.test(checkOut || "") &&
        checkIn < checkOut;

    const sql = hasDates
        ? `
            SELECT
                rooms.*,
                NOT EXISTS (
                    SELECT 1
                    FROM bookings
                    WHERE bookings.room_id = rooms.id
                    AND bookings.booking_status != 'cancelled'
                    AND bookings.check_in < ?
                    AND bookings.check_out > ?
                ) AS available
            FROM rooms
            ORDER BY id DESC
        `
        : "SELECT * FROM rooms ORDER BY id DESC";

    const params = hasDates ? [checkOut, checkIn] : [];

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching rooms:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch rooms",
            });
        }

        res.json({
            success: true,
            data: results,
        });
    });
});

// Get one room by ID
router.get("/:id", (req, res) => {
    const { id } = req.params;

    const sql = "SELECT * FROM rooms WHERE id = ?";

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error fetching room:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch room",
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        res.json({
            success: true,
            data: results[0],
        });
    });
});

module.exports = router;