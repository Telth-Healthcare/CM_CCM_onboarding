// src/ccm/auth/SignInForm.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { OtpModal } from "../../components/modals/OtpModal";
import Label from "../../shared/components/form/Label";
import InputField from "../../shared/components/form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "../../shared/icons";
import { setToken } from "../../config/constants";
import { baseUrl } from "../../config/env";

type Tab = "otp" | "password";

export default function CCMSignInForm() {
  const navigate = useNavigate();

  const [activeTab,     setActiveTab]     = useState<Tab>("otp");
  const [phone,         setPhone]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [phoneError,    setPhoneError]    = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpModalOpen,  setOtpModalOpen]  = useState(false);

  // Clear errors when switching tabs
  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    setPhoneError("");
    setPasswordError("");
  };

  const validatePhone = (): boolean => {
    if (!phone.trim()) { setPhoneError("Phone number is required"); return false; }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) { setPhoneError("Enter valid 10-digit mobile number"); return false; }
    setPhoneError("");
    return true;
  };

  // ── OTP tab: validate → open modal → modal auto-sends OTP ──
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    setOtpModalOpen(true);
  };

  // ── Password tab: validate → POST phone + password directly to backend ──
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    if (!password) { setPasswordError("Password is required"); return; }
    setPasswordError("");
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}_allauth/app/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone:    `+91${phone.replace(/\D/g, '')}`, // always +91XXXXXXXXXX
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 401 = already registered → soft info toast + redirect
        if (response.status === 401) {
          const msg =
            errorData?.message ||
            errorData?.errors?.[0]?.message ||
            "Sign in with otp for first time";
          toast.info(msg);
          setTimeout(() => navigate("/ccm-auth/signin"), 800);
          return;
        }
        // Raw backend message exactly — nothing wrapped
        const backendError =
          errorData?.message ||
          errorData?.errors?.[0]?.message ||
          errorData?.detail ||   // DRF default key
          "Login failed. Please try again.";
        toast.error(backendError);
        return;
      }
     
      
      const data = await response.json();
      handleLoginSuccess(data);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP tab: called only after Firebase OTP verified inside modal ──
  // Firebase errors handled inside modal — never reach here
  const handleFirebaseSuccess = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}accounts/firebase/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token:          idToken,
          phone_verified: `+91${phone.replace(/\D/g, '')}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Raw backend message exactly
        const backendError =
          errorData?.message ||
          errorData?.errors?.[0]?.message ||
          errorData?.detail ||
          "Login failed. Please try again.";
        toast.error(backendError);
        return;
      }

      const data = await response.json();
      handleLoginSuccess(data);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

const handleLoginSuccess = (data: any) => {
  const user    = data?.data?.user          // ← extract user once
  const roles   = user?.roles ?? []
  const isAdmin = roles.includes("admin")
  const type    = isAdmin ? "admin" : "ccm"

  setToken(type, {
    access:  data.meta?.access_token,
    refresh: data.meta?.refresh_token,
    user:    data.data,                     // ← store { user: {...} } shape
  });

  const profileId = user?.profile_id ?? null

  if (profileId) {
    localStorage.setItem(`ccm_draft_pk_${user.id}`, String(profileId))  // ← user.id not data.id
  }

  localStorage.setItem("ccm_user", JSON.stringify(data.data))  // ← store { user:{...} } only — matches Onboard.tsx expectation

  toast.success("Signed in successfully!")

  if (isAdmin) {
    navigate("/dashboard", { replace: true })
  } else {
    const appStatus = user?.application_status?.status    // ← was data.application_status
    if (appStatus === "SUBMITTED") {
      navigate("/ccm-dashboard",              { replace: true })
    } else if (profileId) {
      navigate("/ccmonboard/contact-info",    { replace: true })
    } else {
      navigate("/ccmonboard/personal-info",   { replace: true })
    }
  }
}

  const formattedPhone = `+91${phone.replace(/\D/g, '')}`; // E.164 for OtpModal

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">

        <div className="mb-6">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Sign In
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === "otp"
              ? "Enter your phone number and OTP to sign in!"
              : "Enter your phone number and password to sign in!"}
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            type="button"
            onClick={() => handleTabSwitch("otp")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "otp"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            Phone + OTP
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("password")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "password"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            Phone + Password
          </button>
        </div>

        {/* ── Phone field shared across both tabs ── */}
        <div className="mb-5">
          <Label>Phone Number <span className="text-error-500">*</span></Label>
          {/* +91 locked — strips non-digits, caps at 10 */}
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium select-none">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter 10-digit mobile number"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError(""); }}
              disabled={loading}
              maxLength={10}
              className={`flex-1 px-4 py-2.5 text-sm border rounded-r-lg outline-none transition-colors bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${phoneError ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
          </div>
          {phoneError && <p className="mt-1 text-xs text-error-500">{phoneError}</p>}
        </div>

        {/* ── OTP tab ── */}
        {activeTab === "otp" && (
          <form onSubmit={handleOtpSubmit}>
            <button type="submit" disabled={loading}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition">
              {loading ? "Signing in..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── Password tab ── */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <Label>Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <InputField
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                />
                <span onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                  {showPassword
                    ? <EyeIcon className="fill-gray-500 size-5" />
                    : <EyeCloseIcon className="fill-gray-500 size-5" />}
                </span>
              </div>
              {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/ccm-auth/signup" className="text-brand-500 hover:text-brand-600">Sign Up</Link>
        </p>
      </div>

      {/* OtpModal only used for OTP tab — password tab never touches Firebase */}
      <OtpModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        phone={formattedPhone}
        mode="signin"
        onFirebaseSuccess={handleFirebaseSuccess}
      />
    </div>
  );
}