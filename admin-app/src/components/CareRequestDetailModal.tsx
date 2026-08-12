"use client";

import Link from "next/link";
import Badge, { BadgeTone } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Mail, MailX, Info } from "lucide-react";

type CareRequest = {
  requester_name: string;
  requester_relationship: string;
  requester_phone: string;
  requester_email: string;
  care_recipient_name: string;
  care_recipient_address: string;
  care_type_summary: string | null;
  additional_notes: string | null;
  frequency: string | null;
  is_urgent: boolean;
  status: "pending" | "accepted" | "declined";
  decline_reason: string | null;
  existing_client_id: string | null;
  is_existing_client: boolean;
};

type AcceptedCredentials = { access_code: string; temporary_password: string; email_sent: boolean };

const STATUS_TONE: Record<CareRequest["status"], BadgeTone> = {
  pending: "ochre",
  accepted: "moss",
  declined: "brick",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45 mb-2">{children}</p>;
}

export default function CareRequestDetailModal({
  open,
  request,
  justAcceptedCredentials,
  onClose,
  onAcceptClick,
  onDeclineClick,
}: {
  open: boolean;
  request: CareRequest | null;
  justAcceptedCredentials: AcceptedCredentials | null;
  onClose: () => void;
  onAcceptClick: () => void;
  onDeclineClick: () => void;
}) {
  if (!open || !request) return null;

  const isPending = request.status === "pending";
  const hasWhatsNeeded = request.care_type_summary || request.frequency || request.additional_notes;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-[fadein_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-xl px-7 py-7 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-bold mb-1">{request.care_recipient_name}</p>
            <p className="text-[13.5px] text-ink/60">Requested by {request.requester_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {request.is_urgent && (
              <Badge tone="brick" variant="solid" uppercase>
                Urgent
              </Badge>
            )}
            <Badge tone={request.is_existing_client ? "teal" : "ochre"} uppercase>
              {request.is_existing_client ? "Existing client" : "New request"}
            </Badge>
          </div>
        </div>

        <div className="mb-6">
          <SectionLabel>Requester</SectionLabel>
          <p className="text-[14px] text-ink/80">
            {request.requester_name} &middot; {request.requester_relationship}
          </p>
          <p className="text-[14px] text-ink/80 font-mono mt-0.5">{request.requester_phone}</p>
          <p className="text-[14px] text-ink/80 mt-0.5">{request.requester_email}</p>
        </div>

        <div className="mb-6">
          <SectionLabel>Care recipient</SectionLabel>
          <p className="text-[14px] text-ink/80">{request.care_recipient_name}</p>
          <p className="text-[14px] text-ink/80 mt-0.5">{request.care_recipient_address}</p>
        </div>

        <div className="mb-6">
          <SectionLabel>What&apos;s needed</SectionLabel>
          {request.care_type_summary && <p className="text-[14px] text-ink/80 mb-1.5">{request.care_type_summary}</p>}
          {request.frequency && <p className="text-[13px] text-ink/60 mb-1.5">Frequency: {request.frequency}</p>}
          {request.additional_notes && (
            <p className="text-[13.5px] text-ink/65 leading-relaxed mt-2">{request.additional_notes}</p>
          )}
          {!hasWhatsNeeded && <p className="text-[13px] text-ink/50">No further details provided.</p>}
        </div>

        <div className="mb-7">
          <SectionLabel>Status</SectionLabel>
          <Badge tone={STATUS_TONE[request.status]} variant="solid" uppercase>
            {request.status}
          </Badge>

          {request.status === "declined" && request.decline_reason && (
            <div className="bg-brick/10 border-l-4 border-brick rounded-r-md px-4 py-3 mt-3">
              <p className="text-[13px] text-brick-deep leading-relaxed">{request.decline_reason}</p>
            </div>
          )}

          {request.status === "accepted" && request.is_existing_client && (
            <div className="flex items-start gap-2.5 bg-teal/10 text-teal-deep text-[13px] leading-relaxed rounded-md px-4 py-3 mt-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="mb-2">
                  This is an existing client. Their care plan can be updated directly on their client record.
                </p>
                {request.existing_client_id && (
                  <Link
                    href={`/clients/${request.existing_client_id}/edit`}
                    className="font-bold underline hover:no-underline"
                  >
                    Go to client record &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}

          {request.status === "accepted" && !request.is_existing_client && justAcceptedCredentials && (
            <div className="mt-3">
              <div className="bg-ink text-paper-raised rounded-md p-5 mb-3">
                <p className="text-[12px] text-paper-raised/60 mb-1">Access code</p>
                <p className="font-mono text-lg mb-4">{justAcceptedCredentials.access_code}</p>
                <p className="text-[12px] text-paper-raised/60 mb-1">Temporary password</p>
                <p className="font-mono text-lg">{justAcceptedCredentials.temporary_password}</p>
              </div>
              {justAcceptedCredentials.email_sent ? (
                <div className="flex items-center gap-2 text-[13px] text-moss-deep bg-moss/10 px-4 py-3 rounded-md">
                  <Mail className="w-4 h-4" />
                  These details were emailed automatically.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[13px] text-ochre-deep bg-ochre/10 px-4 py-3 rounded-md">
                  <MailX className="w-4 h-4" />
                  Email was not sent. Copy the details above and share them manually.
                </div>
              )}
            </div>
          )}

          {request.status === "accepted" && !request.is_existing_client && !justAcceptedCredentials && (
            <p className="text-[13px] text-ink/55 mt-3 leading-relaxed">
              A client account was created from this request. The temporary password was only shown
              once, at the time of acceptance.
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          {isPending && (
            <div className="flex gap-2.5">
              <button onClick={onDeclineClick} className={`${buttonClasses({ variant: "outline-danger" })} flex-1`}>
                Decline
              </button>
              <button onClick={onAcceptClick} className={`${buttonClasses({ variant: "outline-success" })} flex-1`}>
                Accept
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className={`${buttonClasses({ variant: isPending ? "ghost" : "outline" })} w-full`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
