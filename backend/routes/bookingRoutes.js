const express = require("express");

const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { sendBookingEmail } = require("../utils/email");


// ========================================
// CREATE BOOKING
// ========================================

router.post("/", authMiddleware, (req, res) => {

    const {
        room_id,
        check_in,
        check_out,
        guests,
        special_request
    } = req.body;

    // Check required fields
    if (!room_id || !check_in || !check_out || !guests) {
        return res.status(400).json({
            success: false,
            message: "Room, check-in, check-out, and guests are required."
        });
    }

    // Validate guests
    if (Number(guests) < 1) {
        return res.status(400).json({
            success: false,
            message: "Guests must be at least 1."
        });
    }


    // Get room information
    const roomSql = `
        SELECT *
        FROM rooms
        WHERE id = ?
    `;

    db.query(roomSql, [room_id], (err, rooms) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Database error."
            });
        }

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found."
            });
        }

        const room = rooms[0];


        // Check guest capacity
        if (Number(guests) > room.capacity) {
            return res.status(400).json({
                success: false,
                message: `This room can accommodate maximum ${room.capacity} guests.`
            });
        }


        // Validate dates
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);

        if (
            isNaN(checkInDate.getTime()) ||
            isNaN(checkOutDate.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid check-in or check-out date."
            });
        }

        if (checkOutDate <= checkInDate) {
            return res.status(400).json({
                success: false,
                message: "Check-out date must be after check-in date."
            });
        }


        // Check if room is already booked
        const overlapSql = `
            SELECT id
            FROM bookings
            WHERE room_id = ?
            AND booking_status != 'cancelled'
            AND check_in < ?
            AND check_out > ?
        `;

        db.query(
            overlapSql,
            [room_id, check_out, check_in],
            (err, existingBookings) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to check room availability."
                    });
                }


                if (existingBookings.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: "This room is already booked for the selected dates."
                    });
                }


                // Calculate number of nights
                const millisecondsPerDay = 1000 * 60 * 60 * 24;

                const nights = Math.ceil(
                    (checkOutDate - checkInDate) /
                    millisecondsPerDay
                );


                // Calculate total
                const totalAmount =
                    Number(room.price) * nights;


                // Insert booking
                const insertSql = `
                    INSERT INTO bookings
                    (
                        user_id,
                        room_id,
                        check_in,
                        check_out,
                        guests,
                        special_request,
                        total_amount
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(
                    insertSql,
                    [
                        req.user.id,
                        room_id,
                        check_in,
                        check_out,
                        guests,
                        special_request || null,
                        totalAmount
                    ],
                    (err, result) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                success: false,
                                message: "Failed to create booking."
                            });
                        }


                        sendBookingEmail(result.insertId, "received");

                        res.status(201).json({
                            success: true,
                            message: "Booking created successfully!",
                            data: {
                                booking_id: result.insertId,
                                room_id: room_id,
                                check_in: check_in,
                                check_out: check_out,
                                guests: guests,
                                nights: nights,
                                total_amount: totalAmount,
                                booking_status: "pending"
                            }
                        });

                    }
                );

            }
        );

    });

});


// ========================================
// GET MY BOOKINGS
// ========================================

router.get("/my-bookings", authMiddleware, (req, res) => {

    const sql = `
        SELECT
            bookings.id,
            bookings.check_in,
            bookings.check_out,
            bookings.guests,
            bookings.special_request,
            bookings.total_amount,
            bookings.booking_status,
            bookings.created_at,

            rooms.room_number,
            rooms.room_name,
            rooms.room_type,
            rooms.price,
            rooms.image

        FROM bookings

        INNER JOIN rooms
            ON bookings.room_id = rooms.id

        WHERE bookings.user_id = ?

        ORDER BY bookings.created_at DESC
    `;

    db.query(
        sql,
        [req.user.id],
        (err, results) => {

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

        }
    );

});

// PUT /api/bookings/:id/cancel
router.put("/:id/cancel", authMiddleware, (req, res) => {
    const { id } = req.params;

    const checkSql = `
        SELECT
            id,
            user_id,
            booking_status
        FROM bookings
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        checkSql,
        [id, req.user.id],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to check booking."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found."
                });
            }

            const booking = results[0];

            if (booking.booking_status === "cancelled") {
                return res.status(400).json({
                    success: false,
                    message: "This booking is already cancelled."
                });
            }

            if (booking.booking_status === "checked_out") {
                return res.status(400).json({
                    success: false,
                    message: "A completed booking cannot be cancelled."
                });
            }

            const updateSql = `
                UPDATE bookings
                SET booking_status = 'cancelled'
                WHERE id = ?
                AND user_id = ?
            `;

            db.query(
                updateSql,
                [id, req.user.id],
                (err) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to cancel booking."
                        });
                    }

                    res.json({
                        success: true,
                        message: "Booking cancelled successfully!"
                    });
                }
            );
        }
    );
});


module.exports = router;