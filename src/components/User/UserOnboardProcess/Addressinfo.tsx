// steps/AddressInfo.tsx — Step 2

import React, { useState } from 'react'
import axios from 'axios'
import { EditableDropdown, FieldWrapper, FormGrid, StepHeader } from './Index'
import Input from '../../form/input/InputField'
// FIX: use proper StepProps type instead of any
import { StepProps } from './types/Types'

const PINCODE_API = 'https://api.postalpincode.in/pincode'

const AddressInfo: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  const [fetching,    setFetching]    = useState(false)
  const [pinError,    setPinError]    = useState('')
  const [areaCount,   setAreaCount]   = useState(0)
  const [postOffices, setPostOffices] = useState<string[]>([])
  const [blocks,      setBlocks]      = useState<string[]>([])

  const handlePincodeChange = async (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6)
    updateFormData('zipcode', digits)

    if (digits.length < 6) {
      updateFormData('state', '')
      updateFormData('city', '')
      setPostOffices([])
      setBlocks([])
      setPinError('')
      setAreaCount(0)
      return
    }

    setFetching(true)
    setPinError('')
    try {
      const res  = await axios.get(`${PINCODE_API}/${digits}`)
      const data = res.data?.[0]

      if (data?.Status !== 'Success' || !data.PostOffice?.length) {
        setPinError('Invalid pincode — no results found')
        updateFormData('state', '')
        updateFormData('city', '')
        setPostOffices([])
        setBlocks([])
        setAreaCount(0)
        return
      }

      const pos: any[] = data.PostOffice
      updateFormData('state', pos[0].State)
      updateFormData('city',  pos[0].District)

      const names = [...new Set(pos.map((p: any) => p.Name).filter(Boolean))]  as string[]
      const bks   = [...new Set(pos.map((p: any) => p.Block).filter(Boolean))] as string[]
      setPostOffices(names)
      setBlocks(bks)
      setAreaCount(pos.length)
    } catch {
      setPinError('Failed to fetch pincode. Check your connection.')
    } finally {
      setFetching(false)
    }
  }

  return (
    <div>
      <StepHeader
        title="Address Information"
        subtitle="Enter your pincode first — state, district and area options will load automatically"
      />

      <FormGrid>
        {/* Pincode */}
        <FieldWrapper label="Pincode" required hint={pinError || errors?.zipcode}>
          <div className="relative">
            <Input
              type="text" id="zipcode" name="zipcode"
              placeholder="6-digit PIN code"
              value={formData.zipcode}
              inputMode="numeric"
              onChange={e => handlePincodeChange(e.target.value)}
              error={!!errors?.zipcode || !!pinError}
            />
            {fetching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
            )}
          </div>
          {areaCount > 0 && !fetching && (
            <p className="mt-1.5 text-xs font-medium text-green-700 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {areaCount} areas found
            </p>
          )}
        </FieldWrapper>

        {/* Country — locked */}
        <FieldWrapper label="Country">
          <Input
            type="text" id="country" name="country"
            value="India" disabled
            className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
          />
        </FieldWrapper>

        {/* Address Line 1 */}
        <FieldWrapper
          label={postOffices.length > 0 ? 'Address Line 1 — select area then add door no.' : 'Address Line 1'}
          required
          hint={errors?.addressLine1}
          span
        >
          <EditableDropdown
            id="addressLine1"
            value={formData.addressLine1}
            onChange={val => updateFormData('addressLine1', val)}
            options={postOffices}
            placeholder={postOffices.length > 0 ? 'Select area or type door no., street…' : 'Door No, Street Name'}
            error={!!errors?.addressLine1}
          />
        </FieldWrapper>

        {/* Address Line 2 */}
        <FieldWrapper
          label={blocks.length > 0 ? 'Address Line 2 — block / taluk area' : 'Address Line 2'}
          span
        >
          <EditableDropdown
            id="addressLine2"
            value={formData.addressLine2}
            onChange={val => updateFormData('addressLine2', val)}
            options={blocks}
            readOnly={blocks.length > 0}
            placeholder={blocks.length > 0 ? 'Select block / taluk area' : 'Locality / Block (optional)'}
          />
        </FieldWrapper>

        {/* State — auto-filled */}
        <FieldWrapper label="State" required hint={errors?.state}>
          <Input
            type="text" id="state" name="state"
            placeholder="Auto-filled from pincode"
            value={formData.state}
            disabled
            className={`cursor-not-allowed ${
              formData.state
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}
            error={!!errors?.state}
          />
        </FieldWrapper>

        {/* City / District — auto-filled */}
        <FieldWrapper label="City / District" required hint={errors?.city}>
          <Input
            type="text" id="city" name="city"
            placeholder="Auto-filled from pincode"
            value={formData.city}
            disabled
            className={`cursor-not-allowed ${
              formData.city
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}
            error={!!errors?.city}
          />
        </FieldWrapper>
      </FormGrid>
    </div>
  )
}

export default AddressInfo
