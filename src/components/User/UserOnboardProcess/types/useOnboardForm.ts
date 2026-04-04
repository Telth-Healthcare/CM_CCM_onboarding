import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CCMFormData, FormErrors } from "./Types";
import { INITIAL_FORM_DATA, STEPS } from "./Constants";
import {
  createOnboardApi,
  getOnboardApi,
  sendInvitationApi,
  SendInvitationRequest,
  submitOnboardApi,
  updateOnboardApi,
  uploadOnboardDocumentApi,
} from "../../../../api";
import { validateStep } from "./Validation";
import { handleAxiosError } from "../../../../utils/handleAxiosError";

// ── LocalStorage draft key — scoped to the target CCM user ───────────────────
const getDraftKey = (userId?: number) =>
  userId ? `admin_ccm_draft_pk_${userId}` : "admin_ccm_draft_pk";

// ── Smart resume: find first incomplete step ──────────────────────────────────
const getResumeStep = (data: any, docs: Record<string, string>): string => {
  const hasPersonal =
    data.user?.first_name &&
    data.user?.last_name &&
    data.dob &&
    data.gender &&
    data.blood_group &&
    data.language &&
    data.user?.phone &&
    data.user?.email;
  if (!hasPersonal) return "personal-info";

  const hasAddress =
    data.address_line_1 && data.district && data.state && data.pin_code;
  if (!hasAddress) return "address-info";

  const hasDocs = docs["aadhar_front"] && docs["aadhar_back"] && docs["pan"];
  if (!hasDocs) return "personal-documents";

  if (!docs["bachelor_certificate"]) return "education-documents";

  return "preview";
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useOnboardForm = (
  currentId: string, // from URL (ignored in inline mode)
  currentIndex: number, // from URL (ignored in inline mode)
  targetUserId?: number, // the CCM user being onboarded
  useRouting = true, // false = inline inside ViewCCMList
) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CCMFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [appId, setAppId] = useState<number | null>(null);
  const [refNumber, setRefNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // inline-mode only — tracks current step without touching the URL
  const [inlineStepIndex, setInlineStepIndex] = useState(0);
  const [userId, setUserId] = useState<number | undefined>(targetUserId);

  // Unified step accessors regardless of mode
  const currentStepIndex = useRouting ? currentIndex : inlineStepIndex;
  const currentStepId = useRouting
    ? currentId
    : (STEPS[inlineStepIndex]?.id ?? "personal-info");

  // ── Update a single field ─────────────────────────────────────────────────
  const updateFormData = useCallback((field: keyof CCMFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // ── Replace a doc — clears saved URL so upload zone re-opens ─────────────
  const handleReplace = useCallback(
    (urlField: keyof CCMFormData) => {
      updateFormData(urlField, null);
    },
    [updateFormData],
  );

  // ── Init: restore existing draft from backend if one exists ──────────────
  useEffect(() => {
    const draftKey = getDraftKey(targetUserId);
    const savedPk = localStorage.getItem(draftKey);

    if (!savedPk) {
      setIsInitialized(true);
      return;
    }

    const pk = parseInt(savedPk, 10);
    if (isNaN(pk)) {
      localStorage.removeItem(draftKey);
      setIsInitialized(true);
      return;
    }

    setAppId(pk);

    getOnboardApi(pk)
      .then((data) => {
        if (data.is_submitted) {
          toast.info("This CCM onboarding is already submitted.");
          setIsInitialized(true);
          return;
        }

        const docs: Record<string, string> = {};
        data.documents?.forEach((d: any) => {
          docs[d.document_type] = d.file;
        });

        setFormData((prev) => ({
          ...prev,
          firstName: data.user?.first_name ?? prev.firstName,
          lastName: data.user?.last_name ?? prev.lastName,
          mobile: (() => {
            const phone = data.user?.phone;
            if (!phone) return prev.mobile;
            return phone.startsWith("+91") ? phone : `+91${phone}`;
          })(),
          email: data.user?.email ?? prev.email,
          dob: data.dob ?? prev.dob,
          gender: data.gender ?? prev.gender,
          bloodGroup: data.blood_group ?? prev.bloodGroup,
          language: data.language ?? prev.language,
          maritalStatus: data.marital_status ?? prev.maritalStatus,
          addressLine1: data.address_line_1 ?? prev.addressLine1,
          addressLine2: data.address_line_2 ?? prev.addressLine2,
          city: data.district ?? prev.city,
          state: data.state ?? prev.state,
          zipcode: data.pin_code ?? prev.zipcode,
          country: data.country ?? prev.country,
          aadharFrontUrl: docs["aadhar_front"] ?? prev.aadharFrontUrl,
          aadharBackUrl: docs["aadhar_back"] ?? prev.aadharBackUrl,
          panUrl: docs["pan"] ?? prev.panUrl,
          bachelorDocUrl: docs["bachelor_certificate"] ?? prev.bachelorDocUrl,
          masterDocUrl: docs["master_certificate"] ?? prev.masterDocUrl,
          experienceCertDocUrl:
            docs["experience_certificate"] ?? prev.experienceCertDocUrl,
        }));

        const resumeStep = getResumeStep(data, docs);
        if (useRouting) {
          navigate(`/onboardProcess/${resumeStep}`, { replace: true });
        } else {
          const idx = STEPS.findIndex((s) => s.id === resumeStep);
          if (idx >= 0) setInlineStepIndex(idx);
        }
      })
      .catch(() => {
        localStorage.removeItem(draftKey);
        toast.error("Could not restore draft. Starting fresh.");
      })
      .finally(() => setIsInitialized(true));
  }, [targetUserId]); // eslint-disable-line react-hooks/exhaustive-deps

const saveProgress = async (): Promise<number | null> => {
  let currentUserId = userId || targetUserId;
  
  // Only send invitation if we don't already have a userId
  if (!currentUserId) {
    const invitatepayload: SendInvitationRequest = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: `+91${formData.mobile}`,
      roles: ["ccm"],
    };
    
    try {
      const response = await sendInvitationApi([invitatepayload]);
      
      if (response?.data?.[0]?.id) {
        currentUserId = response.data[0].id;
        setUserId(currentUserId); // Update state
      }
    } catch (err: any) {
      console.error("Failed to send invitation:", err);
      toast.warning("Could not send invitation, but progress will be saved");
    }
  }
  
  const payload: Record<string, any> = {
    first_name: formData.firstName,
    last_name: formData.lastName,
    dob: formData.dob,
    gender: formData.gender,
    blood_group: formData.bloodGroup,
    language: formData.language,
    marital_status: formData.maritalStatus,
    mobile: formData.mobile?.replace(/^\+91/, ""),
    email: formData.email,
    address_line_1: formData.addressLine1,
    address_line_2: formData.addressLine2,
    district: formData.city,
    state: formData.state,
    pin_code: formData.zipcode,
    country: formData.country,
    user: currentUserId,
  };

  // Override with targetUserId if provided (for admin/editing scenarios)
  if (targetUserId) payload.user = targetUserId;

  // Strip empty / null / undefined (always keep `user`)
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (key === "user") return true;
      return value !== undefined && value !== null && value !== "";
    }),
  );

  setSaving(true);
  try {
    const draftKey = getDraftKey(targetUserId || currentUserId);
    const storedStr = localStorage.getItem(draftKey);
    const existingPk = storedStr ? parseInt(storedStr, 10) : null;

    if (!existingPk || isNaN(existingPk)) {
      const res = await createOnboardApi(clean);
      if (!res?.id && !res?.pk) throw new Error("Server returned no ID");

      const pk: number = res.id ?? res.pk;
      setAppId(pk);
      localStorage.setItem(draftKey, String(pk));
      return pk;
    } else {
      await updateOnboardApi(existingPk, clean);
      setAppId(existingPk);
      return existingPk;
    }
  } catch (err) {
    toast.error(handleAxiosError(err, "Failed to save. Please try again."));
    return null;
  } finally {
    setSaving(false);
  }
};

  // ── Upload documents for the current step ─────────────────────────────────
  const uploadDocuments = async (pk: number): Promise<boolean> => {
    type UploadTask = { file: File; type: string; urlField: keyof CCMFormData };
    const tasks: UploadTask[] = [];

    if (currentStepId === "personal-documents") {
      if (formData.aadharFront && !formData.aadharFrontUrl)
        tasks.push({
          file: formData.aadharFront,
          type: "aadhar_front",
          urlField: "aadharFrontUrl",
        });
      if (formData.aadharBack && !formData.aadharBackUrl)
        tasks.push({
          file: formData.aadharBack,
          type: "aadhar_back",
          urlField: "aadharBackUrl",
        });
      if (formData.pan && !formData.panUrl)
        tasks.push({ file: formData.pan, type: "pan", urlField: "panUrl" });
    }

    if (currentStepId === "education-documents") {
      if (formData.bachelorDoc && !formData.bachelorDocUrl)
        tasks.push({
          file: formData.bachelorDoc,
          type: "bachelor_certificate",
          urlField: "bachelorDocUrl",
        });
      if (formData.masterDoc && !formData.masterDocUrl)
        tasks.push({
          file: formData.masterDoc,
          type: "master_certificate",
          urlField: "masterDocUrl",
        });
      if (formData.experienceCertDoc && !formData.experienceCertDocUrl)
        tasks.push({
          file: formData.experienceCertDoc,
          type: "experience_certificate",
          urlField: "experienceCertDocUrl",
        });
    }

    if (tasks.length === 0) return true;

    setUploading(true);
    try {
      const results = await Promise.allSettled(
        tasks.map((t) => uploadOnboardDocumentApi(t.file, t.type, pk)),
      );

      const failed: string[] = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          const url =
            result.value?.file ??
            result.value?.url ??
            result.value?.data?.file ??
            result.value?.data?.url ??
            null;
          if (url) updateFormData(tasks[i].urlField, url);
        } else {
          failed.push(tasks[i].type.replace(/_/g, " "));
        }
      });

      if (failed.length > 0) {
        toast.error(
          `Failed to upload: ${failed.join(", ")}. Please try again.`,
        );
        return false;
      }
      return true;
    } finally {
      setUploading(false);
    }
  };

  // ── Step navigation — URL routing or inline state ─────────────────────────
  const goToStep = (idx: number) => {
    if (useRouting) {
      navigate(`/onboardProcess/${STEPS[idx].id}`);
    } else {
      setInlineStepIndex(idx);
    }
  };

  // ── Next: validate → save → upload → advance ─────────────────────────────
  const handleNext = async () => {
    const stepErrors = validateStep(currentStepId, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    const pk = await saveProgress();
    if (!pk) return;

    const docsOk = await uploadDocuments(pk);
    if (!docsOk) return;

    if (currentStepIndex < STEPS.length - 1) {
      goToStep(currentStepIndex + 1);
    }
  };

  // ── Prev ──────────────────────────────────────────────────────────────────
  const handlePrev = () => {
    if (currentStepIndex > 0) goToStep(currentStepIndex - 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!userId) {
      toast.error("No CCM user linked to this onboarding. Please restart.");
      return;
    }

    setSaving(true);
    try {
      const response = await submitOnboardApi(userId);
      const reference = response?.reference_number ?? null;

      if (reference) {
        setRefNumber(reference);
      } else {
        toast.success("Onboarding application submitted successfully!");
        if (useRouting) navigate("/ccm-list");
      }
    } catch (err) {
      toast.error(handleAxiosError(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    formData,
    updateFormData,
    errors,
    appId,
    refNumber,
    saving,
    uploading,
    isInitialized,
    currentStepId,
    currentStepIndex,
    handleNext,
    handlePrev,
    handleSubmit,
    handleReplace,
  };
};
