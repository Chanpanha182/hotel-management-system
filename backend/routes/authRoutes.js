const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();
const db = require("../config/db");

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password
        } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        // Check if email already exists
        const checkSql =
            "SELECT id FROM users WHERE email = ?";

        db.query(checkSql, [email], async (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered."
                });
            }

            // Hash password
            const hashedPassword =
                await bcrypt.hash(password, 10);

            // Insert user
            const insertSql = `
                INSERT INTO users
                (name, email, phone, password)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    name,
                    email,
                    phone || null,
                    hashedPassword
                ],
                (err, result) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to create account."
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Account created successfully!",
                        userId: result.insertId
                    });
                }
            );
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});


// =========================
// LOGIN
// =========================
router.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    const sql =
        "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Database error."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = results[0];

        // Compare password
        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    });
});



// =========================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// =========================

const RESET_MINUTES = 30;

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

router.post("/forgot-password", async (req, res) => {
    // Same answer whether or not the email exists, so this form
    // cannot be used to discover who has an account.
    const genericReply = {
        success: true,
        message:
            "If an account exists for this email, we have sent a password reset link."
    };

    try {
        const email = String(req.body.email || "").trim();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const [users] = await db.promise().query(
            "SELECT id, name, email FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.json(genericReply);
        }

        const user = users[0];

        // Older unused links stop working when a new one is requested
        await db.promise().query(
            "UPDATE password_resets SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND used_at IS NULL",
            [user.id]
        );

        const token = crypto.randomBytes(32).toString("hex");

        await db.promise().query(
            `
            INSERT INTO password_resets (user_id, token_hash, expires_at)
            VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))
            `,
            [user.id, hashToken(token), RESET_MINUTES]
        );

        const resetUrl =
            `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl,
            minutes: RESET_MINUTES
        });

        res.json(genericReply);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not process the request. Please try again."
        });
    }
});


// =========================
// RESET PASSWORD
// POST /api/auth/reset-password
// =========================

router.post("/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required."
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const [rows] = await db.promise().query(
            `
            SELECT id, user_id
            FROM password_resets
            WHERE token_hash = ?
            AND used_at IS NULL
            AND expires_at > UTC_TIMESTAMP()
            `,
            [hashToken(String(token))]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This reset link is invalid or has expired. Please request a new one."
            });
        }

        const reset = rows[0];

        // Mark the link used first so it cannot be used twice
        const [marked] = await db.promise().query(
            "UPDATE password_resets SET used_at = UTC_TIMESTAMP() WHERE id = ? AND used_at IS NULL",
            [reset.id]
        );

        if (marked.affectedRows !== 1) {
            return res.status(400).json({
                success: false,
                message:
                    "This reset link has already been used. Please request a new one."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, reset.user_id]
        );

        res.json({
            success: true,
            message: "Your password has been changed. You can now log in."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not reset the password. Please try again."
        });
    }
});


module.exports = router;