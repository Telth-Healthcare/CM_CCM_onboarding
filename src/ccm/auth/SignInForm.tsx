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
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    setPhone(formattedPhone);
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

      const user    = data.user;
      const roles   = Array.isArray(user?.user?.roles) ? user.user.roles : [];

      // role: ["admin"] → admin login, else → ccm login
      const isAdmin = roles.includes("admin");
      const type    = isAdmin ? "admin" : "ccm";

      setToken(type, {
        access:    data.meta?.access_token  ?? data.access_token,
        refresh:   data.meta?.refresh_token ?? data.refresh_token,
        user,
        sessionId: data.meta?.session_token ?? data.session_token,
      });

      // profile_id is the CCM application id (id:3) returned by login response
      // Store it immediately so Onboard.tsx can fetch the application on page load
      const profileId = user?.profile_id ?? null;
      if (profileId) {
        const ccmInnerUser = user?.user ?? user;
        const draftKey = `ccm_draft_pk_${ccmInnerUser?.id}`;
        localStorage.setItem(draftKey, String(profileId));
      }

      toast.success("Signed in successfully!");

      if (isAdmin) {
        navigate("/dashboard", { replace: true });
      } else {
        const appStatus = user?.application_status?.status;
        if (appStatus === "SUBMITTED") {
          navigate("/ccm-dashboard", { replace: true });
        } else if (profileId) {
          // profile_id exists → step 1 already done → go straight to step 2
          navigate("/ccmonboard/contact-info", { replace: true });
        } else {
          // no application yet → show step 1
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

  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

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
              <InputField type="tel" inputMode="numeric" placeholder="+91 9876543210" value={phone}
                onChange={e => { setPhone(e.target.value.replace(/[^0-9+]/g, "")); setPhoneError(""); }}
                disabled={loading} />
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