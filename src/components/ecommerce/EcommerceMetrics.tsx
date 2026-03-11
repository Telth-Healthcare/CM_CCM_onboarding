import { useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { getAllUsers, getApplicationsApi } from "../../api"; // Assuming you have getAllApplications
import { handleAxiosError } from "../../utils/handleAxiosError";
import { toast } from "react-toastify";

interface MetricsData {
  userCount: number;
  applicationCount: number;
  userGrowth: number;
  applicationGrowth: number;
}

export default function EcommerceMetrics() {
  const [metrics, setMetrics] = useState<MetricsData>({
    userCount: 0,
    applicationCount: 0,
    userGrowth: 0,
    applicationGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch both counts in parallel
      const [usersResponse, applicationsResponse] = await Promise.allSettled([
        getAllUsers(),
        getApplicationsApi() // Make sure this API function exists
      ]);

      // Handle users response
      if (usersResponse.status === 'fulfilled') {
        // Assuming the response has a total count or length
        const userCount = usersResponse.value?.count || 0;
        setMetrics(prev => ({ ...prev, userCount }));
      } else {
        const errorMessage = handleAxiosError(usersResponse.reason, "Failed to fetch users");
        toast.error(errorMessage);
      }

      // Handle applications response
      if (applicationsResponse.status === 'fulfilled') {
        const appCount = applicationsResponse.value?.count || 0;
        setMetrics(prev => ({ ...prev, applicationCount: appCount }));
      } else {
        const errorMessage = handleAxiosError(applicationsResponse.reason, "Failed to fetch applications");
        toast.error(errorMessage);
      }

      // Here you would typically calculate growth percentages
      // This could come from your API or be calculated based on previous data
      calculateGrowthMetrics();

    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch metrics");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowthMetrics = async () => {
    // This is a placeholder - you should implement actual growth calculation
    // based on your business logic. For example:
    try {
      // Fetch previous period data and calculate growth
      // const previousUsers = await getPreviousUsersCount();
      // const previousApps = await getPreviousApplicationsCount();
      
      // setMetrics(prev => ({
      //   ...prev,
      //   userGrowth: calculateGrowth(prev.userCount, previousUsers),
      //   applicationGrowth: calculateGrowth(prev.applicationCount, previousApps)
      // }));
    } catch (error) {
      console.error("Error calculating growth metrics:", error);
    }
  };

  // Helper function to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start - Customers --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></span>
              ) : (
                formatNumber(metrics.userCount)
              )}
            </h4>
          </div>
          {!loading && metrics.userGrowth !== 0 && (
            <Badge color={metrics.userGrowth >= 0 ? "success" : "error"}>
              {metrics.userGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.userGrowth).toFixed(2)}%
            </Badge>
          )}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start - Orders/Applications --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Applications
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></span>
              ) : (
                formatNumber(metrics.applicationCount)
              )}
            </h4>
          </div>
          {!loading && metrics.applicationGrowth !== 0 && (
            <Badge color={metrics.applicationGrowth >= 0 ? "success" : "error"}>
              {metrics.applicationGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.applicationGrowth).toFixed(2)}%
            </Badge>
          )}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}