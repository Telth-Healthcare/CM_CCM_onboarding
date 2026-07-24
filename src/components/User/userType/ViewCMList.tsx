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
  updateUsersApi,
  requestPasswordApi,
  resendInvitationApi,
} from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import CommonTable from "../../mui/MuiTable";
import { getUserRole } from "../../../config/constants";
import CCMOnboard from "../UserOnboardProcess/Onboard";
import {  PlusIcon, X } from "lucide-react";
import RowActionDropdown, { RowAction } from "../../mui/RowActionDropdown";

interface User {
  id: number;
  partner_id: number;
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
  invite_accepted: boolean | null;
  application_id: number | null;
}

interface ToolbarAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

type ViewType = "view" | "edit" | "create" | null;

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

const ViewCMList = () => {
  const userRole = getUserRole("admin");
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );
  const [editingStatus, setEditingStatus] = useState<{
    userId: number;
    isActive: boolean;
  } | null>(null);

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

  // Check user roles
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";

  const canEditApproval = isSuperAdmin || isAdmin;
  const canEditStatus = isSuperAdmin || isAdmin;
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [editingDetail, setEditingDetail] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleNext = () => {
    if (!hasNext || loading) return;
    fetchUsers(currentPage + 1);
  };

  const handlePrev = () => {
    if (!hasPrev || loading) return;
    fetchUsers(currentPage - 1);
  };

  const fetchUsers = async (page: number = 1) => {
    setColumnFilters([]);
    try {
      setLoading(true);
      const response = await getRoleUsers("roles__name__in", "cm", page);
      const data = response?.data;

      setUsers(data?.results || []);
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

  const handleStatusChange = async (userId: number, newStatus: boolean) => {
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

    const request = { email: emailToSend };

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

  const handleEdit = (userId: number, user: User) => {
    setSelectedUserId(userId);
    setEditingDetail(user);
    setCurrentView("edit");
  };

  const handleCreateNew = () => {
    setSelectedUserId(null);
    setCurrentView("create");
  };

  const handleOnboardDone = () => {
    setCurrentView(null);
    setSelectedUserId(null);
    fetchUsers(currentPage);
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
          const partnerId = row.original.partner_id;
          const hasPartnerId = partnerId != null && partnerId !== 0;
          const userEmail = row.original.email;
          const inviteAccepted = row.original.invite_accepted;

          if (!hasPartnerId) {
            return null;
          }
          const rowActions: RowAction[] = [
            {
              label: "Edit User",
              onClick: () => handleEdit(partnerId, row.original),
            },
            {
              label: "Reset Password",
              onClick: () => handleResetPassword(userEmail),
            },
            ...(!inviteAccepted && userEmail
              ? [
                  {
                    label: "Resend Invitation",
                    onClick: () => handleResendInvitation(userEmail),
                  },
                ]
              : []),
          ];
          return <RowActionDropdown actions={rowActions} />;
        },
      },
      {
        accessorKey: "first_name",
        header: "First Name",
        size: 120,
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
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
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
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
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
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
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? new Date(value).toLocaleDateString() : "-";
        },
        enableColumnFilter: false,
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 150,
        accessorFn: (row) => (row.is_active ? "active" : "inactive"),
        Cell: ({ row }: { row: MRT_Row<User> }) => {
          const userId = row.original.id;
          const isActive = row.original.is_active;
          const isEditing = editingStatus?.userId === userId;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <select
                  value={editingStatus.isActive ? "active" : "inactive"}
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
                    handleStatusChange(userId, editingStatus.isActive)
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
    [
      pagination.pageIndex,
      pagination.pageSize,
      canEditApproval,
      canEditStatus,
      editingStatus,
    ],
  );

  const toolbarActions: ToolbarAction[] = [
    ...(canEditApproval
      ? [
          {
            label: "Create CM",
            onClick: handleCreateNew,
            icon: <PlusIcon className="w-4 h-4" />,
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

  if (currentView === "create" || currentView === "edit") {
    return (
      <CCMOnboard
        useRouting={false}
        targetUserId={selectedUserId ?? undefined}
        onDone={handleOnboardDone}
        roleFilter="cm"
        initialData={editingDetail}
      />
    );
  }

  return (
    <div className="p-3">
      <PageMeta
        title="Telth Partner Console"
        description="Manage and view all users in the system"
      />
      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          CM Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and create all users CM"
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
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
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

export default ViewCMList;