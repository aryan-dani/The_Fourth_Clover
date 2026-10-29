import "sonner/dist/styles.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import {
  Jost,
  JetBrains_Mono,
  Monsieur_La_Doulaise,
  Noto_Serif_Display,
} from "next/font/google";
import { AppToaster } from "@/components/providers/app-toaster";
import { ThemeColorMeta } from "@/components/providers/theme-color";
import { NavigationProgress } from "@/components/providers/navigation-progress";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/auth-context";
import { SiteProviders } from "@/components/providers/SiteProviders";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { siteUrl } from "@/lib/site";

const display = Noto_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const script = Monsieur_La_Doulaise({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const sans = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F2ECE0",
  width: "device-width",
  initialScale: 1,
};

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

const BOOT_SCRIPT = `(function(){var d=document.documentElement;try{var rm=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(!rm){d.classList.add("js-motion");}var seen=false;try{seen=sessionStorage.getItem("clover:intro")==="1";}catch(e){}var home=location.pathname==="/"||location.pathname==="";d.setAttribute("data-intro",(rm||seen||!home)?"done":"pending");setTimeout(function(){if(!window.__cloverReady){d.classList.add("motion-failsafe");d.setAttribute("data-intro","done");}},6000);}catch(e){d.setAttribute("data-intro","done");}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${script.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        <Script id="clover-boot" strategy="beforeInteractive">
          {BOOT_SCRIPT}
        </Script>
        <noscript>
          <style>{`.intro{display:none!important}`}</style>
        </noscript>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <ThemeColorMeta />
          <TooltipProvider delayDuration={0}>
            <AuthProvider>
              <SiteProviders>
                <Suspense fallback={null}>
                  <NavigationProgress />
                </Suspense>
                {children}
                <AppToaster />
              </SiteProviders>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
