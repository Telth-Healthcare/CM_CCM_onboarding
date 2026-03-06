import { useState } from 'react'

interface VideoLesson {
  id: string
  title: string
  duration: string
  youtubeUrl: string
  description: string
}

interface TrainingModule {
  id: string
  topic: string
  subtitle: string
  tag: string
  tagColor: string
  progress: number
  totalLessons: number
  completedLessons: number
  videos: VideoLesson[]
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function getThumbnail(youtubeUrl: string): string {
  const id = getYouTubeId(youtubeUrl)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : 'https://placehold.co/480x270?text=Video'
}

function getWatchUrl(youtubeUrl: string): string {
  const id = getYouTubeId(youtubeUrl)
  return id ? `https://www.youtube.com/watch?v=${id}` : youtubeUrl
}

const MODULES: TrainingModule[] = [
  {
    id: 'm1', topic: 'Community Care Foundations', subtitle: 'Core principles of community-centred management',
    tag: 'Required', tagColor: 'bg-red-100 text-red-600', progress: 66, totalLessons: 3, completedLessons: 2,
    videos: [
      { id: 'v1', title: 'Introduction to CCM Framework',     duration: '14:32', youtubeUrl: 'https://youtu.be/IivlA4o5RkU', description: 'Overview of the CCM model and its key principles.' },
      { id: 'v2', title: 'Stakeholder Engagement Strategies', duration: '22:10', youtubeUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0', description: 'How to identify and work with community stakeholders.' },
      { id: 'v3', title: 'Documentation & Reporting',         duration: '18:05', youtubeUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8', description: 'Best practices for field documentation.' },
    ],
  },
  {
    id: 'm2', topic: 'Field Operations', subtitle: 'Practical skills for on-ground deployment',
    tag: 'In Progress', tagColor: 'bg-blue-50 text-blue-600', progress: 33, totalLessons: 3, completedLessons: 1,
    videos: [
      { id: 'v4', title: 'Safety Protocols in the Field', duration: '11:47', youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', description: 'Essential safety guidelines before deployment.' },
      { id: 'v5', title: 'Resource Mapping Techniques',   duration: '25:00', youtubeUrl: 'https://www.youtube.com/watch?v=RgKAFK5djSk', description: 'Tools for mapping community resources effectively.' },
      { id: 'v6', title: 'Crisis Response Basics',        duration: '19:15', youtubeUrl: 'https://www.youtube.com/watch?v=fLexgOxsZu0', description: 'First-response principles during community crises.' },
    ],
  },
  {
    id: 'm3', topic: 'Digital Tools & Platforms', subtitle: 'Software and systems used across CCM operations',
    tag: 'Upcoming', tagColor: 'bg-gray-100 text-gray-500', progress: 0, totalLessons: 2, completedLessons: 0,
    videos: [
      { id: 'v7', title: 'Using the CCM Dashboard', duration: '08:30', youtubeUrl: 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', description: 'Walkthrough of features available on your dashboard.' },
      { id: 'v8', title: 'Data Entry & Submissions', duration: '12:45', youtubeUrl: 'https://www.youtube.com/watch?v=pRpeEdMmmQ0', description: 'Correct way to submit field data and forms.' },
    ],
  },
]

// ─── Video Card ───────────────────────────────────────────────────────────────

function VideoCard({ video, isWatched, onWatch }: { video: VideoLesson; isWatched: boolean; onWatch: (id: string) => void }) {
  const [imgError, setImgError] = useState(false)
  const thumb    = getThumbnail(video.youtubeUrl)
  const watchUrl = getWatchUrl(video.youtubeUrl)

  return (
    <a href={watchUrl} target="_blank" rel="noopener noreferrer" onClick={() => onWatch(video.id)}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {!imgError ? (
          <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-red-600 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        {isWatched && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded">{video.duration}</span>
        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          YouTube
        </span>
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors line-clamp-2 leading-snug">{video.title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{video.description}</p>
        <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-brand-500 font-medium">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Watch on YouTube
        </div>
      </div>
    </a>
  )
}

// ─── Module Section ───────────────────────────────────────────────────────────

function ModuleSection({ module, watched, onWatch }: { module: TrainingModule; watched: string[]; onWatch: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">{module.topic}</h3>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${module.tagColor}`}>{module.tag}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{module.subtitle}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 max-w-[200px] h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${module.progress}%` }} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{module.completedLessons}/{module.totalLessons} lessons</span>
          </div>
        </div>
        <span className={`mt-1 transition-transform duration-200 text-gray-400 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {expanded && <div className="border-t border-gray-100 dark:border-gray-800" />}
      {expanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {module.videos.map(v => (
              <VideoCard key={v.id} video={v} isWatched={watched.includes(v.id)} onWatch={onWatch} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Lectures = () => {
  // watched state lives here so stats update when any video is watched
  const [watched, setWatched] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('watched_videos')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const handleWatch = (id: string) => {
    if (watched.includes(id)) return
    const updated = [...watched, id]
    setWatched(updated)
    localStorage.setItem('watched_videos', JSON.stringify(updated))
  }

  const totalModules    = MODULES.length
  const completedModules = MODULES.filter(m => m.progress === 100).length
  const totalVideos     = MODULES.reduce((s, m) => s + m.totalLessons, 0)
  const completedVideos = watched.length
  const overallProgress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0

  const stats = [
    { label: 'Total Modules',    value: totalModules,
      icon: <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> },
    { label: 'Completed',        value: completedModules,
      icon: <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Total Videos',     value: totalVideos,
      icon: <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg> },
    { label: 'Overall Progress', value: `${overallProgress}%`,
      icon: <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Training Modules</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Complete all modules to finish your CCM onboarding training.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 py-4 flex items-center gap-3">
            {stat.icon}
            <div>
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-6 py-4 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Overall Progress</span>
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${overallProgress}%` }} />
        </div>
        <span className="text-sm font-semibold text-brand-500 whitespace-nowrap">{overallProgress}%</span>
      </div>

      {MODULES.map(module => (
        <ModuleSection key={module.id} module={module} watched={watched} onWatch={handleWatch} />
      ))}
    </div>
  )
}

export default Lectures