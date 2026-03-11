import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GridIcon,
  HorizontaLDots,
  UserCircleIcon,
  CloseLineIcon,
  AngleRightIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import logo from "../assets/TELTH LOGO.png";
import { Map, NotebookIcon } from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string; // Made path required since no submenus
  roles?: string[];
};

interface AdminUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  roles?: string[];
}

const getAdminUser = (): AdminUser | null => {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Simplified navItems without submenus
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <UserCircleIcon />,
    name: "Users",
    path: "/users",
  },
  {
    icon: <NotebookIcon />,
    name: "Applications",
    path: "/applications",
  },
  {
    icon: <Map />,
    name: "Regions",
    path: "/regions",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const adminUser = getAdminUser();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    // Clear all auth data
    localStorage.clear();
    sessionStorage.clear();
    
    // Navigate to signin
    navigate("/admin/signin", { replace: true });
    setShowLogoutModal(false);
  };

  const cancelLogout = () => setShowLogoutModal(false);

  // Updated isActive to handle both exact matches and subpaths
const isActive = useCallback(
  (path: string) => location.pathname.startsWith(path),
  [location.pathname]
);

  // No submenu effects needed anymore

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => (
        <li key={nav.name}>
          <Link
            to={nav.path}
            className={`menu-item group ${
              isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
            } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
          >
            <span
              className={`menu-item-icon-size ${
                isActive(nav.path)
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
              }`}
            >
              {nav.icon}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text">{nav.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  const avatarLetter =
    adminUser?.first_name?.[0]?.toUpperCase() ||
    adminUser?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <>
      <aside
        className={`fixed flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
          ${isExpanded || isMobileOpen ? "w-[230px]" : isHovered ? "w-[230px]" : "w-[90px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div
          className={`py-8 flex ${
            !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
        >
          <Link to="/dashboard">
            {isExpanded || isHovered || isMobileOpen ? (
              <img src={logo} alt="Logo" width={150} height={40} />
            ) : (
              <img src={logo} alt="Logo" width={32} height={32} />
            )}
          </Link>
        </div>

        {/* Scrollable nav + bottom user block */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Nav */}
          <div className="flex-1 overflow-y-auto no-scrollbar duration-300 ease-linear">
            <nav className="mb-6">
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Menu"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(navItems)}
              </div>
            </nav>
          </div>

          {/* User info + Sign out — pinned to bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-6">
            {isExpanded || isHovered || isMobileOpen ? (
              <div className="flex flex-col gap-2">
                {/* User card */}
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {avatarLetter}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {adminUser?.email || ""}
                    </span>
                    {adminUser?.roles?.[0] && (
                      <span className="text-xs text-brand-500 font-medium capitalize mt-0.5">
                        {adminUser.roles[0].replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sign out */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-200 text-sm font-medium"
                >
                  <AngleRightIcon className="w-5 h-5 rotate-180 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              // Collapsed state
              <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold">
                  {avatarLetter}
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-200"
                >
                  <AngleRightIcon className="w-5 h-5 rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={cancelLogout}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fadeIn">
            <button
              onClick={cancelLogout}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <CloseLineIcon className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
              <AngleRightIcon className="w-8 h-8 text-red-500 rotate-180" />
            </div>

            <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
              Sign Out
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to sign out? You will be redirected to the
              login page.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default AppSidebar;