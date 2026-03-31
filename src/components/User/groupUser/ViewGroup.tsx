import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import { getUserRole } from "../../../config/constants";
import { getGroupApi, createGroupApi, updateGroupApi, deleteGroupApi } from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import CommonTable from "../../mui/MuiTable";
import PageMeta from "../../common/PageMeta";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { RightSideModal } from "../../mui/RightSideModal";
import Button from "../../ui/button/Button";
import { getRoleUsers } from "../../../api";

interface StudentData {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;

}

interface Group {
  id: number;
  name: string;
  student_data?: StudentData[];  // Changed from students to student_data
  permissions?: any[];
  created_at?: string;
  updated_at?: string;
}

interface NewGroupForm {
  name: string;
  students: number[];
}

interface Student {
  id: number;
  name: string;
  email?: string;
  first_name?: string;
  last_name?: string
}

const ViewGroup = () => {
  const userRole = getUserRole("admin");

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [formData, setFormData] = useState<NewGroupForm>({
    name: "",
    students: [],
  });

  // Student selection states
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [studentError, setStudentError] = useState("");

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    [],
  );

  const [errors, setErrors] = useState<
    Partial<Record<keyof NewGroupForm, string>>
  >({});

  const isSuperAdmin = userRole === "super_admin";
  const userRoleData = userRole === "trainer" || userRole === "admin";

  // Reset form when modal closes
  useEffect(() => {
    if (!isAddModalOpen && !isEditModalOpen) {
      setFormData({ name: "", students: [] });
      setSelectedStudents([]);
      setStudentError("");
      setErrors({});
      setEditingGroup(null);
    }
  }, [isAddModalOpen, isEditModalOpen]);

  // In the useEffect where you load edit data
  useEffect(() => {
    if (editingGroup && isEditModalOpen) {
      setFormData({
        name: editingGroup.name,
        students: editingGroup.student_data?.map(s => s.id) || [],
      });
      setSelectedStudents(editingGroup.student_data?.map(s => s.id) || []);

      setAvailableStudents(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const missing = (editingGroup.student_data || []).filter(
          s => !existingIds.has(s.id)
        );
        return [...prev, ...missing]; // merges without duplicates
      });
    }
  }, [editingGroup, isEditModalOpen]);

  useEffect(() => {
    fetchGroups();
    // if (isSuperAdmin) {
      fetchStudents();
    // }
  }, [isSuperAdmin]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await getGroupApi();
      const groupData = response?.data || response || [];
      setGroups(groupData?.results || []);
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch groups");
      toast.error(errorMessage);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await getRoleUsers(["ccm"]); // You'll need to implement this
      const studentsData = response?.data || response || [];
      setAvailableStudents(studentsData?.results || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  // ── Student helpers ─────────────────────────────────────────────────────
  const addStudent = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setStudentError("Student already added");
      return;
    }
    setSelectedStudents((prev) => [...prev, studentId]);
    setStudentError("");
  };

  const handleDeleteGroup = (group: Group) => {
    setDeletingGroup(group);   // store which group to delete
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingGroup) return;
    try {
      await deleteGroupApi(deletingGroup.id);
      toast.success("Group deleted successfully");
      fetchGroups();
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to delete group");
      toast.error(errorMessage);
    } finally {
      setDeleteModalOpen(false);  // close modal either way
      setDeletingGroup(null);
    }
  };

  const removeStudent = (studentId: number) => {
    setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = parseInt(e.target.value);
    if (studentId) {
      addStudent(studentId);
      // Reset select to default
      e.target.value = "";
    }
  };
  // ── Form submit ─────────────────────────────────────────────────────────
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await createGroupApi({
        name: formData.name,
        students: selectedStudents,  // Array of student IDs
      });
      toast.success("Group created successfully");
      handleCloseModal();
      fetchGroups();
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to create group");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingGroup) return;

    try {
      setSubmitting(true);
      await updateGroupApi(editingGroup.id, {
        name: formData.name,
        students: selectedStudents,
      });
      toast.success("Group updated successfully");
      handleCloseModal();
      fetchGroups();
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to update group");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewGroupForm, string>> = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Group name is required";
    }
    // Students are optional, so no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const columns = useMemo<MRT_ColumnDef<Group>[]>(
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
        header: "Group Name",
        size: 200,
        Cell: ({ cell }) => cell.getValue<string>() ?? "-",
      },
        {
        accessorKey: "course_name",
        header: "Course",
        size: 200,
        Cell: ({ cell }) => cell.getValue<string>() ?? "-",
      },
      {
        accessorKey: "student_data",
        header: "Students",
        size: 300,
        Cell: ({ cell }) => {
          const value = cell.getValue<StudentData[]>();
          if (!value || value.length === 0) return "-";
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((student) => (
                <span
                  key={student.id}
                  className="inline-flex items-center px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs"
                >
                  {student.name}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Created Date",
        size: 150,
        Cell: ({ cell }) => {
          const v = cell.getValue<string>();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
  );

  const handleAddGroup = () => setIsAddModalOpen(true);
  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const toolbarActions = [
    ...(isSuperAdmin || userRoleData
      ? [{ label: "Add Group", onClick: handleAddGroup }]
      : []),
    { label: "Refresh", onClick: fetchGroups },
  ];

  const rowActions = [
    {
      label: "Edit",
      icon: <PencilIcon className="w-4 h-4 text-green-500" />,
      onClick: (row: Group) => handleEditGroup(row),
    },
    {
      label: "Delete",
      icon: <Trash2Icon className="w-4 h-4 text-red-500" />,
      onClick: (row: Group) => handleDeleteGroup(row),
    },
  ];

  return (
    <div className="p-3">
      <PageMeta
        title="Telth Partner Console"
        description="Manage and view all groups in the system"
      />

      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Group Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Manage and create groups in the system"
            : "View all groups in the system"}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <CommonTable
          columns={columns}
          data={groups}
          loading={loading}
          pagination={pagination}
          enableColumnFilters={true}
          enableRowSelection={false}
          onPaginationChange={setPagination}
          toolbarActions={toolbarActions}
          rowActions={isSuperAdmin ? rowActions : []}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      </div>

      {/* Add/Edit Group Modal */}
      {((isSuperAdmin || userRoleData) && (isAddModalOpen || isEditModalOpen)) && (
        <RightSideModal
          isOpen={isAddModalOpen || isEditModalOpen}
          onClose={handleCloseModal}
          showCloseButton
          width=""
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
              {isEditModalOpen ? "Edit Group" : "Add New Group"}
            </h2>

            <form onSubmit={isEditModalOpen ? handleUpdateGroup : handleCreateGroup} noValidate>
              <div className="space-y-5">
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter group name"
                    className={`w-full px-3 py-2 text-sm border ${errors.name
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Students Selection (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Students <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>

                  {/* Student search and dropdown */}
                  <div className="flex gap-2 items-start mb-3">
                    <div className="flex-1">
                      <select
                        onChange={handleStudentSelect}
                        value=""
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select a student to add...</option>
                        {availableStudents
                          .filter((student) => !selectedStudents.includes(student.id)) // ← key fix
                          .map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name || `${student.first_name} ${student.last_name}`} {student.email ? `(${student.email})` : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Selected students tags */}
                  <div
                    className={`flex flex-wrap gap-2 items-center min-h-[60px] p-3 border ${studentError
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                      } rounded-lg bg-white dark:bg-gray-800`}
                  >
                    {selectedStudents.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        No students selected
                      </p>
                    ) : (
                      selectedStudents.map((studentId) => {
                        const fromAvailable = availableStudents.find((s) => s.id === studentId);
                        const fromEditData = editingGroup?.student_data?.find((s) => s.id === studentId);
                        const student = fromAvailable || fromEditData;
                        return (
                          <span
                            key={studentId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium"
                          >
                            {student?.name ||
                              (student?.first_name ? `${student.first_name} ${student.last_name}` : `Student ${studentId}`)}                            <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeStudent(studentId);
                                }}
                                className="leading-none opacity-60 hover:opacity-100 text-base ml-1"
                                title="Remove"
                              >
                              ×
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  {studentError && (
                    <p className="mt-1 text-xs text-red-500">{studentError}</p>
                  )}

                  {/* Count hint */}
                  {selectedStudents.length > 0 && (
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                      {selectedStudents.length} student
                      {selectedStudents.length > 1 ? "s" : ""} selected
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
                  {submitting
                    ? (isEditModalOpen ? "Updating..." : "Creating...")
                    : (isEditModalOpen ? "Update Group" : "Create Group")}
                </Button>
              </div>

            </form>
           
          </div>
        </RightSideModal>
        
      )}
         {/* Delete Confirmation Modal */}
              {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">

                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
                      <Trash2Icon className="w-6 h-6 text-red-500" />
                    </div>

                    {/* Text */}
                    <h3 className="text-center text-lg font-semibold text-gray-800 dark:text-white mb-1">
                      Delete Group
                    </h3>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Are you sure you want to delete{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        "{deletingGroup?.name}"
                      </span>
                      ? This action cannot be undone.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setDeleteModalOpen(false)}  // cancel
                        className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={confirmDelete}
                        className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </Button>
                    </div>

                  </div>
                </div>
              )}
    </div>
  );
};

export default ViewGroup;