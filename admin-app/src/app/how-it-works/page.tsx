import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import { buttonClasses } from "@/components/ui/Button";
import { MapPin, HeartHandshake, ClipboardCheck, Radar, FileCheck2, History } from "lucide-react";

const STEPS = [
  {
    icon: MapPin,
    tone: "teal",
    title: "Arrive",
    body: "The worker opens the shift on their device at the client's address and checks in. GPS confirms the check-in happened where it was supposed to, so a scheduled visit becomes a verified one the moment it starts.",
  },
  {
    icon: HeartHandshake,
    tone: "ochre",
    title: "During the visit",
    body: "The worker sees that client's care plan, special instructions, and risk assessment for exactly this visit, not a generic checklist. Every shift is tied to one client and one worker, so there's no ambiguity about who did what, where.",
  },
  {
    icon: ClipboardCheck,
    tone: "moss",
    title: "Leave",
    body: "Checking out requires an end-of-visit note before the shift can be marked complete. Actual start and end times, total hours worked, and the note itself are all captured automatically, ready for payroll or a compliance review.",
  },
] as const;

const TONE_STYLES: Record<string, string> = {
  teal: "bg-teal/12 text-teal-deep",
  ochre: "bg-ochre/12 text-ochre-deep",
  moss: "bg-moss/12 text-moss-deep",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicNav />

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-4 text-center">
        <h1 className="font-display text-4xl font-bold mb-4">How Bountiful Support Plus works</h1>
        <p className="text-[15px] text-ink/65 max-w-xl mx-auto">
          Three steps, every time a worker visits a client, each one leaving a record behind
          instead of relying on memory.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12 space-y-5">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="bg-paper-raised border border-black/10 rounded-lg p-6 flex gap-5">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${TONE_STYLES[step.tone]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold mb-1.5">{step.title}</p>
                <p className="text-[13.5px] text-ink/65 leading-relaxed">{step.body}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="font-display text-2xl font-bold text-center mb-2">Built for accountability</h2>
        <p className="text-sm text-ink/60 text-center mb-10 max-w-lg mx-auto">
          None of this depends on anyone remembering to fill something in later. It's built into
          how a shift moves from scheduled to complete.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-paper-raised border border-black/10 rounded-lg p-5">
            <Radar className="w-5 h-5 text-teal-deep mb-3" />
            <p className="font-display text-base font-bold mb-1.5">GPS check-in</p>
            <p className="text-[13px] text-ink/60 leading-relaxed">
              Every visit is confirmed at the point of check-in, not reconstructed afterward.
            </p>
          </div>
          <div className="bg-paper-raised border border-black/10 rounded-lg p-5">
            <FileCheck2 className="w-5 h-5 text-ochre-deep mb-3" />
            <p className="font-display text-base font-bold mb-1.5">Mandatory visit notes</p>
            <p className="text-[13px] text-ink/60 leading-relaxed">
              A shift can't be marked completed without one, so there's always a record of what happened.
            </p>
          </div>
          <div className="bg-paper-raised border border-black/10 rounded-lg p-5">
            <History className="w-5 h-5 text-moss-deep mb-3" />
            <p className="font-display text-base font-bold mb-1.5">Full audit trail</p>
            <p className="text-[13px] text-ink/60 leading-relaxed">
              Scheduled time, actual time, and status are all kept, ready for a report at any point.
            </p>
          </div>
        </div>

        <div className="bg-paper-raised border border-black/10 rounded-lg overflow-hidden max-w-4xl mx-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink/50 text-[11px] uppercase tracking-wide">
                <th className="px-5 py-3 font-bold">Client</th>
                <th className="px-5 py-3 font-bold font-mono">Start</th>
                <th className="px-5 py-3 font-bold font-mono">End</th>
                <th className="px-5 py-3 font-bold">Hours</th>
                <th className="px-5 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-5 py-3 font-bold">Margaret Ellis</td>
                <td className="px-5 py-3 font-mono">09:02</td>
                <td className="px-5 py-3 font-mono">09:47</td>
                <td className="px-5 py-3 font-mono">0.75</td>
                <td className="px-5 py-3 text-moss-deep font-bold">Completed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-teal-deep text-paper-raised">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
            Ready to see it running?
          </h2>
          <p className="text-paper-raised/70 text-sm mb-7 max-w-md mx-auto">
            Sign in to the admin portal to schedule visits, manage your team, and pull reports
            in minutes.
          </p>
          <Link
            href="/login"
            className={buttonClasses({ className: "bg-paper-raised! text-teal-deep! hover:bg-white!" })}
          >
            Sign in to your account
          </Link>
        </div>
      </section>
    </div>
  );
}
