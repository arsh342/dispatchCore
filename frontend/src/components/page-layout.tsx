import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Github, Twitter } from "lucide-react";
import { useAutoTheme } from "@/hooks/useAutoTheme";

interface PageLayoutProps {
  children: React.ReactNode;
}

const footerProps = {
  brandName: "dispatchCore",
  socialLinks: [
    {
      icon: <Twitter className="h-5 w-5" />,
      href: "https://twitter.com",
      label: "Twitter",
    },
    {
      icon: <Github className="h-5 w-5" />,
      href: "https://github.com",
      label: "GitHub",
    },
  ],
  mainLinks: [
    { href: "/#benefits", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
    { href: "/careers", label: "Careers" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ],
  legalLinks: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/security", label: "Security" },
    { href: "/sitemap", label: "Sitemap" },
  ],
  copyright: {
    text: "© 2026 dispatchCore",
    license: "All rights reserved.",
  },
};

export function PageLayout({ children }: PageLayoutProps) {
  useAutoTheme();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-16">{children}</main>
      <Footer {...footerProps} />
    </div>
  );
}
