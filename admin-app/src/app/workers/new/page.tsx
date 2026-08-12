"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import AdminShell from "@/components/AdminShell";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { ArrowLeft, CheckCircle2, Mail, MailX } from "lucide-react";

type CreatedWorkerResult = {
  employee_id: string;
  temporary_password: string;
  email_sent: boolean;
  worker: { full_name: string };
};

export default function NewWorkerPage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CreatedWorkerResult | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await apiFetch("/workers", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, email: email || null }),
      });
      setResult(data);
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not create worker");
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
              <h1 className="font-display text-xl font-bold">Worker created</h1>
            </div>
            <p className="text-sm text-ink/60 mb-6">
              {result.worker.full_name} can now sign in to the worker app using either set of details below.
            </p>

            <div className="bg-ink text-paper-raised rounded-md p-5 mb-4">
              <p className="text-[12px] text-paper-raised/60 mb-1">Employee ID</p>
              <p className="font-mono text-lg mb-4">{result.employee_id}</p>
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

            <Button onClick={() => router.push("/workers")} fullWidth>
              Done, back to workers
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
          href="/workers"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink/60 hover:text-ink mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to workers
        </Link>

        <h1 className="font-display text-2xl font-bold mb-1">Add a worker</h1>
        <p className="text-sm text-ink/60 mb-8">
          The system generates their Employee ID and a temporary password automatically.
        </p>

        <form onSubmit={handleSubmit} className="bg-paper-raised border border-black/10 rounded-lg p-6">
          <div className="space-y-4">
            <TextField
              label="Full name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sarah Johnson"
            />
            <TextField
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="If provided, credentials are emailed automatically"
            />
          </div>

          <Button type="submit" disabled={saving} fullWidth className="mt-6">
            {saving ? "Creating..." : "Create worker"}
          </Button>
        </form>
      </main>
    </AdminShell>
  );
}
