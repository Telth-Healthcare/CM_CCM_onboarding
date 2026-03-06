// types.ts — CCM onboard form (5 steps)

export interface CCMFormData {
  id?: number

  // ── Step 1: Personal Information ──────────────────────────────────
  firstName:     string   // Mandatory
  lastName:      string   // Mandatory
  dob:   string   // Mandatory
  language:      string   // Mandatory
  maritalStatus: string
  gender:        string   // Mandatory
  bloodGroup:    string   // Mandatory

  // ── Step 2: Contact Information ───────────────────────────────────
  mobile:  string   // Pre-filled country code +91, Mandatory
  email:   string   // Mandatory

  // ── Step 3: Address Information ───────────────────────────────────
  addressLine1: string
  addressLine2: string
  city:         string   // Mandatory
  state:        string   // Mandatory
  zipcode:      string   // Mandatory
  country:      string

  // ── Step 4: Document Upload – Personal Identification ─────────────
  aadharFront: File | null   // Mandatory
  aadharBack:  File | null   // Mandatory
  pan:          File | null   // Mandatory

  // ── Step 5: Document Upload – Education Details ───────────────────
  bachelorDegreeType: string
  bachelorDoc:        File | null   // Mandatory
  masterDegreeType:   string
  masterDoc:          File | null
  experienceCertType: string
  experienceCertDoc:  File | null
}

export interface StepProps {
  formData:       CCMFormData
  updateFormData: (field: keyof CCMFormData, value: any) => void
  errors?:        Partial<Record<keyof CCMFormData, string>>
}
