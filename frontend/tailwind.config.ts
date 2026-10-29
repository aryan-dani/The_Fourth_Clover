import type { Config } from "tailwindcss";

const emojiFallback = [
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Noto Color Emoji",
] as const;

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
          ...emojiFallback,
        ],
        serif: [
          "var(--font-display)",
          "Georgia",
          "serif",
          ...emojiFallback,
        ],
        display: [
          "var(--font-display)",
          "Georgia",
          "serif",
          ...emojiFallback,
        ],
        script: ["var(--font-script)", "cursive", ...emojiFallback],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      spacing: {
        section: "2.5rem",
        "section-sm": "1.5rem",
      },
      maxWidth: {
        measure: "40rem",
        reading: "42rem",
        content: "72rem",
        wide: "90rem",
      },
      fontSize: {
        "display-xl": [
          "3.5rem",
          { lineHeight: "0.92", letterSpacing: "-0.02em", fontWeight: "500" },
        ],
        "display-lg": [
          "2.75rem",
          { lineHeight: "0.95", letterSpacing: "-0.02em", fontWeight: "500" },
        ],
        "display-md": [
          "2rem",
          { lineHeight: "1.05", letterSpacing: "-0.015em", fontWeight: "500" },
        ],
        "display-sm": [
          "1.5rem",
          { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "500" },
        ],
      },
      transitionDuration: {
        editorial: "180ms",
        expo: "700ms",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "calc(var(--radius) - 2px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          muted: "hsl(var(--surface-muted))",
        },
        hairline: "hsl(var(--hairline))",
        paper: "#F2ECE0",
        clover: "#2E7D57",
        ink: "#17211A",
        "ink-surface": "#2A352D",
        "paper-line": "#D5CFC0",
        "clover-bright": "#4FA37A",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "nav-progress": {
          "0%": { transform: "translateX(-100%)", opacity: "1" },
          "55%": { transform: "translateX(35%)", opacity: "1" },
          "100%": { transform: "translateX(220%)", opacity: "0.35" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "nav-progress": "nav-progress 0.95s ease-in-out infinite",
        "fade-in": "fade-in 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
