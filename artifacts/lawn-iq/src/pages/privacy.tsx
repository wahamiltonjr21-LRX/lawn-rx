import { Leaf, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-background to-amber-50/40 dark:from-emerald-950/30 dark:via-background dark:to-amber-950/20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-600" />
          <span className="font-bold text-lg">LawnRX</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: June 26, 2026</p>
        </div>

        {/* ── 1. Introduction ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            LawnRX ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our mobile and web application,
            including when you optionally request professional lawn care services through the platform.
          </p>
        </section>

        {/* ── 2. Information We Collect ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li>
              <strong className="text-foreground">Account information:</strong> Name and email address provided through
              Replit authentication (OAuth login).
            </li>
            <li>
              <strong className="text-foreground">Photos:</strong> Lawn images you upload for AI diagnosis. These are
              transmitted to OpenAI for analysis and are not permanently stored on our servers after processing.
            </li>
            <li>
              <strong className="text-foreground">Diagnosis data:</strong> Your saved lawn diagnosis results, including
              health scores, severity ratings, and treatment plans, stored in our secure database.
            </li>
            <li>
              <strong className="text-foreground">Location data:</strong> ZIP code and optional address used to tailor
              lawn care advice to your climate zone and, if you request professional services, to identify local
              service providers. We do not store precise GPS coordinates.
            </li>
            <li>
              <strong className="text-foreground">Professional service request information:</strong> When you choose to
              request a service quote, we collect your name, email address, phone number (optional), mailing address
              (optional), ZIP code, selected service type, any description you write, and any photo you attach. This
              information is collected only when you actively submit a request and is never gathered passively.
            </li>
            <li>
              <strong className="text-foreground">Payment information:</strong> Handled entirely by Stripe. We do not
              store credit card numbers or payment details on our servers.
            </li>
            <li>
              <strong className="text-foreground">Usage data:</strong> Basic app usage information such as number of
              diagnoses performed, used to enforce free-tier limits and improve the service.
            </li>
          </ul>
        </section>

        {/* ── 3. How We Use Your Information ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li>To provide AI-powered lawn diagnosis and personalised treatment plans.</li>
            <li>To save and display your diagnosis history.</li>
            <li>To manage your subscription and process payments via Stripe.</li>
            <li>To send care alerts and seasonal lawn tips relevant to your region.</li>
            <li>
              To match you with local lawn care professionals and facilitate a quote,{" "}
              <strong className="text-foreground">only when you explicitly submit a service request</strong>.
            </li>
            <li>To improve the accuracy and performance of our AI analysis.</li>
          </ul>
        </section>

        {/* ── 4. Sharing with Lawn Care Professionals ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Sharing Your Information with Lawn Care Professionals</h2>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-4">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-1">When does sharing occur?</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sharing with lawn care professionals{" "}
              <strong className="text-foreground">only occurs when you explicitly submit a service quote request</strong>{" "}
              using the "Get a Quote" feature. Simply using the app, running a diagnosis, or browsing your plans does{" "}
              <strong className="text-foreground">not</strong> result in your data being shared with any third party
              professional.
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            If you choose to request professional lawn care services, LawnRX may share your name, contact information,
            location, lawn diagnosis information, and submitted photos with participating lawn care professionals in
            order to connect you with service providers.
          </p>

          <p className="text-sm font-semibold text-foreground">What information is shared:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 leading-relaxed">
            <li>Your name</li>
            <li>Email address</li>
            <li>Phone number (if you provided one)</li>
            <li>Street address and ZIP code</li>
            <li>Selected service type (e.g., "Lawn Mowing", "Fertilization")</li>
            <li>Any written description you submitted about the job or issue</li>
            <li>Your lawn diagnosis information (condition, severity, recommended treatments) if you linked it to the request</li>
            <li>Any photo of your lawn you attached to the service request</li>
          </ul>

          <p className="text-sm font-semibold text-foreground">Why it is shared:</p>
          <p className="text-muted-foreground leading-relaxed">
            This information is shared with a local lawn care professional solely for the purpose of allowing them to
            prepare and deliver a service quote or to contact you about your request. LawnRX does not sell this
            information or use it for advertising purposes.
          </p>

          <p className="text-sm font-semibold text-foreground">Who receives it:</p>
          <p className="text-muted-foreground leading-relaxed">
            Only vetted, participating lawn care professionals registered on the LawnRX Partners platform who serve your
            ZIP code area. We do not share your information with data brokers, lead aggregators, or marketing companies.
          </p>

          <p className="text-sm font-semibold text-foreground">Your consent:</p>
          <p className="text-muted-foreground leading-relaxed">
            Before submitting any service quote request, you are shown a clear consent statement and must actively
            check a checkbox to proceed. You may decline at any time simply by not using the "Get a Quote" feature.
          </p>
        </section>

        {/* ── 5. Third-Party Services ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">We use the following third-party services:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li>
              <strong className="text-foreground">OpenAI:</strong> Processes uploaded photos for lawn diagnosis.
              Subject to{" "}
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
                OpenAI's Privacy Policy
              </a>. Photos are not used to train AI models.
            </li>
            <li>
              <strong className="text-foreground">Stripe:</strong> Handles all payment processing. Subject to{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
                Stripe's Privacy Policy
              </a>.
            </li>
            <li>
              <strong className="text-foreground">Replit:</strong> Provides authentication and hosting infrastructure.
            </li>
            <li>
              <strong className="text-foreground">Participating Lawn Care Professionals:</strong> Independent service
              providers registered on the LawnRX Partners platform. Data is shared with them only when you submit a
              service quote request, as described in Section 4 above.
            </li>
          </ul>
        </section>

        {/* ── 6. Data Retention & Deletion ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Data Retention &amp; Deletion</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your saved diagnosis plans and profile data for as long as your account is active. You can delete
            individual plans at any time from within the app.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Service request records:</strong> When you submit a quote request, a
            lead record is created in our system and shared with a matched professional. You may request deletion of
            your service request history by contacting us (see Section 11). Note that once a professional has received
            your contact details, we cannot revoke that specific communication — deletion applies to data still held
            within LawnRX's systems.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Account deletion:</strong> You may request permanent deletion of your
            account and all associated data at any time by visiting the{" "}
            <a href="/delete-account" className="text-emerald-600 underline">
              Delete Account page
            </a>{" "}
            or through the profile menu in the app. Upon request, your account is immediately deactivated and all
            personal data — including your profile, diagnosis plans, treatment history, service requests, and community
            content — is permanently deleted within <strong className="text-foreground">90 days</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Payment records held by Stripe are subject to Stripe's own data retention policy and are not within our
            control.
          </p>
        </section>

        {/* ── 7. Data Security ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use industry-standard security measures including encrypted connections (HTTPS/TLS), secure session
            management, and scoped database access. Your data is only accessible to you when logged in. Service request
            data is accessible only to the matched professional and to LawnRX staff for support purposes.
          </p>
        </section>

        {/* ── 8. Children's Privacy ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            LawnRX is not directed at children under 13. We do not knowingly collect personal information from children
            under 13. If you believe a child has provided us with personal data, please contact us and we will delete it
            promptly.
          </p>
        </section>

        {/* ── 9. Your Rights ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, export, or delete your personal data at any time. You can manage
            your saved plans directly in the app. For any of the following requests, contact us at the address in
            Section 11:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-foreground">Access:</strong> Request a copy of all personal data we hold about
              you, including diagnosis history and any service request records.
            </li>
            <li>
              <strong className="text-foreground">Correction:</strong> Ask us to correct inaccurate information.
            </li>
            <li>
              <strong className="text-foreground">Deletion:</strong> Request deletion of your account, diagnosis
              history, service request records, or any other personal data we hold. Account deletion is also available
              directly in the app.
            </li>
            <li>
              <strong className="text-foreground">Portability:</strong> Receive your data in a portable,
              machine-readable format.
            </li>
            <li>
              <strong className="text-foreground">Objection / Withdrawal of Consent:</strong> Object to specific uses
              of your data, including being matched with lawn care professionals. You can withdraw consent for
              professional service matching at any time by not submitting further quote requests; existing requests
              already shared cannot be recalled.
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            We will respond to verified data requests within 30 days. Account deletion can be completed immediately
            through the app's profile menu.
          </p>
        </section>

        {/* ── 10. Google Play Data Safety ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Google Play Data Safety</h2>
          <p className="text-muted-foreground leading-relaxed">
            The following summarises how LawnRX handles your data, consistent with Google Play's Data Safety
            disclosures. All sharing with third-party professionals occurs only at your explicit request.
          </p>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left px-4 py-2.5 font-semibold border-b border-border/60">Data type</th>
                  <th className="text-left px-4 py-2.5 font-semibold border-b border-border/60">Collected</th>
                  <th className="text-left px-4 py-2.5 font-semibold border-b border-border/60">Shared</th>
                  <th className="text-left px-4 py-2.5 font-semibold border-b border-border/60">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Name", "Yes", "With lawn pros — only when you request a quote", "Account management; service matching"],
                  ["Email address", "Yes", "With lawn pros — only when you request a quote", "Account management; service matching"],
                  ["Phone number", "Optional — if provided during quote request", "With lawn pros — only when you request a quote", "Service matching"],
                  ["Address / ZIP code", "Yes — ZIP always; full address optional", "With lawn pros — only when you request a quote", "Climate-tailored advice; local pro matching"],
                  ["Photos / images", "Yes — for AI diagnosis", "OpenAI (analysis); lawn pros if attached to quote", "Lawn diagnosis; service context"],
                  ["Diagnosis / health data", "Yes", "With lawn pros — only if linked to a quote request", "Service context"],
                  ["Payment info", "No — handled by Stripe", "Stripe (payment processor only)", "Subscription billing"],
                ].map(([type, collected, shared, purpose], i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                    <td className="px-4 py-2.5 border-b border-border/40 font-medium text-foreground">{type}</td>
                    <td className="px-4 py-2.5 border-b border-border/40">{collected}</td>
                    <td className="px-4 py-2.5 border-b border-border/40">{shared}</td>
                    <td className="px-4 py-2.5 border-b border-border/40">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 leading-relaxed">
            <li><strong className="text-foreground">Data is not sold</strong> to any third party.</li>
            <li><strong className="text-foreground">Data is not used for advertising</strong> or cross-app tracking.</li>
            <li><strong className="text-foreground">Data is not used to build advertising profiles.</strong></li>
            <li>
              Sharing with lawn care professionals is classified as{" "}
              <strong className="text-foreground">sharing data to fulfil a user-requested service</strong> — it is
              triggered entirely by your explicit, consented action.
            </li>
            <li>You can request deletion of your data at any time via the app or by contacting us.</li>
          </ul>
        </section>

        {/* ── 11. Privacy Policy Changes ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Privacy Policy Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal
            requirements, or the services we offer. When we do, we will:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 leading-relaxed">
            <li>
              Update the <strong className="text-foreground">"Last updated"</strong> date at the top of this page.
            </li>
            <li>
              For <strong className="text-foreground">material changes</strong> — such as collecting new categories of
              data, introducing new third-party sharing (including sharing with additional types of service providers),
              or changing how we use your data in a way that is less privacy-protective — provide prominent in-app
              notice at least 30 days before the change takes effect and, where required by law or consent was
              previously obtained, seek your renewed consent.
            </li>
            <li>
              For <strong className="text-foreground">minor changes</strong> (e.g., clarifications, corrected links,
              formatting) update the policy without individual notification.
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Continued use of LawnRX after a policy update constitutes your acceptance of the revised policy. If you do
            not agree with a material change, you may delete your account before it takes effect — your data will be
            fully removed per Section 6.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            If you were using the app before professional service matching was introduced and later use the "Get a
            Quote" feature for the first time, the consent flow within that feature will prompt you to review the
            relevant data-sharing terms before submitting.
          </p>
        </section>

        {/* ── 12. Contact Us ── */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, wish to exercise your data rights, or would like to
            request deletion of your personal data (including any service request records), please contact us through
            the About page in the app or at:
          </p>
          <p className="text-muted-foreground leading-relaxed font-medium text-foreground">
            <a href="https://lawn-rx.replit.app" className="text-emerald-600 underline">
              https://lawn-rx.replit.app
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            We aim to respond to all privacy requests within 30 days.
          </p>
        </section>

        <div className="border-t border-border/50 pt-6 text-center">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              Back to LawnRX
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
