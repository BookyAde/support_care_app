"use client";

import Badge from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { ShieldCheck, ShieldOff } from "lucide-react";

type Admin = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45 mb-2">{children}</p>;
}

/**
 * Read-only admin detail view. Deliberately the ONLY place "Delete" appears
 * for an admin - not on the list card - since a permanent delete is a
 * genuine last resort, not a routine action, and the muted/small link here
 * keeps it clearly secondary to Close.
 */
export default function AdminDetailModal({
  open,
  admin,
  onClose,
  onDeleteClick,
}: {
  open: boolean;
  admin: Admin | null;
  onClose: () => void;
  onDeleteClick: () => void;
}) {
  if (!open || !admin) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-[fadein_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-paper-raised rounded-xl px-7 py-7 w-full max-w-md animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-bold mb-1">{admin.full_name}</p>
            <p className="text-[13.5px] text-ink/60">{admin.email}</p>
          </div>
          {admin.is_active ? (
            <Badge tone="moss" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Active
            </Badge>
          ) : (
            <Badge tone="brick" icon={<ShieldOff className="w-3.5 h-3.5" />}>
              Deactivated
            </Badge>
          )}
        </div>

        <div className="mb-7">
          <SectionLabel>Account created</SectionLabel>
          <p className="text-[14px] text-ink/80">{new Date(admin.created_at).toLocaleString()}</p>
        </div>

        <div className="space-y-2.5">
          <button onClick={onClose} className={`${buttonClasses({ variant: "outline" })} w-full`}>
            Close
          </button>
          <div className="text-center pt-1">
            <button
              onClick={onDeleteClick}
              className="text-[12px] text-ink/40 hover:text-brick-deep underline underline-offset-2 transition"
            >
              Delete this admin permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
