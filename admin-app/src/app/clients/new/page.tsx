"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import Button from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { ArrowLeft, Contact, HeartPulse, CheckCircle2, Mail, MailX } from "lucide-react";

type CreatedClientResult = {
  access_code: string;
  temporary_password: string;
  email_sent: boolean;
  client: { full_name: string };
};

function FormSectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-teal-deep mb-4">
      {icon}
      <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
    </div>
  );
}

export default function NewClientPage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CreatedClientResult | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    address: "",
    contact_number: "",
    emergency_contact: "",
    email: "",
    care_plan: "",
    special_instructions: "",
    risk_assessment: "",
    medical_notes: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify({ ...form, email: form.email || null }),
      });
      setResult(data);
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not save client");
    } finally {
      setSaving(false);
    }
  }

  // After creation, show the credentials instead of the form
  if (result) {
    return (
      <AdminShell>
        <main className="p-8 max-w-2xl">
          <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-moss-deep" />
              <h1 className="font-display text-xl font-bold">Client created</h1>
            </div>
            <p className="text-sm text-ink/60 mb-6">
              {result.client.full_name} can now sign in to the client app using either set of details below.
            </p>

            <div className="bg-ink text-paper-raised rounded-md p-5 mb-4">
              <p className="text-[12px] text-paper-raised/60 mb-1">Access code</p>
              <p className="font-mono text-lg mb-4">{result.access_code}</p>
              <p className="text-[12px] text-paper-raised/60 mb-1">Temporary password</p>
              <p className="font-mono text-lg">{result.temporary_password}</p>
            </div>

            {result.email_sent ? (
              <div className="flex items-center gap-2 text-[13px] text-moss-deep bg-moss/10 px-4 py-3 rounded-md mb-6">
                <Mail className="w-4 h-4" />
                These details were emailed automatically.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-ochre-deep bg-ochre/10 px-4 py-3 rounded-md mb-6">
                <MailX className="w-4 h-4" />
                Email was not sent. Copy the details above and share them manually.
              </div>
            )}

            <Button onClick={() => router.push("/clients")} fullWidth>
              Done, back to clients
            </Button>
          </div>
        </main>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <main className="p-8 max-w-2xl">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink/60 hover:text-ink mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to clients
        </Link>

        <h1 className="font-display text-2xl font-bold mb-1">Add a client</h1>
        <p className="text-sm text-ink/60 mb-8">Enter their details to create a new client profile.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
            <FormSectionHeading icon={<Contact className="w-4 h-4" />} title="Contact details" />
            <div className="space-y-4">
              <TextField
                label="Full name"
                required
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="John Smith"
              />
              <TextField
                label="Address"
                required
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="15 Oxford Road, Oxford"
              />
              <TextField
                label="Contact number"
                required
                value={form.contact_number}
                onChange={(e) => updateField("contact_number", e.target.value)}
                placeholder="07000000000"
              />
              <TextField
                label="Emergency contact"
                required
                value={form.emergency_contact}
                onChange={(e) => updateField("emergency_contact", e.target.value)}
                placeholder="Jane Smith - 07111111111"
              />
              <TextField
                label="Email (optional)"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="If provided, login credentials are emailed automatically"
              />
            </div>
          </div>

          <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
            <FormSectionHeading icon={<HeartPulse className="w-4 h-4" />} title="Care details" />
            <div className="space-y-4">
              <TextAreaField
                label="Care plan"
                value={form.care_plan}
                onChange={(e) => updateField("care_plan", e.target.value)}
                rows={2}
                placeholder="Daily welfare check and medication reminders"
              />
              <TextAreaField
                label="Special instructions"
                value={form.special_instructions}
                onChange={(e) => updateField("special_instructions", e.target.value)}
                rows={2}
                placeholder="Prefers morning visits"
              />
              <TextAreaField
                label="Risk assessment"
                value={form.risk_assessment}
                onChange={(e) => updateField("risk_assessment", e.target.value)}
                rows={2}
                placeholder="Low risk, mobility assistance needed"
              />
              <TextAreaField
                label="Medical notes"
                value={form.medical_notes}
                onChange={(e) => updateField("medical_notes", e.target.value)}
                rows={2}
                placeholder="Type 2 diabetes"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Saving..." : "Save client"}
          </Button>
        </form>
      </main>
    </AdminShell>
  );
}
