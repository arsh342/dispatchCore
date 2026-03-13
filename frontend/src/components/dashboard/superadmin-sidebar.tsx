/**
 * SuperAdmin Sidebar
 *
 * Navigation sidebar for the platform-level SuperAdmin view.
 */

import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  ChevronsRight,
  Shield,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/superadmin" },
  { icon: Building2, label: "Companies", href: "/superadmin/companies" },
  { icon: Users, label: "All Drivers", href: "/superadmin/drivers" },
  { icon: BarChart3, label: "Analytics", href: "/superadmin/analytics" },
  { icon: Settings, label: "Settings", href: "/superadmin/settings" },
];

export function SuperAdminSidebar({
  isDark: _isDark,
  setIsDark: _setIsDark,
}: SidebarProps) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 flex flex-col transition-all duration-300 ease-in-out ${
        open ? "w-60" : "w-[68px]"
      } border-border bg-card`}
    >
      {/* Logo */}
      <div className="p-4">
        <Link
          to="/superadmin"
          className="flex items-center gap-2.5 overflow-hidden"
        >
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
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1 w-fit">
            <Shield className="h-3 w-3" />
            Super Admin
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

      {/* Theme toggle */}
      <div className="p-3">
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

      {/* Collapse */}
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
