"use client";

import { useEffect, useRef } from "react";

const AUTO_SCROLL_SPEED = 0.5; // px per animation frame
const RESUME_DELAY_MS = 2200;

/**
 * Drives the auto-scroll + drag-to-pause + seamless-loop behavior shared by
 * every "cards rendered twice, auto-scrolling horizontal row" carousel in
 * this app (TeamCarousel, PhotoGallery) - extracted here once a second
 * carousel needed the exact same mechanism, rather than duplicating the
 * requestAnimationFrame loop and drag handlers a second time.
 *
 * The caller is responsible for rendering its own card list TWICE
 * back-to-back (so the half-width reset lands on a matching duplicate card)
 * and wiring the returned ref/handlers onto its scroll container.
 */
export function useAutoScrollDrag() {
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

  return {
    scrollerRef,
    handleMouseDown,
    handleMouseMove,
    endDrag,
    handleTouchStart,
    handleTouchEnd,
  };
}
