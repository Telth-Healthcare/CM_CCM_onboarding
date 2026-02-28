import { useEffect, useState, useMemo, useCallback } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import { toast } from "react-toastify";
import { ThemeProvider } from "@mui/material/styles";
import ViewEditApplication from "./ViewEditApplication";
import { getApplicationsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { PencilIcon } from "../../icons";
import CommonTable from "../mui/MuiTable";
import { getUserRole } from "../../config/constants";
import useMuiTheme from "../mui/muiTheme";

interface Application {
  assigned_incubator: null | number | string;
  assigned_trainer: null | number | string;
  created_at: string;
  id: number;
  private_notes: string;
  public_notes: string;
  reference_number: string;
  shg: number;
  status: string;
  updated_at: string;
}

const Applications = () => {
  const muiTheme = useMuiTheme();

  const userRole = getUserRole() as string | null;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<{
    id: number;
    data: Application | null;
  } | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await getApplicationsApi();
      setApplications(Array.isArray(response) ? response : [response]);
    } catch (err) {
      const errorMessage = handleAxiosError(
        err,
        "Failed to fetch applications",
      );
      toast.error(errorMessage);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = useCallback(async (row: Application) => {
    try {
      setSelectedApplication({
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

  const handleCloseModal = useCallback(() => {
    setIsViewModalOpen(false);
    setSelectedApplication(null);
  }, []);

  const handleUpdate = useCallback(() => {
    fetchApplications();
  }, []);

  // ✅ FIX: role is string, not object
  const isAdminOrSuperAdmin =
    userRole === "admin" || userRole === "super_admin";

  const rowActionsList = useMemo(() => {
    if (isAdminOrSuperAdmin) {
      return [
        {
          label: "Edit",
          className:
            "text-brand-700 hover:text-brand-900 dark:text-brand-600",
          icon: <PencilIcon className="w-4 h-4 fill-current" />,
          onClick: handleEdit,
        },
      ];
    }
    return [];
  }, [handleEdit, isAdminOrSuperAdmin]);

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
        accessorKey: "reference_number",
        header: "Reference No.",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ?? "-";
        },
      },
      {
        accessorKey: "shg",
        header: "SHG",
        size: 100,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>() ?? "";

          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === "submitted"
                  ? "bg-info-50 text-info-700 dark:bg-info-500/20 dark:text-info-400"
                  : status === "approved"
                  ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                  : status === "rejected"
                  ? "bg-error-50 text-error-700 dark:bg-error-500/20 dark:text-error-400"
                  : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "assigned_trainer",
        header: "Trainer",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | number | null>();
          return value ?? "-";
        },
      },
      {
        accessorKey: "assigned_incubator",
        header: "Incubator",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | number | null>();
          return value ?? "-";
        },
      },
      {
        accessorKey: "created_at",
        header: "Created Date",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value
            ? new Date(value).toLocaleDateString()
            : "-";
        },
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
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <ThemeProvider theme={muiTheme}>
          <CommonTable
            columns={columns}
            data={applications}
            loading={loading}
            pagination={pagination}
            enableRowSelection={false}
            onPaginationChange={setPagination}
            toolbarActions={[
              { label: "Refresh", onClick: fetchApplications },
            ]}
            rowActions={rowActionsList}
          />
        </ThemeProvider>
      </div>

      {selectedApplication && (
        <ViewEditApplication
          isOpen={isViewModalOpen}
          onClose={handleCloseModal}
          applicationId={selectedApplication.id}
          applicationData={selectedApplication.data}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default Applications;