import { useState } from "react";
import { toast } from "react-toastify";
import { resendPhoneOtpApi } from "../../../api/auth.api";
import Label from "../../../shared/components/form/Label";
import Input from "../../../shared/components/form/input/InputField";
import { Spinner } from "../../../shared/context/Spinner";


export function OtpModal({
  isOpen,
  onClose,
  phone,
  onVerify,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onVerify: (otp: string) => Promise<void>;
  loading: boolean;
}) {
  const [otp, setOtp] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Please enter a valid OTP");
      return;
    }
    await onVerify(otp);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtp(value);
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setResendLoading(true);
    try {
      await resendPhoneOtpApi({});
      toast.success("OTP resent successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Verify Phone Number
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter the OTP sent to {phone}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label>
              OTP Code<span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={handleOtpChange}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm text-brand-500 hover:text-brand-600 disabled:text-gray-400 dark:text-brand-400 dark:hover:text-brand-300"
              >
                {resendLoading ? (
                  <>
                    <Spinner size={4} className="inline mr-1" />
                    Resending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              OTP expires in 5 minutes
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Spinner size={4} className="inline mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}