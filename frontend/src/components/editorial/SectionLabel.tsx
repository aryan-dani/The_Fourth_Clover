import Link from "next/link";
import { cn } from "@/lib/utils";

export type SectionLabelProps = {
  children: React.ReactNode;
  href?: string;
  className?: string;
};

export function SectionLabel({ children, href, className }: SectionLabelProps) {
  const classes = cn("meta-label text-brand", className);

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          classes,
          "transition-colors duration-editorial hover:text-foreground",
        )}
      >
        {children}
      </Link>
    );
  }

  return <span className={classes}>{children}</span>;
}
