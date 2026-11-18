const requireRole = require("./roleMiddleware");

module.exports = requireRole(["admin"], "Admin access required.");
