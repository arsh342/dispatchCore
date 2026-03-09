import { useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useAutoTheme } from "@/hooks/useAutoTheme";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { WorldMap } from "@/components/ui/world-map";
import { Link } from "react-router-dom";
import {
  Github,
  Twitter,
  ArrowUpRight,
  MapPin,
  Users,
  Route,
  BarChart3,
  Check,
} from "lucide-react";

/* ─── Smooth scroll on mount ─── */
function useSmoothScroll() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);
}

/* ─── Animation Variants ─── */
type Direction = "up" | "down" | "left" | "right" | "scale";

const directionMap: Record<
  Direction,
  { opacity: number; x?: number; y?: number; scale?: number }
> = {
  up: { opacity: 0, y: 48 },
  down: { opacity: 0, y: -48 },
  left: { opacity: 0, x: -60 },
  right: { opacity: 0, x: 60 },
  scale: { opacity: 0, scale: 0.92 },
};

/* ─── Reusable: Section Reveal ─── */
function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const initial = directionMap[direction];
  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Parallax Image ─── */
// Generate a noise texture once for all images
const noiseDataUrl = (() => {
  if (typeof document === "undefined") return "";
  const size = 150;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.random();
    imageData.data[i] = Math.floor(234 * v);     // R — #ea
    imageData.data[i + 1] = Math.floor(88 * v);   // G — #58
    imageData.data[i + 2] = Math.floor(12 * v);   // B — #0c
    imageData.data[i + 3] = 45; // subtle alpha
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
})();

function ParallaxImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  return (
    <div ref={ref} className={`overflow-hidden relative ${className}`}>
      {error ? (
        /* Accent placeholder when image fails to load */
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-3 rounded-2xl bg-primary/15 flex items-center justify-center">
              <svg className="h-6 w-6 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-primary/50 uppercase tracking-wider">{alt}</p>
          </div>
        </div>
      ) : (
        <motion.img
          src={src}
          alt={alt}
          style={{ y }}
          className="w-full h-[116%] object-cover"
          onError={() => setError(true)}
        />
      )}
      {/* Warm tint + grain overlay */}
      {!error && (
        <>
          <div className="absolute inset-0 pointer-events-none bg-primary/[0.1] mix-blend-multiply" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${noiseDataUrl})`,
              backgroundRepeat: "repeat",
            }}
          />
        </>
      )}
    </div>
  );
}

/* ─── 1. Hero Section ─── */
function HeroSection() {
  return (
    <section className="pt-32 pb-0 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-foreground leading-[1.05]">
            Dispatch everything.
          </h1>
        </Reveal>

        {/* Hero Image */}
        <Reveal delay={0.15} direction="scale">
          <div className="mt-10 relative overflow-hidden rounded-[30px] bg-primary/10">
            <div className="relative aspect-[16/7] flex items-center justify-center overflow-hidden">
              <WorldMap
                lineColor="var(--primary)"
                theme="light"
                dots={[
                  // North America
                  { start: { lat: 40.7128, lng: -74.006 }, end: { lat: 34.0522, lng: -118.2437 } },
                  { start: { lat: 41.8781, lng: -87.6298 }, end: { lat: 29.7604, lng: -95.3698 } },
                  { start: { lat: 49.2827, lng: -123.1207 }, end: { lat: 45.5017, lng: -73.5673 } },
                  // Europe
                  { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 48.8566, lng: 2.3522 } },
                  { start: { lat: 52.52, lng: 13.405 }, end: { lat: 41.9028, lng: 12.4964 } },
                  { start: { lat: 59.3293, lng: 18.0686 }, end: { lat: 40.4168, lng: -3.7038 } },
                  // Asia
                  { start: { lat: 35.6762, lng: 139.6503 }, end: { lat: 1.3521, lng: 103.8198 } },
                  { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 25.2048, lng: 55.2708 } },
                  { start: { lat: 19.076, lng: 72.8777 }, end: { lat: 13.0827, lng: 80.2707 } },
                  { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 22.5726, lng: 88.3639 } },
                  { start: { lat: 12.9716, lng: 77.5946 }, end: { lat: 19.076, lng: 72.8777 } },
                  { start: { lat: 37.5665, lng: 126.978 }, end: { lat: 22.3193, lng: 114.1694 } },
                  { start: { lat: 13.7563, lng: 100.5018 }, end: { lat: 31.2304, lng: 121.4737 } },
                  // Cross-continental
                  { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 40.7128, lng: -74.006 } },
                  { start: { lat: 25.2048, lng: 55.2708 }, end: { lat: -1.2921, lng: 36.8219 } },
                  // South America & Oceania
                  { start: { lat: -23.5505, lng: -46.6333 }, end: { lat: 19.4326, lng: -99.1332 } },
                  { start: { lat: -33.8688, lng: 151.2093 }, end: { lat: -36.8485, lng: 174.7633 } },
                ]}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── 2. Trusted By / Logo Cloud ─── */
function TrustedBy() {
  const logos = ["SwiftHaul", "NovaCargo", "Parcelion", "FleetVox", "Routesmith", "Cargonex"];
  return (
    <section className="py-16 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <p className="text-sm text-muted-foreground mb-8">Trusted by:</p>
        </Reveal>
        <div className="flex items-center flex-wrap gap-10">
          {logos.map((name, i) => (
            <Reveal key={name} delay={i * 0.07} direction="up">
              <span className="text-xl font-semibold text-foreground/60 tracking-wide">
                {name}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 2b. Stats / Numbers Bar ─── */
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  const display = target >= 1000
    ? `${(count / 1000).toFixed(count >= target ? 0 : 1)}K`
    : target % 1 !== 0
      ? count.toFixed(1)
      : String(count);

  return <span ref={ref}>{display}{suffix}</span>;
}

function StatsBar() {
  const stats = [
    { target: 10000, suffix: "+", label: "Deliveries Tracked" },
    { target: 500, suffix: "+", label: "Active Fleets" },
    { target: 99.9, suffix: "%", label: "Uptime" },
    { target: 35, suffix: "%", label: "Cost Reduction" },
  ];
  return (
    <section className="py-12 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[30px] border border-primary/15 p-8 md:p-12">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/[0.85] to-primary/[0.55]" />
          {/* Grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `url(${noiseDataUrl})`, backgroundRepeat: "repeat" }}
          />
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08} direction="up">
                <div className="text-center py-6 px-4">
                  <p className="text-3xl md:text-4xl font-bold text-secondary mb-1">
                    <CountUp target={s.target} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-foreground uppercase tracking-wider font-medium">
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 3. Benefits Section ─── */
const benefits = [
  {
    icon: MapPin,
    title: "Real-Time Fleet Tracking",
    description:
      "Live GPS tracking for every driver and delivery. Know exactly where your fleet is, down to the second.",
  },
  {
    icon: Route,
    title: "Optimized Route Planning",
    description:
      "AI-powered routing that saves fuel, cuts delivery time, and dynamically adapts to traffic and road conditions.",
  },
  {
    icon: Users,
    title: "Smart Driver Management",
    description:
      "Onboard employed drivers, source gig drivers from the marketplace, and manage everyone from one dashboard.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description:
      "Comprehensive delivery insights, cost breakdowns, and driver performance metrics to grow your operation.",
  },
];

function BenefitsSection() {
  return (
    <section className="py-20 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 pt-16">
          {/* Left: heading */}
          <Reveal direction="left">
            <div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Benefits
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mt-4 mb-4">
                We've built it right.
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                dispatchCore gives you real control over your deliveries,
                without the complexity or data overload.
              </p>
            </div>
          </Reveal>

          {/* Right: icon lockups */}
          <div className="space-y-0">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.08} direction="right">
                <div className="py-6 border-t border-border flex gap-5">
                  <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {b.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Benefits hero image */}
        <Reveal delay={0.2} direction="scale">
          <ParallaxImage
            src="https://images.unsplash.com/photo-1695222833131-54ee679ae8e5?q=80&w=2041&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Logistics dashboard"
            className="mt-16 rounded-[30px] aspect-[16/9]"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ─── 4. Features Carousel / Numbered List ─── */
const featurePoints = [
  {
    num: "01",
    text: "Track Every Delivery: Real-time GPS status from pickup to doorstep.",
  },
  {
    num: "02",
    text: "Smart Dispatch: Auto-assign to the nearest available driver instantly.",
  },
  {
    num: "03",
    text: "Gig Marketplace: Post orders, receive bids, and choose the best driver.",
  },
  {
    num: "04",
    text: "Customer Visibility: Branded tracking links for every order, no app needed.",
  },
];

function FeaturesCarousel() {
  return (
    <section className="py-20 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 pt-16">
          {/* Left text */}
          <Reveal direction="left">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
                See the Big Picture
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-md mb-10">
                dispatchCore turns your fleet data into clear, actionable
                insights that show you exactly what's happening across every
                delivery.
              </p>

              <div className="space-y-0">
                {featurePoints.map((fp) => (
                  <div
                    key={fp.num}
                    className="flex gap-4 py-4 border-t border-border"
                  >
                    <span className="text-sm text-muted-foreground font-mono shrink-0">
                      {fp.num}
                    </span>
                    <p className="text-sm text-foreground font-medium">
                      {fp.text}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to="/Docs"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                Discover More
              </Link>
            </div>
          </Reveal>

          {/* Right image */}
          <Reveal delay={0.15} direction="right">
            <ParallaxImage
              src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Fleet tracking"
              className="rounded-[30px] aspect-[4/5] lg:aspect-auto lg:h-full"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── 5. Specifications ─── */
const specs = [
  {
    label: "Real-time GPS tracking",
    description:
      "Live driver positions updated every second with ETA predictions.",
  },
  {
    label: "Route optimization",
    description:
      "Dynamic rerouting based on traffic, weather, and delivery windows.",
  },
  {
    label: "Gig driver marketplace",
    description:
      "Post orders, receive bids, and choose the best available driver.",
  },
  {
    label: "Multi-tenant isolation",
    description:
      "Each company's data is fully isolated with row-level security.",
  },
  {
    label: "Customer tracking links",
    description: "Branded, no-app-needed tracking pages for every delivery.",
  },
  {
    label: "Live updates",
    description:
      "Instant push updates across dashboards, maps, and notifications.",
  },
];

function SpecsSection() {
  return (
    <section className="py-20 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 pt-16">
          {/* Left text */}
          <Reveal direction="left">
            <div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Specs
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mt-4 mb-4">
                Built for scale
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-md mb-8">
                Every feature in dispatchCore is designed for real-time
                performance, security, and reliability at any fleet size.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </Reveal>

          {/* Right: feature list */}
          <Reveal delay={0.12} direction="right">
            <div className="space-y-0">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-start gap-4 py-5 border-t border-border"
                >
                  <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {spec.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {spec.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── 6. Testimonials ─── */
const testimonials = [
  {
    quote:
      "dispatchCore completely transformed the way we handle deliveries. The real-time tracking and auto-dispatch have cut our operational costs by 30%.",
    name: "Priya Sharma",
    role: "Head of Operations",
    company: "NovaCargo",
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1045&auto=format&fit=crop&ixlib=rb-4.1.0",
  },
  {
    quote:
      "We scaled from 50 to 500 deliveries a day without adding a single dispatcher. The marketplace feature lets us tap into gig drivers instantly.",
    name: "Marcus Chen",
    role: "CEO & Founder",
    company: "FleetVox",
    image:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1008&auto=format&fit=crop&ixlib=rb-4.1.0",
  },
  {
    quote:
      "The analytics dashboard alone saved us thousands. We finally have visibility into driver performance, route efficiency, and per-delivery margins.",
    name: "Amara Okonkwo",
    role: "VP of Logistics",
    company: "SwiftHaul",
    image:
      "https://images.unsplash.com/photo-1745176593885-c1d466a6dff5?q=80&w=1402&auto=format&fit=crop&ixlib=rb-4.1.0",
  },
];

function TestimonialSection() {
  const [active, setActive] = useState(0);
  const t = testimonials[active];

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Image */}
          {/* Image — changes per testimonial */}
          <motion.div
            key={`img-${active}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <ParallaxImage
              src={t.image}
              alt={t.company}
              className="rounded-[30px] aspect-[3/4] max-w-md mx-auto"
            />
          </motion.div>

          {/* Quote carousel */}
          <div className="lg:col-span-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              What people say
            </p>

            <div className="relative min-h-[220px]">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      className="h-4 w-4 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <blockquote>
                  <p className="text-xl md:text-2xl font-semibold text-foreground leading-snug mb-6">
                    "{t.quote}"
                  </p>
                  <footer>
                    <p className="text-sm font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.role}, {t.company}
                    </p>
                  </footer>
                </blockquote>
              </motion.div>
            </div>

            {/* Dot indicators */}
            <div className="flex gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 7. How It Works ─── */
const howItWorksSteps = [
  {
    num: "01",
    title: "Get Started",
    description:
      "Create your company, add drivers, and dispatch your first order in minutes.",
  },
  {
    num: "02",
    title: "Configure & Customize",
    description:
      "Set up your fleet, define delivery zones, and connect the gig marketplace.",
  },
  {
    num: "03",
    title: "Scale Your Operation",
    description:
      "Use analytics and real-time insights to optimize routes, reduce costs, and deliver faster.",
  },
];

function HowItWorksSection() {
  return (
    <section className="py-20 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="pt-16 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 mb-16">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
              Map Your Success
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              to="/Docs"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shrink-0"
            >
              Discover More
            </Link>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-0">
          {howItWorksSteps.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.1}>
              <div className="pt-2 pb-8 pr-8">
                <span className="text-5xl md:text-6xl font-bold text-primary tracking-tight block mb-6">
                  {step.num}
                </span>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 8. Full-Width Image ─── */
function FullWidthImage() {
  return (
    <section className="px-6 lg:px-16 pb-20">
      <div className="max-w-7xl mx-auto">
        <Reveal direction="scale">
          <ParallaxImage
            src="https://images.unsplash.com/photo-1761474909259-923263be648a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Delivery fleet on the road"
            className="rounded-[30px] aspect-[16/9]"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ─── 9. Centered CTA ─── */
function CenteredCTA() {
  return (
    <section className="py-24 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[30px] border border-primary/15 py-20 px-8">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-tl from-primary via-primary/[0.85] to-primary/[0.55]" />
          {/* Grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `url(${noiseDataUrl})`, backgroundRepeat: "repeat" }}
          />
          <div className="relative text-center max-w-2xl mx-auto">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
                Connect with us
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-foreground leading-relaxed mb-8">
                Schedule a quick call to learn how dispatchCore can transform your
                delivery operations into a competitive advantage.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 px-8 py-4 text-sm font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors"
              >
                Learn More
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Landing Page ─── */
export default function LandingPage() {
  useAutoTheme();
  useSmoothScroll();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <TrustedBy />
      <StatsBar />
      <div id="benefits">
        <BenefitsSection />
      </div>
      <FeaturesCarousel />
      <div id="specs">
        <SpecsSection />
      </div>
      <TestimonialSection />
      <div id="how-to">
        <HowItWorksSection />
      </div>
      <FullWidthImage />
      <CenteredCTA />
      <Footer
        brandName="dispatchCore"
        socialLinks={[
          {
            icon: <Twitter className="h-5 w-5" />,
            href: "https://twitter.com",
            label: "Twitter",
          },
          {
            icon: <Github className="h-5 w-5" />,
            href: "https://github.com/arsh342/dispatchCore",
            label: "GitHub",
          },
        ]}
        mainLinks={[
          { href: "#benefits", label: "Features" },
          { href: "/pricing", label: "Pricing" },
          { href: "/docs", label: "Docs" },
          { href: "/blog", label: "Blog" },
          { href: "/about", label: "About" },
          { href: "/careers", label: "Careers" },
          { href: "/contact", label: "Contact" },
          { href: "/faq", label: "FAQ" },
        ]}
        legalLinks={[
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/terms", label: "Terms of Service" },
          { href: "/security", label: "Security" },
          { href: "/sitemap", label: "Sitemap" },
        ]}
        copyright={{
          text: "© 2026 dispatchCore",
          license: "All rights reserved.",
        }}
      />
    </div>
  );
}
