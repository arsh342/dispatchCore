import { useState } from "react";
import {
  LayoutDashboard,
  Gavel,
  Package,
  IndianRupee,
  MessageSquare,
  ChevronsRight,
  Truck,
  Route,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  userName?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/driver/dashboard" },
  { icon: Gavel, label: "Available Jobs", href: "/driver/marketplace" },
  { icon: Package, label: "My Bids", href: "/driver/bids" },
  { icon: Truck, label: "Active Deliveries", href: "/driver/deliveries" },
  { icon: Route, label: "My Routes", href: "/driver/routes" },
  { icon: IndianRupee, label: "Earnings", href: "/driver/earnings" },
  { icon: MessageSquare, label: "Messages", href: "/driver/messages" },
];

export function DriverSidebar({
  isDark: _isDark,
  setIsDark: _setIsDark,
  userName: propName,
}: SidebarProps) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const userName =
    propName ||
    localStorage.getItem("dc_driver_name") ||
    localStorage.getItem("dc_user_name") ||
    "Driver";
  const userInitials =
    userName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "D";

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 flex flex-col transition-all duration-300 ease-in-out ${
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
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            Driver
          </span>
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

      {/* User section → links to Settings */}
      <div className="p-3">
        <Link
          to="/driver/settings"
          className={`flex items-center gap-2.5 mb-3 px-1 rounded-full transition-colors hover:bg-muted py-1.5 ${!open ? "justify-center" : ""} ${
            location.pathname === "/driver/settings" ? "bg-primary/10" : ""
          }`}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userInitials}
          </div>
          {open && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-400 truncate">Driver</p>
            </div>
          )}
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2.5 mb-3 w-full px-1 rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 transition-colors ${!open ? "justify-center" : ""}`}
        >
          <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
            <LogOut className="h-4 w-4" />
          </div>
          {open && (
            <span className="text-sm font-medium">Sign out</span>
          )}
        </button>

      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
