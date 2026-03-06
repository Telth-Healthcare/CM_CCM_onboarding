import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { codeRequestApi, codeVerifyApi, signinApi } from "../../../api/auth.api";
import { setToken } from "../../../config/constants";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import Label from "../../../shared/components/form/Label";
import Input from "../../../shared/components/form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "../../../shared/icons";
import Checkbox from "../../../shared/components/form/input/Checkbox";
import Button from "../../../shared/components/ui/button/Button";
import { Spinner } from "../../../shared/context/Spinner";
import { OtpModal } from "../modal/OtpModal";
import { MfaOtpModal } from "../modal/MfaOtpModal";
import { PasswordResetModal } from "../modal/PasswordResetModal";

interface SignIn {
  phone: string;
  password: string;
}

interface ValidationErrors {
  phone?: string;
  password?: string;
}

type TabType = "phone-password" | "phone-otp";

export default function SignInForm() {
  const [state, setState] = useState<SignIn>({
    phone: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("phone-otp");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [touched, setTouched] = useState<{
    phone?: boolean;
    password?: boolean;
  }>({});
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [currentPhone, setCurrentPhone] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaVerificationLoading, setMfaVerificationLoading] = useState(false);
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);

  const navigate = useNavigate();

  // Validation functions
  const validatePhone = (phone: string): string => {
    if (!phone.trim()) {
      return "Phone number is required";
    }

    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    return "";
  };

  const validateField = (field: keyof SignIn, value: string): string => {
    switch (field) {
      case "phone":
        return validatePhone(value);
      case "password":
        return activeTab === "phone-password" ? validatePassword(value) : "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    const phoneError = validatePhone(state.phone);
    if (phoneError) errors.phone = phoneError;

    if (activeTab === "phone-otp") {
      const passwordError = validatePassword(state.password);
      if (passwordError) errors.password = passwordError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: keyof SignIn) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const error = validateField(field, state[field]);
    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleSignIn = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      setTouched({
        phone: true,
        password: activeTab === "phone-otp" ? true : false,
      });

      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { phone, password } = state;

    try {
      const signInDetail = { phone: phone.trim(), password };
      const response = await signinApi(signInDetail);

      // ✅ Normal login - 200 Success
      if (response.status === 200) {
        const responseData = response.meta;
        const userData = response?.data;

        if (responseData.access_token && responseData.refresh_token) {
          setToken({
            access: responseData?.access_token,
            refresh: responseData?.refresh_token,
            user: userData?.user,
            sessionId: responseData?.session_token,
          });

          toast.success("Sign In successful");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      const errorResponse = error?.response?.data;

      if (error?.response?.status === 401 && errorResponse?.data?.flows) {
        const sessionToken = errorResponse?.meta?.session_token;

        if (sessionToken) {
          sessionStorage.setItem("otp_session", sessionToken);
        }

        const hasMfaFlow = errorResponse.data.flows.some(
          (flow: any) => flow.id === "mfa_authenticate",
        );

        if (hasMfaFlow) {
          setCurrentPhone(phone);
          setMfaModalOpen(true);
          toast.info("MFA required. Please enter your authentication code.");
          setLoading(false);
          return;
        }

        // Check if login_by_code flow exists (regular OTP)
        const hasOtpFlow = errorResponse.data.flows.some(
          (flow: any) => flow.id === "login_by_code",
        );

        if (hasOtpFlow) {
          setCurrentPhone(phone);
          setOtpModalOpen(true); // ✅ Open regular OTP modal
          toast.info("Please verify with OTP sent to your phone.");
          setLoading(false);
          return;
        }
      } else {
        const message = handleAxiosError(error, "Sign in failed.");
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (otp: string) => {
    if (!otp.trim()) {
      toast.error("Please enter OTP");
      return;
    }

    if (otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }

    setVerificationLoading(true);

    try {
      const sessionToken = sessionStorage.getItem("otp_session");

      if (!sessionToken) {
        throw new Error("Session expired. Please try signing in again.");
      }

      const response = await codeVerifyApi({
        code: otp.trim(),
      });

      if (response.status === 200) {
        sessionStorage.removeItem("otp_session");

        let responseData = response;

        if (
          responseData?.meta?.access_token &&
          responseData?.meta?.refresh_token
        ) {
          setToken({
            access: responseData?.meta?.access_token,
            refresh: responseData?.meta?.refresh_token,
            user: responseData.data.user,
            sessionId: responseData?.meta?.session_token,
          });

          toast.success("Phone number verified successfully!");
          setOtpModalOpen(false);
          setOtp("");

          setState({
            phone: "",
            password: "",
          });

          navigate("/dashboard");
        }
      } else {
        throw new Error(`Verification failed with status: ${response.status}`);
      }
    } catch (error: any) {
      const errorResponse = error?.response?.data;

      if (error?.response?.status === 401 && errorResponse?.data?.flows) {
        const hasMfaFlow = errorResponse.data.flows.some(
          (flow: any) => flow.id === "mfa_authenticate",
        );

        if (hasMfaFlow) {
          const sessionToken = errorResponse?.meta?.session_token;

          if (sessionToken) {
            sessionStorage.setItem("otp_session", sessionToken);
          }

          // ✅ Close OTP modal and open MFA modal
          setOtpModalOpen(false);
          setMfaModalOpen(true);
          toast.info("MFA required. Please enter your authentication code.");
          setVerificationLoading(false);
          return;
        }
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "OTP verification failed. Please try again.";
      toast.error(errorMessage);

      if (
        errorMessage.includes("session") ||
        errorMessage.includes("expired")
      ) {
        sessionStorage.removeItem("otp_session");
        setOtpModalOpen(false);
        toast.info("Session expired. Please sign in again.");
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleMfaOtpVerification = async (code: string) => {
    if (!code.trim()) {
      toast.error("Please enter authentication code");
      return;
    }

    if (code.length < 4) {
      toast.error("Please enter a valid authentication code");
      return;
    }

    setMfaVerificationLoading(true);

    try {
      const sessionToken = sessionStorage.getItem("otp_session");

      if (!sessionToken) {
        throw new Error("Session expired. Please sign in again.");
      }

      // Call mfaloginverify API
      const response = await mfaLoginVerifyApi({
        code: code.trim(),
      });

      if (response.status === 200) {
        sessionStorage.removeItem("otp_session");

        // Extract tokens from response
        if (response?.meta?.access_token && response?.meta?.refresh_token) {
          setToken({
            access: response?.meta?.access_token,
            refresh: response?.meta?.refresh_token,
            user: response.data.user,
            sessionId: response?.meta?.session_token,
          });

          toast.success("MFA verification successful!");
          setMfaModalOpen(false);

          setState({
            phone: "",
            password: "",
          });

          navigate("/dashboard");
        }
      } else {
        throw new Error(`Verification failed with status: ${response.status}`);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "MFA verification failed. Please try again.";
      toast.error(errorMessage);

      // Handle session expiry
      if (
        errorMessage.includes("session") ||
        errorMessage.includes("expired")
      ) {
        sessionStorage.removeItem("otp_session");
        setMfaModalOpen(false);
        toast.info("Session expired. Please sign in again.");
      }
    } finally {
      setMfaVerificationLoading(false);
    }
  };

  const handleResendMfaOtp = async () => {
    if (!state.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      const responseData = {
        phone: state.phone,
      };
      await codeRequestApi(responseData);
      toast.success("OTP resent successfully");
    } catch (error: any) {
      toast.error("Failed to resend OTP");
    }
  };

  const handleSendOtp = async () => {
    // Validate phone number
    const phoneError = validatePhone(state.phone);
    if (phoneError) {
      setTouched((prev) => ({ ...prev, phone: true }));
      setValidationErrors((prev) => ({ ...prev, phone: phoneError }));
      toast.error(phoneError);
      return;
    }

    setLoading(true);
    try {
      const responseData = {
        phone: state.phone,
      };
      const codeResponse = await codeRequestApi(responseData);

      const sessionToken = codeResponse?.meta?.session_token;
      if (sessionToken) {
        sessionStorage.setItem("otp_session", sessionToken);
      }

      setCurrentPhone(state.phone);
      setOtpModalOpen(true);
      toast.success("OTP sent to your phone number");
    } catch (error: any) {
      const errorResponse = error?.response?.data;

      if (error?.response?.status === 401 && errorResponse?.data?.flows) {
        const sessionToken = errorResponse?.meta?.session_token;

        if (sessionToken) {
          sessionStorage.setItem("otp_session", sessionToken);
        }

        const loginByCodeFlow = errorResponse.data.flows.find(
          (flow: any) => flow.id === "login_by_code",
        );

        if (loginByCodeFlow?.is_pending) {
          setCurrentPhone(state.phone);
          setOtpModalOpen(true);
          toast.info("Please verify with OTP sent to your phone.");
          setLoading(false);
          return;
        }

        const hasMfaFlow = errorResponse.data.flows.some(
          (flow: any) => flow.id === "mfa_authenticate",
        );

        if (hasMfaFlow) {
          setCurrentPhone(state.phone);
          setMfaModalOpen(true);
          toast.info("MFA required. Please enter your authentication code.");
          setLoading(false);
          return;
        }
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SignIn, value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (error) setError("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "phone-password") {
      handleSignIn();
    } else if (activeTab === "phone-otp") {
      handleSendOtp();
    }
  };

  const handlePwdRequest = () => {
    setPasswordResetModalOpen(true);
  };

  const renderTabContent = () => {
    if (activeTab === "phone-otp") {
      return (
        <>
          <div>
            <Label>
              Phone Number <span className="text-error-500">*</span>
            </Label>
            <Input
              value={state.phone}
              type="tel"
              pattern="^\+?[0-9]*$"
              inputMode="numeric"
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9+]/g, "");
                handleChange("phone", cleaned);
              }}
              onBlur={() => handleBlur("phone")}
              placeholder="Enter your phone number"
              required
              disabled={loading || otpModalOpen}
              error={!!validationErrors.phone && touched.phone}
            />
            {validationErrors.phone && touched.phone && (
              <p className="mt-1 text-xs text-error-500">
                {validationErrors.phone}
              </p>
            )}
          </div>
        </>
      );
    } else {
      return (
        <>
          <div>
            <Label>
              Phone Number <span className="text-error-500">*</span>
            </Label>
            <Input
              value={state.phone}
              type="tel"
              pattern="^\+?[0-9]*$"
              inputMode="numeric"
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9+]/g, "");
                handleChange("phone", cleaned);
              }}
              onBlur={() => handleBlur("phone")}
              placeholder="Enter your phone number"
              required
              disabled={loading}
              error={!!validationErrors.phone && touched.phone}
            />
            {validationErrors.phone && touched.phone && (
              <p className="mt-1 text-xs text-error-500">
                {validationErrors.phone}
              </p>
            )}
          </div>
          <div>
            <Label>
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="Enter your password"
                value={state.password}
                required
                disabled={loading}
                error={!!validationErrors.password && touched.password}
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
            {validationErrors.password && touched.password && (
              <p className="mt-1 text-xs text-error-500">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isChecked}
                onChange={setIsChecked}
                disabled={loading}
              />
              <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                Keep me logged in
              </span>
            </div>
            <div
              onClick={handlePwdRequest}
              className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 cursor-pointer"
            >
              Forgot password?
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTab === "phone-password"
                ? "Enter your phone and password to sign in!"
                : "Enter your phone number and OTP to sign in!"}
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
              >
                Sign in with Google
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
              >
                Sign in with X
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("phone-otp");
                    // Clear validation errors when switching tabs
                    setValidationErrors({});
                    setTouched({});
                  }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === "phone-otp"
                      ? "text-brand-500 border-b-2 border-brand-500 dark:text-brand-400 dark:border-brand-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Phone + OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("phone-password");
                    // Clear validation errors when switching tabs
                    setValidationErrors({});
                    setTouched({});
                  }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === "phone-password"
                      ? "text-brand-500 border-b-2 border-brand-500 dark:text-brand-400 dark:border-brand-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Phone + Password
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="space-y-6">
                {renderTabContent()}

                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={
                      loading || (activeTab === "phone-otp" && otpModalOpen)
                    }
                  >
                    {loading ? (
                      <>
                        <Spinner size={6} className="text-blue-600" />
                        {activeTab === "phone-otp"
                          ? "Signing in..."
                          : "Sending OTP..."}
                      </>
                    ) : activeTab === "phone-otp" ? (
                      "Sign in"
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to="/control-center/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpModalOpen}
        onClose={() => {
          setOtpModalOpen(false);
          sessionStorage.removeItem("otp_session");
        }}
        phone={state?.phone}
        onVerify={handleOtpVerification}
        loading={verificationLoading}
      />

      <MfaOtpModal
        isOpen={mfaModalOpen}
        onClose={() => {
          setMfaModalOpen(false);
          sessionStorage.removeItem("otp_session");
        }}
        phone={state?.phone}
        onVerify={handleMfaOtpVerification}
        loading={mfaVerificationLoading}
        onResendOtp={handleResendMfaOtp}
      />

      <PasswordResetModal
        isOpen={passwordResetModalOpen}
        onClose={() => setPasswordResetModalOpen(false)}
      />
    </div>
  );
}
