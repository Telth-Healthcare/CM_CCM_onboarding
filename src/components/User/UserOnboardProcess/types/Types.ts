// Types.ts — CCM onboard form (5 steps)

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
  manager: string

  // Step 2 — Contact
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

  // Step 5 — Education
  qualLevel: string
  qualStream: string
  qualSub: string
  educationType: string
  
  // Education Documents
  tenthDoc: File | null
  tenthDocUrl: string | null
  twelfthDoc: File | null
  twelfthDocUrl: string | null
  diplomaDoc: File | null
  diplomaDocUrl: string | null
  bachelorDoc: File | null
  bachelorDocUrl: string | null
  masterDoc: File | null
  masterDocUrl: string | null
  otherDoc: File | null
  otherDocUrl: string | null
  otherDocType: string  // ← Add this line
  
  // Generic education document (for backward compatibility)
  eduDoc: File | null
  eduDocUrl: string | null

  // Year / percentage fields
  eduYear: string
  eduPercent: string

  // Experience certificate
  experienceCertType: string
  experienceCertDoc: File | null
  experienceCertDocUrl: string | null
  
  // Legacy fields
  bachelorDegreeType: string
  masterDegreeType: string
}

export type FormErrors = Partial<Record<keyof CCMFormData, string>>

export interface StepProps {
  formData: CCMFormData
  updateFormData: (field: keyof CCMFormData, value: any) => void
  errors?: FormErrors
  onReplace?: (urlField: keyof CCMFormData, docType?: string) => void
  roleList?: OptionType[]
}

export interface Step {
  id: string
  name: string
  step: number
}

export interface OptionType {
  value: string | number
  label: string
}