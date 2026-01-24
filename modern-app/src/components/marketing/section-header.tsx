import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({ title, subtitle, align = "center", className }: SectionHeaderProps) {
  const alignmentClass = align === "left" ? "text-left" : "text-center";

  return (
    <div className={cn("mb-12 lg:mb-16", alignmentClass, className)}>
      <h2 className={cn("text-3xl font-bold tracking-tight text-foreground", subtitle && "mb-4")}>{title}</h2>
      {subtitle ? <p className="text-lg text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
