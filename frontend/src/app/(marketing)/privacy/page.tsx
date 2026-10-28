import { PageShell } from "@/components/layout/PageShell";

export default function PrivacyPage() {
  return (
    <PageShell
      variant="reading"
      title="Privacy policy"
      description="Your privacy is important to us. This policy explains how we handle your data."
    >
      <div className="prose-editorial space-y-10">
        <section className="space-y-4">
          <h2 className="type-display text-xl text-foreground">
            Information we collect
          </h2>
          <p>
            When you create an account on The Fourth Clover, we collect
            information you provide directly, including your name, email
            address, and profile information. We also collect content you
            create, such as posts, comments, and likes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="type-display text-xl text-foreground">
            How we use your information
          </h2>
          <p>
            We use the information we collect to provide, maintain, and improve
            our services. This includes personalizing your experience, enabling
            social features like following and commenting, and sending you
            notifications about activity on your content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="type-display text-xl text-foreground">Data security</h2>
          <p>
            We implement appropriate security measures to protect your personal
            information. Your data is stored securely using industry-standard
            encryption and access controls. We use Supabase for our backend
            infrastructure, which provides enterprise-grade security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="type-display text-xl text-foreground">
            Third-party services
          </h2>
          <p>
            We may use third-party services for analytics, authentication, and
            hosting. These services have their own privacy policies and we
            encourage you to review them. We do not sell your personal
            information to third parties.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="type-display text-xl text-foreground">Your rights</h2>
          <p>
            You have the right to access, update, or delete your personal
            information at any time. You can manage your account settings or
            contact us directly for assistance. If you choose to delete your
            account, we will remove your personal data from our systems.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="type-display text-xl text-foreground">Contact us</h2>
          <p>
            If you have any questions about this Privacy Policy, please reach
            out to us through our GitHub repository or social media channels.
          </p>
        </section>

        <p className="type-label text-muted-foreground">
          Last updated: February 2026
        </p>
      </div>
    </PageShell>
  );
}
