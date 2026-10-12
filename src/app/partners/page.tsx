"use client";

// /partners — the PARTNER chart lane: public explanation + application form.
//
// Owner directive (2026-10-12): no pilot partners exist and the owner has no
// seed connections, so the lane grows through THIS page — a clear explanation
// (doubles as a vision statement for the ecosystem/platform team that reviews
// the project after launch) plus a request form (Discord / Twitter / email)
// so project and community owners can apply; we then get in touch.
//
// Honesty rules on this page (LAW 4 + council red lines):
// - The gate is on the PROJECT (provider), never the player: every partner
//   chart is playable by everyone, free, walletless.
// - The daily main chart slot and the scoreboard are never purchasable.
// - Testnet status stated plainly; no returns promised to anyone; the
//   threshold is quoted as a derived value with its source.
import { useState } from "react";
import PartnerPool from "./PartnerPool";

interface ApplyState {
  status: "idle" | "sending" | "ok" | "error";
  note?: string;
}

const SIZES = ["<100", "100-1k", "1k-10k", "10k+"];

export default function PartnersPage() {
  const [form, setForm] = useState({
    projectName: "",
    walletAddress: "",
    tokenContract: "",
    communitySize: SIZES[0],
    discord: "",
    twitter: "",
    email: "",
    links: "",
    message: "",
    website: "", // honeypot — hidden from humans
  });
  const [state, setState] = useState<ApplyState>({ status: "idle" });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setState({
          status: "ok",
          note: "Request received. Every application is reviewed manually — we will reach out on Discord or email.",
        });
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState({ status: "error", note: body.error ?? "Something went wrong — try again." });
      }
    } catch {
      setState({ status: "error", note: "Network error — try again." });
    }
  }

  const inputCls =
    "w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400/60";
  const labelCls = "block text-xs uppercase tracking-wide text-white/50 mb-1";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white/90">
      <h1 className="text-3xl font-bold tracking-tight text-white">PARTNER charts</h1>
      <p className="mt-2 text-sm text-white/60">
        Your community's real token chart — always available in Candle Climber.
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-white">What this is</h2>
        <p>
          Candle Climber turns real market charts into climbing terrain: the chart of the day is
          the mountain, every player climbs the exact same terrain, and the leaderboard is
          skill-only. The <strong className="text-white">PARTNER pool</strong> extends the
          always-available charts with tokens chosen by the projects and communities behind them.
        </p>

        <h2 className="text-lg font-semibold text-white">The goal</h2>
        <p>
          We want every community to have a home terrain — a real chart its members rally around,
          compete on daily, and share. Partners bring their people; we bring the fairest
          competitive surface a chart game can have (deterministic daily terrain, no per-player
          randomness, unbuyable scoreboard).
        </p>

        <h2 className="text-lg font-semibold text-white">What a partner gets</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Their token's chart in a clearly labeled PARTNER pool, playable every day by anyone —
            free, no wallet required, for every player (the gate is on us and the project, never
            on players).
          </li>
          <li>A daily competitive surface their community can own: same terrain for everyone, fair cups later.</li>
          <li>Honest placement: labeled as a partner chart — never mixed into the daily spotlight, never touching scores.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white">What we ask (and why)</h2>
        <p>
          A registered wallet holds <strong className="text-white">≈ 1.25 ETH worth of $WICK</strong>{" "}
          while the chart is listed. Why this number: the platform's own curve config sets the
          graduation raise target at <strong className="text-white">5 ETH</strong> (verified from
          the launch platform's public configuration), and the partner cohort is sized so that
          about four partners' entries cover that entire raise — partner demand is literally the
          fuel that graduates the token. The check is on-chain and continuous (no keys, public
          RPC), with a 7-day grace period before a chart would stop appearing for future days.
        </p>
        <p className="text-white/60">
          Meeting the threshold starts the conversation; it does not guarantee listing. Every
          application is reviewed manually. A reliable price feed for your token (for example a
          launched bonding-curve token) is required before a chart can be built.
        </p>

        <h2 className="text-lg font-semibold text-white">Our hard lines (so you know the game stays fair)</h2>
        <ul className="list-disc space-y-1 pl-5 text-white/70">
          <li>The daily chart slot is never for sale — partner charts never replace it.</li>
          <li>The scoreboard is never for sale — holdings change nothing about anyone's score or rank.</li>
          <li>Playing a partner chart is free for everyone, forever, no wallet required.</li>
          <li>Nothing here is an investment offer; we promise no returns to anyone. Testnet today — no real funds.</li>
        </ul>
      </section>

      <PartnerPool />

      <section className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Apply for a partner chart</h2>
        <p className="mt-1 text-sm text-white/60">
          Tell us where to reach you and what wallet will hold $WICK. We review by hand and reply
          on Discord or email.
        </p>

        {state.status === "ok" ? (
          <div className="mt-6 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            {state.note}
          </div>
        ) : (
          <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submit}>
            {/* honeypot — visually hidden, ignored by humans */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.website}
              onChange={set("website")}
              className="hidden"
            />
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="p-name">Project / community name *</label>
              <input id="p-name" className={inputCls} maxLength={60} required value={form.projectName} onChange={set("projectName")} placeholder="e.g. Neon Charts Guild" />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-wallet">Wallet that will hold $WICK *</label>
              <input id="p-wallet" className={inputCls} required value={form.walletAddress} onChange={set("walletAddress")} placeholder="0x…" spellCheck={false} />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-token">Token contract (if launched)</label>
              <input id="p-token" className={inputCls} value={form.tokenContract} onChange={set("tokenContract")} placeholder="0x… (optional)" spellCheck={false} />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-size">Community size *</label>
              <select id="p-size" className={inputCls} value={form.communitySize} onChange={set("communitySize")}>
                {SIZES.map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="p-discord">Discord ID / invite handle *</label>
              <input id="p-discord" className={inputCls} maxLength={60} required value={form.discord} onChange={set("discord")} placeholder="username or server invite" />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-twitter">Twitter / X</label>
              <input id="p-twitter" className={inputCls} maxLength={60} value={form.twitter} onChange={set("twitter")} placeholder="@handle (optional)" />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-email">Email *</label>
              <input id="p-email" type="email" className={inputCls} required value={form.email} onChange={set("email")} placeholder="you@project.xyz" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="p-links">Links</label>
              <input id="p-links" className={inputCls} maxLength={200} value={form.links} onChange={set("links")} placeholder="site, docs, socials (optional)" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="p-msg">Anything else</label>
              <textarea id="p-msg" className={inputCls} rows={4} maxLength={1000} value={form.message} onChange={set("message")} placeholder="Tell us about your community and your token (optional)" />
            </div>
            {state.status === "error" && state.note && (
              <p className="sm:col-span-2 rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{state.note}</p>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={state.status === "sending"}
                className="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {state.status === "sending" ? "Sending…" : "Send request"}
              </button>
              <p className="mt-2 text-xs text-white/40">
                Your contact details are private: stored for review only, never shown publicly.
              </p>
            </div>
          </form>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-white/30">
        testnet · no real funds · back to <a className="underline hover:text-white/60" href="/">the climb</a>
      </p>
    </main>
  );
}
