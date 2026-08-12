"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import WorkerTopBar from "@/components/WorkerTopBar";
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
      await apiFetch("/auth/worker/accept-terms", {
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
      <WorkerTopBar />

      <main className="p-5 max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-bold mb-1 mt-4">Terms and conditions</h1>
        <p className="text-sm text-ink/60 mb-6">Please read and accept before continuing.</p>

        <div className="bg-paper-raised border border-black/10 rounded-lg p-5 mb-5 space-y-3 text-[13px] text-ink/65 leading-relaxed">
          <p>
            By using this app you agree to record visits accurately, including check-in and
            check-out times, and to only mark a visit complete once the care described in the
            client&apos;s care plan has actually been delivered.
          </p>
          <p>
            Location data may be captured at the start and end of a visit to confirm that care
            was delivered at the client&apos;s registered address. This information may be
            reviewed by your agency as part of routine compliance checks.
          </p>
          <p>
            Visit notes you submit become part of the client&apos;s permanent care record. Write
            them honestly and promptly, and contact your agency directly if you have any
            concerns about a client&apos;s wellbeing.
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
