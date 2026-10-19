import { SectionLabel } from "@/components/editorial/SectionLabel";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  label?: string;
  labelHref?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  label,
  labelHref,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-hairline pb-8 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-3">
        {label && <SectionLabel href={labelHref}>{label}</SectionLabel>}
        <h1 className="font-display text-display-md text-foreground md:text-display-lg">
          {title}
        </h1>
        {description && (
          <p className="max-w-measure font-serif text-base leading-relaxed text-muted-foreground md:text-lg">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
