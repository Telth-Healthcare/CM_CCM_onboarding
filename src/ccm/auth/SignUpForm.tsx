// src/ccm/auth/SignUpForm.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { OtpModal } from "../../components/modals/OtpModal";
import Label from "../../shared/components/form/Label";
import InputField from "../../shared/components/form/input/InputField";
import Checkbox from "../../shared/components/form/input/Checkbox";
import { EyeCloseIcon, EyeIcon } from "../../shared/icons";
import { setToken } from "../../config/constants";
import { baseUrl } from "../../config/env";

export default function CCMSignUpForm() {
  const navigate = useNavigate();

  const [state, setState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    ccm: "ccm",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phone: "", password: "", terms: "" });
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleChange = (field: string, value: string) => {
    if (loading || otpModalOpen) return; // Block changes during operations
    setState(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors = { phone: "", password: "", terms: "" };
    let valid = true;
    if (!state.phone.trim()) {
      newErrors.phone = "Phone number is required"; valid = false;
    } else if (!/^\d{10}$/.test(state.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Enter a valid 10-digit mobile number"; valid = false;
    }
    if (!state.password) {
      newErrors.password = "Password is required"; valid = false;
    } else if (state.password.length < 8) {
      newErrors.password = "Minimum 8 characters"; valid = false;
    }
    if (!isChecked) { newErrors.terms = "You must agree to terms and conditions"; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  // STEP 1: Validate → call backend signup → on success open OTP modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formattedPhone = `+91${state.phone.replace(/\D/g, '')}`;  // E.164 format

      const response = await fetch(`${baseUrl}_allauth/app/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: state.firstName,
          last_name: state.lastName,
          phone: formattedPhone,
          email: state.email,
          password: state.password,
          roles: ["ccm"],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          setOtpModalOpen(true);
          return;
        }

        const backendError =
          errorData?.message ||
          errorData?.errors?.[0]?.message ||
          errorData?.detail ||
          "Signup failed. Please try again.";
        toast.error(backendError);
        return;
      }

      setOtpModalOpen(true);

    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Firebase OTP verified inside modal → now call login with fresh idToken
  const handleFirebaseSuccess = async (idToken: string) => {
    setLoading(true);
    try {
      const formattedPhone = `+91${state.phone.replace(/\D/g, '')}`;

      const response = await fetch(`${baseUrl}accounts/firebase/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: idToken,
          phone_verified: formattedPhone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const backendError =
          errorData?.message ||
          errorData?.errors?.[0]?.message ||
          errorData?.detail ||
          "Auto sign-in failed. Please sign in manually.";
        toast.error(backendError);
        navigate("/ccm-auth/signin");
        return;
      }

      const data = await response.json();

      const user = data?.data?.user;
      const roles = user?.roles ?? [];
      const isAdmin = roles.includes("admin");
      const type = isAdmin ? "admin" : "ccm";

      setToken(type, {
        access: data.meta?.access_token,
        refresh: data.meta?.refresh_token,
        user: data.data,
      });

      localStorage.setItem("ccm_user", JSON.stringify(data.data));

      const profileId = user?.profile_id ?? null;
      if (profileId && user?.id) {
        localStorage.setItem(`ccm_draft_pk_${user.id}`, String(profileId));
      }

      toast.success("Account created! Let's complete your profile.");

      if (isAdmin) {
        navigate("/dashboard", { replace: true });
      } else {
        const appStatus = user?.application_status?.status;
        if (appStatus === "SUBMITTED") {
          navigate("/ccm-dashboard", { replace: true });
        } else if (profileId) {
          navigate("/ccmonboard/contact-info", { replace: true });
        } else {
          navigate("/ccmonboard/personal-info", { replace: true });
        }
      }

    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation with blocking during operations
  const handleSignInClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (loading || otpModalOpen) {
      e.preventDefault();
      toast.warning("Please complete the current process before signing in");
      return;
    }

    if (isNavigating) {
      e.preventDefault();
      return;
    }

    setIsNavigating(true);
    // Allow navigation after a small delay
    setTimeout(() => setIsNavigating(false), 500);
  };

  const formattedPhone = `+91${state.phone.replace(/\D/g, '')}`;

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 mt-5 w-full max-w-md mx-auto">
        <div className="mb-5">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your details to get started</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <InputField
                  type="text"
                  placeholder="First name"
                  value={state.firstName}
                  disabled={loading || otpModalOpen}
                  onChange={e => handleChange("firstName", e.target.value)}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <InputField
                  type="text"
                  placeholder="Last name"
                  value={state.lastName}
                  disabled={loading || otpModalOpen}
                  onChange={e => handleChange("lastName", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Phone Number <span className="text-error-500">*</span></Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium select-none">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile number"
                  value={state.phone}
                  disabled={loading || otpModalOpen}
                  onChange={e => handleChange("phone", e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className={`flex-1 px-4 py-2.5 text-sm border rounded-r-lg outline-none transition-colors bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${errors.phone ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <Label>Email</Label>
              <InputField
                type="email"
                placeholder="you@example.com"
                value={state.email}
                disabled={loading || otpModalOpen}
                onChange={e => handleChange("email", e.target.value)}
              />
            </div>

            <div>
              <Label>Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <InputField
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={state.password}
                  disabled={loading || otpModalOpen}
                  onChange={e => handleChange("password", e.target.value)}
                />
                <span onClick={() => !loading && !otpModalOpen && setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                  {showPassword
                    ? <EyeIcon className="fill-gray-500 size-5" />
                    : <EyeCloseIcon className="fill-gray-500 size-5" />}
                </span>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <div className="flex items-start gap-3">
                <Checkbox
                  className="w-5 h-5 mt-0.5"
                  checked={isChecked}
                  disabled={loading || otpModalOpen}
                  onChange={setIsChecked}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  I agree to the{" "}
                  <a
                    href="https://www.mytelth.com/terms-and-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 dark:text-white/90 underline hover:text-brand-500"
                  >
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://www.mytelth.com/privacy-policies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 dark:text-white underline hover:text-brand-500"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || otpModalOpen}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition"
            >
              {loading ? "Creating account..." : otpModalOpen ? "Verifying phone..." : "Sign Up & Verify Phone"}
            </button>

          </div>
        </form>

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/ccm-auth/signin"
            onClick={handleSignInClick}
            className={`text-brand-500 hover:text-brand-600 ${(loading || otpModalOpen) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Sign In
          </Link>
        </p>
      </div>

      <OtpModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        phone={formattedPhone}
        mode="signup"
        onFirebaseSuccess={handleFirebaseSuccess}
      />
    </div>
  );
}