import { useEffect, type ReactElement, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { PageTransition } from "@/components/layout/page-transition";
import NotFoundPage from "@/pages/errors/not-found";
import ServerErrorPage from "@/pages/errors/server-error";
import ForbiddenPage from "@/pages/errors/forbidden";
import UnauthorizedPage from "@/pages/errors/unauthorized";
import ServiceUnavailablePage from "@/pages/errors/service-unavailable";
import { consumeLastNonErrorRoute } from "@/lib/api";
import type { AppRouteDefinition } from "./types";

function isReloadNavigation(): boolean {
  const navEntry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navEntry?.type === "reload";
}

function ErrorRouteRecovery({ children }: { children: ReactNode }) {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!isReloadNavigation()) {
      return;
    }

    const previousRoute = consumeLastNonErrorRoute();
    if (!previousRoute) {
      return;
    }

    const currentRoute = `${pathname}${search}${hash}`;
    if (previousRoute !== currentRoute) {
      window.location.replace(previousRoute);
    }
  }, [pathname, search, hash]);

  return <>{children}</>;
}

const withErrorRecovery = (node: ReactElement): ReactElement => (
  <ErrorRouteRecovery>
    <PageTransition>{node}</PageTransition>
  </ErrorRouteRecovery>
);

export const errorRoutes: AppRouteDefinition[] = [
  { path: "/unauthorized", element: withErrorRecovery(<UnauthorizedPage />) },
  { path: "/401", element: withErrorRecovery(<UnauthorizedPage />) },

  { path: "/forbidden", element: withErrorRecovery(<ForbiddenPage />) },
  { path: "/403", element: withErrorRecovery(<ForbiddenPage />) },

  { path: "/server-error", element: withErrorRecovery(<ServerErrorPage />) },
  { path: "/500", element: withErrorRecovery(<ServerErrorPage />) },

  {
    path: "/service-unavailable",
    element: withErrorRecovery(<ServiceUnavailablePage />),
  },
  { path: "/503", element: withErrorRecovery(<ServiceUnavailablePage />) },

  { path: "/not-found", element: withErrorRecovery(<NotFoundPage />) },
  { path: "/404", element: withErrorRecovery(<NotFoundPage />) },

  { path: "*", element: withErrorRecovery(<NotFoundPage />) },
];
