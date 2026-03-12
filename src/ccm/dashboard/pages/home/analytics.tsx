// src/ccm/pages/Analytics.tsx
import type { AppData } from "../Home";

interface Props {
  appData?: AppData | null;
}

const TIMELINE = [
  { id: 1, action: "Application submitted",  detail: "CCM onboarding application sent for review", time: "Today, 10:32 AM",    icon: "submit",  color: "bg-green-500"  },
  { id: 2, action: "Document uploaded",      detail: "Aadhar Front & Back uploaded successfully",  time: "Today, 10:15 AM",    icon: "upload",  color: "bg-blue-500"   },
  { id: 3, action: "Module 2 completed",     detail: "Field Operations — 100% progress",           time: "Yesterday, 3:45 PM", icon: "module",  color: "bg-purple-500" },
  { id: 4, action: "Profile updated",        detail: "Address and personal details saved",         time: "Yesterday, 2:10 PM", icon: "profile", color: "bg-brand-500"  },
  { id: 5, action: "PAN Card uploaded",      detail: "Identity document submitted",                time: "2 days ago",         icon: "upload",  color: "bg-blue-500"   },
  { id: 6, action: "Module 1 completed",     detail: "Community Care Foundations — 100%",          time: "3 days ago",         icon: "module",  color: "bg-purple-500" },
  { id: 7, action: "Account created",        detail: "CCM account registered successfully",        time: "5 days ago",         icon: "account", color: "bg-gray-400"   },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  submit:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  upload:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  module:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  profile: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  account: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

export default function Analytics({ appData }: Props) {
  // Locked until financier is assigned
  const isLocked = !appData?.assigned_financier;

  return (
    <div className="space-y-6">

      {/* Timeline card */}
      <div className="relative rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">

        {/* ── Lock overlay ── */}
        {isLocked && (
          <div className="absolute inset-0 z-10 rounded-2xl backdrop-blur-[3px] bg-white/70 dark:bg-gray-900/70 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-center px-8">
              <p className="text-sm font-semibold text-gray-700 dark:text-white/80">Activity Log Locked</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                Unlocks once a financier is assigned to your application.
              </p>
            </div>
            {/* Subtle lock badge */}
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
              Awaiting financier assignment
            </span>
          </div>
        )}

        {/* Timeline content — blurred + non-interactive when locked */}
        <div className={isLocked ? "pointer-events-none select-none" : ""}>
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Activity Timeline</h3>
            <span className="text-xs text-gray-400">{TIMELINE.length} events</span>
          </div>

          <div className="px-5 py-4">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-100 dark:bg-gray-800" />

              <div className="space-y-0">
                {TIMELINE.map(event => (
                  <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Icon dot */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm ${event.color}`}>
                      {ICON_MAP[event.icon]}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{event.action}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{event.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}