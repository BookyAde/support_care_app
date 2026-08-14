"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

export default function ChangePasswordPage() {
  const router = useRouter();
  const showToast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("danger", "New passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      showToast("success", "Password changed");
      router.push("/dashboard");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal/10 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-ochre/10 blur-3xl"
        aria-hidden
      />

      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-8">
          <img src="/new_logo_lockup.png" alt="Bountiful Support Plus" className="h-12" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-paper-raised border border-black/10 rounded-lg p-7 shadow-sm"
        >
          <h1 className="font-display text-xl font-bold mb-1">Set a new password</h1>
          <p className="text-sm text-ink/60 mb-6">
            You&apos;re signing in with a temporary password - choose a new one to continue.
          </p>

          <div className="space-y-4">
            <TextField
              label="Current (temporary) password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your temporary password"
            />
            <TextField
              label="New password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose a new password"
            />
            <TextField
              label="Confirm new password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
            />
          </div>

          <Button type="submit" disabled={loading} fullWidth className="mt-6">
            {loading ? "Saving..." : "Set new password"}
          </Button>
        </form>
      </div>
    </main>
  );
}
