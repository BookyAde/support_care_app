"use client";

import { MapPin, Phone, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import type { Shift, ShiftClientDetail } from "@/lib/types";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

const SECTIONS: { key: keyof ShiftClientDetail; label: string }[] = [
  { key: "care_plan", label: "Care plan" },
  { key: "special_instructions", label: "Special instructions" },
  { key: "risk_assessment", label: "Risk assessment" },
  { key: "medical_notes", label: "Medical notes" },
];

export default function ShiftDetailModal({ shift, onClose }: { shift: Shift | null; onClose: () => void }) {
  if (!shift) return null;
  const client = shift.client;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-end sm:items-center justify-center z-50 sm:p-4 animate-[fadein_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] flex flex-col animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 pb-4 shrink-0 border-b border-black/10">
          <div>
            <p className="font-display text-xl font-bold mb-0.5">{client.full_name}</p>
            <p className="text-[13px] text-ink/60">
              {shift.scheduled_date} &middot;{" "}
              <span className="font-mono">{shift.scheduled_start} - {shift.scheduled_end}</span>
            </p>
            <p className="text-[11.5px] text-ink/45 font-mono mt-0.5">
              Visit ID: {shift.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-1 text-ink/50 hover:text-ink rounded-md hover:bg-black/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <div className="flex items-start gap-2 text-[13.5px] text-ink/75 mb-1.5">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-teal-deep" />
              <span>{client.address}</span>
            </div>
            <a
              href={mapsUrl(client.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[12.5px] font-bold text-teal-deep ml-6"
            >
              Get directions &rarr;
            </a>
          </div>

          <div className="flex items-center gap-2 text-[13.5px] text-ink/75">
            <Phone className="w-4 h-4 shrink-0 text-teal-deep" />
            <span className="font-mono">{client.contact_number}</span>
          </div>

          {SECTIONS.map(({ key, label }) => {
            const value = client[key];
            if (!value) return null;
            return (
              <div key={key}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45 mb-1">{label}</p>
                <p className="text-[13.5px] text-ink/75 leading-relaxed">{value}</p>
              </div>
            );
          })}
        </div>

        <div className="p-6 pt-4 border-t border-black/10 shrink-0">
          <button onClick={onClose} className={`${buttonClasses({ variant: "outline", fullWidth: true })} min-h-[44px]`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
