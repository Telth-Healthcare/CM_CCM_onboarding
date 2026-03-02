import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { OtpModal } from "../Modal/OtpModal";
import { signupApi, verifyPhoneOtpApi } from "../../../api/auth.api";
import { setToken } from "../../../config/constants";
import Label from "../../../shared/components/form/Label";
import Input from "../../../shared/components/form/input/InputField";
import { EyeIcon } from "lucide-react";
import { EyeCloseIcon } from "../../../shared/icons";
import Checkbox from "../../../shared/components/form/input/Checkbox";
import { Spinner } from "../../../shared/context/Spinner";


export default function SignUpForm() {
  const [state, setState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    terms: "",
  });

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    session_token: string;
    phone: string;
  } | null>(null);

  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      terms: "",
    };

    let isValid = true;

    if (!state.firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!state.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }

    if (!state.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(state.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!state.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(state.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number is invalid";
      isValid = false;
    }

    if (!state.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (state.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!isChecked) {
      newErrors.terms = "You must agree to the terms and conditions";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const signUpData = {
        first_name: state.firstName,
        last_name: state.lastName,
        email: state.email,
        phone: state.phone,
        password: state.password,
        role: state.role,
      };

      const response = await signupApi(signUpData);

      // Check if phone verification is required
      const verifyPhoneFlow = response.data.flows.find(
        (flow: any) => flow.id === "verify_phone" && flow.is_pending,
      );

      if (verifyPhoneFlow) {
        sessionStorage.setItem(
          "otp_session",
          verifyPhoneFlow.meta.session_token,
        );
        setVerificationData({
          session_token: verifyPhoneFlow.meta.session_token,
          phone: state.phone,
        });
        setOtpModalOpen(true);
        toast.info("Please verify your phone number with the OTP sent");
      } else {
        // No verification needed, proceed to success
        toast.success("Account created successfully!");
        resetForm();
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error: any) {
      const verifyPhoneFlow = error?.response?.data?.data?.flows.find(
        (flow: any) => flow.id === "verify_phone" && flow.is_pending,
      );

      if (verifyPhoneFlow) {
        const sessionId = error?.response?.data?.meta.session_token;
        sessionStorage.setItem("otp_session", sessionId);
        setVerificationData({
          session_token: sessionId,
          phone: state.phone,
        });
        setOtpModalOpen(true);
        toast.info("Please verify your phone number with the OTP sent");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (otp: string) => {
    if (!verificationData) return;

    setVerificationLoading(true);

    try {
      const response = await verifyPhoneOtpApi({
        code: otp,
      });
      if (response.status === 200) {
        const responseData = response.meta;
        const userData = response?.data?.user;
        if (responseData?.access_token && responseData?.refresh_token) {
          setToken({
            access: responseData?.access_token,
            refresh: responseData?.refresh_token,
            user: userData,
            sessionId: responseData?.session_token,
          });
        }
        toast.success("Phone number verified successfully!");
        setOtpModalOpen(false);
        resetForm();
      }

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "OTP verification failed. Please try again.",
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const resetForm = () => {
    setState({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      role: "CUSTOMER",
    });
    setIsChecked(false);
    setVerificationData(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignUp(e);
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 mt-5 w-full max-w-md mx-auto">
        <div>
          <div className="mb-3 sm:mb-5">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your details to create an account!
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              {/* Google Sign Up Button - Fixed to prevent double calls */}
              <form
                method="POST"
                action="https://unmeddling-randy-superarduously.ngrok-free.dev/_allauth/app/v1/auth/provider/redirect"
              >
                <input type="hidden" name="provider" value="google" />
                <input type="hidden" name="process" value="login" />
                <input
                  type="hidden"
                  name="callback_url"
                  value="http://localhost:5173/account/provider/callback"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                      fill="#040504"
                    />
                    <path
                      d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                      fill="#EB4335"
                    />
                  </svg>
                  SignUp with Google
                </button>
              </form>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
              >
                <svg
                  width="21"
                  className="fill-current"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                </svg>
                Sign up with X
              </button>
            </div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-5">
                {/* Form fields */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={state.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={state.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={state.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label>
                    Phone Number<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+1 (123) 456-7890"
                    value={state.phone}
                    pattern="^\+?[0-9]*$"
                    inputMode="numeric"
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9+]/g, "");
                      handleChange("phone", cleaned);
                    }}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={state.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
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
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    className="w-5 h-5 mt-0.5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Terms and Conditions,
                    </span>{" "}
                    and our{" "}
                    <span className="text-gray-800 dark:text-white">
                      Privacy Policy
                    </span>
                  </p>
                </div>
                {errors.terms && (
                  <p className="text-xs text-red-500">{errors.terms}</p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Spinner size={6} className="text-blue-500" />
                        Creating Account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account? {""}
                <Link
                  to="/control-center/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        phone={verificationData?.phone || ""}
        onVerify={handleOtpVerification}
        loading={verificationLoading}
      />
    </div>
  );
}
