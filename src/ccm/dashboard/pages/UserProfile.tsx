import { useState } from "react";

// ─── Read CCM user from localStorage (set during sign-in) ────────────────────
function getCCMUser() {
  try {
    const raw = localStorage.getItem("ccm_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  APPROVED: {
    label: "Approved",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
  PENDING: {
    label: "Pending",
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 text-yellow-600 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? {
    label: status,
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-500 border border-gray-200",
  };
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-gray-800 dark:text-white/90 truncate ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-gray-800 dark:text-white/90 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const user = getCCMUser();

  // Fallback to demo data if localStorage is empty (for dev)
  const data = user ?? {
    id: 6,
    email: "shanmugaraj@mytelth.com",
    phone: "+919500536989",
    first_name: "shanmugam",
    last_name: "raJ",
    role: [],
    application_status: {
      id: 2,
      reference_number: "SHG-2026-0002",
      status: "SUBMITTED",
    },
    has_password: true,
    is_active: true,
    is_approved: false,
  };

  const fullName =
    `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "User";
  const initials = getInitials(data.first_name ?? "", data.last_name ?? "");
  const appStatus = data.application_status?.status ?? "PENDING";
  const statusCfg = getStatusConfig(appStatus);
  const refNumber = data.application_status?.reference_number ?? "—";

  const [copied, setCopied] = useState(false);
  const copyRef = () => {
    navigator.clipboard.writeText(refNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your account information and application status.
        </p>
      </div>

      {/* ── Hero card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        {/* Cover banner */}
        <div className="h-28 bg-gradient-to-r from-brand-500 via-brand-400 to-purple-500 relative">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Avatar + name */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-900 bg-brand-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>

            {/* Status badge */}
            <div className="mb-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Name + ID */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 capitalize">
              {fullName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              User ID: <span className="font-mono text-gray-700 dark:text-gray-300">#{data.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Account"
          value={data.is_active ? "Active" : "Inactive"}
          color={data.is_active ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800"}
          icon={
            <svg className={`w-5 h-5 ${data.is_active ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Approval"
          value={data.is_approved ? "Approved" : "Pending"}
          color={data.is_approved ? "bg-green-100 dark:bg-green-900/20" : "bg-yellow-100 dark:bg-yellow-900/20"}
          icon={
            <svg className={`w-5 h-5 ${data.is_approved ? "text-green-600" : "text-yellow-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatCard
          label="Password"
          value={data.has_password ? "Set" : "Not Set"}
          color={data.has_password ? "bg-brand-50 dark:bg-brand-900/20" : "bg-red-50 dark:bg-red-900/20"}
          icon={
            <svg className={`w-5 h-5 ${data.has_password ? "text-brand-500" : "text-red-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
        />
        <StatCard
          label="Application"
          value={statusCfg.label}
          color="bg-blue-50 dark:bg-blue-900/20"
          icon={
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* ── Two columns: contact info + application info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Contact info */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Contact Information</h3>
          </div>
          <div className="px-5 pb-3">
            <InfoRow
              label="Email Address"
              value={data.email ?? "—"}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <InfoRow
              label="Phone Number"
              value={data.phone ?? "—"}
              mono
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />
            <InfoRow
              label="Full Name"
              value={<span className="capitalize">{fullName}</span>}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Application info */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">Application Details</h3>
          </div>
          <div className="px-5 pb-3">
            <InfoRow
              label="Reference Number"
              mono
              value={
                <span className="flex items-center gap-2">
                  {refNumber}
                  <button
                    onClick={copyRef}
                    title="Copy reference number"
                    className="text-gray-400 hover:text-brand-500 transition"
                  >
                    {copied ? (
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </span>
              }
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              }
            />
            <InfoRow
              label="Application Status"
              value={
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              }
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <InfoRow
              label="Application ID"
              mono
              value={`#${data.application_status?.id ?? "—"}`}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              }
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
            {
              label: "Account Active",
              value: data.is_active,
              yes: "Active",
              no: "Inactive",
              yesColor: "text-green-600",
              noColor: "text-red-500",
            },
            {
              label: "Admin Approved",
              value: data.is_approved,
              yes: "Approved",
              no: "Not Yet",
              yesColor: "text-green-600",
              noColor: "text-yellow-500",
            },
            {
              label: "Password Set",
              value: data.has_password,
              yes: "Configured",
              no: "Not Set",
              yesColor: "text-brand-500",
              noColor: "text-red-500",
            },
          ].map((flag) => (
            <div key={flag.label} className="py-3 sm:px-5 first:pl-0 last:pr-0 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${flag.value ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800"}`}>
                {flag.value ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
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