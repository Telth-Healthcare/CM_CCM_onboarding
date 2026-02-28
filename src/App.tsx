import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/ProtectedRoute";
import SignIn from "./pages/AuthPages/SignIn";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/Dashboard/Home";
import UserProfiles from "./pages/UserProfiles";
import Blank from "./pages/Blank";
import NotFound from "./pages/OtherPage/NotFound";
import AdminUser from "./components/User/AdminUser";
import Applications from "./components/User/Applications";
import AcceptInvitationPage from "./pages/AuthPages/AcceptInvitationPage";
import Region from "./components/User/Region";

export default function App() {
  return (
    <div>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<SignIn />} />
          <Route path="/invite/accept/" element={<AcceptInvitationPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/blank" element={<Blank />} />
              
              {/* Wrap the routes that need role-based protection */}
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                    <AdminUser />
                  </ProtectedRoute>
                } 
              />
              <Route path="/regions" element={<Region />} />
              <Route path="/applications" element={<Applications />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 999999 }}
      />
    </div>
  );
}

