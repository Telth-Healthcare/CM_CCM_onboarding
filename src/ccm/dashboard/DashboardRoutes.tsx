import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import Home from "./pages/Home";
import Lectures from "./pages/Lectures";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import Reports from "./pages/Reports";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";

const DashboardRoutes = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        {/* Default redirect to home */}
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="lectures" element={<Lectures />} />
        <Route path="documents" element={<Documents />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes;