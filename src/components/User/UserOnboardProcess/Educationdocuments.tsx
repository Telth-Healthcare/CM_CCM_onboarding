// steps/EducationDocuments.tsx — Step 4

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
      Bachelor's degree is mandatory. Master's and experience certificate are optional.
      Max {MAX_FILE_SIZE_MB}MB per file.
    </p>

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
            <FileUploadZone
              field="bachelorDoc"
              urlField="bachelorDocUrl"
              formData={formData}
              updateFormData={updateFormData}
              required
              error={errors?.bachelorDoc}
            />
          </FieldWrapper>
        </FormGrid>
      </SectionCard>

      {/* Master's Degree — both select and upload are optional, but if user selects degree they should upload doc */}
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
            <FileUploadZone
              field="masterDoc"
              urlField="masterDocUrl"
              formData={formData}
              updateFormData={updateFormData}
            />
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
            <FileUploadZone
              field="experienceCertDoc"
              urlField="experienceCertDocUrl"
              formData={formData}
              updateFormData={updateFormData}
            />
          </FieldWrapper>
        </FormGrid>
      </SectionCard>

    </div>
  </div>
)

export default EducationDocuments
