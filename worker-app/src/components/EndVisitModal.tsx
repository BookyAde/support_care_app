"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { CheckCircle2 } from "lucide-react";

const MIN_LENGTH = 10;

export default function EndVisitModal({
  open,
  submitting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (summaryNote: string) => void;
}) {
  const [summaryNote, setSummaryNote] = useState("");

  useEffect(() => {
    if (open) setSummaryNote("");
  }, [open]);

  if (!open) return null;

  const tooShort = summaryNote.trim().length < MIN_LENGTH;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-[fadein_0.2s_ease]"
      onClick={onCancel}
    >
      <div
        className="bg-paper-raised rounded-xl px-7 py-7 w-full max-w-sm animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-moss/15 text-moss-deep">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <h3 className="font-display text-lg font-bold mb-2 text-center">End this visit?</h3>
        <p className="text-[13.5px] text-ink/65 leading-relaxed mb-5 text-center">
          Summarize what happened. This note is required before the visit can be marked
          complete and verified.
        </p>

        <TextAreaField
          label="Summary note"
          required
          rows={4}
          value={summaryNote}
          onChange={(e) => setSummaryNote(e.target.value)}
          placeholder="e.g. Assisted with morning routine and medication, client in good spirits."
        />
        <p className={`text-[11.5px] mt-1.5 mb-5 ${tooShort ? "text-brick-deep" : "text-moss-deep"}`}>
          {summaryNote.trim().length}/{MIN_LENGTH} characters minimum
        </p>

        <div className="flex gap-2.5">
          <Button variant="outline" fullWidth className="min-h-[44px]" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            fullWidth
            className="min-h-[44px]"
            disabled={tooShort || submitting}
            onClick={() => onConfirm(summaryNote.trim())}
          >
            {submitting ? "Ending..." : "End visit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
