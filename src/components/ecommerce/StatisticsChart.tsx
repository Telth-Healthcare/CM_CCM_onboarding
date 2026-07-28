import { useEffect, useRef, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { CalenderIcon } from "../../icons";

interface ApplicationData {
  id: number;
  created_at: string;
  status: string;
  payment_status: string;
}

interface ChartData {
  applications: number[];
  payments: number[];
  categories: string[];
}

interface StatisticsChartProps {
  dateRange: ApplicationData[];
}

export default function StatisticsChart({ dateRange }: StatisticsChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData>({
    applications: [],
    payments: [],
    categories: []
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Get available years from data
  const getAvailableYears = (): number[] => {
    if (!dateRange || dateRange.length === 0) {
      return [new Date().getFullYear()];
    }
    
    const years = dateRange.map(app => new Date(app.created_at).getFullYear());
    const uniqueYears = [...new Set(years)];
    return uniqueYears.sort((a, b) => b - a); // Most recent first
  };

  // Get all months (always show all 12 months)
  const getAllMonths = (): { value: number; label: string }[] => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })
    }));
  };

  // Get month name helper
  const getMonthName = (month: number): string => {
    return new Date(2024, month, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  // Process data when dateRange or selected month/year changes
  useEffect(() => {
    if (dateRange && dateRange.length > 0) {
      setLoading(true);
      
      const filteredApplications = dateRange.filter(app => {
        const appDate = new Date(app.created_at);
        return appDate.getFullYear() === selectedYear && 
               appDate.getMonth() === selectedMonth;
      });
      
      const processedData = processMonthlyData(filteredApplications, selectedYear, selectedMonth);
      setChartData(processedData);
      setLoading(false);
    } else {
      setChartData({
        applications: [],
        payments: [],
        categories: []
      });
      setLoading(false);
    }
  }, [dateRange, selectedMonth, selectedYear]);

  const processMonthlyData = (applications: ApplicationData[], year: number, month: number): ChartData => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const categories: string[] = [];
    const applicationsByDay: number[] = new Array(daysInMonth).fill(0);
    const paymentsByDay: number[] = new Array(daysInMonth).fill(0);

    for (let day = 1; day <= daysInMonth; day++) {
      categories.push(day.toString());
    }

    applications.forEach(app => {
      const createdDate = new Date(app.created_at);
      const day = createdDate.getDate() - 1;
      
      if (day >= 0 && day < daysInMonth) {
        applicationsByDay[day]++;
        
        if (app.payment_status === 'completed' || app.payment_status === 'paid') {
          paymentsByDay[day]++;
        }
      }
    });

    return {
      applications: applicationsByDay,
      payments: paymentsByDay,
      categories
    };
  };

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      labels: {
        colors: "#6B7280"
      }
    },
    colors: ["#465FFF", "#10B981"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 800
      }
    },
    stroke: {
      curve: "smooth",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 4,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => `${value} applications`,
      },
    },
    xaxis: {
      type: "category",
      categories: chartData.categories,
      title: {
        text: "Day of Month",
        style: {
          fontSize: "12px",
          color: "#6B7280"
        }
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6B7280",
        },
        rotate: 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        maxHeight: 120,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (value: number) => Math.round(value).toString(),
      },
      title: {
        text: "Number of Applications",
        style: {
          fontSize: "12px",
          color: "#6B7280"
        }
      },
      min: 0,
      forceNiceScale: true,
    },
  };

  const series = [
    {
      name: "Applications",
      data: chartData.applications,
    },
    {
      name: "Payments",
      data: chartData.payments,
    },
  ];

  const totalApplications = chartData.applications.reduce((a, b) => a + b, 0);
  const totalPayments = chartData.payments.reduce((a, b) => a + b, 0);
  const conversionRate = totalApplications > 0 
    ? ((totalPayments / totalApplications) * 100).toFixed(1) 
    : "0";

  const currentMonthName = getMonthName(selectedMonth);
  const availableYears = getAvailableYears();
  const allMonths = getAllMonths();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-[310px] bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            CM Applications Statistics - {currentMonthName} {selectedYear}
          </h3>
          <div className="flex flex-wrap gap-4 mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Applications: <span className="font-semibold text-gray-800 dark:text-white">{totalApplications}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Payments: <span className="font-semibold text-gray-800 dark:text-white">{totalPayments}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conversion Rate: <span className="font-semibold text-green-600">{conversionRate}%</span>
            </p>
          </div>
        </div>
        
        {/* Month and Year Dropdowns */}
        <div className="flex items-center gap-3 sm:justify-end">
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              {allMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
              {availableYears.length === 0 && (
                <option value={new Date().getFullYear()}>
                  {new Date().getFullYear()}
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px] xl:min-w-full">
          <Chart 
            options={options} 
            series={series} 
            type="area" 
            height={310} 
            key={`${selectedYear}-${selectedMonth}`}
          />
        </div>
      </div>

      {totalApplications === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No applications found for {currentMonthName} {selectedYear}
          </p>
        </div>
      )}
    </div>
  );
}