import { useState, useEffect } from 'react'
import { Coursefetchapi } from '../../../api/ccm/ccm.api'

// ─── API Types ─────────────────────────────────────────────────────────────────

interface Material {
  id: number
  title: string
  description: string
  type: string            // e.g. "lecture_notes", "reference_material"
  url: string | null      // external link (if type = reference_material)
  file: string | null     // hosted file URL (if type = lecture_notes)
  uploaded_at: string
  subject: number
}

interface Subject {
  id: number
  name: string
  description: string
  img: string | null      // subject thumbnail
  materials: Material[]
  course: number
}

interface CourseDetails {
  id: number
  name: string
  description: string
  img: string | null      // course thumbnail
  aurthor: string         // note: API typo kept as-is
  created_at: string
  subjects: Subject[]
}

interface Enrollment {
  id: number
  user_name: string
  user: number
  enrollment_date: string
  course_details: CourseDetails
}
// ─── Helpers ───────────────────────────────────────────────────────────────────



/** Returns a displayable thumbnail URL for a material or subject */
function getThumbnail(subject: Subject, material: Material): string {
  if (subject.img) return subject.img                                 // subject-level image
  if (material.file && /\.(png|jpe?g|gif|webp|svg)$/i.test(material.file))
    return material.file                                              // file is itself an image
  return `https://placehold.co/480x270/e2e8f0/94a3b8?text=${encodeURIComponent(subject.name)}`
}

/** Maps material.type → human-readable badge label */
function typeLabel(type: string) {
  const map: Record<string, string> = {
    lecture_notes: 'Lecture Notes',
    reference_material: 'Reference',
    assignment: 'Assignment',
    quiz: 'Quiz',
  }
  return map[type] ?? type.replace(/_/g, ' ')
}

/** Badge colour per material type */
function typeBadgeClass(type: string) {
  const map: Record<string, string> = {
    lecture_notes: 'bg-blue-100 text-blue-600',
    reference_material: 'bg-purple-100 text-purple-600',
    assignment: 'bg-amber-100 text-amber-600',
    quiz: 'bg-green-100 text-green-600',
  }
  return map[type] ?? 'bg-gray-100 text-gray-500'
}

/** Returns the action URL — file download or external link */
function getActionUrl(material: Material): string {
  return material.url ?? material.file ?? '#'
}

/** Formats ISO date → "Mar 24, 2026" */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Material Card ─────────────────────────────────────────────────────────────

function MaterialCard({
  material, subject, isViewed, onView,
}: {
  material: Material
  subject: Subject
  isViewed: boolean
  onView: (id: number) => void
}) {
  const [imgError, setImgError] = useState(false)
  const thumb = getThumbnail(subject, material)
  const actionUrl = getActionUrl(material)
  const isLink = !!material.url        // opens external URL

  return (
    <a
      href={actionUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onView(material.id)}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {!imgError ? (
          <img
            src={thumb}
            alt={material.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          // Fallback icon when image fails
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}

        {/* Hover overlay with open icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            {isLink ? (
              // External link icon
              <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            ) : (
              // Download icon
              <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </div>
        </div>

        {/* Viewed checkmark badge */}
        {isViewed && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Upload date badge — bottom right */}
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded">
          {formatDate(material.uploaded_at)}
        </span>

        {/* Material type badge — top left */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${typeBadgeClass(material.type)}`}>
          {typeLabel(material.type)}
        </span>
      </div>

      {/* ── Card body ── */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors line-clamp-2 leading-snug">
          {material.title}
        </h4>
        {material.description ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{material.description}</p>
        ) : (
          <p className="text-xs text-gray-400 italic mt-0.5">No description</p>
        )}

        {/* CTA row */}
        <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-brand-500 font-medium">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isLink
                ? "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                : "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              }
            />
          </svg>
          {isLink ? 'Open Link' : 'Download File'}
        </div>
      </div>
    </a>
  )
}

// ─── Subject Section (mirrors ModuleSection) ───────────────────────────────────

function SubjectSection({
  subject, viewed, onView,
}: {
  subject: Subject
  viewed: number[]
  onView: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const total     = subject.materials.length
  const completed = subject.materials.filter(m => viewed.includes(m.id)).length
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0

  // Tag appearance based on progress
  const tag      = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Upcoming'
  const tagColor = progress === 100
    ? 'bg-green-100 text-green-600'
    : progress > 0
    ? 'bg-blue-50 text-blue-600'
    : 'bg-gray-100 text-gray-500'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">

      {/* ── Collapsible header ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">{subject.name}</h3>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
          </div>
          {subject.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subject.description}</p>
          )}

          {/* Progress bar */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 max-w-[200px] h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {completed}/{total} materials
            </span>
          </div>
        </div>

        {/* Chevron rotates when expanded */}
        <span className={`mt-1 transition-transform duration-200 text-gray-400 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {expanded && <div className="border-t border-gray-100 dark:border-gray-800" />}

      {expanded && (
        <div className="p-6">
          {subject.materials.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No materials uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.materials.map(m => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  subject={subject}
                  isViewed={viewed.includes(m.id)}
                  onView={onView}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const Lectures = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // Persisted set of material IDs the user has opened
  const [viewed, setViewed] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('viewed_materials')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // ── Fetch enrollments on mount ──
  useEffect(() => {
  const fetchEnrollments = async () => {        // async wrapper — useEffect itself can't be async
    try {
      const res = await Coursefetchapi()         // call the api function
      setEnrollments(res.data.results)           // drill into results array
    } catch (err) {
      setError('Failed to load data')            // triggers error UI
    } finally {
      setLoading(false)                          // stops skeleton either way
    }
  }

  fetchEnrollments()                             // actually invoke it
}, [])

  // ── Mark material as viewed (persisted) ──
  const handleView = (id: number) => {
    if (viewed.includes(id)) return
    const updated = [...viewed, id]
    setViewed(updated)
    localStorage.setItem('viewed_materials', JSON.stringify(updated))
  }

  // ── Aggregate stats across all enrollments ──
  const allSubjects  = enrollments.flatMap(e => e.course_details.subjects)
  const allMaterials = allSubjects.flatMap(s => s.materials)
  const totalCourses    = enrollments.length
  const totalMaterials  = allMaterials.length
  const viewedMaterials = viewed.filter(id => allMaterials.some(m => m.id === id)).length
  const overallProgress = totalMaterials > 0
    ? Math.round((viewedMaterials / totalMaterials) * 100)
    : 0
  const completedCourses = enrollments.filter(e =>
    e.course_details.subjects
      .flatMap(s => s.materials)
      .every(m => viewed.includes(m.id))
  ).length

  const stats = [
    {
      label: 'Total Courses', value: totalCourses,
      icon: <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>,
    },
    {
      label: 'Completed', value: completedCourses,
      icon: <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
    },
    {
      label: 'Total Materials', value: totalMaterials,
      icon: <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>,
    },
    {
      label: 'Overall Progress', value: `${overallProgress}%`,
      icon: <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>,
    },
  ]

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="h-12 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-500/10 p-6 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Failed to load training modules</p>
        <p className="text-xs text-red-400 mt-1">{error}</p>
      </div>
    )
  }

  // ── Empty state ──
  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12 text-center">
        <p className="text-sm text-gray-500">No enrollments found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Page heading ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Training Modules</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Complete all modules to finish your CM onboarding training.
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 py-4 flex items-center gap-3">
            {stat.icon}
            <div>
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Overall progress bar ── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-6 py-4 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Overall Progress</span>
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-700"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-brand-500 whitespace-nowrap">{overallProgress}%</span>
      </div>

      {/* ── One section per enrollment → course → subjects ── */}
      {enrollments.map(enrollment => (
        <div key={enrollment.id} className="space-y-4">

          {/* Course header card */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-6 py-4 flex items-center gap-4">
            {enrollment.course_details.img ? (
              <img
                src={enrollment.course_details.img}
                alt={enrollment.course_details.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              // Placeholder icon when course has no image
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-800 dark:text-white/90 truncate">
                {enrollment.course_details.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By {enrollment.course_details.aurthor} · Enrolled {formatDate(enrollment.enrollment_date)}
              </p>
            </div>
          </div>

          {/* Subjects inside this course */}
          {enrollment.course_details.subjects.map(subject => (
            <SubjectSection
              key={subject.id}
              subject={subject}
              viewed={viewed}
              onView={handleView}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Lectures