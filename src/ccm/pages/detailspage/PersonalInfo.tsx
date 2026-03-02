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
  { value: 'Single',   label: 'Single' },
  { value: 'Married',  label: 'Married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed',  label: 'Widowed' },
]

const GENDER_OPTIONS = [
  { value: 'Male',           label: 'Male' },
  { value: 'Female',         label: 'Female' },
  { value: 'Other',          label: 'Other' },
  { value: 'Prefer_not_say', label: 'Prefer not to say' },
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

const PersonalInfo: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  if (!formData) return null

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Personal Information</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your personal details</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* First Name */}
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

        {/* Last Name */}
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

        {/* Date of Birth */}
        <div>
          <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
          <Input
            type="date" id="dob" name="dob"
            value={formData.dob}
            onChange={e => updateFormData('dob', e.target.value)}
            error={!!errors?.dob}
            hint={errors?.dob}
          />
        </div>

        {/* Language */}
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

        {/* Marital Status */}
        <div>
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select
            value={formData.maritalStatus}
            onChange={val => updateFormData('maritalStatus', val)}
            options={MARITAL_STATUS_OPTIONS}
            placeholder="Select Marital Status"
          />
        </div>

        {/* Gender */}
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

        {/* Blood Group */}
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

      </div>
    </div>
  )
}

export default PersonalInfo
