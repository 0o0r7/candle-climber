import Link from "next/link";

// /privacy — player-facing privacy disclosure (audit release blocker RB-4).
// Honest, plain-language, matched to what the code ACTUALLY does:
// no accounts, no tracking cookies, optional wallet, typed guest names,
// localStorage prefs, public daily leaderboards, third-party market feeds.

export const metadata = {
  title: "CANDLE CLIMBER — Privacy",
  description: "What CANDLE CLIMBER stores, what it does not, and who sees it.",
};

export default function PrivacyPage() {
  return (
    <main className="cc-page">
      <div className="cc-page-card">
        <p className="cc-page-eyebrow">PRIVACY</p>
        <h1 className="cc-page-title">What we store — and what we don&apos;t.</h1>
        <p className="cc-page-updated">plain-language version · last reviewed 2026-10-11</p>

        <h2>No accounts. No sign-up. No tracking cookies.</h2>
        <p>
          You can play without creating an account, without an email address, and without a
          wallet. We do not run advertising trackers and we do not set advertising or analytics
          cookies. There is no profile to delete because none is created.
        </p>

        <h2>What you type on the death screen</h2>
        <p>
          After a run you may type a <b>display name</b> (up to 14 characters) and an optional
          <b> rival handle</b>. If you submit a score, that name, your score and run stats
          (candles passed, best streak, timestamp) are stored on a <b>public daily
          leaderboard</b> that anyone can read. Names are filtered for control characters and
          angle brackets, but they are user-generated content: choose a name you are comfortable
          seeing in public. Leaderboard rows are keyed to the UTC day and stay readable in the
          daily archive.
        </p>

        <h2>Wallet link is optional</h2>
        <p>
          Connecting a wallet is optional and only affects the <b>official</b> leaderboard lane
          (one best-run record per wallet per day, proof of ownership via a signature you
          explicitly sign in your wallet). If you connect, we store the <b>public address</b> —
          never your private key or seed phrase. The app cannot move funds; it has no access to
          anything beyond what you sign. Clearing the wallet link in the header removes it from
          this device.
        </p>

        <h2>What stays on your device (localStorage)</h2>
        <p>
          Your personal best, sound preference, first-run tutorial flag, ghost preference,
          character choice and the decorative &quot;wreckage&quot; markers of past falls are saved in your
          browser&apos;s local storage on this device only. Clearing site data in your browser removes
          all of it. Nothing in local storage is transmitted to us by itself.
        </p>

        <h2>Third parties this game talks to</h2>
        <ul>
          <li><b>Market data:</b> public price APIs (Binance, Yahoo/Stooq for stock terrains) are
            fetched server-side to build the daily chart. We send them no information about you.</li>
          <li><b>Hosting:</b> the site is served by Vercel, which handles standard request
            infrastructure (including IP-based protection against abuse).</li>
          <li><b>Error monitoring:</b> Sentry reports technical error traces (no player names,
            no leaderboard content).</li>
          <li><b>Blockchain (testnet):</b> minting a Death Card sends a transaction on the
            Robinhood Chain <b>testnet</b> containing your public wallet address.</li>
        </ul>

        <h2>Children</h2>
        <p>
          The game is a general-audience arcade game, but it is styled around trading themes and
          is not directed at children under 13. We do not knowingly collect personal information
          from children.
        </p>

        <h2>Removing a leaderboard entry</h2>
        <p>
          Because guest rows carry no identifier, we can only remove entries on request:
          reach us on the <a href="https://discord.gg/vibevibebuilders" target="_blank" rel="noopener noreferrer">community Discord</a> with
          the date, the name, and the score, and we will take the row down.
        </p>

        <h2>Changes</h2>
        <p>
          If data practices change, this page changes with them and the review date at the top
          moves. The game itself will always tell you what it is about to store: names are typed
          by you, wallets are linked by you, everything else never leaves your device.
        </p>

        <p className="cc-page-foot">
          <Link href="/">← back to the game</Link> · <Link href="/terms">terms →</Link>
        </p>
      </div>
    </main>
  );
}
