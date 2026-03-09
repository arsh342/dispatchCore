import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

interface FooterProps {
  brandName: string;
  socialLinks: Array<{
    icon: React.ReactNode;
    href: string;
    label: string;
  }>;
  mainLinks: Array<{
    href: string;
    label: string;
  }>;
  legalLinks: Array<{
    href: string;
    label: string;
  }>;
  copyright: {
    text: string;
    license?: string;
  };
}

function FooterNavLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  const navigate = useNavigate();

  if (href.includes("#")) {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      const [path, hash] = href.split("#");
      navigate(path || "/");
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    return (
      <a href={href} onClick={handleClick} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}

export function Footer({
  brandName,
  socialLinks,
  mainLinks,
  legalLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="pb-6 pt-16 lg:pb-8 lg:pt-24 mb-20">
      <div className="px-6 lg:px-16">
        <div className="md:flex md:items-start md:justify-between">
          <Link
            to="/"
            className="flex items-center gap-x-2"
            aria-label={brandName}
          >
            <span className="font-bold text-xl">{brandName}</span>
          </Link>
          <ul className="flex list-none mt-6 md:mt-0 space-x-3">
            {socialLinks.map((link, i) => (
              <li key={i}>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  asChild
                >
                  <a href={link.href} target="_blank" aria-label={link.label}>
                    {link.icon}
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t mt-6 pt-6 md:mt-4 md:pt-8 lg:grid lg:grid-cols-10">
          <nav className="lg:mt-0 lg:col-[4/11]">
            <ul className="list-none flex flex-wrap -my-1 -mx-2 lg:justify-end">
              {mainLinks.map((link, i) => (
                <li key={i} className="my-1 mx-2 shrink-0">
                  <FooterNavLink
                    href={link.href}
                    label={link.label}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  />
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 lg:mt-0 lg:col-[4/11]">
            <ul className="list-none flex flex-wrap -my-1 -mx-3 lg:justify-end">
              {legalLinks.map((link, i) => (
                <li key={i} className="my-1 mx-3 shrink-0">
                  <FooterNavLink
                    href={link.href}
                    label={link.label}
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 text-sm leading-6 text-muted-foreground whitespace-nowrap lg:mt-0 lg:row-[1/3] lg:col-[1/4]">
            <div>{copyright.text}</div>
            {copyright.license && <div>{copyright.license}</div>}
          </div>
        </div>
      </div>
    </footer>
  );
}
