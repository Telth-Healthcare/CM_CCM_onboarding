import React, { useState } from "react";
import Input from "../../../form/input/InputField";
import Label from "../../../form/Label";
import Button from "../../../ui/button/Button";

interface TrainerFormProps {
  isAdmin: boolean;
  roleList: { value: string; label: string }[];
  onSubmit: (data: TrainerFormPayload) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export interface TrainerFormPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mnpUser: string;
}

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone = (v: string) => /^[0-9]{10}$/.test(v);
const validateName  = (v: string) => /^[a-zA-Z\s'-]{2,50}$/.test(v.trim());

const validateField = (
  name: keyof TrainerFormPayload,
  value: string,
  isAdmin: boolean
): string => {
  switch (name) {
    case "first_name":
      if (!value.trim()) return "First name is required";
      if (!validateName(value)) return "2–50 letters, spaces, apostrophes, or hyphens";
      return "";
    case "last_name":
      if (!value.trim()) return "Last name is required";
      if (!validateName(value)) return "2–50 letters, spaces, apostrophes, or hyphens";
      return "";
    case "email":
      if (!value.trim()) return "Email is required";
      if (!validateEmail(value)) return "Enter a valid email (e.g. name@example.com)";
      return "";
    case "phone":
      if (!value.trim()) return "Phone number is required";
      if (!validatePhone(value)) return "Enter a valid 10-digit phone number";
      return "";
    case "mnpUser":
      if (!isAdmin && !value.trim()) return "Please select a MNP User";
      return "";
    default:
      return "";
  }
};

const EMPTY: TrainerFormPayload = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  mnpUser: "",
};

const TrainerForm: React.FC<TrainerFormProps> = ({
  isAdmin,
  roleList,
  onSubmit,
  onCancel,
  submitting,
}) => {
  const [formData, setFormData] = useState<TrainerFormPayload>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof TrainerFormPayload, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TrainerFormPayload, boolean>>>({});

  const validate = (name: keyof TrainerFormPayload, value: string): string =>
    validateField(name, value, isAdmin);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const name = e.target.name as keyof TrainerFormPayload;
    const { value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "first_name" | "last_name"
  ) => {
    const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, "");
    setFormData((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: validate(field, value) }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((p) => ({ ...p, phone: value }));
    setErrors((p) => ({ ...p, phone: validate("phone", value) }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const name = e.target.name as keyof TrainerFormPayload;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validate(name, formData[name]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields: (keyof TrainerFormPayload)[] = [
      "first_name",
      "last_name",
      "email",
      "phone",
      ...(!isAdmin ? (["mnpUser"] as const) : []),
    ];
    const newTouched = Object.fromEntries(fields.map((f) => [f, true]));
    const newErrors = Object.fromEntries(
      fields.map((f) => [f, validate(f, formData[f])])
    );
    setTouched(newTouched);
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    await onSubmit(formData);
  };

  const showError = (name: keyof TrainerFormPayload) =>
    touched[name] && errors[name];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        {/* First Name */}
        <div>
          <Label>
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={(e) => handleNameChange(e, "first_name")}
            onBlur={handleBlur}
            placeholder="Enter first name"
            error={!!showError("first_name")}
          />
          {showError("first_name") && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.first_name}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <Label>
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={(e) => handleNameChange(e, "last_name")}
            onBlur={handleBlur}
            placeholder="Enter last name"
            error={!!showError("last_name")}
          />
          {showError("last_name") && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.last_name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label>
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter email address"
            error={!!showError("email")}
          />
          {showError("email") && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label>
            Phone <span className="text-red-500">*</span>
          </Label>
          <div
            className={`flex items-center border rounded-lg overflow-hidden transition-colors ${
              showError("phone")
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-700 focus-within:border-primary-500 dark:focus-within:border-primary-500"
            }`}
          >
            <span className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium border-r border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 select-none">
              +91
            </span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              onBlur={handleBlur}
              placeholder="Enter 10-digit phone number"
              className="flex-1 px-3 py-2 text-sm h-11 outline-none bg-white dark:bg-gray-900 dark:text-white"
              maxLength={10}
            />
          </div>
          {showError("phone") && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.phone}
            </p>
          )}
        </div>

        {/* MNP User */}
        {!isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MNP User <span className="text-red-500">*</span>
            </label>
            <select
              name="mnpUser"
              value={formData.mnpUser}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${
                showError("mnpUser")
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white`}
            >
              <option value="" disabled>
                Select a MNP User
              </option>
              {roleList.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            {showError("mnpUser") && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.mnpUser}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <Button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </Button>
        <Button
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          {submitting ? "Creating..." : "Create Trainer"}
        </Button>
      </div>
    </form>
  );
};

export default TrainerForm;