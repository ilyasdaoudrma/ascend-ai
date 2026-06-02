import { Parallax } from "./Parallax";

/**
 * Soft animated aurora blobs that drift behind dashboard content. Pure CSS
 * animation (transform/opacity) + light parallax. Decorative and inert.
 */
export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <Parallax speed={0.08} className="absolute inset-0">
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
      </Parallax>
    </div>
  );
}
