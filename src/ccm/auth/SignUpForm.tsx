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
    ccm:       "cm",
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
    } else if (state.password.length < 8) {
      newErrors.password = "Minimum 8 characters"; valid = false;
    }
    if (!isChecked) { newErrors.terms = "You must agree to terms and conditions"; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  // Single button → validate → open modal → modal auto-sends OTP
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setOtpModalOpen(true);
  };

  // Called internally after signup succeeds — mirrors SignInForm.handleFirebaseSuccess exactly.
  // Uses the same idToken from OTP modal (still fresh), hits the same signin endpoint.
  // User never sees the login page.
  const handleSigninAfterSignup = async (idToken: string) => {
    const formattedPhone = `+91${state.phone.replace(/\D/g, '')}`;

    const response = await fetch(`${baseUrl}accounts/firebase/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token:          idToken,          // same Firebase token from OTP modal
        phone_verified: formattedPhone,   // E.164 — same as SignInForm sends
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
      navigate("/ccm-auth/signin");       // fallback — let user sign in manually
      return;
    }

    const data = await response.json();  // shape: { meta: { access_token, refresh_token }, data: { user } }

    const user    = data?.data?.user;
    const roles   = user?.roles ?? [];
    const isAdmin = roles.includes("admin");
    const type    = isAdmin ? "admin" : "ccm";

    setToken(type, {
      access:  data.meta?.access_token,
      refresh: data.meta?.refresh_token,
      user:    data.data,                // { user: {...} } — same shape SignInForm stores
    });

    localStorage.setItem("ccm_user", JSON.stringify(data.data)); // Onboard.tsx reads this

    const profileId = user?.profile_id ?? null;
    if (profileId && user?.id) {
      localStorage.setItem(`ccm_draft_pk_${user.id}`, String(profileId)); // resume draft if exists
    }

    toast.success("Account created! Let's complete your profile.");

    // Same navigation logic as SignInForm.handleLoginSuccess for ccm users
    if (isAdmin) {
      navigate("/dashboard", { replace: true });
    } else {
      const appStatus = user?.application_status?.status;
      if (appStatus === "SUBMITTED") {
        navigate("/ccm-dashboard",           { replace: true });
      } else if (profileId) {
        navigate("/ccmonboard/contact-info", { replace: true });
      } else {
        navigate("/ccmonboard/personal-info",{ replace: true });
      }
    }
  };

  // Reaches here ONLY after Firebase OTP verified inside modal
  // Firebase errors are fully handled inside OtpModal — never reach here
  const handleFirebaseSuccess = async (idToken: string) => {
    setLoading(true);
    try {
      const formattedPhone = `+91${state.phone.replace(/\D/g, '')}`; // always +91XXXXXXXXXX

      const response = await fetch(`${baseUrl}_allauth/app/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: state.firstName,
          last_name:  state.lastName,
          phone:      formattedPhone,
          email:      state.email,
          password:   state.password,
          token:      idToken,  // Firebase JWT — proof phone is verified
          roles:      ["ccm"],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 401 = user just created — this is the success signal from backend
        // Skip the login page entirely; signin internally with the same idToken
        if (response.status === 401) {
          await handleSigninAfterSignup(idToken);
          return;
        }

        // All other backend errors → show raw backend message exactly
        const backendError =
          errorData?.message ||
          errorData?.errors?.[0]?.message ||
          errorData?.detail ||   // DRF default error key
          "Signup failed. Please try again.";

        toast.error(backendError);
        return;
      }

      // Signup OK — now silently call the signin OTP endpoint with the same idToken.
      // idToken is still fresh (Firebase tokens live ~1hr), so no re-verify needed.
      // This is exactly what SignInForm.handleFirebaseSuccess does internally.
      await handleSigninAfterSignup(idToken);

    } catch (err) {
      // Network / unexpected JS crash — not Firebase, not backend
      const error = err as Error;
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
              {/* +91 locked — strips non-digits, caps at 10 */}
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

            {/* One button — validates then opens OTP modal which auto-sends OTP */}
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
        onFirebaseSuccess={handleFirebaseSuccess} // called only after Firebase OTP verified
      />
    </div>
  );
}