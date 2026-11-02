import { SectionLabel } from "@/components/editorial";

const TIMELINE = [
  {
    when: "Friday 09:00 IST",
    what: "Submissions open for the week",
  },
  {
    when: "Wednesday 09:00 IST",
    what: "Default cutoff (admins can change it)",
  },
  {
    when: "After cutoff",
    what: "Technical Heads pick one dispatch for CSI LinkedIn",
  },
  {
    when: "All week",
    what: "Reading, comments, and reactions stay open",
  },
] as const;

const POINTS = [
  { pts: "25", label: "LinkedIn selection" },
  { pts: "10", label: "Each submission" },
  { pts: "2", label: "Each reaction you receive" },
  { pts: "5", label: "Each week you submitted" },
] as const;

const RUBRIC = [
  "One clear technical idea",
  "Understandable to the whole chapter",
  "Backed by a concrete example (code, diagram, or walkthrough)",
  "Short enough to read as a LinkedIn post (aim 150–300 words; hard cap 2,000)",
] as const;

export function TechWeeklyGuide({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "space-y-6 border border-[var(--fg-line)] p-5"
          : "space-y-8"
      }
    >
      <div className="space-y-2">
        <SectionLabel>What is CSI Tech Weekly?</SectionLabel>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A weekly engineering dispatch from the whole CSI MIT-WPU chapter — not
          only the Tech department. Verified members write short technical
          pieces. Technical Heads pick one each week for the official CSI
          LinkedIn post.
        </p>
      </div>

      <div className="space-y-3">
        <SectionLabel>Timeline</SectionLabel>
        <ol className="divide-y divide-[var(--fg-line)] border border-[var(--fg-line)]">
          {TIMELINE.map((row) => (
            <li
              key={row.when}
              className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground">
                {row.when}
              </span>
              <span className="text-sm text-muted-foreground sm:text-right">
                {row.what}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3">
        <SectionLabel>Points</SectionLabel>
        <ul className="grid gap-2 sm:grid-cols-2">
          {POINTS.map((row) => (
            <li
              key={row.label}
              className="flex items-baseline justify-between gap-3 border border-[var(--fg-line)] px-3 py-2"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="font-mono text-sm font-medium tabular-nums text-foreground">
                {row.pts}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <SectionLabel>Selection rubric</SectionLabel>
        <ol className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {RUBRIC.map((line, i) => (
            <li key={line} className="flex gap-2">
              <span className="font-mono text-[11px] text-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
