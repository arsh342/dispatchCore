import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { PageTransition } from "./components/page-transition";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthPage } from "./pages/auth/login";
import { SignupPage } from "./pages/auth/signup";
import LandingPage from "./pages/landing";
import PricingPage from "./pages/extra/pricing";
import PrivacyPage from "./pages/extra/privacy";
import TermsPage from "./pages/extra/terms";
import SecurityPage from "./pages/extra/security";
import DocsPage from "./pages/extra/docs";
import BlogPage from "./pages/extra/blog";
import ContactPage from "./pages/extra/contact";
import AboutPage from "./pages/extra/about";
import CareersPage from "./pages/extra/careers";
import FAQPage from "./pages/extra/faq";
import SitemapPage from "./pages/extra/sitemap";
import DashboardPage from "./pages/dispatcher/dashboard";
import DispatcherMarketplace from "./pages/dispatcher/marketplace";
import DispatcherDriverRoutesPage from "./pages/dispatcher/driver-routes";
import OrdersPage from "./pages/dispatcher/orders";
import ShipmentsPage from "./pages/dispatcher/shipments";
import MapOverviewPage from "./pages/dispatcher/map";
import MessagesPage from "./pages/dispatcher/messages";
import SettingsPage from "./pages/dispatcher/settings";
import DriversPage from "./pages/dispatcher/drivers";
import DispatcherAnalyticsPage from "./pages/dispatcher/analytics";
import DriverDashboard from "./pages/driver/dashboard";
import DriverMarketplace from "./pages/driver/marketplace";
import DriverBidsPage from "./pages/driver/bids";
import DriverDeliveriesPage from "./pages/driver/deliveries";
import DriverEarningsPage from "./pages/driver/earnings";
import DriverMessagesPage from "./pages/driver/messages";
import DriverSettingsPage from "./pages/driver/settings";
import DriverRoutesPage from "./pages/driver/routes";
import EmpDriverDashboard from "./pages/employed-driver/dashboard";
import EmpDriverOrdersPage from "./pages/employed-driver/orders";
import EmpDriverDeliveriesPage from "./pages/employed-driver/deliveries";
import EmpDriverSchedulePage from "./pages/employed-driver/schedule";
import EmpDriverMessagesPage from "./pages/employed-driver/messages";
import EmpDriverSettingsPage from "./pages/employed-driver/settings";
import CustomerTrackingPage from "./pages/tracking/tracking";
import SuperAdminDashboardPage from "./pages/superadmin/dashboard";
import SuperAdminCompaniesPage from "./pages/superadmin/companies";
import SuperAdminDriversPage from "./pages/superadmin/drivers";
import SuperAdminAnalyticsPage from "./pages/superadmin/analytics";
import SuperAdminSettingsPage from "./pages/superadmin/settings";
import NotFoundPage from "./pages/errors/not-found";
import ServerErrorPage from "./pages/errors/server-error";
import ForbiddenPage from "./pages/errors/forbidden";
import UnauthorizedPage from "./pages/errors/unauthorized";
import ServiceUnavailablePage from "./pages/errors/service-unavailable";
import { useAnimatedFavicon } from "./hooks/useAnimatedFavicon";
import ScrollToTop from "./components/scroll-to-top";


function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/security" element={<PageTransition><SecurityPage /></PageTransition>} />
        <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><BlogPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/careers" element={<PageTransition><CareersPage /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
        <Route path="/sitemap" element={<PageTransition><SitemapPage /></PageTransition>} />
        {/* Dispatcher routes */}
        <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/dashboard/orders" element={<PageTransition><OrdersPage /></PageTransition>} />
        <Route path="/dashboard/shipments" element={<PageTransition><ShipmentsPage /></PageTransition>} />
        <Route path="/dashboard/map" element={<PageTransition><MapOverviewPage /></PageTransition>} />
        <Route path="/dashboard/messages" element={<PageTransition><MessagesPage /></PageTransition>} />
        <Route path="/dashboard/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="/dashboard/drivers" element={<PageTransition><DriversPage /></PageTransition>} />
        <Route path="/dashboard/analytics" element={<PageTransition><DispatcherAnalyticsPage /></PageTransition>} />
        <Route
          path="/dispatcher/marketplace"
          element={<PageTransition><DispatcherMarketplace /></PageTransition>}
        />
        <Route
          path="/dispatcher/driver-routes"
          element={<PageTransition><DispatcherDriverRoutesPage /></PageTransition>}
        />
        {/* Independent Driver routes */}
        <Route path="/driver/dashboard" element={<PageTransition><DriverDashboard /></PageTransition>} />
        <Route path="/driver/marketplace" element={<PageTransition><DriverMarketplace /></PageTransition>} />
        <Route path="/driver/bids" element={<PageTransition><DriverBidsPage /></PageTransition>} />
        <Route path="/driver/deliveries" element={<PageTransition><DriverDeliveriesPage /></PageTransition>} />
        <Route path="/driver/routes" element={<PageTransition><DriverRoutesPage /></PageTransition>} />
        <Route path="/driver/earnings" element={<PageTransition><DriverEarningsPage /></PageTransition>} />
        <Route path="/driver/messages" element={<PageTransition><DriverMessagesPage /></PageTransition>} />
        <Route path="/driver/settings" element={<PageTransition><DriverSettingsPage /></PageTransition>} />
        {/* Employed Driver routes */}
        <Route
          path="/employed-driver/dashboard"
          element={<PageTransition><EmpDriverDashboard /></PageTransition>}
        />
        <Route
          path="/employed-driver/orders"
          element={<PageTransition><EmpDriverOrdersPage /></PageTransition>}
        />
        <Route
          path="/employed-driver/deliveries"
          element={<PageTransition><EmpDriverDeliveriesPage /></PageTransition>}
        />
        <Route
          path="/employed-driver/schedule"
          element={<PageTransition><EmpDriverSchedulePage /></PageTransition>}
        />
        <Route
          path="/employed-driver/messages"
          element={<PageTransition><EmpDriverMessagesPage /></PageTransition>}
        />
        <Route
          path="/employed-driver/settings"
          element={<PageTransition><EmpDriverSettingsPage /></PageTransition>}
        />
        {/* Customer Tracking (public — no auth) */}
        <Route path="/track/:trackingCode" element={<PageTransition><CustomerTrackingPage /></PageTransition>} />
        {/* SuperAdmin routes */}
        <Route path="/superadmin" element={<PageTransition><SuperAdminDashboardPage /></PageTransition>} />
        <Route
          path="/superadmin/companies"
          element={<PageTransition><SuperAdminCompaniesPage /></PageTransition>}
        />
        <Route path="/superadmin/drivers" element={<PageTransition><SuperAdminDriversPage /></PageTransition>} />
        <Route
          path="/superadmin/analytics"
          element={<PageTransition><SuperAdminAnalyticsPage /></PageTransition>}
        />
        <Route
          path="/superadmin/settings"
          element={<PageTransition><SuperAdminSettingsPage /></PageTransition>}
        />
        {/* Error pages */}
        <Route path="/401" element={<PageTransition><UnauthorizedPage /></PageTransition>} />
        <Route path="/403" element={<PageTransition><ForbiddenPage /></PageTransition>} />
        <Route path="/500" element={<PageTransition><ServerErrorPage /></PageTransition>} />
        <Route path="/503" element={<PageTransition><ServiceUnavailablePage /></PageTransition>} />
        {/* Catch-all 404 */}
        <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useAnimatedFavicon();
  return (
    <Router>
      <ScrollToTop />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
