// shared/components/mui/MuiTable.tsx
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_RowData,
} from "material-react-table";
import { MRT_Localization_EN } from "material-react-table/locales/en";
import { useTheme } from "../../context/ThemeContext";

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
  onPaginationChange: (pagination: MRT_PaginationState) => void;
  toolbarActions?: ToolbarAction[];
  rowActions?: TableAction[];
  enableRowSelection?: boolean;
  enableGrouping?: boolean;
  enablePinning?: boolean;
  maxHeight?: string | number;
}

const CommonTable = <T extends MRT_RowData>({
  columns,
  data,
  loading = false,
  pagination,
  onPaginationChange,
  toolbarActions = [],
  rowActions = [],
  enableRowSelection = true,
  enableGrouping = true,
  enablePinning = true,
  maxHeight,
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
        }}
        onPaginationChange={onPaginationChange}
        enableColumnFilterModes
        enableGrouping={enableGrouping}
        enablePinning={enablePinning}
        enableRowActions={rowActions.length > 0}
        enableRowSelection={enableRowSelection}
        positionToolbarAlertBanner="bottom"
        localization={MRT_Localization_EN}
        paginationDisplayMode="pages"
        initialState={{
          columnPinning: { left: ["mrt-row-actions"] },
        }}
        defaultColumn={{ minSize: 150, size: 200 }}
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
        // Fixed: always show vertical scrollbar track to maintain constant width
        muiTableContainerProps={{
          sx: {
            flex: 1,
            overflowX: "auto",        // horizontal scroll auto
            overflowY: "scroll",       // force vertical scrollbar track
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