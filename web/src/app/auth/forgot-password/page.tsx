"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Floating background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute top-20 left-10 w-32 h-32 rounded-full border border-muted/20"
                />
                <motion.div
                    animate={{
                        rotate: -360,
                        scale: [1, 0.9, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-muted/30"
                />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Button variant="ghost" asChild className="rounded-full">
                        <Link
                            href="/auth/signin"
                            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to sign in
                        </Link>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                        <CardHeader className="space-y-6 text-center pb-8 bg-gradient-to-b from-muted/10 to-transparent">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    duration: 1,
                                    delay: 0.3,
                                    type: "spring",
                                    stiffness: 120,
                                }}
                                className="flex items-center justify-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-lg ring-4 ring-background">
                                    <Mail className="w-8 h-8 text-background" />
                                </div>
                            </motion.div>
                            <div>
                                <CardTitle className="text-3xl font-bold brand-text mb-2">
                                    Forgot Password?
                                </CardTitle>
                                <CardDescription className="text-base text-muted-foreground">
                                    No worries! Enter your email and we&apos;ll send you a reset link.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-4"
                                >
                                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Check your email</h3>
                                    <p className="text-muted-foreground">
                                        We&apos;ve sent a password reset link to{" "}
                                        <span className="font-medium text-foreground">{email}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Didn&apos;t receive the email? Check your spam folder or{" "}
                                        <button
                                            onClick={() => setSuccess(false)}
                                            className="text-primary hover:underline"
                                        >
                                            try again
                                        </button>
                                    </p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Alert
                                                variant="destructive"
                                                className="rounded-2xl border-0"
                                            >
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    )}

                                    <div className="space-y-3">
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="pl-11 h-12 rounded-2xl border-0 bg-muted/30 focus:bg-muted/50 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button
                                            type="submit"
                                            className="w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                            disabled={isLoading || !email}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                "Send Reset Link"
                                            )}
                                        </Button>
                                    </motion.div>
                                </form>
                            )}

                            <div className="mt-8 text-center">
                                <p className="text-muted-foreground">
                                    Remember your password?{" "}
                                    <Link
                                        href="/auth/signin"
                                        className="text-foreground hover:underline font-medium transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
