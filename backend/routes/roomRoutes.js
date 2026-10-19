const express = require("express");
const router = express.Router();

const db = require("../config/db");

// Get all rooms
router.get("/", (req, res) => {
    const sql = "SELECT * FROM rooms ORDER BY id DESC";

    db.query(sql, (err, results) => {
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