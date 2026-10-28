import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { CloverMark } from "@/components/layout/CloverMark";

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
      { href: "/copyright", label: "Copyright & IP" },
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
    <footer className="mt-auto border-t border-[var(--fg-line)]">
      <div className="wrap py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="space-y-4 md:col-span-4">
            <div className="flex items-center gap-2.5">
              <CloverMark size="md" className="text-[var(--brand-color)]" />
              <span className="type-display text-[0.95rem]">
                The Fourth{" "}
                <span className="type-script text-[1.35em] normal-case tracking-normal text-[var(--brand-color)]">
                  Clover
                </span>
              </span>
            </div>
            <p className="type-body max-w-sm text-sm">
              Writing, poetry, and engineering from CSI MIT-WPU. An editorial
              publication for thoughtful makers.
            </p>
            <p className="type-label text-muted-foreground">
              CSI MIT-WPU Technical Press
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://github.com/aryan-dani/The_Fourth_Clover"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-8 w-8 items-center justify-center border border-[var(--fg-line)] text-muted-foreground transition-colors duration-expo hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.linkedin.com/company/csi-mitwpu/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center border border-[var(--fg-line)] text-muted-foreground transition-colors duration-expo hover:text-foreground"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-8">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="type-label mb-3 text-muted-foreground">
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="link-u text-sm text-muted-foreground hover:text-foreground"
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--fg-line)] pt-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
            <p
              className="font-mono text-[11px] text-muted-foreground"
              suppressHydrationWarning
            >
              © {year} The Fourth Clover. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Made by{" "}
              <a
                href="https://www.aryandani.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-u font-medium text-foreground"
              >
                Aryan Dani
              </a>
            </p>
          </div>
          <Link
            href="/copyright"
            className="type-label link-u text-muted-foreground"
          >
            Copyright &amp; IP
          </Link>
        </div>
      </div>
    </footer>
  );
}
