import { usePageMeta } from "@/hooks/usePageMeta";
import { PageLayout } from "@/components/page-layout";

const posts = [
  {
    slug: "introducing-dispatchcore",
    title:
      "Introducing dispatchCore: Real-Time Multi-Tenant Last-Mile Dispatch",
    excerpt:
      "We built dispatchCore to solve the biggest pain points in last-mile logistics — double-assignments, idle drivers, and zero customer visibility. Here's how it works.",
    date: "Mar 5, 2026",
    readTime: "6 min read",
    category: "Launch",
    image:
      "https://images.unsplash.com/vector-1755257875930-45aad180fe90?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    slug: "live-gps-tracking-drivers",
    title: "Live GPS Tracking: How We Built Real-Time Fleet Visibility",
    excerpt:
      "A deep dive into our WebSocket-powered GPS system that broadcasts driver locations every 15 seconds to dispatchers and customers — with smart visibility rules for gig drivers.",
    date: "Mar 3, 2026",
    readTime: "7 min read",
    category: "Engineering",
    image:
      "https://images.unsplash.com/photo-1563103311-860aee557af8?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    slug: "marketplace-bidding-gig-drivers",
    title: "The Gig Marketplace: How Independent Drivers Bid on Deliveries",
    excerpt:
      "Our integrated marketplace lets dispatchers list orders with a price, and independent drivers place counter-offer bids in real-time — all streamed via WebSocket.",
    date: "Mar 1, 2026",
    readTime: "5 min read",
    category: "Product",
    image:
      "https://images.unsplash.com/photo-1763896877724-b73d1ef2dc69?q=80&w=2109&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    slug: "route-matching-independent-drivers",
    title:
      "Route Matching: Connecting Deliveries with Drivers Already Heading That Way",
    excerpt:
      "Independent drivers pre-register their travel routes, and our Haversine-based matching engine finds packages along their path — reducing empty miles and costs.",
    date: "Feb 25, 2026",
    readTime: "5 min read",
    category: "Product",
    image:
      "https://images.unsplash.com/photo-1625587445009-b1247d2b3d73?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    slug: "preventing-double-assignments",
    title: "Zero Double-Assignments: ACID Transactions in Delivery Dispatch",
    excerpt:
      "How we use SERIALIZABLE isolation levels and pessimistic locking (SELECT FOR UPDATE) to guarantee that two dispatchers can never assign the same order simultaneously.",
    date: "Feb 20, 2026",
    readTime: "8 min read",
    category: "Engineering",
    image:
      "https://images.unsplash.com/photo-1742858492775-8f58f645aa12?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    slug: "customer-tracking-public-link",
    title: "Customer Tracking: Live Delivery Maps Without Login",
    excerpt:
      "Every order gets a public tracking link with a live map, status timeline, and 1-on-1 chat — no app download or account required. Here's how we built it.",
    date: "Feb 15, 2026",
    readTime: "4 min read",
    category: "Product",
    image:
      "https://images.unsplash.com/photo-1625217527288-93919c99650a?q=80&w=2012&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export default function BlogPage() {
  usePageMeta("Blog", "Insights on delivery logistics, fleet management, and last-mile optimization.");

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Insights on delivery logistics, fleet management, and the future of
            dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-3xl border border-border bg-card/50 overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="aspect-[3/2] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {post.date}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {post.readTime}
                  </span>
                </div>
                <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
