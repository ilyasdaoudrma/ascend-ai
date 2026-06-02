import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/format";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("card p-6", className)}>{children}</div>;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      className={cn(variant === "primary" ? "btn-primary" : "btn-ghost", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  variant = "primary",
  className,
  children,
}: {
  to: string;
  variant?: "primary" | "ghost";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(variant === "primary" ? "btn-primary" : "btn-ghost", className)}
    >
      {children}
    </Link>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  color = "var(--accent)",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-smooth"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
