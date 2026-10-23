const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Opens the database pool and logs whether the connection works
require("./config/db");
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
const adminReportRoutes = require("./routes/adminReportRoutes");

const app = express();

// Render sits behind a proxy; needed so rate limiting sees the real visitor IP
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Slow down password guessing: 10 login/register attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: "Too many attempts. Please try again in 15 minutes."
    }
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
// Every reset request sends an email, so count all of them
const resetEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many reset requests. Please try again in an hour."
    }
});

app.use("/api/auth/forgot-password", resetEmailLimiter);
app.use("/api/auth/reset-password", authLimiter);

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});