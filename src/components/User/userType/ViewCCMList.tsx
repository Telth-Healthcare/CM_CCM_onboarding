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
} from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import CommonTable from "../../mui/MuiTable";
import { getUserRole } from "../../../config/constants";

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
}

interface ToolbarAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

const ViewCCMList = () => {
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

  const [editingApproval, setEditingApproval] = useState<{
    userId: number;
    isApproved: boolean;
  } | null>(null);
  const [editingStatus, setEditingStatus] = useState<{
    userId: number;
    isActive: boolean;
  } | null>(null);



  // Check user roles
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";

  const canEditApproval = isSuperAdmin || isAdmin;
  const canEditStatus = isSuperAdmin || isAdmin;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setColumnFilters([]);
    try {
      setLoading(true);
     const response = await getRoleUsers(["ccm"]); 
      const userData = response?.data?.results || response || [];
      setUsers(userData);
      setTotalCount(response?.data?.count || 0);

    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch users");
      toast.error(errorMessage);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalChange = async (
    userId: number,
    newApprovalStatus: boolean,
  ) => {
    if (!canEditApproval) {
      toast.error("You don't have permission to edit approval status");
      return;
    }

    try {
      setLoading(true);
      const response = await updateUsersApi(userId, {
        is_approved: newApprovalStatus,
      });

      if (response) {
        toast.success(
          `User ${newApprovalStatus ? "approved" : "pending"} successfully`,
        );
        await fetchUsers();
      }
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        "Failed to update approval status",
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setEditingApproval(null);
    }
  };

  const handleStatusChange = async (
    userId: number,
    newStatus: boolean,
  ) => {
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
        await fetchUsers();
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

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
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
        accessorKey: "roles",
        header: "Role",
        size: 150,
        accessorFn: (row) => row.roles?.[0] || "",
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
          const row = cell.row.original;
          const roles = row.roles;
          if (!roles || roles.length === 0) return "-";
          return roles[0];
        },
        enableColumnFilter: false,
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
        accessorKey: "is_approved",
        header: "Approval",
        size: 150,
        accessorFn: (row) => (row.is_approved ? "approved" : "pending"),
        Cell: ({ row }: { row: MRT_Row<User> }) => {
          const userId = row.original.id;
          const isApproved = row.original.is_approved;
          const isEditing = editingApproval?.userId === userId;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <select
                  value={editingApproval.isApproved ? "approved" : "pending"}
                  onChange={(e) => {
                    const newValue = e.target.value === "approved";
                    setEditingApproval({
                      userId,
                      isApproved: newValue,
                    });
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  autoFocus
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
                <button
                  onClick={() =>
                    handleApprovalChange(userId, editingApproval.isApproved)
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
                  onClick={() => setEditingApproval(null)}
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
                  isApproved
                    ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                    : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
                }`}
              >
                {isApproved ? "Approved" : "Pending"}
              </span>
              {canEditApproval && (
                <button
                  onClick={() => setEditingApproval({ userId, isApproved })}
                  className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  title="Edit approval status"
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
          { text: "Approved", value: "approved" },
          { text: "Pending", value: "pending" },
        ],
        enableColumnFilter: true,
      },
    ],
    [
      pagination.pageIndex,
      pagination.pageSize,
      canEditApproval,
      canEditStatus,
      editingApproval,
      editingStatus,
    ],
  );

  const toolbarActions: ToolbarAction[] = [
    {
      label: "Refresh",
      onClick: fetchUsers,
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
          CCM Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and create all users CCM"
            :  "View all users in the system"}
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
      </div>
    </div>
  );
};

export default ViewCCMList;