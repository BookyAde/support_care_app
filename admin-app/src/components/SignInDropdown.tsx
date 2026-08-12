"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Briefcase, HeartHandshake, User, ChevronRight } from "lucide-react";

const ROLES = [
  {
    key: "admin",
    label: "Admin",
    description: "Manage clients, workers, and shifts",
    icon: Briefcase,
    iconTone: "bg-ink/10 text-ink",
    // Internal - same app/origin, so this stays a normal Next.js route.
    href: "/login",
    external: false,
  },
  {
    key: "worker",
    label: "Support Worker",
    description: "View and manage your visits",
    icon: HeartHandshake,
    iconTone: "bg-teal/12 text-teal-deep",
    // A different app entirely (different port locally, different subdomain
    // in production) - NEXT_PUBLIC_WORKER_APP_URL must be set per-environment,
    // never hardcoded here. See admin-app/.env.local.
    href: `${process.env.NEXT_PUBLIC_WORKER_APP_URL ?? ""}/login`,
    external: true,
  },
  {
    key: "client",
    label: "Client",
    description: "See your care visits and team",
    icon: User,
    iconTone: "bg-ochre/12 text-ochre-deep",
    href: `${process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? ""}/login`,
    external: true,
  },
] as const;

const rowClassName = "flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-black/5 transition";

/**
 * A "which portal am I" role picker, shared between PublicNav's small "Sign
 * in" button and the two larger "Sign in to your account" CTAs on the
 * homepage (a Server Component). The trigger button is rendered entirely
 * inside this client component from plain string props (label/className)
 * rather than accepted as a JSX element/render-prop - the homepage passes
 * these in from a Server Component, and only serializable primitives (not
 * functions, and not JSX carrying event handlers) can safely cross that
 * Server->Client boundary.
 */
export default function SignInDropdown({
  triggerLabel,
  triggerClassName,
  align = "left",
}: {
  triggerLabel: string;
  triggerClassName: string;
  /** Which edge of the trigger the panel hangs from - "right" keeps it from
   * overflowing off-screen when the trigger sits near the right edge of its
   * container (e.g. the nav bar). */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button className={triggerClassName} onClick={() => setOpen((o) => !o)}>
        {triggerLabel}
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 w-72 bg-paper-raised border border-black/10 rounded-lg shadow-2xl p-2 z-50 animate-[popin_0.2s_cubic-bezier(0.34,1.56,0.64,1)] origin-top ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="px-3 pt-2.5 pb-2">
            <p className="text-[13px] font-bold text-ink">Sign in as...</p>
            <p className="text-[12px] text-ink/50">Choose your role to continue</p>
          </div>

          {ROLES.map((role) => {
            const Icon = role.icon;
            const rowContent = (
              <>
                <span className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${role.iconTone}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-bold text-ink">{role.label}</span>
                  <span className="block text-[12px] text-ink/55">{role.description}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-ink/30 shrink-0" />
              </>
            );

            return role.external ? (
              <a key={role.key} href={role.href} className={rowClassName} onClick={() => setOpen(false)}>
                {rowContent}
              </a>
            ) : (
              <Link key={role.key} href={role.href} className={rowClassName} onClick={() => setOpen(false)}>
                {rowContent}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
