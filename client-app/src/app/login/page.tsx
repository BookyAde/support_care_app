"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

type LoginMode = "access_code" | "email";

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("access_code");
  const [accessCode, setAccessCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body =
        mode === "access_code"
          ? { access_code: accessCode, password }
          : { email, password };

      const data = await apiFetch("/auth/client/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      saveToken(data.access_token);
      router.push(data.must_change_password ? "/change-password" : "/visits");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-ochre/10 blur-3xl" aria-hidden />

      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-8">
          <img src="/new_logo_lockup.png" alt="Bountiful Support Plus" className="h-12" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-paper-raised border border-black/10 rounded-lg p-7 shadow-sm"
        >
          <h1 className="font-display text-xl font-bold mb-1">Client sign in</h1>
          <p className="text-sm text-ink/60 mb-6">Enter your account details to continue.</p>

          <div className="grid grid-cols-2 gap-2 mb-5 bg-black/5 rounded-md p-1">
            <button
              type="button"
              onClick={() => setMode("access_code")}
              className={`min-h-[44px] rounded-md text-[13px] font-bold transition ${
                mode === "access_code" ? "bg-teal text-white" : "text-ink/60"
              }`}
            >
              Access Code
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`min-h-[44px] rounded-md text-[13px] font-bold transition ${
                mode === "email" ? "bg-teal text-white" : "text-ink/60"
              }`}
            >
              Email
            </button>
          </div>

          <div className="space-y-4">
            {mode === "access_code" ? (
              <TextField
                label="Access Code"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="AC-0001"
                className="min-h-[44px]"
              />
            ) : (
              <TextField
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="min-h-[44px]"
              />
            )}
            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="min-h-[44px]"
            />
          </div>

          <Button type="submit" disabled={loading} fullWidth className="mt-6 min-h-[44px]">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
