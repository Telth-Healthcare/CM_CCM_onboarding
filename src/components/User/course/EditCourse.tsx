import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import {
  updateCourseApi,
  createCourseSubApi,
  updateCourseSubApi,
  deleteCourseSubApi,
  createSubMaterialApi,
  createSubMaterialImgApi,
  updateSubMaterialApi,
  updateSubMaterialImgApi,
  deleteSubMaterialApi,
  contactApi,
  getRoleUsers,
} from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import { getUserRole } from "../../../config/constants";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface Material {
  id?: number;
  title: string;
  description: string;
  type: string;
  file: string | null;
  newFile?: File | null;
  fileChanged?: boolean;
  url: string | null;
  uploaded_at?: string;
  subject: number;
  isNew?: boolean;
  inputType?: "url" | "file" | "";
  originalUrl?: string | null;
  originalFile?: string | null;
  originalTitle?: string;
  originalType?: string;
  originalDescription?: string;
  fileSizeError?: string;
}

interface Subject {
  id?: number;
  name: string;
  course: number;
  description?: string;
  img?: string | null;
  materials: Material[];
  isNew?: boolean;
}

interface Course {
  id: number;
  name: string;
  description?: string;
  aurthor?: string;
  trainer_name?: string;
  created_by?: number;
  duration?: string;
  status?: string;
  img?: string | null;
  created_at?: string;
  subjects?: Subject[];
}

function extractFilePath(fileUrl: string | null): string | null {
  if (!fileUrl) return null;
  try {
    const parsed = new URL(fileUrl);
    return parsed.pathname;
  } catch {
    return fileUrl;
  }
}

function getFileName(fileUrl: string | null): string {
  if (!fileUrl) return "";
  try {
    const parsed = new URL(fileUrl);
    return parsed.pathname.split("/").pop() || fileUrl;
  } catch {
    return fileUrl.split("/").pop() || fileUrl;
  }
}

interface EditCourseProps {
  course: Course;
  onComplete: () => void;
  onCancel: () => void;
}

type SectionStatus = "idle" | "saving" | "saved" | "error";

const inputCls =
  "w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent " +
  "dark:bg-gray-800 dark:text-white placeholder-gray-400 transition-all duration-200";

const CheckIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v8H4z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ChevronRightIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const StatusBadge = ({ status }: { status: SectionStatus }) => {
  if (status === "saving")
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
        <SpinnerIcon /> Saving…
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-full">
        <CheckIcon /> Saved
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-full">
        Failed
      </span>
    );
  return null;
};

const Section = ({
  index,
  title,
  status,
  children,
  action,
}: {
  index: number;
  title: string;
  status?: SectionStatus;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
            {index}
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {status && <StatusBadge status={status} />}
          {action}
        </div>
      </div>
      {children}
    </div>
  </div>
);

function normaliseMaterial(m: Material): Material {
  const filePath = extractFilePath(m.file);
  return {
    ...m,
    inputType: m.url ? "url" : filePath ? "file" : "",
    newFile: null,
    fileChanged: false,
    originalUrl: m.url,
    originalFile: filePath,
    originalTitle: m.title,
    originalType: m.type,
    originalDescription: m.description,
    fileSizeError: undefined,
  };
}

const EditCourse: React.FC<EditCourseProps> = ({
  course,
  onComplete,
  onCancel,
}) => {
  const userRole = getUserRole("admin");
  const isAdminOrSuperAdmin =
    userRole === "super_admin" || userRole === "admin";

  const [materialTypes, setMaterialTypes] = useState<
    { value: string; label: string }[]
  >([]);
  const [trainers, setTrainers] = useState<{ value: number; label: string }[]>(
    [],
  );

  const [courseName, setCourseName] = useState(course.name);
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(
    course.created_by ?? null,
  );
  const [courseStatus, setCourseStatus] = useState<SectionStatus>("idle");
  const courseNameRef = useRef<HTMLInputElement>(null);

  const [subjects, setSubjects] = useState<Subject[]>(() =>
    (course.subjects || []).map((s) => ({
      ...s,
      materials: (s.materials || []).map(normaliseMaterial),
    })),
  );

  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(
    new Set(),
  );

  const [subjectStatuses, setSubjectStatuses] = useState<
    Record<number, SectionStatus>
  >({});
  const [materialStatuses, setMaterialStatuses] = useState<
    Record<string, SectionStatus>
  >({});
  const [saving, setSaving] = useState(false);

  const subjectsRef = useRef<Subject[]>(subjects);
  useEffect(() => {
    subjectsRef.current = subjects;
  }, [subjects]);

  const setMatStatus = useCallback(
    (si: number, mi: number, status: SectionStatus) =>
      setMaterialStatuses((prev) => ({ ...prev, [`${si}-${mi}`]: status })),
    [],
  );

  const fetchMaterialTypes = useCallback(async () => {
    try {
      const res = await contactApi();
      setMaterialTypes(res.material_document_type || []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      const res = await getRoleUsers("roles__name__in", "trainer");
      const data = res?.data?.results || [];
      setTrainers(
        data.map((item: any) => ({
          value: item.id,
          label:
            `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
            `Trainer ${item.id}`,
        })),
      );
    } catch {
      toast.error("Failed to load trainers");
    }
  }, []);

  useEffect(() => {
    fetchMaterialTypes();
    if (isAdminOrSuperAdmin) fetchTrainers();
  }, [fetchMaterialTypes, fetchTrainers, isAdminOrSuperAdmin]);

  const buildCoursePayload = useCallback(() => {
    const payload: Record<string, unknown> = { name: courseName.trim() };
    if (selectedTrainer) payload.created_by = selectedTrainer;
    return payload;
  }, [courseName, selectedTrainer]);

  const saveCourseInfo = useCallback(async () => {
    if (!courseName.trim()) return;
    setCourseStatus("saving");
    try {
      await updateCourseApi(course.id, buildCoursePayload());
      setCourseStatus("saved");
      toast.success("Course info updated!");
    } catch (error) {
      setCourseStatus("error");
      toast.error(handleAxiosError(error, "Failed to update course"));
    }
  }, [course.id, buildCoursePayload, courseName]);

  const handleCourseKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!isAdminOrSuperAdmin) saveCourseInfo();
      }
    },
    [isAdminOrSuperAdmin, saveCourseInfo],
  );

  const handleCourseBlur = useCallback(() => {
    if (!isAdminOrSuperAdmin) saveCourseInfo();
  }, [isAdminOrSuperAdmin, saveCourseInfo]);

  const toggleExpand = useCallback((si: number) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(si)) next.delete(si);
      else next.add(si);
      return next;
    });
  }, []);

  const addSubject = useCallback(() => {
    const newSubject: Subject = {
      name: "",
      course: course.id,
      materials: [],
      isNew: true,
    };

    setSubjects((prev) => {
      const nextIndex = prev.length;
      setTimeout(() => {
        setExpandedSubjects((exp) => {
          const next = new Set(exp);
          next.add(nextIndex);
          return next;
        });
      }, 0);
      return [...prev, newSubject];
    });
  }, [course.id]);

  const updateSubjectName = useCallback((si: number, value: string) => {
    setSubjects((prev) => {
      const updated = [...prev];
      updated[si] = { ...updated[si], name: value };
      return updated;
    });
  }, []);

  const saveSubjectName = useCallback(
    async (si: number) => {
      const subject = subjectsRef.current[si];
      if (!subject) return;
      if (!subject.name.trim()) return;

      setSubjectStatuses((prev) => ({ ...prev, [si]: "saving" }));

      try {
        if (subject.isNew || !subject.id) {
          const res = await createCourseSubApi({
            name: subject.name.trim(),
            course: course.id,
          });
          const created: Subject = res?.data || res;

          setSubjects((prev) => {
            const updated = [...prev];
            if (!updated[si]) return prev;
            updated[si] = { ...updated[si], id: created.id, isNew: false };
            return updated;
          });
          toast.success("Subject created!");
        } else {
          await updateCourseSubApi(subject.id, { name: subject.name.trim() });
          toast.success("Subject updated!");
        }
        setSubjectStatuses((prev) => ({ ...prev, [si]: "saved" }));
      } catch (error) {
        setSubjectStatuses((prev) => ({ ...prev, [si]: "error" }));
        toast.error(handleAxiosError(error, "Failed to save subject"));
      }
    },
    [course.id],
  );

  const removeSubject = useCallback(async (si: number) => {
    const subject = subjectsRef.current[si];
    if (!subject) return;

    if (subject.id && !subject.isNew) {
      try {
        await deleteCourseSubApi(subject.id);
        toast.success("Subject removed");
      } catch (error) {
        toast.error(handleAxiosError(error, "Failed to remove subject"));
        return;
      }
    }

    setSubjects((prev) => prev.filter((_, i) => i !== si));

    setExpandedSubjects((prev) => {
      const next = new Set<number>();
      prev.forEach((idx) => {
        if (idx < si) next.add(idx);
        else if (idx > si) next.add(idx - 1);
      });
      return next;
    });

    setSubjectStatuses((prev) => {
      const next: Record<number, SectionStatus> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key);
        if (k < si) next[k] = val;
        else if (k > si) next[k - 1] = val;
      });
      return next;
    });

    setMaterialStatuses((prev) => {
      const next: Record<string, SectionStatus> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const [ks, km] = key.split("-").map(Number);
        if (ks < si) next[`${ks}-${km}`] = val;
        else if (ks > si) next[`${ks - 1}-${km}`] = val;
      });
      return next;
    });
  }, []);

  const updateMaterial = useCallback(
    (si: number, mi: number, field: keyof Material, value: any) => {
      setSubjects((prev) => {
        const updated = [...prev];
        const mats = [...(updated[si]?.materials || [])];
        mats[mi] = { ...mats[mi], [field]: value };
        updated[si] = { ...updated[si], materials: mats };
        return updated;
      });
    },
    [],
  );

  const addMaterial = useCallback((si: number) => {
    setSubjects((prev) => {
      const updated = [...prev];
      const currentMaterials = updated[si]?.materials || [];
      updated[si] = {
        ...updated[si],
        materials: [
          ...currentMaterials,
          {
            title: "",
            description: "",
            type: "",
            url: null,
            file: null,
            newFile: null,
            fileChanged: false,
            subject: updated[si]?.id || 0,
            isNew: true,
            inputType: "",
            fileSizeError: undefined,
          },
        ],
      };
      return updated;
    });

    setTimeout(() => {
      setExpandedSubjects((prev) => {
        if (prev.has(si)) return prev;
        const next = new Set(prev);
        next.add(si);
        return next;
      });
    }, 0);
  }, []);

  const removeMaterial = useCallback(async (si: number, mi: number) => {
    const material = subjectsRef.current[si]?.materials?.[mi];
    if (!material) return;

    if (material.id && !material.isNew) {
      try {
        await deleteSubMaterialApi(material.id);
        toast.success("Material removed");
      } catch (error) {
        toast.error(handleAxiosError(error, "Failed to remove material"));
        return;
      }
    }

    setSubjects((prev) => {
      const updated = [...prev];
      updated[si] = {
        ...updated[si],
        materials: updated[si].materials.filter((_, i) => i !== mi),
      };
      return updated;
    });

    setMaterialStatuses((prev) => {
      const next: Record<string, SectionStatus> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const [ks, km] = key.split("-").map(Number);
        if (ks !== si) {
          next[key] = val;
        } else {
          if (km < mi) next[`${ks}-${km}`] = val;
          else if (km > mi) next[`${ks}-${km - 1}`] = val;
        }
      });
      return next;
    });
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, si: number, mi: number) => {
      const picked = e.target.files?.[0];
      if (picked) {
        if (picked.size > MAX_FILE_SIZE_BYTES) {
          updateMaterial(si, mi, "fileSizeError", `File size must be less than ${MAX_FILE_SIZE_MB} MB`);
          updateMaterial(si, mi, "newFile", null);
          updateMaterial(si, mi, "fileChanged", false);
          toast.error(`File too large! Maximum size is ${MAX_FILE_SIZE_MB}MB`);
          e.target.value = "";
          return;
        }
        
        updateMaterial(si, mi, "fileSizeError", undefined);
        updateMaterial(si, mi, "newFile", picked);
        updateMaterial(si, mi, "fileChanged", true);
      }
    },
    [updateMaterial],
  );

  const saveMaterial = useCallback(
    async (si: number, mi: number) => {
      const subject = subjectsRef.current[si];
      const material = subject?.materials?.[mi];
      if (!material) return;

      if (!material.title.trim()) {
        toast.error("Material title is required");
        return;
      }
      if (!material.type) {
        toast.error("Select a document type");
        return;
      }
      if (!material.inputType) {
        toast.error("Choose URL or File Upload");
        return;
      }
      if (material.inputType === "url" && !material.url?.trim()) {
        toast.error("Please enter a URL");
        return;
      }
      
      if (material.inputType === "file") {
        if (material.newFile && material.newFile.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`File too large! Maximum size is ${MAX_FILE_SIZE_MB}MB`);
          return;
        }
        if (!material.newFile && !material.file) {
          toast.error("Please select a file");
          return;
        }
      }
      
      if (!subject.id) {
        toast.error("Save the subject name first");
        return;
      }

      setMatStatus(si, mi, "saving");

      try {
        let saved: any;

        if (material.isNew || !material.id) {
          if (material.inputType === "file" && material.newFile) {
            const formData = new FormData();
            formData.append("title", material.title);
            formData.append("type", material.type);
            formData.append("subject", subject.id.toString());
            formData.append("description", material.description || "");
            formData.append("file", material.newFile);
            const res = await createSubMaterialImgApi(formData);
            saved = res?.data || res;
          } else {
            const res = await createSubMaterialApi({
              title: material.title,
              type: material.type,
              subject: subject.id,
              description: material.description || "",
              url: material.url!.trim(),
            });
            saved = res?.data || res;
          }
          toast.success("Material created!");
        } else {
          const titleChanged = material.title !== material.originalTitle;
          const typeChanged = material.type !== material.originalType;
          const descChanged =
            material.description !== material.originalDescription;
          const urlChanged =
            material.inputType === "url" &&
            material.url !== material.originalUrl;
          const fileChanged = material.fileChanged === true;

          if (
            !titleChanged &&
            !typeChanged &&
            !descChanged &&
            !urlChanged &&
            !fileChanged
          ) {
            toast.info("No changes to save");
            setMatStatus(si, mi, "idle");
            return;
          }

          if (
            material.inputType === "file" &&
            fileChanged &&
            material.newFile
          ) {
            const formData = new FormData();
            formData.append("title", material.title);
            formData.append("type", material.type);
            formData.append("subject", subject.id.toString());
            formData.append("description", material.description || "");
            formData.append("file", material.newFile);
            const res = await updateSubMaterialImgApi(material.id, formData);
            saved = res?.data || res;
          } else if (material.inputType === "file") {
            const res = await updateSubMaterialApi(material.id, {
              title: material.title,
              type: material.type,
              subject: subject.id,
              description: material.description || "",
              file: extractFilePath(material.file),
            });
            saved = res?.data || res;
          } else {
            const res = await updateSubMaterialApi(material.id, {
              title: material.title,
              type: material.type,
              subject: subject.id,
              description: material.description || "",
              url: material.url!.trim(),
            });
            saved = res?.data || res;
          }
          toast.success("Material updated!");
        }

        setSubjects((prev) => {
          const copy = [...prev];
          if (!copy[si]) return prev;
          const mats = [...copy[si].materials];
          mats[mi] = normaliseMaterial({ ...mats[mi], ...saved, isNew: false });
          copy[si] = { ...copy[si], materials: mats };
          return copy;
        });
        setMatStatus(si, mi, "saved");
      } catch (error) {
        setMatStatus(si, mi, "error");
        toast.error(handleAxiosError(error, "Failed to save material"));
      }
    },
    [setMatStatus],
  );

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await updateCourseApi(course.id, buildCoursePayload());

      for (const subject of subjectsRef.current) {
        if (!subject.id || subject.isNew) continue;
        await updateCourseSubApi(subject.id, { name: subject.name.trim() });

        for (const material of subject.materials || []) {
          if (!material.id || material.isNew) continue;
          if (!material.title.trim() || !material.type || !material.inputType)
            continue;
          if (material.inputType === "url" && !material.url?.trim()) continue;
          
          if (material.inputType === "file") {
            if (material.newFile && material.newFile.size > MAX_FILE_SIZE_BYTES) {
              toast.error(`File too large for "${material.title}"! Maximum size is ${MAX_FILE_SIZE_MB}MB`);
              continue;
            }
            if (!material.newFile && !material.file) continue;
          }

          const titleChanged = material.title !== material.originalTitle;
          const typeChanged = material.type !== material.originalType;
          const descChanged =
            material.description !== material.originalDescription;
          const urlChanged =
            material.inputType === "url" &&
            material.url !== material.originalUrl;
          const fileChanged =
            material.inputType === "file" && !!material.newFile;

          if (
            !titleChanged &&
            !typeChanged &&
            !descChanged &&
            !urlChanged &&
            !fileChanged
          )
            continue;

          if (
            material.inputType === "file" &&
            fileChanged &&
            material.newFile
          ) {
            const formData = new FormData();
            formData.append("title", material.title);
            formData.append("type", material.type);
            formData.append("subject", String(subject.id));
            formData.append("description", material.description || "");
            formData.append("file", material.newFile);
            await updateSubMaterialImgApi(material.id, formData);
          } else if (material.inputType === "file") {
            await updateSubMaterialApi(material.id, {
              title: material.title,
              type: material.type,
              subject: subject.id,
              description: material.description || "",
              file: extractFilePath(material.file),
            });
          } else {
            await updateSubMaterialApi(material.id, {
              title: material.title,
              type: material.type,
              subject: subject.id,
              description: material.description || "",
              url: material.url!.trim(),
            });
          }
        }
      }

      toast.success("Course updated successfully!");
      onComplete();
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with gradient background */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl -z-10" />
        <div className="flex items-start justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Edit Course
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update course information, subjects, and learning materials
            </p>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Section index={1} title="Course Information" status={courseStatus}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={courseNameRef}
                type="text"
                value={courseName}
                onChange={(e) => {
                  setCourseName(e.target.value);
                  setCourseStatus("idle");
                }}
                onBlur={handleCourseBlur}
                onKeyDown={handleCourseKeyDown}
                placeholder={
                  isAdminOrSuperAdmin
                    ? "Enter course name"
                    : "Course name — press Enter to save"
                }
                className={inputCls}
              />
            </div>

            {isAdminOrSuperAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign Trainer
                  </label>
                  <select
                    value={selectedTrainer ?? ""}
                    onChange={(e) => {
                      setSelectedTrainer(
                        e.target.value ? Number(e.target.value) : null,
                      );
                      setCourseStatus("idle");
                    }}
                    className={inputCls}
                  >
                    <option value="">Select a trainer</option>
                    {trainers.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={saveCourseInfo}
                  disabled={courseStatus === "saving" || !courseName.trim()}
                  className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  {courseStatus === "saving" ? (
                    <>
                      <SpinnerIcon /> Saving Changes…
                    </>
                  ) : (
                    "Update Course Information"
                  )}
                </button>
              </>
            )}
          </div>
        </Section>

        <Section
          index={2}
          title="Subjects & Materials"
          action={
            <button
              type="button"
              onClick={addSubject}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-sm"
            >
              <PlusIcon /> Add Subject
            </button>
          }
        >
          {subjects.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <PlusIcon />
              </div>
              <p className="text-sm text-gray-400">
                No subjects yet. Click "Add Subject" to begin.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject, si) => (
                <div
                  key={subject.id ?? `new-${si}`}
                  className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/30"
                >
                  {/* Subject header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => toggleExpand(si)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ChevronRightIcon open={expandedSubjects.has(si)} />
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={subject.name}
                          onChange={(e) => updateSubjectName(si, e.target.value)}
                          onBlur={() => saveSubjectName(si)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveSubjectName(si);
                            }
                          }}
                          placeholder="Subject name — press Enter to save"
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white placeholder-gray-400 transition-all"
                        />
                      </div>
                      <StatusBadge status={subjectStatuses[si] || "idle"} />
                    </div>

                    <button
                      type="button"
                      onClick={() => addMaterial(si)}
                      disabled={!subject.id}
                      title={
                        subject.id ? "Add material" : "Save subject name first"
                      }
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <PlusIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeSubject(si)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove subject"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  {/* Materials section */}
                  {expandedSubjects.has(si) && (
                    <div className="px-4 py-4 space-y-3">
                      {subject.materials.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-400">
                            No materials yet. Click + to add learning materials.
                          </p>
                        </div>
                      ) : (
                        subject.materials.map((material, mi) => {
                          const matKey = `${si}-${mi}`;
                          const matStatus = materialStatuses[matKey] || "idle";

                          return (
                            <div
                              key={material.id ?? `newmat-${si}-${mi}`}
                              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {/* Title + type row */}
                              <div className="flex gap-3 items-start mb-3">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={material.title}
                                    onChange={(e) =>
                                      updateMaterial(
                                        si,
                                        mi,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Material title"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white placeholder-gray-400"
                                  />
                                </div>
                                <div className="w-48">
                                  <select
                                    value={material.type}
                                    onChange={(e) =>
                                      updateMaterial(
                                        si,
                                        mi,
                                        "type",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                  >
                                    <option value="">Select type</option>
                                    {materialTypes.map((t) => (
                                      <option key={t.value} value={t.value}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMaterial(si, mi)}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                                >
                                  <TrashIcon />
                                </button>
                              </div>

                              {/* URL/File toggle buttons */}
                              <div className="flex gap-2 mb-3">
                                {(["url", "file"] as const).map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                      updateMaterial(si, mi, "inputType", type);
                                      if (type === "url") {
                                        updateMaterial(si, mi, "newFile", null);
                                        updateMaterial(
                                          si,
                                          mi,
                                          "fileChanged",
                                          false,
                                        );
                                        updateMaterial(si, mi, "fileSizeError", undefined);
                                      } else {
                                        updateMaterial(si, mi, "url", null);
                                      }
                                    }}
                                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
                                      material.inputType === type
                                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                  >
                                    {type === "url" ? "URL Link" : "File Upload"}
                                  </button>
                                ))}
                              </div>

                              {/* URL input */}
                              {material.inputType === "url" && (
                                <div className="mb-3">
                                  <input
                                    type="url"
                                    value={material.url || ""}
                                    onChange={(e) =>
                                      updateMaterial(
                                        si,
                                        mi,
                                        "url",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="https://example.com/resource"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white placeholder-gray-400"
                                  />
                                </div>
                              )}

                              {/* File upload area */}
                              {material.inputType === "file" && (
                                <div className="mb-3">
                                  <label
                                    htmlFor={`mat-file-${si}-${mi}`}
                                    className="flex items-center justify-between gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
                                  >
                                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                      {material.newFile
                                        ? material.newFile.name
                                        : material.file
                                          ?  getFileName(material.file)
                                          : "Click to choose file (Max " + MAX_FILE_SIZE_MB + "MB)"}
                                    </span>
                                  </label>
                                  <input
                                    id={`mat-file-${si}-${mi}`}
                                    type="file"
                                    onChange={(e) =>
                                      handleFileChange(e, si, mi)
                                    }
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.txt,.zip,.mp4,.jpg,.png"
                                  />
                                  {material.file && !material.newFile && (
                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                      ✓ Current file will be kept
                                    </p>
                                  )}
                                  {material.newFile && (
                                    <p className="text-xs text-blue-600 mt-2">
                                      New file selected: {(material.newFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                  )}
                                  {material.fileSizeError && (
                                    <p className="text-xs text-red-500 mt-2">
                                       {material.fileSizeError}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Save button row */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                <StatusBadge status={matStatus} />
                                <button
                                  type="button"
                                  onClick={() => saveMaterial(si, mi)}
                                  disabled={matStatus === "saving" || !!material.fileSizeError}
                                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                                >
                                  {matStatus === "saving" ? (
                                    <>
                                      <SpinnerIcon /> Saving…
                                    </>
                                  ) : material.isNew ? (
                                    "Create Material"
                                  ) : (
                                    "Update Material"
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Footer with gradient button */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
        >
          {saving ? (
            <>
              <SpinnerIcon /> Saving All Changes…
            </>
          ) : (
            "Save All Changes"
          )}
        </button>
      </div>
    </div>
  );
};

export default EditCourse;