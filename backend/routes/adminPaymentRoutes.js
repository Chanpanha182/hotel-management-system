const express = require("express");

const router = express.Router();
const { sendBookingEmail } = require("../utils/email");

const db = require("../config/db");
const adminMiddleware = require("../middleware/adminMiddleware");


// ======================================================
// GET ALL PAYMENTS
// ======================================================

router.get("/", adminMiddleware, (req, res) => {

    const sql = `
        SELECT
            payments.id,
            payments.booking_id,
            payments.amount,
            payments.payment_method,
            payments.payment_status,
            payments.payment_date,

            bookings.check_in,
            bookings.check_out,
            bookings.booking_status,

            users.name AS customer_name,
            users.email AS customer_email,

            rooms.room_number,
            rooms.room_name

        FROM payments

        INNER JOIN bookings
            ON payments.booking_id = bookings.id

        INNER JOIN users
            ON bookings.user_id = users.id

        INNER JOIN rooms
            ON bookings.room_id = rooms.id

        ORDER BY payments.payment_date DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch payments."
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});


// ======================================================
// UPDATE PAYMENT STATUS
// ======================================================

router.put("/:id/status", adminMiddleware, (req, res) => {

    const { id } = req.params;
    const { payment_status } = req.body;


    const allowedStatuses = [
        "pending",
        "paid",
        "failed",
        "refunded"
    ];


    // --------------------------------------------------
    // Validate status
    // --------------------------------------------------

    if (!allowedStatuses.includes(payment_status)) {

        return res.status(400).json({
            success: false,
            message: "Invalid payment status."
        });
    }


    // --------------------------------------------------
    // Get payment + booking information
    // --------------------------------------------------

    const getSql = `
        SELECT
            payments.id,
            payments.booking_id,
            payments.payment_status,

            bookings.booking_status

        FROM payments

        INNER JOIN bookings
            ON payments.booking_id = bookings.id

        WHERE payments.id = ?
    `;


    db.query(
        getSql,
        [id],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to check payment."
                });
            }


            // --------------------------------------------------
            // Payment not found
            // --------------------------------------------------

            if (results.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Payment not found."
                });
            }


            const payment = results[0];

            const currentPaymentStatus =
                payment.payment_status;

            const bookingStatus =
                payment.booking_status;


            // --------------------------------------------------
            // No change
            // --------------------------------------------------

            if (currentPaymentStatus === payment_status) {

                return res.status(400).json({
                    success: false,
                    message: "Payment is already in this status."
                });
            }


            // --------------------------------------------------
            // Refunded payment cannot be changed
            // --------------------------------------------------

            if (currentPaymentStatus === "refunded") {

                return res.status(400).json({
                    success: false,
                    message: "A refunded payment cannot be changed."
                });
            }


            // --------------------------------------------------
            // PAID payment
            // Only paid → refunded is allowed
            // --------------------------------------------------

            if (currentPaymentStatus === "paid") {

                if (payment_status !== "refunded") {

                    return res.status(400).json({
                        success: false,
                        message:
                            "A paid payment can only be refunded."
                    });
                }
            }


            // --------------------------------------------------
            // CANCELLED BOOKING
            // Cannot mark cancelled booking as paid
            // --------------------------------------------------

            if (
                bookingStatus === "cancelled" &&
                payment_status === "paid"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "A cancelled booking cannot be marked as paid."
                });
            }


            // --------------------------------------------------
            // CHECKED OUT BOOKING
            // Payment can still be refunded
            // but cannot be changed to paid
            // --------------------------------------------------

            if (
                bookingStatus === "checked_out" &&
                payment_status === "paid"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "A checked-out booking cannot be marked as paid."
                });
            }


            // --------------------------------------------------
            // Update payment
            // --------------------------------------------------

            const updatePaymentSql = `
                UPDATE payments
                SET payment_status = ?
                WHERE id = ?
            `;


            db.query(
                updatePaymentSql,
                [payment_status, id],
                (err) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to update payment status."
                        });
                    }


                    // ==================================================
                    // PAYMENT → PAID
                    // Pending booking → Confirmed
                    // ==================================================

                    if (
                        payment_status === "paid" &&
                        bookingStatus === "pending"
                    ) {

                        const confirmBookingSql = `
                            UPDATE bookings
                            SET booking_status = 'confirmed'
                            WHERE id = ?
                            AND booking_status = 'pending'
                        `;


                        db.query(
                            confirmBookingSql,
                            [payment.booking_id],
                            (err) => {

                                if (err) {

                                    console.error(err);

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Payment updated, but booking confirmation failed."
                                    });
                                }


                                sendBookingEmail(payment.booking_id, "confirmed");

                                return res.json({
                                    success: true,
                                    message:
                                        "Payment marked as paid and booking confirmed successfully!"
                                });
                            }
                        );

                    } else {

                        // ==================================================
                        // OTHER STATUS CHANGES
                        // ==================================================

                        return res.json({
                            success: true,
                            message:
                                "Payment status updated successfully!"
                        });
                    }
                }
            );
        }
    );
});


module.exports = router;