import ArenaCanvas from "@/components/vg/ArenaCanvas";

export const metadata = {
  title: "SIGNAL FORGE — Arena",
  description: "Navigate the order book battlefield. Green cells regenerate margin, red cells drain it. Survive the volatility.",
};

export default function ArenaPage() {
  return <ArenaCanvas />;
}
