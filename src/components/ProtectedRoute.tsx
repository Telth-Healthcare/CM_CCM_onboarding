import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken, getUserRole } from "../config/constants";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { access } = getToken();
  const userRole = getUserRole();

  if (!access) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If there are children, render them, otherwise render Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;