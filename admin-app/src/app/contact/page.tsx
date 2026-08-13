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

      {/* MASTHEAD */}
      <section className="max-w-2xl mx-auto px-6 pt-16 sm:pt-20 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep mb-3">Say hello</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
          Get in touch
        </h1>
        <p className="text-[15px] text-ink/60 max-w-lg">
          Questions about Bountiful Support Plus for your agency? Send us a message.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-24">
        {/* 01 Send a message */}
        <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 pt-10 sm:pt-14 pb-10 sm:pb-14 border-t-2 border-ink">
          <p className="font-mono text-[13px] text-ink/30 pt-0.5">01</p>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep mb-5">
              Send a message
            </p>
            <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
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
          </div>
        </div>

        {/* 02 Prefer to talk directly? */}
        <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 py-10 sm:py-14 border-t border-black/10">
          <p className="font-mono text-[13px] text-ink/30 pt-0.5">02</p>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ochre-deep mb-3">
              Prefer to talk directly?
            </p>
            <p className="text-[14px] text-ink/65 leading-relaxed max-w-xl mb-6">
              If filling out a form isn&apos;t your style, reach us directly on WhatsApp, by phone, or
              find us on Instagram - we&apos;re happy to talk it through.
            </p>

            <div className="max-w-md">
              <div className="flex items-baseline justify-between gap-4 py-3 border-b border-dotted border-black/25">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">WhatsApp</span>
                <a
                  href="https://wa.me/2348171723880"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-ink underline underline-offset-2 decoration-black/25 hover:text-teal-deep hover:decoration-teal-deep transition"
                >
                  +234 817 172 3880
                </a>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3 border-b border-dotted border-black/25">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">Phone</span>
                <a
                  href="tel:+2348033003861"
                  className="text-[14px] text-ink underline underline-offset-2 decoration-black/25 hover:text-teal-deep hover:decoration-teal-deep transition"
                >
                  +234 803 300 3861
                </a>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3 border-b border-dotted border-black/25">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">Instagram</span>
                <a
                  href="https://instagram.com/Bountifulsupport_plus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-ink underline underline-offset-2 decoration-black/25 hover:text-teal-deep hover:decoration-teal-deep transition"
                >
                  @Bountifulsupport_plus
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
