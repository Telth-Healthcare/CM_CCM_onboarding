// Step 4 — Document Upload: Personal Identification
import React, { useRef, useState } from 'react'
import Label from '../../../components/form/Label'
import { Trash2Icon, UploadCloudIcon, Upload } from 'lucide-react'
import { StepProps } from './types'

type DocField = 'aadhaarFront' | 'aadhaarBack' | 'pan'

const DOC_FIELDS: { field: DocField; label: string; accept: string; hint: string; required: boolean }[] = [
  {
    field: 'aadhaarFront',
    label: 'Aadhaar – Front Side',
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'PDF or image, max 5MB',
    required: true,
  },
  {
    field: 'aadhaarBack',
    label: 'Aadhaar – Back Side',
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'PDF or image, max 5MB',
    required: true,
  },
  {
    field: 'pan',
    label: 'PAN Card',
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'PDF or image, max 5MB',
    required: true,
  },
]

const PersonalDocuments: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  const [dragActive, setDragActive] = useState<Record<string, boolean>>({})

  const refs = {
    aadhaarFront: useRef<HTMLInputElement>(null),
    aadhaarBack:  useRef<HTMLInputElement>(null),
    pan:          useRef<HTMLInputElement>(null),
  }

  const handleDrag = (e: React.DragEvent, field: string, entering: boolean) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(prev => ({ ...prev, [field]: entering }))
  }

  const handleDrop = (e: React.DragEvent, field: DocField) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(prev => ({ ...prev, [field]: false }))
    const file = e.dataTransfer.files?.[0]
    if (file) updateFormData(field, file)
  }

  const removeFile = (field: DocField) => {
    updateFormData(field, null)
    if (refs[field].current) refs[field].current!.value = ''
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Document Upload</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Personal Identification</p>
      <p className="text-xs text-gray-400 mb-6">Upload clear scans or photos (PDF / JPG / PNG, max 5MB each). Aadhaar (front & back) and PAN are mandatory.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOC_FIELDS.map(({ field, label, accept, hint, required }) => {
          const file = formData[field] as File | null
          const active = dragActive[field]

          return (
            <div key={field}>
              <Label htmlFor={field}>
                {label}{' '}
                {required
                  ? <span className="text-red-500">*</span>
                  : <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                }
              </Label>

              {!file ? (
                <div
                  onDragEnter={e => handleDrag(e, field, true)}
                  onDragLeave={e => handleDrag(e, field, false)}
                  onDragOver={e  => handleDrag(e, field, true)}
                  onDrop={e => handleDrop(e, field)}
                  className={`relative mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors cursor-pointer
                    ${active
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : errors?.[field]
                        ? 'border-error-400 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                    }`}
                  onClick={() => refs[field]?.current?.click()}
                >
                  <UploadCloudIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-brand-600 hover:text-brand-500">Click to upload</span>
                    {' '}or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{hint}</p>
                  <input
                    ref={refs[field]}
                    id={field}
                    type="file"
                    accept={accept}
                    className="sr-only"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) updateFormData(field, f)
                    }}
                  />
                </div>
              ) : (
                <div className="mt-1.5 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Upload className="h-8 w-8 text-brand-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatSize(file.size)} • {file.type?.split('/')[1]?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(field)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2Icon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {errors?.[field] && (
                <p className="mt-1.5 text-xs text-error-500">{errors[field]}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PersonalDocuments
