import { useEffect, useRef, type ReactNode, type JSX } from "react";
import { animate, inView } from "motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Reveal-on-scroll using Motion One's `inView`. Respects reduced-motion.
 */
export function Reveal({ children, delay = 0, y = 28, className, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.style.opacity = "1";
      return;
    }
    el.style.opacity = "0";
    el.style.transform = `translateY(${y}px)`;
    const stop = inView(
      el,
      () => {
        animate(
          el,
          { opacity: 1, y: [y, 0] },
          { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }
        );
      },
      { amount: 0.2 }
    );
    return () => stop();
  }, [delay, y]);

  const Tag = as as any;
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
