import { Check, MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$29",
    description:
      "For small courier companies getting started with real-time dispatch.",
    features: [
      {
        title: "Up to 10 employed drivers",
        detail: "Manage a small fleet with live GPS tracking.",
      },
      {
        title: "Real-time map & tracking",
        detail:
          "Live fleet map with curved routes and customer tracking links.",
      },
      {
        title: "Direct order assignment",
        detail: "Assign orders to drivers with concurrency-safe locking.",
      },
      {
        title: "Delivery history",
        detail: "Full audit log with role-scoped field projection.",
      },
    ],
    cta: "Start Free Trial",
    ctaIcon: <MoveRight className="w-4 h-4" />,
    variant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$79",
    description:
      "For growing businesses that need the gig marketplace and route matching.",
    features: [
      {
        title: "Up to 50 drivers",
        detail: "Employed + independent drivers with marketplace access.",
      },
      {
        title: "Gig marketplace & bidding",
        detail:
          "List orders, receive bids, and accept the best offer in real-time.",
      },
      {
        title: "Route matching engine",
        detail:
          "Match orders with independent drivers traveling along the delivery path.",
      },
      {
        title: "1-on-1 messaging",
        detail:
          "Channel-based chat between dispatchers, drivers, and recipients.",
      },
      {
        title: "GraphQL analytics",
        detail: "Dashboard with DataLoader-optimized queries and KPIs.",
      },
    ],
    cta: "Start Free Trial",
    ctaIcon: <MoveRight className="w-4 h-4" />,
    variant: "default" as const,
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Dedicated support, custom integrations, and unlimited scale.",
    features: [
      {
        title: "Unlimited drivers & orders",
        detail: "No limits on fleet size or delivery volume.",
      },
      {
        title: "Multi-company management",
        detail: "SuperAdmin dashboard for platform-wide oversight.",
      },
      {
        title: "Priority WebSocket infrastructure",
        detail:
          "Dedicated real-time event infrastructure for high-throughput fleets.",
      },
      {
        title: "Dedicated support & SLA",
        detail: "24/7 priority support with guaranteed uptime SLA.",
      },
    ],
    cta: "Book a Call",
    ctaIcon: <PhoneCall className="w-4 h-4" />,
    variant: "outline" as const,
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <div id="pricing" className="w-full py-20 lg:py-40">
      <div className="container mx-auto px-6">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          <Badge>Pricing</Badge>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-center font-regular">
              Simple, transparent pricing
            </h2>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center">
              Choose the plan that fits your fleet. No hidden fees, cancel
              anytime.
            </p>
          </div>
          <div className="grid pt-20 text-left grid-cols-1 lg:grid-cols-3 w-full gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`w-full rounded-3xl ${plan.highlighted ? "shadow-2xl border-primary/50" : ""}`}
              >
                <CardHeader>
                  <CardTitle>
                    <span className="flex flex-row gap-4 items-center font-normal">
                      {plan.name}
                    </span>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-8 justify-start">
                    <p className="flex flex-row items-center gap-2 text-xl">
                      <span className="text-4xl">{plan.price}</span>
                      {plan.price !== "Custom" && (
                        <span className="text-sm text-muted-foreground">
                          {" "}
                          / month
                        </span>
                      )}
                    </p>
                    <div className="flex flex-col gap-4 justify-start">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex flex-row gap-4">
                          <Check className="w-4 h-4 mt-2 text-primary" />
                          <div className="flex flex-col">
                            <p>{f.title}</p>
                            <p className="text-muted-foreground text-sm">
                              {f.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant={plan.variant}
                      className="gap-4 rounded-full"
                    >
                      {plan.cta} {plan.ctaIcon}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
