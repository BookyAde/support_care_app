"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import InteractiveCard from "@/components/InteractiveCard";
import AssignShiftModal, { ShiftFormData } from "@/components/AssignShiftModal";
import EditShiftModal, { EditShiftFormData } from "@/components/EditShiftModal";
import ShiftDetailModal from "@/components/ShiftDetailModal";
import { buttonClasses } from "@/components/ui/Button";
import Badge, { BadgeTone } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, CalendarClock } from "lucide-react";

type Client = { id: string; full_name: string };
type Worker = { id: string; full_name: string };
type Shift = {
  id: string;
  client_id: string;
  worker_id: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  worker_response: "pending" | "accepted" | "declined";
  decline_reason: string | null;
  responded_at: string | null;
  is_overdue: boolean;
};

const STATUS_TONE: Record<Shift["status"], BadgeTone> = {
  scheduled: "teal",
  in_progress: "ochre",
  completed: "moss",
  cancelled: "brick",
};

export default function ShiftsPage() {
  const router = useRouter();
  const showToast = useToast();

  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [cancelShift, setCancelShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadAll();
  }, [router]);

  function loadAll() {
    setLoading(true);
    Promise.all([apiFetch("/shifts"), apiFetch("/clients"), apiFetch("/workers")])
      .then(([shiftsData, clientsData, workersData]) => {
        setShifts(shiftsData);
        setClients(clientsData);
        setWorkers(workersData);
      })
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load shifts");
      })
      .finally(() => setLoading(false));
  }

  function clientName(id: string) {
    return clients.find((c) => c.id === id)?.full_name ?? "Unknown client";
  }
  function workerName(id: string) {
    return workers.find((w) => w.id === id)?.full_name ?? "Unknown worker";
  }

  async function handleSubmit(formData: ShiftFormData) {
    setSaving(true);
    try {
      const newShift = await apiFetch("/shifts", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShifts((prev) => (prev ? [newShift, ...prev] : [newShift]));
      setShowAssignModal(false);
      showToast("success", "Shift created and assigned");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not create shift");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(formData: EditShiftFormData) {
    if (!editingShift) return;
    setSaving(true);
    try {
      const updated = await apiFetch(`/shifts/${editingShift.id}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      setShifts((prev) => prev!.map((s) => (s.id === updated.id ? updated : s)));
      setEditingShift(null);
      showToast("success", "Shift updated");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not update shift");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelShift() {
    if (!cancelShift) return;
    try {
      const updated = await apiFetch(`/shifts/${cancelShift.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      });
      setShifts((prev) => prev!.map((s) => (s.id === updated.id ? updated : s)));
      setCancelShift(null);
      showToast("danger", "Shift cancelled");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not cancel shift");
    }
  }

  return (
    <AdminShell>
      <main className="p-10 max-w-7xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">Shifts</h1>
            <p className="text-sm text-ink/60">Every visit assigned, past and upcoming.</p>
          </div>
          <button onClick={() => setShowAssignModal(true)} className={buttonClasses()}>
            <Plus className="w-4 h-4" />
            Assign shift
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!loading && shifts && shifts.length === 0 && (
          <EmptyState
            icon={<CalendarClock className="w-5 h-5" />}
            title="No shifts assigned yet"
            description="Assign the first visit to get started."
            action={
              <button onClick={() => setShowAssignModal(true)} className={buttonClasses({ size: "sm" })}>
                <Plus className="w-3.5 h-3.5" />
                Assign shift
              </button>
            }
          />
        )}

        {!loading && shifts && shifts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {shifts.map((shift) => (
              <InteractiveCard key={shift.id} className="cursor-pointer">
                <div className="p-5" onClick={() => setDetailShift(shift)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display text-base font-bold mb-0.5">{clientName(shift.client_id)}</p>
                      <p className="text-[13px] text-ink/60">{workerName(shift.worker_id)}</p>
                    </div>
                    <Badge tone={STATUS_TONE[shift.status]} variant="solid" uppercase>
                      {shift.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-ink/60">
                    {shift.scheduled_date} &middot;{" "}
                    <span className="font-mono">{shift.scheduled_start} - {shift.scheduled_end}</span>
                  </p>
                </div>
              </InteractiveCard>
            ))}
          </div>
        )}
      </main>

      <AssignShiftModal
        open={showAssignModal}
        clients={clients}
        workers={workers}
        saving={saving}
        onCancel={() => setShowAssignModal(false)}
        onSubmit={handleSubmit}
      />

      <ShiftDetailModal
        open={detailShift !== null}
        shift={detailShift}
        clientName={detailShift ? clientName(detailShift.client_id) : ""}
        workerName={detailShift ? workerName(detailShift.worker_id) : ""}
        onClose={() => setDetailShift(null)}
        onEdit={() => {
          if (!detailShift) return;
          setEditingShift(detailShift);
          setDetailShift(null);
        }}
        onCancelShift={() => {
          if (!detailShift) return;
          setCancelShift(detailShift);
          setDetailShift(null);
        }}
      />

      <EditShiftModal
        open={editingShift !== null}
        shift={editingShift}
        clientName={editingShift ? clientName(editingShift.client_id) : ""}
        workers={workers}
        saving={saving}
        onCancel={() => setEditingShift(null)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmModal
        open={cancelShift !== null}
        emoji="⚠️"
        tone="warn"
        title="Cancel this shift?"
        body={`This will cancel the visit for ${cancelShift ? clientName(cancelShift.client_id) : ""}. The worker will no longer see it on their dashboard.`}
        confirmLabel="Cancel shift"
        confirmTone="danger"
        onCancel={() => setCancelShift(null)}
        onConfirm={handleCancelShift}
      />
    </AdminShell>
  );
}
