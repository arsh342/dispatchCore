import { usePageMeta } from "@/hooks/usePageMeta";
import { PageLayout } from "@/components/page-layout";

export default function TermsPage() {
  usePageMeta("Terms of Service", "Terms and conditions for using the dispatchCore platform.");

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: March 5, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using dispatchCore, you agree to be bound by these
              Terms of Service. These terms apply to all users of the platform,
              including SuperAdmins, Company Admins (Dispatchers), Employed
              Drivers, Independent Drivers, and Customers accessing public
              tracking links.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              2. Service Description
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              dispatchCore is a real-time, multi-tenant last-mile logistics
              platform with an integrated gig-driver marketplace. The platform
              provides order creation and management, direct driver assignment
              with concurrency-safe locking, marketplace listing and bidding,
              live GPS tracking, route matching, delivery history, 1-on-1
              messaging, and public customer tracking pages. Features may vary
              by subscription plan.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              3. User Roles & Responsibilities
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Company Admins / Dispatchers</strong> are responsible for
              managing their company's orders, drivers, and marketplace
              activity. <strong>Employed Drivers</strong> must keep their status
              updated, stream GPS while online, and complete assigned
              deliveries. <strong>Independent Drivers</strong> must provide
              accurate route information when pre-registering travel plans and
              honor accepted bids. All users are responsible for the accuracy of
              data entered into the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              4. Marketplace & Bidding
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Dispatchers may list orders on the public marketplace at a set
              price. Independent drivers may place counter-offer bids on listed
              orders. When a dispatcher accepts a bid, it is automatically
              converted into an assignment and all other bids on that order are
              rejected. Accepted bids are binding — drivers are expected to
              complete the delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              5. GPS & Location Tracking
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Drivers consent to GPS location tracking while using the platform.
              Employed drivers broadcast location to their company dispatchers
              at all times while online. Independent drivers broadcast location
              only during active delivery assignments. GPS data is stored in the
              DriverLocationLog and used for live fleet maps and customer
              tracking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              6. Payment & Billing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Subscription fees are billed monthly or annually based on your
              chosen plan (Starter, Growth, or Enterprise). All fees are
              non-refundable unless otherwise stated. We reserve the right to
              modify pricing with 30 days prior notice. Delivery payments
              between companies and independent drivers are managed outside the
              platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              7. Data & Multi-Tenancy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Each company's data is isolated by tenant boundary (company_id).
              You may not attempt to access data belonging to other companies.
              SuperAdmin access is reserved for platform operators only. All API
              access is scoped and validated by tenant middleware.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may not use dispatchCore for any illegal purpose, to submit
              falsified GPS data, to interfere with other users' operations, or
              to circumvent concurrency safeguards. Abuse of the bidding system
              (e.g., placing bids with no intent to deliver) may result in
              account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              9. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              dispatchCore is provided "as is" without warranties of any kind.
              We are not liable for delivery failures, driver conduct, or losses
              arising from marketplace transactions. Our total liability shall
              not exceed the subscription fees paid by you in the twelve months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              Either party may terminate the agreement with 30 days written
              notice. Upon termination, your company data (orders, drivers,
              assignments, delivery history) will be available for export for 30
              days, after which it will be permanently deleted. Contact{" "}
              <a
                href="mailto:support@dispatchcore.io"
                className="text-primary hover:underline"
              >
                support@dispatchcore.io
              </a>{" "}
              for questions.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
