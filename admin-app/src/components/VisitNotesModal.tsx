"use client";

import Badge from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { NotebookText, MapPin } from "lucide-react";

export type VisitNote = {
  id: string;
  note_text: string;
  note_type: "during_visit" | "end_summary";
  created_at: string;
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export default function VisitNotesModal({
  open,
  clientName,
  workerName,
  notes,
  gpsStartLat,
  gpsStartLng,
  gpsEndLat,
  gpsEndLng,
  onClose,
}: {
  open: boolean;
  clientName: string;
  workerName: string;
  notes: VisitNote[] | null;
  gpsStartLat: number | null;
  gpsStartLng: number | null;
  gpsEndLat: number | null;
  gpsEndLng: number | null;
  onClose: () => void;
}) {
  if (!open) return null;

  const sortedNotes = notes
    ? [...notes].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : null;

  const hasStart = gpsStartLat !== null && gpsStartLng !== null;
  const hasEnd = gpsEndLat !== null && gpsEndLng !== null;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-[fadein_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-xl px-7 py-7 w-full max-w-md max-h-[80vh] flex flex-col animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold mb-1">Visit notes</h3>
        <p className="text-[13px] text-ink/60 mb-5">
          {clientName} &middot; {workerName}
        </p>

        <div className="flex-1 overflow-y-auto space-y-3 -mx-1 px-1">
          {sortedNotes !== null && !hasStart && !hasEnd && (
            <p className="text-[12.5px] text-ink/50">No location was recorded for this visit.</p>
          )}

          {sortedNotes !== null && (hasStart || hasEnd) && (
            <div className="bg-white border border-black/10 rounded-md p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-teal-deep" />
                <p className="text-[13px] font-bold">Location</p>
              </div>

              {hasStart && (
                <p className="text-[13.5px] text-ink/75 leading-relaxed">
                  Checked in near [{gpsStartLat}, {gpsStartLng}] &middot;{" "}
                  <a
                    href={mapsUrl(gpsStartLat as number, gpsStartLng as number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-deep font-bold"
                  >
                    View on map
                  </a>
                </p>
              )}

              {hasEnd && (
                <p className="text-[13.5px] text-ink/75 leading-relaxed">
                  Checked out near [{gpsEndLat}, {gpsEndLng}] &middot;{" "}
                  <a
                    href={mapsUrl(gpsEndLat as number, gpsEndLng as number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-deep font-bold"
                  >
                    View on map
                  </a>
                </p>
              )}
            </div>
          )}

          {sortedNotes === null && (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          )}

          {sortedNotes && sortedNotes.length === 0 && (
            <div className="flex flex-col items-center text-center py-8">
              <NotebookText className="w-5 h-5 text-ink/40 mb-3" />
              <p className="text-[13px] text-ink/55">No notes were recorded for this visit.</p>
            </div>
          )}

          {sortedNotes &&
            sortedNotes.map((note) => (
              <div key={note.id} className="bg-white border border-black/10 rounded-md p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <Badge tone={note.note_type === "end_summary" ? "moss" : "teal"}>
                    {note.note_type === "end_summary" ? "End summary" : "During visit"}
                  </Badge>
                  <span className="text-[11px] text-ink/45">{formatTimestamp(note.created_at)}</span>
                </div>
                <p className="text-[13.5px] text-ink/75 leading-relaxed">{note.note_text}</p>
              </div>
            ))}
        </div>

        <button onClick={onClose} className={`${buttonClasses({ variant: "outline" })} w-full mt-6 shrink-0`}>
          Close
        </button>
      </div>
    </div>
  );
}
