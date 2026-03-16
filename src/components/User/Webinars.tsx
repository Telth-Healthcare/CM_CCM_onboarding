import  { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import PageMeta from "../common/PageMeta";
import { getAllWebinarsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import CommonTable from "../mui/MuiTable";
import { getUserRole } from "../../config/constants";

interface Webinar {
  id: number;
  email: string;
  description?: string;
}

const Webinars = () => {
  const userRole = getUserRole("admin");
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );

  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => {
    fetchWebinars();
  }, []);

  const fetchWebinars = async () => {
        setColumnFilters([]);
    try {
      setLoading(true);
      const response = await getAllWebinarsApi();

      // Handle different response structures
      if (response?.results) {
        setWebinars(response.results);
        setTotalCount(response.count || 0);
      } else {
        setWebinars([]);
        setTotalCount(0);
      }
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch webinars");
      toast.error(errorMessage);
      setWebinars([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<Webinar>[]>(
    () => [
      {
        accessorKey: "id",
        header: "S.No",
        size: 80,
        Cell: ({ row }) =>
          pagination.pageIndex * pagination.pageSize + row.index + 1,
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 300,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value || "-";
        },
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "description",
        header: "Message",
        size: 500,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value || "-";
        },
        enableColumnFilter: true,
        enableSorting: false,
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
  );

  const toolbarActions = [
    {
      label: "Refresh",
      onClick: fetchWebinars,
      icon: (
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
        description="Manage and view all Webinars in the system"
      />

      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Webinars Demo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and create webinar registrations"
            : "View all webinar registrations"}
        </p>
        {!loading && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Total Registrations:{" "}
            <span className="font-semibold">{totalCount}</span>
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <CommonTable
          columns={columns}
          data={webinars}
          loading={loading}
          pagination={pagination}
          enableColumnFilters={true}
          enableRowSelection={false}
          onPaginationChange={setPagination}
          onColumnFiltersChange={setColumnFilters}
          toolbarActions={toolbarActions}
          columnFilters={columnFilters}
        />
      </div>
    </div>
  );
};

export default Webinars;
