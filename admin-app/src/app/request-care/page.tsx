"use client";

import { useState } from "react";
import PublicNav from "@/components/PublicNav";
import { apiFetch } from "@/lib/api";
import Button from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";

const CARE_TYPES = [
  "Mobility assistance",
  "Medication reminders",
  "Companionship",
  "Post-surgery recovery",
  "Dementia care",
  "Other",
];

const FREQUENCIES = ["Daily", "A few times a week", "Weekly", "Live-in", "Not sure yet"];

export default function RequestCarePage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [careTypes, setCareTypes] = useState<string[]>([]);
  const [form, setForm] = useState({
    requester_name: "",
    requester_relationship: "",
    requester_phone: "",
    requester_email: "",
    care_recipient_name: "",
    care_recipient_address: "",
    additional_notes: "",
    frequency: "",
    is_urgent: false,
  });

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCareType(type: string) {
    setCareTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/care-requests", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          care_type_summary: careTypes.length ? careTypes.join(", ") : null,
          additional_notes: form.additional_notes || null,
          frequency: form.frequency || null,
          honeypot,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper">
        <PublicNav />
        <section className="max-w-2xl mx-auto px-6 pt-24 pb-24">
          <p className="font-mono text-[11px] uppercase tracking-widest text-moss-deep mb-3">
            Request received
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight mb-5">
            Thank you for reaching out
          </h1>
          <p className="text-[15px] text-ink/65 leading-relaxed max-w-lg border-l-2 border-moss pl-5">
            We&apos;ve received your request and our team will be in touch soon. If this is urgent,
            please also feel free to call us directly.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <PublicNav />

      {/* MASTHEAD */}
      <section className="max-w-2xl mx-auto px-6 pt-16 sm:pt-20 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep mb-3">Care requests</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
          Request care
        </h1>
        <p className="text-[15px] text-ink/60 max-w-lg">
          Tell us a bit about who needs support, and our team will follow up to talk through next steps.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-24">
        <form onSubmit={handleSubmit}>
          {/* Honeypot: visually hidden off-screen (not display:none) so it stays in the accessibility
              tree but is invisible and untabbable to real visitors, while bots that auto-fill every
              input still catch it. */}
          <div
            style={{ position: "absolute", left: "-9999px", top: 0, width: 1, height: 1, overflow: "hidden" }}
            aria-hidden="true"
          >
            <label htmlFor="website">Leave this field empty</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* 01 Who's asking */}
          <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 pt-10 sm:pt-14 pb-10 sm:pb-14 border-t-2 border-ink">
            <p className="font-mono text-[13px] text-ink/30 pt-0.5">01</p>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep mb-5">
                Who&apos;s asking
              </p>
              <div className="space-y-4 max-w-md">
                <TextField
                  label="Your name"
                  required
                  value={form.requester_name}
                  onChange={(e) => updateField("requester_name", e.target.value)}
                  placeholder="Jane Smith"
                />
                <TextField
                  label="Relationship to the person needing care"
                  required
                  value={form.requester_relationship}
                  onChange={(e) => updateField("requester_relationship", e.target.value)}
                  placeholder="Daughter, son, spouse, friend..."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="Phone number"
                    type="tel"
                    required
                    value={form.requester_phone}
                    onChange={(e) => updateField("requester_phone", e.target.value)}
                    placeholder="07000000000"
                  />
                  <TextField
                    label="Email"
                    type="email"
                    required
                    value={form.requester_email}
                    onChange={(e) => updateField("requester_email", e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 02 Who needs care */}
          <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 py-10 sm:py-14 border-t border-black/10">
            <p className="font-mono text-[13px] text-ink/30 pt-0.5">02</p>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ochre-deep mb-5">
                Who needs care
              </p>
              <div className="space-y-4 max-w-md">
                <TextField
                  label="Their name"
                  required
                  value={form.care_recipient_name}
                  onChange={(e) => updateField("care_recipient_name", e.target.value)}
                  placeholder="John Smith"
                />
                <TextField
                  label="Their address"
                  required
                  value={form.care_recipient_address}
                  onChange={(e) => updateField("care_recipient_address", e.target.value)}
                  placeholder="15 Oxford Road, Oxford"
                />
              </div>
            </div>
          </div>

          {/* 03 What kind of care */}
          <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 py-10 sm:py-14 border-t border-black/10">
            <p className="font-mono text-[13px] text-ink/30 pt-0.5">03</p>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-moss-deep mb-5">
                What kind of care
              </p>
              <div className="max-w-md space-y-6">
                <div>
                  <p className="text-[13px] font-bold mb-3">What kind of support is needed</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CARE_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 text-[13.5px] text-ink/75">
                        <input
                          type="checkbox"
                          checked={careTypes.includes(type)}
                          onChange={() => toggleCareType(type)}
                          className="w-4 h-4 accent-teal"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <SelectField
                  label="How often is care needed"
                  value={form.frequency}
                  onChange={(e) => updateField("frequency", e.target.value)}
                >
                  <option value="">Select an option</option>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </SelectField>

                <TextAreaField
                  label="Anything else we should know"
                  rows={3}
                  value={form.additional_notes}
                  onChange={(e) => updateField("additional_notes", e.target.value)}
                  placeholder="Medical conditions, preferences, anything that helps us understand the situation"
                />

                <label className="flex items-center gap-2.5 text-[13.5px] font-bold text-brick-deep">
                  <input
                    type="checkbox"
                    checked={form.is_urgent}
                    onChange={(e) => updateField("is_urgent", e.target.checked)}
                    className="w-4 h-4 accent-brick"
                  />
                  This is urgent
                </label>
              </div>
            </div>
          </div>

          <div className="pl-16 sm:pl-27.5 pb-10">
            <div className="max-w-md">
              <Button type="submit" disabled={submitting} fullWidth>
                {submitting ? "Sending..." : "Send request"}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
