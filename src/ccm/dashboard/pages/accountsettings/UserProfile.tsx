import { useState, useEffect } from "react";
import { getApplicationApi } from "../../../../api/ccm/ccmonboard.api";

// ── Module-level cache — survives tab switches / route changes, resets on refresh ──
// Keyed by userId so multiple users on same browser don't share data
const _appCache: Record<string, any> = {};

// ── Get stored draft pk (application id = profile_id) ────────────────────────
function getDraftKey() {
  try {
    const ccmUser    = JSON.parse(localStorage.getItem("ccm_user") || "null");
    const innerUser  = ccmUser?.user ?? ccmUser;
    return innerUser?.id ? `ccm_draft_pk_${innerUser.id}` : "ccm_draft_pk";
  } catch { return "ccm_draft_pk"; }
}

// ── Get base user info (id:7) from localStorage ───────────────────────────────
function getBaseUser() {
  try {
    const raw = JSON.parse(localStorage.getItem("ccm_user") || "null");
    return raw?.user ?? raw;   // inner user object {id:7, first_name, ...}
  } catch { return null; }
}

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  SUBMITTED:    { label: "Submitted",    dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  APPROVED:     { label: "Approved",     dot: "bg-green-500",  badge: "bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
  PENDING:      { label: "Pending",      dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-600 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" },
  REJECTED:     { label: "Rejected",     dot: "bg-red-500",    badge: "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
  Unregistered: { label: "Unregistered", dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-500 border border-gray-200" },
};
const getStatusConfig = (s: string) =>
  STATUS_CONFIG[s] ?? { label: s, dot: "bg-gray-400", badge: "bg-gray-100 text-gray-500 border border-gray-200" };

function getInitials(first = "", last = "") {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

// ── Reusable components ───────────────────────────────────────────────────────
function InfoRow({ icon, label, value, mono = false }: {
  icon: React.ReactNode; label: string; value: string | React.ReactNode; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-gray-800 dark:text-white/90 truncate ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-gray-800 dark:text-white/90 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const baseUser = getBaseUser();   // id:7 data from localStorage

  // Full application data from API (id:3)
  const [app,     setApp]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    const draftKey = getDraftKey();                        // e.g. "ccm_draft_pk_7"
    const pk       = localStorage.getItem(draftKey);

    if (!pk) { setLoading(false); return; }               // no application yet

    // Return cached data immediately — no re-fetch on tab switch or route change
    if (_appCache[draftKey]) {
      setApp(_appCache[draftKey]);
      setLoading(false);
      return;
    }

    // First load: fetch from API and store in cache
    getApplicationApi(parseInt(pk))
      .then(data => {
        _appCache[draftKey] = data;                        // cache for this session
        setApp(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Derive display values ─────────────────────────────────────────────────
  // Prefer API data, fall back to localStorage user data
  const user      = app?.user ?? baseUser;
  const cap = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase()); // capitalize each word
  const firstName = cap(user?.first_name ?? "");
  const lastName  = cap(user?.last_name  ?? "");
  const fullName  = `${firstName} ${lastName}`.trim() || "User";
  const initials  = getInitials(firstName, lastName);
  const email     = user?.email ?? "";
  const phone     = user?.phone ?? "";

  // Application-level fields from API response
  const regStatus = app?.registration_status ?? "Unregistered";
  const statusCfg = getStatusConfig(app?.is_submitted ? "SUBMITTED" : regStatus);
  const appId     = app?.id ?? "—";
  const dob       = app?.dob       ? new Date(app.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const gender        = app?.gender         ?? "—";
  const bloodGroup    = app?.blood_group    ?? "—";
  const language      = app?.language       ? app.language.charAt(0).toUpperCase() + app.language.slice(1) : "—";
  const maritalStatus = app?.marital_status ?? "—";
  const state         = app?.state          ?? "—";
  const country       = app?.country        ?? "—";
  const addressLine1  = app?.address_line_1 ?? "";
  const addressLine2  = app?.address_line_2 ?? "";
  const district      = app?.district       ?? "";
  const pinCode       = app?.pin_code       ?? "";
  const fullAddress   = [addressLine1, addressLine2, district, state, pinCode, country].filter(Boolean).join(", ") || "—";

  const copyRef = () => {
    navigator.clipboard.writeText(String(appId)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your account information and application details.</p>
      </div>

      {/* ── Hero card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-500 via-brand-400 to-purple-500">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-900 bg-brand-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            <div className="mb-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
                {statusCfg.label}
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">{fullName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Application ID: <span className="font-mono text-gray-700 dark:text-gray-300">#{appId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Account" value={user?.is_active ? "Active" : "Inactive"}
          color={user?.is_active ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800"}
          icon={<svg className={`w-5 h-5 ${user?.is_active ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Approval" value={user?.is_approved ? "Approved" : "Pending"}
          color={user?.is_approved ? "bg-green-100 dark:bg-green-900/20" : "bg-yellow-100 dark:bg-yellow-900/20"}
          icon={<svg className={`w-5 h-5 ${user?.is_approved ? "text-green-600" : "text-yellow-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
        />
        <StatCard label="Submitted" value={app?.is_submitted ? "Yes" : "No"}
          color={app?.is_submitted ? "bg-brand-50 dark:bg-brand-900/20" : "bg-red-50 dark:bg-red-900/20"}
          icon={<svg className={`w-5 h-5 ${app?.is_submitted ? "text-brand-500" : "text-red-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatCard label="Registration" value={regStatus}
          color="bg-blue-50 dark:bg-blue-900/20"
          icon={<svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>}
        />
      </div>

      {/* ── Contact + Personal Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Contact Information</h3>
          </div>
          <div className="px-5 pb-3">
            <InfoRow label="Full Name" value={fullName}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            <InfoRow label="Email Address" value={email}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            <InfoRow label="Phone Number" value={phone} mono
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
            />
          </div>
        </div>

        {/* Personal details from application */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Personal Details</h3>
          </div>
          <div className="px-5 pb-3">
            <InfoRow label="Date of Birth" value={dob}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
            <InfoRow label="Gender" value={gender}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            <InfoRow label="Blood Group" value={bloodGroup}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
            />
            <InfoRow label="Language" value={language}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>}
            />
            <InfoRow label="Marital Status" value={maritalStatus}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
            />
          </div>
        </div>
      </div>

      {/* ── Address + Application Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Address */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Address</h3>
          </div>
          <div className="px-5 pb-3">
            <InfoRow label="Full Address" value={fullAddress}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <InfoRow label="State" value={state}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
            />
            <InfoRow label="Pin Code" value={pinCode || "—"} mono
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
            />
          </div>
        </div>

        {/* Application */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Application Details</h3>
          </div>
          <div className="px-5 pb-3">
            <InfoRow label="Application ID" mono
              value={
                <span className="flex items-center gap-2">
                  #{appId}
                  <button onClick={copyRef} title="Copy" className="text-gray-400 hover:text-brand-500 transition">
                    {copied
                      ? <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                  </button>
                </span>
              }
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>}
            />
            <InfoRow label="Registration Status" value={regStatus}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            />
            <InfoRow label="Submitted" value={app?.is_submitted ? "Yes" : "No"}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <InfoRow label="Member Since" value={app?.created_at ? new Date(app.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
          </div>
        </div>
      </div>

      {/* ── Account flags ── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Account Flags</h3>
        </div>
        <div className="px-5 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
          {[
            { label: "Account Active",  value: user?.is_active,   yes: "Active",     no: "Inactive",  yesColor: "text-green-600",  noColor: "text-red-500"    },
            { label: "Admin Approved",  value: user?.is_approved, yes: "Approved",   no: "Not Yet",   yesColor: "text-green-600",  noColor: "text-yellow-500" },
            { label: "Phone Verified",  value: user?.phone_verified, yes: "Verified", no: "Not Verified", yesColor: "text-brand-500", noColor: "text-red-500" },
          ].map(flag => (
            <div key={flag.label} className="py-3 sm:px-5 first:pl-0 last:pr-0 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${flag.value ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800"}`}>
                {flag.value
                  ? <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  : <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                }
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{flag.label}</p>
                <p className={`text-sm font-semibold ${flag.value ? flag.yesColor : flag.noColor}`}>
                  {flag.value ? flag.yes : flag.no}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;