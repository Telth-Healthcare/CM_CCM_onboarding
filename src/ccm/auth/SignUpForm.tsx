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
    ccm:"ccm"
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
    } else if (!/^\d{10}$/.test(state.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Enter a valid 10-digit mobile number"; valid = false;
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
    setOtpModalOpen(true); // formattedPhone always +91XXXXXXXXXX
  };

  // ── Called by OtpModal after Firebase verifies OTP ───────────────────────
  // idToken = proof from Firebase that OTP was correct
  const handleFirebaseSuccess = async (idToken: string) => {
    setLoading(true);
    try {
      const formattedPhone = `+91${state.phone.replace(/\D/g, '')}`  // always +91XXXXXXXXXX

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
          roles:["ccm"]
        }),
      });

    if (!response.ok) {
  const errorData = await response.json();

  if (response.status === 401) {
    const backendMessage =
      errorData?.message ||
      errorData?.errors?.[0]?.message ||
      " Please sign in.";

    toast.success(backendMessage);

    setOtpModalOpen(false);

    setTimeout(() => {
      navigate("/ccm-auth/signin");
    }, 800);

    return;
  }

  throw new Error(
    errorData?.message ||
    errorData?.errors?.[0]?.message ||
    "Signup failed"
  );
}


      const data = await response.json();

      // ── Signup response already has tokens — treat as auto-login, no re-auth needed ──
      setToken("ccm", {
        access:  data.meta?.access_token  ?? data.access_token,
        refresh: data.meta?.refresh_token ?? data.refresh_token,
        user:    data.user ?? data,        // full user object for Onboard.tsx
      });

      // Store ccm_user same as SignInForm so getDraftKey() in Onboard.tsx resolves correctly
      localStorage.setItem("ccm_user", JSON.stringify(data.user ?? data));

      // If backend returns profile_id (rare on fresh signup), persist draft key
      const profileId = data.profile_id ?? null;
      if (profileId) {
        const userId = (data.user ?? data)?.id;
        if (userId) localStorage.setItem(`ccm_draft_pk_${userId}`, String(profileId));
      }

      // Navigate directly — user is authenticated, no sign-in step needed
      toast.success("Account created! Let's complete your profile.");
      navigate("/ccmonboard/personal-info", { replace: true });

    } catch (err) {
      console.log(err)
      // const error = err as Error;
      // toast.error( error || "Signup failed. Please try again."   );
    } finally {
      setLoading(false);
    }
  };

  // Always +91 prefix — user only types 10 digits
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
              {/* +91 prefix locked — user types 10 digits only */}
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium select-none">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile number"
                  value={state.phone}
                  onChange={e => handleChange("phone", e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className={`flex-1 px-4 py-2.5 text-sm border rounded-r-lg outline-none transition-colors bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${errors.phone ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
              </div>
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