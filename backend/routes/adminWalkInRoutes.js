const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const router = express.Router();

const db = require("../config/db");
const staffMiddleware = require("../middleware/staffMiddleware");
const { notifyBooking } = require("../utils/telegram");

// Walk-in guests without an email get a placeholder address on this
// reserved domain. Emails are never sent to it (see utils/email.js).
const PLACEHOLDER_DOMAIN = "walkin.invalid";

const PAYMENT_OPTIONS = {
    cash: { method: "Cash at Hotel", status: "paid" },
    khqr: { method: "ABA KHQR", status: "paid" },
    later: { method: "Cash at Hotel", status: "pending" }
};

const MAX_NIGHTS = 30;

function todayInCambodia() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}

// "2026-11-18" + 2 -> "2026-11-20"
function addDays(date, days) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

class WalkInError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Find the guest's account, or create one for them
async function findOrCreateGuest(conn, { name, phone, email }) {
    if (email) {
        const [found] = await conn.query("SELECT id FROM users WHERE email = ?", [email]);
        if (found.length) return found[0].id;
    } else {
        // Same phone came before as a walk-in: reuse that guest record
        const [found] = await conn.query(
            "SELECT id FROM users WHERE phone = ? AND email LIKE ? ORDER BY id DESC LIMIT 1",
            [phone, `%@${PLACEHOLDER_DOMAIN}`]
        );
        if (found.length) {
            await conn.query("UPDATE users SET name = ? WHERE id = ?", [name, found[0].id]);
            return found[0].id;
        }
    }

    // Random password nobody knows: the guest can only get in with
    // "Forgot password", and only if a real email was given.
    const password = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
    const guestEmail =
        email || `walkin-${Date.now()}-${crypto.randomBytes(3).toString("hex")}@${PLACEHOLDER_DOMAIN}`;

    const [result] = await conn.query(
        "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'customer')",
        [name, guestEmail, phone, password]
    );

    return result.insertId;
}


// POST /api/admin/walk-in
// Book a room for a guest standing at the front desk.
router.post("/", staffMiddleware, async (req, res) => {

    const name = String(req.body.guest_name || "").trim();
    const phone = String(req.body.guest_phone || "").trim();
    const email = String(req.body.guest_email || "").trim().toLowerCase();
    const roomId = Number(req.body.room_id);
    const guests = Number(req.body.guests);
    const nights = Number(req.body.nights);
    const payment = PAYMENT_OPTIONS[req.body.payment];
    const checkInNow = req.body.check_in_now !== false;

    // Validate the form
    if (!name || name.length > 100) {
        return res.status(400).json({ success: false, message: "Please enter the guest's name." });
    }
    if (!/^[0-9+\s-]{6,20}$/.test(phone)) {
        return res.status(400).json({ success: false, message: "Please enter a valid phone number." });
    }
    if (email && (!/^\S+@\S+\.\S+$/.test(email) || email.length > 100 || email.endsWith(`@${PLACEHOLDER_DOMAIN}`))) {
        return res.status(400).json({ success: false, message: "Please enter a valid email, or leave it empty." });
    }
    if (!Number.isInteger(roomId) || roomId < 1) {
        return res.status(400).json({ success: false, message: "Please choose a room." });
    }
    if (!Number.isInteger(guests) || guests < 1) {
        return res.status(400).json({ success: false, message: "Please enter the number of guests." });
    }
    if (!Number.isInteger(nights) || nights < 1 || nights > MAX_NIGHTS) {
        return res.status(400).json({ success: false, message: `Nights must be between 1 and ${MAX_NIGHTS}.` });
    }
    if (!payment) {
        return res.status(400).json({ success: false, message: "Please choose a payment option." });
    }

    const checkIn = todayInCambodia();
    const checkOut = addDays(checkIn, nights);

    let conn;

    try {
        conn = await db.promise().getConnection();
        await conn.beginTransaction();

        // Lock the room so two staff cannot book it at the same moment
        const [rooms] = await conn.query(
            "SELECT id, room_number, price, capacity, status FROM rooms WHERE id = ? FOR UPDATE",
            [roomId]
        );
        const room = rooms[0];

        if (!room) throw new WalkInError(404, "Room not found.");
        if (room.status === "maintenance") {
            throw new WalkInError(400, `Room ${room.room_number} is under maintenance.`);
        }
        if (guests > room.capacity) {
            throw new WalkInError(400, `Room ${room.room_number} fits at most ${room.capacity} guest(s).`);
        }

        // Someone is still in the room, or it is booked for these nights
        const [clash] = await conn.query(
            `
            SELECT id, DATE_FORMAT(check_in, '%e %b') AS check_in
            FROM bookings
            WHERE room_id = ?
              AND (
                    booking_status = 'checked_in'
                    OR (
                        booking_status IN ('pending', 'confirmed')
                        AND check_in < ?
                        AND check_out > ?
                    )
              )
            LIMIT 1
            `,
            [roomId, checkOut, checkIn]
        );

        if (clash.length) {
            throw new WalkInError(
                409,
                `Room ${room.room_number} is not free for ${nights} night(s) — booking #${clash[0].id} starts ${clash[0].check_in}. Choose fewer nights or another room.`
            );
        }

        const userId = await findOrCreateGuest(conn, { name, phone, email });
        const total = Number(room.price) * nights;

        const [booking] = await conn.query(
            `
            INSERT INTO bookings
                (user_id, room_id, check_in, check_out, guests, total_amount, booking_status, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'walk_in')
            `,
            [userId, roomId, checkIn, checkOut, guests, total, checkInNow ? "checked_in" : "confirmed"]
        );

        await conn.query(
            `
            INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_date)
            VALUES (?, ?, ?, ?, NOW())
            `,
            [booking.insertId, total, payment.method, payment.status]
        );

        await conn.commit();

        notifyBooking(booking.insertId, "walk_in");

        res.status(201).json({
            success: true,
            message: checkInNow
                ? `Walk-in booked and checked in to Room ${room.room_number}.`
                : `Walk-in booked for Room ${room.room_number}.`,
            data: {
                booking_id: booking.insertId,
                check_in: checkIn,
                check_out: checkOut,
                total_amount: total
            }
        });
    } catch (err) {
        if (conn) await conn.rollback().catch(() => {});

        if (err instanceof WalkInError) {
            return res.status(err.status).json({ success: false, message: err.message });
        }

        console.error(err);
        res.status(500).json({ success: false, message: "Failed to create walk-in booking." });
    } finally {
        if (conn) conn.release();
    }
});


module.exports = router;
