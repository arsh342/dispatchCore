import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Send, Mail, Building2, User, MessageSquare } from "lucide-react";

export default function ContactPage() {
  usePageMeta("Contact Us", "Get in touch with the dispatchCore team for demos, support, and partnerships.");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate with backend or email service
    setSubmitted(true);
  };

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: copy */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Let's connect
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
              Whether you're exploring dispatchCore for your fleet or want a
              personalized demo, we'd love to hear from you. Fill out the form
              and we'll get back to you within 24 hours.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <a
                    href="mailto:hello@dispatchcore.io"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    hello@dispatchcore.io
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Response time
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center rounded-3xl border border-border bg-card/50 p-12">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Message sent!</h2>
                <p className="text-muted-foreground max-w-sm">
                  Thanks for reaching out. We'll get back to you at{" "}
                  <span className="text-foreground font-medium">{email}</span>{" "}
                  within 24 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-3xl border border-border bg-card/50 p-8 md:p-10"
              >
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <div className="relative">
                    <input
                      required
                      placeholder="Your name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-full border border-border bg-background px-6 py-[14px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                      <User className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <input
                      required
                      placeholder="you@company.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-full border border-border bg-background px-6 py-[14px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                      <Mail className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Company */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Company{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      placeholder="Your Company Inc."
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full rounded-full border border-border bg-background px-6 py-[14px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                      <Building2 className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    required
                    placeholder="Tell us about your fleet size, delivery volume, or any questions you have..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-6 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 text-sm font-medium text-background hover:bg-foreground/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  Send Message
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
