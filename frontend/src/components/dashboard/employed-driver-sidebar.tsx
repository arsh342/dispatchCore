import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Calendar,
  MessageSquare,
  ChevronsRight,
  Moon,
  Sun,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

const navItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/employed-driver/dashboard",
  },
  {
    icon: ClipboardList,
    label: "Assigned Orders",
    href: "/employed-driver/orders",
  },
  {
    icon: Truck,
    label: "Active Deliveries",
    href: "/employed-driver/deliveries",
  },
  {
    icon: Calendar,
    label: "Shift Schedule",
    href: "/employed-driver/schedule",
  },
  { icon: MessageSquare, label: "Messages", href: "/employed-driver/messages" },
];

export function EmployedDriverSidebar({ isDark, setIsDark }: SidebarProps) {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const driverName =
    localStorage.getItem("dc_driver_name") ||
    localStorage.getItem("dc_user_name") ||
    "Driver";
  const companyName = localStorage.getItem("dc_company_name") || "Company";
  const initials = driverName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 border-r flex flex-col transition-all duration-300 ease-in-out ${
        open ? "w-60" : "w-[68px]"
      } border-border bg-card`}
    >
      {/* Logo */}
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
          {open && (
            <span className="text-base font-bold text-foreground whitespace-nowrap">
              dispatchCore
            </span>
          )}
        </Link>
      </div>

      {/* Role badge */}
      {open && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              Employed Driver
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{companyName}</p>
        </div>
      )}

      {/* Nav items */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`relative flex h-10 items-center rounded-full transition-all duration-200 group ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <div className="grid h-full w-12 shrink-0 place-content-center">
                <item.icon className="h-[18px] w-[18px]" />
              </div>
              {open && (
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User section → Settings */}
      <div className="p-3">
        <Link
          to="/employed-driver/settings"
          className={`flex items-center gap-2.5 mb-3 px-1 rounded-full transition-colors hover:bg-muted py-1.5 ${!open ? "justify-center" : ""} ${
            location.pathname === "/employed-driver/settings"
              ? "bg-primary/10"
              : ""
          }`}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          {open && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {driverName}
              </p>
              <p className="text-xs text-gray-400 truncate">{companyName}</p>
            </div>
          )}
        </Link>

        {/* Dark mode toggle */}
        <div
          className={`flex items-center ${open ? "gap-1 bg-secondary rounded-full p-1" : "flex-col gap-1"}`}
        >
          <button
            onClick={() => setIsDark(false)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors ${!isDark ? "bg-white dark:bg-gray-700 shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            <Sun className="h-3.5 w-3.5" /> {open && "Light"}
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors ${isDark ? "bg-white dark:bg-accent shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            <Moon className="h-3.5 w-3.5" /> {open && "Dark"}
          </button>
        </div>
      </div>

      {/* Collapse */}
      <button
        onClick={() => setOpen(!open)}
        className=" p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center justify-center">
          <ChevronsRight
            className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
    </nav>
  );
}
