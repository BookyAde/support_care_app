"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { XCircle } from "lucide-react";

export default function DeclineShiftModal({
  open,
  submitting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  const canSubmit = reason.trim().length > 0;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-[fadein_0.2s_ease]"
      onClick={onCancel}
    >
      <div
        className="bg-paper-raised rounded-xl px-7 py-7 w-full max-w-sm animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-brick/15 text-brick-deep">
          <XCircle className="w-7 h-7" />
        </div>

        <h3 className="font-display text-lg font-bold mb-2 text-center">Decline this shift?</h3>
        <p className="text-[13.5px] text-ink/65 leading-relaxed mb-5 text-center">
          Let your admin know why, so they can reassign it.
        </p>

        <TextAreaField
          label="Reason"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. I have a scheduling conflict at this time."
        />

        <div className="flex gap-2.5 mt-5">
          <Button variant="outline" fullWidth className="min-h-[44px]" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            fullWidth
            className="min-h-[44px] bg-brick! hover:bg-brick-deep!"
            disabled={!canSubmit || submitting}
            onClick={() => onConfirm(reason.trim())}
          >
            {submitting ? "Declining..." : "Decline"}
          </Button>
        </div>
      </div>
    </div>
  );
}
