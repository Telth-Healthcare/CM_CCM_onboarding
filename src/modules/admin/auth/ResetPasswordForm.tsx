// components/auth/ResetPasswordForm.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPasswordApi } from "../../../api/auth.api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../../shared/icons";
import Button from "../../../shared/components/ui/button/Button";
import Label from "../../../shared/components/form/Label";
import Input from "../../../shared/components/form/input/InputField";


interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.get("key");
  console.log(searchKey);

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

      toast.success("Password reset successfully!");

      // Clear form
      setForm({
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (error: any) {
      const response = error?.response?.data?.data?.flows;
      const loginFlow = response.find((flow: any) => flow.id === "login");
      if (!!loginFlow) {
        toast.success("Your password has been reset successfully!");
        setForm({
        password: "",
        confirmPassword: "",
      });
        navigate("/signin");
      } else {
        const message = handleAxiosError(error, "reset password failed");
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isValidKey === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Validating reset link...
          </p>
        </div>
      </div>
    );
  }

  if (!isValidKey) {
    return (
      <div className="flex flex-col flex-1">
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="size-5" />
            Back to dashboard
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">
              Invalid Reset Link
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              This password reset link is invalid or has expired. Please request
              a new reset link.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full"
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
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Password */}
              <div>
                <Label>
                  New Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Enter new password"
                    value={form.password}
                    required
                    disabled={loading}
                  />
                  <span
                    onClick={() => !loading && setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters with uppercase, lowercase, and
                  numbers
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <Label>
                  Confirm New Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    required
                    disabled={loading}
                  />
                  <span
                    onClick={() =>
                      !loading && setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {errors.general && (
                <div className="p-3 text-sm text-center text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                  {errors.general}
                </div>
              )}

              <div>
                <Button
                  className="w-full"
                  size="sm"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2 inline animate-spin"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              Remember your password? {""}
              <Link
                to="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
