// Step 1 — Personal Information
import React from 'react'
import Input from '../../../components/form/input/InputField'
import Label from '../../../components/form/Label'
import Select from '../../../components/form/Select'
import { StepProps } from './types'

const LANGUAGE_OPTIONS = [
  { value: 'english',   label: 'English' },
  { value: 'hindi',     label: 'Hindi' },
  { value: 'tamil',     label: 'Tamil' },
  { value: 'telugu',    label: 'Telugu' },
  { value: 'kannada',   label: 'Kannada' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'marathi',   label: 'Marathi' },
  { value: 'bengali',   label: 'Bengali' },
  { value: 'gujarati',  label: 'Gujarati' },
  { value: 'punjabi',   label: 'Punjabi' },
]

const MARITAL_STATUS_OPTIONS = [
  { value: 'single',   label: 'single' },
  { value: 'married',  label: 'married' },
  { value: 'divorced', label: 'divorced' },
  { value: 'widowed',  label: 'widowed' },
]

const GENDER_OPTIONS = [
  { value: 'male',           label: 'male' },
  { value: 'female',         label: 'female' },
  { value: 'other',          label: 'other' },
  { value: 'prefer_not_say', label: 'prefer not to say' },
]

const BLOOD_GROUP_OPTIONS = [
  { value: 'A+',  label: 'A+' },
  { value: 'A-',  label: 'A-' },
  { value: 'B+',  label: 'B+' },
  { value: 'B-',  label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+',  label: 'O+' },
  { value: 'O-',  label: 'O-' },
]

// ── DOB bounds: age must be 18–55 ─────────────────────────────────────────────
const today = new Date()
const maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  .toISOString().split('T')[0]  // latest allowed DOB = 18 years ago today
const minDob = new Date(today.getFullYear() - 55, today.getMonth(), today.getDate())
  .toISOString().split('T')[0]  // earliest allowed DOB = 55 years ago today

const PersonalInfo: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  if (!formData) return null

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Personal Information</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your personal details</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* First Name — maps to: first_name (inside user object) */}
        <div>
          <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
          <Input
            type="text" id="firstName" name="firstName"
            placeholder="Enter first name"
            value={formData.firstName}
            onChange={e => updateFormData('firstName', e.target.value)}
            error={!!errors?.firstName}
            hint={errors?.firstName}
          />
        </div>

        {/* Last Name — maps to: last_name (inside user object) */}
        <div>
          <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
          <Input
            type="text" id="lastName" name="lastName"
            placeholder="Enter last name"
            value={formData.lastName}
            onChange={e => updateFormData('lastName', e.target.value)}
            error={!!errors?.lastName}
            hint={errors?.lastName}
          />
        </div>

        {/* Date of Birth — maps to: dob | min/max enforces age 18–55 in the date picker too */}
        <div>
          <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
          <Input
            type="date" id="dob" name="dob"
            value={formData.dob}
            min={minDob}   // oldest allowed: 55 years ago
            max={maxDob}   // youngest allowed: 18 years ago
            onChange={e => updateFormData('dob', e.target.value)}
            error={!!errors?.dob}
            hint={errors?.dob}
          />
        </div>

        {/* Language — maps to: language (lowercase e.g. "hindi") */}
        <div>
          <Label htmlFor="language">Language <span className="text-red-500">*</span></Label>
          <Select
            value={formData.language}
            onChange={val => updateFormData('language', val)}
            options={LANGUAGE_OPTIONS}
            placeholder="Select Language"
            error={!!errors?.language}
            hint={errors?.language}
          />
        </div>

        {/* Gender — maps to: gender (e.g. "Male") */}
        <div>
          <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
          <Select
            value={formData.gender}
            onChange={val => updateFormData('gender', val)}
            options={GENDER_OPTIONS}
            placeholder="Select Gender"
            error={!!errors?.gender}
            hint={errors?.gender}
          />
        </div>

        {/* Blood Group — maps to: blood_group (e.g. "O-") */}
        <div>
          <Label htmlFor="bloodGroup">Blood Group <span className="text-red-500">*</span></Label>
          <Select
            value={formData.bloodGroup}
            onChange={val => updateFormData('bloodGroup', val)}
            options={BLOOD_GROUP_OPTIONS}
            placeholder="Select Blood Group"
            error={!!errors?.bloodGroup}
            hint={errors?.bloodGroup}
          />
        </div>

        {/* Marital Status — maps to: marital_status (e.g. "Divorced") | optional */}
        <div>
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select
            value={formData.maritalStatus}
            onChange={val => updateFormData('maritalStatus', val)}
            options={MARITAL_STATUS_OPTIONS}
            placeholder="Select Marital Status"
          />
        </div>

        {/* Mobile — maps to: user.phone | pre-filled from login, read-only */}
        <div>
          <Label htmlFor="mobile">Mobile Number</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-gray-500 text-sm select-none">
              +91
            </span>
            <input
              type="tel" id="mobile" readOnly
              value={(formData.mobile ?? '').replace('+91', '')}
              className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-r-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">Registered mobile — cannot be changed</p>
        </div>

        {/* Email — maps to: user.email | pre-filled from login, disabled (Input doesn't support readOnly) */}
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email" id="email" name="email"
            value={formData.email}
            disabled                  // disabled = greyed out + not editable, no readOnly prop in this Input
            onChange={() => {}}       // required by controlled input even when disabled
          />
          <p className="mt-1 text-xs text-gray-400">Registered email — cannot be changed</p>
        </div>

      </div>
    </div>
  )
}

export default PersonalInfo