import { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "outline" | "outline-danger" | "outline-success" | "ghost";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-teal hover:bg-teal-deep text-white",
  outline: "border border-teal text-teal-deep hover:bg-teal/10",
  "outline-danger": "border border-brick text-brick-deep hover:bg-brick/10",
  "outline-success": "border border-moss text-moss-deep hover:bg-moss/10",
  ghost: "text-ink/60 hover:text-ink hover:bg-black/5",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-[12.5px] px-3 py-1.5 rounded-md",
  md: "text-sm px-4 py-2.5 rounded-md",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return [
    "inline-flex items-center justify-center gap-2 font-bold transition disabled:opacity-60 disabled:pointer-events-none",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {icon}
      {children}
    </button>
  );
}
