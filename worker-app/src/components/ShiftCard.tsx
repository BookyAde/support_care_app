"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Badge, { BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import type { Shift } from "@/lib/types";

const STATUS_TONE: Record<Shift["status"], BadgeTone> = {
  scheduled: "teal",
  in_progress: "ochre",
  completed: "moss",
  cancelled: "brick",
};

// Shared override so outline/ghost buttons stay legible on the dark "Next
// visit" gradient card, instead of their default teal-on-light styling.
const HIGHLIGHT_OUTLINE = "border-paper-raised! text-paper-raised! hover:bg-white/10!";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ShiftCard({
  shift,
  hasVisitId,
  busy,
  respondBusy,
  onStart,
  onSaveNote,
  onEndClick,
  onOpenDetail,
  onAccept,
  onDeclineClick,
  highlight = false,
  nested = false,
}: {
  shift: Shift;
  hasVisitId: boolean;
  busy: boolean;
  respondBusy: boolean;
  onStart: (shift: Shift) => void;
  onSaveNote: (shift: Shift, noteText: string) => Promise<void>;
  onEndClick: (shift: Shift) => void;
  onOpenDetail: (shift: Shift) => void;
  onAccept: (shift: Shift) => void;
  onDeclineClick: (shift: Shift) => void;
  /** Promotes this into the gradient "Next visit" hero treatment for the one
   * soonest scheduled/in_progress shift. Every handler and piece of state
   * below is identical either way - only the container/text/button styling
   * branches on this flag. */
  highlight?: boolean;
  /** True when a parent InteractiveCard already supplies the card's
   * background/border/hover-glow shell, so this renders as bare padded
   * content instead of drawing its own box (avoids a card-in-a-card look). */
  nested?: boolean;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function handleSaveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await onSaveNote(shift, noteText.trim());
      setNoteText("");
      setNoteOpen(false);
    } finally {
      setSavingNote(false);
    }
  }

  const containerClass = highlight
    ? "relative bg-gradient-to-br from-teal-deep to-teal text-paper-raised rounded-2xl p-6 shadow-md cursor-pointer"
    : nested
      ? "p-5 cursor-pointer"
      : "bg-paper-raised border border-black/10 rounded-2xl p-5 transition hover:border-teal/40 cursor-pointer";

  return (
    <div className={containerClass} onClick={() => onOpenDetail(shift)}>
      {highlight && (
        <p className="text-[11px] font-bold uppercase tracking-wide text-paper-raised/70 mb-3">Next visit</p>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 ${
              highlight ? "bg-white/15 text-paper-raised" : "bg-teal/12 text-teal-deep"
            }`}
          >
            {initials(shift.client_name)}
          </div>
          <div>
            <p className={`font-display text-base font-bold mb-0.5 ${highlight ? "text-paper-raised" : ""}`}>
              {shift.client_name}
            </p>
            <p className={`text-[13px] ${highlight ? "text-paper-raised/75" : "text-ink/60"}`}>{shift.scheduled_date}</p>
            {highlight && <p className="text-[13px] text-paper-raised/75 mt-1">{shift.client.address}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {shift.is_overdue && (
            <Badge tone="brick" variant="solid" uppercase>
              Overdue
            </Badge>
          )}
          <Badge tone={STATUS_TONE[shift.status]} variant="solid" uppercase>
            {shift.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <p className={`text-[13px] font-mono mb-4 ${highlight ? "text-paper-raised/75" : "text-ink/60"}`}>
        {shift.scheduled_start} - {shift.scheduled_end}
      </p>

      <div onClick={(e) => e.stopPropagation()}>
        {shift.status === "scheduled" && shift.worker_response === "pending" && (
          <div className="flex gap-2">
            <Button
              variant="outline-success"
              fullWidth
              className={`min-h-[44px] ${highlight ? HIGHLIGHT_OUTLINE : ""}`}
              disabled={respondBusy}
              onClick={() => onAccept(shift)}
            >
              Accept
            </Button>
            <Button
              variant="outline-danger"
              fullWidth
              className={`min-h-[44px] ${highlight ? HIGHLIGHT_OUTLINE : ""}`}
              disabled={respondBusy}
              onClick={() => onDeclineClick(shift)}
            >
              Decline
            </Button>
          </div>
        )}

        {shift.status === "scheduled" && shift.worker_response === "accepted" && (
          <Button
            fullWidth
            className={`min-h-[44px] ${highlight ? "bg-paper-raised! text-teal-deep! hover:bg-white!" : ""}`}
            disabled={busy}
            onClick={() => onStart(shift)}
          >
            {busy ? "Starting..." : "Start visit"}
          </Button>
        )}

        {shift.status === "scheduled" && shift.worker_response === "declined" && (
          <p className="text-[12.5px] text-brick-deep bg-brick/10 rounded-md px-3 py-2.5 leading-relaxed">
            You declined this shift{shift.decline_reason ? `: "${shift.decline_reason}"` : "."} Contact
            your admin if this was a mistake.
          </p>
        )}

        {shift.status === "in_progress" && !hasVisitId && (
          <p
            className={`text-[12.5px] rounded-md px-3 py-2.5 leading-relaxed ${
              highlight ? "text-paper-raised bg-white/10" : "text-ochre-deep bg-ochre/10"
            }`}
          >
            This visit was started in an earlier session. Adding notes or ending it isn&apos;t
            available after a page refresh yet, contact your admin if you need help.
          </p>
        )}

        {shift.status === "in_progress" && hasVisitId && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                className={`min-h-[44px] ${highlight ? HIGHLIGHT_OUTLINE : ""}`}
                onClick={() => setNoteOpen((v) => !v)}
              >
                Add note
              </Button>
              <Button
                variant="outline-danger"
                fullWidth
                className={`min-h-[44px] ${highlight ? HIGHLIGHT_OUTLINE : ""}`}
                disabled={busy}
                onClick={() => onEndClick(shift)}
              >
                End visit
              </Button>
            </div>

            {noteOpen && (
              // Reset to normal ink text regardless of the hero card's light
              // text color, so the note label/input stay legible either way.
              <div className="pt-2 text-ink">
                <TextAreaField
                  label="Note"
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="What's happening during this visit?"
                />
                <Button
                  className="mt-3 min-h-[44px]"
                  fullWidth
                  disabled={savingNote || !noteText.trim()}
                  onClick={handleSaveNote}
                >
                  {savingNote ? "Saving..." : "Save note"}
                </Button>
              </div>
            )}
          </div>
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
