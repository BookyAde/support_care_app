"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  UserCog,
  CalendarClock,
  FileBarChart,
  MessageCircle,
  Inbox,
  Mail,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admins", label: "Admins", icon: ShieldCheck },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/workers", label: "Workers", icon: UserCog },
  { href: "/shifts", label: "Shifts", icon: CalendarClock },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/care-requests", label: "Care Requests", icon: Inbox },
  { href: "/contact-messages", label: "Contact Messages", icon: Mail },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  function handleSignOut() {
    clearToken();
    router.push("/login");
  }

  // AdminShell wraps every authenticated page, so this one poll powers the
  // sidebar badge everywhere, not just on the Messages page itself.
  useEffect(() => {
    if (!getToken()) return;

    function poll() {
      apiFetch("/messages/unread-summary")
        .then((data) => setUnreadCount(data.total_unread))
        .catch(() => {
          // Silent - a failed background poll shouldn't show an error banner on every page.
        });
    }

    poll();
    const interval = setInterval(poll, 9000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-ink text-paper-raised flex items-center justify-between px-4 z-40">
        <img src="/bountiful-white-lockup.png" alt="Bountiful Support Plus" className="h-6" />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-1.5 rounded-md hover:bg-white/10 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink/50 z-40 animate-[fadein_0.2s_ease]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`w-64 shrink-0 bg-ink text-paper-raised flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="shrink-0 px-6 py-7 border-b border-white/10 flex items-center justify-between">
          <img src="/bountiful-white-lockup.png" alt="Bountiful Support Plus" className="h-9" />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="lg:hidden p-1 rounded-md hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 px-4 py-3 mb-1 rounded-md text-[13.5px] font-bold transition-all duration-150 ${
                  isActive
                    ? "bg-teal/15 text-white"
                    : "text-paper-raised/55 hover:text-paper-raised hover:bg-white/5 hover:translate-x-0.5"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-teal rounded-full" />
                )}
                <Icon
                  className={`w-4 h-4 transition-transform duration-150 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                {item.label}
                {item.href === "/messages" && unreadCount > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-brick text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="shrink-0 flex items-center gap-3 px-6 py-4 text-[13.5px] font-bold text-paper-raised/55 hover:text-paper-raised border-t border-white/10 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </aside>

      <div className="flex-1 min-w-0 overflow-x-hidden pt-14 lg:pt-0">{children}</div>
    </div>
  );
}
