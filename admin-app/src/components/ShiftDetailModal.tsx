"use client";

import Badge, { BadgeTone } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

type Shift = {
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  worker_response: "pending" | "accepted" | "declined";
  decline_reason: string | null;
  is_overdue: boolean;
};

const STATUS_TONE: Record<Shift["status"], BadgeTone> = {
  scheduled: "teal",
  in_progress: "ochre",
  completed: "moss",
  cancelled: "brick",
};

const RESPONSE_TONE: Record<Shift["worker_response"], BadgeTone> = {
  pending: "ochre",
  accepted: "moss",
  declined: "brick",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45 mb-2">{children}</p>;
}

export default function ShiftDetailModal({
  open,
  shift,
  clientName,
  workerName,
  onClose,
  onEdit,
  onCancelShift,
}: {
  open: boolean;
  shift: Shift | null;
  clientName: string;
  workerName: string;
  onClose: () => void;
  onEdit: () => void;
  onCancelShift: () => void;
}) {
  if (!open || !shift) return null;

  const isScheduled = shift.status === "scheduled";

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-[fadein_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-xl px-7 py-7 w-full max-w-md max-h-[85vh] overflow-y-auto animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-7">
          <p className="font-display text-2xl font-bold mb-1">{clientName}</p>
          <p className="text-[13.5px] text-ink/60">{workerName}</p>
        </div>

        <div className="mb-6">
          <SectionLabel>Schedule</SectionLabel>
          <p className="text-[14px] text-ink/80">{shift.scheduled_date}</p>
          <p className="text-[14px] text-ink/80 font-mono mt-0.5">
            {shift.scheduled_start} - {shift.scheduled_end}
          </p>
        </div>

        <div className="mb-6">
          <SectionLabel>Status</SectionLabel>
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[shift.status]} variant="solid" uppercase>
              {shift.status.replace("_", " ")}
            </Badge>
            {shift.is_overdue && (
              <Badge tone="brick" variant="solid" uppercase>
                Overdue
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-7">
          <SectionLabel>Worker response</SectionLabel>
          <Badge tone={RESPONSE_TONE[shift.worker_response]} uppercase>
            {shift.worker_response}
          </Badge>

          {shift.worker_response === "declined" && shift.decline_reason && (
            <div className="bg-brick/10 border-l-4 border-brick rounded-r-md px-4 py-3 mt-3">
              <p className="text-[13px] text-brick-deep leading-relaxed">{shift.decline_reason}</p>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {isScheduled && (
            <div className="flex gap-2.5">
              <button onClick={onEdit} className={`${buttonClasses({ variant: "outline" })} flex-1`}>
                Edit shift
              </button>
              <button onClick={onCancelShift} className={`${buttonClasses({ variant: "outline-danger" })} flex-1`}>
                Cancel shift
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className={`${buttonClasses({ variant: isScheduled ? "ghost" : "outline" })} w-full`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
