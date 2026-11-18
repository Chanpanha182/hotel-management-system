const express = require("express");

const router = express.Router();

const db = require("../config/db");
const staffMiddleware = require("../middleware/staffMiddleware");

// Today's date in Cambodia (the server runs in UTC), as YYYY-MM-DD
function todayInCambodia() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}

// Work out what colour a room shows on the board.
// Order matters: maintenance > occupied > cleaning > arriving > available.
function boardStatus(room, stay, arrival) {
    if (room.status === "maintenance") return "maintenance";
    if (stay || room.status === "occupied") return "occupied";
    if (room.housekeeping === "dirty") return "cleaning";
    if (arrival) return "arriving";
    return "available";
}


// GET /api/admin/room-board
// Every room with its live status, current guest and next arrival.
router.get("/", staffMiddleware, (req, res) => {

    const today = todayInCambodia();

    const roomsSql = `
        SELECT id, room_number, room_name, room_type, price, capacity, status, housekeeping
        FROM rooms
        ORDER BY LENGTH(room_number), room_number
    `;

    // Guests in the room now, plus bookings that have not ended yet
    const bookingsSql = `
        SELECT
            bookings.id,
            bookings.room_id,
            bookings.booking_status,
            DATE_FORMAT(bookings.check_in, '%Y-%m-%d') AS check_in,
            DATE_FORMAT(bookings.check_out, '%Y-%m-%d') AS check_out,
            bookings.guests,
            bookings.source,
            users.name AS guest_name,
            users.phone AS guest_phone
        FROM bookings
        INNER JOIN users ON bookings.user_id = users.id
        WHERE bookings.booking_status = 'checked_in'
           OR (
                bookings.booking_status IN ('pending', 'confirmed')
                AND bookings.check_out > ?
           )
        ORDER BY bookings.check_in ASC
    `;

    db.query(roomsSql, (err, rooms) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Failed to load rooms." });
        }

        db.query(bookingsSql, [today], (err, bookings) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Failed to load bookings." });
            }

            const data = rooms.map((room) => {
                const roomBookings = bookings.filter((b) => b.room_id === room.id);

                const stay = roomBookings.find((b) => b.booking_status === "checked_in") || null;

                // Should arrive today (or was due earlier and has not checked in yet)
                const arrival = stay ? null : roomBookings.find(
                    (b) => b.booking_status !== "checked_in" && b.check_in <= today
                ) || null;

                const next = roomBookings.find(
                    (b) => b.booking_status !== "checked_in" && b.check_in > today
                ) || null;

                return {
                    ...room,
                    board_status: boardStatus(room, stay, arrival),
                    stay,
                    arrival,
                    next
                };
            });

            res.json({ success: true, today, data });
        });
    });
});


// PUT /api/admin/room-board/:id/housekeeping  { housekeeping: "clean" | "dirty" }
router.put("/:id/housekeeping", staffMiddleware, (req, res) => {

    const { housekeeping } = req.body;

    if (!["clean", "dirty"].includes(housekeeping)) {
        return res.status(400).json({ success: false, message: "Invalid housekeeping value." });
    }

    db.query(
        "UPDATE rooms SET housekeeping = ? WHERE id = ?",
        [housekeeping, req.params.id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Failed to update room." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Room not found." });
            }

            res.json({ success: true, message: `Room marked ${housekeeping}.` });
        }
    );
});


// PUT /api/admin/room-board/:id/maintenance  { maintenance: true | false }
router.put("/:id/maintenance", staffMiddleware, (req, res) => {

    const status = req.body.maintenance ? "maintenance" : "available";

    db.query(
        "UPDATE rooms SET status = ? WHERE id = ?",
        [status, req.params.id],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Failed to update room." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Room not found." });
            }

            res.json({ success: true, message: `Room set to ${status}.` });
        }
    );
});


module.exports = router;
