// types.ts — CCM onboard form (5 steps)

export interface CCMFormData {
  id?: number

  // Step 1 — Personal Info
  firstName: string
  lastName: string
  dob: string
  language: string
  maritalStatus: string
  gender: string
  bloodGroup: string

  // Step 2 — Contact (inside Step 1 UI)
  mobile: string
  email: string

  // Step 3 — Address
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipcode: string
  country: string

  // Step 4 — ID Documents
  aadharFront: File | null
  aadharBack: File | null
  pan: File | null
  aadharFrontUrl: string | null
  aadharBackUrl: string | null
  panUrl: string | null

  // Step 5 — Education Documents
  bachelorDegreeType: string
  bachelorDoc: File | null
  bachelorDocUrl: string | null
  masterDegreeType: string
  masterDoc: File | null
  masterDocUrl: string | null
  experienceCertType: string
  experienceCertDoc: File | null
  experienceCertDocUrl: string | null
}

export type FormErrors = Partial<Record<keyof CCMFormData, string>>

export interface StepProps {
  formData: CCMFormData
  updateFormData: (field: keyof CCMFormData, value: any) => void
  errors?: FormErrors
  onReplace?: (urlField: keyof CCMFormData, docType: string) => void
}

export interface Step {
  id: string
  name: string
  step: number
}