import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import { Target, LayoutDashboard, Users2, Send, MessageCircle, Phone, AtSign } from "lucide-react";

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
          <p className="text-[13.5px] text-ink/65 leading-relaxed mb-3">
            We are dedicated to helping vulnerable people in Nigeria live well, remain
            independent, and receive the quality support they deserve.
          </p>
          <p className="text-[13.5px] text-ink/65 leading-relaxed">
            Our team is led by experienced professionals, including UK-qualified Health and
            Social Care practitioners with Level 3 Health and Social Care and NVQ Level
            qualifications, alongside a Registered Nurse from Nigeria. Together, we are
            committed to delivering compassionate, respectful, and person-centred care that
            enhances the wellbeing and dignity of every individual we support.
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

        <div className="bg-paper-raised border border-black/10 rounded-lg p-6">
          <div className="flex items-center gap-2 text-teal-deep mb-2">
            <Send className="w-4 h-4" />
            <h2 className="font-display text-lg font-bold text-ink">Get in touch</h2>
          </div>
          <p className="text-[13.5px] text-ink/65 leading-relaxed mb-4">
            Prefer to reach us directly? You can call, message us on WhatsApp, or find us on
            Instagram. For general enquiries, our{" "}
            <Link href="/contact" className="text-teal-deep font-bold hover:underline">
              contact page
            </Link>{" "}
            is the best place to start.
          </p>
          <div className="space-y-2.5">
            <a
              href="https://wa.me/2348171723880"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[13.5px] text-ink/75 hover:text-teal-deep transition"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              WhatsApp: +234 817 172 3880
            </a>
            <a
              href="tel:+2348033003861"
              className="flex items-center gap-2.5 text-[13.5px] text-ink/75 hover:text-teal-deep transition"
            >
              <Phone className="w-4 h-4 shrink-0" />
              Phone: +234 803 300 3861
            </a>
            <a
              href="https://instagram.com/Bountifulsupport_plus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[13.5px] text-ink/75 hover:text-teal-deep transition"
            >
              <AtSign className="w-4 h-4 shrink-0" />
              Instagram: @Bountifulsupport_plus
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
