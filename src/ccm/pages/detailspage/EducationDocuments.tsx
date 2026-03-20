// Step 5 — Document Upload: Education Details
import React, { useRef, useState } from 'react'
import Label from '../../../components/form/Label'
import Select from '../../../components/form/Select'
import { Trash2Icon, UploadCloudIcon, Upload, RefreshCw } from 'lucide-react'
import { StepProps } from './types'

const MAX_SIZE_MB    = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

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

type DocField = 'bachelorDoc' | 'masterDoc' | 'experienceCertDoc'
type UrlField = 'bachelorDocUrl' | 'masterDocUrl' | 'experienceCertDocUrl'

const formatSize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getFilename = (path: string) => path.split('/').pop() ?? path

const EducationDocuments: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({})
  const [sizeErrors, setSizeErrors] = useState<Record<string, string>>({})

  const refs = {
    bachelorDoc:       useRef<HTMLInputElement>(null),
    masterDoc:         useRef<HTMLInputElement>(null),
    experienceCertDoc: useRef<HTMLInputElement>(null),
  }

  const handleDrag = (e: React.DragEvent, field: string, entering: boolean) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(prev => ({ ...prev, [field]: entering }))
  }

  // ── Validate 5MB before storing ──────────────────────────────────────────
  const handleFile = (field: DocField, file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      setSizeErrors(prev => ({ ...prev, [field]: `File too large. Max size is ${MAX_SIZE_MB}MB.` }))
      return
    }
    setSizeErrors(prev => ({ ...prev, [field]: '' }))
    updateFormData(field, file)
  }

  const handleDrop = (e: React.DragEvent, field: DocField) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(prev => ({ ...prev, [field]: false }))
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(field, file)
  }

  const removeFile = (field: DocField) => {
    updateFormData(field, null)
    setSizeErrors(prev => ({ ...prev, [field]: '' }))
    if (refs[field].current) refs[field].current!.value = ''
  }
  
  // ── Reusable upload zone ──────────────────────────────────────────────────
  const FileUploadZone = ({ field, urlField, required = false }: { field: DocField; urlField: UrlField; required?: boolean }) => {
    const file        = formData[field] as File | null
    const existingUrl = formData[urlField] as string | null
    const isDragOn    = dragActive[field]
    const sizeError   = sizeErrors[field]

    return (
      <>
        {/* State 1: new file just picked */}
        {file ? (
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

        ) : existingUrl ? (
          /* State 2: already uploaded — compact row */
          <div className="mt-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Upload className="h-4 w-4 text-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-white break-all line-clamp-2 leading-tight">{getFilename(existingUrl)}</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400">Uploaded ✓</p>
                </div>
              </div>
              <button type="button"
                onClick={() => updateFormData(urlField, null)}
                className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-gray-500 border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <RefreshCw className="h-3 w-3" />
                Replace
              </button>
            </div>
          </div>

        ) : (
          /* State 3: nothing uploaded yet */
          <div
            onDragEnter={e => handleDrag(e, field, true)}
            onDragLeave={e => handleDrag(e, field, false)}
            onDragOver={e  => handleDrag(e, field, true)}
            onDrop={e => handleDrop(e, field)}
            onClick={() => refs[field]?.current?.click()}
            className={`relative mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-6 cursor-pointer transition-colors
              ${isDragOn
                ? 'border-brand-500 bg-brand-50'
                : (required && errors?.[field]) || sizeError
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
              }`}
          >
            <UploadCloudIcon className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-0.5">PDF or image, max {MAX_SIZE_MB}MB</p>
            <input
              ref={refs[field]} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(field, f) }}
            />
          </div>
        )}

        {sizeError   && <p className="mt-1 text-xs text-red-500">{sizeError}</p>}
        {!sizeError && errors?.[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
      </>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Document Upload</h2>
      <p className="text-sm text-gray-500 mb-1">Education Details</p>
      <p className="text-xs text-gray-400 mb-6">
        Bachelor's degree is mandatory. Master's and experience certificate are optional. Max {MAX_SIZE_MB}MB per file.
      </p>

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
              <FileUploadZone field="bachelorDoc" urlField="bachelorDocUrl" required />
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
              <FileUploadZone field="masterDoc" urlField="masterDocUrl" />
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
              <FileUploadZone field="experienceCertDoc" urlField="experienceCertDocUrl" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EducationDocuments