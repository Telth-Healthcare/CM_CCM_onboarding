// src/components/modals/OtpModal.tsx

import { useState, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";

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
  onFirebaseSuccess: (idToken: string) => void; // backend call handled by caller
}

export function OtpModal({ isOpen, onClose, phone, onFirebaseSuccess }: OtpModalProps) {
  const [otp,           setOtp]           = useState("");
  const [confirm,       setConfirm]       = useState<ConfirmationResult | null>(null);
  const [sendLoading,   setSendLoading]   = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState(""); // shown inline inside modal
  const [otpSent,       setOtpSent]       = useState(false);

  // Auto-send OTP as soon as modal opens — no manual "Send OTP" step
  useEffect(() => {
    if (isOpen && phone) {
      sendOtp();
    }
  }, [isOpen]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          window.recaptchaVerifier?.clear?.();
          (window.recaptchaVerifier as any) = undefined;
        },
      });
    }
  };

  const sendOtp = async () => {
    setSendLoading(true);
    setFirebaseError(""); // clear previous error
    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirm(result);
      setOtpSent(true);
    } catch (err) {
      const error = err as Error;
      // Firebase send failure — shown inline, not toast
      console.log(error)
      setFirebaseError("Failed to send OTP: ");
      window.recaptchaVerifier?.clear?.();
      (window.recaptchaVerifier as any) = undefined;
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirm) return;
    if (otp.length < 6) { setFirebaseError("Enter a valid 6-digit OTP"); return; }

    setVerifyLoading(true);
    setFirebaseError(""); // clear previous error
    try {
      const result  = await confirm.confirm(otp);
      const idToken = await result.user.getIdToken(); // Firebase JWT — proof OTP was correct

      handleClose();
      onFirebaseSuccess(idToken); // caller (SignUpForm) now handles backend + its own errors
    } catch (err) {
      const error = err as Error;
      // Wrong OTP / expired — shown inline inside modal so user can retry
      console.log(error)
      setFirebaseError("OTP verification failed. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleClose = () => {
    setOtp("");
    setConfirm(null);
    setOtpSent(false);
    setFirebaseError("");
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
            {sendLoading
              ? "Sending OTP..."
              : otpSent
              ? `OTP sent to ${phone}`
              : `Preparing OTP for ${phone}`}
          </p>
        </div>

        {/* Inline Firebase error — OTP send or verify failure */}
        {firebaseError && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{firebaseError}</p>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            autoFocus
            disabled={sendLoading || !otpSent} // disabled until OTP is sent
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              setFirebaseError(""); // clear error on new input
            }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          {/* Resend re-triggers sendOtp — resets state cleanly */}
          <button type="button" onClick={sendOtp} disabled={sendLoading}
            className="text-sm text-brand-500 hover:text-brand-600 disabled:opacity-50">
            {sendLoading ? "Sending..." : "Resend OTP"}
          </button>
          <span className="text-xs text-gray-400">Expires in 5 min</span>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={handleClose} disabled={verifyLoading}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleVerifyOtp}
            disabled={verifyLoading || otp.length < 6 || !otpSent}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50">
            {verifyLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>

        <div id="recaptcha-container" />
      </div>
    </div>
  );
}