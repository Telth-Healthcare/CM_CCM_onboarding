import { useEffect, useState } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
// import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import { dashboardApi } from "../../api";

export default function Home() {

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [region, setRegion] = useState(null);

  const fetchData = async () => {
    try {
      const response = await dashboardApi();
      console.log(response);
      setUser(response?.total_users);
      setApplications(response?.total_applications);
      setDateRange(response?.applications);
      setRegion(response?.users_with_no_region);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
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
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics  user = {user} applications = {applications} region = {region} />

        </div>

        <div className="col-span-12">
          <StatisticsChart dateRange = {dateRange}/>
        </div>

        {/* <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div> */}
      </div>
    </>
  );
}
