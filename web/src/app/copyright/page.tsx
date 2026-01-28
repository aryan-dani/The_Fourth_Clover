"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, FileText, Shield, Mail } from "lucide-react";
import Link from "next/link";

export default function CopyrightPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-12">
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4 brand-text">
                            Copyright & Legal
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Protecting creative content and respecting intellectual property rights
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Copyright Notice */}
                        <Card className="glass border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="w-5 h-5" />
                                    Copyright Notice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground">
                                    © 2026 The Fourth Clover. All rights reserved.
                                </p>
                                <p>
                                    All content published on The Fourth Clover, including text, images, graphics, and code, is protected by copyright law. The content is owned by The Fourth Clover and its content creators unless otherwise stated.
                                </p>
                            </CardContent>
                        </Card>

                        {/* User Content Rights */}
                        <Card className="glass border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    User-Generated Content
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p>
                                    When you publish content on The Fourth Clover, you retain full ownership and copyright of your original work. By publishing content on our platform, you grant The Fourth Clover a non-exclusive, worldwide license to host, display, and distribute your content.
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    You are responsible for ensuring that your content does not infringe on the intellectual property rights of others.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Fair Use */}
                        <Card className="glass border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Fair Use & Permissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p>
                                    Limited quotations from content published on The Fourth Clover are permitted for purposes of commentary, criticism, news reporting, and education, provided that proper attribution is given to the original author.
                                </p>
                                <p>
                                    For any other use of content beyond fair use guidelines, you must obtain explicit permission from the content owner.
                                </p>
                            </CardContent>
                        </Card>

                        {/* DMCA */}
                        <Card className="glass border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Copyright Infringement Claims
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p>
                                    The Fourth Clover respects the intellectual property rights of others. If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please contact us with the following information:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                    <li>A description of the copyrighted work you claim has been infringed</li>
                                    <li>The URL where the allegedly infringing material is located</li>
                                    <li>Your contact information (email address, phone number)</li>
                                    <li>A statement of good faith belief</li>
                                    <li>A statement, under penalty of perjury, that the information is accurate</li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-4">
                                    Contact: <Link href="mailto:legal@thefourthclover.com" className="text-primary hover:underline">legal@thefourthclover.com</Link>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Platform License */}
                        <Card className="glass border-2">
                            <CardHeader>
                                <CardTitle>Platform Code License</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    The Fourth Clover platform software is released under the MIT License. See our{" "}
                                    <Link href="https://github.com/aryan-dani/The-Fourth-Clover" target="_blank" className="text-primary hover:underline">
                                        GitHub repository
                                    </Link>{" "}
                                    for more details.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Last Updated */}
                        <p className="text-center text-sm text-muted-foreground">
                            Last updated: January 18, 2026
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
