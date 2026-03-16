import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import { toast } from "react-toastify";
import { getApplicationsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { PencilIcon } from "../../icons";
import CommonTable from "../mui/MuiTable";

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
  assigned_financier_details?: string;
  documents?: Array<{
    document_type: string;
    file: string;
  }>;
  user?: number;
}

const Applications = () => {
  const navigate = useNavigate();

  const statusOptions = [
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "Under Review" },
    { value: "assigned", label: "Assigned" },
    { value: "training", label: "Training" },
    { value: "production", label: "Production" },
    { value: "rejected", label: "Rejected" },
  ];

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
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
        "Failed to fetch applications"
      );
      toast.error(errorMessage);
      setApplications([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = useCallback((row: Application) => {
    navigate(`/applications/view/${row.id}`);
  }, [navigate]);

  const handleEdit = useCallback((row: Application) => {
    navigate(`/applications/edit/${row.id}`);
  }, [navigate]);

  const rowActionsList = useMemo(() => {
    const actions = [];

      actions.push({
        label: "Edit",
        className: "text-brand-700 hover:text-brand-900 dark:text-brand-600",
        icon: <PencilIcon className="w-4 h-4 fill-current" />,
        onClick: handleEdit,
      });

    return actions;
  }, [handleEdit, handleView]);

  const columns = useMemo<MRT_ColumnDef<Application>[]>(
    () => [
      {
        accessorFn: (row) => row?.reference_number ?? "-",
        id: "reference_number",
        header: "Reference No.",
        size: 120,
        enableColumnFilter: false,
      },
      {
        accessorFn: (row) => row?.user_details ?? "-",
        id: "user_details",
        header: "Name",
        size: 150,
        filterVariant: "text",
      },
      {
        accessorFn: (row) => row?.status ?? "",
        id: "status",
        header: "Status",
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          const match = statusOptions.find((s) => s.value === status);
          return match?.label ?? status ?? "-";
        },
        filterVariant: "select",
        filterSelectOptions: statusOptions.map((item) => ({
          text: item.label,
          value: item.value,
        })),
      },
      {
        accessorFn: (row) => row?.trainer_details ?? "-",
        id: "trainer_details",
        header: "Trainer",
        size: 120,
        filterVariant: "text",
      },
      {
        accessorFn: (row) =>
          row?.created_at
            ? new Date(row.created_at).toLocaleDateString()
            : "-",
        id: "created_at",
        header: "Created Date",
        size: 150,
        enableColumnFilter: false,
      },
      {
        accessorFn: (row) => row?.assigned_financier_details ?? "-",
        id: "assigned_financier_details",
        header: "Financier",
        size: 150,
      },
      {
        accessorFn: (row) =>
          row?.payment_status === "pending" ? "pending" : "cleared",
        id: "payment_status",
        header: "Payment Status",
        size: 120,
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
    </div>
  );
};

export default Applications;