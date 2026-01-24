// components/marketing/marketing-header.tsx
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  cta?: { href: string; label: string }[];
  className?: string;
};

export function MarketingHeader({ title, subtitle, cta = [], className = "" }: Props) {
  return (
    <header className={`mb-10 ${className}`}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
      {cta.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {cta.map(b => (
            <Link key={b.href} href={b.href} className="rounded-xl border px-4 py-2 font-medium hover:bg-accent">
              {b.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
