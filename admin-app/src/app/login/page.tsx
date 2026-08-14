"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveToken(data.access_token);
      router.push(data.must_change_password ? "/change-password" : "/dashboard");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Login failed");
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
          <h1 className="font-display text-xl font-bold mb-1">Admin sign in</h1>
          <p className="text-sm text-ink/60 mb-6">Enter your account details to continue.</p>

          <div className="space-y-4">
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" disabled={loading} fullWidth className="mt-6">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
