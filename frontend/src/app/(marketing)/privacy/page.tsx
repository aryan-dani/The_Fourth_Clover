"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageShell } from "@/components/layout/PageShell";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-6">
        <PageShell
          variant="reading"
          title="Privacy policy"
          description="Your privacy is important to us. This policy explains how we handle your data."
        >
          <div className="prose prose-lg max-w-none font-serif text-muted-foreground">
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Information we collect
              </h2>
              <p className="leading-relaxed">
                When you create an account on The Fourth Clover, we collect information you provide
                directly, including your name, email address, and profile information. We also
                collect content you create, such as posts, comments, and likes.
              </p>
            </section>

            <section className="space-y-4 mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground">
                How we use your information
              </h2>
              <p className="leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services. This
                includes personalizing your experience, enabling social features like following and
                commenting, and sending you notifications about activity on your content.
              </p>
            </section>

            <section className="space-y-4 mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground">Data security</h2>
              <p className="leading-relaxed">
                We implement appropriate security measures to protect your personal information.
                Your data is stored securely using industry-standard encryption and access controls.
                We use Supabase for our backend infrastructure, which provides enterprise-grade security.
              </p>
            </section>

            <section className="space-y-4 mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Third-party services
              </h2>
              <p className="leading-relaxed">
                We may use third-party services for analytics, authentication, and hosting. These
                services have their own privacy policies and we encourage you to review them. We do
                not sell your personal information to third parties.
              </p>
            </section>

            <section className="space-y-4 mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground">Your rights</h2>
              <p className="leading-relaxed">
                You have the right to access, update, or delete your personal information at any time.
                You can manage your account settings or contact us directly for assistance. If you
                choose to delete your account, we will remove your personal data from our systems.
              </p>
            </section>

            <section className="space-y-4 mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground">Contact us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please reach out to us through
                our GitHub repository or social media channels.
              </p>
            </section>

            <section className="mt-10">
              <p className="font-sans text-sm text-muted-foreground">Last updated: February 2026</p>
            </section>
          </div>
        </PageShell>
      </main>
      <Footer />
    </div>
  );
}
