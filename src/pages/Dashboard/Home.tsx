import { useEffect, useState } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import PageMeta from "../../components/common/PageMeta";
import { dashboardApi } from "../../api";

export default function Home() {
  const [user, setUser] = useState<number | null>(null);
  const [applications, setApplications] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState([]);
  const [region, setRegion] = useState<number | null>(null);

  const fetchData = async (month?: string) => {
    try {
      const response = await dashboardApi(month);

      setUser(response.total_users);
      setApplications(response.total_applications);
      setDateRange(response.applications);
      setRegion(response.users_with_no_region);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <PageMeta
        title="Telth Partner Console - Dashboard"
        description="Overview of key metrics including total users, active sessions, revenue, and conversion rates."
      />

      <div className="space-y-6">
        {/* Row 1 — Metric cards (full width) */}
        <EcommerceMetrics
          user={user}
          applications={applications}
          region={region}
        />

        {/* Row 2 — Chart (left) + Activity Log (right) */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-8">
            <StatisticsChart dateRange={dateRange} onMonthChange={fetchData} />
          </div>
        </div>
      </div>
    </>
  );
}
