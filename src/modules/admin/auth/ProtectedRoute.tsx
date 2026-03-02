import { Navigate, Outlet } from "react-router-dom";
import { getUserRole } from "../../../config/constants";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem("access_token");
  const isRole = getUserRole()
  

  if (!token) {
    return <Navigate to="/control-center/signin" replace />;
  }

  if (!allowedRoles.includes(isRole?.role || "")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
