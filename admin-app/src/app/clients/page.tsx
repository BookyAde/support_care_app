"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import CredentialsModal from "@/components/CredentialsModal";
import InteractiveCard from "@/components/InteractiveCard";
import { buttonClasses } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Phone, MapPin, Users } from "lucide-react";

type Client = {
  id: string;
  full_name: string;
  address: string;
  contact_number: string;
  emergency_contact: string;
  created_at: string;
};

type ResetPasswordResult = {
  client: { full_name: string };
  access_code: string;
  temporary_password: string;
  email_sent: boolean;
};

export default function ClientsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetModalClient, setResetModalClient] = useState<Client | null>(null);
  const [resetResult, setResetResult] = useState<ResetPasswordResult | null>(null);
  const [deleteModalClient, setDeleteModalClient] = useState<Client | null>(null);

  function loadClients() {
    apiFetch("/clients")
      .then((data) => setClients(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load clients");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    loadClients();
  }, [router]);

  async function handleResetPassword() {
    if (!resetModalClient) return;
    try {
      const data = await apiFetch(`/clients/${resetModalClient.id}/reset-password`, { method: "POST" });
      setResetModalClient(null);
      setResetResult(data);
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not reset password");
    }
  }

  async function handleDelete() {
    if (!deleteModalClient) return;
    try {
      await apiFetch(`/clients/${deleteModalClient.id}`, { method: "DELETE" });
      showToast("danger", `${deleteModalClient.full_name} has been deleted`);
      setDeleteModalClient(null);
      loadClients();
    } catch (err) {
      // Surfaces the backend's exact shift-history rejection message, if
      // that's why it failed, rather than a generic fallback.
      showToast("danger", err instanceof Error ? err.message : "Could not delete client");
    }
  }

  function initials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <AdminShell>
      <main className="p-10 max-w-7xl">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1.5">Clients</h1>
            <p className="text-[15px] text-ink/60">Everyone currently receiving support care.</p>
          </div>
          <Link href="/clients/new" className={buttonClasses()}>
            <Plus className="w-4 h-4" />
            Add client
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!loading && clients && clients.length === 0 && (
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No clients yet"
            description="Add the first one to get started."
            action={
              <Link href="/clients/new" className={buttonClasses({ size: "sm" })}>
                <Plus className="w-3.5 h-3.5" />
                Add client
              </Link>
            }
          />
        )}

        {!loading && clients && clients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {clients.map((client) => (
              <InteractiveCard key={client.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal/12 text-teal-deep font-display font-bold text-lg flex items-center justify-center">
                    {initials(client.full_name)}
                  </div>
                  <Link
                    href={`/clients/${client.id}/edit`}
                    className={buttonClasses({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                </div>

                <p className="font-display text-lg font-bold mb-3">{client.full_name}</p>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-[13px] text-ink/65">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{client.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-ink/65">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono">{client.contact_number}</span>
                  </div>
                </div>

                <button
                  onClick={() => setResetModalClient(client)}
                  className={buttonClasses({ variant: "outline", size: "sm", fullWidth: true, className: "mt-4" })}
                >
                  Reset password
                </button>

                <div className="text-center mt-3">
                  <button
                    onClick={() => setDeleteModalClient(client)}
                    className="text-[11.5px] text-ink/35 hover:text-brick-deep underline underline-offset-2 transition"
                  >
                    Delete
                  </button>
                </div>
              </InteractiveCard>
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        open={resetModalClient !== null}
        emoji="🔑"
        tone="warn"
        title={`Reset password for ${resetModalClient?.full_name ?? "this client"}?`}
        body="This immediately invalidates their current password. They'll need the new temporary password below to sign in again."
        confirmLabel="Reset password"
        confirmTone="danger"
        onCancel={() => setResetModalClient(null)}
        onConfirm={handleResetPassword}
      />

      <CredentialsModal
        open={resetResult !== null}
        title="Password reset"
        description={
          resetResult ? `${resetResult.client.full_name} can sign in with either set of details below.` : ""
        }
        credentials={
          resetResult
            ? [
                { label: "Access code", value: resetResult.access_code },
                { label: "Temporary password", value: resetResult.temporary_password },
              ]
            : []
        }
        emailSent={resetResult?.email_sent ?? false}
        onClose={() => {
          setResetResult(null);
          loadClients();
        }}
      />

      <ConfirmModal
        open={deleteModalClient !== null}
        emoji="⚠️"
        tone="danger"
        title={`Permanently delete ${deleteModalClient?.full_name ?? "this client"}?`}
        body="This cannot be undone. Their record will be gone completely - this is only possible if they have no shift history. Deactivate instead if you just need to remove their access."
        confirmLabel="Delete permanently"
        confirmTone="danger"
        onCancel={() => setDeleteModalClient(null)}
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
}