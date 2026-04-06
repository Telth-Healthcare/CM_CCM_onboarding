import { useNavigate } from 'react-router-dom'
import { STEPS } from './types/Constants'
import { useOnboardForm } from './types/useOnboardForm'
import PersonalInfo       from './Personalinfo'
import AddressInfo        from './Addressinfo'
import PersonalDocuments  from './Personaldocuments'
import EducationDocuments from './Educationdocuments'
import Preview            from './Preview'

// ── Props ─────────────────────────────────────────────────────────────────────
export interface OnboardProps {
  currentId?:    string
  currentIndex?: number
  // Required when admin is filling this form for a specific CCM user
  targetUserId?: number
  // false = inline inside ViewCCMList (default true = URL routing)
  useRouting?:   boolean
  // Callback fired after successful submit in inline mode
  onDone?: () => void
  roleFilter?: string
}


const Spinner = ({ className = '' }: { className?: string }) => (
  <span className={`inline-block rounded-full border-2 border-t-white/80 border-white/20 animate-spin ${className}`} />
)

const StepDots = ({ currentIndex }: { currentIndex: number }) => (
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
            ${done
              ? 'bg-brand-600 border-brand-600 text-white'
              : active
                ? 'bg-white dark:bg-gray-900 border-brand-600 text-brand-600'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400'
            }`}
          >
            {done
              ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              : step.step
            }
          </div>
          <span
            className={`mt-1.5 text-center hidden sm:block text-[10px]
              ${active ? 'text-brand-600 font-semibold' : done ? 'text-gray-500' : 'text-gray-400'}`}
            style={{ maxWidth: 60 }}
          >
            {step.name}
          </span>
        </div>
      )
    })}
  </div>
)

const SaveStatus = ({ appId, saving }: { appId: number | null; saving: boolean }) => {
  if (saving) return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
      <Spinner className="w-3 h-3" />
      Saving…
    </span>
  )
  if (appId) return (
    <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200">
      ✓ Draft saved
    </span>
  )
  return null
}

// Success screen — inline variant has a "Back to list" button instead of dashboard
const SuccessScreen = ({
  refNumber,
  onPrimary,
  primaryLabel,
}: {
  refNumber: string
  onPrimary: () => void
  primaryLabel: string
}) => (
  <div className="flex items-center justify-center p-6 py-16">
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-10 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted!</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
        The CCM onboarding application has been received.
      </p>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Reference Number</p>
        <p className="text-3xl font-bold text-brand-600 tracking-widest">{refNumber}</p>
      </div>
      <button
        onClick={onPrimary}
        className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium transition-colors"
      >
        {primaryLabel}
      </button>
    </div>
  </div>
)

// Step renderer — plain switch, no nested <Routes>
const StepContent = ({ stepId, stepProps }: { stepId: string; stepProps: any }) => {
  switch (stepId) {
    case 'personal-info':       return <PersonalInfo       {...stepProps} />
    case 'address-info':        return <AddressInfo        {...stepProps} />
    case 'personal-documents':  return <PersonalDocuments  {...stepProps} />
    case 'education-documents': return <EducationDocuments {...stepProps} />
    case 'preview':             return <Preview            {...stepProps} />
    default:                    return <PersonalInfo       {...stepProps} />
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CCMOnboard({
  currentId    = 'personal-info',
  currentIndex = 0,
  targetUserId,
  useRouting   = true,
  roleFilter,
  onDone,
}: OnboardProps) {
  const navigate = useNavigate()

  const {
    formData, updateFormData, errors,
    appId, refNumber,
    saving, uploading, isInitialized,
    currentStepId, currentStepIndex,
    handleNext, handlePrev, handleSubmit, handleReplace,
  } = useOnboardForm(currentId, currentIndex, targetUserId, useRouting, roleFilter)

  const isFirst   = currentStepIndex === 0
  const isPreview = currentStepId === 'preview'

  // ── Success state ─────────────────────────────────────────────────────────
  if (refNumber) {
    return (
      <SuccessScreen
        refNumber={refNumber}
        primaryLabel={useRouting ? 'Back to CCM List' : 'Back to List'}
        onPrimary={() => {
          if (useRouting) {
            navigate('/ccm-list')
          } else {
            onDone?.()
          }
        }}
      />
    )
  }

  const stepProps = { formData, updateFormData, errors, onReplace: handleReplace }

  // ── Inline mode (no full-page layout) ────────────────────────────────────
  if (!useRouting) {
    return (
      <div className="bg-gray-50 dark:bg-gray-950">
        {/* Inline header strip */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onDone}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Back to list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-semibold text-gray-800 dark:text-white text-sm">CCM Onboarding</span>
            {targetUserId && (
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                User #{targetUserId}
              </span>
            )}
          </div>
          <SaveStatus appId={appId} saving={saving} />
        </div>

        {/* Step progress */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 pb-4 pt-3">
          <StepDots currentIndex={currentStepIndex} />
        </div>

        {/* Form content */}
        <div className="p-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
            {!isInitialized ? (
              <div className="flex items-center justify-center py-20">
                <span className="w-6 h-6 inline-block rounded-full border-2 border-gray-200 border-t-brand-600 animate-spin" />
              </div>
            ) : (
              <StepContent stepId={currentStepId} stepProps={stepProps} />
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <span className="text-xs text-gray-400">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900
                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {isPreview ? (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <><Spinner className="w-4 h-4" />Submitting…</> : 'Submit Application'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <><Spinner className="w-4 h-4" />Saving…</>
                ) : uploading ? (
                  <><Spinner className="w-4 h-4" />Uploading…</>
                ) : (
                  <>
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── URL-routing mode (full-page layout) ───────────────────────────────────
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
            {targetUserId && (
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded ml-1">
                User #{targetUserId}
              </span>
            )}
          </div>
          <SaveStatus appId={appId} saving={saving} />
        </div>
        <div className="max-w-4xl mx-auto px-6 pb-4">
          <StepDots currentIndex={currentStepIndex} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
          {!isInitialized ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-6 h-6 inline-block rounded-full border-2 border-gray-200 border-t-brand-600 animate-spin" />
            </div>
          ) : (
            <StepContent stepId={currentStepId} stepProps={stepProps} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 hidden sm:block">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900
                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {isPreview ? (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <><Spinner className="w-4 h-4" />Submitting…</> : 'Submit Application'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <><Spinner className="w-4 h-4" />Saving…</>
                ) : uploading ? (
                  <><Spinner className="w-4 h-4" />Uploading…</>
                ) : (
                  <>
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  )
}