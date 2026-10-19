const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const roomRoutes = require("./routes/roomRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminRoomRoutes = require("./routes/adminRoomRoutes");
const adminBookingRoutes = require("./routes/adminBookingRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminPaymentRoutes = require("./routes/adminPaymentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const abaPaywayRoutes = require("./routes/abaPaywayRoutes");
const { sendTelegramMessage } = require("./utils/telegram");
const adminReportRoutes = require("./routes/adminReportRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/rooms", adminRoomRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payway", abaPaywayRoutes);
app.use("/api/admin/reports", adminReportRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Hotel Management API is running!"
    });
});

app.get("/api/test-telegram", async (req, res) => {
    try {
        await sendTelegramMessage(
            "✅ Telegram is connected to the Hotel Management System!"
        );

        res.json({
            success: true,
            message: "Telegram notification sent successfully!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1 AS result", (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database query failed",
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "Database is working!",
            data: results
        });
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});