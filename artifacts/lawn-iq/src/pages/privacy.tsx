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
          <p className="text-muted-foreground text-sm">Last updated: May 26, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            LawnRX ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile and web application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li><strong className="text-foreground">Account information:</strong> Name and email address provided through Replit authentication (OAuth login).</li>
            <li><strong className="text-foreground">Photos:</strong> Lawn images you upload for AI diagnosis. These are processed by OpenAI and not permanently stored on our servers.</li>
            <li><strong className="text-foreground">Diagnosis data:</strong> Your saved lawn diagnosis results, including health scores and treatment plans, stored in our secure database.</li>
            <li><strong className="text-foreground">Location data:</strong> Approximate location (city/region) used to tailor lawn care advice to your climate zone. We do not store precise GPS coordinates.</li>
            <li><strong className="text-foreground">Payment information:</strong> Handled entirely by Stripe. We do not store credit card numbers or payment details on our servers.</li>
            <li><strong className="text-foreground">Usage data:</strong> Basic app usage information such as number of diagnoses performed, used to enforce free-tier limits.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li>To provide AI-powered lawn diagnosis and personalized treatment plans.</li>
            <li>To save and display your diagnosis history.</li>
            <li>To manage your subscription and process payments via Stripe.</li>
            <li>To send care alerts and seasonal lawn tips relevant to your region.</li>
            <li>To improve the accuracy and performance of our AI analysis.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">We use the following third-party services:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li><strong className="text-foreground">OpenAI:</strong> Processes uploaded photos for lawn diagnosis. Subject to <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">OpenAI's Privacy Policy</a>.</li>
            <li><strong className="text-foreground">Stripe:</strong> Handles all payment processing. Subject to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Stripe's Privacy Policy</a>.</li>
            <li><strong className="text-foreground">Replit:</strong> Provides authentication and hosting infrastructure.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Data Retention &amp; Deletion</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your saved diagnosis plans and profile data for as long as your account is active. You can delete individual plans at any time from within the app.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Account deletion:</strong> You may request permanent deletion of your account and all associated data at any time by visiting{" "}
            <a href="/delete-account" className="text-emerald-600 underline">lawnrx.replit.app/delete-account</a>{" "}
            or through the profile menu in the app. Upon request, your account is immediately deactivated and all personal data — including your profile, diagnosis plans, treatment history, and community content — is permanently deleted within <strong className="text-foreground">90 days</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Payment records held by Stripe are subject to Stripe's own data retention policy and are not within our control.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use industry-standard security measures including encrypted connections (HTTPS/TLS), secure session management, and scoped database access. Your data is only accessible to you when logged in.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            LawnRX is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data at any time. You can manage your saved plans directly in the app. For account deletion or other data requests, contact us at the email below.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the app after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy or your personal data, please contact us at:<br />
            <strong className="text-foreground">https://lawn-rx.replit.app</strong>
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
