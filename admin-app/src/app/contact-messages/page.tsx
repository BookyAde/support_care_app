"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import InteractiveCard from "@/components/InteractiveCard";
import ContactMessageDetailModal from "@/components/ContactMessageDetailModal";
import Badge from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Mail } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  delivered: boolean;
  created_at: string;
};

function preview(message: string, length = 100) {
  return message.length > length ? `${message.slice(0, length)}...` : message;
}

export default function ContactMessagesPage() {
  const router = useRouter();
  const showToast = useToast();

  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailMessage, setDetailMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadAll();
  }, [router]);

  function loadAll() {
    setLoading(true);
    apiFetch("/contact-messages")
      .then((data) => setMessages(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load contact messages");
      })
      .finally(() => setLoading(false));
  }

  return (
    <AdminShell>
      <main className="p-10 max-w-7xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">Contact Messages</h1>
          <p className="text-sm text-ink/60">Public submissions from the marketing site&apos;s contact form.</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!loading && messages && messages.length === 0 && (
          <EmptyState
            icon={<Mail className="w-5 h-5" />}
            title="No contact messages yet"
            description="Submissions from the public contact form will show up here."
          />
        )}

        {!loading && messages && messages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {messages.map((message) => (
              <InteractiveCard key={message.id} className="cursor-pointer">
                <div className="p-5" onClick={() => setDetailMessage(message)}>
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold mb-0.5 truncate">{message.name}</p>
                      <p className="text-[13px] text-ink/60 truncate">{message.email}</p>
                    </div>
                    {message.delivered ? (
                      <Badge tone="moss" variant="solid" uppercase>
                        Delivered
                      </Badge>
                    ) : (
                      <Badge tone="brick" variant="solid" uppercase>
                        Failed
                      </Badge>
                    )}
                  </div>
                  <p className="text-[13.5px] text-ink/65 leading-relaxed mb-3">{preview(message.message)}</p>
                  <p className="text-[13px] text-ink/60">
                    {new Date(message.created_at).toLocaleDateString()}
                  </p>
                </div>
              </InteractiveCard>
            ))}
          </div>
        )}
      </main>

      <ContactMessageDetailModal
        open={detailMessage !== null}
        contactMessage={detailMessage}
        onClose={() => setDetailMessage(null)}
      />
    </AdminShell>
  );
}
