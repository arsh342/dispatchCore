import { usePageMeta } from "@/hooks/usePageMeta";
import { PageLayout } from "@/components/page-layout";
import {
  Shield,
  Lock,
  Eye,
  Server,
  Bell,
  FileCheck,
  Database,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Pessimistic Locking",
    description:
      "SERIALIZABLE transactions with SELECT FOR UPDATE prevent double-assignments when multiple dispatchers operate concurrently.",
  },
  {
    icon: Database,
    title: "Multi-Tenant Isolation",
    description:
      "Every API request is scoped by company_id via tenant middleware. No company can access another company's orders, drivers, or data.",
  },
  {
    icon: Shield,
    title: "SQL Injection Prevention",
    description:
      "All database queries use Sequelize ORM with parameterized queries — no raw SQL, no injection vectors.",
  },
  {
    icon: Zap,
    title: "Rate Limiting",
    description:
      "API endpoints and GPS ping submissions are rate-limited per-IP to prevent abuse and ensure fair resource usage.",
  },
  {
    icon: Eye,
    title: "GPS Visibility Rules",
    description:
      "Independent driver locations are only broadcast during active deliveries. Employed driver locations are visible only to their company's dispatchers.",
  },
  {
    icon: Server,
    title: "Input Validation",
    description:
      "Every endpoint validates input with express-validator — coordinates, prices, bids, and status transitions are all type-checked and range-validated.",
  },
  {
    icon: Bell,
    title: "WebSocket Authentication",
    description:
      "Socket.io connections use identity headers for room authorization. Drivers only receive their own events; dispatchers only see their company data.",
  },
  {
    icon: FileCheck,
    title: "Delivery Event Audit Log",
    description:
      "Every status transition (ASSIGNED → PICKED_UP → EN_ROUTE → DELIVERED) is logged in the DeliveryEvent table with timestamps and notes.",
  },
];

export default function SecurityPage() {
  usePageMeta("Security", "Learn about dispatchCore's security practices and infrastructure.");

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Security at dispatchCore
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with security-first architecture — multi-tenant isolation,
            ACID transaction guarantees, rate limiting, and strict input
            validation protect every order, every driver, and every byte of
            data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-3xl border border-border bg-card/50"
            >
              <f.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        <div className="border border-border rounded-3xl p-8 bg-card/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-3">
                CE-02 Security Roadmap
              </h2>
              <p className="text-muted-foreground mb-4">
                The next phase will add JWT-based authentication, Redis session
                caching, role-protected API routes, and encrypted WebSocket
                handshakes.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> JWT tokens with
                  role-encoded claims
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Redis-backed
                  session and location caching
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Firebase push
                  notifications
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> CI/CD with
                  automated security scanning
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Report a Vulnerability
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Found a security issue? We appreciate responsible disclosure.
                </p>
                <a
                  href="mailto:security@dispatchcore.io"
                  className="inline-flex items-center px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
                >
                  Contact Security Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
