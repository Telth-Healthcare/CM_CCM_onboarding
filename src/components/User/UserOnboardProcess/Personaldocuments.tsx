// steps/PersonalDocuments.tsx — Step 3

import React from 'react'
import { FieldWrapper, FileUploadZone, StepHeader } from './Index'
import { ID_DOCUMENT_FIELDS, MAX_FILE_SIZE_MB } from './types/Constants'
// FIX: use proper StepProps type instead of any
import { StepProps } from './types/Types'

const PersonalDocuments: React.FC<StepProps> = ({ formData, updateFormData, errors }) => (
  <div>
    <StepHeader title="Document Upload" subtitle="Personal Identification" />
    <p className="text-xs text-gray-400 mb-6">
      Upload clear scans or photos (PDF / JPG / PNG, max {MAX_FILE_SIZE_MB}MB each).
      Aadhar (front &amp; back) and PAN are mandatory.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {ID_DOCUMENT_FIELDS.map(({ field, urlField, label, required }) => (
        <FieldWrapper key={field} label={label} required={required}>
          <FileUploadZone
            field={field}
            urlField={urlField}
            formData={formData}
            updateFormData={updateFormData}
            required={required}
            // FIX: pass typed field key — errors key must match field name
            error={errors?.[field as keyof typeof errors]}
          />
        </FieldWrapper>
      ))}
    </div>
  </div>
)

export default PersonalDocuments
