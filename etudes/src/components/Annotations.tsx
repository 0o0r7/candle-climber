export interface AnnotationItem {
  x: number;
  y: number;
  text: string;
  align?: "center" | "right";
}

/** Mockup callouts pinned over the stage. The dot sits on the annotated point;
 *  "right" keeps the label to the left so it never leaves the 800px frame. */
export function Annotations({ items }: { items: AnnotationItem[] }) {
  return (
    <>
      {items.map((item) => (
        <div
          key={`${item.text}-${item.y}`}
          data-annotation="true"
          className="pointer-events-none absolute z-30 flex items-center gap-1.5"
          style={{
            left: item.x,
            top: item.y,
            transform:
              item.align === "right"
                ? "translate(-100%, -50%)"
                : "translate(-50%, -50%)",
          }}
        >
          {item.align === "right" && (
            <span className="whitespace-nowrap rounded-[6px] border border-teal/40 bg-[#0c1115]/95 px-1.5 py-1 text-[9px] font-medium uppercase leading-none tracking-[0.06em] text-teal">
              {item.text}
            </span>
          )}
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
          {item.align !== "right" && (
            <span className="whitespace-nowrap rounded-[6px] border border-teal/40 bg-[#0c1115]/95 px-1.5 py-1 text-[9px] font-medium uppercase leading-none tracking-[0.06em] text-teal">
              {item.text}
            </span>
          )}
        </div>
      ))}
    </>
  );
}
