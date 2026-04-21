import React, { useState, useEffect, useMemo } from "react";
import {
  type MRT_ColumnDef,
  type MRT_Cell,
  type MRT_Row,
  MRT_ColumnFiltersState,
} from "material-react-table";
import { toast } from "react-toastify";
import PageMeta from "../../common/PageMeta";
import {
  getRoleUsers,
  sendInvitationApi,
  SendInvitationRequest,
  updateUsersApi,
  requestPasswordApi,
  PasswordRequestRequest,
  resendInvitationApi,
} from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import CommonTable from "../../mui/MuiTable";
import { getUserRole } from "../../../config/constants";
import { RightSideModal } from "../../mui/RightSideModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import Button from "../../ui/button/Button";
import { MailCheck, MailWarning, X } from "lucide-react";

interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string;
  is_active: boolean;
  is_approved: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  phone_verified: boolean;
  last_login: string | null;
  created_at: string;
  groups: any[];
  roles: string[];
  user_permissions: any[];
  invite_accepted?: boolean | null;
}

interface ToolbarAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

type OptionType = {
  value: string;
  label: string;
};

interface NewUserForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  mnpUser: string;
}

interface EditingState {
  userId: number;
  isActive?: boolean;
  isApproved?: boolean;
}

// Confirm Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
  loading: boolean;
  title?: string;
  message?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  email,
  loading,
  title = "Confirm Password Reset",
  message = "Are you sure you want to send a password reset email to",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">
            {message}{" "}
            <span className="font-semibold">{email}</span>?
          </p>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewTrainer: React.FC = () => {
  const userRole = getUserRole("admin");
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [roleList, setRoleList] = useState<OptionType[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [editingStatus, setEditingStatus] = useState<EditingState | null>(null);

  // State for confirm modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [emailToSend, setEmailToSend] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "reset" | "invitation";
    title: string;
    message: string;
  }>({
    type: "reset",
    title: "Confirm Password Reset",
    message: "Are you sure you want to send a password reset email to",
  });

  const [formData, setFormData] = useState<NewUserForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    mnpUser: "",
  });

  // Field-specific error messages
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewUserForm, string>>
  >({});

  // Check user roles
  const isSuperAdmin: boolean = userRole === "super_admin";
  const isAdmin: boolean = userRole === "admin";
  const canAddUsers: boolean = isSuperAdmin || isAdmin;
  const canEditApproval: boolean = isSuperAdmin || isAdmin;
  const canEditStatus: boolean = isSuperAdmin || isAdmin;

  // Reset form and errors when modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "",
        mnpUser: "",
      });
      setErrors({});
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async (page: number = 1) => {
    setColumnFilters([]);
    try {
      setLoading(true);
      const response = await getRoleUsers("roles__name__in", "trainer", page);
      const adminRole = await getRoleUsers("roles__name__in", "admin");

      // Transform admin role data to OptionType format
      const adminData = adminRole?.data?.results || adminRole || [];
      const formattedAdminList: OptionType[] = adminData.map((admin: any) => ({
        value: admin.id?.toString() || "",
        label:
          `${admin.first_name || ""} ${admin.last_name || ""}`.trim() ||
          admin.email ||
          "Unnamed",
      }));

      const data = response?.data;
      setUsers(data?.results || []);
      setRoleList(formattedAdminList);
      setTotalCount(data?.count || 0);
      setHasNext(!!data?.next);
      setHasPrev(!!data?.previous);
      setCurrentPage(page);
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch users");
      toast.error(errorMessage);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    userId: number,
    newStatus: boolean,
  ): Promise<void> => {
    if (!canEditStatus) {
      toast.error("You don't have permission to edit user status");
      return;
    }

    try {
      setLoading(true);
      const response = await updateUsersApi(userId, {
        is_active: newStatus,
      });

      if (response) {
        toast.success(
          `User ${newStatus ? "activated" : "deactivated"} successfully`,
        );
        await fetchUsers(currentPage);
      }
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        "Failed to update user status",
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setEditingStatus(null);
    }
  };

  // Handle password reset
  const handleResetPassword = (userEmail: string | null) => {
    if (!userEmail) {
      toast.error("User does not have an email address");
      return;
    }
    setEmailToSend(userEmail);
    setModalConfig({
      type: "reset",
      title: "Confirm Password Reset",
      message: "Are you sure you want to send a password reset email to",
    });
    setConfirmModalOpen(true);
  };

  // Handle resend invitation
  const handleResendInvitation = (userEmail: string | null) => {
    if (!userEmail) {
      toast.error("User does not have an email address");
      return;
    }
    setEmailToSend(userEmail);
    setModalConfig({
      type: "invitation",
      title: "Confirm Resend Invitation",
      message: "Are you sure you want to resend the invitation email to",
    });
    setConfirmModalOpen(true);
  };

  // Confirm send email based on type
  const confirmSendEmail = async () => {
    if (!emailToSend) return;

    const request: PasswordRequestRequest = { email: emailToSend };

    try {
      setSendingEmail(true);

      if (modalConfig.type === "reset") {
        await requestPasswordApi(request);
        toast.success(`Password reset email sent successfully to ${emailToSend}`);
      } else {
        await resendInvitationApi(request);
        toast.success(`Invitation email resent successfully to ${emailToSend}`);
      }

      setConfirmModalOpen(false);
      setEmailToSend("");
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        modalConfig.type === "reset"
          ? "Failed to send password reset email"
          : "Failed to resend invitation email"
      );
      toast.error(errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleNext = () => {
    if (!hasNext || loading) return;
    fetchUsers(currentPage + 1);
  };

  const handlePrev = () => {
    if (!hasPrev || loading) return;
    fetchUsers(currentPage - 1);
  };

  const handleAddUser = (): void => setIsAddModalOpen(true);
  const handleCloseModal = (): void => setIsAddModalOpen(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewUserForm, string>> = {};

    // Check required fields
    if (!formData.first_name?.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    // Check MNP User - only for non-admin users
    if (!isAdmin && !formData.mnpUser?.trim()) {
      newErrors.mnpUser = "Please select a MNP User";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const adminUser = JSON.parse(localStorage.getItem("admin_user") || "{}");

    try {
      // Calculate manager ID safely
      let managerId: number;
      if (isAdmin) {
        managerId = adminUser.id;
      } else {
        // Ensure mnpUser exists and is a valid string before parsing
        if (!formData.mnpUser) {
          toast.error("MNP User is required");
          setSubmitting(false);
          return;
        }
        managerId = parseInt(formData.mnpUser);
        if (isNaN(managerId)) {
          toast.error("Invalid MNP User selected");
          setSubmitting(false);
          return;
        }
      }

      const payload: SendInvitationRequest = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: `+91${formData.phone}`,
        roles: ["trainer"],
        manager: managerId,
      };

      await sendInvitationApi([payload]);
      toast.success("User invitation sent successfully");
      handleCloseModal();
      fetchUsers(currentPage);
    } catch (_) {
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        id: "actions",
        header: "Actions",
        size: 150,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }: { row: MRT_Row<User> }) => {
          const userEmail = row.original.email;
          const inviteAccepted = row.original.invite_accepted;

          return (
            <div className="flex items-center gap-2">
              <span title="Reset Password">
                <MailCheck
                  size={14}
                  onClick={() => handleResetPassword(userEmail)}
                  className="cursor-pointer text-green-600 hover:text-green-800 transition-all"
                />
              </span>
              {!inviteAccepted && userEmail && (
                <span title="Resend Invitation">
                  <MailWarning
                    size={14}
                    onClick={() => handleResendInvitation(userEmail)}
                    className="cursor-pointer text-yellow-600 hover:text-yellow-800 transition-all"
                  />
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "first_name",
        header: "First Name",
        size: 120,
        Cell: ({ cell }: { cell: MRT_Cell<User> }) => {
          const value = cell.getValue() as string | null;
          return value || "-";
        },
        filterVariant: "text",
        enableColumnFilter: true,
      },
      {
        accessorKey: "last_name",
        header: "Last Name",
        size: 120,
        Cell: ({ cell }: { cell: MRT_Cell<User> }) => {
          const value = cell.getValue() as string | null;
          return value || "-";
        },
        filterVariant: "text",
        enableColumnFilter: true,
      },
      {
        accessorKey: "phone",
        header: "Phone Number",
        size: 150,
        filterVariant: "text",
        enableColumnFilter: true,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
        Cell: ({ cell }: { cell: MRT_Cell<User> }) => {
          const value = cell.getValue() as string | null;
          return value || "-";
        },
        filterVariant: "text",
        enableColumnFilter: true,
      },
      {
        accessorKey: "region_name",
        header: "Region",
        size: 200,
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
          const value = cell.getValue() as string | null;
          return value || "-";
        },
        filterVariant: "text",
        enableColumnFilter: true,
      },
      {
        accessorKey: "created_at",
        header: "Created Date",
        size: 150,
        Cell: ({ cell }: { cell: MRT_Cell<User> }) => {
          const value = cell.getValue<string>();
          return value ? new Date(value).toLocaleDateString() : "-";
        },
        enableColumnFilter: false,
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 150,
        accessorFn: (row: User) => (row.is_active ? "active" : "inactive"),
        Cell: ({ row }: { row: MRT_Row<User> }) => {
          const userId = row.original.id;
          const isActive = row.original.is_active;
          const isEditing = editingStatus?.userId === userId;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <select
                  value={editingStatus?.isActive ? "active" : "inactive"}
                  onChange={(e) => {
                    const newValue = e.target.value === "active";
                    setEditingStatus({
                      userId,
                      isActive: newValue,
                    });
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  autoFocus
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button
                  onClick={() =>
                    editingStatus &&
                    handleStatusChange(userId, editingStatus.isActive || false)
                  }
                  className="p-1 text-success-600 hover:text-success-700 dark:text-success-400"
                  title="Save"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setEditingStatus(null)}
                  className="p-1 text-error-600 hover:text-error-700 dark:text-error-400"
                  title="Cancel"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                    : "bg-error-50 text-error-700 dark:bg-error-500/20 dark:text-error-400"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
              {canEditStatus && (
                <button
                  onClick={() => setEditingStatus({ userId, isActive })}
                  className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  title="Edit status"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        },
        filterVariant: "select",
        filterSelectOptions: [
          { text: "Active", value: "active" },
          { text: "Inactive", value: "inactive" },
        ],
        enableColumnFilter: true,
      },
      {
        accessorFn: (row) =>
          row.invite_accepted === true
            ? "accepted"
            : row.invite_accepted === false
              ? "pending"
              : "",
        id: "invite_accepted",
        header: "Invite Accepted",
        size: 200,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                value === "accepted"
                  ? "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                  : value === "pending"
                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {value === "accepted"
                ? "Accepted"
                : value === "pending"
                  ? "Pending"
                  : "-"}
            </span>
          );
        },
        filterVariant: "select",
        filterSelectOptions: [
          { text: "Accepted", value: "accepted" },
          { text: "Pending", value: "pending" },
        ],
      },
    ],
    [canEditApproval, canEditStatus, editingStatus],
  );

  const toolbarActions: ToolbarAction[] = [
    ...(canAddUsers
      ? [
          {
            label: "Add Trainer",
            onClick: handleAddUser,
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            ),
          },
        ]
      : []),
    {
      label: "Refresh",
      onClick: () => fetchUsers(currentPage),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-3">
      <PageMeta
        title="Telth Partner Console"
        description="Manage and view all users in the system"
      />
      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Trainer Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and create all users Trainer"
            : "View all users in the system"}
        </p>
        {!loading && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Total Users: <span className="font-semibold">{totalCount}</span>
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <CommonTable
          columns={columns}
          data={users}
          loading={loading}
          pagination={pagination}
          enableRowSelection={false}
          enableColumnFilters={true}
          onPaginationChange={setPagination}
          toolbarActions={toolbarActions}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
        {/* Custom Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!hasPrev || loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page <span className="font-semibold">{currentPage}</span>
            </span>
            <button
              onClick={handleNext}
              disabled={!hasNext || loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {canAddUsers && (
        <RightSideModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          showCloseButton={true}
          width=" "
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
              Add New Trainer
            </h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <Label>
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    error={!!errors.first_name}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <Label>
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="w-full"
                    error={!!errors.last_name}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.last_name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full"
                    error={!!errors.email}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label>
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className={`flex items-center border rounded-lg overflow-hidden ${
                      errors.phone
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <span className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium border-r border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="flex-1 px-3 py-2 text-sm h-11 outline-none bg-white dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* MNP User Selection */}
                {!isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      MNP User <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="mnpUser"
                      value={formData.mnpUser}
                      onChange={handleInputChange}
                      required={!isAdmin}
                      className={`w-full px-3 py-2 border ${
                        errors.mnpUser
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white`}
                    >
                      <option value="" disabled>
                        Select a MNP User
                      </option>
                      {roleList.map((admin) => (
                        <option key={admin.value} value={admin.value}>
                          {admin.label}
                        </option>
                      ))}
                    </select>
                    {errors.mnpUser && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.mnpUser}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  {submitting ? "Creating..." : "Create Trainer"}
                </Button>
              </div>
            </form>
          </div>
        </RightSideModal>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setEmailToSend("");
        }}
        onConfirm={confirmSendEmail}
        email={emailToSend}
        loading={sendingEmail}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  );
};

export default ViewTrainer;