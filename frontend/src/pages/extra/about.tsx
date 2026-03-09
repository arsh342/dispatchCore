import { usePageMeta } from "@/hooks/usePageMeta";
import { PageLayout } from "@/components/page-layout";
import { Target, Zap, Shield, Users } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description:
      "We exist to make last-mile delivery simple, transparent, and accessible for businesses of every size.",
  },
  {
    icon: Zap,
    title: "Real-Time First",
    description:
      "Every feature we build starts with one question: can we make this instant? If it's not real-time, it's not good enough.",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    description:
      "Multi-tenant isolation, ACID-safe assignments, and strict data scoping — security is architecture, not an afterthought.",
  },
  {
    icon: Users,
    title: "Driver-Centric",
    description:
      "Whether employed or independent, drivers are the backbone of delivery. We build tools that respect their time and autonomy.",
  },
];

const timeline = [
  {
    year: "2025",
    title: "The Idea",
    description:
      "Frustrated by fragmented dispatch tools, we set out to build a unified platform for last-mile logistics.",
  },
  {
    year: "2026 Q1",
    title: "CE-01 Launch",
    description:
      "dispatchCore ships with real-time tracking, marketplace bidding, route matching, and multi-tenant architecture.",
  },
  {
    year: "2026 Q2",
    title: "CE-02 Roadmap",
    description:
      "JWT authentication, Redis caching, Firebase push notifications, and CI/CD with automated security scanning.",
  },
  {
    year: "2026 H2",
    title: "Scale & Grow",
    description:
      "Advanced analytics, predictive route optimization, driver scoring, and enterprise fleet integrations.",
  },
];

export default function AboutPage() {
  usePageMeta("About", "The story behind dispatchCore and our mission to fix last-mile delivery.");

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            About dispatchCore
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We're building the operating system for last-mile delivery — a
            single platform where companies dispatch, drivers deliver, and
            customers track, all in real time.
          </p>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            What drives us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="p-6 rounded-3xl border border-border bg-card/50"
              >
                <v.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            Our journey
          </h2>
          <div className="space-y-0">
            {timeline.map((item) => (
              <div
                key={item.year}
                className="flex gap-6 py-6 border-t border-border"
              >
                <span className="text-sm font-mono text-muted-foreground shrink-0 w-20 pt-0.5">
                  {item.year}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl border border-border bg-card/30 p-8 text-center">
          <h2 className="text-2xl font-semibold mb-3">Want to work with us?</h2>
          <p className="text-muted-foreground mb-4">
            We're always looking for talented people who care about logistics
            infrastructure.
          </p>
          <a
            href="/careers"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
          >
            View Open Roles
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
