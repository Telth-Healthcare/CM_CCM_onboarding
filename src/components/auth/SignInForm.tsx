import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { signinApi } from "../../api";
import { setToken } from "../../config/constants";
import { toast } from "react-toastify";
import { handleAxiosError } from "../../utils/handleAxiosError";

// Simple Spinner Component
const Spinner = () => (
  <svg 
    className="animate-spin h-5 w-5 text-white" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

interface FormState {
  phone: string;
  password: string;
}

interface FormErrors {
  phone?: string;
  password?: string;
  general?: string;
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [state, setState] = useState<FormState>({
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!state.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(state.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!state.password) {
      newErrors.password = "Password is required";
    } else if (state.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setState({ ...state, phone: value });
    // Clear phone error when user types
    if (errors.phone) {
      setErrors({ ...errors, phone: undefined });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, password: e.target.value });
    // Clear password error when user types
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      const payload = {
        ...state,
        phone: `+91${state.phone}`,
      };

      const response = await signinApi(payload);
      const accessToken = response?.meta?.access_token;
      const refreshToken = response?.meta?.refresh_token;
      const user = response?.data?.user;

      if (accessToken && refreshToken && user) {
        setToken("admin", {
          access: accessToken,
          refresh: refreshToken,
          user: user,
        });
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      const field = error?.response?.data?.errors?.[0]?.param;

      if (field) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Invalid value",
        }));
      }

      const errorMessage = handleAxiosError(
        error,
        "Something went wrong. Please try again.",
      );

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your Phone and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSignIn}>
              <div className="space-y-6">
                {errors.general && (
                  <div className="text-sm text-red-500">{errors.general}</div>
                )}

                {/* Phone Number */}
                <div>
                  <Label>
                    Phone Number <span className="text-error-500">*</span>
                  </Label>
                  <div className={`flex items-center border rounded-lg overflow-hidden ${
                      errors.phone
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}>
                    <span className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium border-r border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="987654xxxx"
                      value={state.phone}
                      disabled={loading}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      className="flex-1 px-3 py-2 text-sm outline-none bg-white dark:bg-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={state.password}
                      disabled={loading}
                      error={!!errors.password}
                      onChange={handlePasswordChange}
                    />
                    <span
                      onClick={() => !loading && setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Sign In Button with Loading Animation */}
                <Button 
                  className="w-full" 
                  size="sm" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}