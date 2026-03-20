import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import {
  updateCourseApi,
  updateCourseSubApi,
  deleteCourseSubApi,
  updateSubMaterialApi,
  updateSubMaterialImgApi,
  deleteSubMaterialApi,
  contactApi,
  getRoleUsers,
} from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import { getUserRole } from "../../../config/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Material {
  id?: number;
  title: string;
  description: string;
  type: string;
  // `file`    — string path returned by the backend (never put into FormData as-is)
  // `newFile` — File object the user picks; only this goes into FormData
  file: string | null;
  newFile?: File | null;
  fileChanged?: boolean;
  url: string | null;
  uploaded_at?: string;
  subject: number;
  isNew?: boolean;
  isDeleted?: boolean;
  inputType?: "url" | "file" | "";
  originalUrl?: string | null;
  originalFile?: string | null;
  originalTitle?: string;
  originalType?: string;
  originalDescription?: string;
}

interface Subject {
  id?: number;
  name: string;
  course: number;
  materials: Material[];
  isNew?: boolean;
  isDeleted?: boolean;
}

interface Course {
  id: number;
  name: string;
  description?: string;
  trainer_name?: string;
  created_by?: number;
  duration?: string;
  status?: string;
  subjects?: Subject[];
}

interface EditCourseProps {
  course: Course;
  onComplete: () => void;
  onCancel: () => void;
}

type SectionStatus = "idle" | "saving" | "saved" | "error";

// ── Shared input style ────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "dark:bg-gray-800 dark:text-white placeholder-gray-400";

// ── Icons ─────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ChevronRightIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: SectionStatus }) => {
  if (status === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-blue-500">
        <SpinnerIcon /> Saving…
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
        <CheckIcon /> Saved
      </span>
    );
  if (status === "error")
    return <span className="text-xs text-red-500">Failed — try again</span>;
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
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center bg-blue-600 text-white">
            {index}
          </span>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
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

// ── Main component ────────────────────────────────────────────────────────────

const EditCourse: React.FC<EditCourseProps> = ({ course, onComplete, onCancel }) => {
  const [materialTypes, setMaterialTypes] = useState<{ value: string; label: string }[]>([]);
  const [trainers, setTrainers] = useState<{ value: number; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const [courseName, setCourseName] = useState(course.name);
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(course.created_by ?? null);
  const [courseFieldStatus, setCourseFieldStatus] = useState<SectionStatus>("idle");
  const courseNameRef = useRef<HTMLInputElement>(null);

  const userRole = getUserRole("admin");
  const isAdminOrSuperAdmin = userRole === "super_admin" || userRole === "admin";

  const [subjects, setSubjects] = useState<Subject[]>(() =>
    (course.subjects || []).map((s) => ({
      ...s,
      materials: (s.materials || []).map((m) => ({
        ...m,
        inputType: m.url ? "url" : m.file ? "file" : ("" as const),
        newFile: null,
        fileChanged: false,
        originalUrl: m.url,
        originalFile: m.file,
        originalTitle: m.title,
        originalType: m.type,
        originalDescription: m.description,
      })),
    })),
  );
  const [expandedSubjects, setExpandedSubjects] = useState<number[]>([]);
  const [subjectStatuses, setSubjectStatuses] = useState<Record<number, SectionStatus>>({});

  // ── Data fetching ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchMaterialTypes();
    if (isAdminOrSuperAdmin) fetchTrainers();
  }, []);

  const fetchMaterialTypes = async () => {
    try {
      const response = await contactApi();
      setMaterialTypes(response.material_document_type || []);
    } catch { /* silent */ }
  };

  const fetchTrainers = async () => {
    try {
      const res = await getRoleUsers("trainer");
      const data = res?.data?.results || [];
      setTrainers(
        data.map((item: any) => ({
          value: item.id,
          label: `${item.first_name || ""} ${item.last_name || ""}`.trim() || `Trainer ${item.id}`,
        })),
      );
    } catch {
      toast.error("Failed to load trainers");
    }
  };

  // ── Course payload ────────────────────────────────────────────────────
  // `created_by` only included when a trainer is selected — never sent as
  // empty string or null.

  const buildCoursePayload = useCallback(() => {
    const payload: Record<string, unknown> = { name: courseName.trim() };
    if (selectedTrainer) payload.created_by = selectedTrainer;
    return payload;
  }, [courseName, selectedTrainer]);

  const saveCourseInfo = useCallback(async () => {
    if (!courseName.trim()) return;
    setCourseFieldStatus("saving");
    try {
      await updateCourseApi(course.id, buildCoursePayload());
      setCourseFieldStatus("saved");
    } catch (error) {
      setCourseFieldStatus("error");
      toast.error(handleAxiosError(error, "Failed to update course"));
    }
  }, [course.id, buildCoursePayload, courseName]);

  // ── Subject helpers ───────────────────────────────────────────────────

  const toggleExpand = (idx: number) =>
    setExpandedSubjects((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );

  const addSubject = () => {
    const newSubject: Subject = { name: "", course: course.id, materials: [], isNew: true };
    setSubjects((prev) => [...prev, newSubject]);
    setExpandedSubjects((prev) => [...prev, subjects.length]);
  };

  const updateSubjectName = (idx: number, value: string) =>
    setSubjects((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], name: value };
      return updated;
    });

  const saveSubjectName = useCallback(
    async (idx: number) => {
      const subject = subjects[idx];
      if (!subject.name.trim() || subject.isNew || !subject.id) return;
      setSubjectStatuses((prev) => ({ ...prev, [idx]: "saving" }));
      try {
        await updateCourseSubApi(subject.id, { name: subject.name.trim() });
        setSubjectStatuses((prev) => ({ ...prev, [idx]: "saved" }));
      } catch (error) {
        setSubjectStatuses((prev) => ({ ...prev, [idx]: "error" }));
        toast.error(handleAxiosError(error, "Failed to save subject"));
      }
    },
    [subjects],
  );

  const removeSubject = async (idx: number) => {
    const subject = subjects[idx];
    if (subject.id && !subject.isNew) {
      try {
        await deleteCourseSubApi(subject.id);
        toast.success("Subject removed");
      } catch (error) {
        toast.error(handleAxiosError(error, "Failed to remove subject"));
        return;
      }
    }
    setSubjects((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Material helpers ──────────────────────────────────────────────────

  const addMaterial = (subjectIdx: number) =>
    setSubjects((prev) => {
      const updated = [...prev];
      updated[subjectIdx] = {
        ...updated[subjectIdx],
        materials: [
          ...(updated[subjectIdx].materials || []),
          {
            title: "", description: "", type: "",
            url: null, file: null, newFile: null,
            subject: updated[subjectIdx].id || 0,
            isNew: true, inputType: "",
          },
        ],
      };
      return updated;
    });

  const updateMaterial = (subjectIdx: number, matIdx: number, field: keyof Material, value: any) =>
    setSubjects((prev) => {
      const updated = [...prev];
      const mats = [...(updated[subjectIdx].materials || [])];
      mats[matIdx] = { ...mats[matIdx], [field]: value };
      updated[subjectIdx] = { ...updated[subjectIdx], materials: mats };
      return updated;
    });

  const removeMaterial = async (subjectIdx: number, matIdx: number) => {
    const material = subjects[subjectIdx].materials?.[matIdx];
    if (material?.id && !material.isNew) {
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
      updated[subjectIdx] = {
        ...updated[subjectIdx],
        materials: updated[subjectIdx].materials.filter((_, i) => i !== matIdx),
      };
      return updated;
    });
  };

  // Stores the picked File in `newFile` — never overwrites the `file` string path
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    subjectIdx: number,
    matIdx: number,
  ) => {
    const picked = e.target.files?.[0];
    if (picked) {
      updateMaterial(subjectIdx, matIdx, "newFile", picked);
      updateMaterial(subjectIdx, matIdx, "fileChanged", true);
    }
  };

  // ── Save a single material ────────────────────────────────────────────
  //
  // API routing:
  //   "file" + newFile picked  → multipart via updateSubMaterialImgApi
  //                              (FormData with real File object)
  //   "file" + no new file     → JSON via updateSubMaterialApi
  //                              (include `file: material.file` so the backend
  //                               satisfies its "'url' or 'file' must be provided" check)
  //   "url"                    → JSON via updateSubMaterialApi with `url`

  const saveMaterial = async (subjectIdx: number, matIdx: number) => {
    const subject  = subjects[subjectIdx];
    const material = subject.materials?.[matIdx];

    if (!material || !material.title.trim() || !material.type) {
      toast.error("Material title and type are required");
      return;
    }
    if (material.inputType === "url" && !material.url?.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    if (material.inputType === "file" && !material.newFile && !material.file) {
      toast.error("Please select a file");
      return;
    }
    if (!material.inputType) {
      toast.error("Please select URL or File Upload");
      return;
    }
    if (!subject.id) {
      toast.error("Save the subject first");
      return;
    }
    if (material.isNew || !material.id) {
      toast.error("Creating new materials is not supported");
      return;
    }

    const titleChanged = material.title       !== material.originalTitle;
    const typeChanged  = material.type        !== material.originalType;
    const descChanged  = material.description !== material.originalDescription;
    const urlChanged   = material.inputType === "url" && material.url !== material.originalUrl;
    const fileChanged  = material.fileChanged === true;

    if (!titleChanged && !typeChanged && !descChanged && !urlChanged && !fileChanged) {
      toast.info("No changes to save");
      return;
    }

    try {
      let updated: any;

      if (material.inputType === "file" && fileChanged && material.newFile) {
        // ── New file picked → multipart ───────────────────────────────────
        const formData = new FormData();
        formData.append("title",       material.title);
        formData.append("type",        material.type);
        formData.append("subject",     subject.id.toString());
        formData.append("description", material.description || "");
        formData.append("file",        material.newFile);          // real File object ✓
        updated = await updateSubMaterialImgApi(material.id, formData);

      } else if (material.inputType === "file") {
        // ── Metadata-only change, existing file → JSON ────────────────────
        // Pass the existing `file` string path so the backend's
        // "'url' or 'file' must be provided" validation passes.
        updated = await updateSubMaterialApi(material.id, {
          title:       material.title,
          type:        material.type,
          subject:     subject.id,
          description: material.description || "",
          file:        material.file,                              // existing path ✓
        });

      } else {
        // ── URL material → JSON ───────────────────────────────────────────
        updated = await updateSubMaterialApi(material.id, {
          title:       material.title,
          type:        material.type,
          subject:     subject.id,
          description: material.description || "",
          url:         material.url!.trim(),                       // url ✓
        });
      }

      setSubjects((prev) => {
        const copy = [...prev];
        const mats = [...copy[subjectIdx].materials];
        mats[matIdx] = {
          ...mats[matIdx],
          ...updated,
          originalFile:        updated.file,
          originalUrl:         updated.url,
          originalTitle:       updated.title,
          originalType:        updated.type,
          originalDescription: updated.description,
          newFile:             null,
          fileChanged:         false,
          isNew:               false,
        };
        copy[subjectIdx] = { ...copy[subjectIdx], materials: mats };
        return copy;
      });

      toast.success("Material updated!");
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to save material"));
    }
  };

  // ── Save all & complete ───────────────────────────────────────────────

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await updateCourseApi(course.id, buildCoursePayload());

      for (const subject of subjects) {
        if (!subject.name.trim() || subject.isNew || !subject.id) continue;
        await updateCourseSubApi(subject.id, { name: subject.name.trim() });

        for (const material of subject.materials || []) {
          if (!material.title.trim() || !material.type || !material.inputType) continue;
          if (material.isNew || !material.id) continue;
          if (material.inputType === "url" && !material.url?.trim()) continue;
          if (material.inputType === "file" && !material.newFile && !material.file) continue;

          const titleChanged = material.title       !== material.originalTitle;
          const typeChanged  = material.type        !== material.originalType;
          const descChanged  = material.description !== material.originalDescription;
          const urlChanged   = material.inputType === "url" && material.url !== material.originalUrl;
          const fileChanged  = material.inputType === "file" && !!material.newFile;

          if (!titleChanged && !typeChanged && !descChanged && !urlChanged && !fileChanged) continue;

          if (material.inputType === "file" && fileChanged && material.newFile) {
            // New file → multipart
            const formData = new FormData();
            formData.append("title",       material.title);
            formData.append("type",        material.type);
            formData.append("subject",     String(subject.id));
            formData.append("description", material.description || "");
            formData.append("file",        material.newFile);
            await updateSubMaterialImgApi(material.id, formData);

          } else if (material.inputType === "file") {
            // Metadata-only → JSON with existing file path
            await updateSubMaterialApi(material.id, {
              title:       material.title,
              type:        material.type,
              subject:     subject.id,
              description: material.description || "",
              file:        material.file,                          // existing path ✓
            });

          } else {
            // URL → JSON
            await updateSubMaterialApi(material.id, {
              title:       material.title,
              type:        material.type,
              subject:     subject.id,
              description: material.description || "",
              url:         material.url!.trim(),
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

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Course</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Update course info, subjects, and materials.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-3">

        {/* ── Section 1: Course Info ─────────────────────────────────── */}
        <Section index={1} title="Course Info" status={courseFieldStatus}>
          <div className="space-y-3">

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={courseNameRef}
                type="text"
                value={courseName}
                onChange={(e) => { setCourseName(e.target.value); setCourseFieldStatus("idle"); }}
                onBlur={saveCourseInfo}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCourseInfo(); } }}
                placeholder="Course name — press Enter to save"
                className={inputCls}
              />
            </div>

            {isAdminOrSuperAdmin && (
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Trainer
                </label>
                <select
                  value={selectedTrainer ?? ""}
                  onChange={(e) => {
                    setSelectedTrainer(e.target.value ? Number(e.target.value) : null);
                    setCourseFieldStatus("idle");
                  }}
                  onBlur={saveCourseInfo}
                  className={inputCls}
                >
                  <option value="">Select trainer</option>
                  {trainers.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </Section>

        {/* ── Section 2: Subjects & Materials ───────────────────────── */}
        <Section
          index={2}
          title="Subjects & Materials"
          action={
            <button
              type="button"
              onClick={addSubject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon /> Add Subject
            </button>
          }
        >
          {subjects.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">No subjects yet. Click "Add Subject" to begin.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subjects.map((subject, si) => (
                <div
                  key={subject.id ?? `new-${si}`}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >

                  {/* Subject row */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50">
                    <button type="button" onClick={() => toggleExpand(si)} className="p-0.5 shrink-0">
                      <ChevronRightIcon open={expandedSubjects.includes(si)} />
                    </button>

                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => updateSubjectName(si, e.target.value)}
                      onBlur={() => saveSubjectName(si)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveSubjectName(si); } }}
                      placeholder="Subject name — press Enter to save"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400"
                    />

                    <StatusBadge status={subjectStatuses[si] || "idle"} />

                    <button
                      type="button"
                      onClick={() => addMaterial(si)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Add material"
                    >
                      <PlusIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSubject(si)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove subject"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  {/* Materials */}
                  {expandedSubjects.includes(si) && (
                    <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                      {subject.materials.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">No materials. Click + to add.</p>
                      ) : (
                        subject.materials.map((material, mi) => (
                          <div
                            key={material.id ?? `newmat-${mi}`}
                            className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 space-y-2"
                          >

                            {/* Title + type + delete */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={material.title}
                                onChange={(e) => updateMaterial(si, mi, "title", e.target.value)}
                                placeholder="Material title"
                                className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400"
                              />
                              <select
                                value={material.type}
                                onChange={(e) => updateMaterial(si, mi, "type", e.target.value)}
                                className="w-40 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              >
                                <option value="">Type</option>
                                {materialTypes.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeMaterial(si, mi)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <TrashIcon />
                              </button>
                            </div>

                            {/* URL / File toggle */}
                            <div className="flex gap-2">
                              {(["url", "file"] as const).map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    updateMaterial(si, mi, "inputType", type);
                                    if (type === "url") {
                                      updateMaterial(si, mi, "newFile", null);
                                      updateMaterial(si, mi, "fileChanged", false);
                                    } else {
                                      updateMaterial(si, mi, "url", null);
                                    }
                                  }}
                                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                                    material.inputType === type
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"
                                  }`}
                                >
                                  {type === "url" ? "URL" : "File Upload"}
                                </button>
                              ))}
                            </div>

                            {/* URL input */}
                            {material.inputType === "url" && (
                              <input
                                type="url"
                                value={material.url || ""}
                                onChange={(e) => updateMaterial(si, mi, "url", e.target.value)}
                                placeholder="https://example.com/resource"
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400"
                              />
                            )}

                            {/* File input */}
                            {material.inputType === "file" && (
                              <div>
                                <label
                                  htmlFor={`mat-file-${si}-${mi}`}
                                  className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                                >
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {material.newFile
                                      ? material.newFile.name                           // new pick
                                      : material.file
                                        ? "Current: " + material.file.split("/").pop()  // existing
                                        : "Click to choose file"}
                                  </span>
                                </label>
                                <input
                                  id={`mat-file-${si}-${mi}`}
                                  type="file"
                                  onChange={(e) => handleFileChange(e, si, mi)}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.txt,.zip,.mp4,.jpg,.png"
                                />
                                {material.file && !material.newFile && (
                                  <p className="text-xs text-green-600 mt-1">✓ Current file will be kept</p>
                                )}
                                {material.newFile && (
                                  <p className="text-xs text-blue-600 mt-1">New file selected — will replace current</p>
                                )}
                              </div>
                            )}

                            {/* Update button — existing materials only */}
                            {!material.isNew && (
                              <button
                                type="button"
                                onClick={() => saveMaterial(si, mi)}
                                className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Update Material
                              </button>
                            )}

                          </div>
                        ))
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </Section>

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? <><SpinnerIcon /> Saving…</> : "Save Changes →"}
        </button>
      </div>

    </div>
  );
};

export default EditCourse;