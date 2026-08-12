"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import PersonThreadList, { Person, ThreadTab } from "@/components/PersonThreadList";
import MessageThread from "@/components/MessageThread";
import BroadcastModal from "@/components/BroadcastModal";
import { UserCog, Users } from "lucide-react";

type Worker = { id: string; full_name: string; employee_id: string };
type Client = { id: string; full_name: string; access_code: string };
type Message = {
  id: string;
  sender_type: "admin" | "worker" | "client";
  body: string;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export default function MessagesPage() {
  const router = useRouter();
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState<ThreadTab>("workers");

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [threadsByWorker, setThreadsByWorker] = useState<Record<string, Message[]>>({});
  const [threadsByClient, setThreadsByClient] = useState<Record<string, Message[]>>({});

  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // Mirrors of the two thread maps, kept in sync via effects below - read from
  // inside the poll interval instead of the state directly, so detecting
  // "what's newly incoming" never fires showToast() from inside a setState
  // updater (which can run more than once and duplicate the toast).
  const threadsByWorkerRef = useRef<Record<string, Message[]>>({});
  const threadsByClientRef = useRef<Record<string, Message[]>>({});

  useEffect(() => {
    threadsByWorkerRef.current = threadsByWorker;
  }, [threadsByWorker]);

  useEffect(() => {
    threadsByClientRef.current = threadsByClient;
  }, [threadsByClient]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    apiFetch("/workers")
      .then((data) => setWorkers(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load workers");
      })
      .finally(() => setLoadingWorkers(false));

    apiFetch("/clients")
      .then((data) => setClients(data))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load clients");
      })
      .finally(() => setLoadingClients(false));
  }, [router, showToast]);

  function selectWorker(person: Person) {
    const worker = workers.find((w) => w.id === person.id);
    if (!worker) return;
    setSelectedWorker(worker);

    // Fire-and-forget: marks this thread read immediately on open so its
    // contribution to the sidebar badge clears on AdminShell's next poll.
    // Best-effort - a failure here shouldn't block viewing the thread itself.
    apiFetch(`/messages/worker/${worker.id}/mark-read`, { method: "POST" }).catch(() => {});

    if (threadsByWorker[worker.id]) return;

    setLoadingThread(true);
    apiFetch(`/messages/worker/${worker.id}`)
      .then((data) => setThreadsByWorker((prev) => ({ ...prev, [worker.id]: data })))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load messages");
      })
      .finally(() => setLoadingThread(false));
  }

  function selectClient(person: Person) {
    const client = clients.find((c) => c.id === person.id);
    if (!client) return;
    setSelectedClient(client);

    apiFetch(`/messages/client/${client.id}/mark-read`, { method: "POST" }).catch(() => {});

    if (threadsByClient[client.id]) return;

    setLoadingThread(true);
    apiFetch(`/messages/client/${client.id}`)
      .then((data) => setThreadsByClient((prev) => ({ ...prev, [client.id]: data })))
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load messages");
      })
      .finally(() => setLoadingThread(false));
  }

  // Polls whichever thread is currently open (worker or client, matching the
  // active tab) every 5s - same cadence as before. Also detects genuinely new
  // incoming messages (from the worker/client, never the admin's own
  // just-sent ones) and toasts about them, the same suppression pattern
  // already proven in worker-app/client-app's ChatWidget.
  useEffect(() => {
    const person = activeTab === "workers" ? selectedWorker : selectedClient;
    if (!person) return;

    const endpoint =
      activeTab === "workers" ? `/messages/worker/${person.id}` : `/messages/client/${person.id}`;

    const interval = setInterval(() => {
      apiFetch(endpoint)
        .then((data: Message[]) => {
          const ref = activeTab === "workers" ? threadsByWorkerRef : threadsByClientRef;
          const current = ref.current[person.id] ?? [];
          if (data.length === current.length) return;

          const currentIds = new Set(current.map((m) => m.id));
          const incoming = data.filter((m) => !currentIds.has(m.id) && m.sender_type !== "admin");
          for (const m of incoming) {
            const preview = m.body.length > 50 ? `${m.body.slice(0, 50)}...` : m.body;
            showToast("success", `New message from ${person.full_name}: ${preview}`);
          }

          const setThreads = activeTab === "workers" ? setThreadsByWorker : setThreadsByClient;
          setThreads((prev) => ({ ...prev, [person.id]: data }));
        })
        .catch(() => {
          // Silent - a failed background refresh shouldn't interrupt the admin with a toast.
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, selectedWorker, selectedClient, showToast]);

  async function handleSend(body: string) {
    if (activeTab === "workers") {
      if (!selectedWorker) return;
      setSending(true);
      try {
        const message = await apiFetch(`/messages/worker/${selectedWorker.id}`, {
          method: "POST",
          body: JSON.stringify({ body }),
        });
        setThreadsByWorker((prev) => ({
          ...prev,
          [selectedWorker.id]: [...(prev[selectedWorker.id] ?? []), message],
        }));
      } catch (err) {
        showToast("danger", err instanceof Error ? err.message : "Could not send the message");
      } finally {
        setSending(false);
      }
    } else {
      if (!selectedClient) return;
      setSending(true);
      try {
        const message = await apiFetch(`/messages/client/${selectedClient.id}`, {
          method: "POST",
          body: JSON.stringify({ body }),
        });
        setThreadsByClient((prev) => ({
          ...prev,
          [selectedClient.id]: [...(prev[selectedClient.id] ?? []), message],
        }));
      } catch (err) {
        showToast("danger", err instanceof Error ? err.message : "Could not send the message");
      } finally {
        setSending(false);
      }
    }
  }

  function updateMessageInSelectedThread(messageId: string, updater: (m: Message) => Message) {
    if (activeTab === "workers" && selectedWorker) {
      setThreadsByWorker((prev) => ({
        ...prev,
        [selectedWorker.id]: (prev[selectedWorker.id] ?? []).map((m) => (m.id === messageId ? updater(m) : m)),
      }));
    } else if (activeTab === "clients" && selectedClient) {
      setThreadsByClient((prev) => ({
        ...prev,
        [selectedClient.id]: (prev[selectedClient.id] ?? []).map((m) => (m.id === messageId ? updater(m) : m)),
      }));
    }
  }

  async function handleEditMessage(messageId: string, body: string) {
    try {
      const updated = await apiFetch(`/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
      updateMessageInSelectedThread(messageId, () => updated);
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not edit the message");
    }
  }

  async function handleDeleteMessage(messageId: string) {
    try {
      await apiFetch(`/messages/${messageId}`, { method: "DELETE" });
      // DELETE returns 204 with no body - set deleted_at locally rather than
      // refetching, matching the timestamp the server just applied closely enough.
      updateMessageInSelectedThread(messageId, (m) => ({ ...m, deleted_at: new Date().toISOString() }));
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not delete the message");
    }
  }

  async function handleBroadcast(body: string) {
    setBroadcasting(true);
    try {
      const result = await apiFetch("/messages/broadcast", {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      showToast("success", `Sent to ${result.sent_to} worker${result.sent_to === 1 ? "" : "s"}`);
      setShowBroadcast(false);
      setThreadsByWorker({});
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not send the broadcast");
    } finally {
      setBroadcasting(false);
    }
  }

  const selectedPerson = activeTab === "workers" ? selectedWorker : selectedClient;
  const threadPerson: { id: string; full_name: string; secondaryLabel: string } | null =
    activeTab === "workers"
      ? selectedWorker
        ? { id: selectedWorker.id, full_name: selectedWorker.full_name, secondaryLabel: selectedWorker.employee_id }
        : null
      : selectedClient
        ? { id: selectedClient.id, full_name: selectedClient.full_name, secondaryLabel: selectedClient.access_code }
        : null;
  const threadMessages = selectedPerson
    ? (activeTab === "workers" ? threadsByWorker[selectedPerson.id] : threadsByClient[selectedPerson.id]) ?? []
    : [];

  return (
    <AdminShell>
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col lg:flex-row overflow-hidden">
        <div className={selectedPerson ? "hidden lg:flex lg:flex-col h-full" : "flex flex-col h-full"}>
          <PersonThreadList
            activeTab={activeTab}
            onTabChange={setActiveTab}
            subtitle={
              activeTab === "workers" ? "Two-way messages with your workers." : "Two-way messages with your clients."
            }
            people={activeTab === "workers" ? workers : clients}
            selectedPersonId={selectedPerson?.id ?? null}
            threadsByPerson={activeTab === "workers" ? threadsByWorker : threadsByClient}
            loading={activeTab === "workers" ? loadingWorkers : loadingClients}
            onSelect={activeTab === "workers" ? selectWorker : selectClient}
            emptyIcon={activeTab === "workers" ? <UserCog className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            emptyTitle={activeTab === "workers" ? "No workers yet" : "No clients yet"}
            emptyDescription={
              activeTab === "workers"
                ? "Add a worker first to start messaging them."
                : "Add a client first to start messaging them."
            }
            broadcast={activeTab === "workers" ? { label: "Broadcast to all workers", onClick: () => setShowBroadcast(true) } : undefined}
          />
        </div>

        <div className={selectedPerson ? "flex flex-1 min-w-0 h-full" : "hidden lg:flex flex-1 min-w-0 h-full"}>
          <MessageThread
            person={threadPerson}
            messages={threadMessages}
            loading={loadingThread}
            sending={sending}
            onSend={handleSend}
            onBack={() => (activeTab === "workers" ? setSelectedWorker(null) : setSelectedClient(null))}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
          />
        </div>
      </div>

      <BroadcastModal
        open={showBroadcast}
        sending={broadcasting}
        onCancel={() => setShowBroadcast(false)}
        onSend={handleBroadcast}
      />
    </AdminShell>
  );
}
