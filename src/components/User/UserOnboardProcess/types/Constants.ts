// constants.ts — all static config for CCM onboard

import { Step } from './Types'

// ── Wizard steps ─────────────────────────────────────────────────────────────
export const STEPS: Step[] = [
  { id: 'personal-info',       name: 'Personal Info', step: 1 },
  { id: 'address-info',        name: 'Address',       step: 2 },
  { id: 'personal-documents',  name: 'ID Documents',  step: 3 },
  { id: 'education-documents', name: 'Education',     step: 4 },
  { id: 'preview',             name: 'Preview',       step: 5 },
]

// ── Select options ────────────────────────────────────────────────────────────
export const LANGUAGE_OPTIONS = [
  { value: 'english',   label: 'English' },
  { value: 'hindi',     label: 'Hindi' },
  { value: 'tamil',     label: 'Tamil' },
  { value: 'telugu',    label: 'Telugu' },
  { value: 'kannada',   label: 'Kannada' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'marathi',   label: 'Marathi' },
  { value: 'bengali',   label: 'Bengali' },
  { value: 'gujarati',  label: 'Gujarati' },
  { value: 'punjabi',   label: 'Punjabi' },
]

export const MARITAL_STATUS_OPTIONS = [
  { value: 'single',   label: 'Single' },
  { value: 'married',  label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed',  label: 'Widowed' },
]

export const GENDER_OPTIONS = [
  { value: 'male',           label: 'Male' },
  { value: 'female',         label: 'Female' },
  { value: 'other',          label: 'Other' },
  { value: 'prefer_not_say', label: 'Prefer not to say' },
]

export const BLOOD_GROUP_OPTIONS = [
  { value: 'A+',  label: 'A+' },
  { value: 'A-',  label: 'A-' },
  { value: 'B+',  label: 'B+' },
  { value: 'B-',  label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+',  label: 'O+' },
  { value: 'O-',  label: 'O-' },
]

export const BACHELOR_DEGREE_OPTIONS = [
  { value: 'bsc',      label: 'B.Sc.' },
  { value: 'bcom',     label: 'B.Com.' },
  { value: 'ba',       label: 'B.A.' },
  { value: 'btech',    label: 'B.Tech / B.E.' },
  { value: 'bba',      label: 'BBA' },
  { value: 'bca',      label: 'BCA' },
  { value: 'mbbs',     label: 'MBBS' },
  { value: 'bpharm',   label: 'B.Pharm' },
  { value: 'bed',      label: 'B.Ed.' },
  { value: 'llb',      label: 'LLB' },
  { value: 'other_ug', label: 'Other UG Degree' },
]

export const MASTER_DEGREE_OPTIONS = [
  { value: 'msc',      label: 'M.Sc.' },
  { value: 'mcom',     label: 'M.Com.' },
  { value: 'ma',       label: 'M.A.' },
  { value: 'mtech',    label: 'M.Tech / M.E.' },
  { value: 'mba',      label: 'MBA' },
  { value: 'mca',      label: 'MCA' },
  { value: 'mpharm',   label: 'M.Pharm' },
  { value: 'med',      label: 'M.Ed.' },
  { value: 'llm',      label: 'LLM' },
  { value: 'other_pg', label: 'Other PG Degree' },
]

export const EXPERIENCE_CERT_OPTIONS = [
  { value: 'experience_letter', label: 'Experience Letter' },
  { value: 'relieving_letter',  label: 'Relieving Letter' },
  { value: 'service_cert',      label: 'Service Certificate' },
  { value: 'other',             label: 'Other' },
]

// ── Document field descriptors ────────────────────────────────────────────────
export const ID_DOCUMENT_FIELDS = [
  { field: 'aadharFront', urlField: 'aadharFrontUrl', label: 'Aadhar – Front Side', required: true  },
  { field: 'aadharBack',  urlField: 'aadharBackUrl',  label: 'Aadhar – Back Side',  required: true  },
  { field: 'pan',         urlField: 'panUrl',         label: 'PAN Card',             required: true  },
] as const

// ── Limits ────────────────────────────────────────────────────────────────────
export const MAX_FILE_SIZE_MB = 5
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// ── DOB bounds (age 18–80) ────────────────────────────────────────────────────
const today = new Date()
export const DOB_MAX = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  .toISOString().split('T')[0]
export const DOB_MIN = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate())
  .toISOString().split('T')[0]

// ── Initial form state ────────────────────────────────────────────────────────
export const INITIAL_FORM_DATA = {
  id: undefined,
  firstName: '', lastName: '', dob: '',
  language: '', maritalStatus: '', gender: '', bloodGroup: '',
  mobile: '+91', email: '',
  addressLine1: '', addressLine2: '', city: '', state: '', zipcode: '', country: 'IN',
  aadharFront: null, aadharBack: null, pan: null,
  aadharFrontUrl: null, aadharBackUrl: null, panUrl: null,
  bachelorDegreeType: '', bachelorDoc: null, bachelorDocUrl: null,
  masterDegreeType: '',   masterDoc: null,   masterDocUrl: null,
  experienceCertType: '', experienceCertDoc: null, experienceCertDocUrl: null,
}