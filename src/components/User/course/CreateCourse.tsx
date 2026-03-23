import { useEffect, useRef, useState, memo, useCallback } from "react";
import { toast } from "react-toastify";
import {
  contactApi,
  createCourseApi,
  createCourseSubApi,
  createSubMaterialApi,
  createSubMaterialImgApi,
  getRoleUsers,
} from "../../../api";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import { getUserRole } from "../../../config/constants";

interface Course {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  course: number;
}

interface MaterialType {
  value: string;
  label: string;
}

interface CreateCoursePayload {
  name: string;
  created_by?: number;
}

interface CreateCourseFlowProps {
  selectedCourse?: Course | null;
  selectedSubject?: Subject | null;
  onComplete: () => void;
  onCancel: () => void;
}

type SectionStatus = "idle" | "saving" | "saved" | "error";

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

const CreateCourse = memo(
  ({
    selectedCourse = null,
    selectedSubject = null,
    onComplete,
    onCancel,
  }: CreateCourseFlowProps) => {
    const userRole = getUserRole("admin");
    const isAdminOrSuperAdmin =
      userRole === "super_admin" || userRole === "admin";

    // ── Course ─────────────────────────────────────────────────────────────
    const [courseName, setCourseName] = useState(selectedCourse?.name ?? "");
    const [createdCourse, setCreatedCourse] = useState<Course | null>(
      selectedCourse,
    );
    const [courseStatus, setCourseStatus] = useState<SectionStatus>(
      selectedCourse ? "saved" : "idle",
    );
    const [trainers, setTrainers] = useState<
      { value: number; label: string }[]
    >([]);
    const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null);

    // ── Subject ────────────────────────────────────────────────────────────
    const [subjectName, setSubjectName] = useState(selectedSubject?.name ?? "");
    const [createdSubject, setCreatedSubject] = useState<Subject | null>(
      selectedSubject,
    );
    const [subjectStatus, setSubjectStatus] = useState<SectionStatus>(
      selectedSubject ? "saved" : "idle",
    );

    // ── Material ───────────────────────────────────────────────────────────
    const [materialTitle, setMaterialTitle] = useState("");
    const [materialDocumentType, setMaterialDocumentType] = useState("");
    const [materialDocumentTypes, setMaterialDocumentTypes] = useState<
      MaterialType[]
    >([]);
    const [inputType, setInputType] = useState<"url" | "file" | "">("");
    const [contentUrl, setContentUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");
    const [materialStatus, setMaterialStatus] = useState<SectionStatus>("idle");

    const [errors, setErrors] = useState<Record<string, string>>({});

    const courseInputRef = useRef<HTMLInputElement>(null);
    const subjectInputRef = useRef<HTMLInputElement>(null);

    // Course is locked once saved
    const courseLocked = courseStatus === "saved";
    // Subject is unlocked once course is saved
    const subjectUnlocked = courseLocked;
    const subjectLocked = subjectStatus === "saved";
    // Material is unlocked once subject is saved
    const materialUnlocked = subjectLocked;

    // Memoize fetch functions to prevent unnecessary re-renders
    const fetchMaterialDocumentTypes = useCallback(async () => {
      try {
        const response = await contactApi();
        setMaterialDocumentTypes(response.material_document_type || []);
      } catch (error) {
        toast.error(handleAxiosError(error, "Failed to fetch types"));
      }
    }, []);

    const fetchTrainers = useCallback(async () => {
      try {
        const response = await getRoleUsers("trainer");
        const data = response?.data?.results || [];
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
      if (isAdminOrSuperAdmin) fetchTrainers();
      fetchMaterialDocumentTypes();
    }, [isAdminOrSuperAdmin, fetchTrainers, fetchMaterialDocumentTypes]);

    // Auto-focus course input on mount (if not pre-filled)
    useEffect(() => {
      if (!selectedCourse) {
        // Use setTimeout to ensure focus happens after render
        setTimeout(() => courseInputRef.current?.focus(), 100);
      } else if (!selectedSubject) {
        setTimeout(() => subjectInputRef.current?.focus(), 100);
      }
    }, [selectedCourse, selectedSubject]);

    // ── Course save ──────────────────────────────────────────────────────
    const saveCourse = useCallback(async () => {
      if (courseLocked || !courseName.trim()) return;
      if (isAdminOrSuperAdmin && !selectedTrainer) {
        setErrors((e) => ({ ...e, trainer: "Please select a trainer first" }));
        return;
      }

      setCourseStatus("saving");
      setErrors((e) => ({ ...e, course: "", trainer: "" }));

      try {
        const payload: CreateCoursePayload = { name: courseName.trim() };
        if (isAdminOrSuperAdmin && selectedTrainer)
          payload.created_by = selectedTrainer;

        const response = await createCourseApi(payload);
        const newCourse = response?.data || response;
        if (!newCourse?.id) throw new Error("Invalid response");

        setCreatedCourse(newCourse);
        setCourseStatus("saved");
        toast.success("Course created!");
        // Auto-focus subject after course saved
        setTimeout(() => subjectInputRef.current?.focus(), 100);
      } catch (error) {
        setCourseStatus("error");
        toast.error(handleAxiosError(error, "Failed to create course"));
      }
    }, [courseName, courseLocked, isAdminOrSuperAdmin, selectedTrainer]);

    const handleCourseKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveCourse();
        }
      },
      [saveCourse],
    );

    // ── Subject save ─────────────────────────────────────────────────────
    const saveSubject = useCallback(async () => {
      if (subjectLocked || !subjectName.trim() || !createdCourse?.id) return;

      setSubjectStatus("saving");
      setErrors((e) => ({ ...e, subject: "" }));

      try {
        const response = await createCourseSubApi({
          name: subjectName.trim(),
          course: createdCourse.id,
        });
        const newSubject = response?.data || response;
        setCreatedSubject(newSubject);
        setSubjectStatus("saved");
        toast.success("Subject created!");
      } catch (error) {
        setSubjectStatus("error");
        toast.error(handleAxiosError(error, "Failed to create subject"));
      }
    }, [subjectName, subjectLocked, createdCourse]);

    const handleSubjectKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveSubject();
        }
      },
      [saveSubject],
    );

    // ── Material save ─────────────────────────────────────────────────────
    const isValidUrl = useCallback((url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }, []);

    const validateMaterial = useCallback(() => {
      const newErrors: Record<string, string> = {};
      if (!materialTitle.trim()) newErrors.title = "Title is required";
      if (!materialDocumentType)
        newErrors.materialDocumentType = "Select a document type";
      if (!inputType) newErrors.inputType = "Choose how to provide content";
      if (inputType === "url" && !contentUrl.trim())
        newErrors.contentUrl = "URL is required";
      if (inputType === "url" && contentUrl && !isValidUrl(contentUrl))
        newErrors.contentUrl = "Enter a valid URL";
      if (inputType === "file" && !selectedFile)
        newErrors.file = "Select a file";
      setErrors((e) => ({ ...e, ...newErrors }));
      return Object.keys(newErrors).length === 0;
    }, [
      materialTitle,
      materialDocumentType,
      inputType,
      contentUrl,
      selectedFile,
      isValidUrl,
    ]);

    const handleCreateMaterial = useCallback(async () => {
      if (!validateMaterial() || !createdSubject) return;
      setMaterialStatus("saving");

      try {
        const subjectIdNum = createdSubject.id;

        if (inputType === "url") {
          await createSubMaterialApi({
            title: materialTitle,
            type: materialDocumentType,
            subject: subjectIdNum,
            url: contentUrl,
          });
        } else {
          const formData = new FormData();
          formData.append("title", materialTitle);
          formData.append("type", materialDocumentType);
          formData.append("subject", subjectIdNum.toString());
          formData.append("file", selectedFile as File);
          await createSubMaterialImgApi(formData);
        }

        setMaterialStatus("saved");
        toast.success("Material created!");
        onComplete();
      } catch (error) {
        setMaterialStatus("error");
        toast.error(handleAxiosError(error, "Failed to create material"));
      }
    }, [
      materialTitle,
      materialDocumentType,
      inputType,
      contentUrl,
      selectedFile,
      createdSubject,
      validateMaterial,
      onComplete,
    ]);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          setSelectedFile(file);
          setFileName(file.name);
          setErrors((e) => ({ ...e, file: "" }));
        }
      },
      [],
    );

    // ── Status badge ──────────────────────────────────────────────────────
    const StatusBadge = useCallback(({ status }: { status: SectionStatus }) => {
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
    }, []);

    // ── Section wrapper ───────────────────────────────────────────────────
    const Section = useCallback(
      ({
        index,
        title,
        locked,
        unlocked,
        status,
        children,
      }: {
        index: number;
        title: string;
        locked: boolean;
        unlocked: boolean;
        status: SectionStatus;
        children: React.ReactNode;
      }) => (
        <div
          className={`relative rounded-xl border transition-all duration-300 ${
            locked
              ? "border-green-200 dark:border-green-800/40 bg-green-50/40 dark:bg-green-900/10"
              : unlocked
                ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
                : "border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 opacity-50 pointer-events-none"
          }`}
        >
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    locked
                      ? "bg-green-500 text-white"
                      : unlocked
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  {locked ? <CheckIcon /> : index}
                </span>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {title}
                </h3>
              </div>
              <StatusBadge status={status} />
            </div>
            {children}
          </div>
        </div>
      ),
      [StatusBadge],
    );

    return (
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              New Course
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Fill each section — it saves automatically on Enter or click away.
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
          {/* ── Section 1: Course ───────────────────────────────────────── */}
          <Section
            index={1}
            title="Course"
            locked={courseLocked}
            unlocked
            status={courseStatus}
          >
            {courseLocked ? (
              <p className="text-sm mb-3 font-medium text-gray-700 dark:text-gray-300">
                {createdCourse?.name}
              </p>
            ) : (
              <div className="flex gap-2 items-center mb-3">
                <input
                  ref={courseInputRef}
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  onBlur={saveCourse}
                  onKeyDown={handleCourseKeyDown}
                  placeholder="Course name — press Enter to save"
                  className={`flex-1 px-3 py-2 text-sm border ${
                    errors.course
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400`}
                  disabled={courseStatus === "saving"}
                />
              </div>
            )}
            {errors.course && (
              <p className="mt-1 text-xs text-red-500">{errors.course}</p>
            )}
            {isAdminOrSuperAdmin && !courseLocked && (
              <div className="mb-3">
                <select
                  value={selectedTrainer ?? ""}
                  onChange={(e) => {
                    setSelectedTrainer(
                      e.target.value ? parseInt(e.target.value) : null,
                    );
                    setErrors((er) => ({ ...er, trainer: "" }));
                  }}
                  className={`w-full px-3 py-2 text-sm border ${
                    errors.trainer
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white`}
                >
                  <option value="">Select trainer</option>
                  {trainers.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {errors.trainer && (
                  <p className="mt-1 text-xs text-red-500">{errors.trainer}</p>
                )}
              </div>
            )}
          </Section>

          {/* ── Section 2: Subject ──────────────────────────────────────── */}
          <Section
            index={2}
            title="Subject"
            locked={subjectLocked}
            unlocked={subjectUnlocked}
            status={subjectStatus}
          >
            {subjectLocked ? (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {createdSubject?.name}
              </p>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  ref={subjectInputRef}
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  onBlur={saveSubject}
                  onKeyDown={handleSubjectKeyDown}
                  placeholder="Subject name — press Enter to save"
                  className={`flex-1 px-3 py-2 text-sm border ${
                    errors.subject
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400`}
                  disabled={subjectStatus === "saving"}
                />
              </div>
            )}
            {errors.subject && (
              <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
            )}
          </Section>

          {/* ── Section 3: Material ─────────────────────────────────────── */}
          <Section
            index={3}
            title="Material"
            locked={materialStatus === "saved"}
            unlocked={materialUnlocked}
            status={materialStatus}
          >
            <div className="space-y-3">
              {/* Title */}
              <div>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => {
                    setMaterialTitle(e.target.value);
                    setErrors((er) => ({ ...er, title: "" }));
                  }}
                  placeholder="Material title"
                  className={`w-full px-3 py-2 text-sm border ${
                    errors.title
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400`}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Document type */}
              <div>
                <select
                  value={materialDocumentType}
                  onChange={(e) => {
                    setMaterialDocumentType(e.target.value);
                    setErrors((er) => ({ ...er, materialDocumentType: "" }));
                  }}
                  className={`w-full px-3 py-2 text-sm border ${
                    errors.materialDocumentType
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white`}
                >
                  <option value="">Document type</option>
                  {materialDocumentTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.materialDocumentType && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.materialDocumentType}
                  </p>
                )}
              </div>

              {/* Input type toggle */}
              <div className="flex gap-2">
                {(["url", "file"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setInputType(type);
                      setErrors((er) => ({
                        ...er,
                        inputType: "",
                        contentUrl: "",
                        file: "",
                      }));
                      if (type === "url") {
                        setSelectedFile(null);
                        setFileName("");
                      } else setContentUrl("");
                    }}
                    className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-all ${
                      inputType === type
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {type === "url" ? "URL" : "File Upload"}
                  </button>
                ))}
              </div>
              {errors.inputType && (
                <p className="text-xs text-red-500">{errors.inputType}</p>
              )}

              {/* URL input */}
              {inputType === "url" && (
                <div>
                  <input
                    type="url"
                    value={contentUrl}
                    onChange={(e) => {
                      setContentUrl(e.target.value);
                      setErrors((er) => ({ ...er, contentUrl: "" }));
                    }}
                    placeholder="https://example.com/resource"
                    className={`w-full px-3 py-2 text-sm border ${
                      errors.contentUrl
                        ? "border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400`}
                  />
                  {errors.contentUrl && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.contentUrl}
                    </p>
                  )}
                </div>
              )}

              {/* File upload */}
              {inputType === "file" && (
                <div>
                  <label
                    htmlFor="material-file"
                    className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      errors.file
                        ? "border-red-400 bg-red-50 dark:bg-red-900/10"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                    }`}
                  >
                    <span className="text-xl">📄</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {fileName ||
                        "Click to choose file (.pdf, .doc, .mp4, .jpg…)"}
                    </span>
                  </label>
                  <input
                    id="material-file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.zip,.mp4,.jpg,.png"
                  />
                  {errors.file && (
                    <p className="mt-1 text-xs text-red-500">{errors.file}</p>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleCreateMaterial}
                disabled={materialStatus === "saving"}
                className="w-full py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {materialStatus === "saving" ? (
                  <>
                    <SpinnerIcon /> Saving…
                  </>
                ) : (
                  "Save Material & Go to Course →"
                )}
              </button>
            </div>
          </Section>
        </div>
      </div>
    );
  },
);

// Add display name for better debugging
CreateCourse.displayName = "CreateCourse";

export default CreateCourse;
