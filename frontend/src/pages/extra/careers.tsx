import { usePageMeta } from "@/hooks/usePageMeta";
import { PageLayout } from "@/components/page-layout";
import { MapPin, ArrowUpRight } from "lucide-react";

const openings = [
  {
    title: "Senior Backend Engineer",
    team: "Platform",
    location: "Remote",
    type: "Full-time",
    description:
      "Design and scale our real-time dispatch engine, WebSocket infrastructure, and multi-tenant data layer.",
  },
  {
    title: "Frontend Engineer",
    team: "Product",
    location: "Remote",
    type: "Full-time",
    description:
      "Build beautiful, performant dashboards and maps for dispatchers, drivers, and customers using React and TypeScript.",
  },
  {
    title: "DevOps / Infrastructure Engineer",
    team: "Platform",
    location: "Remote",
    type: "Full-time",
    description:
      "Own CI/CD pipelines, container orchestration, monitoring, and our CE-02 security roadmap (JWT, Redis, Firebase).",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote",
    type: "Full-time",
    description:
      "Craft intuitive UX for real-time fleet management — from dispatcher dashboards to public customer tracking pages.",
  },
  {
    title: "Technical Writer",
    team: "Product",
    location: "Remote",
    type: "Part-time / Contract",
    description:
      "Document our REST API, GraphQL schema, WebSocket events, and write developer-facing guides and tutorials.",
  },
];

const perks = [
  "Fully remote — work from anywhere",
  "Competitive salary & equity",
  "Flexible hours & async-first culture",
  "Health, dental & vision coverage",
  "Annual learning & conference budget",
  "Latest hardware provided",
];

export default function CareersPage() {
  usePageMeta("Careers", "Join the team building the future of delivery logistics.");

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Careers at dispatchCore
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Help us build the future of last-mile logistics. We're a small,
            fast-moving team solving hard real-time problems.
          </p>
        </div>

        {/* Perks */}
        <div className="mb-16 rounded-3xl border border-border bg-card/30 p-8">
          <h2 className="text-xl font-semibold mb-6">Why join us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm text-foreground">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Openings */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            Open positions
          </h2>
          <div className="space-y-4">
            {openings.map((job) => (
              <div
                key={job.title}
                className="group p-6 rounded-3xl border border-border bg-card/50 hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center flex-wrap gap-3 mb-3">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        {job.team}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {job.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  <a
                    href={`mailto:careers@dispatchcore.io?subject=Application: ${job.title}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
                  >
                    Apply
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Don't see a role that fits? We're always open to hearing from
            talented people.
          </p>
          <a
            href="mailto:careers@dispatchcore.io?subject=General Application"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
          >
            Send us your resume
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
