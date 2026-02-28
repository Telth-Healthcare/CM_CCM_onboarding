import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { acceptInvitationApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Button from "../../components/ui/button/Button";


interface AcceptInvitationFormState {
  password: string;
  confirmPassword: string;
}

export default function AcceptInvitationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get("key");
  const nextPath = searchParams.get("next") || "/default-path"; // fallback if missing

  const [form, setForm] = useState<AcceptInvitationFormState>({
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
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Validate the invitation token when the component mounts
  useEffect(() => {
    if (!inviteToken) {
      setIsValidToken(false);
    }

    setIsValidToken(true);
  }, [inviteToken]);

  const handleChange = (
    field: keyof AcceptInvitationFormState,
    value: string,
  ) => {
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

    if (!validateForm()) return;
    if (!inviteToken) {
      toast.error("Invalid invitation token");
      return;
    }

    setLoading(true);

    try {
      const response = {
        key: inviteToken,
        password: form.password,
      };
      const result = await acceptInvitationApi(response);

      toast.success("Invitation accepted successfully!");

      setForm({ password: "", confirmPassword: "" });

      navigate(result.redirect_url, { replace: true });
    } catch (error: any) {
      const message = handleAxiosError(error, "Failed to accept invitation");
      toast.error(message);
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Validating invitation...
          </p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="flex flex-col flex-1">
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
              Invalid Invitation
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              This invitation link is invalid or has expired. Please request a
              new invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Valid token – show the form
  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto">
      <div className="flex flex-col justify-center flex-1">
        <div className="p-6 sm:p-10">
          <h2 className="mb-1 text-2xl font-bold text-gray-800 dark:text-white">
            Accept Invitation
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Set your password to complete registration
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="mb-2">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`${
                    errors.password ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="mb-2">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  className={`${
                    errors.confirmPassword
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {errors.general && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-500/10 dark:text-red-400">
                {errors.general}
              </div>
            )}

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? (
                <>
                  Accepting Invitation...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
