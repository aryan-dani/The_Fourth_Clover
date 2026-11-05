import { cn } from "@/lib/utils";

const LEAVES = [
  // right
  "M32 34c0-6 4.5-11 10-11s10 5 10 11-4.5 10-10 10c-2.2 0-4.2-.7-5.9-1.9",
  // left
  "M32 34c0-6-4.5-11-10-11S12 28 12 34s4.5 10 10 10c2.2 0 4.2-.7 5.9-1.9",
  // top
  "M32 34c-6 0-11-4.5-11-10S26 14 32 14s11 4.5 11 10-5 10-11 10",
  // bottom
  "M32 34c6 0 11 4.5 11 10S38 54 32 54 21 49.5 21 44s5-10 11-10",
] as const;

const STEM = "M32 34v18M30 52h4";

type HeroCloverProps = {
  className?: string;
};

/** Large stroked clover for the home hero. Painted with the HTML, no intro wait. */
export function HeroClover({ className }: HeroCloverProps) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none text-[var(--brand-color)]",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="h-full w-full"
        overflow="visible"
      >
        {LEAVES.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        <path
          d={STEM}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
