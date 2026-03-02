// src/components/auth/PasswordResetModal.tsx
import { useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Send } from "lucide-react";
import { requestPasswordApi } from "../../../api/auth.api";
import Label from "../../../shared/components/form/Label";
import Input from "../../../shared/components/form/input/InputField";
import Button from "../../../shared/components/ui/button/Button";


interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordResetModal = ({
  isOpen,
  onClose,
}: PasswordResetModalProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Call your password reset API
      await requestPasswordApi({ email: email.trim() });

      setIsSuccess(true);
      toast.success("Password reset link sent to your email!");

      // Auto close after 3 seconds on success
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send reset link. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setIsSuccess(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl dark:bg-gray-900"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Reset Your Password
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>
                    Email Address <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="pl-10"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Link
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full dark:bg-green-900/30 mb-4">
                  <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We've sent a password reset link to
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {email}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
                  >
                    try again
                  </button>
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Need help? Contact our Customer Support{" "}
              <button
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
              >
                (+91 95145 55210)
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
