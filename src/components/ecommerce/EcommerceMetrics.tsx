import { useEffect, useState } from "react";
import {
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import { getAllUsers, getApplicationsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { toast } from "react-toastify";
import { getUserRole } from "../../config/constants";

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
    applicationGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const userRole = getUserRole("admin");

  const showUsersCard = userRole !== "trainer" && userRole !== "financier";

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const promises = [];
      
      if (showUsersCard) {
        promises.push(getAllUsers());
      } else {
        promises.push(Promise.resolve(null));
      }
      
      promises.push(getApplicationsApi());

      const [usersResponse, applicationsResponse] = await Promise.allSettled(promises);

      if (showUsersCard && usersResponse.status === "fulfilled") {
        const userCount = usersResponse.value?.count || 
                         usersResponse.value?.length || 
                         usersResponse.value?.data?.count || 
                         0;
        setMetrics((prev) => ({ ...prev, userCount }));
      } else if (usersResponse.status === "rejected" && showUsersCard) {
        const errorMessage = handleAxiosError(
          usersResponse.reason,
          "Failed to fetch users",
        );
        toast.error(errorMessage);
      }

      if (applicationsResponse.status === "fulfilled") {
        const appCount = applicationsResponse.value?.count || 
                        applicationsResponse.value?.length || 
                        applicationsResponse.value?.data?.count || 
                        0;
        setMetrics((prev) => ({ ...prev, applicationCount: appCount }));
      } else {
        const errorMessage = handleAxiosError(
          applicationsResponse.reason,
          "Failed to fetch applications",
        );
        toast.error(errorMessage);
      }

      calculateGrowthMetrics();
    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch metrics");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowthMetrics = async () => {
    setMetrics(prev => ({
      ...prev,
      userGrowth: 5.2,
      applicationGrowth: 2.8,
    }));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {showUsersCard && (
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
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              CM Applications
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></span>
              ) : (
                formatNumber(metrics.applicationCount)
              )}
            </h4>
          </div>
          
        </div>
      </div>
    </div>
  );
}