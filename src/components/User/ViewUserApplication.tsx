// ViewUserApplication.tsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSHGUserByIdApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { Modal } from "../ui/modal";
import { getUserRole } from "../../config/constants";

interface ViewUserApplicationProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  applicationData: any;
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

const ViewUserApplication: React.FC<ViewUserApplicationProps> = ({
  isOpen,
  onClose,
  applicationData,
}) => {
  const [shgUserData, setShgUserData] = useState<SHGUserData | null>(null);
  const [productInterests, setProductInterests] = useState<ProductInterest[]>(
    [],
  );

  const userRole = getUserRole("admin");

  useEffect(() => {
    if (isOpen && applicationData) {
      if (userRole === "admin" || userRole === "super_admin") {
        if (applicationData.shg) {
          getSHGUserData(applicationData.shg);
        }
      }
      fetchProductInterests();
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
    return (
      `${shgUserData.user.first_name || ""} ${shgUserData.user.last_name || ""}`.trim() ||
      "-"
    );
  };

  // Format full address
  const getFullAddress = () => {
    if (!shgUserData) return "-";
    const { profile } = shgUserData;
    return (
      [
        profile?.address_line_1,
        profile?.address_line_2,
        profile?.village,
        profile?.district,
        profile?.state,
        profile?.pin_code,
      ]
        .filter(Boolean)
        .join(", ") || "-"
    );
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
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* SHG Details Section */}
          {(userRole === "admin" || userRole === "super_admin") && (
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
                      {shgUserData?.profile?.dob
                        ? new Date(shgUserData.profile.dob).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile?.gender || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Marital Status
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile?.marital_status || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Blood Group
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile?.blood_group || "-"}
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
                      {shgUserData?.profile?.language || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year of Formation
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile?.year_of_formation || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Registration Status
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {shgUserData?.profile?.registration_status || "-"}
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
            </div>
          )}
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
                <p className="text-gray-900 dark:text-white">
                  {applicationData?.status || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigned Trainer
                </label>
                <p className="text-gray-900 dark:text-white">
                  {applicationData?.trainer_details || "Not Assigned"}
                </p>
              </div>

              {/* Documents Section */}
              {applicationData?.documents &&
                applicationData.documents.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Documents
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applicationData.documents.map(
                        (doc: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {doc.document_type.replace(/_/g, " ")}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Public Notes
                </label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  {applicationData?.public_notes || "No public notes"}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Private Notes
                </label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  {applicationData?.private_notes || "No private notes"}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          {/* <div className="mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
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
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewUserApplication;
