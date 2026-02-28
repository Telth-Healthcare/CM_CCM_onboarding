import { useEffect, useState } from "react";
import {  useNavigate } from "react-router";
import {  EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { signinApi } from "../../api";
import { setToken } from "../../config/constants";
import { toast } from "react-toastify";

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
}, []);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!state.phone) {
      newErrors.phone = "phone number is required";
    }
    // else if (!validatephone(state.phone)) {
    //   newErrors.phone = "Enter valid 10 digit phone number";
    // }

    if (!state.password) {
      newErrors.password = "Password is required";
    } else if (state.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      const response = await signinApi(state);
      const accessToken = response?.meta?.access_token;
      const refreshToken = response?.meta?.refresh_token;
      const user = response?.data?.user;

      if (accessToken && refreshToken && user) {
        setToken({
          access: accessToken,
          refresh: refreshToken,
          user: user,
        });
      }
      toast.success("Signed in successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      setErrors({
        general:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
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
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSignIn}>
              <div className="space-y-6">
                {errors.general && (
                  <div className="text-sm text-red-500">{errors.general}</div>
                )}

                {/* phone Number */}
                <div>
                  <Label>
                    phone Number <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={state.phone}
                    onChange={(e) =>
                      setState({ ...state, phone: e.target.value })
                    }
                  />
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
                      onChange={(e) =>
                        setState({ ...state, password: e.target.value })
                      }
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
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

                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
