import Link from "next/link";

// /terms — plain-language terms of use (audit release blocker RB-4).
// Matched to reality: free testnet game, no real funds, charts are gameplay
// material (never advice), user-generated names, anti-cheat rights.

export const metadata = {
  title: "CANDLE CLIMBER — Terms",
  description: "The short, honest rules of playing CANDLE CLIMBER.",
};

export default function TermsPage() {
  return (
    <main className="cc-page">
      <div className="cc-page-card">
        <p className="cc-page-eyebrow">TERMS OF USE</p>
        <h1 className="cc-page-title">The short, honest rules.</h1>
        <p className="cc-page-updated">plain-language version · last reviewed 2026-10-11</p>

        <h2>1. What this is</h2>
        <p>
          CANDLE CLIMBER is a <b>free arcade game</b> where platforms are built from public
          market charts. It runs on the vibe/vibe <b>testnet</b> environment. Nothing here
          involves real money: tokens shown in the UI (<b>$WICK</b>) are testnet units with{" "}
          <b>no monetary value</b>, the footer&apos;s &quot;no real funds&quot; is literal, and nothing in the
          game can be bought, sold, or cashed out.
        </p>

        <h2>2. Charts are gameplay, not advice</h2>
        <p>
          Candlesticks, prices, volumes, volatility labels and weather metaphors exist to make
          platforms and atmosphere. They are <b>delayed or derived public data</b> reshaped for
          level design. Nothing in the game is investment, trading, or financial advice, and
          scores have no relationship to real trading outcomes.
        </p>

        <h2>3. Your names and content</h2>
        <p>
          Typed display names, rival handles and submitted scores become part of public daily
          leaderboards and shareable Death Cards. Don&apos;t use names that impersonate others,
          harass, or break the community rules of the vibe/vibe ecosystem. We may remove or
          filter entries that abuse the boards, and we may adjust filters at any time.
        </p>

        <h2>4. Fair play</h2>
        <p>
          Submissions are validated server-side (signed terrain tokens, physical score caps,
          optional wallet ownership proofs). Attempting to forge, script, flood or otherwise
          manipulate leaderboards, duels, airdrop weights or mint flows is abuse; we may reject
          or remove such entries and rate-limit the source. The built-in rival bot and ghost
          replays are part of the game, not cheating — anything clearly labeled as automation
          inside the UI is fine, everything outside it is not.
        </p>

        <h2>5. Availability and changes</h2>
        <p>
          The game is provided <b>as is</b>, on a best-effort basis, and may change daily by
          design (new chart, new mutation). Feeds can fail; when they do, the game honestly
          switches to a labeled synthetic terrain with scoring disabled. We may add, change or
          remove features at any time, and these terms move with the review date at the top.
        </p>

        <h2>6. Testnet on-chain features</h2>
        <p>
          Optional features (Death Card minting, vault reads) interact with smart contracts on
          the Robinhood Chain <b>testnet</b>. Testnet contracts carry no real-value claims and
          may be reset or redeployed. You pay nothing; the game&apos;s operator wallet covers testnet
          gas.
        </p>

        <h2>7. Contact</h2>
        <p>
          Questions, entry removal, abuse reports: <a href="https://discord.gg/vibevibebuilders" target="_blank" rel="noopener noreferrer">community Discord</a>.
          See also the <Link href="/privacy">privacy page</Link> for what is stored.
        </p>

        <p className="cc-page-foot">
          <Link href="/">← back to the game</Link> · <Link href="/privacy">privacy →</Link>
        </p>
      </div>
    </main>
  );
}
