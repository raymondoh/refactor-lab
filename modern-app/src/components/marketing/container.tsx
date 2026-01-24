// components/marketing/container.tsx
import { ReactNode } from "react";

type Props = { className?: string; children: ReactNode };

export function Container({ className = "", children }: Props) {
  return <div className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</div>;
}
