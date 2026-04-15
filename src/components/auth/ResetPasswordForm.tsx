// components/auth/ResetPasswordForm.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPasswordApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import {
  EyeClosedIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
} from "lucide-react";

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  message: string;
  color: string;
}

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.get("key");

  const navigate = useNavigate();

  const [form, setForm] = useState<ResetPasswordForm>({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isValidKey, setIsValidKey] = useState<boolean | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    message: "",
    color: "bg-gray-200",
  });

  useEffect(() => {
    if (!searchKey) {
      setIsValidKey(false);
      toast.error("Invalid or expired reset link");
      return;
    }
    const isValidFormat = /^[A-Z0-9]+-[a-z0-9]+-[a-z0-9]+$/i.test(searchKey);

    if (!isValidFormat) {
      setIsValidKey(false);
      toast.error("Invalid reset link format");
      return;
    }

    setIsValidKey(true);
  }, [searchKey]);

  // Calculate password strength
  useEffect(() => {
    if (!form.password) {
      setPasswordStrength({ score: 0, message: "", color: "bg-gray-200" });
      return;
    }

    let score = 0;
    let message = "";

    if (form.password.length >= 8) score++;
    if (form.password.length >= 12) score++;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[a-z]/.test(form.password)) score++;
    if (/[0-9]/.test(form.password)) score++;
    if (/[^A-Za-z0-9]/.test(form.password)) score++;

    // Normalize score to 0-4 range
    score = Math.min(Math.floor(score / 1.5), 4);

    if (score === 0) message = "Very Weak";
    else if (score === 1) message = "Weak";
    else if (score === 2) message = "Fair";
    else if (score === 3) message = "Good";
    else message = "Strong";

    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];

    setPasswordStrength({
      score,
      message,
      color: colors[score],
    });
  }, [form.password]);

  const handleChange = (field: keyof ResetPasswordForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
    if (errors.general) {
      setErrors((prev) => ({
        ...prev,
        general: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and numbers";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!searchKey) {
      toast.error("Invalid reset link");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        password: form.password,
        key: searchKey,
      };

      await resetPasswordApi(payload);

      toast.success("Password reset successfully!", {
        icon: <CheckCircleIcon className="text-green-500" />,
        position: "top-right",
        autoClose: 3000,
      });

      setForm({
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/admin/signin");
      }, 2000);
    } catch (error: any) {
      const response = error?.response?.data?.data?.flows;
      const loginFlow = response?.find((flow: any) => flow.id === "login");
      if (loginFlow) {
        toast.success("Your password has been reset successfully!", {
          icon: <CheckCircleIcon className="text-green-500" />,
        });
        setForm({
          password: "",
          confirmPassword: "",
        });
        navigate("/admin/signin");
      } else {
        const message = handleAxiosError(error, "reset password failed");
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isValidKey === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent"></div>
            <KeyIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 w-6 h-6" />
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
            Validating your reset link...
          </p>
        </div>
      </div>
    );
  }

  // Invalid key state
  if (!isValidKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse"></div>
              <XCircleIcon className="relative w-20 h-20 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-gray-800 dark:text-white">
              Invalid Reset Link
            </h2>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
              This password reset link is invalid or has expired. Please request
              a new reset link to continue.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform transition-all duration-200"
                size="sm"
                onClick={() => navigate("/forgot-password")}
              >
                Request New Reset Link
              </Button>
              <Button
                className="w-full"
                size="sm"
                variant="outline"
                onClick={() => navigate("/admin/signin")}
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2 inline" />
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Decorative header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a strong new password for your account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Enter your new password"
                  value={form.password}
                  disabled={loading}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="pr-12 transition-all duration-200 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => !loading && setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <EyeClosedIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <div className="flex gap-1 h-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          i < passwordStrength.score
                            ? passwordStrength.color
                            : "bg-gray-200 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Password strength:
                    </span>
                    <span
                      className={`font-medium ${
                        passwordStrength.score === 4
                          ? "text-green-600"
                          : passwordStrength.score === 3
                            ? "text-blue-600"
                            : passwordStrength.score === 2
                              ? "text-yellow-600"
                              : "text-red-600"
                      }`}
                    >
                      {passwordStrength.message}
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-left-2">
                  <XCircleIcon className="w-3 h-3" />
                  {errors.password}
                </p>
              )}

              {/* Password Requirements */}
              {passwordFocused && !form.password && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs space-y-1 animate-in fade-in duration-300">
                  <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                    Password requirements:
                  </p>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3 text-blue-500" />
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3 text-blue-500" />
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3 text-blue-500" />
                      One lowercase letter
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3 text-blue-500" />
                      One number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Confirm New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm your new password"
                  value={form.confirmPassword}
                  disabled={loading}
                  className="pr-12 transition-all duration-200 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    !loading && setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : (
                    <EyeClosedIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-left-2">
                  <XCircleIcon className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
              {form.confirmPassword &&
                form.password === form.confirmPassword &&
                form.password && (
                  <p className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in">
                    <CheckCircleIcon className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in shake duration-500">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <span>Reset Password</span>
                </div>
              )}
            </Button>

            {/* Sign In Link */}
            <div className="pt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  to="/admin/signin"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
