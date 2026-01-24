import { Logo } from "@/components/header/Logo";
import Link from "next/link";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Logo className="h-6 w-6" />
        </div>
        <span className="text-2xl tracking-tight">
          MOTO<span className="text-primary">STIX</span>
        </span>
      </Link>

      <div className="flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-lg max-w-sm">{subtitle}</p>}
      </div>
    </div>
  );
}
