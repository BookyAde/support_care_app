import PublicNav from "@/components/PublicNav";
import { Target, LayoutDashboard, Users2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicNav />

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-8 text-center">
        <h1 className="font-display text-4xl font-bold mb-4">About Bountiful Support Plus</h1>
        <p className="text-[15px] text-ink/65">
          Bountiful Support Plus is a support care agency management system built for accountability and
          compliance, not just scheduling.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20 space-y-8">
        <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
          <div className="flex items-center gap-2 text-teal-deep mb-2">
            <Target className="w-4 h-4" />
            <h2 className="font-display text-lg font-bold text-ink">Our mission</h2>
          </div>
          <p className="text-[13.5px] text-ink/65 leading-relaxed">
            Give care agencies a straightforward way to prove that the care they're paid to
            deliver was actually delivered, on time, by the right person, with a record to
            show it.
          </p>
        </div>

        <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
          <div className="flex items-center gap-2 text-ochre-deep mb-2">
            <LayoutDashboard className="w-4 h-4" />
            <h2 className="font-display text-lg font-bold text-ink">What it does</h2>
          </div>
          <p className="text-[13.5px] text-ink/65 leading-relaxed">
            Bountiful Support Plus manages clients, workers, and shifts in one place, and turns every
            visit into a verifiable record: GPS-confirmed check-ins, mandatory end-of-visit
            notes, and reports that are ready for payroll or a regulator without extra work.
          </p>
        </div>

        <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
          <div className="flex items-center gap-2 text-moss-deep mb-2">
            <Users2 className="w-4 h-4" />
            <h2 className="font-display text-lg font-bold text-ink">Who it's for</h2>
          </div>
          <p className="text-[13.5px] text-ink/65 leading-relaxed">
            Home care and support care agencies who need their day-to-day scheduling and their
            compliance records to come from the same source, rather than a spreadsheet and a
            filing cabinet that don't agree with each other.
          </p>
        </div>
      </section>
    </div>
  );
}
