import { usePageMeta } from "@/hooks/usePageMeta";
import { PageLayout } from "@/components/page-layout";
import {
  Book,
  Zap,
  Settings,
  Code,
  Truck,
  BarChart3,
  Link as LinkIcon,
  MapPin,
  Gavel,
  Route,
} from "lucide-react";

const sections = [
  {
    icon: Zap,
    title: "Getting Started",
    description:
      "Create your company, add drivers, and dispatch your first delivery in minutes.",
    links: [
      "Create a Company",
      "Add Employed Drivers",
      "Create Your First Order",
      "Dashboard Overview",
    ],
  },
  {
    icon: Truck,
    title: "Fleet Management",
    description:
      "Manage employed drivers, track status, and monitor live GPS locations.",
    links: [
      "Driver Onboarding",
      "Vehicle Assignment",
      "Live GPS Tracking",
      "Driver Status Management",
    ],
  },
  {
    icon: Gavel,
    title: "Marketplace & Bidding",
    description:
      "List orders on the gig marketplace and review bids from independent drivers.",
    links: [
      "Listing an Order",
      "Reviewing Bids",
      "Accepting a Bid",
      "Bid-to-Assignment Flow",
    ],
  },
  {
    icon: Route,
    title: "Route Matching",
    description:
      "Match orders with independent drivers already traveling along the delivery path.",
    links: [
      "Driver Route Pre-Registration",
      "Haversine Matching",
      "Assigning from Match Panel",
      "Radius Configuration",
    ],
  },
  {
    icon: MapPin,
    title: "Live Map & Tracking",
    description:
      "Real-time fleet map with curved routes, driver pins, and customer tracking links.",
    links: [
      "Fleet Map Overview",
      "Order Route Visualization",
      "Customer Tracking Page",
      "GPS Visibility Rules",
    ],
  },
  {
    icon: Settings,
    title: "Order Management",
    description:
      "Create, assign, and track orders through their full lifecycle.",
    links: [
      "Creating Orders",
      "Direct Assignment",
      "Status Transitions",
      "Delivery Event Audit Log",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics & History",
    description:
      "View delivery history with role-scoped projections and GraphQL-powered dashboards.",
    links: [
      "Dispatcher Dashboard",
      "Delivery History",
      "Driver Earnings",
      "GraphQL API",
    ],
  },
  {
    icon: Code,
    title: "API Reference",
    description:
      "REST API and GraphQL schema for orders, drivers, bids, location, and history.",
    links: [
      "REST Endpoints",
      "GraphQL Schema",
      "WebSocket Events",
      "DataLoader Batching",
    ],
  },
  {
    icon: LinkIcon,
    title: "Real-Time Events",
    description:
      "Socket.io rooms for live updates — assignments, bids, GPS, and order status.",
    links: [
      "Company Dispatch Room",
      "Marketplace Room",
      "Driver Private Channel",
      "Order Tracking Room",
    ],
  },
];

export default function DocsPage() {
  usePageMeta("Documentation", "Developer documentation and API guides for dispatchCore.");

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-sm text-muted-foreground mb-4">
            <Book className="h-4 w-4" /> Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Learn dispatchCore
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to get started, manage your fleet, and scale
            your delivery operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="group p-6 rounded-3xl border border-border bg-card/50 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <section.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-primary hover:underline cursor-pointer">
                      {link} →
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border border-border rounded-3xl p-8 bg-card/30 text-center">
          <h2 className="text-2xl font-semibold mb-3">Need Help?</h2>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to
            help.
          </p>
          <a
            href="mailto:support@dispatchcore.io"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
