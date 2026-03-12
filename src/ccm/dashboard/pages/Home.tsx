// src/ccm/pages/Home.tsx
import { useState, useEffect } from "react";
import HomeHeader    from "./home/header";
import Announcements from "./home/announcements";
import Analytics     from "./home/analytics";
import Tuts          from "./home/tuts";
import { getApplicationStatusApi } from "../../../api/ccmonboard.api";

export interface AppData {
  id: number;
  status: string;
  payment_status: string;
  reference_number: string;
  assigned_trainer: string | null;    // add this
  assigned_financier: string | null;  // add this
  created_at: string;
  updated_at: string;
}

// ─── Widget wrapper ───────────────────────────────────────────────────────────
function BentoCard({ children, className = "", padded = true }: {
  children: React.ReactNode; className?: string; padded?: boolean;
}) {
  return (
    <div className={`
      relative rounded-3xl bg-white dark:bg-white/[0.03]
      shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_16px_0_rgba(0,0,0,0.2)]
      overflow-hidden transition-shadow duration-300
      hover:shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_0_rgba(0,0,0,0.3)]
      ${padded ? "p-5" : ""} ${className}
    `}
      style={{ border: "1.5px solid transparent", backgroundClip: "padding-box", WebkitBackgroundClip: "padding-box" }}
    >
      {/* Animated gradient border */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl z-0" style={{
        padding: "1.5px",
        background: "linear-gradient(135deg, #e0e7ff, #fce7f3, #ede9fe, #e0f2fe)",
        backgroundSize: "300% 300%",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderShift 6s ease infinite",
      }} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function Widget({ title, children, className = "", padded = true, defaultOpen = true }: {
  title: string; children: React.ReactNode; className?: string; padded?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <BentoCard className={className} padded={false}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-4 group">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition">{title}</span>
        <svg className={`w-4 h-4 text-gray-300 dark:text-gray-600 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className={padded ? "px-5 pb-5" : ""}>{children}</div>
      </div>
    </BentoCard>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [appData,  setAppData]  = useState<AppData | null>(null);
  const [loading,  setLoading]  = useState(true);
useEffect(() => {
  const ccmUser   = JSON.parse(localStorage.getItem("ccm_user") || "null");
  const innerUser = ccmUser?.user ?? ccmUser;          // inner user {id:2, ...}
  const appId     = localStorage.getItem(`ccm_draft_pk_${innerUser?.id}`);

  if (!appId) { setLoading(false); return; }           // no app yet — stop

  getApplicationStatusApi(parseInt(appId))
    .then(data => setAppData(data))                    // res.data already unwrapped inside api
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

  return (
    <div className="min-h-screen" style={{
      background: "radial-gradient(ellipse at 20% 0%, #f0f4ff 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, #fdf4ff 0%, transparent 60%), #fafafa",
    }}>
      <style>{`
        @keyframes borderShift {
          0%   { background-position: 0% 50%;   }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%;   }
        }
      `}</style>

      <div className="dark:!bg-gray-950 dark:[background-image:none] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">

          {/* Row 1 — Header with app status + ref number */}
          <BentoCard padded={false} className="w-full">
            <HomeHeader appData={appData} loading={loading} />
          </BentoCard>

          {/* Row 2 — Progress */}
          {/* <Widget title="Your Progress" padded className="w-full">
            <ProgressTag />
          </Widget> */}

          {/* Row 3 — Announcements + Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            <Widget title="Announcements" padded={false} defaultOpen>
              <div className="px-5 pb-5">
                {/* Pass appData — announcements built dynamically from it */}
                <Announcements appData={appData} loading={loading} />
              </div>
            </Widget>
            <Widget title="Activity" padded={false} defaultOpen>
              <div className="px-5 pb-5">
               <Analytics appData={appData} />
              </div>
            </Widget>
          </div>

          {/* Row 4 — Tutorials */}
          <Widget title="Tutorials" padded defaultOpen>
            <Tuts />
          </Widget>

        </div>
      </div>
    </div>
  );
}