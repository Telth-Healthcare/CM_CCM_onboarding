// src/ccm/pages/Onboard.tsx
// URL-based step navigation: /ccmonboard/personal-info, /ccmonboard/contact-info etc.

import { useState, useCallback, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import PersonalInfo       from './detailspage/PersonalInfo'
import ContactInfo        from './detailspage/ContactInfo'
import AddressInfo        from './detailspage/AddressInfo'
import PersonalDocuments  from './detailspage/PersonalDocuments'
import EducationDocuments from './detailspage/EducationDocuments'
import Preview            from './detailspage/Preview'
import { CCMFormData }    from './detailspage/types'
import {
  createApplicationApi,
  updateApplicationApi,
  submitApplicationApi,
  getApplicationApi,
  uploadDocumentApi,
} from '../../api/ccmonboard.api'
import { handleAxiosError } from '../../utils/handleAxiosError'

// ── Steps — id matches URL segment ───────────────────────────────────────────
const STEPS = [
  { id: 'personal-info',       name: 'Personal Info',  icon: '👤', step: 1 },
  { id: 'contact-info',        name: 'Contact Info',   icon: '📞', step: 2 },
  { id: 'address-info',        name: 'Address',        icon: '🏠', step: 3 },
  { id: 'personal-documents',  name: 'ID Documents',   icon: '🪪', step: 4 },
  { id: 'education-documents', name: 'Education',      icon: '🎓', step: 5 },
  { id: 'preview',             name: 'Preview',        icon: '👁️', step: 6 },
]

// Per-user draft key — prevents two users on same browser from conflicting
const getDraftKey = () => {
  const ccmUser = JSON.parse(localStorage.getItem('ccm_user') || 'null')
  const currentUser = ccmUser?.user ?? ccmUser
  return currentUser?.id ? `ccm_draft_pk_${currentUser.id}` : 'ccm_draft_pk'
}

const INITIAL_FORM: CCMFormData = {
  id:               undefined,
  firstName:        '', lastName:    '', dob: '',
  language:         '', maritalStatus: '', gender: '', bloodGroup: '',
  mobile:           '+91', email: '',
  addressLine1:     '', addressLine2: '', city: '', state: '', zipcode: '', country: 'IN',
  aadharFront:     null, aadharBack: null, pan: null,
  bachelorDegreeType: '', bachelorDoc: null,
  masterDegreeType:   '', masterDoc: null,
  experienceCertType: '', experienceCertDoc: null,
}

const validate = (stepId: string, data: CCMFormData) => {
  const errs: Partial<Record<keyof CCMFormData, string>> = {}
  if (stepId === 'personal-info') {
    if (!data.firstName.trim())  errs.firstName   = 'First name required'
    if (!data.lastName.trim())   errs.lastName    = 'Last name required'
    if (!data.dob)               errs.dob         = 'Date of birth required'
    if (!data.language)          errs.language    = 'Language required'
    if (!data.gender)            errs.gender      = 'Gender required'
    if (!data.bloodGroup)        errs.bloodGroup  = 'Blood group required'
  }
  if (stepId === 'contact-info') {
    const digits = (data.mobile || '').replace('+91', '').replace(/\D/g, '')
    if (!/^\d{10}$/.test(digits))                                errs.mobile = 'Enter valid 10-digit mobile'
    if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email)) errs.email  = 'Enter valid email'
  }
  if (stepId === 'address-info') {
    if (!data.city.trim())                errs.city    = 'City required'
    if (!data.state)                      errs.state   = 'State required'
    if (!/^\d{4,10}$/.test(data.zipcode)) errs.zipcode = 'Enter valid zipcode'
  }
  if (stepId === 'personal-documents') {
    if (!data.aadharFront) errs.aadharFront = 'Aadhar front required'
    if (!data.aadharBack)  errs.aadharBack  = 'Aadhar back required'
    if (!data.pan)          errs.pan          = 'PAN card required'
  }
  if (stepId === 'education-documents') {
    if (!data.bachelorDegreeType) errs.bachelorDegreeType = "Select bachelor's degree"
    if (!data.bachelorDoc)        errs.bachelorDoc        = "Bachelor's document required"
  }
  return errs
}

export default function CCMOnboard() {
  const navigate = useNavigate()
  const location = useLocation()

  // ── Derive current step from URL ──────────────────────────────────────────
  const currentId    = location.pathname.split('/').pop() ?? 'personal-info'
  const currentIndex = Math.max(STEPS.findIndex(s => s.id === currentId), 0)
  const isFirst      = currentIndex === 0
  const isPreview    = currentId === 'preview'

  const [formData,  setFormData]  = useState<CCMFormData>(INITIAL_FORM)
  const [errors,    setErrors]    = useState<Partial<Record<keyof CCMFormData, string>>>({})
  const [saving,    setSaving]    = useState(false)
  const [appId,     setAppId]     = useState<number | null>(null)  // pk from backend
  const [refNumber, setRefNumber] = useState('')

  const updateFormData = useCallback((field: keyof CCMFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev  => ({ ...prev, [field]: undefined }))
  }, [])

  useEffect(() => {
    const ccmUser     = JSON.parse(localStorage.getItem('ccm_user') || 'null')
    const currentUser = ccmUser?.user ?? ccmUser   // inner user object (id:7)

    // ── Step 1: Pre-fill from signup/login user data (id:7) ─────────────────
    // These fields are always available from the login response
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        firstName: currentUser.first_name ?? prev.firstName,
        lastName:  currentUser.last_name  ?? prev.lastName,
        email:     currentUser.email      ?? prev.email,
        mobile:    currentUser.phone      ?? prev.mobile,
      }))
    }

    // ── Step 2: Check if CCM application exists (id:3 = profile_id) ─────────
    // SignInForm stores profile_id into draftKey immediately on login.
    // If it's there → application exists → fetch full data + skip step 1.
    // If not → brand new user, no application yet → stay on step 1.
    const savedPk = localStorage.getItem(getDraftKey())
    if (!savedPk) return   // no application yet — show step 1 normally

    const pk = parseInt(savedPk)
    setAppId(pk)   // sync React state so submit button works

    getApplicationApi(pk)
      .then(data => {
        if (data.is_submitted) {
          toast.info('Your application is already submitted!')
          navigate('/ccm-dashboard', { replace: true })
          return
        }

        // Fill all form fields from the fetched application
        setFormData(prev => ({
          ...prev,
          firstName:     data.first_name      ?? prev.firstName,
          lastName:      data.last_name       ?? prev.lastName,
          dob:           data.dob             ?? prev.dob,
          gender:        ['Male','Female','Other','Prefer_not_say'].find(
                           v => v.toLowerCase() === (data.gender ?? '').toLowerCase()
                         ) ?? prev.gender,
          bloodGroup:    ['A+','A-','B+','B-','AB+','AB-','O+','O-'].find(
                           v => v.toLowerCase() === (data.blood_group ?? '').toLowerCase()
                         ) ?? prev.bloodGroup,
          language:      ['english','hindi','tamil','telugu','kannada','malayalam','marathi','bengali','gujarati','punjabi'].find(
                           v => v.toLowerCase() === (data.language ?? '').toLowerCase()
                         ) ?? prev.language,
          maritalStatus: ['Single','Married','Divorced','Widowed'].find(
                           v => v.toLowerCase() === (data.marital_status ?? '').toLowerCase()
                         ) ?? prev.maritalStatus,
          mobile:        data.mobile          ?? prev.mobile,
          email:         data.email           ?? prev.email,
          addressLine1:  data.address_line_1  ?? prev.addressLine1,
          addressLine2:  data.address_line_2  ?? prev.addressLine2,
          city:          data.district        ?? prev.city,
          state:         data.state           ?? prev.state,
          zipcode:       data.pin_code        ?? prev.zipcode,
          country:       data.country        ?? prev.country,
        }))

        // Application already exists → step 1 is done → skip to step 2
        if (currentId === 'personal-info') {
          navigate('/ccmonboard/contact-info', { replace: true })
        }
      })
      .catch(() => {
        // profile_id was stale/invalid — clear it so next visit starts fresh
        localStorage.removeItem(getDraftKey())
        toast.error('Could not restore draft. Starting fresh.')
      })
  }, [])  // runs once on mount

  // ── Save: POST first time, PATCH after ────────────────────────────────────
  const saveProgress = async (data: CCMFormData): Promise<number | null> => {
    const { aadharFront, aadharBack, pan, bachelorDoc, masterDoc, experienceCertDoc, id, ...rest } = data

    const ccmUser     = JSON.parse(localStorage.getItem('ccm_user') || 'null')
    const currentUser = ccmUser?.user ?? ccmUser

    const cleanPayload: Record<string, any> = {
      first_name:     rest.firstName,
      last_name:      rest.lastName,
      dob:            rest.dob,
      gender:         rest.gender,
      blood_group:    rest.bloodGroup,
      language:       rest.language,
      marital_status: rest.maritalStatus,
      mobile:         rest.mobile,
      email:          rest.email,
      address_line1:  rest.addressLine1,
      address_line2:  rest.addressLine2,
      city:           rest.city,
      state:          rest.state,
      zipcode:        rest.zipcode,
      country:        rest.country,
      user:           currentUser?.id,   // required by backend
    }

    // Strip empty values but always keep `user`
    Object.keys(cleanPayload).forEach(k => {
      const val = cleanPayload[k]
      if (k !== 'user' && (val === undefined || val === null || val === '')) {
        delete cleanPayload[k]
      }
    })

    setSaving(true)
    try {
      // ── BUG 2 FIX: read draft from localStorage, not React state ──────────
      // appId state can be null when user skipped step 1 (state never got set),
      // but localStorage is written before navigate — always reliable.
      const existingPkStr = localStorage.getItem(getDraftKey())
      const existingPk    = existingPkStr ? parseInt(existingPkStr) : null

      if (!existingPk) {
        // No draft anywhere → first ever save → POST
        const res = await createApplicationApi(cleanPayload)
        const pk: number = res.id ?? res.pk
        setAppId(pk)
        localStorage.setItem(getDraftKey(), String(pk))  // write BEFORE navigate
        return pk
      } else {
        // Draft exists → always PATCH regardless of which step we're on
        await updateApplicationApi(existingPk, cleanPayload)
        setAppId(existingPk)   // sync React state in case skip caused it to lag
        return existingPk
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.error('Session expired. Please sign in again.')
        navigate('/ccm-auth/signin', { replace: true })
      } else {
        toast.error(handleAxiosError(err))
      }
      return null
    } finally {
      setSaving(false)
    }
  }

  // ── Upload documents for current step ─────────────────────────────────────
  const uploadDocuments = async (pk: number) => {
    const uploads: { file: File; type: string }[] = []

    if (currentId === 'personal-documents') {
      if (formData.aadharFront) uploads.push({ file: formData.aadharFront, type: 'aadhar_front' })
      if (formData.aadharBack)  uploads.push({ file: formData.aadharBack,  type: 'aadhar_back'  })
      if (formData.pan)          uploads.push({ file: formData.pan,          type: 'pan'           })
    }
    if (currentId === 'education-documents') {
      if (formData.bachelorDoc)       uploads.push({ file: formData.bachelorDoc,       type: 'bachelor_certificate'   })
      if (formData.masterDoc)         uploads.push({ file: formData.masterDoc,         type: 'master_certificate'     })
      if (formData.experienceCertDoc) uploads.push({ file: formData.experienceCertDoc, type: 'experience_certificate' })
    }

    if (uploads.length === 0) return true
    try {
      await Promise.all(uploads.map(u => uploadDocumentApi(u.file, u.type, pk)))
      return true
    } catch (err) {
      toast.error('Document upload failed: ' + handleAxiosError(err))
      return false
    }
  }

  // ── Next: validate → save → navigate ──────────────────────────────────────
  const handleNext = async () => {
    const errs = validate(currentId, formData)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const pk = await saveProgress(formData)
    if (pk === null) return

    const docsOk = await uploadDocuments(pk)
    if (!docsOk) return   // stay on step if upload failed

    navigate(`/ccmonboard/${STEPS[currentIndex + 1].id}`)
  }

  // ── Skip: navigate to next step without validating ───────────────────────
  // Steps 2-5: pk already in localStorage from step 1 — just navigate.
  // Step 1 special case:
  //   - If appId is set (login response had application_status.id) → app exists → just navigate
  //   - If no pk anywhere → brand new user → silently POST to create pk first
  const handleSkip = async () => {
    if (isPreview) return

    if (isFirst) {
      const existingPkStr = localStorage.getItem(getDraftKey())
      const hasPk = existingPkStr || appId   // appId set by useEffect from login response

      if (!hasPk) {
        // Brand new user — no application exists yet → silently POST to create one
        const pk = await saveProgress(formData)
        if (pk === null) return   // POST failed — block navigation
      }
      // hasPk → application already exists → skip safely, next step will PATCH
    }

    navigate(`/ccmonboard/${STEPS[currentIndex + 1].id}`)
  }

  // ── Prev: just go back in URL ──────────────────────────────────────────────
  const handlePrev = () => {
    if (!isFirst) navigate(`/ccmonboard/${STEPS[currentIndex - 1].id}`)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // BUG 2 FIX: read from localStorage in case appId state lagged after skip
    const pkStr = localStorage.getItem(getDraftKey())
    const pk    = pkStr ? parseInt(pkStr) : appId

    if (!pk) { toast.error('Application not saved. Please go back and retry.'); return }

    setSaving(true)
    try {
      const response = await submitApplicationApi(pk)
      const reference = response?.data?.reference_number ?? response?.reference_number
      if (reference) {
        localStorage.removeItem(getDraftKey())   // clear draft after submit
        setRefNumber(reference)
      } else {
        toast.success('Application submitted!')
        navigate('/ccm-dashboard')
      }
    } catch (err) {
      toast.error(handleAxiosError(err))
    } finally {
      setSaving(false)
    }
  }

  const stepProps = { formData, updateFormData, errors }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (refNumber) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Your CCM onboarding application has been received.</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Reference Number</p>
            <p className="text-3xl font-bold text-brand-600 tracking-widest">{refNumber}</p>
          </div>
          <button onClick={() => navigate('/ccm-dashboard')}
            className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="font-semibold text-gray-800 dark:text-white text-sm">CCM Onboarding</span>
          </div>
          <div className="flex items-center gap-3">
            {appId && !saving && (
              <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200">
                ✓ Draft saved
              </span>
            )}
            {saving && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <span className="w-3 h-3 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                Saving…
              </span>
            )}
          </div>
        </div>

        {/* Step progress bar */}
        <div className="max-w-4xl mx-auto px-6 pb-4">
          <div className="flex items-start relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-brand-600 transition-all duration-500"
              style={{ width: currentIndex === 0 ? '0%' : `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step, idx) => {
              const done   = idx < currentIndex
              const active = idx === currentIndex
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all
                    ${done   ? 'bg-brand-600 border-brand-600 text-white'
                    : active ? 'bg-white dark:bg-gray-900 border-brand-600 text-brand-600'
                    :          'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400'}`}
                  >
                    {done
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      : step.step}
                  </div>
                  <span className={`mt-1.5 text-center hidden sm:block text-[10px]
                    ${active ? 'text-brand-600 font-semibold' : done ? 'text-gray-500' : 'text-gray-400'}`}
                    style={{ maxWidth: 60 }}>
                    {step.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
          <Routes>
            <Route index element={<Navigate to="personal-info" replace />} />
            <Route path="personal-info"       element={<PersonalInfo       {...stepProps} />} />
            <Route path="contact-info"        element={<ContactInfo        {...stepProps} />} />
            <Route path="address-info"        element={<AddressInfo        {...stepProps} />} />
            <Route path="personal-documents"  element={<PersonalDocuments  {...stepProps} />} />
            <Route path="education-documents" element={<EducationDocuments {...stepProps} />} />
            <Route path="preview"             element={<Preview            {...stepProps} />} />
          </Routes>
        </div>
      </main>

      {/* Footer nav */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 hidden sm:block">
            Step {currentIndex + 1} of {STEPS.length}
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={handlePrev} disabled={isFirst}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900
                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Skip — shown on all steps except preview */}
            {!isPreview && (
              <button
                onClick={handleSkip}
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                  text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900
                  hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
            )}

            {isPreview ? (
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-sm font-medium text-white
                  hover:bg-green-700 disabled:opacity-50 transition-colors">
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</>
                ) : 'Submit Application'}
              </button>
            ) : (
              <button onClick={handleNext} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 text-sm font-medium text-white
                  hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                ) : <>Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg></>}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}