"use client";

import { User, Phone, Info } from "lucide-react";

type WorkerProfileViewProps = {
  open: boolean;
  workerName: string;
  bio?: string | null;
  phoneNumber?: string | null;
  onClose: () => void;
};

/**
 * GET /shifts/my-visits only returns worker_name today - bio/phone_number are
 * not (yet) part of ShiftResponse for a client. bio/phoneNumber are typed as
 * optional so this component already works unchanged if that gap is closed
 * later; until then they render as "not added" below.
 */
export default function WorkerProfileView({ open, workerName, bio, phoneNumber, onClose }: WorkerProfileViewProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-end sm:items-center justify-center z-50 animate-[fadein_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-t-xl sm:rounded-xl px-6 py-6 w-full sm:w-[380px] animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-teal/10 text-teal-deep flex items-center justify-center mb-4">
          <User className="w-6 h-6" />
        </div>

        <h3 className="font-display text-lg font-bold mb-1">{workerName}</h3>
        <p className="text-[13px] text-ink/60 leading-relaxed mb-4">
          {bio && bio.trim() ? bio : "No bio added yet."}
        </p>

        {phoneNumber && (
          <div className="flex items-center gap-2 text-[13px] text-ink/70 mb-4">
            <Phone className="w-4 h-4 text-ink/40" />
            <span className="font-mono">{phoneNumber}</span>
          </div>
        )}

        <div className="flex items-start gap-2.5 bg-ochre/10 text-ochre-deep text-[12.5px] leading-relaxed rounded-md px-3.5 py-3 mb-5">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            You can&apos;t message {workerName} directly. Use the office chat for anything you need.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full min-h-[44px] text-[13px] font-bold text-ink/60 hover:text-ink transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
