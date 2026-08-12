"use client";

import { Radio } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export type Person = { id: string; full_name: string };
type Message = { id: string; sender_type: string; body: string };
export type ThreadTab = "workers" | "clients";

export default function PersonThreadList({
  activeTab,
  onTabChange,
  subtitle,
  people,
  selectedPersonId,
  threadsByPerson,
  loading,
  onSelect,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  broadcast,
}: {
  activeTab: ThreadTab;
  onTabChange: (tab: ThreadTab) => void;
  subtitle: string;
  people: Person[];
  selectedPersonId: string | null;
  threadsByPerson: Record<string, Message[]>;
  loading: boolean;
  onSelect: (person: Person) => void;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  /** Only the Workers tab passes this - "Broadcast to all workers" has no
   * clients equivalent per spec, so this is omitted entirely on that tab. */
  broadcast?: { label: string; onClick: () => void };
}) {
  return (
    <div className="lg:w-80 shrink-0 lg:border-r border-black/10 h-full overflow-y-auto">
      <div className="p-5 border-b border-black/10">
        <h1 className="font-display text-xl font-bold mb-1">Messages</h1>
        <p className="text-[13px] text-ink/60 mb-3">{subtitle}</p>

        <div className="grid grid-cols-2 gap-2 mb-3 bg-black/5 rounded-md p-1">
          <button
            type="button"
            onClick={() => onTabChange("workers")}
            className={`py-2 rounded-md text-[12.5px] font-bold transition ${
              activeTab === "workers" ? "bg-teal text-white" : "text-ink/60"
            }`}
          >
            Workers
          </button>
          <button
            type="button"
            onClick={() => onTabChange("clients")}
            className={`py-2 rounded-md text-[12.5px] font-bold transition ${
              activeTab === "clients" ? "bg-teal text-white" : "text-ink/60"
            }`}
          >
            Clients
          </button>
        </div>

        {broadcast && (
          <button onClick={broadcast.onClick} className={buttonClasses({ size: "sm", fullWidth: true })}>
            <Radio className="w-3.5 h-3.5" />
            {broadcast.label}
          </button>
        )}
      </div>

      {loading && (
        <div className="p-4 space-y-3">
          <ListRowSkeleton />
          <ListRowSkeleton />
        </div>
      )}

      {!loading && people.length === 0 && (
        <div className="p-5">
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        </div>
      )}

      {!loading &&
        people.map((person) => {
          const thread = threadsByPerson[person.id];
          const last = thread && thread.length > 0 ? thread[thread.length - 1] : null;
          const isActive = person.id === selectedPersonId;

          return (
            <button
              key={person.id}
              onClick={() => onSelect(person)}
              className={`w-full text-left px-5 py-4 border-b border-black/5 transition ${
                isActive ? "bg-teal/10" : "hover:bg-teal/5"
              }`}
            >
              <p className="font-display text-[14px] font-bold mb-0.5">{person.full_name}</p>
              <p className="text-[12.5px] text-ink/55 truncate">
                {last ? `${last.sender_type === "admin" ? "You: " : ""}${last.body}` : "No messages yet"}
              </p>
            </button>
          );
        })}
    </div>
  );
}
