import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
      <p className="text-muted-foreground mb-6">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Return to home
      </Link>
    </div>
  );
}
