"use client";

import { useState, useEffect } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { fieldInputClasses } from "@/components/ui/Field";

type Tone = "danger" | "success" | "warn" | "neutral";

type ConfirmModalProps = {
  open: boolean;
  emoji: string;
  tone: Tone;
  title: string;
  body: string;
  confirmLabel: string;
  confirmTone: "danger" | "success";
  requireReason?: boolean;
  reasonLabel?: string;
  onCancel: () => void;
  onConfirm: (reason?: string) => void;
};

const RING_STYLES: Record<Tone, string> = {
  danger: "bg-brick/15",
  success: "bg-moss/15",
  warn: "bg-ochre/15",
  neutral: "bg-teal/15",
};


export default function ConfirmModal({
  open,
  emoji,
  tone,
  title,
  body,
  confirmLabel,
  confirmTone,
  requireReason,
  reasonLabel = "Reason",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 animate-[fadein_0.2s_ease]"
      onClick={onCancel}
    >
      <div
        className="bg-paper-raised rounded-xl px-7 py-7 w-[340px] text-center animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${RING_STYLES[tone]}`}>
          {emoji}
        </div>

        <h3 className="font-display text-lg font-bold mb-2">{title}</h3>
        <p className="text-[13.5px] text-ink/65 leading-relaxed mb-5">{body}</p>

        {requireReason && (
          <div className="text-left mb-5">
            <label className="block text-[12.5px] font-bold mb-1.5">{reasonLabel}</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={fieldInputClasses}
              placeholder="Enter a reason"
            />
          </div>
        )}

        <div className="flex gap-2.5 justify-center">
          <button onClick={onCancel} className={buttonClasses({ variant: "outline" })}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(requireReason ? reason : undefined)}
            disabled={requireReason && reason.trim().length === 0}
            className={buttonClasses({
              variant: "primary",
              className: confirmTone === "danger" ? "bg-brick! hover:bg-brick-deep!" : "bg-moss! hover:bg-moss-deep!",
            })}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
