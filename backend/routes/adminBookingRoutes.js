const express = require("express");

const router = express.Router();

const db = require("../config/db");
const adminMiddleware = require("../middleware/adminMiddleware");

// GET /api/admin/bookings
router.get("/", adminMiddleware, (req, res) => {

    const sql = `
        SELECT
            bookings.id,
            bookings.user_id,
            bookings.room_id,
            bookings.check_in,
            bookings.check_out,
            bookings.guests,
            bookings.special_request,
            bookings.total_amount,
            bookings.booking_status,
            bookings.created_at,

            users.name AS customer_name,
            users.email AS customer_email,
            users.phone AS customer_phone,

            rooms.room_number,
            rooms.room_name,
            rooms.room_type

        FROM bookings

        INNER JOIN users
            ON bookings.user_id = users.id

        INNER JOIN rooms
            ON bookings.room_id = rooms.id

        ORDER BY bookings.created_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch bookings."
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});


// PUT /api/admin/bookings/:id/status
router.put("/:id/status", adminMiddleware, (req, res) => {

    const { id } = req.params;
    const { booking_status } = req.body;

    const allowedStatuses = [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled"
    ];

    // Check status value
    if (!allowedStatuses.includes(booking_status)) {

        return res.status(400).json({
            success: false,
            message: "Invalid booking status."
        });
    }


    // Get current booking status
    const selectSql = `
        SELECT
            id,
            booking_status
        FROM bookings
        WHERE id = ?
    `;

    db.query(
        selectSql,
        [id],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to check booking."
                });
            }


            // Booking does not exist
            if (results.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Booking not found."
                });
            }


            const currentStatus =
                results[0].booking_status;


            // No change
            if (currentStatus === booking_status) {

                return res.status(400).json({
                    success: false,
                    message: `Booking is already ${booking_status}.`
                });
            }


            // Completed booking cannot be changed
            if (currentStatus === "checked_out") {

                return res.status(400).json({
                    success: false,
                    message:
                        "A completed booking cannot be changed."
                });
            }


            // Cancelled booking cannot be changed
            if (currentStatus === "cancelled") {

                return res.status(400).json({
                    success: false,
                    message:
                        "A cancelled booking cannot be changed."
                });
            }


            // Prevent invalid status transitions
            const validTransitions = {

                pending: [
                    "confirmed",
                    "cancelled"
                ],

                confirmed: [
                    "checked_in",
                    "cancelled"
                ],

                checked_in: [
                    "checked_out"
                ]

            };


            const possibleStatuses =
                validTransitions[currentStatus] || [];


            if (!possibleStatuses.includes(booking_status)) {

                return res.status(400).json({
                    success: false,
                    message:
                        `Cannot change booking status from "${currentStatus}" to "${booking_status}".`
                });
            }


            // Update booking status
            const updateSql = `
                UPDATE bookings
                SET booking_status = ?
                WHERE id = ?
            `;

            db.query(
                updateSql,
                [
                    booking_status,
                    id
                ],
                (err, result) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to update booking status."
                        });
                    }


                    if (result.affectedRows === 0) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Booking not found."
                        });
                    }


                    res.json({
                        success: true,
                        message:
                            `Booking status changed from "${currentStatus}" to "${booking_status}".`
                    });

                }
            );

        }
    );
});


module.exports = router;