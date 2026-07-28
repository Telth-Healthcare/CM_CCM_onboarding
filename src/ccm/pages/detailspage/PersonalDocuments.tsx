// Step 4 — Document Upload: Personal Identification
import React, { useRef, useState } from 'react'
import Label from '../../../components/form/Label'
import { Trash2Icon, UploadCloudIcon, Upload, RefreshCw } from 'lucide-react'
import { StepProps } from './types'

const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024  // 5MB in bytes

type DocField = 'aadharFront' | 'aadharBack' | 'pan'
// URL field = DocField + 'Url'  e.g. aadharFront → aadharFrontUrl
type UrlField = 'aadharFrontUrl' | 'aadharBackUrl' | 'panUrl'

const DOC_FIELDS: { field: DocField; urlField: UrlField; label: string; accept: string; required: boolean }[] = [
  { field: 'aadharFront', urlField: 'aadharFrontUrl', label: 'Aadhar – Front Side', accept: '.pdf,.jpg,.jpeg,.png', required: true  },
  { field: 'aadharBack',  urlField: 'aadharBackUrl',  label: 'Aadhar – Back Side',  accept: '.pdf,.jpg,.jpeg,.png', required: true  },
  { field: 'pan',         urlField: 'panUrl',         label: 'PAN Card',             accept: '.pdf,.jpg,.jpeg,.png', required: true  },
]

const PersonalDocuments: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({})
  const [sizeErrors, setSizeErrors] = useState<Record<string, string>>({})  // local 5MB errors

  const refs = {
    aadharFront: useRef<HTMLInputElement>(null),
    aadharBack:  useRef<HTMLInputElement>(null),
    pan:         useRef<HTMLInputElement>(null),
  }

  const handleDrag = (e: React.DragEvent, field: string, entering: boolean) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(prev => ({ ...prev, [field]: entering }))
  }

  // ── Validate 5MB and set file ─────────────────────────────────────────────
  const handleFile = (field: DocField, file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      // Block the file — show size error, don't store it
      setSizeErrors(prev => ({ ...prev, [field]: `File too large. Max size is ${MAX_SIZE_MB}MB.` }))
      return
    }
    setSizeErrors(prev => ({ ...prev, [field]: '' }))  // clear any previous size error
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

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Extract filename from backend path e.g. '/documents/Natlife_MVP_PRD_1_6mHGMJk.pdf' → 'Natlife_MVP_PRD_1_6mHGMJk.pdf'
  const getFilename = (path: string) => path.split('/').pop() ?? path

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Document Upload</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Personal Identification</p>
      <p className="text-xs text-gray-400 mb-6">
        Upload clear scans or photos (PDF / JPG / PNG, max {MAX_SIZE_MB}MB each). Aadhar (front & back) and PAN are mandatory.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOC_FIELDS.map(({ field, urlField, label, accept, required }) => {
          const file        = formData[field] as File | null         // newly picked file
          const existingUrl = formData[urlField] as string | null    // already uploaded path
          const isDragOn    = dragActive[field]
          const sizeError   = sizeErrors[field]

          return (
            <div key={field}>
              <Label htmlFor={field}>
                {label} {required ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs font-normal">(Optional)</span>}
              </Label>

              {/* ── State 1: User just picked a new file ── */}
              {file ? (
                <div className="mt-1.5 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Upload className="h-8 w-8 text-brand-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatSize(file.size)} • {file.type?.split('/')[1]?.toUpperCase()}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFile(field)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700 transition-colors">
                      <Trash2Icon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

              ) : existingUrl ? (
                /* ── State 2: Already uploaded — compact row ── */
                <div className="mt-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Upload className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        {/* truncate long filename so it doesn't overflow */}
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
                /* ── State 3: Nothing uploaded — show upload zone ── */
                <div
                  onDragEnter={e => handleDrag(e, field, true)}
                  onDragLeave={e => handleDrag(e, field, false)}
                  onDragOver={e  => handleDrag(e, field, true)}
                  onDrop={e => handleDrop(e, field)}
                  onClick={() => refs[field]?.current?.click()}
                  className={`relative mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors
                    ${isDragOn
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : errors?.[field] || sizeError
                        ? 'border-error-400 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                    }`}
                >
                  <UploadCloudIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-brand-600 hover:text-brand-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF or image, max {MAX_SIZE_MB}MB</p>
                  <input
                    ref={refs[field]} id={field} type="file" accept={accept} className="sr-only"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(field, f) }}
                  />
                </div>
              )}

              {/* Size error (local) */}
              {sizeError && <p className="mt-1.5 text-xs text-error-500">{sizeError}</p>}
              {/* Validation error (from parent) */}
              {!sizeError && errors?.[field] && <p className="mt-1.5 text-xs text-error-500">{errors[field]}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PersonalDocuments