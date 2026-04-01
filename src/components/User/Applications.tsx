import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import { getApplicationsApi, updateApplicationStatusApi } from "../../api";
import { PencilIcon } from "../../icons";
import CommonTable from "../mui/MuiTable";
import { getUserRole } from "../../config/constants";

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
  financier_details?: string;
  documents?: Array<{ document_type: string; file: string }>;
  user?: number;
}

const statusOptions = [
  { value: "submitted",    label: "Submitted"    },
  { value: "under_review", label: "Under Review" },
  { value: "assigned",     label: "Assigned"     },
  { value: "training",     label: "Training"     },
  { value: "production",   label: "Production"   },
  { value: "rejected",     label: "Rejected"     },
];

const Applications = () => {
  const navigate  = useNavigate();
  const userRole  = getUserRole("admin") ?? "";

  const [applications,   setApplications]   = useState<Application[]>([]);
  const [loading,        setLoading]         = useState(true);
  const [totalCount,     setTotalCount]      = useState(0);
  const [nextUrl,        setNextUrl]         = useState<string | null>(null);
  const [prevUrl,        setPrevUrl]         = useState<string | null>(null);
  const [columnFilters,  setColumnFilters]   = useState<MRT_ColumnFiltersState>([]);
  const [pagination,     setPagination]      = useState({ pageIndex: 0, pageSize: 10 });

  const canEditPaymentStatus = useMemo(() =>
    ["super_admin", "admin", "financier"].includes(userRole),
  [userRole]);

  const fetchApplications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      // Only sending the page number
      const response = await getApplicationsApi({ page });
      setApplications(Array.isArray(response.results) ? response.results : []);
      setTotalCount(response?.count    || 0);
      setNextUrl(response?.next        || null);
      setPrevUrl(response?.previous    || null);
    } catch (_) {
      setApplications([]);
      setTotalCount(0);
      setNextUrl(null);
      setPrevUrl(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications(pagination.pageIndex + 1);
  }, [pagination.pageIndex, pagination.pageSize, fetchApplications]);

  const handleNext = () => {
    if (!nextUrl || loading) return;
    const newIndex = pagination.pageIndex + 1;
    setPagination((prev) => ({ ...prev, pageIndex: newIndex }));
  };

  const handlePrev = () => {
    if (!prevUrl || loading) return;
    const newIndex = pagination.pageIndex - 1;
    setPagination((prev) => ({ ...prev, pageIndex: newIndex }));
  };

  const handleRefresh = useCallback(() => {
    // Reset to first page and fetch data
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    fetchApplications(1);
  }, [fetchApplications]);

  const handleEdit = useCallback((row: Application) => {
    if (["super_admin", "admin"].includes(userRole) && row.status === "submitted") {
      updateApplicationStatusApi(row.id, { status: "under_review" });
    }
    navigate(`/applications/edit/${row.id}`);
  }, [navigate, userRole]);

  const rowActionsList = useMemo(() => {
    const allActions = [
      {
        label: "Edit",
        roles: ["super_admin", "admin", "financier", "trainer"],
        className: "text-blue-700 hover:text-blue-900 dark:text-blue-600",
        icon: <PencilIcon className="w-4 h-4" />,
        onClick: handleEdit,
      },
    ];
    return allActions.filter((a) => a.roles.includes(userRole));
  }, [handleEdit, userRole]);

  const columns = useMemo<MRT_ColumnDef<Application>[]>(() => [
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
        return statusOptions.find((s) => s.value === status)?.label ?? status ?? "-";
      },
      filterVariant: "select",
      filterSelectOptions: statusOptions.map((s) => ({ text: s.label, value: s.value })),
    },
    {
      accessorFn: (row) => row?.financier_details ?? "-",
      id: "financier_details",
      header: "Financier",
      size: 150,
    },
    {
      accessorFn: (row) => row?.payment_status ?? "pending",
      id: "payment_status",
      header: "Payment Status",
      size: 150,
      Cell: ({ cell }) => {
        const status = cell.getValue<string>() ?? "pending";
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            status === "cleared"
              ? "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400"
              : status === "failed"
                ? "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                : "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
          }`}>
            {status}
          </span>
        );
      },
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
        row?.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
      id: "created_at",
      header: "Created Date",
      size: 150,
      enableColumnFilter: false,
    },
  ], [canEditPaymentStatus]);

  // Calculate display info
  const pageIndex    = pagination.pageIndex;

  return (
    <div className="p-3">
      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Applications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View and manage all CM/CCM applications
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <CommonTable
          columns={columns}
          data={applications}
          loading={loading}
          pagination={pagination}
          totalCount={totalCount}
          enableRowSelection={false}
          onPaginationChange={setPagination}
          toolbarActions={[{
            label: "Refresh",
            onClick: handleRefresh, // Use the new refresh handler
          }]}
          rowActions={rowActionsList}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />

        {/* Custom Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!prevUrl || loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page <span className="font-semibold">{pageIndex + 1}</span>
            </span>
            <button
              onClick={handleNext}
              disabled={!nextUrl || loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Applications;