"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";

export type RequestCareFormData = {
  care_type_summary: string | null;
  additional_notes: string | null;
  frequency: string | null;
  is_urgent: boolean;
};

export default function RequestCareModal({
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (data: RequestCareFormData) => void;
}) {
  const [careTypeSummary, setCareTypeSummary] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [frequency, setFrequency] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      care_type_summary: careTypeSummary.trim() || null,
      additional_notes: additionalNotes.trim() || null,
      frequency: frequency.trim() || null,
      is_urgent: isUrgent,
    });
  }

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-end sm:items-center justify-center z-50 animate-[fadein_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-t-xl sm:rounded-xl px-6 py-6 w-full sm:w-[420px] max-h-[85vh] overflow-y-auto animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold mb-1">Request more care</h3>
            <p className="text-[13px] text-ink/60">Tell the office what you need, they&apos;ll be in touch.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 flex items-center justify-center text-ink/50 hover:text-ink rounded-md hover:bg-black/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextAreaField
            label="What do you need?"
            rows={3}
            value={careTypeSummary}
            onChange={(e) => setCareTypeSummary(e.target.value)}
            placeholder="e.g. Additional help with meals"
          />
          <TextField
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="e.g. Twice a week"
            className="min-h-[44px]"
          />
          <TextAreaField
            label="Additional notes"
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Anything else the office should know"
          />
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-5 h-5 accent-teal shrink-0"
            />
            <span className="text-sm font-bold">This is urgent</span>
          </label>

          <Button type="submit" disabled={submitting} fullWidth className="min-h-[44px]">
            {submitting ? "Sending..." : "Send request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
