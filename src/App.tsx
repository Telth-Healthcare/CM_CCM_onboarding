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

export default function App() {
  return (
    <div>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/signin" element={<SignIn />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/users" element={<AdminUser />} />
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
