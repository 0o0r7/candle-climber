# STOCK TOKENS DEEP DIVE — 2026-10-10 (Task 76)

> **TL;DR فارسی برای مالک (خلاصه ساده):**
> حق با شماست. ما «توکن‌های سهام» را یک جا اشتباه فهمیدیم: در جلسه قبلی من «سهامی» را
> به معنی استعاره («سهمی از موفقیت») گرفته بودم، ولی منظور واقعی چیز ملموس‌تر است:
> **توکن استاک = توکن‌های سهام (Stock Tokens)** که ستون اصلی اکوسیستم vibe/vibe است.
> کل مستندات رسمی پلتفرم (۲۱ صفحه)، نسخه GitBook، کانفیگ زنده پروتکل، کد سمت‌کلاینت
> پلتفرم، و صفحه رسمی Robinhood Stock Tokens را کامل خواندم. یافته‌ها:
> (۱) پلتفرم هنگام ساخت توکن، جفت‌شدن با سهام را پشتیبانی می‌کند — سهام‌های تست:
> NVIDIA، SpaceX، Apple (+ پیش‌IPO: OpenAI، Anthropic + ارز: USDG).
> (۲) Robinhood Stock Tokens واقعی: ۱۹۰+ توکن بدهی توکن‌شده با پشتوانه ۱:۱ سهم واقعی
> در امین رسمی و انتقال سود تقسیمی (dividend) — «اکسپوژر اقتصادی، نه سهم قانونی».
> (۳) کل اکوسیستم با منطق «هولد = سهم از ماشین» کار می‌کند: بازخرید پروتکل (نصف برن،
> نصف توزیع بین دارندگان $VIBEVIBE)، و ۹۵٪ کارمزد NFT های vibe viber → خرید سبد سهام
> AI توکن‌شده → توزیع وزن‌دار بین دارندگان.
> (۴) برای ما: $WICK جفتش ETH است و بعد از لانچ قابل تغییر نیست؛ ولی اقتصاد پیکربندی‌شده‌ی
> خود WICK همین حالا لایه سهام‌گونه دارد (۷۵٪ مالیات → بازتاب هولدرها بعد از فارغ‌التحصیلی)
> و بازی ما از قبل روی کندل واقعی بازار (شامل سهام) سوار است — یعنی محصول ما ذاتاً با این
> روایت هم‌راستاست. لانچ دوم با جفت SPCX فقط تصمیم مالک است.
> (۵) نتیجه برای بحث Law 1: همه سطوح جایزه پلتفرم ولت-محورند (لیدربورد رسمی، مخاطبان
> ایردراپ، شایستگی‌ها، رفرال). پیشنهاد من سر جای خودش محکم‌تر شد: **ولت = هویت رسمی،
> بازی کامل رایگان بماند، حالت مهمان غیررسمی بماند** — نیاز به امضای شما دارد.
> (۶) اصلاح صادقانه سنجه: متر الان **۲٫۶۱٪** است (۰٫۱۰۴۵ از ۴ ETH) — فروش‌ها آن را از ۳٫۹۴٪
> پایین کشیده‌اند. نگرانی «بازی یکبارمصرف» شما الان در رزرو کرو دیده می‌شود.
> (این سند مکانیزم پلتفرم را توصیف می‌کند؛ هیچ قول بازده‌ای برای $WICK نیست.)

---

Trigger: owner correction (2026-10-10) — «توکن‌های سهام» means **Stock Tokens**; the platform
docs at https://testnet.vibe-vibe.fun/docs (and its mirrors) are a primary reference we treated
too lightly. Mandate: full-source deep dive (all sub-links, related sites, and any lead toward
trustworthy data) BEFORE answering the pending LAW 1.2 question. No code, no law edits — paper only.

## 0. Method and source inventory (all fetched 2026-10-10, from this sandbox)

| # | Source | How read | Result |
|---|--------|----------|--------|
| S1 | https://testnet.vibevibe.fun/docs/ | SPA shell → `assets/content.js` (`window.DOCS`, JSON) | 21 sections parsed + read in full (`scripts/vibe-docs-pages/`) |
| S2 | GitBook mirror vibe-vibe.gitbook.io/vibe-vibe-docs | `llms.txt` + all 21 `.md` pages | Same 21 pages; status-string drift noted (§1a) |
| S3 | /docs/protocol runtime reference | SPA chunk `DocsPage-*.js` → feeds from `/api/v1/chains/46630/config` | Live config fetched (S4) |
| S4 | `/api/v1/chains/46630/config` | curl, live | policyVersion, deployments, canonicalAssets, quoteAssets, features (§3.8) |
| S5 | Platform client bundle `static-v2/domain-shared-*.js` | curl + regex | Pair-asset catalog, project types, stockPairOptIn schema (§1a) |
| S6 | `v6/launches/0xe2ce…16c` (WICK) | curl, live, meta FRESH lag=1 block | weights/target/curve/gifts (§3, §4) |
| S7 | `buybacks/summary` | curl, live | 62,902 executions; sfund sink status (§1c) |
| S8 | `season/builders`, `tokens/…/project-types` | curl, live | board is wallet-keyed; WICK `["vibecoded_product"]` (§3.4, §3.5) |
| S9 | https://robinhood.com/rhj/stocktokens/ | curl | 190+ Stock Tokens, 1:1 backing, dividends, jurisdictions (§1b) |
| S10 | https://vibevibe.fun/vibe-vibers | curl (SPA title/hero) | "Your quant agent. With tokenized AI stock distributions." |
| — | X walkthrough post (Agent Quant Office) | not fetchable (login wall) | docs description used instead; noted |

Full API endpoint inventory extracted from the client (60+ routes) is preserved in
`/home/z/my-project/scripts/` session artifacts; the economy-relevant subset is cited below.

## 1. The three senses of "سهام" in this ecosystem — what the docs actually say

### 1a. Stock pairs = a first-class launchpad feature (S1 `mechanics/stock-pairs`, S2, S5)
- Docs (testnet version): "**Status: Test pairs available on testnet.** The create flow offers
  supported stock-labeled test assets… no monetary value, not company shares… does not
  establish mainnet availability of a real-world security."
  GitBook version says "**Status: In testing.** Stock pairs let creators pair launches with
  supported tokenized stocks and other real-world assets." (drift = docs are actively maintained)
- "**Beyond the pair** doctrine": "vibe/vibe is being built to support developers who use
  supported stock and RWA pairs as **foundations for products, applications, tools, and
  communities**. The pair can provide market context for a project…"
- Full client-compiled pair catalog (S5, live strings):
  - `stocks`: **NVDA** `0x3ab0…03F0`, **SPCX** `0xba16…5Ac9`, **AAPL** `0x4388…AcF2`
    — on-chain names "…(vibe/vibe test stock, no value)"
  - `preipo`: **OPENAI** `0x1b14…1A5F`, **ANTHROPIC** `0x92dC…868C` — "…not equity"
  - `currencies`: **USDG** `0x1021…3264` (6 decimals)
  - category enum in code: `["classic","vibe","stocks","preipo","commodities","currencies","crypto","leveraged","community"]`
- **Server-registered quote assets** (S4 `quoteAssets`): exactly ONE — **SPCX**
  (`0x5a5398155d98374c0e26265ea3cb9818169c2739`), with its own `initialVirtualReserveBaseUnits`
  and `netGraduationTargetBaseUnits ≈ 82.74 SPCX`. So a NEW launch CAN denominate its
  graduation target in a stock asset, today, on this deployment. NVDA/AAPL remain UI-catalog
  entries until server-registered (matches our VIBE-LAUNCHPAD-INTEL.md finding).
- Legal plumbing exists in the client schema: `stock_pair | non_stock_pair` discriminator +
  `stockPairOptIn` + `stockPairDeclarationVersion: "airdrop-stock-selection-2026-09-22-v1"`
  — i.e. stock-pair participation has its own declaration/versioning surface.

### 1b. Robinhood Stock Tokens — the underlying product line (S9, S1 glossary "Tokenized stock")
- Robinhood official page: "**190+ Stock Tokens**… NVIDIA, Google, Apple, Invesco QQQ."
- Form: "**tokenized debt securities issued by Robinhood Assets (Jersey) Limited**… provide
  economic exposure to underlying securities but do not grant investors any legal or beneficial
  rights in, or against the issuer of, those underlying securities."
- "**Shares behind every Stock Token. Unlock dividends with Stock Tokens backed 1:1 by the
  underlying stock. Held by a licensed custodian.**"
- "Not registered under U.S. securities laws… may not be offered, sold, or delivered… in the
  United States or to U.S. persons… restrictions in Canada, UK, Switzerland…" (+ more).
- DeFi angle: "Deploy them onchain to earn yield, use as collateral to borrow, and more."
- vibe/vibe's test stock mocks (S5) are NOT these tokens; the ecosystem's mainnet direction
  points at products built around them.

### 1c. Equity-like distribution mechanics across the whole stack (S1, S4, S7)
- **Project tax (V6)**: creator picks 1%/2%/3% base. Split = **80% project share** (creator
  fixes weights at launch across: treasury in pair asset / holder rewards in pair asset /
  holder rewards in launched token / burn) + **20% protocol share**. FAQ adds: of the protocol
  share, 80% buys back $VIBEVIBE → **half burned, half distributed to eligible $VIBEVIBE
  holders**; remaining 20% of the protocol share → treasury. Opening 20s anti-sniper surcharge
  99%→base. "Holder rewards… become claimable **after graduation**" — pull-based, not auto-send.
- **WICK live-verified weights** (S6): `holdersBps 7500 / cashBps 2000 / burnBps 500 /
  holdersPairBps 0` on `taxBps 200` — i.e. WICK already runs the equity-like holder-reflection
  lane at its maximum practical weight (75% of the whole tax), treasury 20%, burn 5%.
- **$VIBEVIBE**: canonical pool LIVE on this testnet deployment (S4 `canonicalAssets`:
  poolId `0xb933…1f32`, ETH/VIBEVIBE V4 pool fee 3000, `buybackExecutorAddress` configured,
  `tradingEnabled: true`). Buyback is "rate-limited and capped, with a six-hour delay after
  VIBEVIBE graduates… should not be described as the same unconditional buyback for every
  pair asset." (S7: 62,902 historical buyback executions platform-wide; sfund sink
  `status: AVAILABLE`, 18.8 ETH spent, 4,958 tokens burned — the sink machinery is real.)
- **vibe vibers** (10,000 free-mint, begin soulbound → Charged via XP): "**95% of vibe viber
  trading fees** will be used to buy a **basket of tokenized AI stocks** for distribution to
  eligible vibe viber holders, **with higher-level vibe vibers receiving greater weighting**"
  (95% of the collection's trading fees, not of sale value; subject to legal/jurisdiction
  review). Official site tagline: "Your quant agent. With tokenized AI stock distributions."
- **$SPARK** (Base `0x0fb0…8248`): **25% of $VIBEVIBE supply** at TGE, proportional, no
  minimum, **fully unlocked, no vesting**; per-200k $SPARK → one vibe viber whitelist slot;
  top-250 Fomo holders → whitelist.
- **Testnet creator program**: **5% of $VIBEVIBE supply** = traders/users 1.75% + meme creators
  1.50% + **vibecoded/product & RWA creators 1.50% combined** + old-testnet 0.25%. Evidence bar
  for our track: "**a working demo or MVP with evidence that it belongs to the submitting creator**".
- **Referrals**: 25% of the protocol's 20% share = 5% of protocol tax receipts, wallet-link based.

**Synthesis:** the ecosystem's design language is literally "**hold = share of the machine**"
(reflections, buyback halves, AI-stock baskets, supply allocations) — stated everywhere with
compliance dampers ("does not guarantee…"). This is what the founders meant by equity-style
tokens: not a metaphor, a concrete pillar (stock pairs + stock-backed distributions).

## 2. Where WE underweighted it — honest record
1. `WICK-LAUNCH-FORM-PACK.md:144` — "if Stock pairs visible → choose Classic (native ETH)".
   Correct for WICK's launch decision, but we never revisited the stock pillar as an
   ecosystem direction afterwards.
2. Task 75 (this session) — I rendered «توکن‌های سهامی» as a metaphor ("share of success via
   the 75% tax share"). Owner's correction stands: the ecosystem carries a CONCRETE
   stock-token pillar (§1a–1c). The metaphor is a side-effect; the pillar is the point.
3. Our own intel had the leads and we filed them as narrative, not design input:
   - `X-GITHUB-DEEP-READ-2026-10-07.md:70-72`: founder math "95% of NFT fees buy tokenized
     AI stocks", "the agent/Quant Office direction".
   - `INTEL-UPDATE-2026-10-07.md:137`: "next meta = stock memes again"; founder: "gonna be
     stock + memes + …".
4. Counter-record (what we got RIGHT, to keep the audit honest): VIBE-LAUNCHPAD-INTEL.md
   already established the technical facts — only SPCX is server-registered, routed pairs
   add a hop, NVDA/AAPL are UI-only — and W3 shipped real stock rails (Yahoo v8) in the game.

## 3. What this changes for Candle Climber / $WICK (facts, not decisions)
3.1 **Cannot re-pair $WICK.** Docs FAQ: "Can launch settings be edited later? — No. Pair, tax,
    routing… cannot be edited after the token launches." WICK is ETH-paired, `targetPairUnits`
    = 4.0 ETH (S6). Any stock-denominated identity for the WICK family would be a NEW launch
    = owner-only decision (yellow/red envelope), and SPCX is the only server-registered stock
    quote available (S4).
3.2 **WICK's economics already carry the equity-like layer**: 75% of every trade's tax accrues
    to holders as token reflections, claimable after graduation (pull-based), plus 5% burn
    (S6). What the deep dive adds: our mirror of the platform docs ("75/20/5") is CONFIRMED
    against the launch record, and the platform docs' 80/20 model reconciles exactly
    (75+20+5 = the creator-configured 80% slice; the fixed 20% protocol share is separate).
3.3 **The game is already stock-native.** W3 rails (Yahoo v8; TSLA/AMZN/NFLX et al.) mean the
    daily mountain IS a real symbol's chart — the "market context" the docs describe. The
    stock-pillar alignment for us is narrative + product, not a re-launch requirement.
3.4 **Program positioning (live-verified)**: `projectTypes: ["vibecoded_product"]`
    (source CREATOR_UPDATE) → the 1.50% combined vibecoded+RWA track of the 5% testnet pool.
    The game, repo, X account, and live meter satisfy the stated evidence bar (working demo
    with proof of ownership). No guarantee implied — the docs repeat: participation does not
    create a right to allocation.
3.5 **Leaderboards are wallet-keyed** (S1/S8): "A **connected wallet** can see its placement on
    the Traders, Builders, and Season views"; expanded project boards (incl. **Vibecoded &
    Utility**) "coming next". Our typed-name classic board cannot surface on ANY platform
    placement. Season board formula observed (S8): graduated-token performance dominates
    (rank-2 wallet has 1 launch — a graduated LOLHOOD). → strengthens the identity argument
    in §5.
3.6 **Graduation-airdrop config was NOT set at WICK launch** (S6 `gifts.root = 0x0`,
    `reservedUnits = 0`). Configuration is launch-fixed; it cannot be added now. Recorded
    honestly as a missed launch-time lever; graduation itself (Uniswap v4 pool, locked
    liquidity, reflections claimable) is unaffected.
3.7 **A stock-paired experiment (SPCX) is possible only as a NEW token** — owner-gated; not in
    any agent queue. If ever considered, budget the routed-pair hop and USD-rate caveats from
    VIBE-LAUNCHPAD-INTEL.md.
3.8 **$VIBEVIBE sink is live infrastructure** (S4): the protocol-side buyback→burn/distribute
    route is configured on THIS deployment (canonical asset + executor). For WICK (native-ETH
    pair), the 20% protocol share routes through this native sink once its activation
    conditions are met; before that it routes to treasury. WICK itself has no rows in the
    top-100 buyback table yet (S7) — consistent with the thin 5% burn weight.

## 4. Live-state corrections (E0.5 delta, 2026-10-10)
- **Meter = 2.61%** — `pairReserveUnits 0.104467468 ETH / targetPairUnits 4.0 ETH`
  (S6, meta FRESH: asOfBlock 132065922, lag 1 block, observed 2026-10-10T05:38Z).
  **DOWN from 3.94% (0.1574 ETH)** recorded at the E0.4 ritual (10-08): recent fee events show
  9 SELL vs 12 BUY; sellers removed ≈0.053 ETH of curve reserves; **last trade 2026-10-07T21:32Z**
  → ~2.5 days of zero trading. The "disposable game" risk the owner named is visible in the
  reserve line: with no rendered hold-need, sell-side pressure pulls the meter backward.
- **Registered constants re-verified against runtime config (S4)**:
  `policyVersion: seedify-curve-v3-testnet-5eth-2pct-3pct-creator-125bps-75-25`;
  `curveWalletCapBps: 200` (the 2% per-wallet cap — breadth math stands);
  `transfersLockedUntilGraduation: true`; legacy curve: 5 ETH target, 1.25% fee,
  creator 7500 / protocol 2500 bps, creator fees split 50% payout / 50% launch-token buyback,
  protocol fees split 50% treasury / 50% sfund buyback (`irrecoverable-burn-address`,
  keeper-authorized-with-external-limits); creationFee 0.0005 ETH.
  WICK runs the V6-era record (4.0 ETH target in pair units) on factory
  `0xe794…9fea0` — the app's `/docs/protocol` page is the runtime mirror of these values.
- **Burn figure**: B13 reconciliation still open (0xdEaD read vs API burn lanes).

## 5. Consequence for the pending LAW 1.2 debate (paper only — no code, no amendment)
The deep dive does NOT overturn the council's numbers (2% wallet cap → meter = f(buyer
COUNT)); it STRENGTHENS the owner's identity thesis with platform evidence:

- Every platform-level reward surface is **wallet-keyed**: boards ("connected wallet can see
  its placement"), graduation-airdrop audiences (wallet-associated opt-ins), ecosystem
  eligibility (per-wallet tracks), referrals (wallet invitation links), season views.
- LAW 1.2's anonymous mode, by construction, can reach NONE of them. The typed-name board
  exists only inside our own app — invisible to the ecosystem where the stock-style
  distributions and the 5% pool actually live.
- The owner's stock-token point integrates cleanly: **identity is the pipe; the stock pillar
  is the destination.** A holder whose wallet is linked becomes a visible participant in the
  surfaces where reflections/airdrops/weights matter; an anonymous player is invisible to all
  of them.

Options (unchanged in shape, re-graded in confidence):
- **A. Keep LAW 1.2 untouched** — cost: permanent platform-invisibility of players; the game
  stays a demo in the ecosystem's eyes. Confidence: LOW given §3.5 evidence.
- **B (recommended): Wallet = official identity.** Full gameplay stays free (LAW 1.1 intact);
  guest mode (typed name) remains but is explicitly unofficial; official season board,
  weights ledger, and any eligibility surface are wallet-bound. Mirrors the platform's own
  pattern exactly ("connected wallet can see its placement"). Requires a LAW 1.2 amendment via
  LAW 5.3 (dated note + owner signature) → YELLOW envelope, owner-gated.
- **C. Hard wallet gate / hold-to-enter** — still rejected: funnel math (2% cap) + platform
  docs do not require it + psychological cost (council round-2). Confidence: LOW.

Recommendation to the owner: sign **B**. It converts every existing council surface (D9
link-at-pride, F3 anonymity-cliff fix, weights ledger) into platform-visible identity without
building any wall, and it is the smallest possible edit to LAW 1.2 (add "official" surfaces
require a linked wallet; free anonymous play remains).

Honesty box: nothing here promises allocation, reward, or value. The platform's own words
("participation… does not guarantee an allocation") are adopted verbatim into any copy we ship.

## 6. Source anchors (verbatim quotes for audit)
- S1 stock-pairs: "Where a supported pair is a Robinhood Stock Token, it is a tokenized debt
  security issued by Robinhood Assets (Jersey) Limited. It provides economic exposure to an
  underlying security but is not a share…"
- S1 buyback: "Half of the tokens bought are burned and half go to eligible VIBEVIBE holders…
  rate-limited and capped, with a six-hour delay after VIBEVIBE graduates."
- S1 vibers: "95% of vibe viber trading fees will be used to buy a basket of tokenized AI
  stocks for distribution to eligible vibe viber holders, with higher-level vibe vibers
  receiving greater weighting."
- S1 eligibility: "5% of $VIBEVIBE supply is allocated across testnet users and token
  creators… Vibecoded/product and RWA creators — 1.50% combined."
- S1 leaderboards: "A connected wallet can see its placement on the Traders, Builders, and
  Season views."
- S4 config: policyVersion `seedify-curve-v3-testnet-5eth-2pct-3pct-creator-125bps-75-25`;
  `curveWalletCapBps: 200`; `transfersLockedUntilGraduation: true`; quoteAssets = SPCX only.
- S6 launch: `weights {cashBps:2000, holdersBps:7500, burnBps:500, holdersPairBps:0}`;
  `targetPairUnits 4000000000000000000`; `transfersUnlocked:false`; `gifts.root 0x0…0`.
- S9 Robinhood: "190+ Stock Tokens… backed 1:1 by the underlying stock. Held by a licensed
  custodian… do not grant investors any legal or beneficial rights…"
- Artifacts kept in sandbox: `scripts/vibe-docs-pages/*` (21 parsed sections),
  `scripts/gb-md/*` (21 GitBook md), `scripts/api-*.json` (config, WICK, buybacks, board).
