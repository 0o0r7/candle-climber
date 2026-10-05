# ECOSYSTEM STUDY — what vibe/vibe wants next

## Scope and method

This study deliberately uses ecosystem knowledge only. It reads the four committed files in `0o0r7/vibe-ecosystem-kb/research/vibevibe/`, the allowed `docs/` documents from `0o0r7/candle-climber`, and a read-only recheck of the public launchpad API on 2026-10-05. It does **not** use either existing game's source as a design base. The protected game repositories remain read-only.

Claims that are not verified are marked **[UNVERIFIED — NEEDS OWNER INPUT]**.

## 1. Founder taste profile

### The founder is a builder, not merely a token promoter

The founder/technical identity maps to `@meta_alchemist` and `github.com/Vibeforge1111`, with the same person operating the vibe/vibe and Spark sides. The public GitHub footprint is builder-heavy: agent infrastructure, research tools, scanner tooling, radar surfaces, and developer utilities. The research describes Spark's playbook as **free tool → stars → audience → productized subscription**. (Source: `research/vibevibe/2026-10-03-ecosystem-intel.md`, §§1–2.)

**Implication:** a credible new product should have an immediately usable core, not only a token wrapper. A founder who builds tools can recognize whether the thing actually works.

### What gets visible praise

The clearest captured curation signal is the founder's reaction to Vibe Arena / Vibe Folk: **“this is super cool, and love the UI and art”** followed by the critique that the game should be easier to find when entering the site. The promoted project was a one-week solo build: free-to-play, readable in the first screen, and connected to its testnet token through optional holder perks. (Source: `research/vibevibe/2026-10-03-vibe-team-intel.md`, §3.)

The source also records the founder's specific distribution language: **“chef v/v just cooked”**, **“one verb for today: cook”**, **“the pad is the kitchen”**, “vibecheck”, “enjoy”, and direct `@` mentions. Captured posts used cashtags and mentions, with zero hashtags across the observed sample. (Source: `research/vibevibe/2026-10-03-vibe-team-intel.md`, §§5, 8.)

**Implication:** the product must be legible in a timeline card and desirable before the reader understands every mechanic. The launch hook should be one strong sentence plus a playable URL, not a hashtag wall or a speculative economic thread.

### What the platform and founder appear to ignore

The evidence does not show curation for anonymous meme-only launches; the research says recent visible activity was dominated by low-description launches while real products are scarce. It also says the founder's own time is concentrated in Spark tooling and Robinhood Chain trading/curation surfaces, described as “Product & Utility with real users.” (Sources: `research/vibevibe/2026-10-03-ecosystem-intel.md`, §§2, 5; `docs/HANDOFF-2026-10-04.md`, §5.)

**Boundary:** exact private curation criteria and all promoted-post history are not fully observable from this environment. **[UNVERIFIED — NEEDS OWNER INPUT]**

## 2. Platform mechanics that constrain product design

### Testnet honesty is a product requirement

The launchpad agreement says test ETH, testnet tokens, fees, and rankings have no monetary value or redemption. It describes any future recognition of participation as discretionary, makes no program promise, and states that mainnet may never launch. It also warns that listings are not vetting, endorsement, audit, or investment advice. (Source: `research/vibevibe/2026-10-03-vibe-team-intel.md`, §7; `docs/WICK-LAUNCH-FORM-PACK.md`, §8.)

**Design consequence:** every token-facing surface must say testnet and no monetary value; “builds recognition weights” is acceptable only as a future, non-guaranteed framing. No reward/earnings promise, gambling texture, fake metrics, or investment language.

### Current launch rails are concrete but mutable

The public recheck of `https://testnet.vibevibe.fun/api/v1/chains/46630/config` returned Robinhood Chain Testnet (chain ID 46630), policy `seedify-curve-v3-testnet-5eth-2pct-3pct-creator-125bps-75-25`, a 5 ETH net graduation target, a 125 bps curve fee, and transfers locked until graduation. It returned one server-registered quote asset, SPCX. These are current observations, not permanent guarantees.

The committed launchpad research explains the same mechanics: 1.25% curve fee split 75% creator / 25% protocol, creator share split between payout and launch-token buyback, a 2% wallet cap, 3% creator opening-buy cap, 1e9 supply, 0.0005 ETH creation fee, and locked transfers before graduation. (Sources: current API recheck; `docs/TOKEN-LAUNCHPAD-RESEARCH.md`, §§3–6; `docs/VIBE-LAUNCHPAD-INTEL.md`, §§1–5.)

**Design consequence:** do not embed contract addresses, tax percentages, quote assets, graduation targets, or wallet-balance assumptions into a game unless the owner supplies a current launch decision. Any such future integration is **[UNVERIFIED — NEEDS OWNER INPUT]**.

### The platform's breadth requirement favors many users

The 2% curve wallet cap prevents a single wallet from carrying a launch to graduation. The growth strategy therefore emphasizes many daily players and genuine demand rather than spenders. Transfers being locked means pre-graduation product mechanics can read balances but cannot rely on user transfers, custody, or user-initiated burns. (Source: `docs/GROWTH-AND-HOOKS-STRATEGY.md`, §§1–4; `docs/TOKEN-LAUNCHPAD-RESEARCH.md`, §§5–6.)

**Design consequence:** the base product must be playable without a wallet. A holder utility can be additive—cosmetics, rooms, modes, or identity—but must never change fair ranked score or base access.

### The launchpad is a discovery surface, not just a token factory

The token research lists Discover tabs, curves, graduation, locked liquidity, creator fee rails, gift/airdrop infrastructure, guilds, and a project-showcase distribution surface as the value of using the launchpad. It explicitly says a custom contract deployment gives up discoverability. (Source: `docs/TOKEN-LAUNCHPAD-RESEARCH.md`, §§1–3.)

**Design consequence:** a new game should be useful before its token exists and should have a one-line identity that survives being displayed beside many launches.

## 3. Product scarcity and the value of being real

The platform research describes a quiet launch surface where recent launches skew toward simple tokens and visible real products are scarce. The live API sample rechecked today showed the most recent returned items as small branded launches with current curve progress, but no evidence here establishes a complete product census. **[UNVERIFIED — NEEDS OWNER INPUT]**

The strongest evidence is structural: the launch minimum is an MVP, demo, prototype, or usable flow; the founder's own GitHub output is full of shipped tools; the Vibe Arena example was promoted within roughly a week because it was playable, had strong UI/art, and had an obvious free core plus optional token utility. (Sources: `docs/TOKEN-LAUNCHPAD-RESEARCH.md`, §3; `research/vibevibe/2026-10-03-vibe-team-intel.md`, §3.)

**Interpretation:** in a market of launches, being a real product is not a polish bonus. It is the curation argument. A product earns attention by making a stranger do something in seconds, then giving them a reason to return or share a proof of having done it.

## 4. What the ecosystem wants next

### The goal

> **Ship a small, visually unmistakable, genuinely playable product that a timeline scroller can understand in one sentence, use without a wallet, and believe because its limits and provenance are explicit—then give the ecosystem a clean, optional path to holder identity without selling score, access, or outcomes.**

This goal combines four source-backed demands:

1. **Discoverable:** the founder explicitly criticized a promoted game for hiding its game entry. (Source: `research/vibevibe/2026-10-03-vibe-team-intel.md`, §3.)
2. **Useful and shipped:** the founder's builder pattern and the launchpad's MVP/usable-flow bar favor working products. (Sources: `research/vibevibe/2026-10-03-ecosystem-intel.md`, §2; `docs/TOKEN-LAUNCHPAD-RESEARCH.md`, §3.)
3. **Native to the dialect:** cashtags, direct mentions, “cook” hooks, and changelog honesty perform better than generic crypto copy. (Source: `research/vibevibe/2026-10-03-vibe-team-intel.md`, §8.)
4. **Honest under the rails:** testnet disclosure, no promises, no fake numbers, additive holder utility, and no pre-graduation transfer fiction are mandatory. (Sources: `research/vibevibe/2026-10-03-vibe-team-intel.md`, §7; `docs/WICK-LAUNCH-FORM-PACK.md`, §8; `docs/GROWTH-AND-HOOKS-STRATEGY.md`, §§1, 8.)

## 5. Strategic opening for a new alternative product

The existing ecosystem examples prove two things: a free browser game with optional holder tiers can be promoted quickly, and the founder values UI/art plus discoverability. The next credible product should therefore avoid being “another token with a tiny game.” It should instead make a product-native claim that is easy to demo, easy to share, and clearly different from an arena battler or a chart-based platformer.

The new product will be designed from this synthesis only. It will not reuse the existing game's chart/platformer or current/lane concept. Its economy will remain future-facing and read-only: free core first, optional identity/cosmetics later, no score multiplier, no base-access gate, no claims of earnings.
