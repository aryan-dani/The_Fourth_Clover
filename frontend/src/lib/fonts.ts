import {
  Jost,
  JetBrains_Mono,
  Monsieur_La_Doulaise,
  Noto_Serif_Display,
} from "next/font/google";

/** Display + italic cut in one family load. */
export const fontDisplay = Noto_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  display: "swap",
});

export const fontSans = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Script accent — load only under SiteChrome / auth shell. */
export const fontScript = Monsieur_La_Doulaise({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
