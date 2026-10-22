const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { sendTelegramMessage } = require("../utils/telegram");

const router = express.Router();

// ============================================================
// ABA PAYWAY CONFIG
// ============================================================

const MERCHANT_ID = process.env.ABA_PAYWAY_MERCHANT_ID;
const API_KEY = process.env.ABA_PAYWAY_API_KEY;
const BASE_URL = process.env.ABA_PAYWAY_BASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// ============================================================
// GET REQUEST TIME
// Format: YYYYMMDDHHmmss
// ============================================================

function getReqTime() {
  const d = new Date();

  const pad = (n) => String(n).padStart(2, "0");

  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

// ============================================================
// SIGN PAYWAY
// Teacher's method:
// HMAC SHA512 + Base64
// ============================================================

function signPayWay(raw) {
  return crypto.createHmac("sha512", API_KEY).update(raw).digest("base64");
}

// ============================================================
// BASE64 ENCODE
// ============================================================

function encodeBase64(value) {
  return Buffer.from(value).toString("base64");
}

// ============================================================
// BUILD PURCHASE HASH
//
// This follows the structure from your teacher's payway.js
// ============================================================

function buildPurchaseHash(payload) {
  const raw =
    payload.req_time +
    payload.merchant_id +
    payload.tran_id +
    payload.amount +
    payload.items +
    payload.shipping +
    payload.firstname +
    payload.lastname +
    payload.email +
    payload.phone +
    payload.type +
    payload.payment_option +
    payload.return_url +
    payload.cancel_url +
    payload.continue_success_url +
    payload.currency;

  return signPayWay(raw);
}

// ============================================================
// BUILD CHECK TRANSACTION HASH
// ============================================================

function buildCheckTransactionHash({ req_time, merchant_id, tran_id }) {
  const raw = req_time + merchant_id + tran_id;

  return signPayWay(raw);
}

// ============================================================
// CREATE ABA PAYWAY PAYMENT
//
// POST /api/payway/:bookingId
// ============================================================

router.post("/:bookingId", authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // --------------------------------------------------------
    // Check ABA configuration
    // --------------------------------------------------------

    if (!MERCHANT_ID || !API_KEY || !BASE_URL) {
      return res.status(500).json({
        success: false,
        message: "ABA PayWay configuration is missing.",
      });
    }

    // --------------------------------------------------------
    // Validate booking ID
    // --------------------------------------------------------

    if (!bookingId || isNaN(Number(bookingId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    // --------------------------------------------------------
    // Get booking
    //
    // Join users + rooms so we can get customer information
    // --------------------------------------------------------

    const [bookings] = await db.promise().query(
      `
            SELECT
                b.id,
                b.user_id,
                b.room_id,
                b.check_in,
                b.check_out,
                b.guests,
                b.total_amount,
                b.booking_status,

                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,

                r.room_number,
                r.room_name

            FROM bookings b

            INNER JOIN users u
                ON b.user_id = u.id

            INNER JOIN rooms r
                ON b.room_id = r.id

            WHERE b.id = ?
            `,
      [Number(bookingId)],
    );

    // --------------------------------------------------------
    // Booking not found
    // --------------------------------------------------------

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const booking = bookings[0];

    // --------------------------------------------------------
    // Security:
    // Make sure the booking belongs to logged-in user
    // --------------------------------------------------------

    if (req.user && Number(booking.user_id) !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to pay for this booking.",
      });
    }

    // --------------------------------------------------------
    // Don't allow cancelled booking
    // --------------------------------------------------------

    if (booking.booking_status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled bookings cannot be paid.",
      });
    }

    // --------------------------------------------------------
    // Amount
    // --------------------------------------------------------

    const amount = Number(booking.total_amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount.",
      });
    }

    // --------------------------------------------------------
    // Check existing payment
    // --------------------------------------------------------

    const [existingPayments] = await db.promise().query(
      `
            SELECT *
            FROM payments
            WHERE booking_id = ?
            ORDER BY id DESC
            LIMIT 1
            `,
      [Number(bookingId)],
    );

    if (
      existingPayments.length > 0 &&
      existingPayments[0].payment_status === "paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "This booking has already been paid.",
      });
    }

    // --------------------------------------------------------
    // Generate unique transaction ID
    //
    // Example:
    // HOTEL-123-1759291234567
    // --------------------------------------------------------

    const tranId = `HOTEL-${booking.id}-${Date.now()}`;

    // --------------------------------------------------------
    // Create local payment
    // --------------------------------------------------------

    const [paymentResult] = await db.promise().query(
      `
            INSERT INTO payments
            (
                booking_id,
                amount,
                payment_method,
                payway_tran_id,
                payment_status
            )
            VALUES (?, ?, ?, ?, 'pending')
            `,
      [Number(bookingId), amount.toFixed(2), "ABA_PAYWAY", tranId],
    );

    const localPaymentId = paymentResult.insertId;

    // --------------------------------------------------------
    // Request time
    // --------------------------------------------------------

    const req_time = getReqTime();

    // --------------------------------------------------------
    // Customer name
    //
    // Your users table only has one "name" field.
    // So we use it as firstname and leave lastname empty.
    // --------------------------------------------------------

    const customerName = booking.customer_name || "Hotel Customer";

    const nameParts = customerName.trim().split(/\s+/);

    const firstname = nameParts[0] || "Hotel";

    const lastname = nameParts.slice(1).join(" ") || "Customer";

    const email = booking.customer_email || "customer@example.com";

    const phone = booking.customer_phone || "000000000";

    // --------------------------------------------------------
    // PayWay items
    //
    // Teacher's code converts the item JSON to Base64.
    // --------------------------------------------------------

    let paywayItems = JSON.stringify([
      {
        name: `${booking.room_name || "Hotel Room"} - Room ${booking.room_number || ""}`,
        quantity: 1,
        price: amount,
      },
    ]);

    paywayItems = encodeBase64(paywayItems);

    // --------------------------------------------------------
    // Return URLs
    // --------------------------------------------------------

    const returnUrl = `${FRONTEND_URL}/payment/${booking.id}`;

    const cancelUrl = `${FRONTEND_URL}/payment/${booking.id}`;

    const successUrl = `${FRONTEND_URL}/payment/${booking.id}?tranId=${tranId}`;

    // --------------------------------------------------------
    // PayWay payment payload
    //
    // Based on your teacher's paymentRoutes.js
    // --------------------------------------------------------

    const paymentPayload = {
      merchant_id: MERCHANT_ID,

      req_time,

      tran_id: tranId,

      amount: amount.toFixed(2),

      items: paywayItems,

      shipping: "0.00",

      firstname,

      lastname,

      email,

      phone,

      type: "purchase",

      view_type: "hosted",

      payment_option: "abapay_khqr",

      return_url: returnUrl,

      cancel_url: cancelUrl,

      continue_success_url: successUrl,

      currency: "USD",

      payment_gate: 0,
    };

    // --------------------------------------------------------
    // Generate hash
    // --------------------------------------------------------

    const hash = buildPurchaseHash(paymentPayload);

    // --------------------------------------------------------
    // PayWay endpoint
    // --------------------------------------------------------

    const action = `${BASE_URL}/api/payment-gateway/v1/payments/purchase`;

    console.log("====================================");
    console.log("ABA PAYWAY PAYMENT CREATED");
    console.log("Booking ID:", booking.id);
    console.log("Payment ID:", localPaymentId);
    console.log("Transaction ID:", tranId);
    console.log("Amount:", amount.toFixed(2));
    console.log("====================================");

    // --------------------------------------------------------
    // Return PayWay information to frontend
    // --------------------------------------------------------

    return res.json({
      success: true,

      message: "Payment created successfully.",

      data: {
        payment: {
          id: localPaymentId,
          booking_id: booking.id,
          amount: amount.toFixed(2),
          payment_method: "ABA_PAYWAY",
          payment_status: "pending",
          tran_id: tranId,
        },

        payway: {
          action,
          method: "POST",
          target: "aba_webservice",
          id: "aba_merchant_request",

          fields: {
            ...paymentPayload,
            hash,
          },
        },
      },
    });
  } catch (error) {
    console.error("ABA PayWay create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create ABA PayWay payment.",
      error: error.message,
    });
  }
});

// ============================================================
// CHECK ABA PAYWAY TRANSACTION
//
// POST /api/payway/:tranId/check
// ============================================================


router.post("/:tranId/check", authMiddleware, async (req, res) => {
  try {
    const { tranId } = req.params;

    if (!tranId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required.",
      });
    }

    if (!MERCHANT_ID || !API_KEY || !BASE_URL) {
      return res.status(500).json({
        success: false,
        message: "ABA PayWay configuration is missing.",
      });
    }

    // Find the local payment and verify its owner.
    const [payments] = await db.promise().query(
      `
      SELECT
        p.id,
        p.booking_id,
        p.amount,
        p.payment_status,
        b.user_id
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.id
      WHERE p.payway_tran_id = ?
      LIMIT 1
      `,
      [tranId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction not found.",
      });
    }

    const payment = payments[0];

    if (Number(payment.user_id) !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to check this payment.",
      });
    }

    // Check transaction status with ABA PayWay.
    const req_time = getReqTime();

    const hash = buildCheckTransactionHash({
      req_time,
      merchant_id: MERCHANT_ID,
      tran_id: tranId,
    });

    const response = await fetch(
      `${BASE_URL}/api/payment-gateway/v1/payments/check-transaction-2`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          req_time,
          merchant_id: MERCHANT_ID,
          tran_id: tranId,
          hash,
        }),
      }
    );

    const abaData = await response.json();

    console.log("ABA PayWay check response:", abaData);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "ABA PayWay request failed.",
        data: abaData,
      });
    }

    const paymentStatus = abaData?.data?.payment_status;
    const paymentStatusCode = abaData?.data?.payment_status_code;

    // Process only successful ABA payments.
    if (
      paymentStatus === "APPROVED" &&
      Number(paymentStatusCode) === 0
    ) {
      // Atomically mark the payment as paid only once.
      // Repeated or simultaneous checks cannot send another
      // notification after this payment has already been paid.
      const [updateResult] = await db.promise().query(
        `
        UPDATE payments
        SET payment_status = 'paid',
            payment_date = CURRENT_TIMESTAMP
        WHERE id = ?
          AND payment_status <> 'paid'
        `,
        [payment.id]
      );

      if (updateResult.affectedRows === 1) {
        // This request changed the payment to paid.
        // Confirm the associated booking.
        await db.promise().query(
          `
          UPDATE bookings
          SET booking_status = 'confirmed'
          WHERE id = ?
            AND booking_status = 'pending'
          `,
          [payment.booking_id]
        );

        console.log("Payment marked as paid.");
        console.log("Payment ID:", payment.id);
        console.log("Booking ID:", payment.booking_id);

        // Send Telegram only for the first successful update.
        sendTelegramMessage(
          `💳 ABA PAYMENT SUCCESSFUL

🏨 Hotel Management System

Booking ID: #${payment.booking_id}
Payment ID: #${payment.id}
Transaction ID: ${tranId}
Amount: $${Number(payment.amount).toFixed(2)}

💰 Payment Status: PAID
📋 Booking Status: CONFIRMED`
        ).catch((telegramError) => {
          console.error(
            "Telegram notification failed:",
            telegramError.message
          );
        });
      } else {
        console.log(
          `Payment ${payment.id} was already paid. ` +
          "Telegram notification skipped."
        );
      }
    }

    return res.json({
      success: true,
      message: "Payment checked successfully.",
      data: {
        tran_id: tranId,
        aba: abaData,
      },
    });
  } catch (error) {
    console.error("ABA PayWay check transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check ABA PayWay transaction.",
      error: error.message,
    });
  }
});


module.exports = router;
