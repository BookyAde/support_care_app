"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import SignInDropdown from "@/components/SignInDropdown";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/request-care", label: "Request Care" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function PublicNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <img src="/new_logo_lockup.png" alt="Bountiful Support Plus" className="h-8" />
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13.5px] font-bold transition ${
                  isActive ? "text-teal-deep" : "text-ink/60 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <SignInDropdown align="right" triggerLabel="Sign in" triggerClassName={buttonClasses({ size: "sm" })} />
      </div>

      <nav className="sm:hidden flex items-center gap-5 px-6 pb-3 overflow-x-auto">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-bold whitespace-nowrap transition ${
                isActive ? "text-teal-deep" : "text-ink/60 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
