import GameCanvas from "@/components/cc/GameCanvas";
import { SettingsProvider } from "@/lib/settings-context";

export const metadata = {
  title: "CANDLE CLIMBER — Play",
  description: "Climb today's chart. Green candles hold, red candles crumble.",
};

export default function PlayPage() {
  return (
    <SettingsProvider>
      <GameCanvas />
    </SettingsProvider>
  );
}
