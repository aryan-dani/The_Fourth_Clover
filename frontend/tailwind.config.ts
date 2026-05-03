import type { Config } from "tailwindcss";

/** Ensure emoji render (Charter/Playfair do not include color emoji glyphs). */
const emojiFallback = [
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Noto Color Emoji",
] as const;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
          ...emojiFallback,
        ],
        serif: [
          "Charter",
          "Bitstream Charter",
          "Sitka Text",
          "Cambria",
          "Georgia",
          "serif",
          ...emojiFallback,
        ],
        display: [
          "var(--font-playfair)",
          "Playfair Display",
          "serif",
          ...emojiFallback,
        ],
        mono: [
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
        section: "2rem",
        "section-sm": "1.25rem",
      },
      maxWidth: {
        reading: "42rem",
        content: "72rem",
        wide: "90rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-botanical":
          "radial-gradient(at 40% 20%, hsl(var(--primary) / 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsl(142 40% 45% / 0.06) 0px, transparent 45%), radial-gradient(at 0% 100%, hsl(158 42% 38% / 0.05) 0px, transparent 45%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "nav-progress": "nav-progress 0.95s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
