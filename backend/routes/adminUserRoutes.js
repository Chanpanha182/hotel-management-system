const express = require("express");

const router = express.Router();

const db = require("../config/db");
const adminMiddleware = require("../middleware/adminMiddleware");


// GET ALL USERS
router.get("/", adminMiddleware, (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            created_at
        FROM users
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch users."
            });
        }

        res.json({
            success: true,
            data: results
        });

    });

});


// UPDATE USER ROLE
router.put("/:id/role", adminMiddleware, (req, res) => {

    const { id } = req.params;
    const { role } = req.body;

    if (!["customer", "admin"].includes(role)) {

        return res.status(400).json({
            success: false,
            message: "Invalid role."
        });

    }

    // Prevent admin from changing their own role
    if (Number(id) === Number(req.user.id)) {

        return res.status(400).json({
            success: false,
            message: "You cannot change your own role."
        });

    }

    const sql = `
        UPDATE users
        SET role = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [role, id],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to update user role."
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });

            }

            res.json({
                success: true,
                message: "User role updated successfully!"
            });

        }
    );

});


// DELETE USER
router.delete("/:id", adminMiddleware, (req, res) => {

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (Number(id) === Number(req.user.id)) {

        return res.status(400).json({
            success: false,
            message: "You cannot delete your own account."
        });

    }

    const sql = `
        DELETE FROM users
        WHERE id = ?
    `;

    db.query(
        sql,
        [id],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to delete user. The user may have existing bookings."
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });

            }

            res.json({
                success: true,
                message: "User deleted successfully!"
            });

        }
    );

});


module.exports = router;