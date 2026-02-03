"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-4xl">
                <div className="space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl brand-text">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Your privacy is important to us. This policy explains how we handle your data.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-lg max-w-none">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">Information We Collect</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                When you create an account on The Fourth Clover, we collect information you provide directly, including your name, email address, and profile information. We also collect content you create, such as posts, comments, and likes.
                            </p>
                        </section>

                        <section className="space-y-4 mt-8">
                            <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We use the information we collect to provide, maintain, and improve our services. This includes personalizing your experience, enabling social features like following and commenting, and sending you notifications about activity on your content.
                            </p>
                        </section>

                        <section className="space-y-4 mt-8">
                            <h2 className="text-2xl font-semibold">Data Security</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We implement appropriate security measures to protect your personal information. Your data is stored securely using industry-standard encryption and access controls. We use Supabase for our backend infrastructure, which provides enterprise-grade security.
                            </p>
                        </section>

                        <section className="space-y-4 mt-8">
                            <h2 className="text-2xl font-semibold">Third-Party Services</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may use third-party services for analytics, authentication, and hosting. These services have their own privacy policies and we encourage you to review them. We do not sell your personal information to third parties.
                            </p>
                        </section>

                        <section className="space-y-4 mt-8">
                            <h2 className="text-2xl font-semibold">Your Rights</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You have the right to access, update, or delete your personal information at any time. You can manage your account settings or contact us directly for assistance. If you choose to delete your account, we will remove your personal data from our systems.
                            </p>
                        </section>

                        <section className="space-y-4 mt-8">
                            <h2 className="text-2xl font-semibold">Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about this Privacy Policy, please reach out to us through our GitHub repository or social media channels.
                            </p>
                        </section>

                        <section className="space-y-4 mt-8">
                            <p className="text-sm text-muted-foreground">
                                Last updated: February 2026
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
