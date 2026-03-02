import { useState } from "react";
import { getUser } from "../../../config/constants";
import { useModal } from "../../../shared/hooks/useModal";
import { changePasswordApi } from "../../../api/auth.api";
import { toast } from "react-toastify";
import { EditIcon } from "../../../shared/context/EditIcon";
import { Modal } from "../../../shared/components/ui/modal";
import Label from "../../../shared/components/form/Label";
import Input from "../../../shared/components/form/input/InputField";
import Button from "../../../shared/components/ui/button/Button";
import { EyeIcon } from "lucide-react";
import { EyeCloseIcon } from "../../../shared/icons";


interface PasswordState {
  currentPassword: string;
  newPassword: string;
}

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordState, setPasswordState] = useState<PasswordState>({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const user = getUser()

  const handleSave = () => {
    console.log("Saving changes...");
    closeModal();
  };

  const handlePwdChange = () => {
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordState({
      currentPassword: "",
      newPassword: "",
    });
    setPasswordError("");
  };

  const handlePasswordChange = (field: keyof PasswordState, value: string) => {
    setPasswordState((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (passwordError) setPasswordError("");
  };

  const validatePassword = () => {
    if (!passwordState.currentPassword) {
      setPasswordError("Current password is required");
      return false;
    }

    if (!passwordState.newPassword) {
      setPasswordError("New password is required");
      return false;
    }

    if (passwordState.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handlePasswordSave = async () => {
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      const pwdData = {
        current_password: passwordState.currentPassword,
        new_password: passwordState.newPassword,
      };
      await changePasswordApi(pwdData);

      toast.success("Password changed successfully");
      closePasswordModal();
    } catch (error: any) {
      toast.error("Password change failed:", error);
      setPasswordError("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            {/* <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src="/images/user/owner.jpg" alt="user" />
            </div> */}
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user.first_name}{" "}{user.last_name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
                {/* <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Arizona, United States
                </p> */}
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                onClick={handlePwdChange}
              >
                Change Password
              </button>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <EditIcon />
            Edit
          </button>
        </div>
      </div>

      {/* Edit Personal Information Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar h-[520px] relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[300px] overflow-y-auto px-2 pb-1">
              <div className="">
                <h5 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input type="text" value="Musharof" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input type="text" value="Chowdhury" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input type="text" value="randomuser@pimjo.com" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input type="text" value="+09 363 398 46" />
                  </div>

                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" value="Team Manager" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        className="max-w-[500px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <div className="mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Change Password
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update your password to keep your account secure.
            </p>
          </div>

          <form className="space-y-5">
            {/* Current Password */}
            <div>
              <Label>
                Current Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  onChange={(e) =>
                    handlePasswordChange("currentPassword", e.target.value)
                  }
                  placeholder="Enter current password"
                  value={passwordState.currentPassword}
                  required
                  disabled={loading}
                />
                <span
                  onClick={() =>
                    !loading && setShowCurrentPassword(!showCurrentPassword)
                  }
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showCurrentPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </span>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label>
                New Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  onChange={(e) =>
                    handlePasswordChange("newPassword", e.target.value)
                  }
                  placeholder="Enter new password"
                  value={passwordState.newPassword}
                  required
                  disabled={loading}
                />
                <span
                  onClick={() =>
                    !loading && setShowNewPassword(!showNewPassword)
                  }
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showNewPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 6 characters
              </p>
            </div>

            {passwordError && (
              <div className="p-3 text-sm text-center text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                {passwordError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={closePasswordModal}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handlePasswordSave} disabled={loading}>
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 inline animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
