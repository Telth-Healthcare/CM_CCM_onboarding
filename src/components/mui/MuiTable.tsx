import {
  MaterialReactTable,
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_RowData,
} from "material-react-table";
import { MRT_Localization_EN } from "material-react-table/locales/en";
import { useTheme } from "../../context/ThemeContext";
import type { OnChangeFn } from "@tanstack/react-table";

interface TableAction {
  label: string;
  className?: string;
  icon?: React.ReactNode;
  onClick: (row: any) => void;
}

interface ToolbarAction {
  label: string;
  onClick: () => void;
}

interface CommonTableProps<T extends MRT_RowData> {
  columns: MRT_ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination: MRT_PaginationState;
  totalCount?: number;
  onPaginationChange: OnChangeFn<MRT_PaginationState>;
  toolbarActions?: ToolbarAction[];
  rowActions?: TableAction[];
  enableRowSelection?: boolean;
  enablePinning?: boolean;
  enableEditing?: boolean;
  enableRowActions?: boolean;
  maxHeight?: string | number;
  enableColumnFilters?: boolean;
  enableColumnFilterModes?: boolean;
  columnFilters?: MRT_ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<MRT_ColumnFiltersState>;
}

const CommonTable = <T extends MRT_RowData>({
  columns,
  data,
  loading = false,
  pagination,
  totalCount,
  onPaginationChange,
  toolbarActions = [],
  rowActions = [],
  enableRowSelection = true,
  enableColumnFilters = true,
  enableColumnFilterModes = false,
  enablePinning = true,
  maxHeight,
  columnFilters,
  onColumnFiltersChange,
}: CommonTableProps<T>) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <div className="h-full w-full overflow-hidden">
      <MaterialReactTable
        columns={columns}
        data={data}
        state={{
          isLoading: loading,
          pagination,
          showSkeletons: loading,
          columnFilters: columnFilters ?? [],
        }}
        manualPagination={true}
        rowCount={totalCount ?? 0}
        enablePagination={false}
        onPaginationChange={onPaginationChange}
        enableColumnFilterModes={enableColumnFilterModes}
        enableColumnFilters={!enableColumnFilterModes && enableColumnFilters}
        enablePinning={enablePinning}
        enableRowActions={rowActions.length > 0}
        enableRowSelection={enableRowSelection}
        positionToolbarAlertBanner="bottom"
        enableFullScreenToggle={false}
        localization={MRT_Localization_EN}
        onColumnFiltersChange={onColumnFiltersChange}
        initialState={{
          columnPinning: { left: ["mrt-row-actions"] },
          showColumnFilters: enableColumnFilters,
        }}
        defaultColumn={{
          minSize: 150,
          size: 200,
          enableColumnFilter: enableColumnFilters,
        }}
        muiTablePaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            overflow: "hidden",
            boxShadow: "none",
            borderRadius: 0,
          },
        }}
        muiTableContainerProps={{
          sx: {
            flex: 1,
            overflowX: "auto",
            overflowY: "scroll",
            minHeight: 0,
            maxHeight: maxHeight,
            "&::-webkit-scrollbar": { width: "8px", height: "8px" },
            "&::-webkit-scrollbar-track": {
              backgroundColor: isDarkMode ? "#1D2939" : "#F2F4F7",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDarkMode ? "#344054" : "#98A2B3",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: isDarkMode ? "#475467" : "#667085",
              },
            },
            scrollbarWidth: "thin",
            scrollbarColor: isDarkMode ? "#344054 #1D2939" : "#98A2B3 #F2F4F7",
          },
        }}
        muiTableProps={{
          sx: {
            minWidth: "max-content",
            width: "max-content",
            tableLayout: "fixed",
          },
        }}
        muiTableHeadCellProps={{
          sx: {
            fontWeight: 600,
            fontSize: "12px",
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: isDarkMode ? "#1D2939" : "#F9FAFB",
          },
        }}
        muiTableBodyCellProps={{
          sx: {
            color: isDarkMode ? "#ffffff" : "#101828",
            whiteSpace: "nowrap",
          },
        }}
        renderTopToolbarCustomActions={() => (
          <div className="flex gap-3">
            {toolbarActions.map((action, index) => (
              <button
                key={index}
                className="btn-button"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        renderRowActions={
          rowActions.length > 0
            ? ({ row }) => (
                <div className="flex gap-3">
                  {rowActions.map((action, index) => (
                    <button
                      key={index}
                      className={`${action.className} flex items-center justify-center transition-colors`}
                      onClick={() => action.onClick(row.original)}
                      title={action.label}
                    >
                      {action.icon || action.label}
                    </button>
                  ))}
                </div>
              )
            : undefined
        }
      />
    </div>
  );
};

export default CommonTable;