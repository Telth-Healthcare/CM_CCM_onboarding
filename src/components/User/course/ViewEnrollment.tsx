import { useEffect, useReducer, useState } from "react";
import { toast } from "react-toastify";
import {
  BookOpen,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Link2,
  ClipboardList,
  BookMarked,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Layers,
  Download,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import Button from "../../ui/button/Button";
import { completionVerifyApi, updateApplicationStatusApi } from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";

export interface Material {
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

export interface Subject {
  id: number;
  name: string;
  description: string;
  img: string | null;
  course: number;
  materials: Material[];
}

export interface CourseDetails {
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

export interface EnrollmentDetail {
  id: number;
  user_name: string;
  user: number;
  enrollment_date: string;
  course_details: CourseDetails;
  application_id?: number;
  is_completed: boolean;
}

interface ViewState {
  enrollment: EnrollmentDetail | null;
  loading: boolean;
  expandedSubjects: Set<number>;
}

type ViewAction =
  | { type: "SET_ENROLLMENT"; payload: EnrollmentDetail }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "TOGGLE_SUBJECT"; payload: number }
  | { type: "EXPAND_ALL"; payload: number[] }
  | { type: "COLLAPSE_ALL" }
  | { type: "SET_COURSE_COMPLETED" };

const viewReducer = (state: ViewState, action: ViewAction): ViewState => {
  switch (action.type) {
    case "SET_ENROLLMENT":
      return { ...state, enrollment: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "TOGGLE_SUBJECT": {
      const next = new Set(state.expandedSubjects);
      next.has(action.payload)
        ? next.delete(action.payload)
        : next.add(action.payload);
      return { ...state, expandedSubjects: next };
    }
    case "EXPAND_ALL":
      return { ...state, expandedSubjects: new Set(action.payload) };
    case "COLLAPSE_ALL":
      return { ...state, expandedSubjects: new Set() };
    case "SET_COURSE_COMPLETED": {
      if (!state.enrollment) return state;
      return {
        ...state,
        enrollment: {
          ...state.enrollment,
          course_details: {
            ...state.enrollment.course_details,
            is_completed: true,
          },
        },
      };
    }
    default:
      return state;
  }
};

const MATERIAL_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  lecture_notes: {
    label: "Lecture Notes",
    icon: <BookMarked className="w-4 h-4" />,
    colorClass:
      "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  },
  reference_material: {
    label: "Reference",
    icon: <FileText className="w-4 h-4" />,
    colorClass:
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
  },
  assignment: {
    label: "Assignment",
    icon: <ClipboardList className="w-4 h-4" />,
    colorClass:
      "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
  },
};

const getMaterialConfig = (type: string) =>
  MATERIAL_CONFIG[type] ?? {
    label: type.replace(/_/g, " "),
    icon: <FileText className="w-4 h-4" />,
    colorClass: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700",
  };

const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// ── Progress Ring ─────────────────────────────────────────────────────────────

const ProgressRing = ({
  percent,
  size = 72,
  stroke = 5,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-blue-500 transition-all duration-700"
      />
    </svg>
  );
};

const MaterialRow = ({ material }: { material: Material }) => {
  const config = getMaterialConfig(material.type);
  const hasResource = material.file || material.url;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 group">
      <div className="shrink-0">
        {material.is_completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
        )}
      </div>

      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.colorClass}`}
      >
        {config.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            material.is_completed
              ? "text-gray-400 dark:text-gray-500 line-through"
              : "text-gray-800 dark:text-white"
          }`}
        >
          {material.title}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {config.label} · {formatDateShort(material.uploaded_at)}
        </p>
      </div>

      {hasResource && (
        <a
          href={material.file || material.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          {material.file ? (
            <>
              <Download className="w-3.5 h-3.5" />
              Open
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              Link
            </>
          )}
        </a>
      )}
    </div>
  );
};

// ── Subject Card ──────────────────────────────────────────────────────────────

const SubjectCard = ({
  subject,
  isExpanded,
  onToggle,
  index,
}: {
  subject: Subject;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) => {
  const done = subject.materials.filter((m) => m.is_completed).length;
  const total = subject.materials.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <span
          className={`shrink-0 w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
            allDone
              ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          {allDone ? <Check className="w-3.5 h-3.5" /> : index + 1}
        </span>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
            {subject.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allDone ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
              {done}/{total}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-gray-400 dark:text-gray-500">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-2 border-t border-gray-100 dark:border-gray-700/60">
          {subject.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-3 pb-1">
              {subject.description}
            </p>
          )}
          {subject.materials.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
              No materials yet
            </p>
          ) : (
            <div className="pt-1">
              {subject.materials.map((m) => (
                <MaterialRow key={m.id} material={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}
  />
);

const LoadingSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-3 gap-3">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
    <Skeleton className="h-14" />
    <Skeleton className="h-14" />
    <Skeleton className="h-14" />
  </div>
);

export interface EnrollmentViewProps {
  enrollment?: EnrollmentDetail;
  enrollmentId?: number;
  onBack?: () => void;
  fetchEnrollmentById?: (id: number) => Promise<{ data: EnrollmentDetail }>;
}

const ViewEnrollment = ({
  enrollment: enrollmentProp,
  enrollmentId,
  onBack,
  fetchEnrollmentById,
}: EnrollmentViewProps) => {
  const [state, dispatch] = useReducer(viewReducer, {
    enrollment: enrollmentProp ?? null,
    loading: !enrollmentProp,
    expandedSubjects: new Set<number>(),
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const [updating, setUpdating] = useState(false);

  const { enrollment, loading, expandedSubjects } = state;

  useEffect(() => {
    if (enrollmentProp) {
      dispatch({ type: "SET_ENROLLMENT", payload: enrollmentProp });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }
    if (enrollmentId && fetchEnrollmentById) {
      dispatch({ type: "SET_LOADING", payload: true });
      fetchEnrollmentById(enrollmentId)
        .then((res) => dispatch({ type: "SET_ENROLLMENT", payload: res.data }))
        .catch(() => toast.error("Failed to load enrollment details"))
        .finally(() => dispatch({ type: "SET_LOADING", payload: false }));
    }
  }, [enrollmentProp, enrollmentId, fetchEnrollmentById]);

  // Fixed: Add guard clause for undefined application_id
  const handleMarkComplete = async () => {
    if (!enrollment) return;
    
    if (!enrollment.application_id) {
      toast.error("Application ID not found");
      return;
    }
    
    setUpdating(true);
    try {
      await updateApplicationStatusApi(enrollment.application_id, {
        status: "production",
      });
      dispatch({ type: "SET_COURSE_COMPLETED" });
      toast.success("Move to production");
      setShowStatusModal(false);
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to update status"));
    } finally {
      setUpdating(false);
    }
  };

  // Fixed: Add guard clause for undefined course id
  const handleCourseComplete = async () => {
    if (!enrollment?.course_details?.id) {
      toast.error("Course ID not found");
      return;
    }

    setUpdating(true);
    try {
      await completionVerifyApi({
        course: enrollment.course_details.id,
        is_completed: true,
      });
      dispatch({ type: "SET_COURSE_COMPLETED" });
      toast.success("Course marked as completed");
      setShowCourseModal(false);
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to course Complete"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (!enrollment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <BookOpen className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No enrollment data found.</p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Go back
          </button>
        )}
      </div>
    );
  }

  const { course_details } = enrollment;
  const isCompleted = course_details.is_completed;
  const allSubjectIds = course_details.subjects.map((s) => s.id);
  const totalMat = course_details.subjects.reduce(
    (a, s) => a + s.materials.length,
    0,
  );
  const doneMat = course_details.subjects.reduce(
    (a, s) => a + s.materials.filter((m) => m.is_completed).length,
    0,
  );
  const progress = totalMat > 0 ? Math.round((doneMat / totalMat) * 100) : 0;
  const allExpanded = allSubjectIds.every((id) => expandedSubjects.has(id));

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Back */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Enrollments
          </button>
        )}

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-start gap-4">
            {/* Progress ring */}
            <div className="relative shrink-0 w-[72px] h-[72px]">
              <ProgressRing percent={progress} size={72} stroke={5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-white tabular-nums">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Course info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                Course
              </p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                {course_details.name}
              </h2>
              {course_details.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {course_details.description}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {doneMat} of {totalMat} materials completed
              </p>
            </div>

            {/* Course status button */}
            <div className="shrink-0">
              {isCompleted ? (
                <Button
                  onClick={() => setShowStatusModal(true)}
                  className="py-2 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Mark as Complete
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={() => setShowCourseModal(true)}
                  className="py-2 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Course Complete
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Info pills ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Student
              </p>
              <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                {enrollment.user_name}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Enrolled
              </p>
              <p className="text-xs font-semibold text-gray-800 dark:text-white">
                {formatDateShort(enrollment.enrollment_date)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Subjects
              </p>
              <p className="text-xs font-semibold text-gray-800 dark:text-white">
                {course_details.subjects.length}
              </p>
            </div>
          </div>
        </div>

        {/* ── Subjects & Materials ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              Subjects & Materials
            </h3>
            {course_details.subjects.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  allExpanded
                    ? dispatch({ type: "COLLAPSE_ALL" })
                    : dispatch({ type: "EXPAND_ALL", payload: allSubjectIds })
                }
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {allExpanded ? "Collapse all" : "Expand all"}
              </button>
            )}
          </div>

          {course_details.subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <BookOpen className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No subjects available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {course_details.subjects.map((subject, idx) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  index={idx}
                  isExpanded={expandedSubjects.has(subject.id)}
                  onToggle={() =>
                    dispatch({ type: "TOGGLE_SUBJECT", payload: subject.id })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer meta */}
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 pt-1">
          <User className="w-3 h-3" />
          <span>Author: {course_details.aurthor}</span>
          <span className="mx-2">·</span>
          <Calendar className="w-3 h-3" />
          <span>Created {formatDateShort(course_details.created_at)}</span>
        </div>
      </div>

      {/* ── Confirm completion modal ───────────────────────────────────── */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !updating && setShowStatusModal(false)}
          />

          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirm Completion
                  </h3>
                </div>
                <button
                  onClick={() => !updating && setShowStatusModal(false)}
                  disabled={updating}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  This action is irreversible. Once marked as completed, the
                  status cannot be changed again.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    Student
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {enrollment.user_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    Course
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {course_details.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Material Progress
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                      {progress}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {doneMat} of {totalMat} materials completed
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updating}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkComplete}
                disabled={updating}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Completion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCourseModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !updating && setShowCourseModal(false)}
          />

          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirm Completion
                  </h3>
                </div>
                <button
                  onClick={() => !updating && setShowCourseModal(false)}
                  disabled={updating}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  This action is irreversible. Once marked as completed, the
                  status cannot be changed again.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    Student
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {enrollment.user_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    Course
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {course_details.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Material Progress
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                      {progress}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {doneMat} of {totalMat} materials completed
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowCourseModal(false)}
                disabled={updating}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCourseComplete}
                disabled={updating}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Completion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
    </>
  );
};

export default ViewEnrollment;