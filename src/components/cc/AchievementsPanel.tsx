"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCallback, useState } from "react";
import { Trophy, Lock } from "lucide-react";
import { ACHIEVEMENT_DEFS, ACHIEVEMENTS_KEY, loadUnlocked } from "@/lib/achievements";

interface AchievementsPanelProps {
  triggerClassName?: string;
  triggerVariant?: "default" | "ghost" | "outline" | "secondary";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  newCount?: number;
}

export default function AchievementsPanel({
  triggerClassName,
  triggerVariant = "outline",
  triggerSize = "sm",
  newCount = 0,
}: AchievementsPanelProps) {
  // Unlocked set refreshes when the dialog OPENS (user interaction — not an
  // effect): initial render stays consistent with SSR (no hydration mismatch),
  // and every open re-reads localStorage so new unlocks always show.
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const refreshOnOpen = useCallback((open: boolean) => {
    if (!open) return;
    try {
      setUnlocked(loadUnlocked(localStorage.getItem(ACHIEVEMENTS_KEY)));
    } catch { /* private mode */ }
  }, []);

  const unlockedCount = [...unlocked].filter((id) =>
    ACHIEVEMENT_DEFS.some((d) => d.id === id)
  ).length;

  return (
    <Dialog onOpenChange={refreshOnOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName} aria-label="Open achievements">
          <Trophy className="h-4 w-4" aria-hidden />
          {newCount > 0 && (
            <Badge className="ml-1 h-5 min-w-5 justify-center px-1 text-[10px]" variant="default">
              {newCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogDescription className="sr-only">
            Achievements unlocked in this browser — ranked against the full list.
          </DialogDescription>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} / {ACHIEVEMENT_DEFS.length} unlocked
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2 py-2 max-h-[60vh] overflow-y-auto">
          {ACHIEVEMENT_DEFS.map((def) => {
            const isUnlocked = unlocked.has(def.id);
            return (
              <div
                key={def.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isUnlocked
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-muted/30 opacity-60"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isUnlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {isUnlocked ? <Trophy className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{def.name}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{def.desc}</p>
                </div>
                {isUnlocked && (
                  <span className="text-xs font-bold text-primary shrink-0">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
