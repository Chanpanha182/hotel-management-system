const express = require("express");

const router = express.Router();

const db = require("../config/db");
const adminMiddleware = require("../middleware/adminMiddleware");


// ========================================
// GET ALL REVIEWS
// GET /api/admin/reviews
// ========================================

router.get("/", adminMiddleware, async (req, res) => {
    try {
        const [reviews] = await db.promise().query(
            `
            SELECT
                reviews.id,
                reviews.booking_id,
                reviews.rating,
                reviews.comment,
                reviews.status,
                reviews.created_at,
                users.name AS guest_name,
                users.email AS guest_email,
                rooms.room_name,
                rooms.room_number
            FROM reviews
            INNER JOIN users ON reviews.user_id = users.id
            INNER JOIN rooms ON reviews.room_id = rooms.id
            ORDER BY reviews.created_at DESC
            `
        );

        res.json({
            success: true,
            data: reviews
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
// SHOW / HIDE A REVIEW
// PUT /api/admin/reviews/:id/status
// ========================================

router.put("/:id/status", adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["visible", "hidden"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review status."
            });
        }

        const [result] = await db.promise().query(
            "UPDATE reviews SET status = ? WHERE id = ?",
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found."
            });
        }

        res.json({
            success: true,
            message: status === "hidden" ? "Review hidden." : "Review is visible again."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update review."
        });
    }
});


module.exports = router;
