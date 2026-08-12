"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getGpsCoords } from "@/lib/geolocation";
import { useToast } from "@/components/ToastProvider";
import WorkerTopBar from "@/components/WorkerTopBar";
import ShiftCard from "@/components/ShiftCard";
import InteractiveCard from "@/components/InteractiveCard";
import EndVisitModal from "@/components/EndVisitModal";
import ShiftDetailModal from "@/components/ShiftDetailModal";
import DeclineShiftModal from "@/components/DeclineShiftModal";
import { ListRowSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarClock, Clock, MessageCircle } from "lucide-react";
import type { Shift } from "@/lib/types";

function greetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function isSameWeek(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - dayOfWeek);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return date >= monday && date <= sunday;
}

function durationHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function shiftDateTime(shift: Shift) {
  return new Date(`${shift.scheduled_date}T${shift.scheduled_start}`).getTime();
}

export default function VisitsPage() {
  const router = useRouter();
  const showToast = useToast();

  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<{ full_name: string } | null>(null);
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [visitIds, setVisitIds] = useState<Record<string, string>>({});
  const [busyShiftId, setBusyShiftId] = useState<string | null>(null);
  const [endModalShift, setEndModalShift] = useState<Shift | null>(null);
  const [endSubmitting, setEndSubmitting] = useState(false);
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [declineShift, setDeclineShift] = useState<Shift | null>(null);
  const [respondBusyId, setRespondBusyId] = useState<string | null>(null);
  const [declineSubmitting, setDeclineSubmitting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadShifts();

    apiFetch("/workers/me")
      .then((data) => setWorker(data))
      .catch(() => {
        // Silent - the greeting just omits the name if this fails.
      });

    // Total message count for the stat row, not a true "unread" count - GET
    // /messages/mine marks admin messages read as a side effect of fetching
    // them, so a persistent unread badge isn't possible without a new
    // backend endpoint. Deliberate scope decision, not a bug.
    apiFetch("/messages/mine")
      .then((data: unknown[]) => setMessageCount(data.length))
      .catch(() => {
        // Silent - the messages stat just stays blank if this fails.
      });
  }, [router]);

  function loadShifts() {
    apiFetch("/shifts/my-shifts")
      .then((data) => setShifts(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load your visits");
      })
      .finally(() => setLoading(false));
  }

  // Recovers visit_ids lost to a page refresh mid-visit: for any in_progress
  // shift we don't already have a local visit_id for, ask the backend if it
  // still has an active visit for that shift (it does, unless the data is
  // genuinely orphaned). Runs as one parallel batch, and re-checks whenever
  // `shifts` changes so it also self-heals after any other action, not just
  // on first load.
  useEffect(() => {
    if (!shifts) return;
    const needsRecovery = shifts.filter((s) => s.status === "in_progress" && !visitIds[s.id]);
    if (needsRecovery.length === 0) return;

    Promise.all(
      needsRecovery.map((s) =>
        apiFetch(`/visits/shifts/${s.id}/active`)
          .then((visit) => ({ shiftId: s.id, visitId: visit.id as string }))
          .catch(() => null)
      )
    ).then((results) => {
      const recovered = results.filter((r): r is { shiftId: string; visitId: string } => r !== null);
      if (recovered.length === 0) return;
      setVisitIds((prev) => {
        const next = { ...prev };
        for (const r of recovered) next[r.shiftId] = r.visitId;
        return next;
      });
    });
  }, [shifts, visitIds]);

  async function handleStart(shift: Shift) {
    setBusyShiftId(shift.id);
    try {
      const gps = await getGpsCoords();
      if (!gps) {
        showToast("warn", "Could not get your location, starting the visit anyway.");
      }
      const visit = await apiFetch(`/visits/shifts/${shift.id}/start`, {
        method: "POST",
        body: JSON.stringify({ gps }),
      });
      setVisitIds((prev) => ({ ...prev, [shift.id]: visit.id }));
      showToast("success", "Visit started");
      loadShifts();
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not start the visit");
    } finally {
      setBusyShiftId(null);
    }
  }

  async function handleAccept(shift: Shift) {
    setRespondBusyId(shift.id);
    try {
      await apiFetch(`/shifts/${shift.id}/respond`, {
        method: "POST",
        body: JSON.stringify({ response: "accepted" }),
      });
      showToast("success", "Shift accepted");
      loadShifts();
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not accept the shift");
    } finally {
      setRespondBusyId(null);
    }
  }

  async function handleDeclineConfirm(reason: string) {
    if (!declineShift) return;
    const shift = declineShift;
    setDeclineSubmitting(true);
    try {
      await apiFetch(`/shifts/${shift.id}/respond`, {
        method: "POST",
        body: JSON.stringify({ response: "declined", reason }),
      });
      showToast("success", "Shift declined");
      setDeclineShift(null);
      loadShifts();
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not decline the shift");
    } finally {
      setDeclineSubmitting(false);
    }
  }

  async function handleSaveNote(shift: Shift, noteText: string) {
    const visitId = visitIds[shift.id];
    if (!visitId) {
      showToast("danger", "Visit info isn't available for this shift after a refresh.");
      return;
    }
    try {
      await apiFetch(`/visits/${visitId}/notes`, {
        method: "POST",
        body: JSON.stringify({ note_text: noteText }),
      });
      showToast("success", "Note saved");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not save the note");
    }
  }

  async function handleEndConfirm(summaryNote: string) {
    if (!endModalShift) return;
    const shift = endModalShift;
    const visitId = visitIds[shift.id];
    if (!visitId) {
      showToast("danger", "Visit info isn't available for this shift after a refresh.");
      return;
    }
    setEndSubmitting(true);
    try {
      const gps = await getGpsCoords();
      await apiFetch(`/visits/${visitId}/end`, {
        method: "POST",
        body: JSON.stringify({ gps, summary_note: summaryNote }),
      });
      setVisitIds((prev) => {
        const next = { ...prev };
        delete next[shift.id];
        return next;
      });
      showToast("success", "Visit completed and verified");
      setEndModalShift(null);
      loadShifts();
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not end the visit");
    } finally {
      setEndSubmitting(false);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const shiftsToday = shifts?.filter((s) => s.scheduled_date === todayStr).length ?? 0;

  // total_hours_worked isn't part of ShiftResponse (only scheduled_start/end
  // are) - approximated here as scheduled duration for completed shifts this
  // week, rather than true actual-worked time, since that would need a new
  // backend field/endpoint this task doesn't add.
  const hoursThisWeek =
    shifts
      ?.filter((s) => s.status === "completed" && isSameWeek(s.scheduled_date))
      .reduce((sum, s) => sum + durationHours(s.scheduled_start, s.scheduled_end), 0) ?? 0;

  const upcoming = shifts?.filter((s) => s.status === "scheduled" || s.status === "in_progress") ?? [];
  const nextShift =
    upcoming.length > 0
      ? upcoming.reduce((earliest, s) => (shiftDateTime(s) < shiftDateTime(earliest) ? s : earliest))
      : null;
  const otherShifts = shifts?.filter((s) => s.id !== nextShift?.id) ?? [];

  return (
    <div className="min-h-screen bg-paper">
      <WorkerTopBar />

      <main className="p-5 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold mb-1 mt-4">
          {greetingWord()}
          {worker ? `, ${worker.full_name}` : ""}
        </h1>
        <p className="text-sm text-ink/60 mb-5">Here&apos;s what&apos;s on your schedule.</p>

        {loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        )}

        {!loading && shifts && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-paper-raised border border-black/10 rounded-lg p-3">
              <CalendarClock className="w-4 h-4 text-teal-deep mb-2" />
              <p className="text-[11px] text-ink/55 mb-0.5">Shifts today</p>
              <p className="font-display text-lg font-bold">{shiftsToday}</p>
            </div>
            <div className="bg-paper-raised border border-black/10 rounded-lg p-3">
              <Clock className="w-4 h-4 text-teal-deep mb-2" />
              <p className="text-[11px] text-ink/55 mb-0.5">Hours this week</p>
              <p className="font-display text-lg font-bold">{hoursThisWeek.toFixed(1)}</p>
            </div>
            <div className="bg-paper-raised border border-black/10 rounded-lg p-3">
              <MessageCircle className="w-4 h-4 text-teal-deep mb-2" />
              <p className="text-[11px] text-ink/55 mb-0.5">Messages</p>
              <p className="font-display text-lg font-bold">{messageCount ?? "-"}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        )}

        {!loading && shifts && shifts.length === 0 && (
          <EmptyState
            icon={<CalendarClock className="w-5 h-5" />}
            title="No visits assigned"
            description="Check back once your agency schedules a shift for you."
          />
        )}

        {!loading && shifts && shifts.length > 0 && (
          <div className="space-y-4">
            {nextShift && (
              <ShiftCard
                shift={nextShift}
                highlight
                hasVisitId={Boolean(visitIds[nextShift.id])}
                busy={busyShiftId === nextShift.id}
                respondBusy={respondBusyId === nextShift.id}
                onStart={handleStart}
                onSaveNote={handleSaveNote}
                onEndClick={setEndModalShift}
                onOpenDetail={setDetailShift}
                onAccept={handleAccept}
                onDeclineClick={setDeclineShift}
              />
            )}

            {otherShifts.map((shift) => (
              <InteractiveCard key={shift.id}>
                <ShiftCard
                  shift={shift}
                  nested
                  hasVisitId={Boolean(visitIds[shift.id])}
                  busy={busyShiftId === shift.id}
                  respondBusy={respondBusyId === shift.id}
                  onStart={handleStart}
                  onSaveNote={handleSaveNote}
                  onEndClick={setEndModalShift}
                  onOpenDetail={setDetailShift}
                  onAccept={handleAccept}
                  onDeclineClick={setDeclineShift}
                />
              </InteractiveCard>
            ))}
          </div>
        )}
      </main>

      <ShiftDetailModal shift={detailShift} onClose={() => setDetailShift(null)} />

      <DeclineShiftModal
        open={declineShift !== null}
        submitting={declineSubmitting}
        onCancel={() => setDeclineShift(null)}
        onConfirm={handleDeclineConfirm}
      />

      <EndVisitModal
        open={endModalShift !== null}
        submitting={endSubmitting}
        onCancel={() => setEndModalShift(null)}
        onConfirm={handleEndConfirm}
      />
    </div>
  );
}
