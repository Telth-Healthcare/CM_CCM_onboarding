// components/applications/ViewEditApplication.tsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSHGUserByIdApi, updateApplicationStatusApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { Modal } from "../ui/modal";
import { PencilIcon } from "../../icons";

interface ViewEditApplicationProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  applicationData: any;
  onUpdate: () => void;
}

interface ProductInterest {
  id: number;
  name: string;
}

interface SHGUserData {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    is_approved: boolean;
    region: number | null;
  };
  profile: {
    id: number;
    year_of_formation: number | null;
    dob: string | null;
    language: string;
    marital_status: string;
    gender: string;
    blood_group: string;
    address_line_1: string;
    address_line_2: string;
    district: string;
    village: string;
    state: string;
    country: string;
    pin_code: string;
    registration_status: string;
    is_submitted: boolean;
  };
}

const ViewEditApplication: React.FC<ViewEditApplicationProps> = ({
  isOpen,
  onClose,
  applicationId,
  applicationData,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shgUserData, setShgUserData] = useState<SHGUserData | null>(null);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [incubators, setIncubators] = useState<any[]>([]);
  const [productInterests, setProductInterests] = useState<ProductInterest[]>(
    [],
  );
  const [formData, setFormData] = useState({
    status: "",
    assigned_trainer: "",
    assigned_incubator: "",
    public_notes: "",
    private_notes: "",
  });

  useEffect(() => {
    if (isOpen && applicationData) {
      if (applicationData.shg) {
        getSHGUserData(applicationData.shg);
      }
      fetchTrainersAndIncubators();
      fetchProductInterests();

      // Initialize form data
      setFormData({
        status: applicationData.status || "",
        assigned_trainer: applicationData.assigned_trainer?.toString() || "",
        assigned_incubator:
          applicationData.assigned_incubator?.toString() || "",
        public_notes: applicationData.public_notes || "",
        private_notes: applicationData.private_notes || "",
      });
    }
  }, [isOpen, applicationData]);

  const getSHGUserData = async (userId: number) => {
    try {
      const response = await getSHGUserByIdApi(userId);
      setShgUserData(response);
    } catch (error) {
      const errorMessage = handleAxiosError(error, "fetching user data");
      toast.error(errorMessage);
    }
  };

  const fetchTrainersAndIncubators = async () => {
    try {
      // Mock data for now
      setTrainers([
        { id: 1, name: "Trainer 1" },
        { id: 2, name: "Trainer 2" },
      ]);
      setIncubators([
        { id: 1, name: "Incubator 1" },
        { id: 2, name: "Incubator 2" },
      ]);
    } catch (err) {
      toast.error("Failed to fetch trainers and incubators");
    }
  };

  const fetchProductInterests = async () => {
    try {
      // Mock data
      setProductInterests([
        { id: 1, name: "Product 1" },
        { id: 2, name: "Product 2" },
        { id: 4, name: "Product 4" },
      ]);
    } catch (err) {
      console.error("Failed to fetch product interests");
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
    setLoading(true);
    try {
      const updatedData = {
        status: formData.status,
        assigned_trainer: formData.assigned_trainer || null,
        assigned_incubator: formData.assigned_incubator || null,
        public_notes: formData.public_notes,
        private_notes: formData.private_notes,
      };
      await updateApplicationStatusApi(applicationId, updatedData);
      toast.success("Application updated successfully");
      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (err) {
      const errorMessage = handleAxiosError(err, "Failed to update application");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get product names from IDs
  const getProductNames = () => {
    if (!applicationData?.products_interests || !productInterests.length)
      return "-";
    return applicationData.products_interests
      .map((id: number) => {
        const product = productInterests.find((p) => p.id === id);
        return product?.name || `Product ${id}`;
      })
      .join(", ");
  };

  // Format full name
  const getFullName = () => {
    if (!shgUserData) return "-";
    return `${shgUserData.user.first_name || ""} ${shgUserData.user.last_name || ""}`.trim() || "-";
  };

  // Format full address
  const getFullAddress = () => {
    if (!shgUserData) return "-";
    const { profile } = shgUserData;
    return [
      profile.address_line_1,
      profile.address_line_2,
      profile.village,
      profile.district,
      profile.state,
      profile.pin_code,
    ]
      .filter(Boolean)
      .join(", ") || "-";
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Application Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Reference No: {applicationData?.reference_number || "N/A"}
            </p>
          </div>
          <div className="flex items-center gap-8">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-500/20 dark:text-brand-400"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {/* <XMarkIcon className="w-5 h-5" /> */}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {/* SHG Details Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                SHG Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SHG Name / Contact Person
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {getFullName()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Mobile
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.user.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Email
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.user.email || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile.dob 
                        ? new Date(shgUserData.profile.dob).toLocaleDateString() 
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile.gender || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Marital Status
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile.marital_status || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Blood Group
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile.blood_group || "-"}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Language
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile.language || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year of Formation
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile.year_of_formation || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Registration Status
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile.registration_status || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <p className="text-gray-900 dark:text-white whitespace-pre-line">
                      {getFullAddress()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Product Interests
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {getProductNames()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Has Equipment
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {applicationData?.has_equipment ? "Yes" : "No"}
                    </p>
                  </div>
                  {applicationData?.has_equipment &&
                    applicationData?.equipment_description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Equipment Description
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {applicationData.equipment_description}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* User Status */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      User Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shgUserData?.user.is_active
                          ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                          : "bg-error-50 text-error-700 dark:bg-error-500/20 dark:text-error-400"
                      }`}
                    >
                      {shgUserData?.user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Approval Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shgUserData?.user.is_approved
                          ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                          : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
                      }`}
                    >
                      {shgUserData?.user.is_approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profile Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shgUserData?.profile.is_submitted
                          ? "bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                          : "bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400"
                      }`}
                    >
                      {shgUserData?.profile.is_submitted ? "Submitted" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Processing Section */}
            <div className="mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Application Processing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="TRAINING">Training</option>
                      <option value="PRODUCTION">Production</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {applicationData?.status || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign Trainer
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
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {applicationData?.assigned_trainer
                        ? trainers.find(
                            (t) =>
                              t.id === Number(applicationData.assigned_trainer),
                          )?.name
                        : "Not Assigned"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign Incubator
                  </label>
                  {isEditing ? (
                    <select
                      name="assigned_incubator"
                      value={formData.assigned_incubator}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select Incubator</option>
                      {incubators.map((incubator) => (
                        <option key={incubator.id} value={incubator.id}>
                          {incubator.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {applicationData?.assigned_incubator
                        ? incubators.find(
                            (i) =>
                              i.id ===
                              Number(applicationData.assigned_incubator),
                          )?.name
                        : "Not Assigned"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
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
                      {applicationData?.public_notes || "No public notes"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
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
                      {applicationData?.private_notes || "No private notes"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Metadata
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Created:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {applicationData?.created_at
                      ? new Date(applicationData.created_at).toLocaleString()
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Last Updated:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {applicationData?.updated_at
                      ? new Date(applicationData.updated_at).toLocaleString()
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default ViewEditApplication;