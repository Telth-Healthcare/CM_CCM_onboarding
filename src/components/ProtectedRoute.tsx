import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  authType: "admin" | "ccm";
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  authType,
  allowedRoles,
}) => {
  const token =
    authType === "admin"
      ? localStorage.getItem("admin_token")
      : localStorage.getItem("ccm_token");

  const userRole = localStorage.getItem("user_role");

  if (!token) {
    return (
      <Navigate
        to={authType === "admin" ? "/" : "/ccm-auth/signin"}
        replace
      />
    );
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;