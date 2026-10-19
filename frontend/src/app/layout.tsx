import "sonner/dist/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppToaster } from "@/components/providers/app-toaster";
import { NavigationProgress } from "@/components/providers/navigation-progress";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/auth-context";
import { siteUrl } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Fourth Clover — Writing, Poetry & Engineering",
    template: "%s · The Fourth Clover",
  },
  description:
    "An editorial publication from CSI MIT-WPU. Essays, poetry, and CSI Tech Weekly engineering dispatches.",
  keywords: [
    "CSI MIT-WPU",
    "Tech Weekly",
    "writing",
    "poetry",
    "engineering",
    "journal",
    "publication",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <AuthProvider>
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              {children}
              <AppToaster />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
