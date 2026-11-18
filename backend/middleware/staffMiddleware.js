const requireRole = require("./roleMiddleware");

// Admins and receptionists (front-desk work)
module.exports = requireRole(["admin", "receptionist"], "Staff access required.");
