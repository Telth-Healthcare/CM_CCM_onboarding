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
    lastName:  "",
    email:     "",
    phone:     "",
    password:  "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked,    setIsChecked]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({ phone: "", password: "", terms: "" });
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const handleChange = (field: string, value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors = { phone: "", password: "", terms: "" };
    let valid = true;
    if (!state.phone.trim()) {
      newErrors.phone = "Phone number is required"; valid = false;
    } else if (!/^\+?[1-9][\d]{8,14}$/.test(state.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Enter a valid phone number with country code (+91...)"; valid = false;
    }
    if (!state.password) {
      newErrors.password = "Password is required"; valid = false;
    } else if (state.password.length < 6) {
      newErrors.password = "Minimum 6 characters"; valid = false;
    }
    if (!isChecked) { newErrors.terms = "You must agree to terms and conditions"; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Ensure E.164 format before passing to Firebase
    if (!state.phone.startsWith("+")) {
      setState(prev => ({ ...prev, phone: `+${prev.phone}` }));
    }
    setOtpModalOpen(true);
  };

  // ── Called by OtpModal after Firebase verifies OTP ───────────────────────
  // idToken = proof from Firebase that OTP was correct
  const handleFirebaseSuccess = async (idToken: string) => {
    setLoading(true);
    try {
      const formattedPhone = state.phone.startsWith("+") ? state.phone : `+${state.phone}`;

      // POST all signup data + Firebase token to backend

      
      const response = await fetch(`${baseUrl}_allauth/app/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: state.firstName,
          last_name:  state.lastName,
          phone:      formattedPhone,        // +91XXXXXXXXXX
          email:      state.email,
          password:   state.password,
          token:      idToken,               // ✅ Firebase JWT
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Signup failed");
      }

      const data = await response.json();

      // Save tokens
      setToken({
        access:    data.meta?.access_token ?? data.access_token,
        refresh:   data.meta?.refresh_token ?? data.refresh_token,
        user:      data.user,
        sessionId: data.meta?.session_token ?? data.session_token,
      });

      toast.success("Account created! Starting onboarding...");
      setTimeout(() => navigate("/ccmonboard"), 500);

    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formattedPhone = state.phone.startsWith("+") ? state.phone : `+${state.phone}`;

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
                <InputField type="text" placeholder="First name" value={state.firstName}
                  onChange={e => handleChange("firstName", e.target.value)} />
              </div>
              <div>
                <Label>Last Name</Label>
                <InputField type="text" placeholder="Last name" value={state.lastName}
                  onChange={e => handleChange("lastName", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Phone Number <span className="text-error-500">*</span></Label>
              <InputField type="tel" placeholder="+91 9876543210" inputMode="tel" value={state.phone}
                onChange={e => handleChange("phone", e.target.value.replace(/[^0-9+]/g, ""))} />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <Label>Email</Label>
              <InputField type="email" placeholder="you@example.com" value={state.email}
                onChange={e => handleChange("email", e.target.value)} />
            </div>

            <div>
              <Label>Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <InputField type={showPassword ? "text" : "password"} placeholder="Min 6 characters"
                  value={state.password} onChange={e => handleChange("password", e.target.value)} />
                <span onClick={() => setShowPassword(!showPassword)}
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
                <Checkbox className="w-5 h-5 mt-0.5" checked={isChecked} onChange={setIsChecked} />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  I agree to the{" "}
                  <span className="text-gray-800 dark:text-white/90">Terms & Conditions</span>
                  {" "}and{" "}
                  <span className="text-gray-800 dark:text-white">Privacy Policy</span>
                </p>
              </div>
              {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition">
              {loading ? "Creating account..." : "Sign Up & Verify Phone"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/ccm-auth/signin" className="text-brand-500 hover:text-brand-600">Sign In</Link>
        </p>
      </div>

      <OtpModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        phone={formattedPhone}
        mode="signup"
        onFirebaseSuccess={handleFirebaseSuccess}   // ✅ receives idToken after OTP verified
      />
    </div>
  );
}