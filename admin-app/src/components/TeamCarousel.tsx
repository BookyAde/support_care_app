"use client";

import { useEffect, useRef } from "react";

const TEAM_MEMBERS = [
  {
    photo: "/team/team2.jpg",
    name: "Damilola Oyadeyi",
    title: "Executive Director",
    bio: "Committed to promoting high-quality, person-centred care and supporting excellence in health and social care.",
    badge: "Lvl 3 Diploma H&SC",
  },
  {
    photo: "/team/team3.jpg",
    name: "Olamidoyin Ojo-Ade",
    title: "Principal Consultant",
    bio: "NVQ Level 3 and Care Certificate qualified, with specialised UK certification in Non-Invasive Ventilation.",
    badge: "NVQ Lvl 3 · NIV UK",
  },
  {
    photo: "/team/team1.jpg",
    name: "Ojo-Kayode A. Dorcas",
    title: "Senior Nursing Officer",
    bio: "Serving in a Government Hospital in Lagos State. Certified Telehealth Nurse.",
    badge: "B.NSc · BLS Certified",
  },
  {
    photo: "/team/team4.jpg",
    name: "Oluwadamilola Alabi",
    title: "Compliance & Wealth Manager",
    bio: "Expertise in regulatory compliance and financial management, strong governance standards.",
    badge: "Compliance · Wealth",
  },
] as const;

// Rendered twice back-to-back so the auto-scroll loop can jump seamlessly
// from the end of the first copy to the start of the second.
const CARDS = [...TEAM_MEMBERS, ...TEAM_MEMBERS];

const AUTO_SCROLL_SPEED = 0.5; // px per animation frame
const RESUME_DELAY_MS = 2200;

function TeamCard({ member }: { member: (typeof TEAM_MEMBERS)[number] }) {
  return (
    <div className="shrink-0 w-64 sm:w-72 select-none">
      <div className="relative aspect-4/5 rounded-lg overflow-hidden bg-ink/10">
        <img
          src={member.photo}
          alt={member.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/75 to-transparent" />
        <span className="absolute top-3 left-3 bg-paper-raised/90 backdrop-blur rounded-full px-2.5 py-1 text-[8.5px] font-mono font-bold text-ink/80 tracking-wide">
          {member.badge}
        </span>
      </div>

      <p className="font-display text-base font-bold text-ink mt-4 mb-0.5">{member.name}</p>
      <p className="font-mono text-[11px] uppercase tracking-wide text-teal-deep mb-2">{member.title}</p>
      <p className="text-[13px] text-ink/65 leading-relaxed">{member.bio}</p>
    </div>
  );
}

export default function TeamCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  // Auto-scroll loop + seamless half-width reset.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frameId: number;

    function tick() {
      const el = scrollerRef.current;
      if (el) {
        if (!pausedRef.current) {
          el.scrollLeft += AUTO_SCROLL_SPEED;
        }
        const halfWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  function pauseAutoScroll() {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }

  function scheduleResume() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    isDraggingRef.current = true;
    pauseAutoScroll();
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = scroller.scrollLeft;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const delta = e.clientX - dragStartXRef.current;
    scroller.scrollLeft = dragStartScrollLeftRef.current - delta;
  }

  function endDrag() {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    scheduleResume();
  }

  function handleTouchStart() {
    pauseAutoScroll();
  }

  function handleTouchEnd() {
    scheduleResume();
  }

  // Cleanup any pending resume timeout on unmount.
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  return (
    <div>
      <div className="relative">
        <div
          ref={scrollerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="scrollbar-hide flex gap-5 overflow-x-auto cursor-grab active:cursor-grabbing"
        >
          {CARDS.map((member, i) => (
            <TeamCard key={`${member.name}-${i}`} member={member} />
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-paper-raised to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-paper-raised to-transparent"
          aria-hidden="true"
        />
      </div>

      <p className="text-center text-[12px] text-ink/40 font-mono mt-6">
        Drag or swipe to explore · auto-scrolls when idle
      </p>
    </div>
  );
}
