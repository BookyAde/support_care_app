"use client";

import { ChevronRight } from "lucide-react";
import Badge, { BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StarRating from "@/components/StarRating";
import type { Shift } from "@/lib/types";

const STATUS_TONE: Record<Shift["status"], BadgeTone> = {
  scheduled: "teal",
  in_progress: "ochre",
  completed: "moss",
  cancelled: "brick",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function VisitCard({
  shift,
  highlight = false,
  nested = false,
  rated,
  ratingBusy,
  onRate,
  onOpenProfile,
}: {
  shift: Shift;
  /** Promotes this into the dark ink-gradient "Today" hero treatment. Every
   * handler/piece of state stays the same either way - only styling branches. */
  highlight?: boolean;
  /** True when a parent InteractiveCard already supplies the card's
   * background/border/hover-glow shell, so this renders as bare padded
   * content instead of drawing its own box (avoids a card-in-a-card look). */
  nested?: boolean;
  rated: boolean;
  ratingBusy: boolean;
  onRate: (shift: Shift, stars: number) => void;
  onOpenProfile: (shift: Shift) => void;
}) {
  const containerClass = highlight
    ? "relative bg-ink bg-gradient-to-br from-transparent to-white/10 text-paper-raised rounded-2xl p-6 shadow-md cursor-pointer"
    : nested
      ? "p-5 cursor-pointer"
      : "bg-paper-raised border border-black/10 rounded-2xl p-5 transition hover:border-teal/40 cursor-pointer";

  return (
    <div className={containerClass} onClick={() => onOpenProfile(shift)}>
      {highlight && (
        <p className="text-[11px] font-bold uppercase tracking-wide text-paper-raised/60 mb-3">Visit scheduled</p>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 ${
              highlight ? "bg-white/15 text-paper-raised" : "bg-teal/12 text-teal-deep"
            }`}
          >
            {initials(shift.worker_name)}
          </div>
          <div>
            <p className={`font-display text-base font-bold mb-0.5 ${highlight ? "text-paper-raised" : ""}`}>
              {shift.worker_name}
            </p>
            <p className={`text-[13px] ${highlight ? "text-paper-raised/70" : "text-ink/60"}`}>{shift.scheduled_date}</p>
          </div>
        </div>
        <Badge tone={STATUS_TONE[shift.status]} variant="solid" uppercase>
          {shift.status.replace("_", " ")}
        </Badge>
      </div>

      <p className={`text-[13px] font-mono mb-4 ${highlight ? "text-paper-raised/70" : "text-ink/60"}`}>
        {shift.scheduled_start} - {shift.scheduled_end}
      </p>

      <div onClick={(e) => e.stopPropagation()}>
        {highlight && (
          <Button
            fullWidth
            className="min-h-[44px] bg-white/10! hover:bg-white/20! text-paper-raised!"
            onClick={() => onOpenProfile(shift)}
          >
            View {shift.worker_name}&apos;s profile
          </Button>
        )}

        {shift.status === "completed" && !rated && (
          <div className="flex items-center justify-between bg-black/[0.03] rounded-md px-3 py-2 mt-1">
            <span className="text-[12.5px] font-bold text-ink/60">Rate this visit</span>
            <StarRating busy={ratingBusy} onRate={(stars) => onRate(shift, stars)} />
          </div>
        )}

        {shift.status === "completed" && rated && (
          <p className="text-[12.5px] text-moss-deep bg-moss/10 rounded-md px-3 py-2.5">
            Thanks, you rated this visit.
          </p>
        )}
      </div>

      {/* Pure discoverability hint, not an independent control - it has no
          onClick of its own and simply bubbles up to the card's own tap
          handler above, same as tapping anywhere else on the card. */}
      <div className="flex justify-end items-center gap-0.5 mt-3">
        <span className={`text-[11px] font-bold ${highlight ? "text-paper-raised/50" : "text-ink/40"}`}>
          View details
        </span>
        <ChevronRight className={`w-3.5 h-3.5 ${highlight ? "text-paper-raised/50" : "text-ink/40"}`} />
      </div>
    </div>
  );
}
