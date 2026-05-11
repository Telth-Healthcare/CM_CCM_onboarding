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

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = ({ className = "" }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

export function OtpModal({
  isOpen,
  onClose,
  phone,
  onFirebaseSuccess,
}: OtpModalProps) {
  const [otp,            setOtp]            = useState("");
  const [confirm,        setConfirm]        = useState<ConfirmationResult | null>(null);
  const [sendLoading,    setSendLoading]    = useState(false);
  const [verifyLoading,  setVerifyLoading]  = useState(false);
  const [firebaseError,  setFirebaseError]  = useState("");
  const [otpSent,        setOtpSent]        = useState(false);
  const [otpRequested,   setOtpRequested]   = useState(false);

  const [timeLeft,    setTimeLeft]    = useState(300);
  const [timerActive, setTimerActive] = useState(false);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) {
      if (timeLeft === 0 && timerActive) {
        setTimerActive(false);
        setFirebaseError("OTP has expired. Please request a new one.");
        setOtpSent(false);
        setConfirm(null);
      }
      return;
    }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, timeLeft]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) resetAll();
  }, [isOpen]);

  // Auto-send OTP when modal first opens
  useEffect(() => {
    if (isOpen && phone && !otpRequested) {
      setOtpRequested(true);
      sendOtp();
    }
  }, [isOpen, phone]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const resetTimer = () => { setTimeLeft(300); setTimerActive(false); };
  const startTimer = () => { setTimeLeft(300); setTimerActive(true); };

  // ── Setup reCAPTCHA ───────────────────────────────────────────────────────
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) return;
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  };

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setSendLoading(true);
    setFirebaseError("");
    setOtpSent(false); // disable input while sending

    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier!);
      setConfirm(result);
      setOtpSent(true);   // ← only NOW the input becomes enabled
      startTimer();
      toast.success("OTP sent successfully!");
    } catch (err: any) {
      console.error("OTP Send Error:", err.code, err.message);

      const message =
        err?.code === "auth/too-many-requests" ||
        err?.message?.includes("TOO_MANY_ATTEMPTS_TRY_LATER")
          ? "Too many attempts. Please wait before requesting OTP again."
          : err?.code === "auth/quota-exceeded"
          ? "SMS quota exceeded. Please try later."
          : err?.code === "auth/invalid-phone-number"
          ? "Invalid phone number. Please go back and check."
          : err?.code === "auth/network-request-failed"
          ? "Network error. Please check your connection and try again."
          : "Failed to send OTP. Please try again.";

      setFirebaseError(message);
      window.recaptchaVerifier?.clear();
      window.recaptchaVerifier = undefined;
      resetTimer();
    } finally {
      setSendLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!confirm) return;
    if (otp.length < 6) { setFirebaseError("Enter a valid 6-digit OTP"); return; }
    if (timeLeft === 0) { setFirebaseError("OTP has expired. Please request a new one."); return; }

    setVerifyLoading(true);
    setFirebaseError("");

    try {
      const result  = await confirm.confirm(otp);
      const idToken = await result.user.getIdToken();
      resetTimer();
      handleClose();
      onFirebaseSuccess(idToken);
    } catch (err: any) {
      const message =
        err?.code === "auth/too-many-requests"
          ? "Too many attempts. Try again later."
          : err?.code === "auth/code-expired"
          ? "OTP expired. Please request a new one."
          : err?.code === "auth/invalid-verification-code"
          ? "Invalid OTP. Please check and try again."
          : "OTP verification failed. Please try again.";

      setFirebaseError(message);
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────────
  const handleResendOtp = () => {
    if (sendLoading) return;
    setOtp("");
    setFirebaseError("");
    resetTimer();
    sendOtp();
  };

  // ── Close / reset ─────────────────────────────────────────────────────────
  const resetAll = () => {
    setOtp(""); setConfirm(null); setOtpSent(false);
    setOtpRequested(false); setFirebaseError(""); resetTimer();
    window.recaptchaVerifier?.clear();
    window.recaptchaVerifier = undefined;
  };

  const handleClose = () => { resetAll(); onClose(); };

  if (!isOpen) return null;

  // Derived flags for readability
  const inputDisabled   = sendLoading || !otpSent || timeLeft === 0;
  const verifyDisabled  = verifyLoading || otp.length < 6 || !otpSent || timeLeft === 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
     <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-sm mx-4">

  {/* Header */}
  <div className="mb-3">
    <h2 className="text-base font-semibold text-gray-800 dark:text-white">
      Verify Phone Number
    </h2>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
      {sendLoading
        ? "Sending OTP…"
        : otpSent
        ? `OTP sent to ${phone}`
        : `Preparing OTP for ${phone}`}
    </p>
  </div>

  {/* Sending spinner */}
  {sendLoading && (
    <div className="flex items-center gap-3 py-3 mb-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg border border-dashed border-gray-200 dark:border-gray-600 px-4">
      <Spinner className="h-5 w-5 text-brand-500 shrink-0" />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Sending to <span className="font-medium text-gray-700 dark:text-white">{phone}</span>…
      </p>
    </div>
  )}

  {/* Error banner */}
  {firebaseError && (
    <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
      <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      <p className="text-xs text-red-600">{firebaseError}</p>
    </div>
  )}

  {/* OTP input */}
  <div className={`mb-3 transition-opacity duration-300 ${sendLoading ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
      Enter OTP
    </label>
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      placeholder={otpSent ? "Enter 6-digit OTP" : "Waiting for OTP…"}
      value={otp}
      autoFocus={otpSent}
      disabled={inputDisabled}
      onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); setFirebaseError(""); }}
      onKeyDown={e => { if (e.key === "Enter" && !verifyDisabled) handleVerifyOtp(); }}
      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white transition-colors
        ${inputDisabled
          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          : "border-gray-300 dark:border-gray-600 bg-white"
        }`}
    />
    {otpSent && !inputDisabled && (
      <p className="mt-0.5 text-xs text-gray-400 text-right">{otp.length}/6</p>
    )}
  </div>

  {/* Resend + Timer */}
  <div className={`flex items-center justify-between mb-3 transition-opacity duration-300 ${sendLoading ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
    <button
      type="button"
      onClick={handleResendOtp}
      disabled={sendLoading}
      className="text-xs text-brand-500 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      Resend OTP
    </button>

    {timerActive && otpSent && (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`font-medium tabular-nums ${timeLeft <= 60 ? "text-red-500" : "text-gray-600 dark:text-gray-300"}`}>
          {formatTime(timeLeft)}
        </span>
      </span>
    )}
  </div>

  {/* Action buttons */}
  <div className="flex gap-2">
    <button
      type="button"
      onClick={handleClose}
      disabled={verifyLoading}
      className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      Cancel
    </button>

    <button
      type="button"
      onClick={handleVerifyOtp}
      disabled={verifyDisabled}
      className="flex-1 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {verifyLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner className="h-4 w-4 text-white" />
          Verifying…
        </span>
      ) : "Verify OTP"}
    </button>
  </div>

  <div id="recaptcha-container" />
</div>
    </div>
  );
}