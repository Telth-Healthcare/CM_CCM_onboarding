import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";


// Admin Auth
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const AcceptInvitationPage = lazy(
  () => import("./pages/AuthPages/AcceptInvitationPage")
);

// CCM Auth
const CCMSignInPage = lazy(() => import("./ccm/auth/SignInPage"));
const CCMSignUpPage = lazy(() => import("./ccm/auth/SignUpPage"));

// Layouts
const AppLayout = lazy(() => import("./layout/AppLayout"));
const OnboardLayout = lazy(() => import("./ccm/pages/OnboardLayout"));

// Admin Pages
const Home = lazy(() => import("./pages/Dashboard/Home"));
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Blank = lazy(() => import("./pages/Blank"));
const AdminUser = lazy(() => import("./components/User/AdminUser"));
const Applications = lazy(() => import("./components/User/Applications"));
const Region = lazy(() => import("./components/User/Region"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));


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

          <Route path="/" element={<SignIn />} />
          <Route path="/invite/accept/" element={<AcceptInvitationPage />} />

          <Route path="/ccm-auth/signin" element={<CCMSignInPage />} />
          <Route path="/ccm-auth/signup" element={<CCMSignUpPage />} />

          <Route element={<ProtectedRoute authType="ccm" />}>
            <Route path="/ccmonboard/*" element={<OnboardLayout />} />
          </Route>

          <Route element={<ProtectedRoute authType="admin" />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/regions" element={<Region />} />
              <Route path="/applications" element={<Applications />} />

              <Route
                path="/users"
                element={
                  <ProtectedRoute
                    authType="admin"
                    allowedRoles={["super_admin", "admin"]}
                  />
                }
              >
                <Route index element={<AdminUser />} />
              </Route>
            </Route>
          </Route>

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