// src/ccm/pages/home/progresstag.tsx

interface ProgressItem {
  id: string;
  label: string;
  value: number;       // 0–100
  total?: string;      // e.g. "2/5"
  color: string;       // tailwind bg color
  icon: React.ReactNode;
}

const PROGRESS_ITEMS: ProgressItem[] = [
  {
    id: "onboarding",
    label: "Onboarding",
    value: 80,
    total: "4/5 steps",
    color: "bg-brand-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "modules",
    label: "Training Modules",
    value: 40,
    total: "2/5 modules",
    color: "bg-purple-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "application",
    label: "Application",
    value: 100,
    total: "Submitted",
    color: "bg-green-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    value: 33,
    total: "1/3 done",
    color: "bg-yellow-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "documents",
    label: "Documents",
    value: 66,
    total: "4/6 uploaded",
    color: "bg-blue-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
];

export default function ProgressTag() {
  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Your Progress</h3>
        <p className="text-xs text-gray-400">Scroll to see all →</p>
      </div>

      {/* Horizontal scroll container — no scrollbar shown */}
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {PROGRESS_ITEMS.map(item => (
          <div
            key={item.id}
            className="flex-shrink-0 w-44 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 flex flex-col gap-3"
          >
            {/* Icon + label */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${item.color} bg-opacity-90`}>
                {item.icon}
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-white/80 leading-tight">{item.label}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{item.total}</span>
                <span className="font-semibold">{item.value}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}