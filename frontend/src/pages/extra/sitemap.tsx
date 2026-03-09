import { usePageMeta } from "@/hooks/usePageMeta";
import { PageLayout } from "@/components/page-layout";
import { Link, useNavigate } from "react-router-dom";

const sections = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "Pricing", href: "/pricing" },
      { label: "Features", href: "/#benefits" },
      { label: "Specifications", href: "/#specs" },
      { label: "How It Works", href: "/#how-to" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log In", href: "/login" },
      { label: "Sign Up", href: "/signup" },
    ],
  },
];

function SitemapLink({ href, label }: { href: string; label: string }) {
  const navigate = useNavigate();

  // For hash links like /#benefits, navigate to / then scroll to the section
  if (href.includes("#")) {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      const [path, hash] = href.split("#");
      navigate(path || "/");
      // Wait for navigation, then scroll to the section
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    return (
      <a
        href={href}
        onClick={handleClick}
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      to={href}
      className="text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      {label}
    </Link>
  );
}

export default function SitemapPage() {
  usePageMeta("Sitemap", "Navigate all pages on dispatchCore.");

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Sitemap
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete overview of all pages on dispatchCore.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-bold text-foreground mb-4">
                {section.title}
              </h2>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <SitemapLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
