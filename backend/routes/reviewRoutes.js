const express = require("express");

const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const MAX_COMMENT_LENGTH = 1000;

// A stay can be reviewed once it has ended: checked out, or confirmed /
// checked in with a check-out date that has already passed.
const REVIEWABLE_SQL = `
    (
        bookings.booking_status = 'checked_out'
        OR (
            bookings.booking_status IN ('confirmed', 'checked_in')
            AND bookings.check_out <= CURDATE()
        )
    )
`;


// ========================================
// GET REVIEWS FOR A ROOM (public)
// GET /api/reviews/room/:roomId
// ========================================

router.get("/room/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;

        const [reviews] = await db.promise().query(
            `
            SELECT
                reviews.id,
                reviews.rating,
                reviews.comment,
                reviews.created_at,
                users.name AS guest_name
            FROM reviews
            INNER JOIN users ON reviews.user_id = users.id
            WHERE reviews.room_id = ?
            AND reviews.status = 'visible'
            ORDER BY reviews.created_at DESC
            `,
            [roomId]
        );

        // Show only the guest's first name for privacy
        const data = reviews.map((review) => ({
            ...review,
            guest_name: String(review.guest_name || "Guest").trim().split(/\s+/)[0]
        }));

        const count = data.length;
        const average = count
            ? data.reduce((sum, review) => sum + review.rating, 0) / count
            : 0;

        res.json({
            success: true,
            data,
            summary: {
                count,
                average: Math.round(average * 10) / 10
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load reviews."
        });
    }
});


// ========================================
// WRITE A REVIEW (logged-in guest)
// POST /api/reviews
// ========================================

router.post("/", authMiddleware, async (req, res) => {
    try {
        const bookingId = Number(req.body.booking_id);
        const rating = Number(req.body.rating);
        const comment = String(req.body.comment || "").trim();

        if (!Number.isInteger(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required."
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Please choose a rating from 1 to 5 stars."
            });
        }

        if (comment.length > MAX_COMMENT_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `Comment must be ${MAX_COMMENT_LENGTH} characters or less.`
            });
        }

        const [bookings] = await db.promise().query(
            `
            SELECT
                bookings.id,
                bookings.room_id,
                ${REVIEWABLE_SQL} AS reviewable
            FROM bookings
            WHERE bookings.id = ?
            AND bookings.user_id = ?
            `,
            [bookingId, req.user.id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        const booking = bookings[0];

        if (!booking.reviewable) {
            return res.status(400).json({
                success: false,
                message: "You can write a review after your stay has ended."
            });
        }

        try {
            const [result] = await db.promise().query(
                `
                INSERT INTO reviews (booking_id, user_id, room_id, rating, comment)
                VALUES (?, ?, ?, ?, ?)
                `,
                [booking.id, req.user.id, booking.room_id, rating, comment || null]
            );

            res.status(201).json({
                success: true,
                message: "Thank you for your review!",
                data: { review_id: result.insertId }
            });

        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    success: false,
                    message: "You have already reviewed this stay."
                });
            }

            throw error;
        }

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to save your review."
        });
    }
});


module.exports = router;
module.exports.REVIEWABLE_SQL = REVIEWABLE_SQL;
