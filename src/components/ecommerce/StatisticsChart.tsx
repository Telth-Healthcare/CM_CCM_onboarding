import { useEffect, useRef, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import flatpickr from "flatpickr";
import "flatpickr/dist/themes/light.css";
import { getApplicationsApi } from "../../api";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { toast } from "react-toastify";

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
 
export default function StatisticsChart() {
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData>({
    applications: [],
    payments: [],
    categories: []
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get month name helper
  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  // Initialize date picker for month selection
  useEffect(() => {
    if (!datePickerRef.current) return;

    const fp = flatpickr(datePickerRef.current, {
      mode: "single",
      static: true,
      monthSelectorType: "dropdown",
      dateFormat: "F Y", // Display full month name and year
      defaultDate: selectedDate,
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          setSelectedDate(selectedDates[0]);
        }
      },
      // Custom config for month picker
      plugins: [], // Remove the plugin as it might be causing issues
      // This makes it behave like a month picker
      onReady: (_, __, instance) => {
        // Force month picker mode
        instance.config.enableTime = false;
        instance.config.noCalendar = false;
      }
    });

    return () => {
      if (!Array.isArray(fp)) {
        fp.destroy();
      }
    };
  }, []);

  // Update input display when date changes
  useEffect(() => {
    if (datePickerRef.current) {
      const formattedDate = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      datePickerRef.current.value = formattedDate;
    }
  }, [selectedDate]);

  // Fetch data when month/year changes
  useEffect(() => {
    fetchApplicationsData();
  }, [selectedDate]);

  const fetchApplicationsData = async () => {
    setLoading(true);
    try {
      const response = await getApplicationsApi();
      
      // Calculate date range for selected month
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      
      const startDate = new Date(year, month, 1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

      // Filter applications for selected month
      const filteredApplications = response?.results?.filter((app: ApplicationData) => {
        const createdDate = new Date(app.created_at);
        return createdDate >= startDate && createdDate <= endDate;
      }) || [];

      // Process data for daily chart within the month
      const processedData = processMonthlyData(filteredApplications, year, month);
      setChartData(processedData);

    } catch (error) {
      const errorMessage = handleAxiosError(error, "Failed to fetch applications data");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (applications: ApplicationData[], year: number, month: number): ChartData => {
    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const categories: string[] = [];
    const applicationsByDay: number[] = new Array(daysInMonth).fill(0);
    const paymentsByDay: number[] = new Array(daysInMonth).fill(0);

    // Generate day categories (1, 2, 3, ...)
    for (let day = 1; day <= daysInMonth; day++) {
      categories.push(day.toString());
    }

    // Count applications by day
    applications.forEach(app => {
      const createdDate = new Date(app.created_at);
      const day = createdDate.getDate() - 1; // 0-based index
      
      if (day >= 0 && day < daysInMonth) {
        applicationsByDay[day]++;
        
        // Count paid applications
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
        // easing: 'easeinout',
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

  // Calculate totals
  const totalApplications = chartData.applications.reduce((a, b) => a + b, 0);
  const totalPayments = chartData.payments.reduce((a, b) => a + b, 0);
  const conversionRate = totalApplications > 0 
    ? ((totalPayments / totalApplications) * 100).toFixed(1) 
    : "0";

  // Get current month name
  const currentMonthName = getMonthName(selectedDate);
  const currentYear = selectedDate.getFullYear();

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
            CM Applications Statistics - {currentMonthName} {currentYear}
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
        {/* <div className="flex items-center gap-3 sm:justify-end">
          <ChartTab />
          <div className="relative inline-flex items-center">
            <CalenderIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-3 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2 size-5 text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
            <input
              ref={datePickerRef}
              className="h-10 w-10 lg:w-48 lg:h-auto lg:pl-10 lg:pr-3 lg:py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
              placeholder="Select month"
            />
          </div>
        </div> */}
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px] xl:min-w-full">
          <Chart 
            options={options} 
            series={series} 
            type="area" 
            height={310} 
            key={`${currentYear}-${selectedDate.getMonth()}`} // Force re-render when month changes
          />
        </div>
      </div>

      {totalApplications === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No applications found for {currentMonthName} {currentYear}
          </p>
        </div>
      )}
    </div>
  );
}