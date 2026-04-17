import { useEffect, useState } from "react";
import { getActivityLogsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { toast } from "react-toastify";

interface LogMeta {
  old_status?: string;
  new_status?: string;
}

interface ActivityLog {
  id: number;
  action: string;
  object_type: string;
  object_id: number;
  metadata: LogMeta;
  created_at: string;
  actor: number;
}

const ACTION_FILTERS = [
  { label: "All", value: "all" },
  { label: "Status changes", value: "status_changed" },
  { label: "Created", value: "application_created" },
  { label: "Updated", value: "application_updated" },
];

function dotColor(action: string) {
  if (action === "application_created") return "bg-green-500";
  if (action === "status_changed") return "bg-blue-500";
  return "bg-amber-500";
}

function badgeStyle(action: string) {
  if (action === "application_created")
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (action === "status_changed")
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
}

function badgeLabel(action: string) {
  const map: Record<string, string> = {
    application_created: "Created",
    application_updated: "Updated",
    status_changed: "Status",
  };
  return map[action] ?? action;
}

function statusChipStyle(status: string) {
  if (status === "submitted")
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  if (status === "under_review")
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  if (status === "assigned")
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (status === "rejected")
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  return "bg-gray-100 text-gray-600";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ActivityLogs({ applicationId }: { applicationId: number }) {
  const [filter, setFilter] = useState("all");
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const fetchLogs = async () => {
    try {
      const data = await getActivityLogsApi(applicationId);
      setLogs(data?.results ?? []);
    } catch (error) {
      const errorMessage = handleAxiosError(
        error,
        "Error fetching activity logs",
      );
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [])

  const filtered =
    filter === "all" ? logs : logs.filter((l) => l.action === filter);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Activity Log
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Recent system events
            </p>
          </div>
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-all duration-150 ${
                filter === f.value
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                  : "bg-white dark:bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-0">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            No events for this filter
          </div>
        ) : (
          filtered.map((log, idx) => (
            <div key={log.id} className="flex gap-3 group">
              {/* Timeline */}
              <div className="flex flex-col items-center w-5 flex-shrink-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-3.5 flex-shrink-0 z-10 ${dotColor(log.action)}`}
                />
                {idx < filtered.length - 1 && (
                  <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 mt-1" />
                )}
              </div>

              {/* Card */}
              <div
                className={`flex-1 py-3 ${
                  idx < filtered.length - 1
                    ? "border-b border-gray-100 dark:border-gray-800"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-gray-800 dark:text-white/90">
                    {log.object_type} - {log.action.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badgeStyle(log.action)}`}
                  >
                    {badgeLabel(log.action.replace(/_/g, " "))}
                  </span>
                </div>

                {/* Status flow */}
                {log.action === "status_changed" && log.metadata.old_status && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusChipStyle(log.metadata.old_status)}`}
                    >
                      {log.metadata.old_status.replace(/_/g, " ")}
                    </span>
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusChipStyle(log.metadata.new_status ?? "")}`}
                    >
                      {log.metadata.new_status?.replace(/_/g, " ")}
                    </span>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {formatTime(log.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
