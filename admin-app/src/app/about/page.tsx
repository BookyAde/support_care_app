import Link from "next/link";
import PublicNav from "@/components/PublicNav";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicNav />

      {/* MASTHEAD */}
      <section className="max-w-3xl mx-auto px-6 pt-16 sm:pt-20 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep mb-3">Who we are</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
          About Bountiful Support Plus
        </h1>
        <p className="text-[15px] text-ink/60 max-w-lg">
          Bountiful Support Plus is a support care agency management system built for accountability and
          compliance, not just scheduling.
        </p>
      </section>

      {/* NUMBERED EDITORIAL ROWS */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        {/* 01 Mission */}
        <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 pt-10 sm:pt-14 pb-10 sm:pb-14 border-t-2 border-ink">
          <p className="font-mono text-[13px] text-ink/30 pt-0.5">01</p>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep mb-3">Mission</p>
            <p className="font-display italic text-xl sm:text-2xl text-ink border-l-2 border-teal pl-5 leading-snug mb-5">
              We are dedicated to helping vulnerable people in Nigeria live well, remain independent, and
              receive the quality support they deserve.
            </p>
            <p className="text-[14px] text-ink/65 leading-relaxed max-w-xl">
              Our team is led by experienced professionals, including UK-qualified Health and Social Care
              practitioners with Level 3 Health and Social Care and NVQ Level qualifications, alongside a
              Registered Nurse from Nigeria. Together, we are committed to delivering compassionate,
              respectful, and person-centred care that enhances the wellbeing and dignity of every
              individual we support.
            </p>
          </div>
        </div>

        {/* 02 What it does */}
        <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 py-10 sm:py-14 border-t border-black/10">
          <p className="font-mono text-[13px] text-ink/30 pt-0.5">02</p>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ochre-deep mb-3">What it does</p>
            <p className="text-[14px] text-ink/65 leading-relaxed max-w-xl">
              Bountiful Support Plus manages clients, workers, and shifts in one place, and turns every
              visit into a verifiable record:{" "}
              <strong className="font-display font-bold text-ink">GPS-confirmed</strong> check-ins,
              mandatory end-of-visit notes, and reports that are ready for payroll or a regulator without
              extra work.
            </p>
          </div>
        </div>

        {/* 03 Who it's for */}
        <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 py-10 sm:py-14 border-t border-black/10">
          <p className="font-mono text-[13px] text-ink/30 pt-0.5">03</p>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-moss-deep mb-3">Who it&apos;s for</p>
            <p className="text-[14px] text-ink/65 leading-relaxed max-w-xl">
              Home care and support care agencies who need their day-to-day scheduling and their
              compliance records to come from the same source, rather than a spreadsheet and a filing
              cabinet that don&apos;t agree with each other.
            </p>
          </div>
        </div>

        {/* 04 Get in touch */}
        <div className="grid grid-cols-[44px_1fr] sm:grid-cols-[70px_1fr] gap-5 sm:gap-10 py-10 sm:py-14 border-t border-black/10">
          <p className="font-mono text-[13px] text-ink/30 pt-0.5">04</p>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep mb-3">Get in touch</p>
            <p className="text-[14px] text-ink/65 leading-relaxed max-w-xl mb-6">
              Prefer to reach us directly? You can call, message us on WhatsApp, or find us on Instagram.
              For general enquiries, our{" "}
              <Link
                href="/contact"
                className="text-teal-deep font-bold underline underline-offset-2 hover:text-teal"
              >
                contact page
              </Link>{" "}
              is the best place to start.
            </p>

            <div className="max-w-md">
              <div className="flex items-baseline justify-between gap-4 py-3 border-b border-dotted border-black/25">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">WhatsApp</span>
                <a
                  href="https://wa.me/2348171723880"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-ink underline underline-offset-2 decoration-black/25 hover:text-teal-deep hover:decoration-teal-deep transition"
                >
                  +234 817 172 3880
                </a>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3 border-b border-dotted border-black/25">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">Phone</span>
                <a
                  href="tel:+2348033003861"
                  className="text-[14px] text-ink underline underline-offset-2 decoration-black/25 hover:text-teal-deep hover:decoration-teal-deep transition"
                >
                  +234 803 300 3861
                </a>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3 border-b border-dotted border-black/25">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">Instagram</span>
                <a
                  href="https://instagram.com/Bountifulsupport_plus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-ink underline underline-offset-2 decoration-black/25 hover:text-teal-deep hover:decoration-teal-deep transition"
                >
                  @Bountifulsupport_plus
                </a>
              </div>
            </div>

            <p className="font-display italic text-[14px] text-ink/45 mt-8">
              We look forward to hearing from you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
