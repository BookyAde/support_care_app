"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SignInDropdown from "@/components/SignInDropdown";
import { buttonClasses } from "@/components/ui/Button";

const HERO_PHOTOS = ["/photos/care2_wide.jpg", "/photos/care4_wide.jpg", "/photos/care5_wide.jpg"];
const CYCLE_MS = 6000;

/**
 * Full-bleed photo hero: three photos cross-fade on a timer, each slowly
 * zooming the whole time (not just while visible) so the background never
 * looks static. Kept as its own client component so page.tsx (a Server
 * Component) stays free of the interval/state logic - this is the only
 * piece of the hero that needs it.
 */
export default function HeroPhotoBanner() {
  const [active, setActive] = useState(0);

  // Restarts on every change (auto-advance or manual dot click) so a
  // manually-selected photo still gets a full dwell before advancing again.
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((i) => (i + 1) % HERO_PHOTOS.length);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <section className="relative h-[92vh] min-h-[640px] overflow-hidden bg-ink">
      {/* Photo layers - all three animate continuously; only opacity toggles
          on switch, so whichever photo crossfades in is already mid-zoom. */}
      {HERO_PHOTOS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`absolute inset-0 w-full h-full object-cover animate-[heroZoom_26s_ease-in-out_infinite_alternate] transition-opacity duration-1000 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Two-layer tint: bottom-up for text legibility, left-to-right for depth. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(8,10,9,0.88), rgba(8,10,9,0) 65%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to right, rgba(8,10,9,0.55), rgba(8,10,9,0) 60%)" }}
        aria-hidden="true"
      />

      {/* Content, bottom-left */}
      <div className="relative h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-16 sm:pb-20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-teal/20 rounded-full px-4 py-1.5 mb-6 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-bright" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-paper-raised/80">
              Verified home care visits
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05] mb-6 text-paper-raised">
            Care you can <span className="text-teal-bright">prove</span> happened.
          </h1>

          <p className="text-[15px] text-white/70 mb-9 max-w-md leading-relaxed">
            Bountiful Support Plus gives home care agencies one system to schedule visits, verify
            they happened, and produce the records regulators and families ask for.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <SignInDropdown
              triggerLabel="Sign in to your account"
              triggerClassName={buttonClasses({
                className: "bg-ochre! hover:bg-ochre-deep! text-white! py-4! px-7! text-[15px]!",
              })}
            />
            <Link
              href="/how-it-works"
              className={buttonClasses({
                variant: "outline",
                className: "border-white/30! text-white! hover:bg-white/10! py-4! px-7! text-[15px]!",
              })}
            >
              See how it works
            </Link>
          </div>

          <p className="mt-6 text-[13.5px] text-white/60">
            Need care for a loved one?{" "}
            <Link href="/request-care" className="text-teal-bright font-bold hover:underline">
              Request care &rarr;
            </Link>
          </p>
        </div>
      </div>

      {/* Dot navigation - hidden on mobile to avoid crowding the content. */}
      <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-10">
        {HERO_PHOTOS.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show photo ${i + 1} of ${HERO_PHOTOS.length}`}
            className={`w-2 rounded-full transition-all ${
              i === active ? "bg-paper-raised h-6" : "bg-paper-raised/40 h-2 hover:bg-paper-raised/70"
            }`}
          />
        ))}
      </div>

      {/* Scroll cue - hidden on mobile, same reason. */}
      <div className="hidden sm:flex absolute bottom-8 right-6 items-center gap-3 z-10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-paper-raised/60">Scroll</span>
        <div className="relative w-px h-10 bg-paper-raised/25 overflow-hidden">
          <span className="absolute left-1/2 -translate-x-1/2 top-0 w-1.5 h-1.5 rounded-full bg-paper-raised animate-[scrollCue_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  );
}
