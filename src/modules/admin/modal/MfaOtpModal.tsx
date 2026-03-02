import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Label from "../../../shared/components/form/Label";
import Input from "../../../shared/components/form/input/InputField";
import Button from "../../../shared/components/ui/button/Button";
import { Spinner } from "../../../shared/context/Spinner";


interface MfaOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onVerify: (otp: string) => Promise<void>;
  loading: boolean;
  onResendOtp?: () => Promise<void>;
}

export function MfaOtpModal({
  isOpen,
  onClose,
  phone,
  onVerify,
  loading,
  onResendOtp,
}: MfaOtpModalProps) {
  const [otp, setOtp] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer countdown for resend OTP
  useEffect(() => {
    if (!isOpen) {
      setTimer(60);
      setCanResend(false);
      return;
    }

    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOtp("");
      setTimer(60);
      setCanResend(false);
    }
  }, [isOpen]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    if (otp.length < 4) {
      toast.error("OTP must be at least 4 digits");
      return;
    }

    await onVerify(otp);
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    try {
      if (onResendOtp) {
        await onResendOtp();
        setTimer(60);
        setCanResend(false);
        toast.success("OTP resent successfully");
      }
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">
            MFA Verification Required
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the OTP sent to <span className="font-medium">{phone}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify}>
          <div className="mb-6">
            <Label>
              Enter OTP <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Resend OTP */}
          <div className="mb-6 text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 disabled:opacity-50"
              >
                {resendLoading ? "Resending..." : "Resend OTP"}
              </button>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Resend OTP in {timer}s
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !otp.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Spinner size={5} className="text-white" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}