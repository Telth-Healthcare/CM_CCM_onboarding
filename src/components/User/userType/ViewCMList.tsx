import React, { useState, useEffect, useMemo } from "react";
import {
  type MRT_ColumnDef,
  type MRT_Cell,
  type MRT_Row,
  MRT_ColumnFiltersState,
} from "material-react-table";
import { toast } from "react-toastify";
import PageMeta from "../../common/PageMeta";
import { getRoleUsers, updateUsersApi } from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import CommonTable from "../../mui/MuiTable";
import { getUserRole } from "../../../config/constants";
import CCMOnboard from "../UserOnboardProcess/Onboard";
import { PlusIcon } from "lucide-react";

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
}

interface ToolbarAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

type ViewType = "view" | "edit" | "create" | null;

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

  // Check user roles
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";

  const canEditApproval = isSuperAdmin || isAdmin;
  const canEditStatus = isSuperAdmin || isAdmin;
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>(null);
  const [currentPage, setCurrentPage] = useState(1); // tracks current page number
  const [hasNext, setHasNext] = useState(false); // is there a next page?
  const [hasPrev, setHasPrev] = useState(false);

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
      setHasNext(!!data?.next); // true if next URL exists
      setHasPrev(!!data?.previous); // true if previous URL exists
      setCurrentPage(page); // update current page
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

  const handleEdit = (userId: number) => {
    setSelectedUserId(userId);
    setCurrentView("edit");
  };

  const handleCreateNew = () => {
    setSelectedUserId(null);
    setCurrentView("create");
  };

  // Called from CCMOnboard when done (success or back button)
  const handleOnboardDone = () => {
    setCurrentView(null);
    setSelectedUserId(null);
    fetchUsers(currentPage); // refresh list to reflect new onboarding state
  };

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        id: "actions",
        header: "Actions",
        size: 100,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }: { row: MRT_Row<User> }) => {
          const partnerId = row.original.partner_id;
          // Only show action button if partner_id exists (not null, not undefined, not 0)
          const hasPartnerId = partnerId != null && partnerId !== 0;
          
          if (!hasPartnerId) {
            return null; // Don't render anything if partner_id is null/0
          }
          
          return (
            <button
              onClick={() => handleEdit(partnerId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                      text-brand-600 bg-brand-50 hover:bg-brand-100
                      dark:text-brand-400 dark:bg-brand-500/10 dark:hover:bg-brand-500/20
                      transition-colors"
              title="Edit onboarding"
            >
              <svg
                className="w-3.5 h-3.5"
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
          );
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
    </div>
  );
};

export default ViewCMList;