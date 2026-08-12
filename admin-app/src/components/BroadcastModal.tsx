"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";

export default function BroadcastModal({
  open,
  sending,
  onCancel,
  onSend,
}: {
  open: boolean;
  sending: boolean;
  onCancel: () => void;
  onSend: (body: string) => void;
}) {
  const [body, setBody] = useState("");

  useEffect(() => {
    if (open) setBody("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-[fadein_0.2s_ease]"
      onClick={onCancel}
    >
      <div
        className="bg-paper-raised rounded-xl px-7 py-7 w-full max-w-sm animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold mb-2">Broadcast to all workers</h3>
        <p className="text-[13.5px] text-ink/65 leading-relaxed mb-5">
          This sends one message straight to every active worker's thread at once.
        </p>

        <TextAreaField
          label="Message"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="e.g. Reminder: submit your timesheets by Friday."
        />

        <div className="flex gap-2.5 mt-5">
          <Button variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button fullWidth disabled={sending || !body.trim()} onClick={() => onSend(body.trim())}>
            {sending ? "Sending..." : "Send to all"}
          </Button>
        </div>
      </div>
    </div>
  );
}
