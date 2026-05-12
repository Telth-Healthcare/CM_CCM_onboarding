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

// ── Utility: extract readable error from any backend shape ──────────────────
const extractError = (data: any, fallback: string): string =>
  data?.message ||
  data?.errors?.[0]?.message ||
  data?.detail ||
  data?.non_field_errors?.[0] ||
  (typeof data === "string" ? data : null) ||
  fallback;

// ── Utility: guard against non-JSON responses (502, maintenance pages, etc.) ─
const safeJson = async (res: Response): Promise<any | null> => {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return null;
  try { return await res.json(); } catch { return null; }
};



// ───────────────────────────────────────────────────────────────────────────

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
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName:  "",
    phone:     "",
    email:     "",
    password:  "",
    terms:     "",
  });

  // ── Field change — clears its own error on edit ───────────────────────────
  const handleChange = (field: string, value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };
// ── Utility: validate email — returns error string or null ──────────────────
const validateEmail = (raw: string): string | null => {
  const email = raw.trim();

  if (!email) return "Email is required";
  if (email.length > 254) return "Email address is too long";
  if (/\s/.test(email)) return "Email cannot contain spaces";

  // Must have exactly one @
  const atCount = (email.match(/@/g) ?? []).length;
  if (atCount !== 1) return "Email must contain exactly one @";

  const [local, domain] = email.split("@");

  // ── Local part ──────────────────────────────────────────────────────────
  if (!local) return "Email is missing a username";
  if (local.length > 64) return "Email username is too long";
  if (local.startsWith(".") || local.endsWith(".")) return "Email username cannot start or end with a dot";
  if (local.includes("..")) return "Email username cannot have consecutive dots";
  // Only allow RFC 5321 safe characters in the local part
  if (!/^[a-zA-Z0-9._%+\-!#$&'*/=?^`{|}~]+$/.test(local)) return "Email username contains invalid characters";

  // ── Domain part ─────────────────────────────────────────────────────────
  if (!domain) return "Email is missing a domain";
  if (domain.length > 253) return "Email domain is too long";
  if (domain.startsWith(".") || domain.endsWith(".")) return "Invalid domain format";
  if (domain.startsWith("-") || domain.endsWith("-")) return "Domain cannot start or end with a hyphen";
  if (domain.includes("..")) return "Domain cannot contain consecutive dots";

  // Domain must have at least one dot (e.g., example.com)
  if (!domain.includes(".")) return "Domain must include an extension (e.g. .com)";

  // Each domain label must be valid
  const labels = domain.split(".");
  for (const label of labels) {
    if (label.length === 0) return "Domain has an empty segment";
    if (label.length > 63) return "Domain segment is too long";
    if (!/^[a-zA-Z0-9-]+$/.test(label)) return "Domain contains invalid characters";
    if (label.startsWith("-") || label.endsWith("-")) return "Domain segment cannot start or end with a hyphen";
  }

  // TLD must be at least 2 alpha characters
  const tld = labels[labels.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return "Invalid domain extension (e.g. .com, .in, .org)";

  // ── Block-listed disposable domains ─────────────────────────────────────
  const blocked = new Set([
    "tempmail.com", "10minutemail.com", "fakeemail.com",
    "mailinator.com", "guerrillamail.com", "throwaway.email",
    "yopmail.com", "trashmail.com", "sharklasers.com",
    "dispostable.com", "maildrop.cc", "spam4.me",
  ]);
  if (blocked.has(domain.toLowerCase())) return "Temporary or disposable email addresses are not allowed";

  return null; // ✅ valid
};
  // ── Client-side validation ────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const e = { firstName: "", lastName: "", phone: "", email: "", password: "", terms: "" };
    let ok = true;

    if (!state.firstName.trim()) {
      e.firstName = "First name is required"; ok = false;
    } else if (state.firstName.trim().length < 2) {
      e.firstName = "Must be at least 2 characters"; ok = false;
    }

    if (!state.lastName.trim()) {
      e.lastName = "Last name is required"; ok = false;
    } else if (state.lastName.trim().length < 2) {
      e.lastName = "Must be at least 2 characters"; ok = false;
    }

    if (!state.phone.trim()) {
      e.phone = "Phone number is required"; ok = false;
    } else if (!/^\d{10}$/.test(state.phone.replace(/\D/g, ""))) {
      e.phone = "Enter a valid 10-digit mobile number"; ok = false;
    }

    const error = validateEmail(state.email);

if (error) {
  e.email = error;
  ok = false;
}

    if (!state.password) {
      e.password = "Password is required"; ok = false;
    } else if (state.password.length < 8) {
      e.password = "Minimum 8 characters required"; ok = false;
    } else if (!/[A-Z]/.test(state.password)) {
      e.password = "Must include at least one uppercase letter"; ok = false;
    } else if (!/\d/.test(state.password)) {
      e.password = "Must include at least one number"; ok = false;
    }

    if (!isChecked) {
      e.terms = "You must agree to Terms & Conditions"; ok = false;
    }

    setErrors(e);
    if (!ok) toast.error("Please fix the highlighted errors before continuing.");
    return ok;
  };

  // ── Submit: validate → open OTP modal ────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) setOtpModalOpen(true);
  };

  // ── Auto sign-in after successful signup ──────────────────────────────────
  const handleSigninAfterSignup = async (idToken: string): Promise<boolean> => {
    const formattedPhone = `+91${state.phone.replace(/\D/g, "")}`;

    let res: Response;
    try {
      res = await fetch(`${baseUrl}accounts/firebase/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, phone_verified: formattedPhone }),
      });
    } catch {
      toast.error("Network error during sign-in. Please check your connection and sign in manually.");
      navigate("/ccm-auth/signin");
      return false;
    }

    const data = await safeJson(res);

    if (!res.ok) {
      toast.error(extractError(data, "Auto sign-in failed. Please sign in manually."));
      navigate("/ccm-auth/signin");
      return false;
    }

    // Validate shape before touching it
    const accessToken = data?.meta?.access_token;
    const user        = data?.data?.user;

    if (!accessToken || !user?.id) {
      toast.error("Unexpected server response. Please sign in manually.");
      navigate("/ccm-auth/signin");
      return false;
    }

    const roles   = Array.isArray(user?.roles) ? user.roles : [];
    const isAdmin = roles.includes("admin");

    try {
      setToken(isAdmin ? "admin" : "ccm", {
        access:  accessToken,
        refresh: data.meta?.refresh_token,
        user:    data.data,
      });
      localStorage.setItem("ccm_user", JSON.stringify(data.data));
      const profileId = user?.profile_id ?? null;
      if (profileId && user?.id) {
        localStorage.setItem(`ccm_draft_pk_${user.id}`, String(profileId));
      }
    } catch (storageErr) {
      // Private-browsing / quota exceeded — non-fatal
      console.warn("Storage write failed:", storageErr);
      toast.warn("Session could not be saved locally. You may need to sign in again later.");
    }

    toast.success("Account created! Let's complete your profile.");

    if (isAdmin) {
      navigate("/dashboard", { replace: true });
    } else {
      const appStatus = user?.application_status?.status;
      if (appStatus === "SUBMITTED") {
        navigate("/ccm-dashboard",            { replace: true });
      } else if (user?.profile_id) {
        navigate("/ccmonboard/contact-info",  { replace: true });
      } else {
        navigate("/ccmonboard/personal-info", { replace: true });
      }
    }
    return true;
  };

  // ── Firebase OTP verified → call signup endpoint ──────────────────────────
  const handleFirebaseSuccess = async (idToken: string) => {
    setLoading(true);
    const formattedPhone = `+91${state.phone.replace(/\D/g, "")}`;

    let res: Response;
    try {
      res = await fetch(`${baseUrl}_allauth/app/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: state.firstName,
          last_name:  state.lastName,
          phone:      formattedPhone,
          email:      state.email,
          password:   state.password,
          token:      idToken,
          roles:      ["cm"],
        }),
      });
    } catch {
      toast.error("Network error. Please check your internet connection and try again.");
      setLoading(false);
      return;
    }

    try {
      // Backend quirk: 401 here means "user created successfully"
      if (res.status === 401) {
        await handleSigninAfterSignup(idToken);
        return;
      }

      const data = await safeJson(res);

      if (!res.ok) {
        // Non-JSON body (gateway error, maintenance page)
        if (!data) {
          toast.error(`Server error (HTTP ${res.status}). Please try again later.`);
          return;
        }

        switch (res.status) {
          case 409:
            toast.error("An account with this phone or email already exists. Please sign in.");
            navigate("/ccm-auth/signin");
            break;

          case 422: {
            // Map backend field errors back to inline form errors
            const fieldErrors: { field: string; message: string }[] = data?.errors ?? [];
            if (fieldErrors.length > 0) {
              const mapped = { ...errors };
              fieldErrors.forEach(({ field, message }) => {
                if (field in mapped) (mapped as any)[field] = message;
              });
              setErrors(mapped);
              toast.error("Please correct the highlighted fields.");
            } else {
              toast.error(extractError(data, "Validation failed. Please check your details."));
            }
            break;
          }

          case 429:
            toast.error("Too many requests. Please wait a moment and try again.");
            break;

          default:
            if (res.status >= 500) {
              toast.error("Server is currently unavailable. Please try again later.");
            } else {
              toast.error(extractError(data, "Signup failed. Please try again."));
            }
        }
        return;
      }

      // 2xx → signup succeeded, sign in silently
      await handleSigninAfterSignup(idToken);

    } catch (err) {
      const error = err as Error;
      console.error("Signup error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formattedPhone = `+91${state.phone.replace(/\D/g, "")}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 mt-5 w-full max-w-md mx-auto">

        <div className="mb-5">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your details to get started</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name <span className="text-error-500">*</span></Label>
                <InputField
                  type="text" placeholder="First name" value={state.firstName}
                  onChange={e => handleChange("firstName", e.target.value)}
                  className={errors.firstName ? "border-error-500" : ""}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <Label>Last Name <span className="text-error-500">*</span></Label>
                <InputField
                  type="text" placeholder="Last name" value={state.lastName}
                  onChange={e => handleChange("lastName", e.target.value)}
                  className={errors.lastName ? "border-error-500" : ""}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label>Phone Number <span className="text-error-500">*</span></Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium select-none">
                  +91
                </span>
                <input
                  type="tel" inputMode="numeric"
                  placeholder="Enter 10-digit mobile number"
                  value={state.phone}
                  onChange={e => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  className={`flex-1 px-4 py-2.5 text-sm border rounded-r-lg outline-none transition-colors bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${errors.phone ? "border-error-500" : "border-gray-300 dark:border-gray-600"}`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <Label>Email</Label>
              <InputField
                type="email" placeholder="you@example.com" value={state.email}
                onChange={e => handleChange("email", e.target.value)}
                className={errors.email ? "border-error-500" : ""}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <Label>Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <InputField
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={state.password}
                  onChange={e => handleChange("password", e.target.value)}
                  className={errors.password ? "border-error-500" : ""}
                />
                <span
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeIcon className="fill-gray-500 size-5" />
                    : <EyeCloseIcon className="fill-gray-500 size-5" />}
                </span>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-start gap-3">
                <Checkbox className="w-5 h-5 mt-0.5" checked={isChecked} onChange={setIsChecked} />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  I agree to the{" "}
                  <span className="text-gray-800 dark:text-white/90"><a href="https://www.mytelth.com/terms-and-conditions">Terms & Conditions</a></span>
                  {" "}and{" "}
                  <span className="text-gray-800 dark:text-white"><a href="https://www.mytelth.com/privacy-policies">Privacy Policy</a></span>
                </p>
              </div>
              {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account...
                </span>
              ) : "Sign Up & Verify Phone"}
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
        onFirebaseSuccess={handleFirebaseSuccess}
      />
    </div>
  );
}