import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { checkMfaStatus, emailVerifyApi, mfaemailverify, mfaemailverify2, mfareauthenticate, mfaSetupApi, mfaSetupConfirmApi, recoveryCode } from "../../../api/mfa.api";
import PageMeta from "../../../shared/components/common/PageMeta";
import PageBreadcrumb from "../../../shared/components/common/PageBreadCrumb";
import UserMetaCard from "./UserMetaCard";
import UserInfoCard from "./UserInfoCard";
import UserAddressCard from "./UserAddressCard";
import Label from "../../../shared/components/form/Label";
import Input from "../../../shared/components/form/input/InputField";

export default function UserProfiles() {
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [qrUrl, setQRUrl] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const hasCalled = useRef(false);
  const [showcurrentpassword, setshowcurrentpassword] = useState(false)
  const [currentpassword, setcurrentpassword] = useState("")

const generateQRCode = (totpUrl: string) => {
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUrl)}`;
  
  setQRUrl(qrCodeUrl);
  setShowQRPopup(true);
};

const hasVerified = useRef(false);
  const setupMFA = async () => {
    try {
      const res = await mfaSetupApi();
      const totpUrl = res?.meta?.totp_url;

      if (!totpUrl) {
        toast.error("Failed to get QR data");
        return;
      }

      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUrl)}`;
      setQRUrl(qrCodeUrl);
      setShowQRPopup(true);

    } catch (err: any) {
      toast.error(err?.response?.data?.message || "MFA setup failed");
    }
  };


const verifyemail = async () => {
  const lastCall = localStorage.getItem('lastVerifyCall');
  const now = Date.now();
  
  if (lastCall && now - parseInt(lastCall) < 5000) return;
  localStorage.setItem('lastVerifyCall', now.toString());

  try {
    // Check email verification status
    const response = await mfaemailverify();
    const verified = response?.data?.[0]?.verified;
    const emailData = response?.data?.[0]?.email;
    setEmail(emailData);

    if (verified === false) {
      setEmailVerified(false);
    } else {
      setEmailVerified(true);
    }

    // ✅ Check if MFA (TOTP) is already enabled
    try {
      const mfaStatusResponse = await checkMfaStatus();
      
      // Check if TOTP authenticator exists in the response
      const authenticators = mfaStatusResponse?.data || [];
      const hasTotpEnabled = authenticators.some(
        (auth: any) => auth.type === "totp"
      );

      setMfaEnabled(hasTotpEnabled);
      
      console.log("MFA Status:", hasTotpEnabled ? "Enabled" : "Disabled");
      
    } catch (mfaError) {
      console.error("Error checking MFA status:", mfaError);
      setMfaEnabled(false);
    }

  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Verification error from backend";
    setEmailVerified(true);
    toast.error(message);
  }
};

 useEffect(() => {
  if (hasVerified.current) return; // Prevent double call
  hasVerified.current = true;
  verifyemail();
}, []);

 const handleVerifyClick = async (emailParam: string) => {
  try {
    if (emailVerified !== false) {
      toast.info("Your email is already verified.");
      return;
    }

    const session = localStorage.getItem("sessionId");
    if (!session) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    const emailToSend = email || emailParam;
    if (!emailToSend) {
      toast.error("Email not found.");
      return;
    }

    const response = await mfaemailverify2({
      session: session,
      email: emailToSend,
    });

    // ✅ Show backend response message as-is
    const successMessage = 
      response?.meta?.message || 
      response?.message || 
      "Verification email sent successfully.";
    
    toast.success(successMessage);

  } catch (error: any) {
    // ✅ Show backend error message as-is
    const errorMessage = 
      error?.response?.data?.meta?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to send verification email.";
    
    toast.error(errorMessage);
  }
};

 const emailVerifyLink = async () => {
  const key = searchParams.get("key");
  if (!key) {
    console.info("Verification key missing");
    toast.info("Check email for verification link");
    return;
  }

  try {
    const response = await emailVerifyApi(key);
    
    // ✅ Show backend response as-is
    const successMessage = 
      response?.meta?.message || 
      response?.message || 
      "Email verified successfully!";
    
    toast.success(successMessage);

    // ✅ Update state immediately
    setEmailVerified(true);

    // ✅ Auto-reload page after 1.5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 1500);

    // Automatically setup MFA after email verification (first time login)
    try {
      const mfaRes = await mfaSetupApi();
      if (mfaRes?.meta?.totp_url) {
        await generateQRCode(mfaRes.meta.totp_url);
        toast.success("MFA setup initiated");
      }
    } catch (mfaError: any) {
      const mfaErrorMsg = 
        mfaError?.response?.data?.meta?.message ||
        mfaError?.response?.data?.message ||
        "MFA setup failed";
      toast.error(mfaErrorMsg);
    }
  } catch (error: any) {
    // ✅ Show backend error as-is
    const errorMessage = 
      error?.response?.data?.meta?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Email verification failed";
    
    toast.error(errorMessage);
  }
};

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;
    emailVerifyLink();
  }, []);

const pwdsubmit = async () => {
  try {
    await mfareauthenticate({ password: currentpassword });

    // Close password modal
    setshowcurrentpassword(false);
    setcurrentpassword("");
    
    try {
      const mfaRes = await mfaSetupApi();
      
      const totpUrl = mfaRes?.meta?.totp_url;

      if (!totpUrl) {
        toast.error("Failed to get QR data");
        return;
      }
      generateQRCode(totpUrl);
      
    } catch (mfaError: any) {
      
      const totpUrl = mfaError?.response?.data?.meta?.totp_url;
      
      if (totpUrl) {
        generateQRCode(totpUrl);
      } else {
        toast.error("Failed to get QR data");
      }
    }
    
  } catch (err: any) {
    toast.error("Password verification failed");
  }
};


  const downloadRecoveryCodes = (codes: string[]) => {
  const content = `
⚠️ RECOVERY CODES – KEEP SECURE ⚠️

These recovery codes can be used to access your account
if you lose access to your authenticator app.

• Each code can be used only once
• Store them in a password manager or offline location

--------------------------------------

${codes.join("\n")}

--------------------------------------
Generated on: ${new Date().toLocaleString()}
`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "recovery-codes.txt";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const handleSubmit = async () => {
  try {
    // Step 1: Confirm MFA
    await mfaSetupConfirmApi({ code: otp });
    toast.success("MFA enabled successfully!");

    // Step 2: Get recovery codes
    const recoveryRes = await recoveryCode();
    const codes: string[] = recoveryRes?.data?.unused_codes || [];

    if (codes.length > 0) {
      downloadRecoveryCodes(codes);
      toast.info("Recovery codes downloaded. Store them securely.");
    }

    // Step 3: Cleanup and update state
    setMfaEnabled(true); // ✅ Set to true
    setShowQRPopup(false);
    setQRUrl("");
    setOtp("");

    // ✅ Optional: Refresh to show updated state
    setTimeout(() => {
      window.location.reload();
    }, 1500);

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "MFA setup failed"
    );
  }
};

  const handleClosePopup = () => {
    setShowQRPopup(false);
    setQRUrl("");
    setOtp("");
  };

  return (
    <>
      <PageMeta
        title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-between mb-5 lg:mb-7">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Profile
            </h3>
          </div>
          <div>
            {emailVerified === false ? (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <p className="text-sm text-blue-800">
                  Please verify your email to enable 2FA.
                </p>
                <button
                  onClick={() => {
                    handleVerifyClick(email as string);
                  }}
                  className="mt-2 text-blue-600 underline"
                >
                  Verify email
                </button>
              </div>
            ) : emailVerified === true && !mfaEnabled ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <p className="text-sm text-green-800">
                  Email verified. Enable 2FA for extra security.
                </p>
                <button
                  onClick={() => setshowcurrentpassword(true)}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Enable 2FA
                </button>

              </div>
            ) : mfaEnabled ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <p className="text-sm text-green-800">
                  ✓ 2FA is enabled for your account
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>

      {showQRPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <button
              onClick={handleClosePopup}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="text-center">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                Setup Two-Factor Authentication
              </h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)<br />
                2. Enter the 6-digit code from the app below
              </p>

              <div className="mb-6 flex justify-center">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Security QR Code"
                    className="h-48 w-48 rounded-lg border border-gray-200 p-2 dark:border-gray-700"
                  />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500"></div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-1 mb-4">
                <Label>Enter 6-digit OTP from authenticator app</Label>
                <Input
                  type="number"
                  id="otp"
                  name="otp"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    if (qrUrl) {
                      const link = document.createElement("a");
                      link.href = qrUrl;
                      link.download = "security-qr-code.png";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="flex-1 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Download QR
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={otp.length !== 6}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showcurrentpassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              Confirm your password
            </h2>

            <input
              type="password"
              value={currentpassword}
              onChange={(e) => setcurrentpassword(e.target.value)}
              className="w-full border rounded p-3 mb-4"
              placeholder="Enter current password"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setshowcurrentpassword(false)}
                className="flex-1 border rounded p-2"
              >
                Cancel
              </button>

              <button
                onClick={pwdsubmit}
                className="flex-1 bg-brand-500 text-white rounded p-2"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}   
