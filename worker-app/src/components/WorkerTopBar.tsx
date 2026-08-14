"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { LogOut } from "lucide-react";

export default function WorkerTopBar() {
  const router = useRouter();

  function handleSignOut() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 h-14 bg-ink text-paper-raised flex items-center justify-between px-4">
      <img src="/new_logo_white.png" alt="Bountiful Support Plus" className="h-6" />
      <div className="flex items-center">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[12.5px] font-bold text-paper-raised/70 hover:text-paper-raised transition min-h-[44px] px-2"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
