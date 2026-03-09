import { usePageMeta } from "@/hooks/usePageMeta";
import { PageLayout } from "@/components/page-layout";

export default function PrivacyPage() {
  usePageMeta("Privacy Policy", "How dispatchCore handles and protects your personal data.");

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: March 5, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide when creating an account,
              including your name, email address, phone number, and company
              name. For drivers, we also collect vehicle details, license
              numbers, and verification documents. During active use, we collect
              GPS location data, delivery status updates, and platform
              interaction logs to operate and improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information to operate the dispatchCore platform —
              including order dispatch, live GPS tracking, marketplace bidding,
              route matching, delivery history, and 1-on-1 messaging. We also
              use aggregated data to power dashboard analytics and improve our
              matching algorithms. We do not sell your personal data to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              3. GPS & Location Data
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Driver GPS locations are collected during active sessions and
              stored in our DriverLocationLog database. For employed drivers,
              location is broadcast to company dispatchers at all times while
              online. For independent drivers, GPS is only broadcast during an
              active delivery assignment (from PICKED_UP to DELIVERED). Customer
              tracking pages receive driver location only for their specific
              order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              4. Multi-Tenant Data Isolation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              dispatchCore is a multi-tenant platform. Each company's data
              (orders, drivers, assignments, delivery events) is strictly scoped
              by company_id. No company can access another company's data.
              Independent drivers interact only with marketplace listings and
              their own delivery history.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              5. Data Storage & Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored in a MySQL database with parameterized queries
              (via Sequelize ORM) to prevent SQL injection. All API
              communication uses HTTPS. We apply rate limiting on all endpoints
              and GPS ping submissions. Passwords and authentication are planned
              for CE-02 with JWT tokens.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We share limited data as part of platform functionality: customer
              tracking pages display driver location and order status.
              Marketplace listings are visible to independent drivers across the
              platform. Bid information is shared between the bidding driver and
              the listing dispatcher. We do not share data with external third
              parties for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, correct, or delete your personal
              data. Dispatchers can view and export full delivery history from
              the dashboard. Drivers can view their own delivery history and
              earnings. To exercise data deletion rights, contact us at{" "}
              <a
                href="mailto:privacy@dispatchcore.io"
                className="text-primary hover:underline"
              >
                privacy@dispatchcore.io
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use localStorage to maintain your session identity (company ID,
              user ID, driver ID) and theme preferences (light/dark mode). No
              third-party tracking cookies are used. Analytics cookies may be
              introduced in future releases.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about this privacy policy, contact us at{" "}
              <a
                href="mailto:privacy@dispatchcore.io"
                className="text-primary hover:underline"
              >
                privacy@dispatchcore.io
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
