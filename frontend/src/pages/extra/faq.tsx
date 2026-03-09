import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is dispatchCore?",
        a: "dispatchCore is a real-time, multi-tenant last-mile delivery logistics platform. It lets companies create orders, assign drivers, track deliveries live on a map, and provide customers with branded tracking links — all from one dashboard.",
      },
      {
        q: "How do I create my company?",
        a: "Sign up at /signup, choose 'Delivery Company', and enter your company details. Once registered, you'll have access to the full dispatcher dashboard where you can add drivers, create orders, and manage your fleet.",
      },
      {
        q: "Is there a free plan?",
        a: "We offer a Starter plan for small fleets with up to 10 drivers. Check our Pricing page for full details on plans and features.",
      },
    ],
  },
  {
    category: "Drivers & Fleet",
    questions: [
      {
        q: "What's the difference between employed and independent drivers?",
        a: "Employed drivers are added directly to your company and assigned orders by dispatchers. Independent drivers browse the public marketplace, place bids on orders, and are assigned when a dispatcher accepts their bid.",
      },
      {
        q: "How does the gig marketplace work?",
        a: "Dispatchers list orders on the marketplace at a set price. Independent drivers can view listings and place counter-offer bids. When a dispatcher accepts a bid, it's automatically converted into an assignment and all other bids on that order are rejected.",
      },
      {
        q: "How does route matching work?",
        a: "Independent drivers pre-register their travel routes. Our Haversine-based matching engine finds orders along their path within a configurable radius, reducing empty miles and delivery costs.",
      },
    ],
  },
  {
    category: "Tracking & Real-Time",
    questions: [
      {
        q: "How does GPS tracking work?",
        a: "Driver locations are streamed via WebSocket and updated every 15 seconds. For employed drivers, dispatchers see real-time positions on the fleet map. For independent drivers, GPS is only broadcast during active deliveries.",
      },
      {
        q: "Do customers need an app to track their delivery?",
        a: "No. Every order gets a unique public tracking link with a live map, status timeline, and 1-on-1 chat — no app download or account required.",
      },
    ],
  },
  {
    category: "Security & Data",
    questions: [
      {
        q: "Is my data isolated from other companies?",
        a: "Yes. dispatchCore uses multi-tenant architecture with strict company_id scoping on every API request. No company can access another company's orders, drivers, or data.",
      },
      {
        q: "How do you prevent double-assignments?",
        a: "We use SERIALIZABLE isolation levels with SELECT FOR UPDATE (pessimistic locking) to guarantee that two dispatchers can never assign the same order simultaneously.",
      },
      {
        q: "What about authentication?",
        a: "Our CE-02 roadmap includes JWT-based authentication with role-encoded claims, Redis-backed session caching, and encrypted WebSocket handshakes. Check our Security page for details.",
      },
    ],
  },
  {
    category: "Billing & Support",
    questions: [
      {
        q: "Can I change my plan later?",
        a: "Yes. You can upgrade or downgrade your plan at any time from the Settings page. Changes take effect at the start of your next billing cycle.",
      },
      {
        q: "How do I get support?",
        a: "Email us at support@dispatchcore.io or visit our Docs page for comprehensive guides covering every feature. We typically respond within 24 hours.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 mt-0.5 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="text-sm text-muted-foreground leading-relaxed pb-5 pr-8">
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQPage() {
  usePageMeta("FAQ", "Frequently asked questions about dispatchCore features, pricing, and setup.");

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about dispatchCore. Can't find what
            you're looking for?{" "}
            <a
              href="/contact"
              className="text-primary hover:underline underline-offset-4"
            >
              Contact us
            </a>
            .
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-lg font-bold text-foreground mb-2">
                {section.category}
              </h2>
              <div>
                {section.questions.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-3xl border border-border bg-card/30 p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            Our team is here to help you get started with dispatchCore.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
