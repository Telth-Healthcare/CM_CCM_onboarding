import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import Home from "./pages/home/Home";
import Lectures from "./pages/lectures/Lectures";
import Settings from "./pages/accountsettings/Settings";
import UserProfile from "./pages/accountsettings/UserProfile";
import Reports from "./pages/reports/Reports";
import Tasks from "./pages/tasks/Tasks";
import Documents from "./pages/documents/Documents";

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