"use client";

import { motion } from "framer-motion";
import { motionEase } from "@/lib/motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, FileText, Shield, Mail } from "lucide-react";
import Link from "next/link";

export default function CopyrightPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20 pb-6">
        <PageShell
          variant="reading"
          title="Copyright & legal"
          description="Protecting creative content and respecting intellectual property rights."
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: motionEase }}
            className="space-y-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Scale className="h-5 w-5 text-primary" aria-hidden />
                  Copyright notice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-serif text-muted-foreground">
                <p>© 2026 The Fourth Clover. All rights reserved.</p>
                <p>
                  All content published on The Fourth Clover, including text, images, graphics, and
                  code, is protected by copyright law. The content is owned by The Fourth Clover and its
                  content creators unless otherwise stated.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <FileText className="h-5 w-5 text-primary" aria-hidden />
                  User-generated content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-serif text-muted-foreground">
                <p>
                  When you publish content on The Fourth Clover, you retain full ownership and
                  copyright of your original work. By publishing content on our platform, you grant
                  The Fourth Clover a non-exclusive, worldwide license to host, display, and distribute
                  your content.
                </p>
                <p className="font-sans text-sm">
                  You are responsible for ensuring that your content does not infringe on the
                  intellectual property rights of others.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Shield className="h-5 w-5 text-primary" aria-hidden />
                  Fair use & permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-serif text-muted-foreground">
                <p>
                  Limited quotations from content published on The Fourth Clover are permitted for
                  purposes of commentary, criticism, news reporting, and education, provided that
                  proper attribution is given to the original author.
                </p>
                <p>
                  For any other use of content beyond fair use guidelines, you must obtain explicit
                  permission from the content owner.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Mail className="h-5 w-5 text-primary" aria-hidden />
                  Copyright infringement claims
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-serif text-muted-foreground">
                <p>
                  The Fourth Clover respects the intellectual property rights of others. If you believe
                  that your copyrighted work has been copied in a way that constitutes copyright
                  infringement, please contact us with the following information:
                </p>
                <ul className="list-inside list-disc space-y-2 font-sans text-sm">
                  <li>A description of the copyrighted work you claim has been infringed</li>
                  <li>The URL where the allegedly infringing material is located</li>
                  <li>Your contact information (email address, phone number)</li>
                  <li>A statement of good faith belief</li>
                  <li>A statement, under penalty of perjury, that the information is accurate</li>
                </ul>
                <p className="font-sans text-sm">
                  Contact:{" "}
                  <Link href="mailto:legal@thefourthclover.com" className="text-primary hover:underline">
                    legal@thefourthclover.com
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Platform code license</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-muted-foreground">
                  The Fourth Clover platform software is released under the MIT License. See our{" "}
                  <Link
                    href="https://github.com/aryan-dani/The-Fourth-Clover"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub repository
                  </Link>{" "}
                  for more details.
                </p>
              </CardContent>
            </Card>

            <p className="text-center font-sans text-sm text-muted-foreground">
              Last updated: January 18, 2026
            </p>
          </motion.div>
        </PageShell>
      </main>
      <Footer />
    </div>
  );
}
