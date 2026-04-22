// steps/EducationDocuments.tsx — Step 4
import { OTHER_DOC_OPTIONS } from './types/Constants'  // ← add to existing import

import React from 'react'
import {
  BACHELOR_DEGREE_OPTIONS,
  MASTER_DEGREE_OPTIONS,
  EXPERIENCE_CERT_OPTIONS,
  MAX_FILE_SIZE_MB,
} from './types/Constants'
import { FieldWrapper, FileUploadZone, FormGrid, SectionCard, StepHeader } from './Index'
import Select from '../../form/Select'
import { StepProps } from './types/Types'

const EducationDocuments: React.FC<StepProps> = ({ formData, updateFormData, errors }) => (
<div>
    <StepHeader title="Document Upload" subtitle="Education Details" />
    <p className="text-xs text-gray-400 mb-6">
       Tenth are mandatory. All others are optional. Max {MAX_FILE_SIZE_MB}MB per file.
    </p>
         {/* Tenth & Twelfth — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* LEFT — Tenth — always active, mandatory */}
        <SectionCard title="Tenth Certificate">
          <FieldWrapper label="Upload Document" required>
            <FileUploadZone field="tenthDoc" urlField="tenthDocUrl"
              formData={formData} updateFormData={updateFormData} required error={errors?.tenthDoc} />
          </FieldWrapper>
        </SectionCard>

        {/* RIGHT — Twelfth — mandatory but disabled when diploma uploaded */}
        <SectionCard title="Twelfth Certificate">
          <div className={formData.diplomaDoc || formData.diplomaDocUrl ? 'opacity-40 pointer-events-none' : ''}>
            <FieldWrapper label="Upload Document" >
              <FileUploadZone field="twelfthDoc" urlField="twelfthDocUrl"
                formData={formData} updateFormData={updateFormData} required error={errors?.twelfthDoc} />
            </FieldWrapper>
          </div>
          {(formData.diplomaDoc || formData.diplomaDocUrl) && (
            <p className="mt-2 text-xs text-amber-500">Disabled — Diploma uploaded</p>
          )}
        </SectionCard>

      </div>

      {/* Diploma — full width, disables Twelfth */}
      <SectionCard title="Diploma" optional>
        <p className="text-xs text-amber-600 mb-3">
        </p>
        <FieldWrapper label="Upload Document">
          <FileUploadZone field="diplomaDoc" urlField="diplomaDocUrl"
            formData={formData} updateFormData={updateFormData} />
        </FieldWrapper>
      </SectionCard>

      {/* Other Document */}
      <SectionCard title="Other Document" optional>
        <FormGrid>
          <FieldWrapper label="Document Type">
            <Select
              value={formData.otherDocType}
              onChange={val => updateFormData('otherDocType', val)}
              options={OTHER_DOC_OPTIONS}
              placeholder="Select Document Type"
            />
          </FieldWrapper>
          <FieldWrapper label="Upload Document">
            <FileUploadZone field="otherDoc" urlField="otherDocUrl"
              formData={formData} updateFormData={updateFormData} />
          </FieldWrapper>
        </FormGrid>
      </SectionCard>

    <div className="space-y-6">

      {/* Bachelor's Degree */}
      <SectionCard title="Bachelor's Degree">
        <FormGrid>
          <FieldWrapper label="Select Degree" required hint={errors?.bachelorDegreeType}>
            <Select
              value={formData.bachelorDegreeType}
              onChange={val => updateFormData('bachelorDegreeType', val)}
              options={BACHELOR_DEGREE_OPTIONS}
              placeholder="Select Bachelor's Degree"
              error={!!errors?.bachelorDegreeType}
            />
          </FieldWrapper>
          <FieldWrapper label="Upload Document" required>
            <FileUploadZone field="bachelorDoc" urlField="bachelorDocUrl"
              formData={formData} updateFormData={updateFormData} required error={errors?.bachelorDoc} />
          </FieldWrapper>
        </FormGrid>
      </SectionCard>

      {/* Master's Degree */}
      <SectionCard title="Master's Degree" optional>
        <FormGrid>
          <FieldWrapper label="Select Degree">
            <Select
              value={formData.masterDegreeType}
              onChange={val => updateFormData('masterDegreeType', val)}
              options={MASTER_DEGREE_OPTIONS}
              placeholder="Select Master's Degree"
            />
          </FieldWrapper>
          <FieldWrapper label="Upload Document">
            <FileUploadZone field="masterDoc" urlField="masterDocUrl"
              formData={formData} updateFormData={updateFormData} />
          </FieldWrapper>
        </FormGrid>
      </SectionCard>

      {/* Experience Certificate */}
      <SectionCard title="Experience Certificate" optional>
        <FormGrid>
          <FieldWrapper label="Certificate Type">
            <Select
              value={formData.experienceCertType}
              onChange={val => updateFormData('experienceCertType', val)}
              options={EXPERIENCE_CERT_OPTIONS}
              placeholder="Select Certificate Type"
            />
          </FieldWrapper>
          <FieldWrapper label="Upload Document">
            <FileUploadZone field="experienceCertDoc" urlField="experienceCertDocUrl"
              formData={formData} updateFormData={updateFormData} />
          </FieldWrapper>
        </FormGrid>
      </SectionCard>

     
    </div>
  </div>
)

export default EducationDocuments
