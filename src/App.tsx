import { Suspense, lazy, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import ProtectedRoute from "./config/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";
import CCMDashboardRoutes from "./ccm/dashboard/DashboardRoutes";
import ViewEditApplication from "./components/User/ViewEditApplication";
import UserProfiles from "./pages/UserProfiles";
import Invitaion from "./components/User/Invitation";
import ViewGroup from "./components/User/groupUser/ViewGroup";
import ViewCMList from "./components/User/userType/ViewCMList";
import ViewFinancier from "./components/User/userType/ViewFinancier";
import ViewTrainer from "./components/User/userType/ViewTrainer";
import ViewAdminList from "./components/User/userType/ViewAdminList";
import ViewCCMList from "./components/User/userType/ViewCCMList";
import ViewMiscellaneous from "./components/User/userType/ViewMiscellaneous";
import { setNavigate } from "./api";

import CCMOnboard from "./components/User/UserOnboardProcess/Onboard";
import { STEPS } from "./components/User/UserOnboardProcess/types/Constants";

const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const AcceptInvitationPage = lazy(
  () => import("./pages/AuthPages/AcceptInvitationPage"),
);

const CCMSignInPage = lazy(() => import("./ccm/auth/SignInPage"));
const CCMSignUpPage = lazy(() => import("./ccm/auth/SignUpPage"));

const AppLayout = lazy(() => import("./layout/AppLayout"));
const OnboardLayout = lazy(() => import("./ccm/pages/OnboardLayout"));

const Home = lazy(() => import("./pages/Dashboard/Home"));
const Applications = lazy(() => import("./components/User/Applications"));
const Region = lazy(() => import("./components/User/Region"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const Webinars = lazy(() => import("./components/User/Webinars"));
const Contact = lazy(() => import("./components/User/Contact"));
const CourseDetails = lazy(
  () => import("./components/User/course/CourseDetails"),
);
const Enrollment = lazy(() => import("./components/User/course/Enrollment"));

// ── NavigateSetup ─────────────────────────────────────────────────────────────
function NavigateSetup() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);
  return null;
}

// ── RootRedirect ──────────────────────────────────────────────────────────────
function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
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
      } catch {
        navigate("/ccm-auth/signin");
      }
    } else {
      navigate("/ccm-auth/signin");
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

function OnboardRouter() {
  const location = useLocation();
  const currentId = location.pathname.split("/").pop() ?? "personal-info";
  const idx = STEPS.findIndex((s) => s.id === currentId);
  const currentIndex = idx >= 0 ? idx : 0;

  const targetUserId = (location.state as any)?.targetUserId as
    | number
    | undefined;

  return (
    <CCMOnboard
      currentId={currentId}
      currentIndex={currentIndex}
      targetUserId={targetUserId}
      useRouting={true}
    />
  );
}

function adminRoutes(location: ReturnType<typeof useLocation>) {
  return (
    <Route element={<ProtectedRoute authType="admin" />}>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Home key="/dashboard" />} />
        <Route path="/profile" element={<UserProfiles />} />
        <Route path="/regions" element={<Region key={location.pathname} />} />
        <Route
          path="/course"
          element={<CourseDetails key={location.pathname} />}
        />
        <Route
          path="/enrollments"
          element={
            <ProtectedRoute
              authType="admin"
              allowedRoles={["super_admin", "admin", "trainer"]}
            >
              <Enrollment key="/enrollments" />
            </ProtectedRoute>
          }
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
              allowedRoles={["super_admin", "admin", "financier"]}
            >
              <ViewEditApplication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invitation"
          element={
            <ProtectedRoute
              authType="admin"
              allowedRoles={["super_admin", "admin"]}
            >
              <Invitaion key="/invitation" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group"
          element={
            <ProtectedRoute
              authType="admin"
              allowedRoles={["super_admin", "admin", "trainer"]}
            >
              <ViewGroup key="/group" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/miscellaneous"
          element={
            <ProtectedRoute authType="admin" allowedRoles={["super_admin"]}>
              <ViewMiscellaneous key="/miscellaneous" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              authType="admin"
              allowedRoles={["super_admin", "admin"]}
            >
              <ViewAdminList key="/admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer"
          element={
            <ProtectedRoute
              authType="admin"
              allowedRoles={["super_admin", "admin"]}
            >
              <ViewTrainer key="/trainer" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financier"
          element={
            <ProtectedRoute
              authType="admin"
              allowedRoles={["super_admin", "admin"]}
            >
              <ViewFinancier key="/financier" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ccm-list"
          element={
            <ProtectedRoute
              authType="admin"
              allowedRoles={["super_admin", "admin"]}
            >
              <ViewCCMList key="/ccm-list" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cm-list"
          element={
            <ProtectedRoute
              authType="admin"
              allowedRoles={["super_admin", "admin"]}
            >
              <ViewCMList key="/cm-list" />
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

        <Route path="/onboardProcess" element={<OnboardRouter />} />
        <Route
          path="/onboardProcess/personal-info"
          element={<OnboardRouter />}
        />
        <Route
          path="/onboardProcess/address-info"
          element={<OnboardRouter />}
        />
        <Route
          path="/onboardProcess/personal-documents"
          element={<OnboardRouter />}
        />
        <Route
          path="/onboardProcess/education-documents"
          element={<OnboardRouter />}
        />
        <Route path="/onboardProcess/preview" element={<OnboardRouter />} />
      </Route>
    </Route>
  );
}

const Fallback = () => (
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
);

function AppRoutes() {
  const location = useLocation();

  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Admin Auth */}
      <Route path="/admin/signin" element={<SignIn />} />
      <Route path="/invite/accept" element={<AcceptInvitationPage />} />

      {/* CCM Auth */}
      <Route path="/ccm-auth/signin" element={<CCMSignInPage />} />
      <Route path="/ccm-auth/signup" element={<CCMSignUpPage />} />

      {/* CCM dashboard (CCM user's own area — protected by ccm token) */}
      <Route element={<ProtectedRoute authType="ccm" />}>
        <Route path="/ccmonboard/*" element={<OnboardLayout />} />
        <Route path="/ccm-dashboard/*" element={<CCMDashboardRoutes />} />
      </Route>

      {adminRoutes(location)}

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <NavigateSetup />
      <ScrollToTop />

      <Suspense fallback={<Fallback />}>
        <AppRoutes />
      </Suspense>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme="light"
        style={{ zIndex: 999999 }}
      />
    </Router>
  );
}
