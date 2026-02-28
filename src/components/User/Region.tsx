import React, { useState, useEffect, useMemo } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import { toast } from "react-toastify";
import PageMeta from "../common/PageMeta";
import useMuiTheme from "../mui/muiTheme";
import { createRegionsApi, getAllRegionsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { ThemeProvider } from "@mui/material/styles"; // ✅ FIXED
import CommonTable from "../mui/MuiTable";
import { RightSideModal } from "../mui/RightSideModal";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { getUserRole } from "../../config/constants";

interface Region {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface NewRegionForm {
  name: string;
}

const Region = () => {
  const muiTheme = useMuiTheme();
  const userRole = getUserRole();

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<NewRegionForm>({
    name: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof NewRegionForm, string>>
  >({});

  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => {
    if (!isAddModalOpen) {
      setFormData({ name: "" });
      setErrors({});
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await getAllRegionsApi();
      const regionData = response?.data || response || [];
      setRegions(regionData?.results || []);
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        "Failed to fetch regions",
      );
      toast.error(errorMessage);
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await createRegionsApi(formData);
      toast.success("Region created successfully");
      handleCloseModal();
      fetchRegions();
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        "Failed to create region",
      );
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<Region>[]>(
    () => [
      {
        accessorKey: "id",
        header: "S.No",
        size: 80,
        Cell: ({ row }) => row.index + 1,
        enableColumnFilter: false,
      },
      {
        accessorKey: "name",
        header: "Region Name",
        size: 200,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ?? "-";
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
  );

  const handleAddRegion = () => setIsAddModalOpen(true);
  const handleCloseModal = () => setIsAddModalOpen(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewRegionForm, string>> = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Region name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toolbarActions = [
    ...(isSuperAdmin
      ? [
          {
            label: "Add Region",
            onClick: handleAddRegion,
          },
        ]
      : []),
    {
      label: "Refresh",
      onClick: fetchRegions,
    },
  ];

  return (
    <div className="p-3">
      <PageMeta
        title="T-store - Region Management"
        description="Manage and view all regions in the system"
      />

      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Region Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and create regions in the system"
            : "View all regions in the system"}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <ThemeProvider theme={muiTheme}>
          <CommonTable
            columns={columns}
            data={regions}
            loading={loading}
            pagination={pagination}
            enableRowSelection={false}
            onPaginationChange={setPagination}
            toolbarActions={toolbarActions}
          />
        </ThemeProvider>
      </div>

      {isSuperAdmin && (
        <RightSideModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          showCloseButton
          width="w-3/4 md:w-1/2 lg:w-2/5"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
              Add New Region
            </h2>

            <form onSubmit={handleCreateRegion} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region Name{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter region name"
                    className="w-full"
                    error={!!errors.name}
                  />

                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

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
                  {submitting ? "Creating..." : "Create Region"}
                </Button>
              </div>
            </form>
          </div>
        </RightSideModal>
      )}
    </div>
  );
};

export default Region;