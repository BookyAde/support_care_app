"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { fieldInputClasses } from "@/components/ui/Field";
import Badge, { BadgeTone } from "@/components/ui/Badge";
import VisitNotesModal, { VisitNote } from "@/components/VisitNotesModal";
import { CheckCircle2, FileBarChart, Search, MessageSquareText } from "lucide-react";

type VisitReportRow = {
  shift_id: string;
  visit_id: string | null;
  worker_name: string;
  client_name: string;
  scheduled_date: string;
  shift_status: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  total_hours_worked: number | null;
  visit_status: string | null;
};

// Same status → tone mapping used on Shifts, so a status reads the same color everywhere in the app.
const SHIFT_STATUS_TONE: Record<string, BadgeTone> = {
  scheduled: "teal",
  in_progress: "ochre",
  completed: "moss",
  cancelled: "brick",
};

export default function ReportsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [rows, setRows] = useState<VisitReportRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [notesModalRow, setNotesModalRow] = useState<VisitReportRow | null>(null);
  const [visitNotes, setVisitNotes] = useState<VisitNote[] | null>(null);
  const [visitGps, setVisitGps] = useState<{
    gps_start_lat: number | null;
    gps_start_lng: number | null;
    gps_end_lat: number | null;
    gps_end_lng: number | null;
  } | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    apiFetch("/reports/visits")
      .then((data) => setRows(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load report");
      })
      .finally(() => setLoading(false));
  }, [router, showToast]);

  function formatTime(iso: string | null) {
    if (!iso) return "-";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function openNotes(row: VisitReportRow) {
    setNotesModalRow(row);
    setVisitNotes(null);
    setVisitGps(null);
    apiFetch(`/visits/${row.visit_id}`)
      .then((data) => {
        setVisitNotes(data.notes);
        setVisitGps({
          gps_start_lat: data.gps_start_lat,
          gps_start_lng: data.gps_start_lng,
          gps_end_lat: data.gps_end_lat,
          gps_end_lng: data.gps_end_lng,
        });
      })
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load visit notes");
        setNotesModalRow(null);
      });
  }

  const filteredRows = useMemo(() => {
    if (!rows) return rows;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.client_name.toLowerCase().includes(q) || row.worker_name.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <AdminShell>
      <main className="p-10 max-w-7xl">
        <div className="flex justify-between items-start mb-8 gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">Reports</h1>
            <p className="text-sm text-ink/60">Every visit, with hours worked, ready for payroll or review.</p>
          </div>
          {!loading && rows && rows.length > 0 && (
            <div className="relative w-56 shrink-0">
              <Search className="w-3.5 h-3.5 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search client or worker"
                className={`${fieldInputClasses} pl-8`}
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-paper-raised border border-black/10 rounded-lg p-5 space-y-3">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}

        {!loading && rows && rows.length === 0 && (
          <EmptyState
            icon={<FileBarChart className="w-5 h-5" />}
            title="No visits recorded yet"
            description="Reports will show up here once shifts are completed."
          />
        )}

        {!loading && rows && rows.length > 0 && (
          <div className="bg-paper-raised border border-black/10 rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="sticky top-14 lg:top-0 z-10 bg-black/5 border-b-2 border-black/10 text-left text-ink/50 text-[11.5px] uppercase tracking-wide">
                  <th className="px-5 py-3.5 font-bold">Client</th>
                  <th className="px-5 py-3.5 font-bold">Worker</th>
                  <th className="px-5 py-3.5 font-bold">Date</th>
                  <th className="px-5 py-3.5 font-bold font-mono">Start</th>
                  <th className="px-5 py-3.5 font-bold font-mono">End</th>
                  <th className="px-5 py-3.5 font-bold">Hours</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-ink/50">
                      No visits match &ldquo;{query}&rdquo;.
                    </td>
                  </tr>
                )}
                {filteredRows?.map((row) => (
                  <tr key={row.shift_id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition">
                    <td className="px-5 py-3.5 font-bold">{row.client_name}</td>
                    <td className="px-5 py-3.5">{row.worker_name}</td>
                    <td className="px-5 py-3.5 font-mono">{row.scheduled_date}</td>
                    <td className="px-5 py-3.5 font-mono">{formatTime(row.actual_start_time)}</td>
                    <td className="px-5 py-3.5 font-mono">{formatTime(row.actual_end_time)}</td>
                    <td className="px-5 py-3.5 font-mono">{row.total_hours_worked ?? "-"}</td>
                    <td className="px-5 py-3.5">
                      {row.visit_status === "completed" ? (
                        <Badge tone="moss" variant="solid" uppercase icon={<CheckCircle2 className="w-3 h-3" />}>
                          Completed
                        </Badge>
                      ) : (
                        <Badge tone={SHIFT_STATUS_TONE[row.shift_status] ?? "ochre"} variant="solid" uppercase>
                          {row.shift_status.replace("_", " ")}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {row.visit_id && (
                        <button
                          onClick={() => openNotes(row)}
                          title="View notes"
                          className="text-ink/50 hover:text-teal-deep transition p-1.5 -m-1.5 rounded-md hover:bg-teal/10"
                        >
                          <MessageSquareText className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <VisitNotesModal
        open={notesModalRow !== null}
        clientName={notesModalRow?.client_name ?? ""}
        workerName={notesModalRow?.worker_name ?? ""}
        notes={visitNotes}
        gpsStartLat={visitGps?.gps_start_lat ?? null}
        gpsStartLng={visitGps?.gps_start_lng ?? null}
        gpsEndLat={visitGps?.gps_end_lat ?? null}
        gpsEndLng={visitGps?.gps_end_lng ?? null}
        onClose={() => setNotesModalRow(null)}
      />
    </AdminShell>
  );
}
