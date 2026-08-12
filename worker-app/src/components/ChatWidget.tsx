"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import { fieldInputClasses } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { MessageCircle, Send, X } from "lucide-react";

type Message = {
  id: string;
  worker_id: string;
  sender_type: "admin" | "worker";
  body: string;
  is_broadcast: boolean;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

const OWN_SENDER_TYPE = "worker";
const MESSAGES_ENDPOINT = "/messages/mine";
const EDIT_WINDOW_MS = 15 * 60 * 1000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Every messages-state write goes through this - keyed by id via a Map, so a
// message present in both `existing` and `incoming` (e.g. the optimistic
// local copy from a just-sent message and that same message coming back from
// a poll tick's GET) collapses to one entry instead of appearing twice,
// regardless of which side "wins" the race. Sorted by created_at afterward
// so merge order never affects chronological display order.
function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const m of existing) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export default function ChatWidget() {
  const showToast = useToast();

  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const openRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages ?? [];
  }, [messages]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // The widget is mounted once in the root layout and is never remounted by
  // client-side navigation (App Router keeps a shared layout mounted across
  // route changes) - so a one-time check here would miss a token appearing
  // after login (still stuck showing nothing) or disappearing after sign-out
  // (still stuck polling with a now-invalid token). Re-verify on a short
  // recurring interval instead of just once, so the widget reacts correctly
  // to both transitions while mounted, not just at first paint.
  useEffect(() => {
    function checkAuth() {
      setAuthed(Boolean(getToken()));
    }
    checkAuth();
    const authInterval = setInterval(checkAuth, 2000);
    return () => clearInterval(authInterval);
  }, []);

  useEffect(() => {
    if (!authed) return;
    apiFetch(MESSAGES_ENDPOINT)
      .then((data) => setMessages((prev) => mergeMessages(prev ?? [], data)))
      .catch(() => {
        // Silent - the widget just starts empty if this fails.
      })
      .finally(() => setLoading(false));
  }, [authed]);

  // Same 5s polling cadence as the page this widget replaces. Uses refs for the
  // current message list and open/closed state so this one long-lived interval
  // (mounted once for the whole session) never reads stale closures.
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      if (!getToken()) {
        // Token disappeared (sign-out) since this interval was created -
        // stop polling on this very tick instead of waiting for the separate
        // auth-check interval above to notice and tear this one down.
        setAuthed(false);
        clearInterval(interval);
        return;
      }
      apiFetch(MESSAGES_ENDPOINT)
        .then((data: Message[]) => {
          const current = messagesRef.current;
          const currentIds = new Set(current.map((m) => m.id));
          const incoming = data.filter((m) => !currentIds.has(m.id) && m.sender_type !== OWN_SENDER_TYPE);

          if (incoming.length > 0 && !openRef.current) {
            for (const m of incoming) {
              const preview = m.body.length > 50 ? `${m.body.slice(0, 50)}...` : m.body;
              showToast("success", `New message from the office: ${preview}`, () => setOpen(true));
            }
            setUnreadCount((c) => c + incoming.length);
            setBouncing(true);
            setTimeout(() => setBouncing(false), 600);
          }

          const merged = mergeMessages(current, data);
          if (merged.length !== current.length) {
            setMessages(merged);
          }
        })
        .catch(() => {
          // Silent - a failed background refresh shouldn't interrupt the worker.
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [authed, showToast]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ block: "end" });
      setUnreadCount(0);
    }
  }, [open, messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const message = await apiFetch(MESSAGES_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages((prev) => mergeMessages(prev ?? [], [message]));
      setDraft("");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not send the message");
    } finally {
      setSending(false);
    }
  }

  function startEdit(m: Message) {
    setEditingId(m.id);
    setEditDraft(m.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function saveEdit(messageId: string) {
    const body = editDraft.trim();
    if (!body) return;
    setEditSaving(true);
    try {
      const updated = await apiFetch(`/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
      setMessages((prev) => mergeMessages(prev ?? [], [updated]));
      setEditingId(null);
      setEditDraft("");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not edit the message");
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const messageId = deleteTarget.id;
    setDeleting(true);
    try {
      await apiFetch(`/messages/${messageId}`, { method: "DELETE" });
      // DELETE returns 204 with no body - set deleted_at locally rather than
      // refetching, matching the timestamp the server just applied closely enough.
      setMessages((prev) =>
        (prev ?? []).map((m) => (m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m))
      );
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not delete the message");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (!authed) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open chat with the office"
        className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-teal to-teal-deep shadow-lg flex items-center justify-center text-white ${
          bouncing ? "animate-[bubblebounce_0.6s_ease-out]" : ""
        }`}
      >
        <span className="absolute inset-0 rounded-full bg-teal animate-[pulsering_2.4s_ease-out_infinite]" aria-hidden />
        <MessageCircle className="w-6 h-6 relative" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-brick text-white text-[11px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 animate-[fadein_0.2s_ease]"
          onClick={() => setOpen(false)}
        >
          <div
            className="fixed inset-x-0 bottom-0 bg-paper rounded-t-3xl shadow-xl flex flex-col max-h-[85vh] animate-[slideup_0.3s_cubic-bezier(0.34,1.56,0.64,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-black/15" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3 border-b border-black/10 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
                  <p className="font-display text-base font-bold">The Office</p>
                </div>
                <p className="text-[12px] text-ink/50">Bountiful Support Plus</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink/50 hover:text-ink rounded-md hover:bg-black/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
              {loading && (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-2/3" />
                  <Skeleton className="h-12 w-1/2 ml-auto" />
                  <Skeleton className="h-12 w-2/3" />
                </div>
              )}

              {!loading && messages && messages.length === 0 && (
                <EmptyState
                  icon={<MessageCircle className="w-5 h-5" />}
                  title="No messages yet"
                  description="Send a message to reach the office."
                />
              )}

              {!loading &&
                messages &&
                messages.map((m) => {
                  const isOwn = m.sender_type === OWN_SENDER_TYPE;
                  const isDeleted = Boolean(m.deleted_at);
                  const isEditable =
                    isOwn && !isDeleted && Date.now() - new Date(m.created_at).getTime() < EDIT_WINDOW_MS;
                  const isEditingThis = editingId === m.id;

                  return (
                    <div key={m.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 text-[13.5px] leading-relaxed ${
                          isOwn
                            ? "bg-teal text-white rounded-2xl rounded-br-md"
                            : "bg-paper-raised border border-black/10 rounded-2xl rounded-bl-md"
                        }`}
                      >
                        {isEditingThis ? (
                          <div className="space-y-2">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={2}
                              autoFocus
                              className="w-full bg-white text-ink rounded-md px-2 py-1.5 text-[13.5px] focus:outline-none"
                            />
                            <div className="flex gap-3 justify-end">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="text-[11px] font-bold text-white/70 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEdit(m.id)}
                                disabled={editSaving || !editDraft.trim()}
                                className="text-[11px] font-bold text-white hover:text-white/80 disabled:opacity-50"
                              >
                                {editSaving ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {m.is_broadcast && (
                              <Badge tone="ochre" uppercase>
                                Announcement
                              </Badge>
                            )}
                            <p className={`${m.is_broadcast ? "mt-1.5" : ""} ${isDeleted ? "italic opacity-60" : ""}`}>
                              {isDeleted ? "This message was deleted" : m.body}
                            </p>
                            <p
                              className={`text-[10.5px] mt-1 flex items-center gap-1.5 ${
                                isOwn ? "text-white/60" : "text-ink/45"
                              }`}
                            >
                              {formatTime(m.created_at)}
                              {m.edited_at && !isDeleted && <span className="italic">(edited)</span>}
                            </p>
                          </>
                        )}
                      </div>

                      {isEditable && !isEditingThis && (
                        <div className="flex gap-3 mt-1 px-1">
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="text-[11px] font-bold text-ink/40 hover:text-ink/70 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(m)}
                            className="text-[11px] font-bold text-ink/40 hover:text-brick-deep transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-black/10 shrink-0">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                className={`${fieldInputClasses} min-h-[44px]`}
              />
              <Button
                type="submit"
                disabled={sending || !draft.trim()}
                className="min-h-[44px]"
                icon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        emoji="🗑️"
        tone="danger"
        title="Delete this message?"
        body="This can't be undone. The message will show as deleted in the conversation, not removed entirely."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        confirmTone="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
