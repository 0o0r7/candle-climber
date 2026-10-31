import { redirect } from "next/navigation";
import { utcDateStr } from "@/game/cc/rng";

export const dynamic = "force-dynamic"; // "today" is a request-time fact

// /chart → today's chart. The stable address a nav link or a share can use
// without knowing the date.
export default function ChartIndex() {
  redirect(`/chart/${utcDateStr()}`);
}
