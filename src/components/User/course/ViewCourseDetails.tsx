import React, { useState } from "react";
import Button from "../../ui/button/Button";
import { ChevronLeftIcon, FileIcon, LinkIcon } from "lucide-react";

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

interface ViewCourseDetailsProps {
  course: Course;
  onClose: () => void;
  onEdit: () => void;
}

const ViewCourseDetails: React.FC<ViewCourseDetailsProps> = ({
  course,
  onClose,
  onEdit,
}) => {
  const [expandedSubjects, setExpandedSubjects] = useState<number[]>([]);

  const toggleSubject = (id: number) => {
    setExpandedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  // Fix: parse date as UTC to avoid off-by-one-day shifts caused by local timezone offset
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalMaterials =
    course.subjects?.reduce((t, s) => t + (s.materials?.length || 0), 0) ?? 0;

  const getMaterialTypeLabel = (type: string) =>
    type?.replace(/_/g, " ") || "document";

  const getMaterialTypeIcon = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("video"))
      return (
        <svg
          className="w-4 h-4 text-blue-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      );
    if (t.includes("pdf") || t.includes("notes") || t.includes("lecture"))
      return (
        <svg
          className="w-4 h-4 text-red-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    return (
      <svg
        className="w-4 h-4 text-gray-400 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Course Details
          </h2>
        </div>
      </div>

      {/* Course Overview */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              Course Name
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {course.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              Trainer
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {course.trainer_name || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              Total Subjects
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {course.subjects?.length ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              Total Materials
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {totalMaterials}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              Created Date
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(course.created_at)}
            </p>
          </div>
          {course.description && (
            <div className="col-span-full">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Description
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {course.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subjects & Materials */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Subjects & Materials
        </h3>

        {course.subjects && course.subjects.length > 0 ? (
          <div className="space-y-3">
            {course.subjects.map((subject) => (
              <div
                key={subject.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Subject row — Fix: added role, tabIndex, and onKeyDown for keyboard accessibility */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSubject(subject.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSubject(subject.id);
                    }
                  }}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        expandedSubjects.includes(subject.id) ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {subject.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {subject.materials?.length || 0} material
                      {subject.materials?.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Materials */}
                {expandedSubjects.includes(subject.id) && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {subject.materials && subject.materials.length > 0 ? (
                      subject.materials.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-start gap-3 px-5 py-3 bg-white dark:bg-gray-800"
                        >
                          {getMaterialTypeIcon(material.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {material.title}
                              </p>
                              <div className="shrink-0">
                                {material.file ? (
                                  <a
                                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(material.file)}&embedded=false`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    <FileIcon className="w-3 h-3" />
                                    View File
                                  </a>
                                ) : material.url ? (
                                  <a
                                    href={material.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    Open URL
                                  </a>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                {getMaterialTypeLabel(material.type)}
                              </span>
                              {material.description && (
                                <span className="text-xs text-gray-400 truncate">
                                  {material.description}
                                </span>
                              )}
                              <span className="text-xs text-gray-400 ml-auto">
                                {formatDate(material.uploaded_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500">
                        No materials for this subject.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400">
              No subjects added to this course yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Close
        </Button>
        <Button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Edit Course
        </Button>
      </div>
    </div>
  );
};

export default ViewCourseDetails;