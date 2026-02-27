import React, { useState, useEffect, useMemo } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import { toast } from "react-toastify";
import PageMeta from "../common/PageMeta";
import useMuiTheme from "../mui/muiTheme";
import { getAllUsers, sendInvitationApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { ThemeProvider } from "../../context/ThemeContext";
import CommonTable from "../mui/MuiTable";
import { RightSideModal } from "../mui/RightSideModal";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

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
  role: string; // single selected role, will be sent as [role]
}

// Available roles
const ROLES = ["admin", "trainer", "incubator"];

const AdminUser = () => {
  const muiTheme = useMuiTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<NewUserForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "trainer", 
  });

  // Field-specific error messages
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewUserForm, string>>
  >({});

  // Reset form and errors when modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "trainer", 
      });
      setErrors({});
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response?.data || response || []);
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
        Cell: ({ row }) =>
          row.index + 1 ,
        enableColumnFilter: false,
      },
      {
        accessorKey: "first_name",
        header: "First Name",
        size: 120,
        Cell: ({ cell }) => cell.getValue() || "-",
      },
      {
        accessorKey: "last_name",
        header: "Last Name",
        size: 120,
        Cell: ({ cell }) => cell.getValue() || "-",
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
        Cell: ({ cell }) => cell.getValue() || "-",
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 100,
        Cell: ({ cell }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              cell.getValue()
                ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                : "bg-error-50 text-error-700 dark:bg-error-500/20 dark:text-error-400"
            }`}
          >
            {cell.getValue() ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        accessorKey: "is_approved",
        header: "Approval",
        size: 100,
        Cell: ({ cell }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              cell.getValue()
                ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
            }`}
          >
            {cell.getValue() ? "Approved" : "Pending"}
          </span>
        ),
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
    ];
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        roles: [formData.role],
      };
      delete payload.role;

      await sendInvitationApi([payload]);
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

  return (
    <div className="p-3">
      <PageMeta
        title=" T-store - User Management Dashboard"
        description="This is React.js SignUp Tables Dashboard page for T-store - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          User Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage and view all users in the system
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <ThemeProvider theme={muiTheme}>
          <CommonTable
            columns={columns}
            data={users}
            loading={loading}
            pagination={pagination}
            enableRowSelection={false}
            onPaginationChange={setPagination}
            toolbarActions={[
              { label: "Add User", onClick: handleAddUser },
              { label: "Refresh", onClick: fetchUsers },
            ]}
          />
        </ThemeProvider>
      </div>

      {/* Right Side Modal for Adding User */}
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
                  placeholder="Enter your first name"
                  required
                  className="w-full"
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
                  placeholder="Enter your last name"
                  required
                  className="w-full"
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
                  placeholder="Enter your email address"
                  required
                  className="w-full"
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
                  required
                  className="w-full"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.role}
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                // type="cancel"
                onClick={handleCloseModal}
                className="text-black bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                // type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                {submitting ? (
                  <>
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </form>
        </div>
      </RightSideModal>
    </div>
  );
};

export default AdminUser;
