import { useEffect, useMemo, useReducer } from "react";
import { toast } from "react-toastify";
import {
  MRT_ColumnFiltersState,
  type MRT_ColumnDef,
} from "material-react-table";
import {
  getAllCourseApi,
  getEnrollApi,
  getRoleUsers,
  createCourseEnrollApi,
  createGroupEnrollApi,
  updateEnrollApi,
} from "../../../api";
import {
  PencilIcon,
  Users,
  User,
  Eye,
} from "lucide-react";
import PageMeta from "../../common/PageMeta";
import { RightSideModal } from "../../mui/RightSideModal";
import Button from "../../ui/button/Button";
import CommonTable from "../../mui/MuiTable";
import { getGroupApi } from "../../../api/group.api";
import ViewEnrollment from "./ViewEnrollment";
import type { EnrollmentDetail } from "./ViewEnrollment";
import { toastAxiosError } from "../../../utils/handleAxiosError";

interface Material {
  id: number;
  title: string;
  description: string;
  type: "lecture_notes" | "reference_material" | "assignment" | string;
  url: string | null;
  file: string | null;
  is_completed: boolean;
  uploaded_at: string;
  subject: number;
}

interface Subject {
  id: number;
  name: string;
  description: string;
  img: string | null;
  course: number;
  materials: Material[];
}

interface CourseDetails {
  id: number;
  name: string;
  description: string;
  img: string | null;
  aurthor: string;
  created_at: string;
  created_by: number;
  subjects: Subject[];
  is_completed: boolean;
}

interface Invitation {
  id: number;
  accepted: boolean;
  email: string;
  expires_at: string;
  first_name: string;
  is_sent: boolean;
  last_name: string;
  manager: number;
  phone: string;
  region: number;
  region_name: string;
  roles: string[];
  course: number;
  user: number;
  user_name?: string;
  group?: number;
  group_name?: string;
  course_details?: CourseDetails;
  enrollment_date?: string;
  is_completed?: boolean;
  application_id?: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Group {
  id: number;
  name: string;
  description?: string;
}

interface Course {
  id: number;
  title: string;
  name?: string;
}

interface EnrollPayload {
  user: number;
  course: number;
}

interface GroupEnrollPayload {
  group: number;
  course: number;
}

type EnrollmentMode = "user" | "group";

interface EnrollmentsState {
  invitations: Invitation[];
  loading: boolean;
  pagination: { pageIndex: number; pageSize: number };
  columnFilters: MRT_ColumnFiltersState;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedEnrollment: Invitation | null;
  viewingEnrollment: Invitation | null;
  enrollmentMode: EnrollmentMode;
  availableStudents: Student[];
  availableGroups: Group[];
  availableCourses: Course[];
  selectedStudents: Student[];
  selectedCourse: number | "";
  selectedGroup: number | "";
  submitting: boolean;
  errors: {
    course?: string;
    students?: string;
    group?: string;
  };
}

type EnrollmentsAction =
  | { type: "SET_INVITATIONS"; payload: Invitation[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PAGINATION"; payload: { pageIndex: number; pageSize: number } }
  | { type: "SET_COLUMN_FILTERS"; payload: MRT_ColumnFiltersState }
  | { type: "OPEN_ADD_MODAL" }
  | { type: "OPEN_EDIT_MODAL"; payload: Invitation }
  | { type: "OPEN_VIEW"; payload: Invitation }
  | { type: "CLOSE_VIEW" }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_ENROLLMENT_MODE"; payload: EnrollmentMode }
  | { type: "SET_AVAILABLE_STUDENTS"; payload: Student[] }
  | { type: "SET_AVAILABLE_GROUPS"; payload: Group[] }
  | { type: "SET_AVAILABLE_COURSES"; payload: Course[] }
  | { type: "ADD_STUDENT"; payload: Student }
  | { type: "REMOVE_STUDENT"; payload: number }
  | { type: "SET_SELECTED_COURSE"; payload: number | "" }
  | { type: "SET_SELECTED_GROUP"; payload: number | "" }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_ERRORS"; payload: Partial<EnrollmentsState["errors"]> }
  | { type: "RESET_FORM" };

const initialState: EnrollmentsState = {
  invitations: [],
  loading: true,
  pagination: { pageIndex: 0, pageSize: 10 },
  columnFilters: [],
  isAddModalOpen: false,
  isEditModalOpen: false,
  selectedEnrollment: null,
  viewingEnrollment: null,
  enrollmentMode: "user",
  availableStudents: [],
  availableGroups: [],
  availableCourses: [],
  selectedStudents: [],
  selectedCourse: "",
  selectedGroup: "",
  submitting: false,
  errors: {},
};

const enrollmentsReducer = (
  state: EnrollmentsState,
  action: EnrollmentsAction,
): EnrollmentsState => {
  switch (action.type) {
    case "SET_INVITATIONS":
      return { ...state, invitations: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_PAGINATION":
      return { ...state, pagination: action.payload };
    case "SET_COLUMN_FILTERS":
      return { ...state, columnFilters: action.payload };

    case "OPEN_ADD_MODAL":
      return {
        ...state,
        isAddModalOpen: true,
        isEditModalOpen: false,
        viewingEnrollment: null,
        selectedEnrollment: null,
        selectedStudents: [],
        selectedCourse: "",
        selectedGroup: "",
        errors: {},
      };

    case "OPEN_EDIT_MODAL":
      return {
        ...state,
        isEditModalOpen: true,
        isAddModalOpen: false,
        viewingEnrollment: null,
        selectedEnrollment: action.payload,
        selectedCourse: action.payload.course,
        selectedStudents: [],
        selectedGroup: "",
        errors: {},
      };

    case "OPEN_VIEW":
      return {
        ...state,
        viewingEnrollment: action.payload,
        isAddModalOpen: false,
        isEditModalOpen: false,
      };

    case "CLOSE_VIEW":
      return { ...state, viewingEnrollment: null };

    case "CLOSE_MODAL":
      return {
        ...state,
        isAddModalOpen: false,
        isEditModalOpen: false,
        selectedEnrollment: null,
        selectedStudents: [],
        selectedCourse: "",
        selectedGroup: "",
        errors: {},
        enrollmentMode: "user",
      };

    case "SET_ENROLLMENT_MODE":
      return {
        ...state,
        enrollmentMode: action.payload,
        selectedStudents: [],
        selectedGroup: "",
        errors: {},
      };

    case "SET_AVAILABLE_STUDENTS":
      return { ...state, availableStudents: action.payload };
    case "SET_AVAILABLE_GROUPS":
      return { ...state, availableGroups: action.payload };
    case "SET_AVAILABLE_COURSES":
      return { ...state, availableCourses: action.payload };

    case "ADD_STUDENT":
      if (!state.selectedStudents.some((s) => s.id === action.payload.id)) {
        return {
          ...state,
          selectedStudents: [...state.selectedStudents, action.payload],
        };
      }
      return state;

    case "REMOVE_STUDENT":
      return {
        ...state,
        selectedStudents: state.selectedStudents.filter(
          (s) => s.id !== action.payload,
        ),
      };

    case "SET_SELECTED_COURSE":
      return { ...state, selectedCourse: action.payload };
    case "SET_SELECTED_GROUP":
      return { ...state, selectedGroup: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: { ...state.errors, ...action.payload } };

    case "RESET_FORM":
      return {
        ...state,
        selectedStudents: [],
        selectedCourse: "",
        selectedGroup: "",
        errors: {},
        enrollmentMode: "user",
      };

    default:
      return state;
  }
};

const Enrollments = () => {
  const [state, dispatch] = useReducer(enrollmentsReducer, initialState);
  const {
    invitations,
    loading,
    pagination,
    columnFilters,
    isAddModalOpen,
    isEditModalOpen,
    selectedEnrollment,
    viewingEnrollment,
    enrollmentMode,
    availableStudents,
    availableGroups,
    availableCourses,
    selectedStudents,
    selectedCourse,
    selectedGroup,
    submitting,
    errors,
  } = state;

  useEffect(() => {
    fetchInvitations();
    fetchStudents();
    fetchGroups();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (isEditModalOpen && selectedEnrollment && availableStudents.length > 0) {
      const student = availableStudents.find(
        (s) => s.id === selectedEnrollment.user,
      );
      if (student) {
        dispatch({ type: "ADD_STUDENT", payload: student });
      } else if (selectedEnrollment.user_name || selectedEnrollment.email) {
        dispatch({
          type: "ADD_STUDENT",
          payload: {
            id: selectedEnrollment.user,
            name: selectedEnrollment.user_name || "",
            email: selectedEnrollment.email || "",
          },
        });
      }
    }
  }, [isEditModalOpen, selectedEnrollment, availableStudents]);

  const fetchInvitations = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await getEnrollApi();
      const data = response?.data || response || [];
      dispatch({
        type: "SET_INVITATIONS",
        payload: data?.results || data || [],
      });
    } catch (_) {
      dispatch({ type: "SET_INVITATIONS", payload: [] });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await getRoleUsers("roles__name__in", "ccm");
      const studentsData = response?.data || response || [];
      dispatch({
        type: "SET_AVAILABLE_STUDENTS",
        payload: studentsData?.results || studentsData || [],
      });
    } catch (error) {
      toastAxiosError(error, "Failed to fetch students"); // ✅
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await getGroupApi();
      const groupData = response?.data || response || [];
      dispatch({
        type: "SET_AVAILABLE_GROUPS",
        payload: groupData?.results || groupData || [],
      });
    } catch (_) {
      // silently ignore
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await getAllCourseApi();
      const coursesData = response?.data || response || [];
      dispatch({
        type: "SET_AVAILABLE_COURSES",
        payload: coursesData?.results || coursesData || [],
      });
    } catch (error) {
      toastAxiosError(error, "Failed to fetch courses"); // ✅
    }
  };

  const handleOpenAddModal = () => dispatch({ type: "OPEN_ADD_MODAL" });
  const handleOpenEditModal = (enrollment: Invitation) =>
    dispatch({ type: "OPEN_EDIT_MODAL", payload: enrollment });
  const handleCloseModal = () => dispatch({ type: "CLOSE_MODAL" });

  const handleOpenView = (enrollment: Invitation) =>
    dispatch({ type: "OPEN_VIEW", payload: enrollment });
  const handleCloseView = () => dispatch({ type: "CLOSE_VIEW" });

  const handleModeToggle = () => {
    const newMode = enrollmentMode === "user" ? "group" : "user";
    dispatch({ type: "SET_ENROLLMENT_MODE", payload: newMode });
  };

  const handleStudentSelect = (studentId: string) => {
    const id = parseInt(studentId);
    if (id) {
      const student = availableStudents.find((s) => s.id === id);
      if (student) dispatch({ type: "ADD_STUDENT", payload: student });
    }
  };

  const removeStudent = (studentId: number) =>
    dispatch({ type: "REMOVE_STUDENT", payload: studentId });

  const validateForm = () => {
    const newErrors: Partial<EnrollmentsState["errors"]> = {};
    if (!selectedCourse) newErrors.course = "Please select a course";
    if (enrollmentMode === "user") {
      if (selectedStudents.length === 0)
        newErrors.students = "Please select at least one student";
    } else {
      if (!selectedGroup) newErrors.group = "Please select a group";
    }
    dispatch({ type: "SET_ERRORS", payload: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateEnrollments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    dispatch({ type: "SET_SUBMITTING", payload: true });
    try {
      if (enrollmentMode === "user") {
        const payload: EnrollPayload[] = selectedStudents.map((student) => ({
          user: student.id,
          course: selectedCourse as number,
        }));
        await Promise.all(payload.map((p) => createCourseEnrollApi(p)));
        toast.success(
          `Successfully enrolled ${selectedStudents.length} student(s)`,
        );
      } else {
        const payload: GroupEnrollPayload = {
          group: selectedGroup as number,
          course: selectedCourse as number,
        };
        await createGroupEnrollApi(payload);
        toast.success("Successfully enrolled group");
      }
      handleCloseModal();
      fetchInvitations();
    } catch (error) {
      toastAxiosError(error, "Failed to create enrollments"); // ✅
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };

  const handleUpdateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedEnrollment) return;
    dispatch({ type: "SET_SUBMITTING", payload: true });
    try {
      const payload = {
        user: selectedStudents[0].id,
        course: selectedCourse as number,
      };
      await updateEnrollApi(selectedEnrollment.id, payload);
      toast.success("Enrollment updated successfully");
      handleCloseModal();
      fetchInvitations();
    } catch (error) {
      toastAxiosError(error, "Failed to update enrollment"); // ✅
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };

  const handlePaginationChange = (
    updater: React.SetStateAction<{ pageIndex: number; pageSize: number }>,
  ) => {
    const newPagination =
      typeof updater === "function" ? updater(pagination) : updater;
    dispatch({ type: "SET_PAGINATION", payload: newPagination });
  };

  const handleColumnFiltersChange = (
    updater: React.SetStateAction<MRT_ColumnFiltersState>,
  ) => {
    const newFilters =
      typeof updater === "function" ? updater(columnFilters) : updater;
    dispatch({ type: "SET_COLUMN_FILTERS", payload: newFilters });
  };

  const columns = useMemo<MRT_ColumnDef<Invitation>[]>(
    () => [
      {
        accessorKey: "course_details.name",
        header: "Course Name",
        size: 220,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
        enableColumnFilter: true,
      },
      {
        accessorKey: "user_name",
        header: "Student Name",
        size: 180,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
        enableColumnFilter: true,
      },
      {
        accessorKey: "enrollment_date",
        header: "Enrollment",
        size: 180,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? new Date(value).toLocaleDateString() : "-";
        },
      },
    ],
    [],
  );

  const toolbarActions = [
    { label: "Refresh", onClick: fetchInvitations },
    { label: "Add Enrollment", onClick: handleOpenAddModal },
  ];

  const rowActions = [
    {
      label: "View",
      icon: <Eye className="w-4 h-4 text-blue-500" />,
      onClick: (row: Invitation) => handleOpenView(row),
    },
    {
      label: "Edit",
      icon: <PencilIcon className="w-4 h-4 text-green-500" />,
      onClick: (row: Invitation) => handleOpenEditModal(row),
    },
  ];

  if (viewingEnrollment) {
    const enrollmentDetail: EnrollmentDetail = {
      id: viewingEnrollment.id,
      user_name: viewingEnrollment.user_name || "",
      user: viewingEnrollment.user,
      enrollment_date:
        viewingEnrollment.enrollment_date || new Date().toISOString(),
      course_details: {
        ...viewingEnrollment.course_details!,
        is_completed: viewingEnrollment.is_completed || false,
      },
      is_completed: viewingEnrollment.is_completed || false,
      application_id: viewingEnrollment.application_id,
    };

    return (
      <div className="p-3">
        <PageMeta
          title="Telth Partner Console"
          description="View enrollment details"
        />
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
          <ViewEnrollment
            enrollment={enrollmentDetail}
            onBack={handleCloseView}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <PageMeta
        title="Telth Partner Console"
        description="Manage and view all enrollments in the system"
      />

      <div className="mb-6">
        <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Course Enrollments
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
          onPaginationChange={handlePaginationChange}
          toolbarActions={toolbarActions}
          rowActions={rowActions}
          columnFilters={columnFilters}
          onColumnFiltersChange={handleColumnFiltersChange}
        />
      </div>

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={handleCloseModal}
        showCloseButton
        width="500px"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {isEditModalOpen ? "Edit Enrollment" : "Add New Enrollment"}
            </h2>
          </div>
          <div className="flex justify-between items-center mb-2">
            {!isEditModalOpen && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleModeToggle}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    enrollmentMode === "user"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  <User className="w-4 h-4" />
                  User
                </button>
                <button
                  type="button"
                  onClick={handleModeToggle}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    enrollmentMode === "group"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Group
                </button>
              </div>
            )}
          </div>
          <form
            onSubmit={
              isEditModalOpen ? handleUpdateEnrollment : handleCreateEnrollments
            }
            noValidate
          >
            <div className="space-y-5">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_SELECTED_COURSE",
                      payload: parseInt(e.target.value) || "",
                    })
                  }
                  className={`w-full px-3 py-2 text-sm border ${
                    errors.course
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white`}
                >
                  <option value="">Select a course</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title || course.name}
                    </option>
                  ))}
                </select>
                {errors.course && (
                  <p className="mt-1 text-xs text-red-500">{errors.course}</p>
                )}
              </div>

              {enrollmentMode === "user" && !isEditModalOpen && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Students <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-start mb-3">
                    <div className="flex-1">
                      <select
                        onChange={(e) => handleStudentSelect(e.target.value)}
                        value=""
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select a student to add...</option>
                        {availableStudents
                          .filter(
                            (student) =>
                              !selectedStudents.some(
                                (s) => s.id === student.id,
                              ),
                          )
                          .map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.email}
                              {student.name ? ` (${student.name})` : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div
                    className={`flex flex-wrap gap-2 items-center min-h-[60px] p-3 border ${
                      errors.students
                        ? "border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg bg-white dark:bg-gray-800`}
                  >
                    {selectedStudents.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        No students selected
                      </p>
                    ) : (
                      selectedStudents.map((student) => (
                        <span
                          key={student.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium"
                        >
                          {student.email}
                          {student.name ? ` (${student.name})` : ""}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStudent(student.id);
                            }}
                            className="leading-none opacity-60 hover:opacity-100 text-base ml-1"
                            title="Remove"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {errors.students && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.students}
                    </p>
                  )}

                  {selectedStudents.length > 0 && (
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                      {selectedStudents.length} student
                      {selectedStudents.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              )}

              {enrollmentMode === "user" && isEditModalOpen && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {selectedStudents[0] && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
                        {selectedStudents[0].email}
                        {selectedStudents[0].name
                          ? ` (${selectedStudents[0].name})`
                          : ""}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {enrollmentMode === "group" && !isEditModalOpen && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_SELECTED_GROUP",
                        payload: parseInt(e.target.value) || "",
                      })
                    }
                    className={`w-full px-3 py-2 text-sm border ${
                      errors.group
                        ? "border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white`}
                  >
                    <option value="">Select a group</option>
                    {availableGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {errors.group && (
                    <p className="mt-1 text-xs text-red-500">{errors.group}</p>
                  )}
                </div>
              )}
            </div>

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
                  ? isEditModalOpen
                    ? "Updating..."
                    : "Creating..."
                  : isEditModalOpen
                    ? "Update Enrollment"
                    : "Create Enrollment"}
              </Button>
            </div>
          </form>
        </div>
      </RightSideModal>
    </div>
  );
};

export default Enrollments;