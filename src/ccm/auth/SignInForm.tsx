// src/ccm/auth/SignInForm.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { OtpModal } from "../../components/modals/OtpModal";
import Label from "../../shared/components/form/Label";
import InputField from "../../shared/components/form/input/InputField";
import { setToken } from "../../config/constants";
import { baseUrl } from "../../config/env";

export default function CCMSignInForm() {
  const navigate = useNavigate();

  const [phone,        setPhone]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [phoneError,   setPhoneError]   = useState("");
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setPhoneError("Phone number is required"); return; }
    const digits = phone.replace(/\D/g, '')
    if (!/^\d{10}$/.test(digits)) { setPhoneError("Enter valid 10-digit mobile number"); return; }
    setPhoneError("");
    setOtpModalOpen(true);
  };

  const handleFirebaseSuccess = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}accounts/firebase/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token:          idToken,
          phone_verified: phone,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Login failed");
      }

      const data = await response.json();

      // FIX: response is now flat — user fields live directly on `data` (no data.user nesting)
      const user  = data;
      const roles = Array.isArray(data.roles) ? data.roles : []; // was: data.user.user.roles

      // role: ["admin"] → admin login, else → ccm login
      const isAdmin = roles.includes("admin");
      const type    = isAdmin ? "admin" : "ccm";

      setToken(type, {
        access:  data.meta?.access_token  ?? data.access_token,  // supports both old & new shape
        refresh: data.meta?.refresh_token ?? data.refresh_token,
        user,
      });

      // profile_id: CCM application id — store so Onboard.tsx can resume from step 2
      const profileId = data.profile_id ?? null; // was: user?.profile_id (nested)
      if (profileId) {
        const draftKey = `ccm_draft_pk_${data.id}`; // data.id directly, no inner user object
        localStorage.setItem(draftKey, String(profileId));
      }

      toast.success("Signed in successfully!");

      if (isAdmin) {
        navigate("/dashboard", { replace: true });
      } else {
        const appStatus = data.application_status?.status; // was: user?.application_status
        if (appStatus === "SUBMITTED") {
          navigate("/ccm-dashboard", { replace: true });
        } else if (profileId) {
          // profile_id exists → step 1 done → skip to step 2
          navigate("/ccmonboard/contact-info", { replace: true });
        } else {
          // no application yet → start from step 1
          navigate("/ccmonboard/personal-info", { replace: true });
        }
      }

    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Always build E.164 format: +91 + 10 digits
  const formattedPhone = `+91${phone}`;

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Sign In
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your phone number — we'll send you an OTP
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label>Phone Number <span className="text-error-500">*</span></Label>
              {/* +91 prefix always prepended — user types 10 digits only */}
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

            <button type="submit" disabled={loading}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition">
              {loading ? "Signing in..." : "Send OTP"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/ccm-auth/signup" className="text-brand-500 hover:text-brand-600">Sign Up</Link>
        </p>
      </div>

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