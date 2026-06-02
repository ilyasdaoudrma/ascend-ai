import { useEffect, useRef, useState } from "react";
import { animate, inView } from "motion";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 1.4,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setValue(to);
      return;
    }
    const stop = inView(el, () => {
      animate(from, to, {
        duration,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v: number) => setValue(v),
      });
    });
    return () => stop();
  }, [to, from, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
