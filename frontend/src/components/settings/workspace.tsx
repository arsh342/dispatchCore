import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface SettingsTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export function SettingsWorkspace({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  accentClass,
  sidebar,
  children,
}: {
  title: string;
  description: string;
  tabs: SettingsTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  accentClass: string;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {sidebar}
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-xl">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>

        <div className="p-6 lg:p-8">
          <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-24">
              <div className="rounded-3xl border border-border bg-card/80 p-3 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.75)] backdrop-blur">
                <div className="mb-3 px-3 pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Settings Space
                  </p>
                </div>
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`w-full rounded-full border px-4 py-3 text-left transition-all ${
                          active
                            ? `${accentClass} border-transparent`
                            : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-black/10 dark:bg-white/5">
                            <tab.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tab.label}</p>
                            {tab.description && (
                              <p className="text-xs opacity-70">
                                {tab.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            <main className="min-w-0 space-y-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_80px_-52px_rgba(0,0,0,0.82)]">
      <div className="border-b border-border/80 px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions}
        </div>
      </div>
      <div className="px-6 py-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SettingsNotice({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const tones = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-border bg-muted/50 text-muted-foreground",
  };

  return (
    <div className={`rounded-3xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  activeClass,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  activeClass: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 overflow-hidden rounded-3xl transition-colors ${
          checked ? activeClass : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
