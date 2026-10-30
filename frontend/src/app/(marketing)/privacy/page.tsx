"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  DrawLine,
  Reveal,
  RevealText,
  ScriptWipe,
} from "@/components/motion/Reveal";
import { HeroClover } from "@/components/home/HeroClover";

type Clause = { id: string; tag: string; title: string; body: ReactNode };

const linkClass = "link-u !bg-[length:100%_1px]";

const AT_A_GLANCE = [
  "We collect what you give us — account, profile, and the writing you publish",
  "We use it to run the publication: auth, feeds, comments, and notifications",
  "We do not sell your personal information",
];

const YOUR_CONTROLS = [
  "Update profile details from Settings any time",
  "Delete posts or comments you authored",
  "Request account deletion and we remove personal data from our systems",
];

function clauses(): Clause[] {
  return [
    {
      id: "01",
      tag: "Collection",
      title: "Information we collect",
      body: (
        <>
          When you create an account, we collect information you provide
          directly — name, email, and profile fields. We also store content you
          create: posts, comments, likes, bookmarks, and CSI verification
          claims when you join Tech Weekly.
        </>
      ),
    },
    {
      id: "02",
      tag: "Use",
      title: "How we use your information",
      body: (
        <>
          We use this data to provide, maintain, and improve The Fourth Clover:
          signing you in, personalizing feeds, enabling follows and comments,
          and sending notifications about activity on your work. We do not use
          your writing to train third-party AI models.
        </>
      ),
    },
    {
      id: "03",
      tag: "Security",
      title: "How we keep it safe",
      body: (
        <>
          Access is gated by authentication and row-level security. Data lives
          on Supabase (Postgres, Auth, and Storage) with industry-standard
          encryption and access controls. Only authorized operators can reach
          administrative surfaces.
        </>
      ),
    },
    {
      id: "04",
      tag: "Processors",
      title: "Services that help us run",
      body: (
        <>
          We rely on third parties for authentication (Google via Supabase),
          hosting, and delivery. Each has its own privacy policy. We do not sell
          personal information. Review vendor policies when you connect an
          account.
        </>
      ),
    },
    {
      id: "05",
      tag: "Rights",
      title: "What you can ask for",
      body: (
        <>
          You may access, update, or delete your personal information. Manage
          most of it in{" "}
          <Link href="/settings" className={linkClass}>
            Settings
          </Link>
          . For account deletion or a data request, email us — we will remove
          personal data from our systems subject to legal retention needs.
        </>
      ),
    },
    {
      id: "06",
      tag: "Contact",
      title: "Questions about this policy",
      body: (
        <>
          Write to{" "}
          <a href="mailto:legal@thefourthclover.com" className={linkClass}>
            legal@thefourthclover.com
          </a>{" "}
          or open an issue on{" "}
          <a
            href="https://github.com/aryan-dani/The_Fourth_Clover"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            GitHub
          </a>
          . We will respond as promptly as we can.
        </>
      ),
    },
  ];
}

export default function PrivacyPage() {
  const list = clauses();
  const mailto = `mailto:legal@thefourthclover.com?subject=${encodeURIComponent(
    "Privacy inquiry — The Fourth Clover",
  )}`;

  return (
    <main className="legal wrap pb-24 pt-10 md:pt-14">
      <Reveal delay={0.05} y={12}>
        <Link href="/" className="type-label link-u">
          ← Back home
        </Link>
      </Reveal>

      <div className="legal__hero mt-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        <div className="order-2 min-w-0 lg:order-1">
          <h1 className="type-display text-[clamp(2.5rem,8vw,4.5rem)]">
            <RevealText as="span" by="words" className="block">
              Privacy
            </RevealText>
            <span className="mt-2 flex flex-wrap items-baseline gap-3">
              <ScriptWipe
                as="span"
                delay={0.35}
                className="type-display-italic text-[0.72em] text-[var(--brand-color)]"
              >
                policy
              </ScriptWipe>
            </span>
          </h1>
          <Reveal delay={0.15} className="mt-8 max-w-2xl">
            <p className="type-body text-lg">
              How The Fourth Clover handles account data, publishing activity,
              and the processors that keep the site running.
            </p>
          </Reveal>
        </div>

        <div className="order-1 flex justify-start lg:order-2 lg:min-h-[14rem] lg:items-center lg:justify-center xl:min-h-[18rem]">
          <HeroClover className="h-24 w-24 sm:h-28 sm:w-28 lg:h-[min(40vw,18rem)] lg:w-[min(40vw,18rem)] xl:h-[20rem] xl:w-[20rem]" />
        </div>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <Reveal className="space-y-4">
          <p className="type-label text-muted-foreground">At a glance</p>
          <ul className="space-y-3">
            {AT_A_GLANCE.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden
                  className="type-label mt-0.5 text-[var(--brand-color)]"
                >
                  ✓
                </span>
                <span className="type-body text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="space-y-4">
          <p className="type-label text-muted-foreground">Your controls</p>
          <ul className="space-y-3">
            {YOUR_CONTROLS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden
                  className="type-label mt-0.5 text-[var(--brand-color)]"
                >
                  →
                </span>
                <span className="type-body text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <ol className="mt-16 list-none space-y-0 p-0">
        {list.map((clause) => (
          <li key={clause.id} className="py-10">
            <DrawLine />
            <div className="mt-8 grid gap-6 md:grid-cols-[5rem_1fr]">
              <Reveal
                className="type-display text-3xl text-muted-foreground"
                y={16}
              >
                {clause.id}
              </Reveal>
              <div>
                <Reveal y={16}>
                  <p className="type-label text-muted-foreground">{clause.tag}</p>
                  <h2 className="type-display mt-2 text-[clamp(1.35rem,3vw,2rem)]">
                    {clause.title}
                  </h2>
                </Reveal>
                <Reveal y={16} delay={0.08}>
                  <p className="type-body mt-4 max-w-2xl">{clause.body}</p>
                </Reveal>
              </div>
            </div>
          </li>
        ))}
        <li aria-hidden>
          <DrawLine />
        </li>
      </ol>

      <Reveal
        y={20}
        className="mt-16 flex flex-col gap-6 border border-[var(--fg-line)] p-8 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 className="type-display text-[clamp(1.4rem,3vw,2rem)]">
            Privacy desk
          </h2>
          <p className="type-body mt-2 max-w-md">
            Data requests and deletion go through the same legal inbox as
            licensing.
          </p>
        </div>
        <a href={mailto} className="btn-editorial shrink-0">
          Contact privacy
        </a>
      </Reveal>

      <p className="type-label mt-12 flex flex-col gap-2 text-muted-foreground sm:flex-row sm:justify-between">
        <span>Last updated: February 2026</span>
        <span>
          © {new Date().getFullYear()} The Fourth Clover ·{" "}
          <Link href="/copyright" className="link-u">
            Copyright &amp; IP
          </Link>
        </span>
      </p>
    </main>
  );
}
