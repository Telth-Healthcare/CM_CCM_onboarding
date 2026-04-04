// steps/Preview.tsx — Step 5

import React from 'react'

// ── Primitive display components ─────────────────────────────────────────────
const val = (v: any) => (v === null || v === undefined || v === '' ? '—' : String(v))

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-48 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-800 dark:text-white/90 mt-0.5 sm:mt-0">{value}</span>
  </div>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5 mb-4">
    <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">{title}</h3>
    {children}
  </div>
)

// File row with view button
const DocRow = ({ label, file, url }: { label: string; file: File | null; url?: string }) => {
  const hasDoc = file || url
  const name   = file ? file.name : url ? url.split('/').pop() : null
  const isPdf  = name?.toLowerCase().endsWith('.pdf')
  const isImg  = name ? /\.(jpg|jpeg|png|webp|gif)$/i.test(name) : false

  const openFile = () => {
    if (file) {
      const blobUrl = URL.createObjectURL(file)
      window.open(blobUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000)
    } else if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {label && (
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-48 flex-shrink-0">
          {label}
        </span>
      )}
      {hasDoc ? (
        <div className="flex items-center gap-2 mt-0.5 sm:mt-0">
          <span className={`w-7 h-7 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0
            ${isPdf ? 'bg-red-500' : isImg ? 'bg-blue-500' : 'bg-gray-500'}`}>
            {isPdf ? 'PDF' : isImg ? 'IMG' : 'DOC'}
          </span>
          <span className="text-sm text-gray-800 dark:text-white/90 truncate max-w-[180px]" title={name ?? ''}>
            {name}
          </span>
          <button
            type="button"
            onClick={openFile}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium px-2.5 py-1 rounded-md border border-brand-200 hover:bg-brand-50 dark:border-brand-800 dark:hover:bg-brand-900/20 transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
        </div>
      ) : (
        <span className="text-sm text-gray-400 italic">Not uploaded</span>
      )}
    </div>
  )
}

// Degree + doc combined row
const DegreeRow = ({
  label, degreeType, file, url,
}: {
  label: string
  degreeType: string
  file: File | null
  url?: string
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-48 flex-shrink-0 mt-0.5">
      {label}
    </span>
    <div className="flex flex-col gap-1 mt-0.5 sm:mt-0">
      {degreeType && (
        <span className="text-xs text-brand-600 font-semibold">{degreeType.toUpperCase()}</span>
      )}
      <DocRow label="" file={file} url={url} />
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
const Preview: React.FC<any> = ({ formData }) => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preview &amp; Submit</h2>
      <p className="mt-1 text-sm text-gray-500">Please review all details carefully before submitting.</p>
    </div>

    <Section title="Personal Information">
      <Row label="First Name"     value={val(formData.firstName)} />
      <Row label="Last Name"      value={val(formData.lastName)} />
      <Row label="Date of Birth"  value={val(formData.dob)} />
      <Row label="Language"       value={val(formData.language)} />
      <Row label="Marital Status" value={val(formData.maritalStatus) || 'Not provided'} />
      <Row label="Gender"         value={val(formData.gender)} />
      <Row label="Blood Group"    value={val(formData.bloodGroup)} />
    </Section>

    <Section title="Contact Information">
      <Row label="Mobile Number" value={val(formData.mobile)} />
      <Row label="Email ID"      value={val(formData.email)} />
    </Section>

    <Section title="Address Information">
      <Row label="Address Line 1" value={val(formData.addressLine1) || 'Not provided'} />
      <Row label="Address Line 2" value={val(formData.addressLine2) || 'Not provided'} />
      <Row label="City"           value={val(formData.city)} />
      <Row label="State"          value={val(formData.state)} />
      <Row label="Zipcode"        value={val(formData.zipcode)} />
      <Row label="Country"        value={val(formData.country) || 'Not provided'} />
    </Section>

    <Section title="Personal Identification Documents">
      <DocRow label="Aadhar Front" file={formData.aadharFront} url={formData.aadharFrontUrl ?? undefined} />
      <DocRow label="Aadhar Back"  file={formData.aadharBack}  url={formData.aadharBackUrl  ?? undefined} />
      <DocRow label="PAN Card"     file={formData.pan}         url={formData.panUrl         ?? undefined} />
    </Section>

    <Section title="Education Documents">
      <DegreeRow
        label="Bachelor's Degree"
        degreeType={formData.bachelorDegreeType}
        file={formData.bachelorDoc}
        url={formData.bachelorDocUrl ?? undefined}
      />
      <DegreeRow
        label="Master's Degree"
        degreeType={formData.masterDegreeType}
        file={formData.masterDoc}
        url={formData.masterDocUrl ?? undefined}
      />
      <DegreeRow
        label="Experience Cert"
        degreeType={formData.experienceCertType}
        file={formData.experienceCertDoc}
        url={formData.experienceCertDocUrl ?? undefined}
      />
    </Section>

    {/* Warning banner */}
    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
      <div className="flex gap-3">
        <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Once submitted, a reference number in the format{' '}
          <strong>CM-{new Date().getFullYear()}-####</strong> will be generated.
          You cannot edit the form after submission.
        </p>
      </div>
    </div>
  </div>
)

export default Preview