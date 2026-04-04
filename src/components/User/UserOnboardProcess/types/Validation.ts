// validation.ts — per-step form validation

import { CCMFormData, FormErrors } from './Types'

// ── Helpers ───────────────────────────────────────────────────────────────────
const required = (value: string, label: string): string | undefined =>
  !value?.trim() ? `${label} is required` : undefined

const getAge = (dob: string): number => {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ── Per-step validators ───────────────────────────────────────────────────────
const validatePersonalInfo = (data: CCMFormData): FormErrors => {
  const errors: FormErrors = {}

  errors.firstName = required(data.firstName, 'First name')
  errors.lastName  = required(data.lastName,  'Last name')
  errors.language  = !data.language  ? 'Language is required'   : undefined
  errors.gender    = !data.gender    ? 'Gender is required'     : undefined
  errors.bloodGroup = !data.bloodGroup ? 'Blood group is required' : undefined

  if (!data.dob) {
    errors.dob = 'Date of birth is required'
  } else {
    const age = getAge(data.dob)
    if (age < 18) errors.dob = 'Must be at least 18 years old'
    else if (age > 80) errors.dob = 'Must be 80 years old or younger'
  }

  const digits = (data.mobile ?? '').replace('+91', '').replace(/\D/g, '')
  if (!/^\d{10}$/.test(digits)) errors.mobile = 'Enter a valid 10-digit mobile number'

  if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email))
    errors.email = 'Enter a valid email address'

  return errors
}

const validateAddressInfo = (data: CCMFormData): FormErrors => {
  const errors: FormErrors = {}

  errors.city  = required(data.city, 'City')
  errors.state = !data.state ? 'State is required' : undefined

  if (!/^\d{4,10}$/.test(data.zipcode)) errors.zipcode = 'Enter a valid pincode'

  return errors
}

const validatePersonalDocuments = (data: CCMFormData): FormErrors => {
  const errors: FormErrors = {}

  if (!data.aadharFront && !data.aadharFrontUrl) errors.aadharFront = 'Aadhar front is required'
  if (!data.aadharBack  && !data.aadharBackUrl)  errors.aadharBack  = 'Aadhar back is required'
  if (!data.pan         && !data.panUrl)         errors.pan         = 'PAN card is required'

  return errors
}

const validateEducationDocuments = (data: CCMFormData): FormErrors => {
  const errors: FormErrors = {}

  if (!data.bachelorDegreeType && !data.bachelorDocUrl)
    errors.bachelorDegreeType = "Select a bachelor's degree"
  if (!data.bachelorDoc && !data.bachelorDocUrl)
    errors.bachelorDoc = "Bachelor's document is required"

  return errors
}

// ── Step-to-validator map ─────────────────────────────────────────────────────
const VALIDATORS: Record<string, (data: CCMFormData) => FormErrors> = {
  'personal-info':       validatePersonalInfo,
  'address-info':        validateAddressInfo,
  'personal-documents':  validatePersonalDocuments,
  'education-documents': validateEducationDocuments,
}

// ── Main export ───────────────────────────────────────────────────────────────
export const validateStep = (stepId: string, data: CCMFormData): FormErrors => {
  const validator = VALIDATORS[stepId]
  if (!validator) return {}

  // Strip undefined values — keeps errors object clean
  const raw = validator(data)
  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined)
  )
}