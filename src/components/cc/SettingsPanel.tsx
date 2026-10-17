"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-context";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPanelProps {
  triggerClassName?: string;
  triggerVariant?: "default" | "ghost" | "outline" | "secondary";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerLabel?: string;
}

export default function SettingsPanel({
  triggerClassName,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerLabel,
}: SettingsPanelProps) {
  const { settings, update, toggle } = useSettings();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          <Settings className="h-4 w-4" />
          {triggerLabel && <span className="ml-1.5">{triggerLabel}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* ── Sound ────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sound</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="mute-toggle" className="text-sm">Mute</Label>
              <Switch id="mute-toggle" checked={settings.muted} onCheckedChange={() => toggle("muted")} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume-slider" className="text-sm">Volume</Label>
                <span className="font-mono text-xs text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                id="volume-slider"
                min={0}
                max={100}
                step={5}
                value={[Math.round(settings.volume * 100)]}
                onValueChange={([v]) => update({ volume: v / 100, muted: v === 0 ? true : settings.muted })}
                disabled={settings.muted}
              />
            </div>
          </div>

          {/* ── Accessibility ─────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accessibility</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cb-toggle" className="text-sm">Colorblind Mode</Label>
                <p className="text-xs text-muted-foreground">Patterns on green/red candles</p>
              </div>
              <Switch id="cb-toggle" checked={settings.colorblind} onCheckedChange={() => toggle("colorblind")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rm-toggle" className="text-sm">Reduced Motion</Label>
                <p className="text-xs text-muted-foreground">Disable shake, tremor, confetti</p>
              </div>
              <Switch id="rm-toggle" checked={settings.reducedMotion} onCheckedChange={() => toggle("reducedMotion")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="haptics-toggle" className="text-sm">Haptics (Mobile)</Label>
                <p className="text-xs text-muted-foreground">Vibration on jump / land / death</p>
              </div>
              <Switch id="haptics-toggle" checked={settings.haptics} onCheckedChange={() => toggle("haptics")} />
            </div>
          </div>

          {/* ── Gameplay ─────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gameplay</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="ghost-toggle" className="text-sm">Ghost Replay</Label>
              <Switch id="ghost-toggle" checked={settings.ghostOn} onCheckedChange={() => toggle("ghostOn")} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="bot-toggle" className="text-sm">Rival Bot</Label>
              <Switch id="bot-toggle" checked={settings.botOn} onCheckedChange={() => toggle("botOn")} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
