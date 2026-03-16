import  { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import PageMeta from "../common/PageMeta";
import { getAllContactApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import CommonTable from "../mui/MuiTable";
import { getUserRole } from "../../config/constants";

interface Contact {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  city?: string;
  organisation?: string;
  organisationType?: string;
  description?: string;
  created_at?: string;
}

const Contact = () => {
  const userRole = getUserRole("admin");
  const [contacts, setContacts] = useState<Contact[]>([]);
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
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setColumnFilters([])
    try {
      setLoading(true);

      const response = await getAllContactApi();

      if (response?.results) {
        setContacts(response?.results);
        setTotalCount(response?.count || 0);
      } else {
        setContacts([]);
        setTotalCount(0);
      }
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch contacts");
      toast.error(errorMessage);
      setContacts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<Contact>[]>(
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
        size: 250,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value || "-";
        },
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value || "-";
        },
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "phone",
        header: "Phone",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value || "-";
        },
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "city",
        header: "City",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value || "-";
        },
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "organization",
        header: "Organization",
        size: 200,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value || "-";
        },
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: "organization_type",
        header: "Organization Type",
        size: 180,
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
        size: 300,
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
      onClick: fetchContacts,
    },
  ];

  return (
    <div className="p-3">
      <PageMeta
        title="Telth Partner Console"
        description="Manage and view all contact enquiries in the system"
      />

      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Contact Enquiries
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and view all contact form submissions"
            : "View all contact enquiries"}
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
          data={contacts}
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

export default Contact;
