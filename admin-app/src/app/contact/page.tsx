"use client";

import { useState } from "react";
import PublicNav from "@/components/PublicNav";
import { useToast } from "@/components/ToastProvider";
import { apiFetch } from "@/lib/api";
import Button from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";

export default function ContactPage() {
  const showToast = useToast();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      // email_sent is intentionally not checked here - a visitor doesn't need
      // to know about internal delivery issues, they still get the warm
      // confirmation either way. See report for the admin-visibility follow-up.
      await apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      showToast("success", "Thanks, we'll be in touch soon.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not send your message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <PublicNav />

      <section className="max-w-lg mx-auto px-6 pt-16 pb-20">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold mb-4">Get in touch</h1>
          <p className="text-[15px] text-ink/65">
            Questions about Bountiful Support Plus for your agency? Send us a message.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-paper-raised border border-black/10 rounded-lg p-6 space-y-4"
        >
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Jane Smith"
          />
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="name@agency.com"
          />
          <TextAreaField
            label="Message"
            required
            rows={4}
            value={form.message}
            onChange={(e) => updateField("message", e.target.value)}
            placeholder="Tell us a bit about your agency and what you need."
          />

          <Button type="submit" disabled={sending} fullWidth>
            {sending ? "Sending..." : "Send message"}
          </Button>
        </form>
      </section>
    </div>
  );
}
