import PageMeta from "../../../../shared/components/common/PageMeta";
import DemographicCard from "../ecommerce/DemographicCard";
import EcommerceMetrics from "../ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../ecommerce/MonthlySalesChart";
import MonthlyTarget from "../ecommerce/MonthlyTarget";
import RecentOrders from "../ecommerce/RecentOrders";
import StatisticsChart from "../ecommerce/StatisticsChart";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Telth Partner Console - Dashboard"
        description="Overview of key metrics including total users, active sessions, revenue, and conversion rates. Track monthly sales performance and regional demographics."
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}