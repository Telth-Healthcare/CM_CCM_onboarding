import React, { useState, useEffect, useMemo } from "react";
import {
  type MRT_ColumnDef,
  type MRT_Cell,
  type MRT_Row,
  MRT_ColumnFiltersState,
} from "material-react-table";
import { toast } from "react-toastify";
import {
  contactApi,
  getAllRegionsApi,
  getAllUsers,
  sendInvitationApi,
  SendInvitationRequest,
  updateUsersApi,
} from "../../../api";
import CommonTable from "../../mui/MuiTable";
import { RightSideModal } from "../../mui/RightSideModal";
import Input from "../../form/input/InputField";
import Button from "../../ui/button/Button";
import { getUserRole, getUser } from "../../../config/constants";
import Label from "../../form/Label";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import PageMeta from "../../common/PageMeta";

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

// Form state – matches the required payload
interface NewUserForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  region: string;
  role: string; // single selected role, will be sent as [role]
  mnpData: string;
}

type OptionType = {
  value: string;
  label: string;
};

interface ToolbarAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

const ViewAllUser = () => {
  const userRole = getUserRole("admin");
  const currentUser = getUser(); // Get current logged-in user details
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [roles, setRoles] = useState<OptionType[]>([]);
  const [allRoles, setAllRoles] = useState<OptionType[]>([]);
  const [regions, setRegions] = useState<OptionType[]>([]);
  const [mnpList, setMnpList] = useState<OptionType[]>([]);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingApproval, setEditingApproval] = useState<{
    userId: number;
    isApproved: boolean;
  } | null>(null);
  const [editingStatus, setEditingStatus] = useState<{
    userId: number;
    isActive: boolean;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<NewUserForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    region: "",
    mnpData: "",
  });

  // Field-specific error messages
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewUserForm, string>>
  >({});

  // Check user roles
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";

  const canAddUsers = isSuperAdmin || isAdmin;
  const canEditApproval = isSuperAdmin || isAdmin;
  const canEditStatus = isSuperAdmin || isAdmin;

  const availableRoles = useMemo(() => {
    if (isSuperAdmin) {
      return roles;
    } else if (isAdmin) {
      return roles.filter(
        (role) => role.value === "trainer" || role.value === "financier",
      );
    }
    return [];
  }, [roles, isSuperAdmin, isAdmin]);

  const showMnpField = useMemo(() => {
    return formData.role === "trainer" || formData.role === "financier";
  }, [formData.role]);

  const showRegionFiled = useMemo(() => {
    if (formData.role === "admin") {
      return true;
    } else if (formData.role === "trainer" || formData.role === "financier") {
      return false;
    }
    return false;
  }, [formData?.role]);

  // Reset form and errors when modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "",
        region: "",
        mnpData: "",
      });
      setErrors({});
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    fetchUsers();
    fetchRoleInfo();
    if (!isAdmin) {
      fetchRegions();
    }
  }, []);

  const fetchRoleInfo = async () => {
    try {
      const response = await contactApi();

      // Filter out super_admin from roles
      const filteredRoles = (response.roles || []).filter(
        (role: OptionType) =>
          role.value !== "super_admin" &&
          role.value !== "cm" &&
          role.value !== "ccm",
      );
       const allRoles = (response.roles || []).filter(
        (role: OptionType) =>
          role.value !== "super_admin"
      );

      setRoles(filteredRoles);
      setAllRoles(allRoles)
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch roles");
      toast.error(errorMessage);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await getAllRegionsApi();
      const regionData = response?.results || response || [];

      const formattedRegions = regionData.map((region: any) => ({
        value: region.id.toString(),
        label: region.name,
      }));

      setRegions(formattedRegions);
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch regions");
      toast.error(errorMessage);
    }
  };

  const fetchUsers = async () => {
    setColumnFilters([]);
    try {
      setLoading(true);
      const response = await getAllUsers();
      const userData = response?.results || response || [];
      setUsers(userData);
      setTotalCount(response?.count || 0);

      // Filter Admin users for MNP dropdown based on who is logged in
      const adminUsers = userData.filter((user: User) => {
        const hasAdminRole = user.roles?.some(
          (r: any) =>
            r === "admin" || r?.name === "admin" || r?.value === "admin",
        );
        if (isSuperAdmin) {
          return hasAdminRole;
        } else if (isAdmin) {
          const isCurrentUser = user.id === currentUser?.id;
          return hasAdminRole && isCurrentUser;
        }
        return false;
      });

      const formattedMnpList = adminUsers.map((user: User) => ({
        value: String(user.id),
        label:
          `${user.first_name || ""} ${user.last_name || ""} (${user.email || ""})`.trim(),
      }));

      setMnpList(formattedMnpList);

      if (isAdmin && formattedMnpList.length === 1) {
        setFormData((prev) => ({
          ...prev,
          mnpData: formattedMnpList[0].value,
        }));
      }
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
        filterVariant: "select",
        filterSelectOptions: allRoles.map((role) => ({
          text: role.label,
          value: role.value,
        })),
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
      roles,
      canEditApproval,
      canEditStatus,
      editingApproval,
      editingStatus,
    ],
  );

  const handleAddUser = () => setIsAddModalOpen(true);
  const handleCloseModal = () => setIsAddModalOpen(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));

    // Clear mnpData when role changes
    if (name === "role") {
      setFormData((prev) => ({ ...prev, mnpData: "" }));
    }
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

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    // Region is mandatory ONLY for admin role
    if (formData.role === "admin") {
      if (!formData.region?.trim()) {
        newErrors.region = "Region is required for admin users";
      }
    }

    // MNP Admin is mandatory for trainer/financier roles
    if ((formData.role === "trainer" || formData.role === "financier") && userRole !== 'admin') {
      if (!formData.mnpData?.trim()) {
        newErrors.mnpData = "MNP Admin is required for trainer/financier users";
      }
    }

    // Permission check for admin users
    if (isAdmin && formData.role === "admin") {
      newErrors.role = "You don't have permission to create admin users";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isAdmin && formData.role === "admin") {
      toast.error("You don't have permission to create admin users");
      return;
    }

    setSubmitting(true);

    try {
      const payload: SendInvitationRequest = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: `+91${formData.phone}`,
        region: formData.region,
        roles: [formData.role],
      };

      if (showMnpField) {
        if (isAdmin) {
          const adminUser = JSON.parse(
            localStorage.getItem("admin_user") || "{}",
          );
          payload.manager = adminUser?.id;
        } else {
          payload.manager = +formData.mnpData;
        }
      }
      const response = await sendInvitationApi([payload]);

      const result = response?.data?.[0] || response?.[0];

      if (result?.is_sent) {
        toast.success("User invitation sent successfully");
        handleCloseModal();
        fetchUsers();
      } else {
        toast.warning("Email was not sent. Please check the email address.");
      }
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        "Failed to send user invitation",
      );
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const toolbarActions: ToolbarAction[] = [
    ...(canAddUsers
      ? [
          {
            label: "Add User",
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
          User Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and create all users (Admin, Trainer, Financier)"
            : isAdmin
              ? "Manage and create Trainer & Financier users (You will be the MNP Admin)"
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
      </div>

      {/* Right Side Modal for Adding User - Only accessible by super_admin or admin */}
      {canAddUsers && (
        <RightSideModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          showCloseButton={true}
          width=" "
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
              Add New User
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

                {/* Role Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border ${
                      errors.role
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white`}
                  >
                    <option value="" disabled>
                      Select a role
                    </option>
                    {availableRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Region Select */}
                {!isAdmin && showRegionFiled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border ${
                        errors.region
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white`}
                    >
                      <option value="" disabled>
                        Select a region
                      </option>
                      {regions.map((region) => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                    {errors.region && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.region}
                      </p>
                    )}
                  </div>
                )}

                {!isAdmin && showMnpField && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      MNP Admin User <span className="text-red-500">*</span>
                    </label>
                    {mnpList.length > 0 ? (
                      <select
                        name="mnpData"
                        value={formData.mnpData}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-3 py-2 border ${
                          errors.mnpData
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white`}
                      >
                        <option value="" disabled>
                          Select an Admin user
                        </option>
                        {mnpList.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        {isSuperAdmin
                          ? "No admin users available in the system"
                          : ""}
                      </div>
                    )}
                    {errors.mnpData && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.mnpData}
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
                  {submitting ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </RightSideModal>
      )}
    </div>
  );
};

export default ViewAllUser;