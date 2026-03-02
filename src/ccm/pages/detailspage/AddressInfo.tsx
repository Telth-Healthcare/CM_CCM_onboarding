// Step 3 — Address Information
import React, { useEffect, useState } from 'react'
import Input from '../../../components/form/input/InputField'
import Label from '../../../components/form/Label'
import Select from '../../../components/form/Select'
import { StepProps } from './types'

// Indian states list (no external hook needed)
const INDIAN_STATES = [
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Manipur', label: 'Manipur' },
  { value: 'Meghalaya', label: 'Meghalaya' },
  { value: 'Mizoram', label: 'Mizoram' },
  { value: 'Nagaland', label: 'Nagaland' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Sikkim', label: 'Sikkim' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Tripura', label: 'Tripura' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Delhi', label: 'Delhi (NCT)' },
  { value: 'Jammu and Kashmir', label: 'Jammu & Kashmir' },
  { value: 'Ladakh', label: 'Ladakh' },
  { value: 'Puducherry', label: 'Puducherry' },
  { value: 'Chandigarh', label: 'Chandigarh' },
  { value: 'Andaman and Nicobar Islands', label: 'Andaman & Nicobar Islands' },
  { value: 'Dadra and Nagar Haveli', label: 'Dadra & Nagar Haveli' },
  { value: 'Daman and Diu', label: 'Daman & Diu' },
  { value: 'Lakshadweep', label: 'Lakshadweep' },
]

const AddressInfo: React.FC<StepProps> = ({ formData, updateFormData, errors }) => {
  if (!formData) return null

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Address Information</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your address details</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Address Line 1 */}
        <div className="sm:col-span-2">
          <Label htmlFor="addressLine1">Address Line 1</Label>
          <Input
            type="text" id="addressLine1" name="addressLine1"
            placeholder="Door No, Street Name"
            value={formData.addressLine1}
            onChange={e => updateFormData('addressLine1', e.target.value)}
          />
        </div>

        {/* Address Line 2 */}
        <div className="sm:col-span-2">
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input
            type="text" id="addressLine2" name="addressLine2"
            placeholder="Area, Landmark (optional)"
            value={formData.addressLine2}
            onChange={e => updateFormData('addressLine2', e.target.value)}
          />
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
          <Input
            type="text" id="city" name="city"
            placeholder="Enter city"
            value={formData.city}
            onChange={e => updateFormData('city', e.target.value)}
            error={!!errors?.city}
            hint={errors?.city}
          />
        </div>

        {/* State */}
        <div>
          <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
          <Select
            value={formData.state}
            onChange={val => updateFormData('state', val)}
            options={INDIAN_STATES}
            placeholder="Select State"
            error={!!errors?.state}
            hint={errors?.state}
          />
        </div>

        {/* Zipcode */}
        <div>
          <Label htmlFor="zipcode">Zipcode <span className="text-red-500">*</span></Label>
          <Input
            type="text" id="zipcode" name="zipcode"
            placeholder="Enter 6-digit PIN code"
            value={formData.zipcode}
            onChange={e => updateFormData('zipcode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            error={!!errors?.zipcode}
            hint={errors?.zipcode}
          />
        </div>

        {/* Country — fixed to India for now */}
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            type="text" id="country" name="country"
            value="India"
            disabled
            onChange={() => {}}
          />
        </div>

      </div>
    </div>
  )
}

export default AddressInfo
