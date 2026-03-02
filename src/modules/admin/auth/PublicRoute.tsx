import { jwtDecode } from "jwt-decode";
import { Navigate, Outlet } from "react-router";

const PublicRoute = () => {
  const token = localStorage.getItem("access_token");

  if (!token) return <Outlet />;

  try {
    const decoded: any = jwtDecode(token);

    if (decoded.role === "admin" || decoded.role === "super_admin")
      return <Navigate to="/control-center" replace />;

    if (decoded.role === "shg")
      return <Navigate to="/shg-portal" replace />;

    if (decoded.role === "customer")
      return <Navigate to="/shop" replace />;
  } catch {
    return <Outlet />;
  }

  return <Outlet />;
};
 export default PublicRoute;