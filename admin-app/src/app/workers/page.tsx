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
import Badge from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, ShieldOff, ShieldCheck, UserCog } from "lucide-react";

type Worker = {
  id: string;
  full_name: string;
  employee_id: string;
  email: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
};

type ResetPasswordResult = {
  worker: { full_name: string };
  employee_id: string;
  temporary_password: string;
  email_sent: boolean;
};

export default function WorkersPage() {
  const router = useRouter();
  const showToast = useToast();
  const [workers, setWorkers] = useState<Worker[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalWorker, setModalWorker] = useState<Worker | null>(null);
  const [resetModalWorker, setResetModalWorker] = useState<Worker | null>(null);
  const [resetResult, setResetResult] = useState<ResetPasswordResult | null>(null);
  const [deleteModalWorker, setDeleteModalWorker] = useState<Worker | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadWorkers();
  }, [router]);

  function loadWorkers() {
    apiFetch("/workers")
      .then((data) => setWorkers(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load workers");
      })
      .finally(() => setLoading(false));
  }

  async function handleDeactivate(reason?: string) {
    if (!modalWorker) return;
    try {
      await apiFetch(`/workers/${modalWorker.id}/deactivate`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || "Deactivated by admin" }),
      });
      showToast("danger", `${modalWorker.full_name} has been deactivated`);
      setModalWorker(null);
      loadWorkers();
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not deactivate worker");
    }
  }

  async function handleReactivate(worker: Worker) {
    try {
      await apiFetch(`/workers/${worker.id}/reactivate`, { method: "POST" });
      showToast("success", `${worker.full_name} has been reactivated`);
      loadWorkers();
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not reactivate worker");
    }
  }

  async function handleResetPassword() {
    if (!resetModalWorker) return;
    try {
      const data = await apiFetch(`/workers/${resetModalWorker.id}/reset-password`, { method: "POST" });
      setResetModalWorker(null);
      setResetResult(data);
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not reset password");
    }
  }

  async function handleDelete() {
    if (!deleteModalWorker) return;
    try {
      await apiFetch(`/workers/${deleteModalWorker.id}`, { method: "DELETE" });
      showToast("danger", `${deleteModalWorker.full_name} has been deleted`);
      setDeleteModalWorker(null);
      loadWorkers();
    } catch (err) {
      // Surfaces the backend's exact shift-history rejection message, if
      // that's why it failed, rather than a generic fallback.
      showToast("danger", err instanceof Error ? err.message : "Could not delete worker");
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
            <h1 className="font-display text-3xl font-bold mb-1.5">Workers</h1>
            <p className="text-[15px] text-ink/60">Everyone currently employed as a support worker.</p>
          </div>
          <Link href="/workers/new" className={buttonClasses()}>
            <Plus className="w-4 h-4" />
            Add worker
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!loading && workers && workers.length === 0 && (
          <EmptyState
            icon={<UserCog className="w-5 h-5" />}
            title="No workers yet"
            description="Add the first one to get started."
            action={
              <Link href="/workers/new" className={buttonClasses({ size: "sm" })}>
                <Plus className="w-3.5 h-3.5" />
                Add worker
              </Link>
            }
          />
        )}

        {!loading && workers && workers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {workers.map((worker) => (
              <InteractiveCard key={worker.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal/12 text-teal-deep font-display font-bold text-lg flex items-center justify-center">
                    {initials(worker.full_name)}
                  </div>
                  {worker.is_active ? (
                    <Badge tone="moss" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                      Active
                    </Badge>
                  ) : (
                    <Badge tone="brick" icon={<ShieldOff className="w-3.5 h-3.5" />}>
                      Deactivated
                    </Badge>
                  )}
                </div>

                <p className="font-display text-lg font-bold mb-0.5">{worker.full_name}</p>
                <p className="text-[13px] text-ink/60 font-mono mb-4">{worker.employee_id}</p>

                <div className="flex gap-2">
                  {worker.is_active ? (
                    <button
                      onClick={() => setModalWorker(worker)}
                      className={buttonClasses({ variant: "outline-danger", size: "sm", fullWidth: true })}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(worker)}
                      className={buttonClasses({ variant: "outline-success", size: "sm", fullWidth: true })}
                    >
                      Reactivate
                    </button>
                  )}
                  <button
                    onClick={() => setResetModalWorker(worker)}
                    className={buttonClasses({ variant: "outline", size: "sm", fullWidth: true })}
                  >
                    Reset password
                  </button>
                </div>

                <div className="text-center mt-3">
                  <button
                    onClick={() => setDeleteModalWorker(worker)}
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
        open={modalWorker !== null}
        emoji="🔒"
        tone="danger"
        title={`Deactivate ${modalWorker?.full_name ?? "this worker"}?`}
        body="They will immediately lose access, even mid-session. This can be reversed later."
        confirmLabel="Deactivate"
        confirmTone="danger"
        requireReason
        reasonLabel="Reason for deactivation"
        onCancel={() => setModalWorker(null)}
        onConfirm={handleDeactivate}
      />

      <ConfirmModal
        open={resetModalWorker !== null}
        emoji="🔑"
        tone="warn"
        title={`Reset password for ${resetModalWorker?.full_name ?? "this worker"}?`}
        body="This immediately invalidates their current password. They'll need the new temporary password below to sign in again."
        confirmLabel="Reset password"
        confirmTone="danger"
        onCancel={() => setResetModalWorker(null)}
        onConfirm={handleResetPassword}
      />

      <CredentialsModal
        open={resetResult !== null}
        title="Password reset"
        description={
          resetResult ? `${resetResult.worker.full_name} can sign in with either set of details below.` : ""
        }
        credentials={
          resetResult
            ? [
                { label: "Employee ID", value: resetResult.employee_id },
                { label: "Temporary password", value: resetResult.temporary_password },
              ]
            : []
        }
        emailSent={resetResult?.email_sent ?? false}
        onClose={() => {
          setResetResult(null);
          loadWorkers();
        }}
      />

      <ConfirmModal
        open={deleteModalWorker !== null}
        emoji="⚠️"
        tone="danger"
        title={`Permanently delete ${deleteModalWorker?.full_name ?? "this worker"}?`}
        body="This cannot be undone. Their account and profile will be gone completely - this is only possible if they have no shift history. Deactivate instead if you just need to remove their access."
        confirmLabel="Delete permanently"
        confirmTone="danger"
        onCancel={() => setDeleteModalWorker(null)}
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
}
