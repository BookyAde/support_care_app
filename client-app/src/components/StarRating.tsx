"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  busy,
  onRate,
}: {
  busy: boolean;
  onRate: (stars: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={busy}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onRate(n)}
          className="min-h-[44px] min-w-[32px] flex items-center justify-center disabled:opacity-50"
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-5 h-5 transition ${
              n <= hovered ? "fill-ochre text-ochre" : "text-ink/25"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
