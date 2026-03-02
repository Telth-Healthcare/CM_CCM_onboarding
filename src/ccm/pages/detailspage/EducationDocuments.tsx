// Step 5 — Document Upload: Education Details
import React, { useRef, useState } from 'react'
import Label from '../../../components/form/Label'
import Select from '../../../components/form/Select'
import { Trash2Icon, UploadCloudIcon, Upload } from 'lucide-react'
import { StepProps } from './types'

const BACHELOR_DEGREES = [
  { value: 'bsc',      label: 'B.Sc.' },
  { value: 'bcom',     label: 'B.Com.' },
  { value: 'ba',       label: 'B.A.' },
  { value: 'btech',    label: 'B.Tech / B.E.' },
  { value: 'bba',      label: 'BBA' },
  { value: 'bca',      label: 'BCA' },
  { value: 'mbbs',     label: 'MBBS' },
  { value: 'bpharm',   label: 'B.Pharm' },
  { value: 'bed',      label: 'B.Ed.' },
  { value: 'llb',      label: 'LLB' },
  { value: 'other_ug', label: 'Other UG Degree' },
]

const MASTER_DEGREES = [
  { value: 'msc',      label: 'M.Sc.' },
  { value: 'mcom',     label: 'M.Com.' },
  { value: 'ma',       label: 'M.A.' },
  { value: 'mtech',    label: 'M.Tech / M.E.' },
  { value: 'mba',      label: 'MBA' },
  { value: 'mca',      label: 'MCA' },
  { value: 'mpharm',   label: 'M.Pharm' },
  { value: 'med',      label: 'M.Ed.' },
  { value: 'llm',      label: 'LLM' },
  { value: 'other_pg', label: 'Other PG Degree' },
]

const EXP_CERT_TYPES = [
  { value: 'experience_letter', label: 'Experience Letter' },
  { value: 'relieving_letter',  label: 'Relieving Letter' },
  { value: 'service_cert',      label: 'Service Certificate' },
  { value: 'other',             label: 'Other' },
]

type DocRef = 'bachelorDoc' | 'masterDoc' | 'experienceCertDoc'

const formatSize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const EducationDocuments: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({})
  const refs = {
    bachelorDoc:       useRef<HTMLInputElement>(null),
    masterDoc:         useRef<HTMLInputElement>(null),
    experienceCertDoc: useRef<HTMLInputElement>(null),
  }

  const handleDrag = (e: React.DragEvent, field: string, entering: boolean) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(prev => ({ ...prev, [field]: entering }))
  }

  const handleDrop = (e: React.DragEvent, field: DocRef) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(prev => ({ ...prev, [field]: false }))
    const file = e.dataTransfer.files?.[0]
    if (file) updateFormData(field, file)
  }

  const removeFile = (field: DocRef) => {
    updateFormData(field, null)
    if (refs[field].current) refs[field].current!.value = ''
  }

  const FileUploadZone = ({ field, required = false }: { field: DocRef; required?: boolean }) => {
    const file = formData[field] as File | null
    const active = dragActive[field]
    return (
      <>
        {!file ? (
          <div
            onDragEnter={e => handleDrag(e, field, true)}
            onDragLeave={e => handleDrag(e, field, false)}
            onDragOver={e  => handleDrag(e, field, true)}
            onDrop={e => handleDrop(e, field)}
            className={`relative mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-6 cursor-pointer transition-colors
              ${active ? 'border-brand-500 bg-brand-50'
                : required && errors?.[field] ? 'border-red-400 bg-red-50'
                : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'}`}
            onClick={() => refs[field]?.current?.click()}
          >
            <UploadCloudIcon className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-0.5">PDF or image, max 5MB</p>
            <input
              ref={refs[field]}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) updateFormData(field, f) }}
            />
          </div>
        ) : (
          <div className="mt-1.5 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="h-7 w-7 text-brand-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <button type="button" onClick={() => removeFile(field)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors">
                <Trash2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {errors?.[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
      </>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Document Upload</h2>
      <p className="text-sm text-gray-500 mb-1">Education Details</p>
      <p className="text-xs text-gray-400 mb-6">Bachelor's degree is mandatory. Master's and experience certificate are optional.</p>

      <div className="space-y-6">

        {/* Bachelor's Degree */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            Bachelor's Degree <span className="text-red-500">*</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Select Degree <span className="text-red-500">*</span></Label>
              <Select
                value={formData.bachelorDegreeType}
                onChange={val => updateFormData('bachelorDegreeType', val)}
                options={BACHELOR_DEGREES}
                placeholder="Select Bachelor's Degree"
                error={!!errors?.bachelorDegreeType}
                hint={errors?.bachelorDegreeType}
              />
            </div>
            <div>
              <Label>Upload Document <span className="text-red-500">*</span></Label>
              <FileUploadZone field="bachelorDoc" required />
            </div>
          </div>
        </div>

        {/* Master's Degree */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            Master's Degree <span className="text-gray-400 font-normal text-sm">(Optional)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Select Degree</Label>
              <Select
                value={formData.masterDegreeType}
                onChange={val => updateFormData('masterDegreeType', val)}
                options={MASTER_DEGREES}
                placeholder="Select Master's Degree"
              />
            </div>
            <div>
              <Label>Upload Document</Label>
              <FileUploadZone field="masterDoc" />
            </div>
          </div>
        </div>

        {/* Experience Certificate */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            Experience Certificate <span className="text-gray-400 font-normal text-sm">(Optional)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Certificate Type</Label>
              <Select
                value={formData.experienceCertType}
                onChange={val => updateFormData('experienceCertType', val)}
                options={EXP_CERT_TYPES}
                placeholder="Select Certificate Type"
              />
            </div>
            <div>
              <Label>Upload Document</Label>
              <FileUploadZone field="experienceCertDoc" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EducationDocuments
