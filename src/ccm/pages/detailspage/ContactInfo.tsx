// Step 2 — Contact Information
import React from 'react'
import Input from '../../../components/form/input/InputField'
import Label from '../../../components/form/Label'
import { StepProps } from './types'

const ContactInfo: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  if (!formData) return null

  const displayMobile = (formData.mobile ?? '').replace('+91', '')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Contact Information</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your contact details</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Mobile Number */}
        <div>
          <Label htmlFor="mobile">Mobile Number <span className="text-red-500">*</span></Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium select-none">
              +91
            </span>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              placeholder="Enter 10-digit mobile number"
              value={displayMobile}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                updateFormData('mobile', digits ? `+91${digits}` : '')
              }}
              inputMode="numeric"
              maxLength={10}
              pattern="[6-9]\d{9}"
              className={`flex-1 px-4 py-2.5 text-sm border rounded-r-lg outline-none transition-colors
                bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder:text-gray-400
                focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
                ${errors?.mobile
                  ? 'border-error-500 focus:ring-error-500/30 focus:border-error-500'
                  : 'border-gray-300 dark:border-gray-600'
                }`}
            />
          </div>
          {errors?.mobile && (
            <p className="mt-1.5 text-xs text-error-500">{errors.mobile}</p>
          )}
        </div>

        {/* Email ID */}
        <div>
          <Label htmlFor="email">Email ID <span className="text-red-500">*</span></Label>
          <Input
            type="email" id="email" name="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={e => updateFormData('email', e.target.value)}
            error={!!errors?.email} hint={errors?.email}
          />
        </div>

      </div>
    </div>
  )
}

export default ContactInfo
