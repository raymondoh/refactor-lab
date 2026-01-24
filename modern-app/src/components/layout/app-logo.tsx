import Image from "next/image";
import Link from "next/link";

export function AppLogo() {
  return (
    <Link href="/" className="mr-6 flex items-center space-x-2">
      {/* Light mode */}
      <Image
        src="/images/branding/logo-light.svg"
        alt="Plumbers Portal Logo"
        width={28}
        height={28}
        className="h-6 w-6 dark:hidden  -mt-1"
        priority
      />
      {/* Dark mode */}
      <Image
        src="/images/branding/logo-dark.svg"
        alt="Plumbers Portal Logo"
        width={28}
        height={28}
        className="hidden h-6 w-6  dark:block"
        priority
      />

      <span className="font-bold inline-block">Plumbers Portal</span>
    </Link>
  );
}
