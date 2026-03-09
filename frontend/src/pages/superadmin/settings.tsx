/**
 * SuperAdmin — Settings Page
 *
 * Platform configuration: general settings, API status,
 * environment info, and superadmin account details.
 */

import { useState, useEffect } from "react";
import { SuperAdminSidebar } from "@/components/dashboard/superadmin-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  Settings,
  Bell,
  Globe,
  Database,
  Shield,
  Server,
  Zap,
  CheckCircle2,
  Copy,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SuperAdminSettingsPage() {
  const { isDark, setIsDark } = useTheme();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  // Health check
  const [apiHealth, setApiHealth] = useState<{
    status: string;
    uptime?: number;
  } | null>(null);

  useEffect(() => {
    const API_BASE =
      import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setApiHealth(d.data ?? d))
      .catch(() => setApiHealth({ status: "error" }));
  }, []);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

  return (
    <div className="flex min-h-screen w-full">
      <SuperAdminSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                Platform Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Configuration, environment info, and account management.
              </p>
            </div>
            <button className="relative p-2.5 rounded-full hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-4xl">
          {/* Platform Info */}
          <Section title="Platform Information" icon={Globe}>
            <InfoRow label="Platform Name" value="dispatchCore" />
            <InfoRow label="Version" value="1.0.0 (CE-01)" />
            <InfoRow
              label="Environment"
              value={import.meta.env.MODE ?? "development"}
            />
            <InfoRow
              label="Frontend URL"
              value={window.location.origin}
              onCopy={(v) => handleCopy(v, "frontend")}
              copied={copied === "frontend"}
            />
            <InfoRow
              label="API Base URL"
              value={API_BASE}
              onCopy={(v) => handleCopy(v, "api")}
              copied={copied === "api"}
            />
          </Section>

          {/* API Health */}
          <Section title="System Health" icon={Server}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <HealthCard
                label="REST API"
                status={
                  apiHealth?.status === "ok" || apiHealth?.status === "healthy"
                    ? "operational"
                    : apiHealth
                      ? "error"
                      : "checking"
                }
              />
              <HealthCard label="WebSocket" status="operational" />
              <HealthCard
                label="Database"
                status={
                  apiHealth?.status === "ok" || apiHealth?.status === "healthy"
                    ? "operational"
                    : apiHealth
                      ? "error"
                      : "checking"
                }
              />
            </div>
            {apiHealth?.uptime !== undefined && (
              <p className="text-xs text-gray-400 mt-3">
                Server uptime: {formatUptime(apiHealth.uptime)}
              </p>
            )}
          </Section>

          {/* Endpoints */}
          <Section title="API Endpoints" icon={Zap}>
            <div className="space-y-2">
              {[
                { method: "GET", path: "/api/health" },
                { method: "GET", path: "/api/superadmin/stats" },
                { method: "GET", path: "/api/superadmin/companies" },
                { method: "GET", path: "/api/superadmin/drivers" },
                { method: "GET", path: "/api/superadmin/orders" },
                { method: "GET", path: "/api/companies" },
                { method: "GET", path: "/api/orders" },
                { method: "GET", path: "/api/drivers" },
                { method: "POST", path: "/graphql" },
              ].map((ep) => (
                <div
                  key={ep.path}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      ep.method === "GET"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-secondary-foreground">
                    {ep.path}
                  </code>
                </div>
              ))}
            </div>
          </Section>

          {/* Account */}
          <Section title="SuperAdmin Account" icon={Shield}>
            <InfoRow label="Name" value="Platform Admin" />
            <InfoRow label="Email" value="admin@dispatchcore.com" />
            <InfoRow label="Role" value="superadmin" />
            <div className="pt-4 mt-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </Section>

          {/* Database */}
          <Section title="Database" icon={Database}>
            <InfoRow label="Type" value="MySQL" />
            <InfoRow label="ORM" value="Sequelize v6" />
            <InfoRow label="Host" value="localhost (dev)" />
            <InfoRow label="Database" value="dispatch_core" />
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Settings;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h2>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: (v: string) => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {value}
        </span>
        {onCopy && (
          <button
            onClick={() => onCopy(value)}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function HealthCard({
  label,
  status,
}: {
  label: string;
  status: "operational" | "error" | "checking";
}) {
  return (
    <div className="bg-muted rounded-full p-4">
      <p className="text-xs text-gray-500 font-medium mb-2">{label}</p>
      <span
        className={`flex items-center gap-1.5 text-xs font-medium ${
          status === "operational"
            ? "text-green-600"
            : status === "error"
              ? "text-red-600"
              : "text-gray-400"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            status === "operational"
              ? "bg-green-500"
              : status === "error"
                ? "bg-red-500"
                : "bg-gray-400 animate-pulse"
          }`}
        />
        {status === "operational"
          ? "Operational"
          : status === "error"
            ? "Error"
            : "Checking..."}
      </span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
