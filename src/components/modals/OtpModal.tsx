// src/components/modals/OtpModal.tsx

import { useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { toast } from "react-toastify";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  mode: "signup" | "signin";
  onFirebaseSuccess: (idToken: string) => void;   // ✅ returns idToken to caller, caller handles backend
}

export function OtpModal({ isOpen, onClose, phone, onFirebaseSuccess }: OtpModalProps) {
  const [otp,           setOtp]           = useState("");
  const [confirm,       setConfirm]       = useState<ConfirmationResult | null>(null);
  const [step,          setStep]          = useState<"send" | "verify">("send");
  const [sendLoading,   setSendLoading]   = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

 const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {},           // fires when reCAPTCHA solved
        "expired-callback": () => {   // reset if token expires
          window.recaptchaVerifier?.clear?.();
          (window.recaptchaVerifier as any) = undefined;
        },
      }
    );
    // ✅ Render explicitly — avoids timing issues in production
  }
};

  const handleSendOtp = async () => {
    if (!phone) { toast.error("Phone number is missing"); return; }
    setSendLoading(true);
    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirm(result);
      setStep("verify");
      toast.success("OTP sent to " + phone);
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to send OTP: " + error.message);
      window.recaptchaVerifier?.clear?.();
      (window.recaptchaVerifier as any) = undefined;
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirm) return;
    if (otp.length < 6) { toast.error("Enter a valid 6-digit OTP"); return; }

    setVerifyLoading(true);
    try {
      // Firebase verifies the OTP
      const result  = await confirm.confirm(otp);
      const idToken = await result.user.getIdToken();   // Firebase UID proof

      toast.success("OTP verified successfully!");

      // ✅ Close modal first
      handleClose();

      // ✅ Pass idToken back to caller (SignUpForm or SignInForm handles backend call)
      onFirebaseSuccess(idToken);

    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "OTP verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleClose = () => {
    setOtp("");
    setConfirm(null);
    setStep("send");
    onClose();
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
            {step === "send"
              ? `We'll send an OTP to ${phone}`
              : `Enter the OTP sent to ${phone}`}
          </p>
        </div>

        {step === "send" ? (
          <div className="flex gap-3">
            <button type="button" onClick={handleClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
              Cancel
            </button>
            <button type="button" onClick={handleSendOtp} disabled={sendLoading}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50">
              {sendLoading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text" inputMode="numeric" maxLength={6}
                placeholder="Enter 6-digit OTP" value={otp} autoFocus
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setStep("send")}
                className="text-sm text-brand-500 hover:text-brand-600">
                Resend OTP
              </button>
              <span className="text-xs text-gray-400">Expires in 5 min</span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleClose} disabled={verifyLoading}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={handleVerifyOtp} disabled={verifyLoading || otp.length < 6}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50">
                {verifyLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </>
        )}
        <div id="recaptcha-container" />
      </div>
    </div>
  );
}