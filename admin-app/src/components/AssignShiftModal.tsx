"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";

export type ShiftFormData = {
  client_id: string;
  worker_id: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
};

const EMPTY_FORM: ShiftFormData = {
  client_id: "",
  worker_id: "",
  scheduled_date: "",
  scheduled_start: "",
  scheduled_end: "",
};

export default function AssignShiftModal({
  open,
  clients,
  workers,
  saving,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  clients: { id: string; full_name: string }[];
  workers: { id: string; full_name: string }[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (form: ShiftFormData) => void;
}) {
  const [form, setForm] = useState<ShiftFormData>(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-[fadein_0.2s_ease]"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-paper-raised rounded-xl px-7 py-7 w-full max-w-sm animate-[popin_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold mb-1">Assign a shift</h3>
        <p className="text-[13.5px] text-ink/65 leading-relaxed mb-5">
          Pick a client, a worker, and when the visit should happen.
        </p>

        <div className="space-y-4">
          <SelectField
            label="Client"
            required
            value={form.client_id}
            onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </SelectField>

          <SelectField
            label="Worker"
            required
            value={form.worker_id}
            onChange={(e) => setForm((p) => ({ ...p, worker_id: e.target.value }))}
          >
            <option value="">Select a worker</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.full_name}</option>
            ))}
          </SelectField>

          <TextField
            label="Date"
            type="date"
            required
            value={form.scheduled_date}
            onChange={(e) => setForm((p) => ({ ...p, scheduled_date: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Start time"
              type="time"
              required
              value={form.scheduled_start}
              onChange={(e) => setForm((p) => ({ ...p, scheduled_start: e.target.value }))}
            />
            <TextField
              label="End time"
              type="time"
              required
              value={form.scheduled_end}
              onChange={(e) => setForm((p) => ({ ...p, scheduled_end: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2.5 mt-6">
          <Button type="button" variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? "Assigning..." : "Assign shift"}
          </Button>
        </div>
      </form>
    </div>
  );
}
