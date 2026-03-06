import { SidebarProvider, useSidebar } from "../../../context/SidebarContext";
import { Outlet } from "react-router-dom";
import CCMSidebar from "./Sidebar";
import CCMHeader from "./Header";
import Backdrop from "../../../layout/Backdrop";

const CCMLayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  
  return (
    <div className="min-h-screen xl:flex">
      <div>
        <CCMSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <CCMHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <CCMLayoutContent />
    </SidebarProvider>
  );
};

export default DashboardLayout;