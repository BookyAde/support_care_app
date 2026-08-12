export type BadgeTone = "teal" | "ochre" | "moss" | "brick";

const SOFT: Record<BadgeTone, string> = {
  teal: "bg-teal/10 text-teal-deep",
  ochre: "bg-ochre/10 text-ochre-deep",
  moss: "bg-moss/10 text-moss-deep",
  brick: "bg-brick/10 text-brick-deep",
};

const SOLID: Record<BadgeTone, string> = {
  teal: "bg-teal text-white",
  ochre: "bg-ochre text-white",
  moss: "bg-moss text-white",
  brick: "bg-brick text-white",
};

export default function Badge({
  tone,
  variant = "soft",
  uppercase = false,
  icon,
  children,
}: {
  tone: BadgeTone;
  variant?: "soft" | "solid";
  uppercase?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const palette = variant === "soft" ? SOFT[tone] : SOLID[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-md ${
        uppercase ? "text-[11px] uppercase tracking-wide" : "text-[12.5px]"
      } ${palette}`}
    >
      {icon}
      {children}
    </span>
  );
}
