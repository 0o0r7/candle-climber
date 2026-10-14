"use client";

import { useState } from "react";
import { Zap, Flame, CalendarClock } from "lucide-react";
import { TUTORIAL_KEY } from "@/lib/tutorial-key";

interface Step {
  visual: "candles" | "jump" | "rush" | "combo" | "daily";
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    visual: "candles",
    title: "Read the candles",
    body: "Green candles are solid platforms — land on them safely. Red candles crumble the moment you touch them. Scan ahead and plan your path through the chart.",
  },
  {
    visual: "jump",
    title: "Tap to jump",
    body: "Tap the screen or press Space to jump. Hold longer for a higher jump. Release early for a shorter hop. Time your jumps to the gaps between candles.",
  },
  {
    visual: "rush",
    title: "Rush mode",
    // Visual QA 2026-10-14: absorbed the pause-keys line from the removed
    // inline how-to block on the entry card (owner: block was redundant).
    body: "Hold Shift to rush — climb faster and gain +25% bonus score. Higher speed means tighter timing. P or Esc pauses the run.",
  },
  {
    visual: "combo",
    title: "Chain combos",
    // Visual QA 2026-10-14: absorbed the combo cap + camera rule from the
    // removed inline how-to block.
    body: "Land on consecutive candles to build a combo multiplier — up to ×7. One miss resets it. The camera never stops: fall off the bottom of the chart and the run ends.",
  },
  {
    visual: "daily",
    title: "One daily chart",
    // Visual QA 2026-10-14: absorbed the graduation/world-2 line from the
    // removed inline how-to block.
    body: "Every player worldwide climbs the same chart. A new chart drops at 00:00 UTC. Submit your score to the global leaderboard — reach the summit to GRADUATE and world 2 pays double.",
  },
];

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;

  const finish = () => {
    try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch { /* private mode */ }
    onClose();
  };

  const next = () => {
    if (isLast) finish();
    else setStep((p) => p + 1);
  };

  const s = steps[step];

  return (
    <div className="cc-overlay cc-tutorial-overlay" role="dialog" aria-label="How to play tutorial">
      <div className="cc-panel cc-tutorial-panel">
        <div className={`cc-tut-visual cc-tut-visual-${s.visual}`}>
          {s.visual === "candles" && (
            <div className="cc-tut-candles">
              <div className="cc-tut-candle-grp">
                <div className="cc-tut-candle cc-tut-candle-up">
                  <div className="cc-tut-wick" />
                  <div className="cc-tut-body" />
                </div>
                <span className="cc-tut-candle-label">HOLDS</span>
              </div>
              <div className="cc-tut-candle-grp">
                <div className="cc-tut-candle cc-tut-candle-down">
                  <div className="cc-tut-wick" />
                  <div className="cc-tut-body" />
                </div>
                <span className="cc-tut-candle-label coral">CRUMBLES</span>
              </div>
            </div>
          )}
          {s.visual === "jump" && (
            <div className="cc-tut-jump">
              <div className="cc-tut-candle cc-tut-candle-up small">
                <div className="cc-tut-wick" />
                <div className="cc-tut-body" />
              </div>
              <span className="cc-tut-arc" aria-hidden>↗</span>
              <div className="cc-tut-candle cc-tut-candle-up small">
                <div className="cc-tut-wick" />
                <div className="cc-tut-body" />
              </div>
            </div>
          )}
          {s.visual === "rush" && <Zap size={48} className="cc-tut-icon-lime" />}
          {s.visual === "combo" && <Flame size={48} className="cc-tut-icon-lime" />}
          {s.visual === "daily" && <CalendarClock size={48} className="cc-tut-icon-faint" />}
        </div>
        <p className="cc-tut-step-num">STEP {step + 1} / {steps.length}</p>
        <h2 className="cc-tut-title">{s.title}</h2>
        <p className="cc-tut-text">{s.body}</p>
        <div className="cc-tut-dots">
          {steps.map((_, i) => (
            <button
              key={i}
              className={`cc-tut-dot${i === step ? " on" : ""}`}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
        <div className="cc-tut-actions">
          {step > 0 ? (
            <button className="cc-btn cc-btn-ghost cc-tut-btn" onClick={() => setStep((p) => p - 1)}>BACK</button>
          ) : (
            <button className="cc-btn cc-btn-ghost cc-tut-btn" onClick={finish}>SKIP</button>
          )}
          <button className="cc-btn cc-btn-start cc-tut-btn" onClick={next}>
            {isLast ? "GOT IT" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}
