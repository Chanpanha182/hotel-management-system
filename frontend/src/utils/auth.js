// Who is logged in, and where staff should land.

export const STAFF_ROLES = ["admin", "receptionist"];

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
}

export function isStaff(user) {
  return STAFF_ROLES.includes(user?.role);
}

export function isAdmin(user) {
  return user?.role === "admin";
}

// First page of the staff area for this user
export function staffHome(user) {
  return isAdmin(user) ? "/admin" : "/admin/room-board";
}
