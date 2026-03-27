// src/ccm/pages/home/announcements.tsx
import { useState, useEffect } from "react";
import type { AppData } from "./Home";

type AnnouncementType = "broadcast" | "personal";

interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  body: string;
  from: string;
  time: string;
  read: boolean;
  tag?: string;
}

const TAG_COLORS: Record<string, string> = {
  Application: "bg-brand-50 text-brand-600 dark:bg-brand-900/20",
  Payment:     "bg-orange-50 text-orange-500 dark:bg-orange-900/20",
  Trainer:     "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
  Financier:   "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
  General:     "bg-gray-100 text-gray-500 dark:bg-gray-800",
};

// ── Status display config ─────────────────────────────────────────────────────
const APP_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  under_review: { label: "Under Review", color: "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800", dot: "bg-yellow-500" },
  approved:     { label: "Approved",     color: "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800",   dot: "bg-green-500"  },
  rejected:     { label: "Rejected",     color: "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",             dot: "bg-red-500"    },
  pending:      { label: "Pending",      color: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700",          dot: "bg-gray-400"   },
  assigned:     { label: "Assigned",     color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",        dot: "bg-blue-500"   },  // ← add this
};

const PAY_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: "Payment Pending", color: "bg-orange-50 text-orange-500 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800", dot: "bg-orange-500" },
  paid:    { label: "Paid",            color: "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800",      dot: "bg-green-500"  },
  failed:  { label: "Payment Failed",  color: "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",               dot: "bg-red-500"    },
};

// ── Status summary card — pinned at top of announcements ─────────────────────
function StatusCard({ app }: { app: AppData }) {
  const appCfg = APP_STATUS[app.status] ?? { label: app.status, color: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" };
  const payCfg = PAY_STATUS[app.payment_status] ?? { label: app.payment_status, color: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" };

  const rows = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "Reference",
      value: <span className="font-mono font-semibold text-gray-700 dark:text-white/80">{app.reference_number}</span>,
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: "Application",
      value: (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${appCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${appCfg.dot} animate-pulse`} />
          {appCfg.label}
        </span>
      ),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      label: "Payment",
      value: (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${payCfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${payCfg.dot} animate-pulse`} />
          {payCfg.label}
        </span>
      ),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: "Trainer",
      value: app.assigned_trainer
        ? <span className="text-xs font-semibold text-green-600">{String(app.assigned_trainer)}</span>
        : <span className="text-xs text-gray-400 italic">Not yet assigned</span>,
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: "Financier",
      value: app.assigned_financier
        ? <span className="text-xs font-semibold text-green-600">{String(app.assigned_financier)}</span>
        : <span className="text-xs text-gray-400 italic">Not yet assigned</span>,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden mb-4">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-white/80">Application Summary</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 flex-shrink-0">
              {row.icon}
              <span className="text-xs text-gray-500 dark:text-gray-400">{row.label}</span>
            </div>
            <div className="text-right">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Build dynamic announcements from appData ──────────────────────────────────
function buildAnnouncements(app: AppData | null): Announcement[] {
  if (!app) return [];
  const list: Announcement[] = [];
  const updatedDate = new Date(app.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  // App status message
  const statusMessages: Record<string, { title: string; body: string }> = {
    under_review: { title: "Application Under Review",  body: "Your CCM application is being reviewed. We'll notify you once a decision is made." },
    approved:     { title: "Application Approved!",     body: "Congratulations! Your application has been approved." },
    rejected:     { title: "Application Not Approved",  body: "Your application was not approved. Contact support for more info." },
  };
  if (statusMessages[app.status]) {
    list.push({ id: "app-status", type: "personal", ...statusMessages[app.status], from: "System", time: updatedDate, read: app.status === "approved", tag: "Application" });
  }

  // Payment pending
  if (app.payment_status === "pending") {
    list.push({ id: "payment-pending", type: "personal", title: "Payment Pending", body: `Fee payment for ${app.reference_number} is pending. Complete it to proceed.`, from: "Finance", time: updatedDate, read: false, tag: "Payment" });
  }

  // Trainer
  if (app.assigned_trainer) {
    list.push({ id: "trainer-assigned", type: "personal", title: "Trainer Assigned", body: `Trainer assigned: ${app.assigned_trainer}. Expect to be contacted soon.`, from: "Training Team", time: updatedDate, read: false, tag: "Trainer" });
  } else if (app.status === "under_review") {
    list.push({ id: "trainer-pending", type: "personal", title: "Trainer Not Yet Assigned", body: "A trainer will be assigned once your review is complete.", from: "Training Team", time: updatedDate, read: true, tag: "Trainer" });
  }

  // Financier
  if (app.assigned_financier) {
    list.push({ id: "financier-assigned", type: "personal", title: "Financier Assigned", body: `Financier assigned: ${app.assigned_financier}.`, from: "Finance Team", time: updatedDate, read: false, tag: "Financier" });
  } else if (app.status === "under_review") {
    list.push({ id: "financier-pending", type: "personal", title: "Financier Not Yet Assigned", body: "A financier will be assigned after your review is complete.", from: "Finance Team", time: updatedDate, read: true, tag: "Financier" });
  }

  return list;
}

type Filter = "all" | "broadcast" | "personal";

interface Props {
  appData: AppData | null;
  loading: boolean;
}

export default function Announcements({ appData, loading }: Props) {
  const [items,  setItems]  = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => { setItems(buildAnnouncements(appData)); }, [appData]);

  const markRead    = (id: string) => setItems(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  const markAllRead = ()           => setItems(prev => prev.map(a => ({ ...a, read: true })));

  const filtered  = filter === "all" ? items : items.filter(a => a.type === filter);
  const unreadCnt = items.filter(a => !a.read).length;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />  {/* status card shimmer */}
        {[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">

      {/* ── Status summary card — always pinned at top ── */}
      {appData && <StatusCard app={appData} />}

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Announcements</h3>
          {unreadCnt > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">{unreadCnt}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(["all"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                filter === f
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {unreadCnt > 0 && (
            <button onClick={markAllRead} className="text-xs text-brand-500 hover:underline">Mark all read</button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm">No announcements here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} onClick={() => markRead(a.id)}
              className={`rounded-2xl border px-5 py-4 flex gap-4 cursor-pointer transition group ${
                a.read
                  ? "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
                  : "border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-900/10"
              }`}>
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                a.type === "broadcast" ? "bg-purple-100 text-purple-500 dark:bg-purple-900/20" : "bg-brand-100 text-brand-500 dark:bg-brand-900/20"
              }`}>
                {a.type === "broadcast"
                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className={`text-sm font-semibold truncate ${a.read ? "text-gray-700 dark:text-white/80" : "text-gray-900 dark:text-white"}`}>{a.title}</p>
                  {!a.read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                  {a.tag && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[a.tag] ?? "bg-gray-100 text-gray-500"}`}>{a.tag}</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{a.body}</p>
                <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <span>{a.from}</span><span className="text-gray-300">·</span><span>{a.time}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}