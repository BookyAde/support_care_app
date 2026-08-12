"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { LogOut, User } from "lucide-react";

export default function ClientTopBar() {
  const router = useRouter();

  function handleSignOut() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 h-14 bg-ink text-paper-raised flex items-center justify-between px-4">
      <img src="/bountiful-white-lockup.png" alt="Bountiful Support Plus" className="h-6" />
      <div className="flex items-center">
        <Link
          href="/profile"
          aria-label="Your profile"
          className="flex items-center justify-center min-h-[44px] min-w-[44px] text-paper-raised/70 hover:text-paper-raised transition"
        >
          <User className="w-4 h-4" />
        </Link>
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
