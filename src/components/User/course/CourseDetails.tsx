import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { type MRT_ColumnDef, MRT_ColumnFiltersState } from "material-react-table";
import {
  getAllCourseApi,
  deleteCourseApi,
} from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import CommonTable from "../../mui/MuiTable";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { EyeIcon, TrashIcon, PencilIcon, PlusIcon } from "lucide-react";
import ViewCourseDetails from "./ViewCourseDetails";
import EditCourse from "./EditCourse";
import CreateCourse from "./CreateCourse";

// Match exact backend response shape
interface Material {
  id: number;
  title: string;
  description: string;
  type: string;
  url: string | null;
  file: string | null;
  uploaded_at: string;
  subject: number;
}

interface Subject {
  id: number;
  name: string;
  course: number;
  materials: Material[];
}

interface Course {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  created_by?: number;
  trainer_name?: string;
  duration?: string;
  status?: string;
  subjects?: Subject[];
}

type ViewType = "view" | "edit" | "create" | null;

const CourseDetails = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);

  const [currentView, setCurrentView] = useState<ViewType>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number } | null>(null);

  useEffect(() => {
    if (!currentView) fetchAllData();
  }, [currentView]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await getAllCourseApi();
      // Backend returns array with subjects + materials nested
      const list: Course[] = Array.isArray(response)
        ? response
        : response?.results || response?.data?.results || response?.data || [];
      setCourses(list);
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to fetch courses"));
    } finally {
      setLoading(false);
    }
  };

  // ── View: just pass the row directly ──────────────────────────────────
  const handleView = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView("view");
  };

  // ── Edit: just pass the row directly ─────────────────────────────────
  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView("edit");
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const confirmDelete = (id: number) => {
    setItemToDelete({ id });
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    try {
      await deleteCourseApi(itemToDelete.id);
      toast.success("Course deleted successfully");
      setDeleteModalOpen(false);
      fetchAllData();
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to delete course"));
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const handleCancel = () => {
    setCurrentView(null);
    setSelectedCourse(null);
  };

  const handleComplete = () => {
    setCurrentView(null);
    setSelectedCourse(null);
    fetchAllData();
  };

  // ── Table columns ─────────────────────────────────────────────────────
  const courseColumns = useMemo<MRT_ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: "id",
        header: "S.No",
        size: 70,
        Cell: ({ row }) => row.index + 1,
        enableColumnFilter: false,
      },
      {
        accessorKey: "name",
        header: "Course Name",
        size: 220,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "trainer_name",
        header: "Trainer",
        size: 140,
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        accessorKey: "created_at",
        header: "Created Date",
        size: 130,
        Cell: ({ cell }) => {
          const v = cell.getValue<string>();
          return v ? new Date(v).toLocaleDateString() : "-";
        },
      },
    ],
    []
  );

  const rowActions = [
    {
      label: "View",
      icon: <EyeIcon className="w-4 h-4 text-blue-500" />,
      onClick: (row: Course) => handleView(row),
    },
    {
      label: "Edit",
      icon: <PencilIcon className="w-4 h-4 text-green-500" />,
      onClick: (row: Course) => handleEdit(row),
    },
    {
      label: "Delete",
      icon: <TrashIcon className="w-4 h-4 text-red-500" />,
      onClick: (row: Course) => confirmDelete(row.id),
      className: "text-red-600",
    },
  ];

  const toolbarActions = [
    {
      label: "Create Course",
      onClick: () => setCurrentView("create"),
      icon: <PlusIcon className="w-4 h-4" />,
    },
    { label: "Refresh", onClick: fetchAllData },
  ];

  // ── Render views ──────────────────────────────────────────────────────
  if (currentView === "create") {
    return <CreateCourse onComplete={handleComplete} onCancel={handleCancel} />;
  }

  if (currentView === "view" && selectedCourse) {
    return (
      <ViewCourseDetails
        course={selectedCourse}
        onClose={handleCancel}
        onEdit={() => setCurrentView("edit")}
      />
    );
  }

  if (currentView === "edit" && selectedCourse) {
    return (
      <EditCourse
        course={selectedCourse}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    );
  }

  // ── Main table view ───────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Course Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage courses, subjects, and materials
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
        <CommonTable
          columns={courseColumns}
          data={courses}
          loading={loading}
          pagination={pagination}
          onPaginationChange={setPagination}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          enableRowSelection={false}
          enableColumnFilters={true}
          toolbarActions={toolbarActions}
          rowActions={rowActions}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <TrashIcon className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-center text-gray-900 dark:text-white">
            Confirm Delete
          </h2>
          <p className="mt-2 text-center text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this course? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetails;