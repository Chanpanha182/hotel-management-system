const db = require("../config/db");

// Emails go through Brevo's HTTP API because Render's free plan
// blocks SMTP ports, so Gmail/nodemailer cannot be used directly.

const HOTEL_NAME = "Grand Hotel";

async function sendEmail({ to, toName, subject, html }) {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey || !fromEmail) {
        console.warn("⚠️ Email is not configured.");
        return;
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey
            },
            body: JSON.stringify({
                sender: {
                    email: fromEmail,
                    name: process.env.EMAIL_FROM_NAME || HOTEL_NAME
                },
                to: [{ email: to, name: toName || to }],
                subject,
                htmlContent: html
            })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || `Brevo error ${response.status}`);
        }

        console.log(`✅ Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error("❌ Email error:", error.message);
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatDate(value) {
    const date = new Date(value);

    return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function bookingEmailHtml(booking, { heading, intro, badge, badgeColor }) {
    const frontendUrl = process.env.FRONTEND_URL || "";

    const rows = [
        ["Booking number", `#${booking.id}`],
        ["Room", `${booking.room_name} (Room ${booking.room_number})`],
        ["Check-in", formatDate(booking.check_in)],
        ["Check-out", formatDate(booking.check_out)],
        ["Guests", booking.guests],
        ["Total", `$${Number(booking.total_amount).toFixed(2)}`]
    ];

    return `
<div style="background:#faf8f4;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee">
    <div style="background:#14161c;padding:28px 32px">
      <p style="margin:0;font-family:Georgia,serif;font-size:24px;color:#ffffff">${HOTEL_NAME}</p>
    </div>

    <div style="padding:32px">
      <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${badgeColor};color:#ffffff;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">${badge}</span>

      <h1 style="font-family:Georgia,serif;font-size:26px;margin:20px 0 8px">${heading}</h1>
      <p style="margin:0 0 24px;line-height:1.6;color:#4b5563">
        Dear ${escapeHtml(booking.customer_name)},<br>${intro}
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${rows
            .map(
                ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0ece4;color:#6b7280">${label}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ece4;text-align:right;font-weight:bold">${escapeHtml(value)}</td>
        </tr>`
            )
            .join("")}
      </table>

      ${
          frontendUrl
              ? `<p style="margin:28px 0 0;text-align:center">
        <a href="${frontendUrl}/my-bookings" style="display:inline-block;background:#94692c;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px">View My Bookings</a>
      </p>`
              : ""
      }
    </div>

    <div style="padding:20px 32px;background:#faf8f4;font-size:13px;color:#6b7280;line-height:1.6">
      Questions? Call us at 010 679 527 or reply to cpanha683@gmail.com.<br>
      We look forward to welcoming you.
    </div>
  </div>
</div>`;
}

const TEMPLATES = {
    received: {
        subject: (b) => `Booking #${b.id} received – ${HOTEL_NAME}`,
        heading: "We received your booking",
        intro: "Thank you for choosing us. Your booking is reserved and waiting for payment confirmation.",
        badge: "Pending",
        badgeColor: "#b5873c"
    },
    confirmed: {
        subject: (b) => `Booking #${b.id} confirmed – ${HOTEL_NAME}`,
        heading: "Your booking is confirmed",
        intro: "We have received your payment. Your room is ready for your arrival.",
        badge: "Confirmed",
        badgeColor: "#15803d"
    }
};

// kind: "received" | "confirmed". Never throws, so callers can fire and forget.
async function sendBookingEmail(bookingId, kind) {
    const template = TEMPLATES[kind];

    try {
        const [rows] = await db.promise().query(
            `
            SELECT
                bookings.id,
                bookings.check_in,
                bookings.check_out,
                bookings.guests,
                bookings.total_amount,
                users.name AS customer_name,
                users.email AS customer_email,
                rooms.room_name,
                rooms.room_number
            FROM bookings
            INNER JOIN users ON bookings.user_id = users.id
            INNER JOIN rooms ON bookings.room_id = rooms.id
            WHERE bookings.id = ?
            `,
            [bookingId]
        );

        const booking = rows[0];

        if (!booking || !booking.customer_email) {
            return;
        }

        await sendEmail({
            to: booking.customer_email,
            toName: booking.customer_name,
            subject: template.subject(booking),
            html: bookingEmailHtml(booking, template)
        });
    } catch (error) {
        console.error("❌ Booking email error:", error.message);
    }
}

module.exports = {
    sendEmail,
    sendBookingEmail
};
