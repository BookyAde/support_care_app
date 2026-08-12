"use client";

import Badge from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Mail, MailX } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  delivered: boolean;
  created_at: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45 mb-2">{children}</p>;
}

export default function ContactMessageDetailModal({
  open,
  contactMessage,
  onClose,
}: {
  open: boolean;
  contactMessage: ContactMessage | null;
  onClose: () => void;
}) {
  if (!open || !contactMessage) return null;

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
            <p className="font-display text-2xl font-bold mb-1">{contactMessage.name}</p>
            <p className="text-[13.5px] text-ink/60">{contactMessage.email}</p>
          </div>
          {contactMessage.delivered ? (
            <Badge tone="moss" variant="solid" uppercase>
              Delivered
            </Badge>
          ) : (
            <Badge tone="brick" variant="solid" uppercase>
              Failed
            </Badge>
          )}
        </div>

        <div className="mb-6">
          <SectionLabel>Submitted</SectionLabel>
          <p className="text-[14px] text-ink/80">
            {new Date(contactMessage.created_at).toLocaleString()}
          </p>
        </div>

        <div className="mb-7">
          <SectionLabel>Message</SectionLabel>
          <p className="text-[14px] text-ink/80 leading-relaxed whitespace-pre-wrap">{contactMessage.message}</p>
        </div>

        {!contactMessage.delivered && (
          <div className="flex items-center gap-2 text-[13px] text-ochre-deep bg-ochre/10 px-4 py-3 rounded-md mb-6">
            <MailX className="w-4 h-4 shrink-0" />
            The notification email to support@ never went out for this one - it was only saved here.
          </div>
        )}

        <div className="space-y-2.5">
          <a
            href={`mailto:${contactMessage.email}?subject=${encodeURIComponent(
              `Re: your message to Bountiful Support Plus`
            )}`}
            className={`${buttonClasses({ variant: "primary" })} w-full`}
          >
            <Mail className="w-4 h-4" />
            Reply via email
          </a>
          <button onClick={onClose} className={`${buttonClasses({ variant: "outline" })} w-full`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
