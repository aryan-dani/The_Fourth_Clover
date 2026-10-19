import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { CloverMark } from "@/components/layout/CloverMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const COLUMNS = [
  {
    title: "Read",
    links: [
      { href: "/journal", label: "Journal" },
      { href: "/tech-weekly", label: "Tech Weekly" },
      { href: "/tech-weekly/issues", label: "Issues" },
      { href: "/tags", label: "Topics" },
    ],
  },
  {
    title: "Write",
    links: [
      { href: "/write", label: "Start writing" },
      { href: "/about", label: "Guidelines" },
      { href: "/verify-csi", label: "Verify CSI ID" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About" },
      { href: "/about#masthead", label: "Masthead" },
      { href: "/privacy", label: "Privacy" },
      { href: "/copyright", label: "Copyright" },
    ],
  },
  {
    title: "Subscribe",
    links: [
      { href: "/feed.xml", label: "Journal RSS" },
      { href: "/csi/feed.xml", label: "Tech Weekly RSS" },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-hairline bg-background">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="circle-logo h-8 w-8 text-sm">
                <CloverMark size="sm" />
              </span>
              <span className="font-display text-base font-semibold tracking-tight">
                The Fourth Clover
              </span>
            </div>
            <p className="max-w-sm font-serif text-sm leading-relaxed text-muted-foreground">
              Writing, poetry, and engineering from CSI MIT-WPU. An editorial
              publication for thoughtful makers.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              CSI MIT-WPU Technical Press
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://github.com/aryan-dani/The_Fourth_Clover"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-muted-foreground transition-colors duration-editorial hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.linkedin.com/company/csi-mitwpu/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-muted-foreground transition-colors duration-editorial hover:text-foreground"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="meta-label mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors duration-editorial hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-hairline pt-6 sm:flex-row">
          <p className="font-mono text-[11px] text-muted-foreground" suppressHydrationWarning>
            © {year} The Fourth Clover · CSI MIT-WPU
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-muted-foreground">
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
