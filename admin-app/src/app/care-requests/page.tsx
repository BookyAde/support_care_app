"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import InteractiveCard from "@/components/InteractiveCard";
import CareRequestDetailModal from "@/components/CareRequestDetailModal";
import DeclineCareRequestModal from "@/components/DeclineCareRequestModal";
import Badge, { BadgeTone } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Inbox } from "lucide-react";

type CareRequest = {
  id: string;
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
  linked_client_id: string | null;
  existing_client_id: string | null;
  is_existing_client: boolean;
  created_at: string;
};

type AcceptedCredentials = {
  requestId: string;
  access_code: string;
  temporary_password: string;
  email_sent: boolean;
};

const STATUS_TONE: Record<CareRequest["status"], BadgeTone> = {
  pending: "ochre",
  accepted: "moss",
  declined: "brick",
};

export default function CareRequestsPage() {
  const router = useRouter();
  const showToast = useToast();

  const [requests, setRequests] = useState<CareRequest[] | null>(null);
  const [loading, setLoading] = useState(true);

  const [detailRequest, setDetailRequest] = useState<CareRequest | null>(null);
  const [confirmAcceptRequest, setConfirmAcceptRequest] = useState<CareRequest | null>(null);
  const [declineRequest, setDeclineRequest] = useState<CareRequest | null>(null);
  const [declining, setDeclining] = useState(false);
  const [acceptedCredentials, setAcceptedCredentials] = useState<AcceptedCredentials | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadAll();
  }, [router]);

  function loadAll() {
    setLoading(true);
    apiFetch("/care-requests")
      .then((data) => setRequests(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load care requests");
      })
      .finally(() => setLoading(false));
  }

  async function handleAcceptConfirm() {
    if (!confirmAcceptRequest) return;
    try {
      const result = await apiFetch(`/care-requests/${confirmAcceptRequest.id}/accept`, { method: "POST" });
      setRequests((prev) => prev!.map((r) => (r.id === result.care_request.id ? result.care_request : r)));
      setDetailRequest(result.care_request);
      setConfirmAcceptRequest(null);

      if (result.needs_manual_followup) {
        // Existing-client request - no new credentials were generated, nothing
        // to show in the credentials panel.
        setAcceptedCredentials(null);
        showToast("success", "Request accepted - this is an existing client, no new account was created");
      } else {
        setAcceptedCredentials({
          requestId: result.care_request.id,
          access_code: result.access_code,
          temporary_password: result.temporary_password,
          email_sent: result.email_sent,
        });
        showToast("success", "Request accepted, a client account was created");
      }
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not accept the request");
      setConfirmAcceptRequest(null);
    }
  }

  async function handleDeclineConfirm(reason: string) {
    if (!declineRequest) return;
    setDeclining(true);
    try {
      const updated = await apiFetch(`/care-requests/${declineRequest.id}/decline`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setRequests((prev) => prev!.map((r) => (r.id === updated.id ? updated : r)));
      setDeclineRequest(null);
      showToast("danger", "Request declined");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not decline the request");
    } finally {
      setDeclining(false);
    }
  }

  return (
    <AdminShell>
      <main className="p-10 max-w-7xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">Care Requests</h1>
          <p className="text-sm text-ink/60">Public submissions from families asking for care.</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!loading && requests && requests.length === 0 && (
          <EmptyState
            icon={<Inbox className="w-5 h-5" />}
            title="No care requests yet"
            description="Submissions from the public request form will show up here."
          />
        )}

        {!loading && requests && requests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {requests.map((request) => (
              <InteractiveCard key={request.id} className="cursor-pointer">
                <div
                  className="p-5"
                  onClick={() => {
                    setAcceptedCredentials((prev) => (prev && prev.requestId === request.id ? prev : null));
                    setDetailRequest(request);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display text-base font-bold mb-0.5">{request.care_recipient_name}</p>
                      <p className="text-[13px] text-ink/60">Requested by {request.requester_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {request.is_urgent && (
                        <Badge tone="brick" variant="solid" uppercase>
                          Urgent
                        </Badge>
                      )}
                      <Badge tone={STATUS_TONE[request.status]} variant="solid" uppercase>
                        {request.status}
                      </Badge>
                      <Badge tone={request.is_existing_client ? "teal" : "ochre"}>
                        {request.is_existing_client ? "Existing client" : "New request"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[13px] text-ink/60">{new Date(request.created_at).toLocaleDateString()}</p>
                </div>
              </InteractiveCard>
            ))}
          </div>
        )}
      </main>

      <CareRequestDetailModal
        open={detailRequest !== null}
        request={detailRequest}
        justAcceptedCredentials={
          detailRequest && acceptedCredentials?.requestId === detailRequest.id ? acceptedCredentials : null
        }
        onClose={() => setDetailRequest(null)}
        onAcceptClick={() => {
          if (!detailRequest) return;
          setConfirmAcceptRequest(detailRequest);
          setDetailRequest(null);
        }}
        onDeclineClick={() => {
          if (!detailRequest) return;
          setDeclineRequest(detailRequest);
          setDetailRequest(null);
        }}
      />

      <ConfirmModal
        open={confirmAcceptRequest !== null}
        emoji="✅"
        tone="success"
        title="Accept this care request?"
        body={
          confirmAcceptRequest?.is_existing_client
            ? `${confirmAcceptRequest.care_recipient_name} is already a client. This will mark the request as accepted - no new account will be created.`
            : `This will create a new client account for ${confirmAcceptRequest?.care_recipient_name ?? ""} and generate login credentials automatically.`
        }
        confirmLabel={confirmAcceptRequest?.is_existing_client ? "Accept" : "Accept and create client"}
        confirmTone="success"
        onCancel={() => setConfirmAcceptRequest(null)}
        onConfirm={handleAcceptConfirm}
      />

      <DeclineCareRequestModal
        open={declineRequest !== null}
        submitting={declining}
        onCancel={() => setDeclineRequest(null)}
        onConfirm={handleDeclineConfirm}
      />
    </AdminShell>
  );
}
