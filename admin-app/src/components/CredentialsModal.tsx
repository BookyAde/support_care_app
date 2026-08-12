"use client";

import { CheckCircle2, Mail, MailX } from "lucide-react";
import Button from "@/components/ui/Button";

type CredentialsModalProps = {
  open: boolean;
  title: string;
  description: string;
  credentials: { label: string; value: string }[];
  emailSent: boolean;
  onClose: () => void;
};

/**
 * Shows freshly-generated login credentials once, right after creation or a
 * password reset - same dark credential-panel style used on the "Add a
 * worker" page, packaged as a modal so list pages (Workers, Clients) can
 * reuse it without navigating away.
 */
export default function CredentialsModal({
  open,
  title,
  description,
  credentials,
  emailSent,
  onClose,
}: CredentialsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 animate-[fadein_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-xl p-6 w-[380px] animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-5 h-5 text-moss-deep" />
          <h3 className="font-display text-lg font-bold">{title}</h3>
        </div>
        <p className="text-[13px] text-ink/60 mb-6">{description}</p>

        <div className="bg-ink text-paper-raised rounded-md p-5 mb-4">
          {credentials.map((c, i) => (
            <div key={c.label} className={i > 0 ? "mt-4" : ""}>
              <p className="text-[12px] text-paper-raised/60 mb-1">{c.label}</p>
              <p className="font-mono text-lg">{c.value}</p>
            </div>
          ))}
        </div>

        {emailSent ? (
          <div className="flex items-center gap-2 text-[13px] text-moss-deep bg-moss/10 px-4 py-3 rounded-md mb-6">
            <Mail className="w-4 h-4" />
            These details were emailed automatically.
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[13px] text-ochre-deep bg-ochre/10 px-4 py-3 rounded-md mb-6">
            <MailX className="w-4 h-4" />
            Email was not sent. Copy the details above and share them manually.
          </div>
        )}

        <Button onClick={onClose} fullWidth>
          Done
        </Button>
      </div>
    </div>
  );
}
