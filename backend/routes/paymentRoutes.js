const express = require("express");

const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { sendTelegramMessage } = require("../utils/telegram");


// ==========================================
// CREATE PAYMENT
// POST /api/payments
// ==========================================

router.post("/", authMiddleware, (req, res) => {

    const { booking_id, payment_method } = req.body;

    if (!booking_id || !payment_method) {
        return res.status(400).json({
            success: false,
            message: "Booking ID and payment method are required."
        });
    }


    // Check booking belongs to logged-in customer
    const bookingSql = `
        SELECT
            bookings.id,
            bookings.user_id,
            bookings.total_amount,
            bookings.booking_status,
            rooms.room_name,
            rooms.room_number

        FROM bookings

        INNER JOIN rooms
            ON bookings.room_id = rooms.id

        WHERE bookings.id = ?
        AND bookings.user_id = ?
    `;

    db.query(
        bookingSql,
        [booking_id, req.user.id],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to check booking."
                });
            }


            // Booking not found
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Booking not found or you do not have permission."
                });
            }


            const booking = results[0];


            // ==========================================
            // CANCELLED BOOKING
            // ==========================================

            if (booking.booking_status === "cancelled") {

                return res.status(400).json({
                    success: false,
                    message:
                        "You cannot pay for a cancelled booking."
                });
            }


            // ==========================================
            // CHECK EXISTING PAYMENT
            // ==========================================

            const paymentCheckSql = `
                SELECT
                    id,
                    payment_status,
                    payment_method,
                    amount,
                    payment_date

                FROM payments

                WHERE booking_id = ?

                ORDER BY payment_date DESC

                LIMIT 1
            `;

            db.query(
                paymentCheckSql,
                [booking_id],
                (err, paymentResults) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to check payment."
                        });
                    }


                    // ==========================================
                    // EXISTING PAYMENT
                    // ==========================================

                    if (paymentResults.length > 0) {

                        const existingPayment =
                            paymentResults[0];


                        // Already paid
                        if (
                            existingPayment.payment_status ===
                            "paid"
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "This booking has already been paid."
                            });
                        }


                        // Payment is still pending
                        if (
                            existingPayment.payment_status ===
                            "pending"
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "A payment for this booking is already pending."
                            });
                        }


                        // ==========================================
                        // FAILED / REFUNDED
                        // ==========================================

                        // If the previous payment failed or was
                        // refunded, allow a new payment attempt.
                    }


                    // ==========================================
                    // CREATE NEW PAYMENT
                    // ==========================================

                    const paymentSql = `
                        INSERT INTO payments
                        (
                            booking_id,
                            amount,
                            payment_method,
                            payment_status
                        )

                        VALUES (?, ?, ?, 'pending')
                    `;

                    db.query(
                        paymentSql,
                        [
                            booking_id,
                            booking.total_amount,
                            payment_method
                        ],
                        (err, result) => {

                            if (err) {
                                console.error(err);

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Failed to create payment."
                                });
                            }


                            // Let staff know a KHQR payment needs checking
                            if (payment_method === "ABA KHQR") {
                                sendTelegramMessage(
                                    `💰 New ABA KHQR payment to confirm
` +
                                    `Booking #${booking.id} – ${booking.room_name} (Room ${booking.room_number})
` +
                                    `Amount: ${Number(booking.total_amount).toFixed(2)}
` +
                                    `Check your ABA app, then mark it Paid in Admin > Payments.`
                                );
                            }

                            // ==========================================
                            // SUCCESS
                            // ==========================================

                            res.status(201).json({
                                success: true,

                                message:
                                    "Payment created successfully!",

                                data: {
                                    payment_id:
                                        result.insertId,

                                    booking_id:
                                        booking.id,

                                    amount:
                                        booking.total_amount,

                                    payment_method:
                                        payment_method,

                                    payment_status:
                                        "pending",

                                    room_name:
                                        booking.room_name,

                                    room_number:
                                        booking.room_number
                                }
                            });

                        }
                    );

                }
            );

        }
    );
});


// ==========================================
// GET PAYMENT BY BOOKING
// GET /api/payments/booking/:bookingId
// ==========================================

router.get(
    "/booking/:bookingId",
    authMiddleware,
    (req, res) => {

        const { bookingId } = req.params;

        const sql = `
            SELECT
                payments.id,
                payments.booking_id,
                payments.amount,
                payments.payment_method,
                payments.payment_status,
                payments.payment_date

            FROM payments

            INNER JOIN bookings
                ON payments.booking_id = bookings.id

            WHERE payments.booking_id = ?
            AND bookings.user_id = ?

            ORDER BY payments.payment_date DESC

            LIMIT 1
        `;

        db.query(
            sql,
            [bookingId, req.user.id],
            (err, results) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to fetch payment."
                    });
                }


                res.json({
                    success: true,

                    data:
                        results.length > 0
                            ? results[0]
                            : null
                });

            }
        );
    }
);


module.exports = router;