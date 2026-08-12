"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import ClientTopBar from "@/components/ClientTopBar";
import VisitCard from "@/components/VisitCard";
import InteractiveCard from "@/components/InteractiveCard";
import WorkerProfileView from "@/components/WorkerProfileView";
import RequestCareModal, { RequestCareFormData } from "@/components/RequestCareModal";
import Button from "@/components/ui/Button";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarClock, HeartHandshake } from "lucide-react";
import type { Shift } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function greetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function VisitsPage() {
  const router = useRouter();
  const showToast = useToast();

  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<{ full_name: string } | null>(null);
  const [ratedShiftIds, setRatedShiftIds] = useState<Set<string>>(new Set());
  const [ratingBusyShiftId, setRatingBusyShiftId] = useState<string | null>(null);
  const [profileShift, setProfileShift] = useState<Shift | null>(null);
  const [showRequestCare, setShowRequestCare] = useState(false);
  const [submittingCareRequest, setSubmittingCareRequest] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    apiFetch("/shifts/my-visits")
      .then((data) => setShifts(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load your visits");
      })
      .finally(() => setLoading(false));

    apiFetch("/clients/me")
      .then((data) => setClient(data))
      .catch(() => {
        // Silent - the greeting just omits the name if this fails.
      });
  }, [router, showToast]);

  async function handleRate(shift: Shift, stars: number) {
    setRatingBusyShiftId(shift.id);
    try {
      await apiFetch(`/ratings/shifts/${shift.id}`, {
        method: "POST",
        body: JSON.stringify({ stars }),
      });
      setRatedShiftIds((prev) => new Set(prev).add(shift.id));
      showToast("success", "Thanks for your feedback!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit your rating";
      // A shift already rated in an earlier session shows as unrated here too -
      // the backend doesn't expose per-shift rating status to a client, only the
      // "already rated" 400 on a second attempt, so that specific message is the
      // only signal we have to lock the UI back down. Any other failure (network,
      // validation) leaves the stars active so the client can just try again.
      if (message.toLowerCase().includes("already been rated")) {
        setRatedShiftIds((prev) => new Set(prev).add(shift.id));
      }
      showToast("danger", message);
    } finally {
      setRatingBusyShiftId(null);
    }
  }

  async function handleRequestCare(data: RequestCareFormData) {
    setSubmittingCareRequest(true);
    try {
      await apiFetch("/care-requests/mine", {
        method: "POST",
        body: JSON.stringify(data),
      });
      showToast("success", "Your request has been sent to the office.");
      setShowRequestCare(false);
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not send your request");
    } finally {
      setSubmittingCareRequest(false);
    }
  }

  const today = todayStr();
  const todayShifts = shifts?.filter((s) => s.scheduled_date === today) ?? [];
  const otherShifts = shifts?.filter((s) => s.scheduled_date !== today) ?? [];

  return (
    <div className="min-h-screen bg-paper">
      <ClientTopBar />

      <main className="p-5 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold mb-1 mt-4">
          {greetingWord()}
          {client ? `, ${client.full_name}` : ""}
        </h1>
        <p className="text-sm text-ink/60 mb-6">Today&apos;s visit and your full visit history.</p>

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
            title="No visits yet"
            description="Your scheduled and completed visits will show up here."
          />
        )}

        {!loading && todayShifts.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-bold text-ink/45 uppercase tracking-wide mb-2">Today</p>
            <div className="space-y-4">
              {todayShifts.map((shift) => (
                <VisitCard
                  key={shift.id}
                  shift={shift}
                  highlight
                  rated={ratedShiftIds.has(shift.id)}
                  ratingBusy={ratingBusyShiftId === shift.id}
                  onRate={handleRate}
                  onOpenProfile={setProfileShift}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && otherShifts.length > 0 && (
          <div>
            {todayShifts.length > 0 && (
              <p className="text-[11px] font-bold text-ink/45 uppercase tracking-wide mb-2">
                Past and upcoming
              </p>
            )}
            <div className="space-y-4">
              {otherShifts.map((shift) => (
                <InteractiveCard key={shift.id}>
                  <VisitCard
                    shift={shift}
                    nested
                    rated={ratedShiftIds.has(shift.id)}
                    ratingBusy={ratingBusyShiftId === shift.id}
                    onRate={handleRate}
                    onOpenProfile={setProfileShift}
                  />
                </InteractiveCard>
              ))}
            </div>
          </div>
        )}

        {!loading && (
          <div className="mt-6 bg-paper-raised border border-black/10 rounded-lg p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-teal/10 text-teal-deep flex items-center justify-center mx-auto mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <p className="font-display text-base font-bold mb-1">Need something more?</p>
            <p className="text-[13px] text-ink/60 mb-4">
              Request additional or different care and the office will follow up.
            </p>
            <Button onClick={() => setShowRequestCare(true)} className="min-h-[44px]">
              Request more care
            </Button>
          </div>
        )}
      </main>

      <RequestCareModal
        open={showRequestCare}
        submitting={submittingCareRequest}
        onClose={() => setShowRequestCare(false)}
        onSubmit={handleRequestCare}
      />

      <WorkerProfileView
        open={profileShift !== null}
        workerName={profileShift?.worker_name ?? ""}
        bio={null}
        phoneNumber={null}
        onClose={() => setProfileShift(null)}
      />
    </div>
  );
}
