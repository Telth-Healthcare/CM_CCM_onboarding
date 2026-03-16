import { Suspense, lazy, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import ProtectedRoute from "./config/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";
import CCMDashboardRoutes from "./ccm/dashboard/DashboardRoutes";
import ViewEditApplication from "./components/User/ViewEditApplication";
import UserProfiles from "./pages/UserProfiles";

// Admin Auth
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const AcceptInvitationPage = lazy(
  () => import("./pages/AuthPages/AcceptInvitationPage"),
);

// CCM Auth
const CCMSignInPage = lazy(() => import("./ccm/auth/SignInPage"));
const CCMSignUpPage = lazy(() => import("./ccm/auth/SignUpPage"));

// Layouts
const AppLayout = lazy(() => import("./layout/AppLayout"));
const OnboardLayout = lazy(() => import("./ccm/pages/OnboardLayout"));

// Admin Pages
const Home = lazy(() => import("./pages/Dashboard/Home"));
const AdminUser = lazy(() => import("./components/User/AdminUser"));
const Applications = lazy(() => import("./components/User/Applications"));
const Region = lazy(() => import("./components/User/Region"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const Webinars = lazy(() => import("./components/User/Webinars"));
const Contact = lazy(() => import("./components/User/Contact"));

// Root Redirect Component
function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for user data
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData || token) {
      try {
        const user = JSON.parse(userData || "{}");
        if (user.role === "ccm" || user.authType === "ccm") {
          navigate("/ccm-dashboard");
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        navigate("/admin/signin");
      }
    } else {
      navigate("/admin/signin");
    }
  }, [navigate]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "18px",
      }}
    >
      Redirecting...
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense
        fallback={
          <div
            style={{
              height: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "18px",
            }}
          >
            Loading...
          </div>
        }
      >
        <Routes>
          {/* Root path redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Auth */}
          <Route path="/admin/signin" element={<SignIn />} />
          <Route path="/invite/accept" element={<AcceptInvitationPage />} />

          {/* CCM Auth */}
          <Route path="/ccm-auth/signin" element={<CCMSignInPage />} />
          <Route path="/ccm-auth/signup" element={<CCMSignUpPage />} />

          <Route element={<ProtectedRoute authType="ccm" />}>
            <Route path="/ccmonboard/*" element={<OnboardLayout />} />
            <Route path="/ccm-dashboard/*" element={<CCMDashboardRoutes />} />
          </Route>

          <Route element={<ProtectedRoute authType="admin" />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Home key="/dashboard" />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route
                path="/regions"
                element={<Region key={location.pathname} />}
              />

              <Route
                path="/applications"
                element={<Applications key="/applications" />}
              />
              <Route
                path="/applications/edit/:id"
                element={
                  <ProtectedRoute
                    authType="admin"
                    allowedRoles={["super_admin", "admin"]}
                  >
                    <ViewEditApplication />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute
                    authType="admin"
                    allowedRoles={["super_admin", "admin"]}
                  >
                    <AdminUser key="/users" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/webinars"
                element={
                  <ProtectedRoute
                    authType="admin"
                    allowedRoles={["super_admin", "admin"]}
                  >
                    <Webinars key="/webinars" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contact"
                element={
                  <ProtectedRoute
                    authType="admin"
                    allowedRoles={["super_admin", "admin"]}
                  >
                    <Contact key="/contact" />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="light"
        style={{ zIndex: 999999 }}
      />
    </Router>
  );
}
