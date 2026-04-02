import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import PageMeta from "../common/PageMeta";
import { createRegionsApi, getAllRegionsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import CommonTable from "../mui/MuiTable";
import { RightSideModal } from "../mui/RightSideModal";
import Button from "../ui/button/Button";
import { getUserRole } from "../../config/constants";

interface Region {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface NewRegionForm {
  name: string;
  pincodes: { code: string }[];
}

const Region = () => {
  const userRole = getUserRole("admin");

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<NewRegionForm>({
    name: "",
    pincodes: [],
  });

  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [pincodeError, setPincodeError] = useState("");

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );

  const [errors, setErrors] = useState<
    Partial<Record<keyof NewRegionForm, string>>
  >({});

  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => {
    if (!isAddModalOpen) {
      setFormData({ name: "", pincodes: [] });
      setPincodes([]);
      setPincodeInput("");
      setPincodeError("");
      setErrors({});
    }
  }, [isAddModalOpen]);

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
      const errorMessage = handleAxiosError(error, "Failed to fetch regions");
      toast.error(errorMessage);
      setRegions([]);
    } finally {
      setLoading(false);
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

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await createRegionsApi({
        name: formData.name,
        pincodes: pincodes.map((code) => ({ code })),
      });
      toast.success("Region created successfully");
      handleCloseModal();
      fetchRegions();
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to create region");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
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

  const columns = useMemo<MRT_ColumnDef<Region>[]>(
    () => [
      {
        accessorKey: "id",
        header: "S.No",
        size: 80,
        Cell: ({ row }) => row.index + 1,
        enableColumnFilter: false,
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
        Cell: ({ cell }) => {
          const value = cell.getValue<{ code: string }[]>();
          if (!value || value.length === 0) return "-";
          return value.map((p) => p.code).join(", ");
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
  );

  const handleAddRegion = () => setIsAddModalOpen(true);
  const handleCloseModal = () => setIsAddModalOpen(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const toolbarActions = [
    ...(isSuperAdmin
      ? [{ label: "Add Region", onClick: handleAddRegion }]
      : []),
    { label: "Refresh", onClick: fetchRegions },
  ];

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

      {isSuperAdmin && (
        <RightSideModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          showCloseButton
          width="400px"
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

                {/* Pincode Tag Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>

                  <div className="flex flex-col gap-2">
                    {/* Tag box */}
                    <div
                      className={`w-full border ${
                        errors.pincodes
                          ? "border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-lg bg-white dark:bg-gray-800`}
                    >
                      {/* ✅ 2-column grid of pincode tags */}
                      {pincodes.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 p-2 max-h-[150px] overflow-y-auto">
                          {pincodes.map((pin) => (
                            <span
                              key={pin}
                              className="inline-flex items-center justify-between gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                            >
                              {pin}
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

                      {/* Input row */}
                      <div
                        className="flex items-center px-2 py-1.5 cursor-text"
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
                            setPincodeInput(e.target.value.replace(/\D/g, ""));
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
                      </div>
                    </div>

                    {/* ✅ Add button full width below */}
                    <button
                      type="button"
                      onClick={addPincode}
                      disabled={!pincodeInput.trim()}
                      className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Pincode
                    </button>
                  </div>

                  {/* Pincode validation error */}
                  {pincodeError && (
                    <p className="mt-1 text-xs text-red-500">{pincodeError}</p>
                  )}
                  {errors.pincodes && !pincodeError && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.pincodes}
                    </p>
                  )}

                  {/* Count hint */}
                  {pincodes.length > 0 && (
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                      {pincodes.length} pincode{pincodes.length > 1 ? "s" : ""}{" "}
                      added
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
    </div>
  );
};

export default Region;