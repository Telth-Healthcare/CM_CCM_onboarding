import React, { useState, useEffect, useMemo } from "react";
import {
  type MRT_ColumnDef,
  type MRT_Cell,
  type MRT_Row,
} from "material-react-table";
import { toast } from "react-toastify";
import PageMeta from "../common/PageMeta";
import {
  contactApi,
  getAllRegionsApi,
  getAllUsers,
  sendInvitationApi,
} from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import CommonTable from "../mui/MuiTable";
import { RightSideModal } from "../mui/RightSideModal";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { getUserRole, getUser } from "../../config/constants";

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
  roles: any[];
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

interface sendInvitationRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  region: string;
  role: string[]; 
  mnpData?: string;
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

const AdminUser = () => {
  const userRole = getUserRole();
  const currentUser = getUser(); // Get current logged-in user details
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [roles, setRoles] = useState<OptionType[]>([]);
  const [regions, setRegions] = useState<OptionType[]>([]);
  const [mnpList, setMnpList] = useState<OptionType[]>([]);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    fetchRegions();
  }, []);

  const fetchRoleInfo = async () => {
    try {
      const response = await contactApi();

      // Filter out super_admin from roles
      const filteredRoles = (response.roles || []).filter(
        (role: OptionType) => role.value !== "super_admin",
      );

      setRoles(filteredRoles);
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
    try {
      setLoading(true);
      const response = await getAllUsers();
      const userData = response?.data || response || [];
      setUsers(userData);

      // Filter Admin users for MNP dropdown based on who is logged in
      const adminUsers = userData.filter((user: User) => {
        // Check if user has admin role
        const hasAdminRole = user.roles?.some(
          (r: any) =>
            r === "admin" || r?.name === "admin" || r?.value === "admin",
        );

        if (isSuperAdmin) {
          return user.is_active && hasAdminRole;
        } else if (isAdmin) {
          const isCurrentUser = user.id === currentUser?.id;
          return (
            user.is_active && user.is_approved && hasAdminRole && isCurrentUser
          );
        }

        return false;
      });

      console.log("Admin users for MNP dropdown:", adminUsers); // Debug log

      // Convert to dropdown format
      const formattedMnpList = adminUsers.map((user: User) => ({
        value: String(user.id),
        label:
          `${user.first_name || ""} ${user.last_name || ""} (${user.email || ""})`.trim(),
      }));

      setMnpList(formattedMnpList);

      // Auto-select the current admin if they are the only option
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
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "id",
        header: "S.No",
        size: 80,
        Cell: ({ row }: { row: MRT_Row<User> }) =>
          row.index + 1 + pagination.pageIndex * pagination.pageSize,
        enableColumnFilter: false,
      },
      {
        accessorKey: "first_name",
        header: "First Name",
        size: 120,
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
          const value = cell.getValue() as string | null;
          return value || "-";
        },
      },
      {
        accessorKey: "last_name",
        header: "Last Name",
        size: 120,
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
          const value = cell.getValue() as string | null;
          return value || "-";
        },
      },
      {
        accessorKey: "phone",
        header: "Phone Number",
        size: 150,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
          const value = cell.getValue() as string | null;
          return value || "-";
        },
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 100,
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
          const value = cell.getValue() as boolean;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                value
                  ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                  : "bg-error-50 text-error-700 dark:bg-error-500/20 dark:text-error-400"
              }`}
            >
              {value ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        accessorKey: "is_approved",
        header: "Approval",
        size: 100,
        Cell: ({ cell }: { cell: MRT_Cell<User, unknown> }) => {
          const value = cell.getValue() as boolean;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                value
                  ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                  : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
              }`}
            >
              {value ? "Approved" : "Pending"}
            </span>
          );
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
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

    // Required fields check
    const requiredFields: (keyof NewUserForm)[] = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "role",
      "region",
    ];

    // Add mnpData to required fields only if role is trainer or financier
    if (showMnpField) {
      requiredFields.push("mnpData");
    }

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = `${field.replace("_", " ")} is required`;
      }
    }

    // Email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone format (basic)
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Additional validation for admin users
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
    const payload: sendInvitationRequest = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      region: formData.region,
      role: [formData.role], // Change from 'roles' to 'role'
    };

    // Only include mnpData if role is trainer or financier
    if (showMnpField) {
      payload.mnpData = formData.mnpData;
    }

    await sendInvitationApi(payload);
    toast.success("User invitation sent successfully");
    handleCloseModal();
    fetchUsers();
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
        title="T-store - User Management Dashboard"
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
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <CommonTable
          columns={columns}
          data={users}
          loading={loading}
          pagination={pagination}
          enableRowSelection={false}
          onPaginationChange={setPagination}
          toolbarActions={toolbarActions}
        />
      </div>

      {/* Right Side Modal for Adding User - Only accessible by super_admin or admin */}
      {canAddUsers && (
        <RightSideModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          showCloseButton={true}
          width="w-3/4 md:w-1/2 lg:w-2/5"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
              Add New User
            </h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (123) 456-7890"
                    className="w-full"
                    error={!!errors.phone}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Role Select - Shows different options based on user role */}
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

                {/* MNP Select - Only shown for trainer and financier roles */}
                {showMnpField && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      MNP Admin User <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {isSuperAdmin
                          ? "(Select any Admin user to map)"
                          : isAdmin && mnpList.length === 1
                            ? "(You will be the MNP Admin - auto-selected)"
                            : "(Select yourself as MNP Admin)"}
                      </span>
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
                          : "Your admin account is not active or approved"}
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

export default AdminUser;
