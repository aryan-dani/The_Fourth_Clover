"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  DrawLine,
  Reveal,
  RevealText,
  ScriptWipe,
} from "@/components/motion/Reveal";

const PERMITTED = [
  "Sharing direct links to published Journal pieces or Tech Weekly dispatches",
  "Short quotations for commentary, criticism, news, or classroom use with clear credit",
  "Internal review by CSI MIT-WPU members evaluating submissions",
];

const PROHIBITED = [
  "Republishing full articles or dispatches without the author’s written consent",
  "Scraping articles, code samples, or the clover mark into AI / ML training sets",
  "Cloning or redistributing this publication’s design system, motion, or mark",
];

type Clause = { id: string; tag: string; title: string; body: ReactNode };

const linkClass = "link-u !bg-[length:100%_1px]";

function clauses(): Clause[] {
  return [
    {
      id: "01",
      tag: "Authorship",
      title: "Pieces stay with their authors",
      body: (
        <>
          Every Journal piece and Tech Weekly dispatch remains the intellectual
          property of its author. By publishing on The Fourth Clover, authors
          grant the publication a non-exclusive, worldwide license to host,
          display, and distribute that work for as long as it remains on the
          site.
        </>
      ),
    },
    {
      id: "02",
      tag: "Design & mark",
      title: "The clover, the system, and the motion",
      body: (
        <>
          The four-leaf clover mark, editorial design system, typography
          choreography, and motion language were designed and engineered by{" "}
          <a
            href="https://www.aryandani.com"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Aryan Dani (www.aryandani.com)
          </a>
          . Commercial reproduction or unauthorized copying of the mark or site
          architecture is prohibited.
        </>
      ),
    },
    {
      id: "03",
      tag: "AI & scraping",
      title: "No training on our pages",
      body: (
        <>
          Articles, code excerpts, the clover mark, and site chrome may not be
          harvested, scraped, or used to train, fine-tune, or evaluate machine
          learning or generative AI systems without express written consent from
          the rights holders.
        </>
      ),
    },
    {
      id: "04",
      tag: "Typefaces",
      title: "Fonts under the SIL Open Font License",
      body: (
        <>
          Noto Serif Display, Monsieur La Doulaise, and Jost are used under the
          SIL Open Font License. JetBrains Mono is used under its respective open
          license. Redistribution of font files follows those licenses.
        </>
      ),
    },
    {
      id: "05",
      tag: "Reuse desk",
      title: "How to ask for permission",
      body: (
        <>
          For republication beyond fair use, mark licensing, or other clearances,
          email{" "}
          <a href="mailto:legal@thefourthclover.com" className={linkClass}>
            legal@thefourthclover.com
          </a>{" "}
          with the work URL, intended use, and your contact details. Governed by
          the Indian Copyright Act, 1957 and the Berne Convention.
        </>
      ),
    },
  ];
}

export default function CopyrightPage() {
  const list = clauses();
  const mailto = `mailto:legal@thefourthclover.com?subject=${encodeURIComponent(
    "Reuse & licensing inquiry — The Fourth Clover",
  )}`;

  return (
    <main className="legal wrap pb-24 pt-10 md:pt-14">
      <Reveal delay={0.05} y={12}>
        <Link href="/" className="type-label link-u">
          ← Back home
        </Link>
      </Reveal>

      <div className="legal__hero mt-10">
        <h1 className="type-display text-[clamp(2.5rem,8vw,4.5rem)]">
          <RevealText as="span" by="words" className="block">
            Copyright
          </RevealText>
          <span className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="type-display text-[0.55em] opacity-50">&amp;</span>
            <ScriptWipe
              as="span"
              delay={0.35}
              className="type-script text-[0.55em] normal-case tracking-normal text-[var(--brand-color)]"
            >
              IP
            </ScriptWipe>
          </span>
        </h1>
        <Reveal delay={0.15} className="mt-8 max-w-2xl">
          <p className="type-body text-lg">
            A plain-language charter for authors, readers, and anyone who wants
            to reuse work from The Fourth Clover.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <Reveal className="space-y-4">
          <p className="type-label text-muted-foreground">
            Permitted without a license
          </p>
          <ul className="space-y-3">
            {PERMITTED.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden className="type-label mt-0.5 text-[var(--brand-color)]">
                  ✓
                </span>
                <span className="type-body text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="space-y-4">
          <p className="type-label text-muted-foreground">
            Restricted without written consent
          </p>
          <ul className="space-y-3">
            {PROHIBITED.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden className="type-label mt-0.5">
                  ✕
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
              <Reveal className="type-display text-3xl text-muted-foreground" y={16}>
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

      <Reveal y={20} className="mt-16 flex flex-col gap-6 border border-[var(--fg-line)] p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="type-display text-[clamp(1.4rem,3vw,2rem)]">
            Need reuse rights?
          </h2>
          <p className="type-body mt-2 max-w-md">
            Licensing and permissions are handled by email.
          </p>
        </div>
        <a href={mailto} className="btn-editorial shrink-0">
          Request permission
        </a>
      </Reveal>

      <p className="type-label mt-12 flex flex-col gap-2 text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} The Fourth Clover. All rights reserved.</span>
        <span>
          Designed &amp; developed by{" "}
          <a
            href="https://www.aryandani.com"
            target="_blank"
            rel="noopener noreferrer"
            className="link-u"
          >
            Aryan Dani
          </a>
        </span>
      </p>
    </main>
  );
}
