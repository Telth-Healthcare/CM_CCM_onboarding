// src/ccm/pages/Analytics.tsx
import type { AppData } from "./Home";

interface Props {
  appData?: AppData | null;
}

// ── Timeline event shape ───────────────────────────────────────────────────
interface TimelineEvent {
  id: string;
  action: string;
  detail: string;
  date: Date;
  icon: keyof typeof ICON_MAP;
  color: string;
}

const ICON_MAP = {
  submit:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  upload:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  status:  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  trainer: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  finance: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  account: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
} as const;

const DOC_LABELS: Record<string, string> = {
  pan: "PAN Card",
  aadhar_front: "Aadhar (Front)",
  aadhar_back: "Aadhar (Back)",
  tenth_certificate: "10th Certificate",
};

const STATUS_LABELS: Record<string, { action: string; detail: string }> = {
  under_review: { action: "Application Under Review", detail: "Your application moved into review." },
  approved:     { action: "Application Approved",     detail: "Your application has been approved." },
  rejected:     { action: "Application Not Approved",  detail: "Your application was not approved." },
  assigned:     { action: "Application Assigned",      detail: "Your application was assigned for processing." },
};

// ── Build a real timeline from application data ─────────────────────────────
// NOTE: this app record doesn't carry per-event timestamps (e.g. individual
// document upload times, status-change history). Ideally the backend exposes
// a proper activity log (e.g. GET /applications/:id/activity) with a real
// timestamp per event, and this component should consume that instead. Until
// that exists, we derive the best approximation from the fields we have.
function buildTimeline(app: AppData): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const createdAt = new Date(app.created_at);
  const updatedAt = new Date(app.updated_at);

  // Account / application created
  events.push({
    id: "created",
    action: "Application Submitted",
    detail: `Reference ${app.reference_number} was created.`,
    date: createdAt,
    icon: "submit",
    color: "bg-green-500",
  });

  // Documents — grouped, since we only have one shared timestamp for all of them
  if (app.documents?.length) {
    const labels = app.documents.map(d => DOC_LABELS[d.document_type] ?? d.document_type);
    events.push({
      id: "documents",
      action: "Documents Uploaded",
      detail: labels.join(", "),
      date: createdAt,
      icon: "upload",
      color: "bg-blue-500",
    });
  }

  // Status change — only show if it's meaningfully past "submitted" and the
  // record has actually been touched since creation
  if (app.status !== "submitted" && STATUS_LABELS[app.status] && updatedAt.getTime() !== createdAt.getTime()) {
    const s = STATUS_LABELS[app.status];
    events.push({
      id: "status",
      action: s.action,
      detail: s.detail,
      date: updatedAt,
      icon: "status",
      color: app.status === "approved" ? "bg-green-500" : app.status === "rejected" ? "bg-red-500" : "bg-yellow-500",
    });
  }

  // Trainer assigned
  if (app.assigned_trainer) {
    events.push({
      id: "trainer",
      action: "Trainer Assigned",
      detail: String(app.trainer_details ?? app.assigned_trainer),
      date: updatedAt,
      icon: "trainer",
      color: "bg-purple-500",
    });
  }

  // Financier assigned
  if (app.assigned_financier) {
    events.push({
      id: "financier",
      action: "Financier Assigned",
      detail: String(app.financier_details ?? app.assigned_financier),
      date: updatedAt,
      icon: "finance",
      color: "bg-brand-500",
    });
  }

  // Payment status
  if (app.payment_status === "paid") {
    events.push({
      id: "payment-paid",
      action: "Payment Received",
      detail: `${app.payment_type ?? "Payment"} via ${app.payment_method ?? "online payment"}.`,
      date: updatedAt,
      icon: "finance",
      color: "bg-green-500",
    });
  } else if (app.payment_status === "failed") {
    events.push({
      id: "payment-failed",
      action: "Payment Failed",
      detail: "The last payment attempt did not go through.",
      date: updatedAt,
      icon: "finance",
      color: "bg-red-500",
    });
  }

  // Most recent first
  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ── Relative time formatting (Today / Yesterday / X days ago) ──────────────
function formatRelative(date: Date): string {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);

  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Analytics({ appData }: Props) {
  // Locked until financier is assigned
  const isLocked = !appData?.assigned_financier;
  const timeline = appData ? buildTimeline(appData) : [];

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
            <span className="text-xs text-gray-400">{timeline.length} events</span>
          </div>

          <div className="px-5 py-4">
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No activity yet.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-100 dark:bg-gray-800" />

                <div className="space-y-0">
                  {timeline.map(event => (
                    <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* Icon dot */}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm ${event.color}`}>
                        {ICON_MAP[event.icon]}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{event.action}</p>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{formatRelative(event.date)}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}