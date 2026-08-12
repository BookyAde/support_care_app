"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import AdminDetailModal from "@/components/AdminDetailModal";
import InteractiveCard from "@/components/InteractiveCard";
import { buttonClasses } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, ShieldOff, ShieldCheck } from "lucide-react";

type Admin = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
};

export default function AdminsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailAdmin, setDetailAdmin] = useState<Admin | null>(null);
  const [deactivateModalAdmin, setDeactivateModalAdmin] = useState<Admin | null>(null);
  const [deleteModalAdmin, setDeleteModalAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadAdmins();
  }, [router]);

  function loadAdmins() {
    setLoading(true);
    apiFetch("/admins")
      .then((data) => setAdmins(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load admins");
      })
      .finally(() => setLoading(false));
  }

  async function handleDeactivate() {
    if (!deactivateModalAdmin) return;
    try {
      await apiFetch(`/admins/${deactivateModalAdmin.id}/deactivate`, { method: "POST" });
      showToast("danger", `${deactivateModalAdmin.full_name} has been deactivated`);
      setDeactivateModalAdmin(null);
      loadAdmins();
    } catch (err) {
      // Surfaces the backend's exact safeguard message (self-deactivation,
      // last-active-admin) rather than a generic fallback.
      showToast("danger", err instanceof Error ? err.message : "Could not deactivate admin");
    }
  }

  async function handleReactivate(admin: Admin) {
    try {
      await apiFetch(`/admins/${admin.id}/reactivate`, { method: "POST" });
      showToast("success", `${admin.full_name} has been reactivated`);
      loadAdmins();
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not reactivate admin");
    }
  }

  async function handleDelete() {
    if (!deleteModalAdmin) return;
    try {
      await apiFetch(`/admins/${deleteModalAdmin.id}`, { method: "DELETE" });
      showToast("danger", `${deleteModalAdmin.full_name} has been deleted`);
      setDeleteModalAdmin(null);
      setDetailAdmin(null);
      loadAdmins();
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not delete admin");
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
            <h1 className="font-display text-3xl font-bold mb-1.5">Admins</h1>
            <p className="text-[15px] text-ink/60">Everyone with access to this management portal.</p>
          </div>
          <Link href="/admins/new" className={buttonClasses()}>
            <Plus className="w-4 h-4" />
            Add admin
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!loading && admins && admins.length === 0 && (
          <EmptyState
            icon={<ShieldCheck className="w-5 h-5" />}
            title="No admins yet"
            description="Add the first one to get started."
            action={
              <Link href="/admins/new" className={buttonClasses({ size: "sm" })}>
                <Plus className="w-3.5 h-3.5" />
                Add admin
              </Link>
            }
          />
        )}

        {!loading && admins && admins.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {admins.map((admin) => (
              <InteractiveCard key={admin.id} className="cursor-pointer">
                <div className="p-6" onClick={() => setDetailAdmin(admin)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-teal/12 text-teal-deep font-display font-bold text-lg flex items-center justify-center">
                      {initials(admin.full_name)}
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

                  <p className="font-display text-lg font-bold mb-0.5">{admin.full_name}</p>
                  <p className="text-[13px] text-ink/60 mb-4 truncate">{admin.email}</p>

                  {admin.is_active ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeactivateModalAdmin(admin);
                      }}
                      className={buttonClasses({ variant: "outline-danger", size: "sm", fullWidth: true })}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReactivate(admin);
                      }}
                      className={buttonClasses({ variant: "outline-success", size: "sm", fullWidth: true })}
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </InteractiveCard>
            ))}
          </div>
        )}
      </main>

      <AdminDetailModal
        open={detailAdmin !== null}
        admin={detailAdmin}
        onClose={() => setDetailAdmin(null)}
        onDeleteClick={() => {
          if (!detailAdmin) return;
          setDeleteModalAdmin(detailAdmin);
          setDetailAdmin(null);
        }}
      />

      <ConfirmModal
        open={deactivateModalAdmin !== null}
        emoji="🔒"
        tone="warn"
        title={`Deactivate ${deactivateModalAdmin?.full_name ?? "this admin"}?`}
        body="They will immediately lose access to this portal, even mid-session. This can be reversed later."
        confirmLabel="Deactivate"
        confirmTone="danger"
        onCancel={() => setDeactivateModalAdmin(null)}
        onConfirm={handleDeactivate}
      />

      <ConfirmModal
        open={deleteModalAdmin !== null}
        emoji="⚠️"
        tone="danger"
        title={`Permanently delete ${deleteModalAdmin?.full_name ?? "this admin"}?`}
        body="This cannot be undone. Their account will be gone completely - clients, workers, and shifts they created stay in the system, just without attribution to them. Consider deactivating instead unless this account should never come back."
        confirmLabel="Delete permanently"
        confirmTone="danger"
        onCancel={() => setDeleteModalAdmin(null)}
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
}
