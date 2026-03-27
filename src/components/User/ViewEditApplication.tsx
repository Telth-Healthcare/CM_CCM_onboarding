import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  contactApi,
  getAllUsers,
  getApplicationByIdApi,
  getSHGUserByIdApi,
  updateApplicationStatusApi,
  updateApplicationApi,
  documentVerifyApi,
} from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { getUserRole } from "../../config/constants";
import PageMeta from "../../shared/components/common/PageMeta";
import {
  ArrowLeftIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

interface StatusOption {
  value: string;
  label: string;
}
interface Trainer {
  value: number;
  label: string;
}
interface Financier {
  id: number;
  name: string;
}
interface AppDocument {
  id?: number;
  document_type: string;
  file: string;
  status: string;
}
interface SHGUserData {
  id: number;
  address_line_1: string;
  address_line_2: string;
  blood_group: string;
  country: string;
  created_at: string;
  district: string;
  dob: string;
  documents: AppDocument[];
  gender: string;
  is_submitted: boolean;
  language: string;
  marital_status: string;
  pin_code: string;
  registration_status: string;
  state: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    status: string;
    region: number | null;
    roles: string[];
  };
  village: string;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  training: "Training",
  production: "Production",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  under_review:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  assigned:
    "bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  training:
    "bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  production:
    "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  cancelled: "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  pan: "PAN Card",
  aadhar_front: "Aadhaar (Front)",
  aadhar_back: "Aadhaar (Back)",
  bachelor_certificate: "Bachelor Certificate",
};

const ViewEditApplication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<any>(null);
  const [shgUserData, setShgUserData] = useState<SHGUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    blood_group: "",
    marital_status: "",
    language: "",
    address_line_1: "",
    address_line_2: "",
    village: "",
    district: "",
    state: "",
    pin_code: "",
  });

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [financiers, setFinanciers] = useState<Financier[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<StatusOption[]>([]);
  const [processingForm, setProcessingForm] = useState({
    assigned_trainer: "",
    assigned_financier: "",
    payment_status: "",
    public_notes: "",
    private_notes: "",
  });

  const [docVerifying, setDocVerifying] = useState<Record<number, boolean>>({});

  const userRole = getUserRole("admin");
  const canEdit = userRole === "admin" || userRole === "super_admin";

  useEffect(() => {
    if (id) {
      fetchApplicationDetails(parseInt(id));
      fetchUsers();
      fetchStatusOptions();
    }
  }, [id]);

  const fetchApplicationDetails = async (applicationId: number) => {
    try {
      setLoading(true);
      const response = await getApplicationByIdApi(applicationId);
      setApplication(response);
      setProcessingForm({
        assigned_trainer: response.assigned_trainer?.toString() || "",
        assigned_financier: response.assigned_financier?.toString() || "",
        public_notes: response.public_notes || "",
        private_notes: response.private_notes || "",
        payment_status: response.payment_status || "",
      });
      if (response.shg) fetchSHGUserData(response.shg);
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to fetch application"));
      navigate("/applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchSHGUserData = async (userId: number) => {
    try {
      const response = await getSHGUserByIdApi(userId);
      setShgUserData(response);
      setPersonalForm({
        first_name: response.user.first_name || "",
        last_name: response.user.last_name || "",
        email: response.user.email || "",
        phone: response.user.phone || "",
        dob: response.dob || "",
        gender: response.gender || "",
        blood_group: response.blood_group || "",
        marital_status: response.marital_status || "",
        language: response.language || "",
        address_line_1: response.address_line_1 || "",
        address_line_2: response.address_line_2 || "",
        village: response.village || "",
        district: response.district || "",
        state: response.state || "",
        pin_code: response.pin_code || "",
      });
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to fetch user data"));
    }
  };

  const fetchStatusOptions = async () => {
    try {
      const response = await contactApi();
      setPaymentOptions(response?.payment_clearance || []);
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to fetch status options"));
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      const usersArray: any[] = Array.isArray(response?.results ?? response)
        ? (response?.results ?? response)
        : [];
      const trainersList: Trainer[] = [];
      const financiersList: Financier[] = [];
      usersArray.forEach((item: any) => {
        if (!item?.roles) return;
        const roles: string[] = Array.isArray(item.roles) ? item.roles : [];
        const fullName =
          `${item.first_name || ""} ${item.last_name || ""}`.trim();
        if (roles.includes("trainer"))
          trainersList.push({
            value: item.id,
            label: fullName || `Trainer ${item.id}`,
          });
        if (roles.includes("financier"))
          financiersList.push({
            id: item.id,
            name: fullName || `Financier ${item.id}`,
          });
      });
      setTrainers(trainersList);
      setFinanciers(financiersList);
    } catch (error) {
      toast.error(handleAxiosError(error, "Failed to fetch users"));
    }
  };

  const handlePersonalSave = async () => {
    if (!shgUserData) return;
    setSubmitting(true);
    try {
      await updateApplicationApi(shgUserData.id, {
        dob: personalForm.dob,
        gender: personalForm.gender,
        blood_group: personalForm.blood_group,
        marital_status: personalForm.marital_status,
        language: personalForm.language,
        address_line_1: personalForm.address_line_1,
        address_line_2: personalForm.address_line_2,
        village: personalForm.village,
        district: personalForm.district,
        state: personalForm.state,
        pin_code: personalForm.pin_code,
        user: {
          phone: personalForm.phone,
          email: personalForm.email,
        },
      });
      toast.success("Personal details updated");
      setIsEditingPersonal(false);
      fetchSHGUserData(shgUserData.id);
    } catch (err) {
      toast.error(handleAxiosError(err, "Failed to update personal details"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentVerify = async (doc: AppDocument, status: string) => {
    if (!doc.id) {
      toast.error("Document ID not available");
      return;
    }
    setDocVerifying((prev) => ({ ...prev, [doc.id!]: true }));
    try {
      await documentVerifyApi(doc.id, { status: status });
      toast.success(
        `Document ${status === "approved" ? "approved" : "rejected"}`,
      );
      setShgUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          documents: prev.documents.map((d) =>
            d.id === doc.id ? { ...d, status: status } : d,
          ),
        };
      });
    } catch (err) {
      toast.error(handleAxiosError(err, "Failed to verify document"));
    } finally {
      setDocVerifying((prev) => ({ ...prev, [doc.id!]: false }));
    }
  };

  const handleProcessingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let derivedStatus = application?.status;
      if (processingForm.assigned_trainer) {
        derivedStatus = "training";
      } else if (processingForm.assigned_financier) {
        derivedStatus = "assigned";
      }

      await updateApplicationStatusApi(parseInt(id!), {
        assigned_trainer: processingForm.assigned_trainer || null,
        assigned_financier: processingForm.assigned_financier || null,
        public_notes: processingForm.public_notes,
        private_notes: processingForm.private_notes,
        payment_status: processingForm.payment_status,
        status: derivedStatus,
      });
      toast.success("Application updated successfully");
      navigate("/applications")
      fetchApplicationDetails(parseInt(id!));
    } catch (err) {
      toast.error(handleAxiosError(err, "Failed to update application"));
    } finally {
      setSubmitting(false);
    }
  };

  const getFullName = () => {
    if (!shgUserData) return "-";
    return (
      `${shgUserData.user.first_name || ""} ${shgUserData.user.last_name || ""}`.trim() ||
      "-"
    );
  };

  const getFullAddress = () => {
    if (!shgUserData) return "-";
    return (
      [
        shgUserData.address_line_1,
        shgUserData.address_line_2,
        shgUserData.village,
        shgUserData.district,
        shgUserData.state,
        shgUserData.pin_code,
      ]
        .filter(Boolean)
        .join(", ") || "-"
    );
  };

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
  const readCls =
    "text-sm font-medium text-gray-900 dark:text-white break-words";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Application not found
        </h2>
        <button
          onClick={() => navigate("/applications")}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  const currentStatus = application?.status || "submitted";

  return (
    <>
      <PageMeta
        title={`Application #${application.reference_number || id}`}
        description="View and edit application details"
      />

      <div className="p-3 sm:p-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start gap-3 mb-5 sm:mb-6">
          {/* Back */}
          <button
            onClick={() => navigate("/applications")}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 mt-0.5"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          {/* Title + ref — grows to fill space */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white leading-snug">
              {currentStep === 1
                ? "CM/CCM Member Information"
                : "Application Processing"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Ref: {application?.reference_number || "N/A"}
            </p>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            {shgUserData ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* ── Card 1: Personal Details ──────────────────────── */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      Personal Details
                    </h2>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditingPersonal((v) => !v)}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-500/20 dark:text-brand-400 flex-shrink-0"
                      >
                        {isEditingPersonal ? (
                          <>
                            <XIcon className="w-3.5 h-3.5" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <PencilIcon className="w-3.5 h-3.5" />
                            Edit
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    {/* Full Name — always read-only */}
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Full Name
                      </label>
                      <p className={readCls}>{getFullName()}</p>
                    </div>

                    {/* Phone + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Phone
                        </label>
                        {isEditingPersonal ? (
                          <input
                            type="tel"
                            value={personalForm.phone}
                            onChange={(e) =>
                              setPersonalForm((p) => ({
                                ...p,
                                phone: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        ) : (
                          <p className={readCls}>
                            {shgUserData.user.phone || "-"}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Email
                        </label>
                        {isEditingPersonal ? (
                          <input
                            type="email"
                            value={personalForm.email}
                            onChange={(e) =>
                              setPersonalForm((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        ) : (
                          <p className={`${readCls} truncate`}>
                            {shgUserData.user.email || "-"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* DOB + Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Date of Birth
                        </label>
                        {isEditingPersonal ? (
                          <input
                            type="date"
                            value={personalForm.dob}
                            onChange={(e) =>
                              setPersonalForm((p) => ({
                                ...p,
                                dob: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        ) : (
                          <p className={readCls}>
                            {shgUserData.dob
                              ? new Date(shgUserData.dob).toLocaleDateString()
                              : "-"}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Gender
                        </label>
                        {isEditingPersonal ? (
                          <select
                            value={personalForm.gender}
                            onChange={(e) =>
                              setPersonalForm((p) => ({
                                ...p,
                                gender: e.target.value,
                              }))
                            }
                            className={inputCls}
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <p className={readCls}>{shgUserData.gender || "-"}</p>
                        )}
                      </div>
                    </div>

                    {/* Blood Group + Marital Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Blood Group
                        </label>
                        {isEditingPersonal ? (
                          <input
                            type="text"
                            value={personalForm.blood_group}
                            onChange={(e) =>
                              setPersonalForm((p) => ({
                                ...p,
                                blood_group: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        ) : (
                          <p className={readCls}>
                            {shgUserData.blood_group || "-"}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Marital Status
                        </label>
                        {isEditingPersonal ? (
                          <select
                            value={personalForm.marital_status}
                            onChange={(e) =>
                              setPersonalForm((p) => ({
                                ...p,
                                marital_status: e.target.value,
                              }))
                            }
                            className={inputCls}
                          >
                            <option value="">Select</option>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                            <option value="divorced">Divorced</option>
                            <option value="widowed">Widowed</option>
                          </select>
                        ) : (
                          <p className={readCls}>
                            {shgUserData.marital_status || "-"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Language
                      </label>
                      {isEditingPersonal ? (
                        <input
                          type="text"
                          value={personalForm.language}
                          onChange={(e) =>
                            setPersonalForm((p) => ({
                              ...p,
                              language: e.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      ) : (
                        <p className={readCls}>{shgUserData.language || "-"}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Address
                      </p>
                      {isEditingPersonal ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Address Line 1"
                            value={personalForm.address_line_1}
                            onChange={(e) =>
                              setPersonalForm((p) => ({
                                ...p,
                                address_line_1: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                          <input
                            type="text"
                            placeholder="Address Line 2"
                            value={personalForm.address_line_2}
                            onChange={(e) =>
                              setPersonalForm((p) => ({
                                ...p,
                                address_line_2: e.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Village"
                              value={personalForm.village}
                              onChange={(e) =>
                                setPersonalForm((p) => ({
                                  ...p,
                                  village: e.target.value,
                                }))
                              }
                              className={inputCls}
                            />
                            <input
                              type="text"
                              placeholder="District"
                              value={personalForm.district}
                              onChange={(e) =>
                                setPersonalForm((p) => ({
                                  ...p,
                                  district: e.target.value,
                                }))
                              }
                              className={inputCls}
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={personalForm.state}
                              onChange={(e) =>
                                setPersonalForm((p) => ({
                                  ...p,
                                  state: e.target.value,
                                }))
                              }
                              className={inputCls}
                            />
                            <input
                              type="text"
                              placeholder="PIN Code"
                              value={personalForm.pin_code}
                              onChange={(e) =>
                                setPersonalForm((p) => ({
                                  ...p,
                                  pin_code: e.target.value,
                                }))
                              }
                              className={inputCls}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-lg leading-relaxed">
                          {getFullAddress()}
                        </p>
                      )}
                    </div>

                    {/* Save — full width on mobile */}
                    {isEditingPersonal && (
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handlePersonalSave}
                          disabled={submitting}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 w-full sm:w-auto"
                        >
                          <SaveIcon className="w-4 h-4" />
                          {submitting ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Card 2: Documents ─────────────────────────────── */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm flex flex-col">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      Documents
                    </h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {shgUserData.documents.filter((d) => d.status).length}
                      {" / "}
                      {shgUserData.documents.length} verified
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 flex-1">
                    {shgUserData.documents.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        No documents uploaded
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {shgUserData.documents.map((doc, index) => {
                          const docId = doc.id ?? index;
                          const isVerifying = docVerifying[docId] ?? false;
                          return (
                            <div
                              key={docId}
                              className="flex items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              {/* Icon */}
                              <div className="flex-shrink-0 w-8 h-8 bg-brand-50 dark:bg-brand-500/20 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                              </div>

                              {/* Doc info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {DOC_TYPE_LABELS[doc.document_type] ??
                                    doc.document_type.replace(/_/g, " ")}
                                </p>
                                <a
                                  href={doc.file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                                >
                                  View file
                                </a>
                              </div>

                              <span
                                className={`hidden sm:inline-flex flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  doc.status === "approved"
                                    ? "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                    : doc.status === "rejected"
                                      ? "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                      : "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                                }`}
                              >
                                {doc.status || "pending"}
                              </span>

                              {/* Approve / Reject */}
                              {canEdit && (
                                <div className="flex-shrink-0 flex items-center gap-0.5 sm:gap-1">
                                  <button
                                    onClick={() =>
                                      handleDocumentVerify(doc, "approved")
                                    }
                                    disabled={isVerifying}
                                    title="Approve"
                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                      doc.status
                                        ? "text-green-600 bg-green-50 dark:bg-green-500/10"
                                        : "text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10"
                                    }`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDocumentVerify(doc, "rejected")
                                    }
                                    disabled={isVerifying}
                                    title="Reject"
                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                      !doc.status
                                        ? "text-red-600 bg-red-50 dark:bg-red-500/10"
                                        : "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                    }`}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Proceed to Step 2 — pinned to card bottom */}
                  {(() => {
                    const docs = shgUserData?.documents ?? [];
                    const allApproved =
                      docs.length > 0 && docs.every((d) => d.status === "approved");
                    return (
                      <div className="flex flex-col items-stretch sm:items-end gap-1.5 px-4 sm:px-6 pb-4 sm:pb-5 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                        {!allApproved && docs.length > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 sm:text-right">
                            All documents must be approved before proceeding
                          </p>
                        )}
                        <button
                          onClick={() => allApproved && setCurrentStep(2)}
                          disabled={!allApproved}
                          title={
                            !allApproved ? "Approve all documents first" : ""
                          }
                          className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            allApproved
                              ? "text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/20 dark:text-brand-400"
                              : "text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                          }`}
                        >
                          Application Processing
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No CM/CCM user data available
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
            {/* Step 2 header */}
            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Back</span>
              </button>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                Application Processing Details
              </h2>
            </div>

            <form onSubmit={handleProcessingSubmit} className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-5">
                {/* Status — read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[currentStatus] ?? STATUS_COLORS.submitted}`}
                    >
                      {STATUS_LABELS[currentStatus] ?? currentStatus}
                    </span>
                  </div>
                </div>

                {/* Trainer + Financier — side by side on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assigned Financier
                    </label>
                    <select
                      name="assigned_financier"
                      value={processingForm.assigned_financier}
                      onChange={(e) =>
                        setProcessingForm((p) => ({
                          ...p,
                          assigned_financier: e.target.value,
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="">Select Financier</option>
                      {financiers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Status
                    </label>
                    <select
                      name="payment_status"
                      value={processingForm.payment_status}
                      onChange={(e) =>
                        setProcessingForm((p) => ({
                          ...p,
                          payment_status: e.target.value,
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="">Select Payment Status</option>
                      {(paymentOptions.length > 0
                        ? paymentOptions
                        : [
                            { value: "pending", label: "Pending" },
                            { value: "cleared", label: "Cleared" },
                          ]
                      ).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {application?.payment_status === "cleared" &&(
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assigned Trainer
                    </label>
                    <select
                      name="assigned_trainer"
                      value={processingForm.assigned_trainer}
                      onChange={(e) =>
                        setProcessingForm((p) => ({
                          ...p,
                          assigned_trainer: e.target.value,
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="">Select Trainer</option>
                      {trainers.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  )}
                </div>
                {/* Notes — Private Notes only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Private Notes
                    <span className="ml-1.5 text-xs text-gray-400 font-normal">
                      (internal only)
                    </span>
                  </label>
                  <textarea
                    name="private_notes"
                    value={processingForm.private_notes}
                    onChange={(e) =>
                      setProcessingForm((p) => ({
                        ...p,
                        private_notes: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Internal notes only..."
                    className={inputCls}
                  />
                </div>

                {/* Save — Update button at bottom */}
                {canEdit && (
                  <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      <SaveIcon className="w-4 h-4" />
                      {submitting ? "Updating..." : "Submited"}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewEditApplication;
