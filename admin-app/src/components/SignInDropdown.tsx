"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type PanelPosition = { top: number; left?: number; right?: number };

/**
 * A "which portal am I" role picker, shared between PublicNav's small "Sign
 * in" button and the two larger "Sign in to your account" CTAs on the
 * homepage (a Server Component). The trigger button is rendered entirely
 * inside this client component from plain string props (label/className)
 * rather than accepted as a JSX element/render-prop - the homepage passes
 * these in from a Server Component, and only serializable primitives (not
 * functions, and not JSX carrying event handlers) can safely cross that
 * Server->Client boundary.
 *
 * The popover panel itself is rendered via a React Portal into document.body
 * rather than as a normal DOM child of the trigger - some callers (e.g.
 * HeroPhotoBanner) sit inside an overflow-hidden ancestor (required there
 * for the Ken Burns zoom animation), which would otherwise clip the panel
 * along with it. A portaled element has no natural positional relationship
 * to its trigger anymore, so position is computed from the trigger's real
 * getBoundingClientRect() and applied via position:fixed instead of the
 * relative-to-parent CSS this used before.
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
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-close: with the panel portaled to document.body, it's
  // no longer a DOM descendant of the trigger, so "outside" now means
  // outside BOTH the trigger and the portaled panel, checked separately.
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Position the portaled panel from the trigger's real screen coordinates.
  // useLayoutEffect (not useEffect) so this runs before paint - otherwise
  // the panel would flash at its default position for a frame before
  // snapping to the right spot. Recalculated on open, and on resize/scroll
  // while open so it stays glued to the trigger (position:fixed doesn't
  // move with the page the way an in-flow element would).
  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setPosition(
        align === "right"
          ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 8, left: rect.left }
      );
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align]);

  return (
    <div ref={triggerRef} className="inline-block text-left">
      <button className={triggerClassName} onClick={() => setOpen((o) => !o)}>
        {triggerLabel}
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: position.top, left: position.left, right: position.right }}
            className="fixed w-72 bg-paper-raised border border-black/10 rounded-lg shadow-2xl p-2 z-50 animate-[popin_0.2s_cubic-bezier(0.34,1.56,0.64,1)] origin-top"
          >
            <div className="px-3 pt-2.5 pb-2">
              <p className="text-[13px] font-bold text-ink">Sign in as...</p>
              <p className="text-[12px] text-ink/50">Choose your role to continue</p>
            </div>

            {ROLES.map((role) => {
              const Icon = role.icon;
              const rowContent = (
                <>
                  <span
                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${role.iconTone}`}
                  >
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
          </div>,
          document.body
        )}
    </div>
  );
}
