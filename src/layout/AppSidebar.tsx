import { useCallback, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Layers,
  LayoutDashboard,
  Mail,
  MapPin,
  MapPinHouse,
  Phone,
  Users,
} from "lucide-react";
import { HorizontaLDots, CloseLineIcon, AngleRightIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import logo from "../assets/TELTH LOGO.png";
import { signoutApi } from "../api";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubNavItem = {
  name: string;
  path: string;
  roles?: string[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  subItems?: SubNavItem[];
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

const iconClass = "h-5 w-5 shrink-0";

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className={iconClass} />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <Users className={iconClass} />,
    name: "User Management",
    subItems: [
      { name: "MNP User", path: "/admin", roles: ["super_admin"] },
      { name: "Trainer", path: "/trainer", roles: ["super_admin", "admin"] },
      {
        name: "Financier",
        path: "/financier",
        roles: ["super_admin", "admin"],
      },
      { name: "CCM", path: "/ccm-list", roles: ["super_admin", "admin"] },
      { name: "CM", path: "/cm-list", roles: ["super_admin", "admin"] },
    ],
  },
  {
    icon: <MapPinHouse className={iconClass} />,
    name: "Miscellaneous",
    path: "/miscellaneous",
    roles: ["super_admin"],
  },
  {
    icon: <ClipboardList className={iconClass} />,
    name: "Enrollments",
    path: "/enrollments",
  },
  {
    icon: <BookOpen className={iconClass} />,
    name: "Course",
    subItems: [
      {
        name: "Course",
        path: "/course",
        roles: ["super_admin", "admin", "trainer"],
      },
      {
        name: "Group",
        path: "/group",
        roles: ["super_admin", "admin", "trainer"],
      },
    ],
  },
  {
    icon: <Layers className={iconClass} />,
    name: "Applications",
    path: "/applications",
  },
  {
    icon: <MapPin className={iconClass} />,
    name: "Regions",
    path: "/regions",
    roles: ["super_admin"],
  },
  {
    icon: <Mail className={iconClass} />,
    name: "Webinars",
    path: "/webinars",
    roles: ["super_admin", "admin"],
  },
  {
    icon: <Phone className={iconClass} />,
    name: "Contact",
    path: "/contact",
    roles: ["super_admin", "admin"],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const adminUser = getAdminUser();

  const userRole = useMemo(() => {
    if (adminUser?.roles && adminUser.roles.length > 0)
      return adminUser.roles[0];
    return localStorage.getItem("admin_role");
  }, [adminUser]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const toggleGroup = (name: string) =>
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const handleSignOut = () => setShowLogoutModal(true);
  
  const cancelLogout = () => setShowLogoutModal(false);

  const confirmLogout = () => {
    signoutApi();
    setShowLogoutModal(false);
  };

  const isActive = useCallback(
    (path: string) =>
      location.pathname === path || location.pathname.startsWith(path + "/"),
    [location.pathname],
  );

  const filteredNavItems = useMemo(() => {
    return navItems
      .filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!userRole) return false;
        return item.roles.includes(userRole);
      })
      .map((item) => {
        if (!item.subItems) return item;
        const visibleSubs = item.subItems.filter((sub) => {
          if (!sub.roles || sub.roles.length === 0) return true;
          if (!userRole) return false;
          return sub.roles.includes(userRole);
        });
        return { ...item, subItems: visibleSubs };
      })
      .filter((item) => !item.subItems || item.subItems.length > 0);
  }, [userRole]);

  const isSidebarOpen = isExpanded || isHovered || isMobileOpen;

  const renderMenuItems = (items: NavItem[]) => {
    if (items.length === 0)
      return (
        <div className="text-center text-gray-400 text-sm py-4">
          No menu items available
        </div>
      );

    return (
      <ul className="flex flex-col gap-1">
        {items.map((nav) => {
          // ── Item with subItems (accordion) ──────────────────────────────
          if (nav.subItems && nav.subItems.length > 0) {
            const isOpen = openGroups.includes(nav.name);
            const anyChildActive = nav.subItems.some((s) => isActive(s.path));

            return (
              <li key={nav.name} className="px-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(nav.name)}
                  className={`
                    w-full flex items-center gap-3 rounded-lg transition-all duration-200
                    ${isSidebarOpen ? "px-3 py-2.5" : "px-2 py-2.5 justify-center"}
                    ${
                      anyChildActive
                        ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <span
                    className={`${iconClass} ${anyChildActive ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {nav.icon}
                  </span>

                  {isSidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">
                        {nav.name}
                      </span>
                      <AngleRightIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        } ${anyChildActive ? "text-brand-600 dark:text-brand-400" : "text-gray-400"}`}
                      />
                    </>
                  )}
                </button>

                {/* SubItems list */}
                {isSidebarOpen && isOpen && (
                  <ul className="mt-1 ml-11 flex flex-col gap-1">
                    {nav.subItems.map((sub) => (
                      <li key={sub.path}>
                        <Link
                          to={sub.path}
                          className={`
                            block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${
                              isActive(sub.path)
                                ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            }
                          `}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }

          // ── Regular item (link) ─────────────────────────────────────────
          const isItemActive = isActive(nav.path!);

          return (
            <li key={nav.name} className="px-2">
              <Link
                to={nav.path!}
                className={`
                  flex items-center gap-3 rounded-lg transition-all duration-200
                  ${isSidebarOpen ? "px-3 py-2.5" : "px-2 py-2.5 justify-center"}
                  ${
                    isItemActive
                      ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <span
                  className={`${iconClass} ${isItemActive ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {nav.icon}
                </span>
                {isSidebarOpen && (
                  <span className="text-sm font-medium">{nav.name}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  const avatarLetter =
    adminUser?.first_name?.[0]?.toUpperCase() ||
    adminUser?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <>
      <aside
        className={`
          fixed flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100
          h-screen transition-all duration-300 ease-in-out z-50
          ${isExpanded || isMobileOpen ? "w-[230px]" : isHovered ? "w-[230px]" : "w-[90px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div
          className={`
          py-6 px-5 border-b border-gray-200 dark:border-gray-800
          ${!isExpanded && !isHovered ? "flex justify-center" : ""}
        `}
        >
          <Link to="/dashboard" className="block">
            {isSidebarOpen ? (
              <img src={logo} alt="Logo" className="h-10 w-auto" />
            ) : (
              <img src={logo} alt="Logo" className="h-8 w-auto" />
            )}
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <div
            className={`
            mb-4 px-5
            ${!isExpanded && !isHovered ? "text-center" : ""}
          `}
          >
            <h2
              className={`
              text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500
              ${!isExpanded && !isHovered ? "flex justify-center" : ""}
            `}
            >
              {isSidebarOpen ? (
                "Main Menu"
              ) : (
                <HorizontaLDots className="w-5 h-5" />
              )}
            </h2>
          </div>

          <nav className="flex-1">{renderMenuItems(filteredNavItems)}</nav>
        </div>

        {/* User Section - Pinned to bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          {isSidebarOpen ? (
            <div className="space-y-3">
              {/* User Profile Card */}
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm shrink-0">
                  <span
                    onClick={() => navigate("/profile")}
                    className="cursor-pointer"
                  >
                    {avatarLetter}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {adminUser?.first_name ||
                      adminUser?.email?.split("@")[0] ||
                      "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {adminUser?.email || ""}
                  </p>
                  {userRole && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 capitalize">
                      {userRole.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 group"
              >
                <AngleRightIcon className="w-5 h-5 rotate-180 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          ) : (
            // Collapsed State
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {avatarLetter}
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
              >
                <AngleRightIcon className="w-5 h-5 rotate-180" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelLogout}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fadeIn">
            <button
              onClick={cancelLogout}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        /* Custom scrollbar for sidebar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .dark .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #475569;
        }
        
        .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </>
  );
};

export default AppSidebar;
