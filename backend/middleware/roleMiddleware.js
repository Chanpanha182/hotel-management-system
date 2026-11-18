const authMiddleware = require("./authMiddleware");
const db = require("../config/db");

// Allow only users whose CURRENT role (read from the database, not the
// login token) is in `roles`. Removing someone's staff access therefore
// takes effect immediately instead of when their token expires.
function requireRole(roles, message) {
    return (req, res, next) => {
        authMiddleware(req, res, () => {

            db.query(
                "SELECT role FROM users WHERE id = ?",
                [req.user.id],
                (err, results) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to check access."
                        });
                    }

                    const role = results[0]?.role;

                    if (!roles.includes(role)) {
                        return res.status(403).json({ success: false, message });
                    }

                    req.user.role = role;
                    next();
                }
            );
        });
    };
}

module.exports = requireRole;
