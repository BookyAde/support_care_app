"use client";

import { useRef } from "react";

export default function InteractiveCard({
  children,
  className = "",
  glowColor = "rgba(11,107,114,0.12)",
}: {
  children: React.ReactNode;
  className?: string;
  /** Tint for the cursor-following hover glow, as a CSS color (rgba recommended
   * so the fade-to-transparent works cleanly). Defaults to the original teal
   * glow so every existing usage renders identically without passing this. */
  glowColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div style={{ perspective: "900px" }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative bg-paper-raised border border-black/10 rounded-lg transition-[transform,border-color,box-shadow] duration-150 hover:border-teal hover:shadow-lg overflow-hidden group ${className}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle 220px at var(--mx, 50%) var(--my, 50%), ${glowColor}, transparent 70%)`,
          }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}