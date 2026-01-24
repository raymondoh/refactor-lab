// src/components/layout/dashboard-footer.tsx (New Minimal Component)
import Link from "next/link";

export function DashboardFooter() {
  return (
    <footer className="w-full border-t bg-background p-4 text-center text-sm text-muted-foreground">
      <p>
        © {new Date().getFullYear()} Plumbers Portal
        <span className="mx-2">|</span>
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
        <span className="mx-2">|</span>
        <Link href="/terms-of-service" className="hover:underline">
          Terms
        </Link>
      </p>
    </footer>
  );
}
