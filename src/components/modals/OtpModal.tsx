// src/components/modals/OtpModal.tsx

import { useState, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { toast } from "react-toastify";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  mode: "signup" | "signin";
  onFirebaseSuccess: (idToken: string) => void;
}

export function OtpModal({
  isOpen,
  onClose,
  phone,
  onFirebaseSuccess,
}: OtpModalProps) {
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState<ConfirmationResult | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      // Timer expired
      setTimerActive(false);
      setFirebaseError("OTP has expired. Please request a new one.");
      setOtpSent(false);
      setConfirm(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  // Reset timer when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetTimer();
    }
  }, [isOpen]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset timer function
  const resetTimer = () => {
    setTimeLeft(300);
    setTimerActive(false);
  };

  // Start timer function
  const startTimer = () => {
    setTimeLeft(300);
    setTimerActive(true);
  };

  // Auto send OTP when modal opens
  useEffect(() => {
    if (isOpen && phone && !otpRequested) {
      setOtpRequested(true);
      sendOtp();
    }
  }, [isOpen, phone]);

  // Setup Firebase reCAPTCHA
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) return;

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      }
    );
  };

  // Send OTP
  const sendOtp = async () => {
    setSendLoading(true);
    setFirebaseError("");

    try {
      setupRecaptcha();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier!
      );

      setConfirm(confirmationResult);
      setOtpSent(true);
       toast.success("otp send")
      startTimer(); // Start the timer when OTP is sent
    } catch (err: any) {
      console.error("OTP Send Error:", err.code, err.message);

      let message = "Failed to send OTP. Please try again.";

      if (err?.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again after some time.";
      } else if (err?.code === "auth/quota-exceeded") {
        message = "SMS quota exceeded. Please try later.";
      } else if (err?.message?.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        message = "Too many attempts. Please wait before requesting OTP again.";
      }

      setFirebaseError(message);

      window.recaptchaVerifier?.clear();
      window.recaptchaVerifier = undefined;
      resetTimer();
    } finally {
      setSendLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!confirm) return;

    if (otp.length < 6) {
      setFirebaseError("Enter a valid 6-digit OTP");
      return;
    }

    if (timeLeft === 0) {
      setFirebaseError("OTP has expired. Please request a new one.");
      return;
    }

    setVerifyLoading(true);
    setFirebaseError("");

    try {
      const result = await confirm.confirm(otp);
      const idToken = await result.user.getIdToken();

      resetTimer();
      handleClose();
      onFirebaseSuccess(idToken);
    } catch (err: any) {
      let message = "OTP verification failed. Please try again.";

      if (err?.code === "auth/too-many-requests") {
        message = "Too many attempts. Try again later.";
      } else if (err?.code === "auth/code-expired") {
        message = "OTP expired. Please request a new one.";
      } else if (err?.code === "auth/invalid-verification-code") {
        message = "Invalid OTP. Please check and try again.";
      }

      setFirebaseError(message);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (sendLoading) return;
    resetTimer();
    sendOtp();
  };

  // Reset modal
  const handleClose = () => {
    setOtp("");
    setConfirm(null);
    setOtpSent(false);
    setOtpRequested(false);
    setFirebaseError("");
    resetTimer();

    window.recaptchaVerifier?.clear();
    window.recaptchaVerifier = undefined;

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
            disabled={sendLoading || !otpSent || timeLeft === 0}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              setFirebaseError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && otp.length === 6 && !verifyLoading && otpSent && timeLeft > 0) {
                handleVerifyOtp();
              }
            }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={sendLoading}
            className="text-sm text-brand-500 hover:text-brand-600 disabled:opacity-50"
          >
            {sendLoading ? "Sending..." : "Resend OTP"}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {timerActive && otpSent ? (
                <>
                  <svg className="inline-block w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Expires in {formatTime(timeLeft)}
                </>
              ) : (
                "Expires in 05:00"
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={verifyLoading}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={verifyLoading || otp.length < 6 || !otpSent || timeLeft === 0}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            {verifyLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}