import { Navigate, Outlet } from "react-router-dom";
import { getStoredUser, isStaff, staffHome } from "../utils/auth";

// Pages for logged-in staff. `roles` lists who may open them;
// other staff are sent to their own first page, customers to the site.
function AdminRoute({ roles = ["admin"] }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={isStaff(user) ? staffHome(user) : "/"} replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
