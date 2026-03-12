// src/ccm/pages/home/header.tsx
import type { AppData } from "../Home";

function getBaseUser() {
  try {
    const raw = JSON.parse(localStorage.getItem("ccm_user") || "null");
    return raw?.user ?? raw;
  } catch { return null; }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}



const PAY_STYLE: Record<string, string> = {
  pending: "bg-orange-50 text-orange-500 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
  paid:    "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800",
  failed:  "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-800",
};



const PAY_LABEL: Record<string, string> = {
  pending: "Payment Pending",
  paid:    "Paid",
  failed:  "Payment Failed",
};

interface Props {
  appData: AppData | null;
  loading: boolean;
}

export default function HomeHeader({ appData, loading }: Props) {
  const user      = getBaseUser();
  const cap       = (s = "") => s.replace(/\b\w/g, c => c.toUpperCase());
  const firstName = cap(user?.first_name ?? "there");

  const now  = new Date();
  const date = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const appStatus = appData?.status ?? "";
  const payStatus = appData?.payment_status ?? "";
  const refNo     = appData?.reference_number ?? "";

  return (
    <div className="overflow-hidden w-full">
      <div className="h-1 bg-gradient-to-r from-brand-300 via-brand-200 to-purple-200" />

      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Left — greeting + date */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 shadow">
            <span className="text-lg font-bold text-white">
              {(user?.first_name?.[0] ?? "?").toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
              {getGreeting()}, {firstName} 👋
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {date}
              <span className="text-gray-300">·</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {time}
            </p>
          </div>
        </div>

        {/* Right — ref number + statuses + bell */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Reference number */}
          {!loading && refNo && (
            <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              {refNo}
            </span>
          )}


          {/* Payment status badge */}
          {!loading && payStatus && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${PAY_STYLE[payStatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
              {PAY_LABEL[payStatus] ?? payStatus}
            </span>
          )} 

          {/* Loading shimmer */}
          {loading && (
            <>
              <div className="h-7 w-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="h-7 w-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </>
          )}

          {/* Notification bell — unread dot if under review or payment pending */}
          <button className="relative w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition ml-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Dot shown when status needs attention */}
            {(appStatus === "under_review" || payStatus === "pending") && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}