"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import Button from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Contact, HeartPulse } from "lucide-react";

function FormSectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-teal-deep mb-4">
      {icon}
      <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
    </div>
  );
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const showToast = useToast();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    address: "",
    contact_number: "",
    emergency_contact: "",
    care_plan: "",
    special_instructions: "",
    risk_assessment: "",
    medical_notes: "",
  });

  useEffect(() => {
    apiFetch(`/clients/${clientId}`)
      .then((data) =>
        setForm({
          full_name: data.full_name || "",
          address: data.address || "",
          contact_number: data.contact_number || "",
          emergency_contact: data.emergency_contact || "",
          care_plan: data.care_plan || "",
          special_instructions: data.special_instructions || "",
          risk_assessment: data.risk_assessment || "",
          medical_notes: data.medical_notes || "",
        })
      )
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load client");
      })
      .finally(() => setLoading(false));
  }, [clientId, showToast]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      showToast("success", "Client updated");
      router.push("/clients");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <main className="p-8 max-w-2xl">
          <Skeleton className="w-32 h-4 mb-4" />
          <Skeleton className="w-48 h-7 mb-1.5" />
          <Skeleton className="w-64 h-4 mb-8" />
          <div className="bg-paper-raised border border-black/10 rounded-lg p-6 space-y-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
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

        <h1 className="font-display text-2xl font-bold mb-1">Edit client</h1>
        <p className="text-sm text-ink/60 mb-8">Update {form.full_name}&apos;s details.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
            <FormSectionHeading icon={<Contact className="w-4 h-4" />} title="Contact details" />
            <div className="space-y-4">
              <TextField
                label="Full name"
                required
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
              />
              <TextField
                label="Address"
                required
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
              <TextField
                label="Contact number"
                required
                value={form.contact_number}
                onChange={(e) => updateField("contact_number", e.target.value)}
              />
              <TextField
                label="Emergency contact"
                required
                value={form.emergency_contact}
                onChange={(e) => updateField("emergency_contact", e.target.value)}
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
              />
              <TextAreaField
                label="Special instructions"
                value={form.special_instructions}
                onChange={(e) => updateField("special_instructions", e.target.value)}
                rows={2}
              />
              <TextAreaField
                label="Risk assessment"
                value={form.risk_assessment}
                onChange={(e) => updateField("risk_assessment", e.target.value)}
                rows={2}
              />
              <TextAreaField
                label="Medical notes"
                value={form.medical_notes}
                onChange={(e) => updateField("medical_notes", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </main>
    </AdminShell>
  );
}
