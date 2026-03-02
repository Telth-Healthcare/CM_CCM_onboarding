// Step Preview — Review & Submit (CCM)
import React from 'react'
import { StepProps } from './types'

const val = (v: any) => {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-48 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-800 dark:text-white/90 mt-0.5 sm:mt-0">{value}</span>
  </div>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5 mb-4">
    <h3 className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">{title}</h3>
    {children}
  </div>
)

const Preview: React.FC<StepProps> = ({ formData }) => {
  if (!formData) return null

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Preview & Submit</h2>
      <p className="text-sm text-gray-500 mb-6">Please review all details carefully before submitting.</p>

      {/* Step 1 */}
      <Section title="Personal Information">
        <Row label="First Name"     value={val(formData.firstName)} />
        <Row label="Last Name"      value={val(formData.lastName)} />
        <Row label="Date of Birth"  value={val(formData.dob)} />
        <Row label="Language"       value={val(formData.language)} />
        <Row label="Marital Status" value={val(formData.maritalStatus) === '—' ? 'Not provided' : val(formData.maritalStatus)} />
        <Row label="Gender"         value={val(formData.gender)} />
        <Row label="Blood Group"    value={val(formData.bloodGroup)} />
      </Section>

      {/* Step 2 */}
      <Section title="Contact Information">
        <Row label="Mobile Number" value={val(formData.mobile)} />
        <Row label="Email ID"      value={val(formData.email)} />
      </Section>

      {/* Step 3 */}
      <Section title="Address Information">
        <Row label="Address Line 1" value={val(formData.addressLine1) === '—' ? 'Not provided' : val(formData.addressLine1)} />
        <Row label="Address Line 2" value={val(formData.addressLine2) === '—' ? 'Not provided' : val(formData.addressLine2)} />
        <Row label="City"           value={val(formData.city)} />
        <Row label="State"          value={val(formData.state)} />
        <Row label="Zipcode"        value={val(formData.zipcode)} />
        <Row label="Country"        value={val(formData.country) === '—' ? 'Not provided' : val(formData.country)} />
      </Section>

      {/* Step 4 */}
      <Section title="Personal Identification Documents">
        <Row label="Aadhaar Front" value={formData.aadhaarFront ? formData.aadhaarFront.name : 'Not uploaded'} />
        <Row label="Aadhaar Back"  value={formData.aadhaarBack  ? formData.aadhaarBack.name  : 'Not uploaded'} />
        <Row label="PAN Card"      value={formData.pan          ? formData.pan.name          : 'Not uploaded'} />
      </Section>

      {/* Step 5 */}
      <Section title="Education Documents">
        <Row label="Bachelor's Degree" value={formData.bachelorDegreeType ? `${formData.bachelorDegreeType.toUpperCase()} — ${formData.bachelorDoc ? formData.bachelorDoc.name : 'Not uploaded'}` : 'Not provided'} />
        <Row label="Master's Degree"   value={formData.masterDegreeType   ? `${formData.masterDegreeType.toUpperCase()} — ${formData.masterDoc ? formData.masterDoc.name : 'Not uploaded'}` : 'Not provided'} />
        <Row label="Experience Cert"   value={formData.experienceCertType ? `${formData.experienceCertType} — ${formData.experienceCertDoc ? formData.experienceCertDoc.name : 'Not uploaded'}` : 'Not provided'} />
      </Section>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-800">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Once submitted, a reference number in the format <strong>CCM-{new Date().getFullYear()}-####</strong> will be generated. You cannot edit the form after submission.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Preview
