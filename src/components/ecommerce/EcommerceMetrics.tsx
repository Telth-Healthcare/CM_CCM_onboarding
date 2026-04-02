import {
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import { getUserRole } from "../../config/constants";
import { User, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  regionGrowth = 0
}: EcommerceMetricsProps) {
  const userRole = getUserRole("admin");
  const showUsersCard = userRole !== "trainer" && userRole !== "financier";

  const formatNumber = (num: number | null | undefined): string => {
    // Handle null, undefined, or invalid values
    if (num === null || num === undefined || isNaN(num)) {
      return "0";
    }
    
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    growth 
  }: any) => {
    const isPositive = growth >= 0;
    const growthColor = isPositive ? "text-green-600" : "text-red-600";
    const GrowthIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-gray-400 to-transparent opacity-10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-gray-400 to-transparent opacity-10 rounded-full blur-2xl animate-pulse"></div>
        </div>

        <div className="relative p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {title}
              </span>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90 transition-all duration-300 group-hover:scale-105">
                  {formatNumber(value)}
                </h4>
                {growth !== undefined && growth !== 0 && (
                  <span className={`inline-flex items-center text-xs font-semibold ${growthColor}`}>
                    <GrowthIcon className="w-3 h-3 mr-0.5" />
                    {Math.abs(growth)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Icon className="size-6" />
            </div>
          </div>

          {/* Animated Progress Bar - only show if growth is provided */}
          {growth !== undefined && growth !== 0 && (
            <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${Math.min(100, Math.abs(growth))}%`
                }}
              />
            </div>
          )}

          {/* Subtle Border Animation */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Analytics Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time metrics and performance indicators
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        {userRole === "super_admin" && (
          <MetricCard
            title="Users with No Region"
            value={region}
            icon={User}
            growth={regionGrowth}
          />
        )}
      </div>

      {/* Add Custom CSS for Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}