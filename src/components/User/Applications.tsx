import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import { toast } from "react-toastify";
import { CheckIcon, XCircle } from "lucide-react";
import { getApplicationsApi, updateApplicationStatusApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { CloseIcon, PencilIcon } from "../../icons";
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
  assigned_financier_details?: string;
  documents?: Array<{
    document_type: string;
    file: string;
  }>;
  user?: number;
}

const Applications = () => {
  const navigate = useNavigate();
  const userRole = getUserRole("admin");

  const statusOptions = [
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "Under Review" },
    { value: "assigned", label: "Assigned" },
    { value: "training", label: "Training" },
    { value: "production", label: "Production" },
    { value: "rejected", label: "Rejected" },
  ];

  const paymentStatusOptions = [
    { value: "pending", label: "Pending" },
    { value: "cleared", label: "Cleared" },
  ];

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // State for inline payment status editing
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<{
    rowId: number;
    currentValue: string;
  } | null>(null);

  // Check if user can edit payment status
  const canEditPaymentStatus = useMemo(() => {
    return userRole === "super_admin" || userRole === "admin" || userRole === "financier";
  }, [userRole]);

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

  const handleUpdatePaymentStatus = async (rowId: number, newStatus: string) => {
    try {
      setLoading(true);
      const response = await updateApplicationStatusApi(rowId, {
        payment_status: newStatus,
      });

      if (response) {
        toast.success("Payment status updated successfully");
        // Update local state
        setApplications(prevApps =>
          prevApps.map(app =>
            app.id === rowId ? { ...app, payment_status: newStatus } : app
          )
        );
        setEditingPaymentStatus(null);
      }
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to update payment status");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = useCallback((row: Application) => {
     updateApplicationStatusApi(row.id, {
      status: "under_review"
     })
    navigate(`/applications/edit/${row.id}`);
  }, [navigate]);

  const handleRejected = useCallback((row: Application) => {
     updateApplicationStatusApi(row.id, {
      status: "rejected"
     })
       setApplications(prevApps =>
          prevApps.map(app =>
            app.id === row.id ? { ...app, status: "rejected" } : app
          )
        );
    toast.success("Application rejected successfully!")
  }, [])

  const rowActionsList = useMemo(() => {
    const actions = [];

    actions.push({
      label: "Edit",
      className: "text-brand-700 hover:text-brand-900 dark:text-brand-600",
      icon: <PencilIcon className="w-4 h-4 fill-current" />,
      onClick: handleEdit,
    });
    actions.push({
      label: "Rejected",
      className: "text-red-700 hover:text-red-900 dark:text-red-600",
      icon: <XCircle className="w-4 h-4 fill-currect" />,
      onClick: handleRejected,
    })
    return actions;
  }, [handleEdit, handleRejected]);

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
        accessorFn: (row) => row?.payment_status ?? "pending",
        id: "payment_status",
        header: "Payment Status",
        size: 150,
        Cell: ({ row }) => {
          const paymentStatus = row.original.payment_status;
          const isEditing = editingPaymentStatus?.rowId === row.original.id;

          // If currently editing this row
          if (isEditing && canEditPaymentStatus) {
            return (
              <div className="flex items-center gap-2">
                <select
                  value={editingPaymentStatus.currentValue}
                  onChange={(e) => 
                    setEditingPaymentStatus({
                      rowId: row.original.id,
                      currentValue: e.target.value,
                    })
                  }
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  autoFocus
                >
                  {paymentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => 
                    handleUpdatePaymentStatus(row.original.id, editingPaymentStatus.currentValue)
                  }
                  className="p-1 text-success-600 hover:text-success-700 dark:text-success-400"
                  title="Save"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingPaymentStatus(null)}
                  className="p-1 text-error-600 hover:text-error-700 dark:text-error-400"
                  title="Cancel"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            );
          }

          // Display mode
          const match = paymentStatusOptions.find(
            (option) => option.value === paymentStatus
          );
          
          return (
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  paymentStatus === "cleared"
                    ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                    : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
                }`}
              >
                {match?.label ?? paymentStatus}
              </span>
              
              {/* Edit button for payment status - only shown to authorized roles */}
              {canEditPaymentStatus && (
                <button
                  onClick={() => 
                    setEditingPaymentStatus({
                      rowId: row.original.id,
                      currentValue: paymentStatus,
                    })
                  }
                  className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  title="Edit payment status"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        },
        filterVariant: "select",
        filterSelectOptions: paymentStatusOptions.map((item) => ({
          text: item.label,
          value: item.value,
        })),
      },
    ],
    [pagination.pageIndex, pagination.pageSize, editingPaymentStatus, canEditPaymentStatus],
  );

  return (
    <div className="p-3">
      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Applications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View and manage all CM/CCM applications
        </p>
        {!loading && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Total Applications: <span className="font-semibold">{totalCount}</span>
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