"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import InteractiveCard from "@/components/InteractiveCard";
import { Skeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import {
  Users,
  UserCheck,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  WifiOff,
} from "lucide-react";

type DashboardStats = {
  total_clients: number;
  active_workers: number;
  scheduled_visits: number;
  completed_visits: number;
  missed_visits: number;
  hours_delivered: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const showToast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    apiFetch("/reports/dashboard")
      .then((data) => setStats(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load dashboard");
      })
      .finally(() => setLoading(false));
  }, [router, showToast]);

  return (
    <AdminShell>
      <main className="p-10 max-w-7xl">
        <h1 className="font-display text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-ink/60 mb-8">A live snapshot across every client and worker.</p>

        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>
        )}

        {!loading && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative bg-ink bg-gradient-to-br from-transparent to-white/10 text-paper-raised rounded-xl p-6 overflow-hidden shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute top-4 right-4 w-11 h-11 rounded-full border-2 border-moss flex items-center justify-center rotate-[-11deg] bg-paper-raised/5">
                  <CheckCircle2 className="w-5 h-5 text-moss" strokeWidth={2.5} />
                </div>
                <p className="text-[13px] text-paper-raised/60 mb-2">Completed visits</p>
                <p className="font-display text-5xl font-bold">{stats.completed_visits}</p>
                <p className="text-[12px] text-paper-raised/50 mt-2">
                  Every one GPS-logged and note-verified
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-deep to-teal text-paper-raised rounded-xl p-6 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-paper-raised/70" />
                  <p className="text-[13px] text-paper-raised/70">Hours delivered</p>
                </div>
                <p className="font-display text-5xl font-bold">{stats.hours_delivered}</p>
                <p className="text-[12px] text-paper-raised/50 mt-2">
                  Calculated automatically from real check-in and check-out times
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-4 h-4" />} label="Total clients" value={stats.total_clients} tone="teal" />
              <StatCard icon={<UserCheck className="w-4 h-4" />} label="Active workers" value={stats.active_workers} tone="teal" />
              <StatCard icon={<CalendarClock className="w-4 h-4" />} label="Scheduled" value={stats.scheduled_visits} tone="ochre" />
              <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Missed" value={stats.missed_visits} tone="brick" />
            </div>
          </div>
        )}

        {!loading && !stats && (
          <EmptyState
            icon={<WifiOff className="w-5 h-5" />}
            title="Could not load dashboard"
            description="Check that the backend is running and try refreshing the page."
          />
        )}
      </main>
    </AdminShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "teal" | "ochre" | "moss" | "brick";
}) {
  const toneStyles: Record<string, { text: string; chip: string; border: string; glow: string }> = {
    teal: { text: "text-teal-deep", chip: "bg-teal", border: "border-teal!", glow: "rgba(11,107,114,0.16)" },
    ochre: { text: "text-ochre-deep", chip: "bg-ochre", border: "border-ochre!", glow: "rgba(201,138,46,0.16)" },
    moss: { text: "text-moss-deep", chip: "bg-moss", border: "border-moss!", glow: "rgba(63,122,50,0.16)" },
    brick: { text: "text-brick-deep", chip: "bg-brick", border: "border-brick!", glow: "rgba(194,59,46,0.16)" },
  };
  const style = toneStyles[tone];

  return (
    <InteractiveCard glowColor={style.glow} className={`p-4 ${style.border}`}>
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 ${style.chip} text-white`}>
        {icon}
      </div>
      <p className="text-[12.5px] text-ink/60 mb-0.5">{label}</p>
      <p className={`font-display text-3xl font-bold ${style.text}`}>{value}</p>
    </InteractiveCard>
  );
}
