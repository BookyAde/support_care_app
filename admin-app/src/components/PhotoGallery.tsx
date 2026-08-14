"use client";

import { useAutoScrollDrag } from "@/hooks/useAutoScrollDrag";

export type GalleryPhoto = {
  src: string;
  tag: string;
};

function PhotoCard({ photo }: { photo: GalleryPhoto }) {
  return (
    <div className="shrink-0 w-56 sm:w-64 select-none">
      <div className="relative aspect-4/5 rounded-xl overflow-hidden bg-ink/10">
        <img
          src={photo.src}
          alt={photo.tag}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/75 to-transparent" />
        <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-paper-raised font-bold">
          {photo.tag}
        </span>
      </div>
    </div>
  );
}

/**
 * Reusable drag/auto-scroll photo carousel - same mechanism as
 * TeamCarousel (cards rendered twice for a seamless loop, requestAnimationFrame
 * auto-scroll, pause-on-interaction with resume timer, fade edges on both
 * sides), factored out into useAutoScrollDrag so both components share the
 * exact same scroll logic instead of duplicating it.
 */
export default function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const { scrollerRef, handleMouseDown, handleMouseMove, endDrag, handleTouchStart, handleTouchEnd } =
    useAutoScrollDrag();

  // Rendered twice back-to-back so the auto-scroll loop can jump seamlessly
  // from the end of the first copy to the start of the second.
  const cards = [...photos, ...photos];

  return (
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
        {cards.map((photo, i) => (
          <PhotoCard key={`${photo.src}-${i}`} photo={photo} />
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
  );
}
