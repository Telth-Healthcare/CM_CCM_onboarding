import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  contactApi,
  getAllUsers,
  getApplicationByIdApi,
  getSHGUserByIdApi,
  updateApplicationStatusApi,
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

interface SHGUserData {
  id: number;
  address_line_1: string;
  address_line_2: string;
  blood_group: string;
  country: string;
  created_at: string;
  district: string;
  dob: string;
  documents: any[];
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
    is_approved: boolean;
    region: number | null;
    roles: string[];
  };
  village: string;
}

const ViewEditApplication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [shgUserData, setShgUserData] = useState<SHGUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // Step 1: SHG Info, Step 2: Application Processing
  const [isEditing, setIsEditing] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [financiers, setFinanciers] = useState<Financier[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<StatusOption[]>([]);

  const [formData, setFormData] = useState({
    status: "",
    assigned_trainer: "",
    assigned_financier: "",
    payment_status: "",
    public_notes: "",
    private_notes: "",
  });

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

      // Initialize form data
      setFormData({
        status: response.status || "",
        assigned_trainer: response.assigned_trainer?.toString() || "",
        assigned_financier: response.assigned_financier?.toString() || "",
        public_notes: response.public_notes || "",
        private_notes: response.private_notes || "",
        payment_status: response.payment_status || "",
      });

      // Fetch SHG user data if available
      if (response.shg) {
        fetchSHGUserData(response.shg);
      }
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        "Failed to fetch application",
      );
      toast.error(errorMessage);
      navigate("/applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchSHGUserData = async (userId: number) => {
    try {
      const response = await getSHGUserByIdApi(userId);
      setShgUserData(response);
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch user data");
      toast.error(errorMessage);
    }
  };

  const fetchStatusOptions = async () => {
    try {
      const response = await contactApi();
      const statusList = response?.application_status || [];
      const paymentList = response?.payment_clearance || [];
      setStatusOptions(statusList);
      setPaymentOptions(paymentList);
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        "Failed to fetch status options",
      );
      toast.error(errorMessage);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      const userData = response?.results || response || [];

      const trainersList: Trainer[] = [];
      const financiersList: Financier[] = [];

      const usersArray = Array.isArray(userData) ? userData : [];

      usersArray.forEach((item: any) => {
        if (item?.roles && Array.isArray(item.roles)) {
          if (item.roles.includes("trainer") || item.roles[0] === "trainer") {
            trainersList.push({
              value: item.id,
              label:
                `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
                `Trainer ${item.id}`,
            });
          }
          if (
            item.roles.includes("financier") ||
            item.roles[0] === "financier"
          ) {
            financiersList.push({
              id: item.id,
              name:
                `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
                `Financier ${item.id}`,
            });
          }
        }
      });

      setTrainers(trainersList);
      setFinanciers(financiersList);
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch users");
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updatedData = {
        status: formData.status,
        assigned_trainer: formData.assigned_trainer || null,
        assigned_financier: formData.assigned_financier || null,
        public_notes: formData.public_notes,
        private_notes: formData.private_notes,
        payment_status: formData.payment_status
      };
      await updateApplicationStatusApi(parseInt(id!), updatedData);
      toast.success("Application updated successfully");
      setIsEditing(false);
      // Refresh application data
      fetchApplicationDetails(parseInt(id!));
    } catch (err) {
      const errorMessage = handleAxiosError(
        err,
        "Failed to update application",
      );
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original application data
    setFormData({
      status: application?.status || "",
      assigned_trainer: application?.assigned_trainer?.toString() || "",
      assigned_financier: application?.assigned_financier?.toString() || "",
      public_notes: application?.public_notes || "",
      private_notes: application?.private_notes || "",
      payment_status: application?.payment_status || '',
    });
    setIsEditing(false);
  };

  const goToNextStep = () => {
    setCurrentStep(2);
    setIsEditing(false);
  };

  const goToPreviousStep = () => {
    setCurrentStep(1);
    setIsEditing(false);
  };

  // Format full name
  const getFullName = () => {
    if (!shgUserData) return "-";
    return (
      `${shgUserData.user.first_name || ""} ${shgUserData.user.last_name || ""}`.trim() ||
      "-"
    );
  };

  // Format full address
  const getFullAddress = () => {
    if (!shgUserData) return "-";
    return (
      [
        shgUserData?.address_line_1,
        shgUserData?.address_line_2,
        shgUserData?.village,
        shgUserData?.district,
        shgUserData?.state,
        shgUserData?.pin_code,
      ]
        .filter(Boolean)
        .join(", ") || "-"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6 text-center">
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

  return (
    <>
      <PageMeta
        title={`Application #${application.reference_number || id}`}
        description="View and edit application details"
      />
      <div className="p-6">
        {/* Header with back button to applications list */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/applications")}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {currentStep === 1
                ? "SHG Member Information"
                : "Application Processing"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Reference No: {application?.reference_number || "N/A"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span
              className={currentStep === 1 ? "text-brand-600 font-medium" : ""}
            >
              Step 1
            </span>
            <ChevronRight className="w-4 h-4" />
            <span
              className={currentStep === 2 ? "text-brand-600 font-medium" : ""}
            >
              Step 2
            </span>
          </div>
        </div>

        {/* Step 1: SHG Member Information */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  SHG Member Details
                </h2>
                {canEdit && (
                  <button
                    onClick={goToNextStep}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                  >
                    Next: Application Processing
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {shgUserData ? (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-gray-400 mb-3">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Full Name
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getFullName()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Date of Birth
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shgUserData?.dob
                            ? new Date(shgUserData.dob).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Gender
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shgUserData?.gender || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Blood Group
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shgUserData?.blood_group || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Marital Status
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shgUserData?.marital_status || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Language
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shgUserData?.language || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-gray-400 mb-3">
                      Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Phone
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shgUserData?.user.phone || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Email
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shgUserData?.user.email || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-gray-400 mb-3">
                      Address
                    </h3>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      {getFullAddress()}
                    </p>
                  </div>

                  {/* SHG Details */}
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-gray-400 mb-3">
                      SHG Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Registration Status
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shgUserData?.registration_status || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Profile Status
                        </label>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            shgUserData?.is_submitted
                              ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                              : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
                          }`}
                        >
                          {shgUserData?.is_submitted ? "Submitted" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-gray-400 mb-3">
                      Account Status
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Active
                        </label>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            shgUserData?.user.is_active
                              ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                              : "bg-error-50 text-error-700 dark:bg-error-500/20 dark:text-error-400"
                          }`}
                        >
                          {shgUserData?.user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Approved
                        </label>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            shgUserData?.user.is_approved
                              ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                              : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
                          }`}
                        >
                          {shgUserData?.user.is_approved
                            ? "Approved"
                            : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {shgUserData?.documents &&
                    shgUserData.documents.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-black dark:text-gray-400 mb-3">
                          Documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {shgUserData.documents.map(
                            (doc: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                              >
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {doc.document_type?.replace(/_/g, " ") ||
                                    "Document"}
                                </span>
                                <a
                                  href={doc.file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-600 hover:text-brand-700 dark:text-brand-400 text-sm font-medium"
                                >
                                  View
                                </a>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No SHG user data available
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Application Processing */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-theme-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPreviousStep}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Application Processing Details
                  </h2>
                </div>
                {canEdit && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-500/20 dark:text-brand-400"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Application
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    {isEditing ? (
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">Select Status</option>
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {application?.status || "-"}
                      </p>
                    )}
                  </div>

                  {/* Assigned Trainer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assigned Trainer
                    </label>
                    {isEditing ? (
                      <select
                        name="assigned_trainer"
                        value={formData.assigned_trainer}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select Trainer</option>
                        {trainers.map((trainer) => (
                          <option key={trainer.value} value={trainer.value}>
                            {trainer.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {application?.trainer_details || "Not Assigned"}
                      </p>
                    )}
                  </div>

                  {/* Assigned Financier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assigned Financier
                    </label>
                    {isEditing ? (
                      <select
                        name="assigned_financier"
                        value={formData.assigned_financier}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select Financier</option>
                        {financiers.map((financier) => (
                          <option key={financier.id} value={financier.id}>
                            {financier.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {application?.assigned_financier_details ||
                          "Not Assigned"}
                      </p>
                    )}
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Status
                    </label>
                    {isEditing ? (
                      <select
                        name="payment_status"
                        value={formData.payment_status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">Select Payment Status</option>
                        {paymentOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {application?.payment_status || "-"}
                      </p>
                    )}
                  </div>

                  {/* Public Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Public Notes
                    </label>
                    {isEditing ? (
                      <textarea
                        name="public_notes"
                        value={formData.public_notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Add public notes..."
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                        {application?.public_notes || "No public notes"}
                      </p>
                    )}
                  </div>

                  {/* Private Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Private Notes
                    </label>
                    {isEditing ? (
                      <textarea
                        name="private_notes"
                        value={formData.private_notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Add private notes (internal only)..."
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                        {application?.private_notes || "No private notes"}
                      </p>
                    )}
                  </div>

                  {/* Edit Actions */}
                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                      >
                        <XIcon className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <SaveIcon className="w-4 h-4" />
                        {submitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewEditApplication;
