"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import ClientTopBar from "@/components/ClientTopBar";
import Button from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfilePage() {
  const router = useRouter();
  const showToast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    apiFetch("/clients/me")
      .then((data) => {
        setFullName(data.full_name);
        setAddress(data.address);
        setContactNumber(data.contact_number);
        setEmergencyContact(data.emergency_contact);
        setSpecialInstructions(data.special_instructions ?? "");
      })
      .catch((err) => {
        showToast("danger", err instanceof Error ? err.message : "Could not load your profile");
      })
      .finally(() => setLoading(false));
  }, [router, showToast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // full_name is intentionally never sent - it's admin-controlled, matching
      // the backend's ClientSelfUpdate schema which doesn't even accept it.
      await apiFetch("/clients/me", {
        method: "PATCH",
        body: JSON.stringify({
          address,
          contact_number: contactNumber,
          emergency_contact: emergencyContact,
          special_instructions: specialInstructions || null,
        }),
      });
      showToast("success", "Profile updated");
    } catch (err) {
      showToast("danger", err instanceof Error ? err.message : "Could not update your profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <ClientTopBar />

      <main className="p-5 max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-bold mb-1 mt-4">Your profile</h1>
        <p className="text-sm text-ink/60 mb-6">Keep your contact details up to date.</p>

        {loading ? (
          <div className="bg-paper-raised border border-black/10 rounded-lg p-5 space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-paper-raised border border-black/10 rounded-lg p-5">
            <div className="space-y-4">
              <div>
                <TextField
                  label="Full name"
                  value={fullName}
                  disabled
                  className="min-h-[44px] opacity-60 cursor-not-allowed"
                />
                <p className="text-[11.5px] text-ink/45 mt-1.5">Contact the office to change this</p>
              </div>
              <TextField
                label="Address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="min-h-[44px]"
              />
              <TextField
                label="Contact number"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="min-h-[44px]"
              />
              <TextField
                label="Emergency contact"
                required
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="min-h-[44px]"
              />
              <TextAreaField
                label="Special instructions"
                rows={3}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. preferred visit times"
              />
            </div>

            <Button type="submit" disabled={saving} fullWidth className="mt-6 min-h-[44px]">
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
