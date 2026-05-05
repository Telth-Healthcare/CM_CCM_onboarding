// steps/EducationDocuments.tsx — Step 4

import React from 'react'
import {
  BACHELOR_DEGREE_OPTIONS,
  MASTER_DEGREE_OPTIONS,
  EXPERIENCE_CERT_OPTIONS,
  MAX_FILE_SIZE_MB,
  OTHER_DOC_OPTIONS,
} from './types/Constants'
import { FieldWrapper, FileUploadZone, FormGrid, SectionCard, StepHeader } from './Index'
import Select from '../../form/Select'
import { StepProps } from './types/Types'

const EducationDocuments: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  // Check if diploma is uploaded to disable twelfth
  const isDiplomaUploaded = !!(formData.diplomaDoc || formData.diplomaDocUrl);
  
  return (
    <div>
      <StepHeader title="Document Upload" subtitle="Education Details" />
      <p className="text-xs text-gray-400 mb-6">
        Documents mandatory. Max {MAX_FILE_SIZE_MB}MB per file.
      </p>
      
      {/* Tenth & Twelfth — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* LEFT — Tenth — always active, mandatory */}
        <SectionCard title="10th/SSC/SSLC Certificate">
          <FieldWrapper label="Upload Document" required>
            <FileUploadZone 
              field="tenthDoc" 
              urlField="tenthDocUrl"
              formData={formData} 
              updateFormData={updateFormData} 
              required 
              error={errors?.tenthDoc} 
            />
          </FieldWrapper>
        </SectionCard>

        {/* RIGHT — Twelfth — mandatory but disabled when diploma uploaded */}
        <SectionCard title="12th/HSC/Intermediate Certificate">
          <div className={isDiplomaUploaded ? 'opacity-40 pointer-events-none' : ''}>
            <FieldWrapper label="Upload Document" required={!isDiplomaUploaded}>
              <FileUploadZone 
                field="twelfthDoc" 
                urlField="twelfthDocUrl"
                formData={formData} 
                updateFormData={updateFormData} 
                required={!isDiplomaUploaded} 
                error={errors?.twelfthDoc} 
              />
            </FieldWrapper>
          </div>
          {isDiplomaUploaded && (
            <p className="mt-2 text-xs text-amber-500">Disabled — Diploma uploaded</p>
          )}
        </SectionCard>
      </div>

      {/* Diploma — full width, disables Twelfth */}
      <div className="mb-4">
        <SectionCard title="Diploma" optional>
          <FieldWrapper label="Upload Document">
            <FileUploadZone 
              field="diplomaDoc" 
              urlField="diplomaDocUrl"
              formData={formData} 
              updateFormData={updateFormData} 
            />
          </FieldWrapper>
        </SectionCard>
      </div>

      {/* Other Document */}
      <div className="mb-4">
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
              <FileUploadZone 
                field="otherDoc" 
                urlField="otherDocUrl"
                formData={formData} 
                updateFormData={updateFormData} 
              />
            </FieldWrapper>
          </FormGrid>
        </SectionCard>
      </div>

      <div className="space-y-4">
        {/* Bachelor's Degree */}
        <SectionCard title="Bachelor's Degree" optional>
          <FormGrid>
            <FieldWrapper label="Select Degree">
              <Select
                value={formData.bachelorDegreeType}
                onChange={val => updateFormData('bachelorDegreeType', val)}
                options={BACHELOR_DEGREE_OPTIONS}
                placeholder="Select Bachelor's Degree"
                error={!!errors?.bachelorDegreeType}
              />
            </FieldWrapper>
            <FieldWrapper label="Upload Document">
              <FileUploadZone 
                field="bachelorDoc" 
                urlField="bachelorDocUrl"
                formData={formData} 
                updateFormData={updateFormData} 
                error={errors?.bachelorDoc} 
              />
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
  );
}

export default EducationDocuments