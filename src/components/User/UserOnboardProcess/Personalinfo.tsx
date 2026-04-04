// steps/PersonalInfo.tsx — Step 1

import React from "react";
import { FieldWrapper, FormGrid, StepHeader } from "./Index";
import Input from "../../form/input/InputField";
import {
  BLOOD_GROUP_OPTIONS,
  DOB_MAX,
  DOB_MIN,
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from "./types/Constants";
import Select from "../../form/Select";
import { StepProps } from "./types/Types";

const PersonalInfo: React.FC<StepProps> = ({
  formData,
  updateFormData,
  errors,
}) => (
  <div>
    <StepHeader
      title="Personal Information"
      subtitle="Enter your personal details"
    />

    <FormGrid>
      <FieldWrapper label="First Name" required hint={errors?.firstName}>
        <Input
          type="text"
          id="firstName"
          name="firstName"
          placeholder="Enter first name"
          value={formData.firstName}
          onChange={(e) => updateFormData("firstName", e.target.value)}
          error={!!errors?.firstName}
        />
      </FieldWrapper>

      <FieldWrapper label="Last Name" required hint={errors?.lastName}>
        <Input
          type="text"
          id="lastName"
          name="lastName"
          placeholder="Enter last name"
          value={formData.lastName}
          onChange={(e) => updateFormData("lastName", e.target.value)}
          error={!!errors?.lastName}
        />
      </FieldWrapper>

      <FieldWrapper label="Date of Birth" required hint={errors?.dob}>
        <Input
          type="date"
          id="dob"
          name="dob"
          value={formData.dob}
          min={DOB_MIN}
          max={DOB_MAX}
          onChange={(e) => updateFormData("dob", e.target.value)}
          error={!!errors?.dob}
        />
      </FieldWrapper>

      <FieldWrapper label="Language" required hint={errors?.language}>
        <Select
          value={formData.language}
          onChange={(val) => updateFormData("language", val)}
          options={LANGUAGE_OPTIONS}
          placeholder="Select Language"
          error={!!errors?.language}
        />
      </FieldWrapper>

      <FieldWrapper label="Gender" required hint={errors?.gender}>
        <Select
          value={formData.gender}
          onChange={(val) => updateFormData("gender", val)}
          options={GENDER_OPTIONS}
          placeholder="Select Gender"
          error={!!errors?.gender}
        />
      </FieldWrapper>

      <FieldWrapper label="Blood Group" required hint={errors?.bloodGroup}>
        <Select
          value={formData.bloodGroup}
          onChange={(val) => updateFormData("bloodGroup", val)}
          options={BLOOD_GROUP_OPTIONS}
          placeholder="Select Blood Group"
          error={!!errors?.bloodGroup}
        />
      </FieldWrapper>

      <FieldWrapper label="Marital Status">
        <Select
          value={formData.maritalStatus}
          onChange={(val) => updateFormData("maritalStatus", val)}
          options={MARITAL_STATUS_OPTIONS}
          placeholder="Select Marital Status"
        />
      </FieldWrapper>

      {/* Mobile Number - Editable */}
      <FieldWrapper label="Mobile Number" required hint={errors?.mobile}>
        <div className="flex">
          <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm select-none">
            +91
          </span>
          <input
            type="tel"
            id="mobile"
            name="mobile"
            onChange={(e) => {
              // Remove any non-digit characters and limit to 10 digits
              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
              updateFormData("mobile", value);
            }}
            value={(formData.mobile ?? "").replace(/^\+91/, "")}
            placeholder="Enter 10-digit mobile number"
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Enter your 10-digit mobile number
        </p>
      </FieldWrapper>

      {/* Email - Editable */}
      <FieldWrapper label="Email Address" required hint={errors?.email}>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={(e) => updateFormData("email", e.target.value)}
          placeholder="Enter your email address"
          error={!!errors?.email}
        />
        <p className="mt-1 text-xs text-gray-400">
          We'll send important updates to this email
        </p>
      </FieldWrapper>
    </FormGrid>
  </div>
);

export default PersonalInfo;