"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import WorkerTopBar from "@/components/WorkerTopBar";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

export default function ChangePasswordPage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/auth/worker/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      showToast("success", "Password updated");
      router.push("/accept-terms");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <WorkerTopBar />

      <main className="p-5 max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-bold mb-1 mt-4">Change your password</h1>
        <p className="text-sm text-ink/60 mb-6">
          You&apos;re signing in for the first time. Set a new password to continue.
        </p>

        <form onSubmit={handleSubmit} className="bg-paper-raised border border-black/10 rounded-lg p-5">
          <div className="space-y-4">
            <TextField
              label="Current password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="min-h-[44px]"
            />
            <TextField
              label="New password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <Button type="submit" disabled={saving} fullWidth className="mt-6 min-h-[44px]">
            {saving ? "Saving..." : "Save and continue"}
          </Button>
        </form>
      </main>
    </div>
  );
}
