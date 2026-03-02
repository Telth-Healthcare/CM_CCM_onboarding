import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../../../shared/context/SidebarContext";
import { CalenderIcon, ChevronDownIcon, GridIcon, HorizontaLDots, UserCircleIcon } from "../../../shared/icons";



type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Ecommerce", path: "/control-center", pro: false }],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/schedule-hub",
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/user-space",
  },
];

const othersItems: NavItem[] = [
  // Add your other menu items here
  // Example:
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Buttons", path: "/buttons" },
  //     { name: "Forms", path: "/forms" },
  //   ],
  // },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              } ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`flex items-center justify-center ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "text-brand-500"
                    : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {nav.name}
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && nav.subItems && (
                <ChevronDownIcon
                  className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                  isActive(nav.path)
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                } ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`flex items-center justify-center ${
                    isActive(nav.path)
                      ? "text-brand-500"
                      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {nav.name}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive(subItem.path)
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-2">
                          {subItem.new && (
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                isActive(subItem.path)
                                  ? "bg-white text-brand-600 dark:bg-brand-900 dark:text-brand-300"
                                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                isActive(subItem.path)
                                  ? "bg-white text-brand-600 dark:bg-brand-900 dark:text-brand-300"
                                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/NatlifeLogo.png"
                alt="Logo"
                width={60}
                height={20}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/NatlifeLogo.png"
                alt="Logo"
                width={60}
                height={20}
              />
            </>
          ) : (
            <img
              src="/images/logo/NatlifeLogo.png"
              alt="Logo"
              width={40}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
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
              {renderMenuItems(navItems, "main")}
            </div>
            {othersItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Others"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(othersItems, "others")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;