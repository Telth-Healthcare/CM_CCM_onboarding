// shared/components/common/SearchableSelect.tsx
// ⚠️ Rename from "SearchableSelect .tsx" (remove the space in filename)
import React, { useState, useRef, useEffect } from 'react'

interface Option {
  label: string
  value: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  hint?: string
}

const SearchableSelect: React.FC<Props> = ({
  options, value, onChange, placeholder = 'Select...', disabled, error, hint
}) => {
  const [open,   setOpen]   = useState(false)  // dropdown visibility
  const [search, setSearch] = useState('')      // current search text
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())  // search filter
  )

  const selected = options.find(o => o.value === value)   // find display label

  return (
    <div ref={ref} className="relative w-full">

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen(!open); setSearch('') }}
        className={`w-full h-11 rounded-lg border px-4 py-2.5 text-sm text-left flex justify-between items-center shadow-theme-xs transition-colors
          ${error    ? 'border-error-500'    : 'border-gray-300 dark:border-gray-700'}
          ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                     : 'bg-transparent dark:bg-gray-900 cursor-pointer focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10'}
        `}
      >
        <span className={selected ? 'text-gray-800 dark:text-white/90' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">

          {/* Search input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-transparent dark:text-white/90 focus:outline-none focus:border-brand-400"
            />
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-400">No results found</li>
            ) : (
              filtered.map(o => (
                <li
                  key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false) }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors
                    ${o.value === value
                      ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-900/30 dark:text-brand-400'  // selected highlight
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Error hint */}
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? 'text-error-500' : 'text-gray-500'}`}>{hint}</p>
      )}
    </div>
  )
}

export default SearchableSelect