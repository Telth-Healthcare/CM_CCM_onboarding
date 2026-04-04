// Index.tsx — shared UI primitives for CCM onboard

import React, { useRef, useState, useEffect } from 'react'
import { Upload, Trash2, RefreshCw, UploadCloud } from 'lucide-react'
import { CCMFormData } from './types/Types'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from './types/Constants'

export const StepHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
    {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
  </div>
)


export const FormGrid = ({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) => (
  <div className={`grid grid-cols-1 ${cols === 2 ? 'sm:grid-cols-2' : ''} gap-5`}>
    {children}
  </div>
)

export const FieldWrapper = ({
  label, required: isRequired, hint, span, children,
}: {
  label: string
  required?: boolean
  hint?: string
  span?: boolean
  children: React.ReactNode
}) => (
  <div className={span ? 'sm:col-span-2' : ''}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label}
      {isRequired && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-red-500">{hint}</p>}
  </div>
)

export const SectionCard = ({
  title, optional, children,
}: {
  title: string
  optional?: boolean
  children: React.ReactNode
}) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
    <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
      {title}
      {optional && (
        <span className="ml-2 text-sm font-normal text-gray-400">(Optional)</span>
      )}
    </h3>
    {children}
  </div>
)

interface EditableDropdownProps {
  id: string
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  error?: boolean
  hint?: string
}

export const EditableDropdown: React.FC<EditableDropdownProps> = ({
  id, value, onChange, options, placeholder,
  disabled, readOnly, error, hint,
}) => {
  const [open, setOpen]     = useState(false)
  const [filter, setFilter] = useState('')
  const inputRef            = useRef<HTMLInputElement>(null)
  const wrapRef             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = filter
    ? options.filter(o => o.toLowerCase().includes(filter.toLowerCase()))
    : options

  const pick = (opt: string) => {
    onChange(opt)
    setFilter('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          // FIX: when open and filtering, show filter text; otherwise show value
          value={readOnly ? value : (open && filter ? filter : value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete="off"
          className={[
            'w-full px-3 py-2.5 text-sm rounded-lg border pr-8',
            'text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500',
            error
              ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
            disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-400' : '',
            readOnly ? 'cursor-pointer' : '',
          ].join(' ')}
          onChange={e => {
            if (readOnly) return
            setFilter(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => { if (options.length > 0) setOpen(true) }}
        />
        {options.length > 0 && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
            </svg>
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1 list-none m-0 p-1">
          {filtered.map((opt, i) => (
            <li
              key={i}
              onMouseDown={e => { e.preventDefault(); pick(opt) }}
              className={[
                'px-3 py-2 text-sm rounded cursor-pointer flex items-center gap-2',
                value === opt
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              <span className="text-gray-400 text-xs">›</span>
              {opt}
            </li>
          ))}
        </ul>
      )}

      {hint && <p className="mt-1 text-xs text-red-500">{hint}</p>}
    </div>
  )
}

type FileField = keyof Pick<CCMFormData,
  'aadharFront' | 'aadharBack' | 'pan' |
  'bachelorDoc' | 'masterDoc' | 'experienceCertDoc'
>
type UrlField = keyof Pick<CCMFormData,
  'aadharFrontUrl' | 'aadharBackUrl' | 'panUrl' |
  'bachelorDocUrl' | 'masterDocUrl' | 'experienceCertDocUrl'
>

interface FileUploadZoneProps {
  field: FileField
  urlField: UrlField
  formData: CCMFormData
  updateFormData: (field: keyof CCMFormData, value: any) => void
  required?: boolean
  error?: string
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

const getFilename = (path: string) => path.split('/').pop() ?? path

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  field, urlField, formData, updateFormData, required: isRequired, error,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [sizeError, setSizeError]   = useState('')
  const inputRef                    = useRef<HTMLInputElement>(null)

  const file        = formData[field] as File | null
  const existingUrl = formData[urlField] as string | null

  const handleFile = (f: File) => {
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setSizeError(`File too large — max ${MAX_FILE_SIZE_MB}MB`)
      return
    }
    setSizeError('')
    updateFormData(field, f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const removeFile = () => {
    updateFormData(field, null)
    setSizeError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayError = sizeError || error

  if (file) {
    return (
      <div className="mt-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="h-7 w-7 text-brand-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  if (existingUrl) {
    return (
      <div className="mt-1.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Upload className="h-4 w-4 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 dark:text-white break-all line-clamp-2 leading-tight">
                {getFilename(existingUrl)}
              </p>
              <p className="text-[10px] text-green-600 dark:text-green-400">Uploaded ✓</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateFormData(urlField, null)}
            className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-gray-500 border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Replace
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-6 cursor-pointer transition-colors',
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
            : (isRequired && error) || sizeError
              ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
              : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-400 hover:bg-brand-50/30',
        ].join(' ')}
      >
        <UploadCloud className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-0.5">PDF or image, max {MAX_FILE_SIZE_MB}MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>
      {displayError && <p className="mt-1 text-xs text-red-500">{displayError}</p>}
    </>
  )
}
