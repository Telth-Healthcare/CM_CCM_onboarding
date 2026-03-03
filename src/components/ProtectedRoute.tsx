// components/ProtectedRoute.tsx

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken, getUserRole } from "../config/constants";

interface ProtectedRouteProps {
  authType: AuthType;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  authType,
  allowedRoles,
}) => {
  const { access } = getToken(authType);
  const userRole = getUserRole(authType);

  if (!access) {
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