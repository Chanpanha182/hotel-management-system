async function sendTelegramMessage(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn("⚠️ Telegram is not configured.");
        return;
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.description || "Telegram message failed."
            );
        }

        console.log("✅ Telegram notification sent successfully.");

        return data;
    } catch (error) {
        console.error(
            "❌ Telegram notification error:",
            error.message
        );
    }
}

// Staff alerts for booking events. Never throws: a Telegram problem
// must not break the booking itself.
const BOOKING_ALERTS = {
    new: { icon: "🛎️", title: "New booking" },
    cancelled_by_guest: { icon: "❌", title: "Booking cancelled by guest" },
    cancelled: { icon: "❌", title: "Booking cancelled by staff" },
    checked_in: { icon: "🔑", title: "Guest checked in" },
    checked_out: { icon: "👋", title: "Guest checked out — room needs cleaning" }
};

async function notifyBooking(bookingId, event) {
    const alert = BOOKING_ALERTS[event];
    if (!alert) return;

    try {
        // Loaded here to keep this file usable without a database
        const db = require("../config/db");

        const [rows] = await db.promise().query(
            `
            SELECT
                bookings.id,
                DATE_FORMAT(bookings.check_in, '%e %b %Y') AS check_in,
                DATE_FORMAT(bookings.check_out, '%e %b %Y') AS check_out,
                DATEDIFF(bookings.check_out, bookings.check_in) AS nights,
                bookings.guests,
                bookings.total_amount,
                users.name AS guest_name,
                users.phone AS guest_phone,
                rooms.room_name,
                rooms.room_number
            FROM bookings
            INNER JOIN users ON bookings.user_id = users.id
            INNER JOIN rooms ON bookings.room_id = rooms.id
            WHERE bookings.id = ?
            `,
            [bookingId]
        );

        const b = rows[0];
        if (!b) return;

        const lines = [
            `${alert.icon} ${alert.title}`,
            "",
            `Booking #${b.id}`,
            `Guest: ${b.guest_name}${b.guest_phone ? ` (${b.guest_phone})` : ""}`,
            `Room ${b.room_number} – ${b.room_name}`,
            `${b.check_in} → ${b.check_out} (${b.nights} night${b.nights === 1 ? "" : "s"}, ${b.guests} guest${b.guests === 1 ? "" : "s"})`
        ];

        if (event === "new" || event.startsWith("cancelled")) {
            lines.push(`Total: $${Number(b.total_amount).toFixed(2)}`);
        }

        await sendTelegramMessage(lines.join("\n"));
    } catch (error) {
        console.error("❌ Booking Telegram alert error:", error.message);
    }
}

module.exports = {
    sendTelegramMessage,
    notifyBooking
};