"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import ClientTopBar from "@/components/ClientTopBar";
import Button from "@/components/ui/Button";

const TERMS_VERSION = "v1";

export default function AcceptTermsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);

  async function handleContinue() {
    setSaving(true);
    try {
      await apiFetch("/auth/client/accept-terms", {
        method: "POST",
        body: JSON.stringify({ terms_version: TERMS_VERSION }),
      });
      router.push("/visits");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not save your acceptance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <ClientTopBar />

      <main className="p-5 max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-bold mb-1 mt-4">Terms and conditions</h1>
        <p className="text-sm text-ink/60 mb-6">Please read and accept before continuing.</p>

        <div className="bg-paper-raised border border-black/10 rounded-lg p-5 mb-5 space-y-3 text-[13px] text-ink/65 leading-relaxed">
          <p>
            This app shows you a record of your scheduled and completed visits, including the
            times your support worker checked in and out and the GPS location captured at each
            visit, so you can see exactly when and where your care was delivered.
          </p>
          <p>
            After a visit is completed, you may leave a star rating. Ratings you submit are shared
            with the agency and used to help them review the quality of care being provided, they
            are not shared directly with your support worker.
          </p>
          <p>
            Messaging in this app connects you with the office, not directly with your assigned
            support worker. For anything you need, including questions about a specific visit,
            please use the office chat.
          </p>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-teal shrink-0"
          />
          <span className="text-sm font-bold">I agree to these terms and conditions</span>
        </label>

        <Button
          onClick={handleContinue}
          disabled={!agreed || saving}
          fullWidth
          className="min-h-[44px]"
        >
          {saving ? "Saving..." : "Continue"}
        </Button>
      </main>
    </div>
  );
}
