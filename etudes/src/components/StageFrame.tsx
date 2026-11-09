import type { ReactNode } from "react";

/** The real game's exact viewport — never resized, only scaled by the shell. */
export const STAGE_WIDTH = 800;
export const STAGE_HEIGHT = 480;

export function StageFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="relative overflow-hidden rounded-[8px] border border-white/10 bg-stage shadow-[0_18px_42px_-26px_rgba(0,0,0,0.95)]"
      style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
    >
      {children}
      <div className="pointer-events-none absolute left-3 top-2.5 z-40 flex items-center gap-1.5 rounded-[6px] border border-white/10 bg-[#0c1115]/85 px-1.5 py-1 text-[9px] uppercase tracking-[0.14em] text-muted">
        <span className="h-1 w-1 rounded-full bg-teal" />
        synthetic · seed 1337
      </div>
    </section>
  );
}

export default StageFrame;
