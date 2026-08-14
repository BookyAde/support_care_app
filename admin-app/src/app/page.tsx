import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import HeroPhotoBanner from "@/components/HeroPhotoBanner";
import TeamCarousel from "@/components/TeamCarousel";
import PhotoGallery, { type GalleryPhoto } from "@/components/PhotoGallery";
import SignInDropdown from "@/components/SignInDropdown";
import { buttonClasses } from "@/components/ui/Button";
import { AtSign } from "lucide-react";

const GALLERY_PHOTOS: GalleryPhoto[] = [
  { src: "/photos/care1_portrait.jpg", tag: "Mobility support" },
  { src: "/photos/care2_portrait.jpg", tag: "Wellbeing checks" },
  { src: "/photos/care3_portrait.jpg", tag: "Meal support" },
  { src: "/photos/care4_portrait.jpg", tag: "Companionship" },
  { src: "/photos/care5_portrait.jpg", tag: "Everyday care" },
];

const PILLARS = [
  {
    number: "01",
    title: "Verified visits",
    body: "Every check-in and check-out is timestamped and GPS-tagged, so a scheduled visit becomes a provable one.",
    tone: "teal",
  },
  {
    number: "02",
    title: "Care continuity",
    body: "Workers see the client's actual care plan, risk notes, and special instructions before they arrive.",
    tone: "ochre",
  },
  {
    number: "03",
    title: "Family peace of mind",
    body: "Families and case managers can be told exactly what happened during a visit, backed by a real record.",
    tone: "moss",
  },
  {
    number: "04",
    title: "Compliance-ready records",
    body: "Every visit rolls into a report ready for payroll, audits, or a regulator, without reconstructing it later.",
    tone: "brick",
  },
] as const;

const PILLAR_STYLES: Record<string, { border: string; wash: string; number: string }> = {
  teal: { border: "border-teal", wash: "from-teal/8", number: "text-teal-deep" },
  ochre: { border: "border-ochre", wash: "from-ochre/8", number: "text-ochre-deep" },
  moss: { border: "border-moss", wash: "from-moss/8", number: "text-moss-deep" },
  brick: { border: "border-brick", wash: "from-brick/8", number: "text-brick-deep" },
};

const JOURNEY_STEPS = [
  {
    title: "Shift assigned",
    body: "An admin schedules the visit, matching a support worker to a client for a specific date and time.",
  },
  {
    title: "Worker accepts or declines",
    body: "The worker confirms they can make it, or declines with a reason so it can be reassigned quickly.",
  },
  {
    title: "Check-in, GPS-verified",
    body: "Arriving at the client's address, the worker checks in. Location and time are logged automatically.",
  },
  {
    title: "Notes during the visit",
    body: "Medication reminders, welfare checks, anything worth recording goes in as it happens, not from memory later.",
  },
  {
    title: "Check-out and summary",
    body: "A summary note is required before the visit can close. Hours worked are calculated automatically.",
  },
  {
    title: "Ready for review",
    body: "The completed visit, with its notes and location, is instantly available in reports for payroll or compliance review.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <PublicNav />

      {/* HERO */}
      <HeroPhotoBanner />

      {/* BLEND TRANSITION */}
      <div className="h-20 bg-gradient-to-b from-ink to-paper" aria-hidden="true" />

      {/* PILLARS */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep text-center mb-3">
          Why we built this
        </p>
        <h2 className="font-display text-2xl font-bold text-center mb-10 max-w-2xl mx-auto">
          A system built on accountability, not just scheduling
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PILLARS.map((pillar) => {
            const style = PILLAR_STYLES[pillar.tone];
            return (
              <div
                key={pillar.number}
                className={`border-l-4 ${style.border} bg-gradient-to-br ${style.wash} to-transparent rounded-r-lg p-6 sm:p-8`}
              >
                <p className={`font-mono text-[13px] font-bold ${style.number} mb-3`}>{pillar.number}</p>
                <p className="font-display text-lg font-bold mb-2">{pillar.title}</p>
                <p className="text-[13.5px] text-ink/65 leading-relaxed">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* JOURNEY TIMELINE */}
      <section className="bg-paper-raised">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep text-center mb-3">
            How a shift unfolds
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-12 sm:mb-14 max-w-2xl mx-auto">
            From assignment to a completed, verified record
          </h2>

          <div className="max-w-xl mx-auto relative">
            <div
              className="absolute left-0 top-1 bottom-1 w-0.5 bg-gradient-to-b from-moss via-teal to-ochre"
              aria-hidden="true"
            />
            <div className="space-y-10 sm:space-y-12">
              {JOURNEY_STEPS.map((step, i) => {
                const dotColor = i < 2 ? "bg-moss" : i < 4 ? "bg-teal" : "bg-ochre";
                return (
                  <div key={step.title} className="relative pl-6 sm:pl-8">
                    <span
                      className={`absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full ring-4 ring-paper-raised ${dotColor}`}
                    />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink/40 mb-1.5">
                      Step {i + 1}
                    </p>
                    <p className="font-display text-lg font-bold mb-1.5">{step.title}</p>
                    <p className="text-[13.5px] text-ink/65 leading-relaxed">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* MEET THE TEAM */}
      <section className="bg-paper-raised">
        <div className="max-w-5xl mx-auto px-6 pb-16 sm:pb-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep text-center mb-3">
            Who&apos;s behind this
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-3 max-w-2xl mx-auto">
            Meet the team
          </h2>
          <p className="text-[13.5px] text-ink/65 text-center mb-12 sm:mb-14 max-w-md mx-auto">
            Real people, real qualifications, behind every visit this system verifies.
          </p>

          <TeamCarousel />
        </div>
      </section>

      {/* MOMENTS OF CARE */}
      <section className="bg-paper">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-teal-deep text-center mb-3">
            Moments of care
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-12 sm:mb-14 max-w-2xl mx-auto">
            What a visit actually looks like
          </h2>

          <PhotoGallery photos={GALLERY_PHOTOS} />
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative overflow-hidden">
        <img
          src="/photos/care3_wide.jpg"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover animate-[heroZoom_26s_ease-in-out_infinite_alternate]"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(8,73,78,0.82), rgba(22,32,29,0.88))" }}
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center text-paper-raised">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
            Ready to see it running?
          </h2>
          <p className="text-paper-raised/70 text-sm mb-7 max-w-md mx-auto">
            Sign in to the admin portal to schedule visits, manage your team, and pull reports
            in minutes.
          </p>
          <SignInDropdown
            triggerLabel="Sign in to your account"
            triggerClassName={buttonClasses({ className: "bg-ochre! hover:bg-ochre-deep! text-white!" })}
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink text-paper-raised">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            <div>
              <img src="/new_logo_white.png" alt="Bountiful Support Plus" className="h-8 mb-4" />
              <p className="text-[13px] text-paper-raised/55 leading-relaxed max-w-xs">
                A system built for home care agencies to schedule visits, verify they happened, and
                keep the records everyone eventually asks for.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-paper-raised/40 mb-4">
                Product
              </p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/how-it-works" className="text-[13.5px] text-paper-raised/70 hover:text-paper-raised transition">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-[13.5px] text-paper-raised/70 hover:text-paper-raised transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-[13.5px] text-paper-raised/70 hover:text-paper-raised transition">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-paper-raised/40 mb-4">
                Contact
              </p>
              <p className="text-[13.5px] text-paper-raised/70 mb-2">support@bssupport.care</p>
              <p className="text-[12.5px] text-paper-raised/45 leading-relaxed mb-4">
                This is an internal system for agency staff and clients. There is no public sign-up.
              </p>
              <a
                href="https://instagram.com/Bountifulsupport_plus"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bountiful Support Plus on Instagram"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/15 text-paper-raised/60 hover:text-paper-raised hover:border-white/30 transition"
              >
                <AtSign className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-6">
            <p className="text-[12px] text-paper-raised/40 text-center">
              &copy; 2026 Bountiful Support Plus Limited. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
