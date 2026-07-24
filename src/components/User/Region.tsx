import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import PageMeta from "../common/PageMeta";
import {
  createRegionsApi,
  deleteRegionApi,
  getAllRegionsApi,
  patchAllRegionsApi,
} from "../../api";
import CommonTable from "../mui/MuiTable";
import { RightSideModal } from "../mui/RightSideModal";
import Button from "../ui/button/Button";
import { getUserRole } from "../../config/constants";
import { Trash2 } from "lucide-react";
import RowActionDropdown, { RowAction } from "../mui/RowActionDropdown";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Region {
  id: number;
  name: string;
  pincodes: { code: string }[]; // added — was missing, caused cast hack
  created_at?: string;
  updated_at?: string;
}

interface NewRegionForm {
  name: string;
  pincodes: { code: string }[];
}

interface PincodeError {
  code: string;
  errors: string[];
}

// ─── Error Handler (your original, untouched) ─────────────────────────────────

const handleRegionError = (error: unknown): void => {
  if (!axios.isAxiosError(error)) {
    toast.error("Something went wrong. Please try again.");
    return;
  }

  const data = error.response?.data;

  if (Array.isArray(data) && data.length > 0) {
    const duplicateCodes: string[] = [];
    const otherErrors: string[] = [];

    data.forEach((item: PincodeError) => {
      const errorMsg = item?.errors?.[0] ?? "Unknown error";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists");

      if (isDuplicate) {
        duplicateCodes.push(item.code);
      } else {
        otherErrors.push(`Pincode ${item.code}: ${errorMsg}`);
      }
    });

    // Show one grouped toast for all duplicates
    if (duplicateCodes.length > 0) {
      const preview = duplicateCodes.slice(0, 5).join(", ");
      const extra =
        duplicateCodes.length > 5 ? ` +${duplicateCodes.length - 5} more` : "";
      toast.error(
        `${duplicateCodes.length} pincode(s) already exist: ${preview}${extra}. Please remove them and try again.`,
        { toastId: "duplicate-pincodes" },
      );
    }

    // Show individual toasts for other errors
    otherErrors.forEach((msg) => {
      toast.error(msg, { toastId: msg });
    });

    return;
  }

  // Handle { message: "..." } or { detail: "..." } or { error: "..." }
  if (data && typeof data === "object") {
    const msg =
      (data as Record<string, string>).message ||
      (data as Record<string, string>).detail ||
      (data as Record<string, string>).error;
    if (msg) {
      toast.error(msg);
      return;
    }
  }

  toast.error(error.message || "Something went wrong. Please try again.");
};

// ─── Component ────────────────────────────────────────────────────────────────

const Region = () => {
  const userRole = getUserRole("admin");

  // ── Table state ─────────────────────────────────────────────────────────────
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );

  // ── View modal state (your original) ────────────────────────────────────────
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewPincodes, setViewPincodes] = useState<string[]>([]);
  const [viewRegionName, setViewRegionName] = useState("");

  // ── Add modal state (your original) ─────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncUser, setSyncUser] = useState(true);
  const [formData, setFormData] = useState<NewRegionForm>({
    name: "",
    pincodes: [],
  });
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [pincodeError, setPincodeError] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewRegionForm, string>>
  >({});

  // ── Edit modal state ─────────────────────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRegionId, setEditRegionId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "" });
  const [editPincodes, setEditPincodes] = useState<string[]>([]);
  const [editPincodeInput, setEditPincodeInput] = useState("");
  const [editPincodeError, setEditPincodeError] = useState("");
  const [editErrors, setEditErrors] = useState<{
    name?: string;
    pincodes?: string;
  }>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteRegion, setDeleteRegion] = useState<Region | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const isSuperAdmin = userRole === "super_admin";

  // ─── Effects ──────────────────────────────────────────────────────────────────

  // Reset add modal when closed (your original)
  useEffect(() => {
    if (!isAddModalOpen) {
      setFormData({ name: "", pincodes: [] });
      setPincodes([]);
      setPincodeInput("");
      setPincodeError("");
      setErrors({});
      setSyncUser(true);
    }
  }, [isAddModalOpen]);

  // Reset edit modal when closed
  useEffect(() => {
    if (!isEditModalOpen) {
      setEditFormData({ name: "" });
      setEditPincodes([]);
      setEditPincodeInput("");
      setEditPincodeError("");
      setEditErrors({});
      setEditRegionId(null);
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    setColumnFilters([]);
    try {
      setLoading(true);
      const response = await getAllRegionsApi();
      const regionData = response?.data || response || [];
      setRegions(regionData?.results || []);
    } catch (error) {
      handleRegionError(error);
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const pincodesPayload = pincodes.map((code) => ({ code }));
      await createRegionsApi({
        name: formData.name,
        pincodes: pincodesPayload,
        sync_users: syncUser,
      });
      toast.success("Region created successfully");
      handleCloseModal();
      fetchRegions();
    } catch (error) {
      // Modal stays open so user can fix errors
      handleRegionError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; pincodes?: string } = {};
    if (!editFormData.name.trim()) newErrors.name = "Region name is required";
    if (editPincodes.length === 0)
      newErrors.pincodes = "At least one pincode is required";
    setEditErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setEditSubmitting(true);
      await patchAllRegionsApi(editRegionId!, {
        name: editFormData.name,
        pincodes: editPincodes.map((code) => ({ code })),
      });
      toast.success("Region updated successfully");
      setIsEditModalOpen(false);
      fetchRegions();
    } catch (error) {
      handleRegionError(error);
    } finally {
      setEditSubmitting(false);
    }
  };

  const parseCSV = (text: string): string[] => {
    const seen = new Set<string>();
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const cells = line
        .split(",")
        .map((col) => col.trim().replace(/^["'\s]+|["'\s]+$/g, ""));

      for (const cell of cells) {
        const matches = cell.match(/\d{6}/g);
        if (matches) {
          for (const m of matches) {
            seen.add(m);
          }
        }
      }
    }

    return [...seen];
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const extractedPincodes = parseCSV(text);

        if (extractedPincodes.length === 0) {
          toast.warning("No valid pincodes found in CSV file");
          return;
        }

        const validPincodes = extractedPincodes.filter((pin) =>
          /^\d{6}$/.test(pin),
        );
        const invalidPincodes = extractedPincodes.filter(
          (pin) => !/^\d{6}$/.test(pin),
        );

        if (invalidPincodes.length > 0) {
          toast.warning(`${invalidPincodes.length} invalid pincodes skipped`);
        }

        const duplicates = validPincodes.filter((pin) =>
          pincodes.includes(pin),
        );
        const newPincodes = validPincodes.filter(
          (pin) => !pincodes.includes(pin),
        );

        if (duplicates.length > 0) {
          toast.warning(
            `${duplicates.length} duplicate pincode(s) skipped: ${duplicates.slice(0, 5).join(", ")}${duplicates.length > 5 ? ` +${duplicates.length - 5} more` : ""}`,
          );
        }

        if (newPincodes.length === 0) {
          toast.error("All pincodes in this CSV already exist. Nothing added.");
          event.target.value = "";
          return;
        }

        setPincodes((prev) => [...prev, ...newPincodes]);
        toast.success(
          `Added ${newPincodes.length} pincodes from CSV. Total: ${pincodes.length + newPincodes.length}`,
        );

        event.target.value = "";
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error(error);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read CSV file");
    };

    reader.readAsText(file);
  };

  const handleEditCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const extractedPincodes = parseCSV(text); // reuse same parser

        if (extractedPincodes.length === 0) {
          toast.warning("No valid pincodes found in CSV file");
          return;
        }

        const validPincodes = extractedPincodes.filter((pin) =>
          /^\d{6}$/.test(pin),
        );
        const invalidPincodes = extractedPincodes.filter(
          (pin) => !/^\d{6}$/.test(pin),
        );

        if (invalidPincodes.length > 0) {
          toast.warning(`${invalidPincodes.length} invalid pincodes skipped`);
        }

        const duplicates = validPincodes.filter((pin) =>
          editPincodes.includes(pin),
        ); // check against edit list
        const newPincodes = validPincodes.filter(
          (pin) => !editPincodes.includes(pin),
        );

        if (duplicates.length > 0) {
          toast.warning(
            `${duplicates.length} duplicate pincode(s) skipped: ${duplicates.slice(0, 5).join(", ")}${duplicates.length > 5 ? ` +${duplicates.length - 5} more` : ""}`,
          );
        }

        if (newPincodes.length === 0) {
          toast.error("All pincodes in this CSV already exist. Nothing added.");
          event.target.value = "";
          return;
        }

        setEditPincodes((prev) => [...prev, ...newPincodes]); // merge into edit list
        toast.success(
          `Added ${newPincodes.length} pincodes from CSV. Total: ${editPincodes.length + newPincodes.length}`,
        );

        event.target.value = "";
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error(error);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read CSV file");
    };

    reader.readAsText(file);
  };

  const handleDeleteRegion = (row: Region) => {
    setDeleteRegion(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteRegion) return;
    try {
      setDeleteSubmitting(true);
      await deleteRegionApi(deleteRegion.id);
      toast.success("Region deleted successfully");
      setIsDeleteModalOpen(false);
      setDeleteRegion(null);
      fetchRegions();
    } catch (error) {
      handleRegionError(error);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const addPincode = () => {
    const val = pincodeInput.trim();
    if (!val) return;

    if (!/^\d{6}$/.test(val)) {
      setPincodeError("Pincode must be exactly 6 digits");
      return;
    }
    if (pincodes.includes(val)) {
      setPincodeError("Pincode already added");
      return;
    }
    setPincodes((prev) => [...prev, val]);
    setPincodeInput("");
    setPincodeError("");
  };

  const removePin = (pin: string) => {
    setPincodes((prev) => prev.filter((p) => p !== pin));
  };

  const handlePincodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPincode();
    }
    if (e.key === "Backspace" && pincodeInput === "" && pincodes.length > 0) {
      removePin(pincodes[pincodes.length - 1]);
    }
  };

  const addEditPincode = () => {
    const val = editPincodeInput.trim();
    if (!val) return;

    if (!/^\d{6}$/.test(val)) {
      setEditPincodeError("Pincode must be exactly 6 digits");
      return;
    }
    if (editPincodes.includes(val)) {
      setEditPincodeError("Pincode already added");
      return;
    }
    setEditPincodes((prev) => [...prev, val]);
    setEditPincodeInput("");
    setEditPincodeError("");
  };

  const handleEditPincodeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEditPincode();
    }
    if (
      e.key === "Backspace" &&
      editPincodeInput === "" &&
      editPincodes.length > 0
    ) {
      setEditPincodes((prev) => prev.slice(0, -1));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewRegionForm, string>> = {};
    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Region name is required";
    }
    if (pincodes.length === 0) {
      newErrors.pincodes = "At least one pincode is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleViewPincodes = (
    regionName: string,
    pincodes: { code: string }[],
  ) => {
    setViewRegionName(regionName);
    setViewPincodes(pincodes.map((p) => p.code));
    setIsViewModalOpen(true);
  };

  const handleEditRegion = (row: Region) => {
    setEditRegionId(row.id); // real DB id → used in PATCH URL
    setEditFormData({ name: row.name });
    setEditPincodes(row.pincodes.map((p) => p.code)); // pre-fill existing pincodes
    setIsEditModalOpen(true);
  };

  const handleAddRegion = () => setIsAddModalOpen(true);
  const handleCloseModal = () => setIsAddModalOpen(false);

  // ─── Columns ──────────────────────────────────────────────────────────────────

  const columns = useMemo<MRT_ColumnDef<Region>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Actions",
        size: 80,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const rowActions: RowAction[] = [
            {
              label: "Edit",
              onClick: () => handleEditRegion(row.original),
            },
            {
              label: "Delete",
              onClick: () => handleDeleteRegion(row.original),
            },
          ];
          return <RowActionDropdown actions={rowActions} />;
        },
      },
      {
        accessorKey: "name",
        header: "Region Name",
        size: 200,
        Cell: ({ cell }) => cell.getValue<string>() ?? "-",
      },
      {
        accessorKey: "pincodes",
        header: "Pincode",
        size: 200,
        Cell: ({ cell, row }) => {
          const value = cell.getValue<{ code: string }[]>();
          if (!value || value.length === 0) return "-";

          const displayText = value
            .slice(0, 3)
            .map((p) => p.code)
            .join(", ");
          const remainingCount = value.length - 3;

          return (
            <div className="flex items-center gap-2">
              <span className="truncate">
                {displayText}
                {remainingCount > 0 && ` +${remainingCount} more`}
              </span>
              <button
                onClick={() => handleViewPincodes(row.original.name, value)}
                className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
              >
                View All
              </button>
            </div>
          );
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
  );

  const toolbarActions = [
    ...(isSuperAdmin
      ? [{ label: "Add Region", onClick: handleAddRegion }]
      : []),
    { label: "Refresh", onClick: fetchRegions },
  ];

  // ─── Shared CSV Upload Button UI ──────────────────────────────────────────────

  const CSVUploadButton = ({
    onChange,
  }: {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
      Upload CSV File
      <input type="file" accept=".csv" onChange={onChange} className="hidden" />
    </label>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-3">
      <PageMeta
        title="Telth Partner Console"
        description="Manage and view all regions in the system"
      />

      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Region Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and create regions in the system"
            : "View all regions in the system"}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <CommonTable
          columns={columns}
          data={regions}
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

      {/* ── View Pincodes Modal (your original, untouched) ── */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        showCloseButton
        width="500px"
      >
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pincodes - {viewRegionName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Pincodes:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {viewPincodes.length}
              </span>
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pincode
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {viewPincodes.map((pincode, index) => (
                    <tr
                      key={pincode}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">
                        {pincode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setIsViewModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* ── Add Region Modal (your original UI, untouched) ── */}
      {isSuperAdmin && (
        <RightSideModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          showCloseButton
          width="600px"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
              Add New Region
            </h2>

            <form onSubmit={handleCreateRegion} noValidate>
              <div className="space-y-5">
                {/* Region Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter region name"
                    className={`w-full px-3 py-2 text-sm border ${
                      errors.name
                        ? "border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Pincode section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>

                  <div className="flex flex-col gap-2">
                    {/* Row: Sync checkbox + CSV upload */}
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncUser}
                          onChange={() => setSyncUser((prev) => !prev)}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sync User Default
                        </span>
                      </label>
                      <CSVUploadButton onChange={handleCSVUpload} />
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Supports CSV format. Duplicates are removed automatically.
                    </p>

                    {/* Tag box */}
                    <div
                      className={`w-full border ${
                        errors.pincodes
                          ? "border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-lg bg-white dark:bg-gray-800`}
                    >
                      {pincodes.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5 p-2 max-h-[200px] overflow-y-auto">
                          {pincodes.map((pin) => (
                            <span
                              key={pin}
                              className="inline-flex items-center justify-between gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                            >
                              <span className="font-mono">{pin}</span>
                              <button
                                type="button"
                                onClick={() => removePin(pin)}
                                className="leading-none opacity-60 hover:opacity-100 text-base ml-1 flex-shrink-0"
                                title="Remove"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className="flex items-center px-2 py-1.5 cursor-text border-t border-gray-200 dark:border-gray-700"
                        onClick={() =>
                          document.getElementById("pincode-input")?.focus()
                        }
                      >
                        <input
                          id="pincode-input"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={pincodeInput}
                          onChange={(e) => {
                            setPincodeInput(e.target.value.replace(/\D/g, "")); // digits only
                            setPincodeError("");
                            setErrors((prev) => ({
                              ...prev,
                              pincode: undefined,
                            }));
                          }}
                          onKeyDown={handlePincodeKeyDown}
                          placeholder="Enter 6-digit pincode…"
                          className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={addPincode}
                          disabled={!pincodeInput.trim()}
                          className="ml-2 px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {pincodeError && (
                    <p className="mt-1 text-xs text-red-500">{pincodeError}</p>
                  )}
                  {errors.pincodes && !pincodeError && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.pincodes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex justify-end gap-3">
                <Button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Region"}
                </Button>
              </div>
            </form>
          </div>
        </RightSideModal>
      )}

      {/* ── Edit Region Modal (same UI as Add, pre-filled) ── */}
      {isSuperAdmin && (
        <RightSideModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          showCloseButton
          width="600px"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
              Edit Region
            </h2>

            <form onSubmit={handleUpdateRegion} noValidate>
              <div className="space-y-5">
                {/* Region Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => {
                      setEditFormData({ name: e.target.value });
                      setEditErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Enter region name"
                    className={`w-full px-3 py-2 text-sm border ${
                      editErrors.name
                        ? "border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400`}
                  />
                  {editErrors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {editErrors.name}
                    </p>
                  )}
                </div>

                {/* Pincode section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>

                  <div className="flex flex-col gap-2">
                    {/* CSV upload — right aligned, no sync checkbox in edit */}
                    <div className="flex items-center justify-end">
                      <CSVUploadButton onChange={handleEditCSVUpload} />
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Supports CSV format. Duplicates are removed automatically.
                    </p>

                    {/* Tag box with pre-filled + removable pincodes */}
                    <div
                      className={`w-full border ${
                        editErrors.pincodes
                          ? "border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-lg bg-white dark:bg-gray-800`}
                    >
                      {editPincodes.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5 p-2 max-h-[200px] overflow-y-auto">
                          {editPincodes.map((pin) => (
                            <span
                              key={pin}
                              className="inline-flex items-center justify-between gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                            >
                              <span className="font-mono">{pin}</span>
                              <button
                                type="button"
                                onClick={
                                  () =>
                                    setEditPincodes((prev) =>
                                      prev.filter((p) => p !== pin),
                                    ) // remove individual pin
                                }
                                className="leading-none opacity-60 hover:opacity-100 text-base ml-1 flex-shrink-0"
                                title="Remove"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className="flex items-center px-2 py-1.5 cursor-text border-t border-gray-200 dark:border-gray-700"
                        onClick={() =>
                          document.getElementById("edit-pincode-input")?.focus()
                        }
                      >
                        <input
                          id="edit-pincode-input"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={editPincodeInput}
                          onChange={(e) => {
                            setEditPincodeInput(
                              e.target.value.replace(/\D/g, ""),
                            ); // digits only
                            setEditPincodeError("");
                          }}
                          onKeyDown={handleEditPincodeKeyDown}
                          placeholder="Enter 6-digit pincode…"
                          className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={addEditPincode}
                          disabled={!editPincodeInput.trim()}
                          className="ml-2 px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {editPincodeError && (
                    <p className="mt-1 text-xs text-red-500">
                      {editPincodeError}
                    </p>
                  )}
                  {editErrors.pincodes && !editPincodeError && (
                    <p className="mt-1 text-xs text-red-500">
                      {editErrors.pincodes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex justify-end gap-3">
                <Button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  disabled={editSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editSubmitting ? "Updating..." : "Update Region"}
                </Button>
              </div>
            </form>
          </div>
        </RightSideModal>
      )}

      {/* ── Delete Confirm Modal ── */}
      <RightSideModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        showCloseButton
        width="420px"
      >
        <div className="p-6 flex flex-col gap-6">
          {/* Icon + message */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Delete Region
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800 dark:text-white">
                {deleteRegion?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  );
};

export default Region;
