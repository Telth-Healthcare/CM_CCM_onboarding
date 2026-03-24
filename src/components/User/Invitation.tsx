import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  MRT_Cell,
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import PageMeta from "../common/PageMeta";
import { contactApi, getInvitationApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import CommonTable from "../mui/MuiTable";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Invitation {
  accepted: boolean;
  email: string;
  expires_at: string;
  first_name: string;
  is_sent: boolean;
  last_name: string;
  manager: number;
  phone: string;
  region: number;
  roles: string[];
}

interface OptionType {
  value: string;
  label: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const InvitationPage = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );
  const [roles, setRoles] = useState<OptionType[]>([]);

  useEffect(() => {
    fetchRoleInfo();
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setColumnFilters([]);
    try {
      setLoading(true);
      const response = await getInvitationApi();
      const data = response?.data || response || [];
      setInvitations(data?.results || []);
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to fetch invitations"));
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleInfo = async () => {
    try {
      const response = await contactApi();

      // Filter out super_admin from roles
      const filteredRoles = (response.roles || []).filter(
        (role: OptionType) =>
          role.value !== "super_admin" &&
          role.value !== "cm" &&
          role.value !== "ccm",
      );

      setRoles(filteredRoles);
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch roles");
      toast.error(errorMessage);
    }
  };

  const columns = useMemo<MRT_ColumnDef<Invitation>[]>(
    () => [
      {
        accessorKey: "id",
        header: "S.No",
        size: 70,
        enableColumnFilter: false,
        Cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: "first_name",
        header: "First Name",
        size: 140,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "last_name",
        header: "Last Name",
        size: 140,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 220,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "phone",
        header: "Phone",
        size: 160,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
        {
        accessorKey: "region_name",
        header: "Region",
        size: 160,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "roles",
        header: "Role",
        size: 150,
        accessorFn: (row) => row.roles?.[0] || "",
        Cell: ({ cell }: { cell: MRT_Cell<Invitation, unknown> }) => {
          const row = cell.row.original;
          const roles = row.roles;
          if (!roles || roles.length === 0) return "-";
          return roles[0];
        },
        filterVariant: "select",
        filterSelectOptions: roles.map((role) => ({
          text: role.label,
          value: role.value,
        })),
        enableColumnFilter: true,
      },
      {
        accessorKey: "is_sent",
        header: "Sent",
        size: 100,
        enableColumnFilter: false,
        Cell: ({ cell }) =>
          cell.getValue<boolean>() ? (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              Yes
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              No
            </span>
          ),
      },
      {
        accessorKey: "accepted",
        header: "Accepted",
        size: 110,
        enableColumnFilter: false,
        Cell: ({ cell }) =>
          cell.getValue<boolean>() ? (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Yes
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              No
            </span>
          ),
      },
      {
        accessorKey: "expires_at",
        header: "Expires At",
        size: 180,
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const val = cell.getValue<string>();
          return val ? new Date(val).toLocaleDateString() : "-";
        },
      },
    ],
    [],
  );

  const toolbarActions = [{ label: "Refresh", onClick: fetchInvitations }];

  return (
    <div className="p-3">
      <PageMeta
        title="Telth Partner Console"
        description="Manage and view all invitations in the system"
      />

      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Invitations
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <CommonTable
          columns={columns}
          data={invitations}
          loading={loading}
          pagination={pagination}
          enableColumnFilters={true}
          enableRowSelection={false}
          onPaginationChange={setPagination}
          toolbarActions={toolbarActions}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      </div>
    </div>
  );
};

export default InvitationPage;
