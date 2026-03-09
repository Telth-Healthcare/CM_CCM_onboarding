import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import { toast } from "react-toastify";
import { getApplicationsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { EyeIcon, PencilIcon } from "../../icons";
import CommonTable from "../mui/MuiTable";
import { getUserRole } from "../../config/constants";
import ViewEditApplication from "./ViewEditApplication";
import ViewUserApplication from "./ViewUserApplication";

interface Application {
  assigned_incubator: null | number | string;
  assigned_trainer: null | number | string;
  created_at: string;
  id: number;
  private_notes: string;
  public_notes: string;
  reference_number: string;
  payment_status: string;
  shg: number;
  status: string;
  updated_at: string;
  user_details?: string;
  trainer_details?: string;
  documents?: Array<{
    document_type: string;
    file: string;
  }>;
  user?: number;
}

const Applications = () => {
  const statusOptions = [
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "Under Review" },
    { value: "assigned", label: "Assigned" },
    { value: "training", label: "Training" },
    { value: "production", label: "Production" },
    { value: "rejected", label: "Rejected" },
  ];

  const userRole = getUserRole("admin");

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewApplication, setViewApplication] = useState<{
    id: number;
    data: Application | null;
  } | null>(null);
  const [editApplication, setEditApplication] = useState<{
    id: number;
    data: Application | null;
  } | null>(null);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setColumnFilters([]);
    try {
      setLoading(true);
      const response = await getApplicationsApi();
      setApplications(
        Array.isArray(response.results)
          ? response?.results
          : [response.results],
      );
      setTotalCount(response?.count || 0);
    } catch (err) {
      const errorMessage = handleAxiosError(
        err,
        "Failed to fetch applications",
      );
      toast.error(errorMessage);
      setApplications([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = useCallback(async (row: Application) => {
    try {
      setViewApplication({
        id: row.id,
        data: row,
      });
      setIsViewModalOpen(true);
    } catch (err) {
      const errorMessage = handleAxiosError(
        err,
        "Failed to fetch application details",
      );
      toast.error(errorMessage);
    }
  }, []);

  const handleEdit = useCallback(async (row: Application) => {
    try {
      setEditApplication({
        id: row.id,
        data: row,
      });
      setIsEditModalOpen(true);
    } catch (err) {
      const errorMessage = handleAxiosError(
        err,
        "Failed to fetch application details",
      );
      toast.error(errorMessage);
    }
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewApplication(null);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditApplication(null);
  }, []);

  const handleUpdate = useCallback(() => {
    fetchApplications();
  }, []);

  const isAdminOrSuperAdmin =
    userRole === "admin" || userRole === "super_admin";

  const rowActionsList = useMemo(() => {
    const actions = [];

    actions.push({
      label: "View",
      className: "text-brand-700 hover:text-brand-900 dark:text-brand-600",
      icon: <EyeIcon className="w-4 h-4 fill-current" />,
      onClick: handleView,
    });

    if (isAdminOrSuperAdmin) {
      actions.push({
        label: "Edit",
        className: "text-brand-700 hover:text-brand-900 dark:text-brand-600",
        icon: <PencilIcon className="w-4 h-4 fill-current" />,
        onClick: handleEdit,
      });
    }

    return actions;
  }, [handleEdit, handleView, isAdminOrSuperAdmin]);

  const columns = useMemo<MRT_ColumnDef<Application>[]>(
    () => [
      {
        accessorKey: "id",
        header: "S.No",
        size: 80,
        Cell: ({ row }) => row.index + 1,
        enableColumnFilter: false,
      },
      {
        accessorKey: "user_details",
        header: "Name",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | number | null>();
          return value ?? "-";
        },
        filterVariant: "text",
        enableColumnFilter: true,
      },
      {
        accessorKey: "reference_number",
        header: "Reference No.",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ?? "-";
        },
        filterVariant: "text",
        enableColumnFilter: true,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        accessorFn: (row) => row.status ?? "",
        Cell: ({ cell }) => {
          const status = cell.getValue<string>() ?? "";
          const match = statusOptions.find((option) => option.value === status);
          return match?.label ?? status ?? "-";
        },
        filterVariant: "select",
        filterSelectOptions: statusOptions.map((item) => ({
          text: item.label,
          value: item.value,
        })),
        enableColumnFilter: true,
      },
      {
        accessorKey: "trainer_details",
        header: "Trainer",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | number | null>();
          return value ?? "-";
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
        // filterVariant: "text",
        enableColumnFilter: false,
      },
      {
        accessorKey: "financier_details",
        header: "Financier",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | number | null>();
          return value ?? "-";
        },
      },
      {
        accessorKey: "payment_status",
        header: "Payment Status",
        size: 120,
        accessorFn: (row) => row.payment_status ? "pending" : "cleared",
        Cell: ({ cell }) => {
          const status = cell.getValue<string>() ?? "";
          return status ?? "-";
        },
        filterVariant: "select",
        filterSelectOptions: [
          { text: "Pending", value: "pending" },
          { text: "Cleared", value: "cleared" },
        ],
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
  );

  return (
    <div className="p-3">
      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Applications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View and manage all SHG applications
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
            data={applications}
            loading={loading}
            pagination={pagination}
            enableRowSelection={false}
            onPaginationChange={setPagination}
            toolbarActions={[{ label: "Refresh", onClick: fetchApplications }]}
            rowActions={rowActionsList}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
          />
      </div>

      {viewApplication && (
        <ViewUserApplication
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          applicationId={viewApplication.id}
          applicationData={viewApplication.data}
        />
      )}

      {editApplication && (
        <ViewEditApplication
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          applicationId={editApplication.id}
          applicationData={editApplication.data}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default Applications;
