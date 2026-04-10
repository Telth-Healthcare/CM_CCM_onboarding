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

const getDraftKey = (userId?: number) =>
  userId ? `admin_ccm_draft_pk_${userId}` : "admin_ccm_draft_pk";

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

export const useOnboardForm = (
  currentId: string, 
  currentIndex: number,
  targetUserId?: number,
  useRouting = true,
  roleFilter?: string,
) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CCMFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [appId, setAppId] = useState<number | null>(null);
  const [refNumber, setRefNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inlineStepIndex, setInlineStepIndex] = useState(0);
  const [userId, setUserId] = useState<number | undefined>(targetUserId);
  const [shgId, setSHGId] = useState<number | undefined>(0);

  const currentStepIndex = useRouting ? currentIndex : inlineStepIndex;
  const currentStepId = useRouting
    ? currentId
    : (STEPS[inlineStepIndex]?.id ?? "personal-info");

  const updateFormData = useCallback((field: keyof CCMFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleReplace = useCallback(
    (urlField: keyof CCMFormData) => {
      updateFormData(urlField, null);
    },
    [updateFormData],
  );

  const hydrateFromApi = useCallback((record: any, pk: number) => {
    const docs: Record<string, string> = {};
    record.documents?.forEach((d: any) => {
      docs[d.document_type] = d.file;
    });

    setAppId(pk);
    setSHGId(record?.user?.id ?? undefined);
    setFormData((prev) => ({
      ...prev,
      firstName: record.user?.first_name ?? prev.firstName,
      lastName: record.user?.last_name ?? prev.lastName,
      mobile: (() => {
        const phone = record.user?.phone;
        if (!phone) return prev.mobile;
        return phone
          .replace(/^\+?91/, "")
          .replace(/\D/g, "")
          .slice(0, 10);
      })(),
      email: record.user?.email ?? prev.email,
      dob: record.dob ?? prev.dob,
      gender: record.gender ?? prev.gender,
      bloodGroup: record.blood_group ?? prev.bloodGroup,
      manager: record.user?.manager_name != null ? String(record.manager) : prev.manager,
      language: record.language ?? prev.language,
      maritalStatus: record.marital_status ?? prev.maritalStatus,
      addressLine1: record.address_line_1 ?? prev.addressLine1,
      addressLine2: record.address_line_2 ?? prev.addressLine2,
      city: record.district ?? prev.city,
      state: record.state ?? prev.state,
      zipcode: record.pin_code ?? prev.zipcode,
      country: record.country ?? prev.country,
      aadharFrontUrl: docs["aadhar_front"] ?? prev.aadharFrontUrl,
      aadharBackUrl: docs["aadhar_back"] ?? prev.aadharBackUrl,
      panUrl: docs["pan"] ?? prev.panUrl,
      bachelorDegreeType:
        record.bachelor_degree_type ?? prev.bachelorDegreeType,
      bachelorDocUrl: docs["bachelor_certificate"] ?? prev.bachelorDocUrl,
      masterDegreeType: record.master_degree_type ?? prev.masterDegreeType,
      masterDocUrl: docs["master_certificate"] ?? prev.masterDocUrl,
      experienceCertType:
        record.experience_cert_type ?? prev.experienceCertType,
      experienceCertDocUrl:
        docs["experience_certificate"] ?? prev.experienceCertDocUrl,
    }));

    return docs;
  }, []);

  const applyResumeStep = useCallback(
    (resumeStep: string) => {
      if (useRouting) {
        navigate(`/onboardProcess/${resumeStep}`, { replace: true });
      } else {
        const idx = STEPS.findIndex((s) => s.id === resumeStep);
        if (idx >= 0) setInlineStepIndex(idx);
      }
    },
    [useRouting, navigate],
  );

  useEffect(() => {
    const draftKey = getDraftKey(targetUserId);

    if (targetUserId) {
      // ── EDIT MODE ──────────────────────────────────────────────────────────
      const savedPk = localStorage.getItem(draftKey);
      const cachedPk = savedPk ? parseInt(savedPk, 10) : null;

      if (cachedPk && !isNaN(cachedPk)) {
        getOnboardApi(cachedPk)
          .then((data) => {
            const record = Array.isArray(data) ? data[0] : data;
            if (!record) return;
            const docs = hydrateFromApi(record, cachedPk);
            applyResumeStep(getResumeStep(record, docs));
          })
          .catch(() => {
            localStorage.removeItem(draftKey);
            toast.error("Could not load onboarding data. Please re-open.");
          })
          .finally(() => setIsInitialized(true));
      } else {
        getOnboardApi(targetUserId)
          .then((data) => {
            const record = Array.isArray(data) ? data[0] : data;
            if (!record) return; // no onboard record yet → blank form is correct

            const pk: number = record.id ?? record.pk;
            if (pk) localStorage.setItem(draftKey, String(pk));

            const docs = hydrateFromApi(record, pk);
            applyResumeStep(getResumeStep(record, docs));
          })
          .catch(() => {
          })
          .finally(() => setIsInitialized(true));
      }
      return;
    }

    // ── CREATE MODE ────────────────────────────────────────────────────────
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

    getOnboardApi(pk)
      .then((data) => {
        if (data.is_submitted) {
          toast.info("This CCM onboarding is already submitted.");
          return;
        }
        const docs = hydrateFromApi(data, pk);
        applyResumeStep(getResumeStep(data, docs));
      })
      .catch(() => {
        localStorage.removeItem(draftKey);
        toast.error("Could not restore draft. Starting fresh.");
      })
      .finally(() => setIsInitialized(true));
  }, [targetUserId]);

  // ── Save progress ─────────────────────────────────────────────────────────
  const saveProgress = async (): Promise<number | null> => {
    let currentUserId = userId || targetUserId;

    if (!currentUserId) {
      const invitePayload: SendInvitationRequest = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: `+91${formData.mobile}`,
        roles: [roleFilter || "-"],
        ...(formData.manager ? { manager: Number(formData.manager) } : {}),
      };
      try {
        const response = await sendInvitationApi([invitePayload]);
        if (response?.data?.[0]?.id) {
          currentUserId = response.data[0].id;
          setUserId(currentUserId);
        }
      } catch (err: any) {
        toast.error(handleAxiosError(err, "Failed to send invitation"));
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
      user: targetUserId ?? currentUserId,
      ...(formData.manager ? { manager: Number(formData.manager) } : {}),
    };

    const clean = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        if (key === "user") return true;
        return value !== undefined && value !== null && value !== "";
      }),
    );

    setSaving(true);
    try {
      const draftKey = getDraftKey(targetUserId ?? currentUserId);
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

  const goToStep = (idx: number) => {
    if (useRouting) {
      navigate(`/onboardProcess/${STEPS[idx].id}`);
    } else {
      setInlineStepIndex(idx);
    }
  };

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

  const handlePrev = () => {
    if (currentStepIndex > 0) goToStep(currentStepIndex - 1);
  };

  const handleSubmit = async () => {
    const submitUserId = shgId || userId;
    if (!submitUserId) {
      toast.error("No CCM user linked to this onboarding. Please restart.");
      return;
    }

    setSaving(true);
    try {
      const response = await submitOnboardApi(submitUserId);
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
