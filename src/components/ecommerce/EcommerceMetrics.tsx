import { User, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BoxIconLine, GroupIcon } from "../../icons";
import { getUserRole } from "../../config/constants";

interface EcommerceMetricsProps {
  user?: number | null;
  applications?: number | null;
  region?: number | null;
  userGrowth?: number;
  applicationGrowth?: number;
  regionGrowth?: number;
}

export default function EcommerceMetrics({
  user,
  applications,
  region,
  userGrowth = 0,
  applicationGrowth = 0,
  regionGrowth = 0,
}: EcommerceMetricsProps) {
  const userRole = getUserRole("admin");
  const showUsersCard = userRole !== "trainer" && userRole !== "financier";
  const isSuperAdmin = userRole === "super_admin";

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  };

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    growth,
  }: {
    title: string;
    value: number | null | undefined;
    icon: React.ElementType;
    growth: number;
  }) => {
    const isPositive = growth >= 0;
    const GrowthIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    const growthColor = isPositive
      ? "text-green-600 dark:text-green-400"
      : "text-red-500 dark:text-red-400";
    const growthBg = isPositive
      ? "bg-green-50 dark:bg-green-900/20"
      : "bg-red-50 dark:bg-red-900/20";

    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
        {/* Icon + Growth badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
          {growth !== 0 && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${growthColor} ${growthBg}`}
            >
              <GrowthIcon className="w-3 h-3" />
              {Math.abs(growth)}%
            </span>
          )}
        </div>

        {/* Value + Label */}
        <div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {formatNumber(value)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {title}
          </p>
        </div>

        {/* Progress bar */}
        {growth !== 0 && (
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isPositive ? "bg-green-400" : "bg-red-400"
              }`}
              style={{ width: `${Math.min(100, Math.abs(growth))}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Analytics Overview
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Real-time metrics and performance indicators
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          isSuperAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        {showUsersCard && (
          <MetricCard
            title="Total Users"
            value={user}
            icon={GroupIcon}
            growth={userGrowth}
          />
        )}
        <MetricCard
          title="CM Applications"
          value={applications}
          icon={BoxIconLine}
          growth={applicationGrowth}
        />

        {isSuperAdmin && (
          <MetricCard
            title="Users with No Region"
            value={region}
            icon={User}
            growth={regionGrowth}
          />
        )}
      </div>
    </div>
  );
}