"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { fieldInputClasses } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

type Person = { id: string; full_name: string; secondaryLabel: string };
type Message = {
  id: string;
  sender_type: string;
  body: string;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageThread({
  person,
  messages,
  loading,
  sending,
  onSend,
  onBack,
  onEdit,
  onDelete,
}: {
  person: Person | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  onSend: (body: string) => Promise<void>;
  onBack: () => void;
  /** Both role-agnostic per the backend's get_current_actor design - the admin
   * calling these edits/deletes their own ("sender_type === admin") messages. */
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (!person) {
    return (
      <div className="hidden lg:flex flex-1 h-full items-center justify-center">
        <EmptyState
          icon={<MessageCircle className="w-5 h-5" />}
          title="Select a conversation"
          description="Choose someone from the list to view or send messages."
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await onSend(body);
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
      await onEdit(messageId, body);
      setEditingId(null);
      setEditDraft("");
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <div className="flex items-center gap-3 p-4 border-b border-black/10 shrink-0">
        <button onClick={onBack} className="lg:hidden p-1 -ml-1 text-ink/60 hover:text-ink">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display text-[15px] font-bold">{person.full_name}</p>
          <p className="text-[12px] text-ink/50 font-mono">{person.secondaryLabel}</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-1.5 shrink-0" title="Refreshing automatically every 5s">
            <span className="w-1.5 h-1.5 rounded-full bg-moss animate-pulse" />
            <span className="text-[11px] font-bold text-ink/45 uppercase tracking-wide">Live</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end space-y-3">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-1/2 ml-auto" />
            <Skeleton className="h-12 w-2/3" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <EmptyState
            icon={<MessageCircle className="w-5 h-5" />}
            title="No messages yet"
            description="Send the first message to start the conversation."
          />
        )}

        {!loading &&
          messages.map((m) => {
            const isOwnAdmin = m.sender_type === "admin";
            const isDeleted = Boolean(m.deleted_at);
            const isEditable =
              isOwnAdmin && !isDeleted && Date.now() - new Date(m.created_at).getTime() < EDIT_WINDOW_MS;
            const isEditingThis = editingId === m.id;

            return (
              <div key={m.id} className={`flex flex-col ${isOwnAdmin ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2.5 text-[13.5px] leading-relaxed ${
                    isOwnAdmin ? "bg-teal text-white" : "bg-paper-raised border border-black/10"
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
                      <p className={isDeleted ? "italic opacity-60" : ""}>
                        {isDeleted ? "This message was deleted" : m.body}
                      </p>
                      <p
                        className={`text-[10.5px] mt-1 flex items-center gap-1.5 ${
                          isOwnAdmin ? "text-white/60" : "text-ink/45"
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

      <form onSubmit={handleSubmit} className="p-4 border-t border-black/10 flex gap-2 shrink-0">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className={fieldInputClasses}
        />
        <Button type="submit" disabled={sending || !draft.trim()} icon={<Send className="w-4 h-4" />}>
          Send
        </Button>
      </form>

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
    </div>
  );
}
