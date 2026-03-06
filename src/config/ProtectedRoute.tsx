// components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthType, getToken, getUserRole } from "../config/constants";


interface ProtectedRouteProps {
  authType: AuthType;
  allowedRoles?: string[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  authType,
  allowedRoles,
  children,
}) => {
  const { access } = getToken(authType);
  const userRole = getUserRole(authType);

  if (!access) {
    return (
      <Navigate
        to={authType === "admin" ? "/admin/signin" : "/ccm-auth/signin"}
        replace
      />
    );
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }


  if (children) {
    return <>{children}</>;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;