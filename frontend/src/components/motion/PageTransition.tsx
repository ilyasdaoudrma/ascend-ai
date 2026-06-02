import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { animate } from "motion";

/**
 * Animates its children in whenever the route changes. Used inside the
 * dashboard so navigating between pages feels fluid. Honours reduced-motion.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.style.opacity = "1";
      return;
    }
    el.style.opacity = "0";
    animate(
      el,
      { opacity: 1, y: [14, 0] },
      { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    );
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
