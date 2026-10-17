> **EN ABSTRACT — Persian research companion (architecture deep-dive: player identity, score registration and validation, record keeping, anti-cheat). Produces the LU hardening wave shipped from this branch: wallet-ownership proofs with purpose-separated messages (LU-2), per-submission nonces (LU-8), statistical anomaly flagging (LU-7), Turnstile hook (LU-1), verified-first board (LU-14), community reporting (LU-15), rank-around-me (LU-17), production-DB warning (LU-9). English technical prose: the code + docs/SECURITY-HARDENING-AUDIT.md.**

# دیپ‌دایو: لیدربورد، رقابت آنلاین، هویت، ثبت امتیاز و ضدتقلب

> تاریخ: ۲۰۲۶-۱۰-۱۲ · زبان سند: فارسی · زبان فنی: EN
> منابع: کدنامه (۴۲+ فایل تست، ۲۰+ ماژول سمت سرور)، تحقیق وب (۱۰+ منبع معتبر)،
> استانداردهای صنعت بازی‌های رقابتی
> وضعیت: تحلیل کامل — نقاط ضعف و پیشنهادات level up

---

## ۰. خلاصه اجرایی

ساختار فعلی بازی Candle Climber برای لیدربورد و رقابت آنلاین در چند لایه طراحی شده است.
این لایه‌ها **بسیار قوی‌تر از حد متوسط یک بازی کژوال** هستند — به‌ویژه در HMAC run-token،
proof-of-ownership رسمی، و قلاب‌های ضدتقلب فیزیکی. اما چند **شکاف ساختاری مهم** وجود دارد
که اگر قبل از масштаб‌گیری برطرف نشوند، یکپارچگی رقابتی را تضعیف می‌کنند:

| ردیف | بخش | وضعیت فعلی | نقطه ضعف اصلی |
|------|------|------------|---------------|
| ۱ | هویت بازیکن | دو لاین: guest (typed name) + official (wallet + EIP-191 proof) | guest-lane کاملاً sybil-pwnable؛ official proof فقط روی leaderboard POST است، نه practice/prediction/vault |
| ۲ | ثبت و اعتبارسنجی امتیاز | HMAC run-token + terrain-physical caps + score↔candles consistency | **هیچ replay verification وجود ندارد** — امتیاز client-authored است و سرور فقط sanity-check می‌کند |
| ۳ | نگهداری رکوردها | Memory (default) / MongoDB (optional) | Memory store روی هر restart پاک می‌شود؛ Mongo اگر تنظیم نشود همه چیز از بین می‌رود |
| ۴ | جلوگیری از تقلب | Rate limit per-IP، guest name cap، best-run-per-wallet dedupe | rate limit per-instance است نه per-IP واقعی (پشت proxy چند instance نداریم ولی خواهیم داشت)؛ هیچ bot-detection یا CAPTCHA وجود ندارد |
| ۵ | نمایش رتبه‌بندی | guest / official lane، masked wallets، seasons | friend-leaderboard وجود ندارد؛ rank-around-me (همسایگان رتبه) پیاده‌سازی نشده؛ real-time updates ندارد |

---

## ۱. هویت بازیکن (Player Identity & Authentication)

### ۱.۱ وضعیت فعلی

بازی دو لاین هویتی دارد:

**لاین Guest (بدون کیف پول):**
- بازیکن یک نام تایپ‌شده وارد می‌کند (حداکثر ۱۴ کاراکتر، sanitize شده)
- هیچ احراز هویتی وجود ندارد — نام آزاد و قابل تکرار است
- امتیاز روی guest board ثبت می‌شود
- rate limit: ۲۰ submission/minute per-IP، حداکثر ۸ distinct name per-IP per-UTC-day

**لاین Official (کیف پول):**
- بازیکن یک آدرس کیف پول (EVM) متصل می‌کند
- برای ثبت روی official board، باید یک `personal_sign` (EIP-191) ارائه دهد
- سرور با ECDSA secp256k1 recovery + keccak-256 امضا را اعتبارسنجی می‌کند
- best-run-per-wallet per date+interval (replace-if-better) — یک کیف پول نمی‌تواند board را flood کند
- wallets در public GET responses mask می‌شوند (short form `0x1234…abcd`)
- ۱۰-min freshness window برای replay prevention

**کیف پول $WICK (cosmetic-only):**
- موجودی $WICK روی Robinhood Chain testnet خوانده می‌شود (read-only RPC)
- سه tier: none / holder (≥۱۰۰۰ $WICK) / whale (≥۱۰۰٬۰۰۰ $WICK)
- tier کاملاً cosmetic است — هرگز روی score، rank یا access تاثیر ندارد (LAW 1)

### ۱.۲ تحلیل نقاط ضعف

#### ضعف A1: Guest lane کاملاً sybil-pwnable است
یک نفر با یک اسکریپت ساده می‌تواند ده‌ها نام مختلف روی guest board ثبت کند.
cap فعلی (۸ name/IP/day) فقط velocity را کند می‌کند، نه identity sybil را متوقف.
طبق تحقیق Hacken و Wikipedia (Sybil attack)، بدون identity validation یا economic cost،
Sybil attack قابل پیشگیری نیست.

**تاثیر:** guest board نویز دارد و اعتبار آن پایین می‌آید — هرچند guest board اساساً
"unofficial" label شده، اما برای بازیکنان جدید اولین تجربه رقابتی است.

#### ضعف A2: Proof فقط روی leaderboard POST اعمال می‌شود
`/api/practice`، `/api/prediction`، `/api/vault` آدرس wallet را بدون ownership proof
قبول می‌کنند. این موضوع در `docs/council/2026-10-10-ANTI-SYBIL-AUDIT.md` به‌عنوان
"recorded option" ثبت شده، اما در عمل یعنی:
- کسی می‌تواند walletای که مالک آن نیست به یک identity لینک کند
- weights snapshot آن wallet می‌تواند با identities اضافی inflate شود

#### ضعف A3: هیچ session persistence وجود ندارد
بازیکن در هر بار باز کردن صفحه باید wallet را دوباره connect کند. `CC_WALLET_ADDR`
در localStorage ذخیره می‌شود اما فقط آدرس است، نه یک session token. این برای UX
بازیکنان بازگشتی آزاردهنده است.

### ۱.۳ بهترین شیوه‌های صنعت (Industry Best Practices)

طبق تحقیق FusionAuth و Elatec:
- بازی‌های رقابتی نیاز به **persistent sessions** دارند (OAuth، JWT، یا wallet-session)
- **KYC برای بازی‌های با جوایز واقعی** ضروری است، اما برای بازی‌های testnet/بدون ارزش واقعی،
  wallet-based identity کافی است
- **Friend lists** یک از قوی‌ترین retention drivers است (۳-۵ برابر return rate)
- طبق Developex: «players with friends are 3-5x more likely to return regularly»

### ۱.۴ پیشنهادات Level Up

| ID | پیشنهاد | اولویت | تلاش |
|----|---------|--------|------|
| LU-1 | افزودن **optional Cloudflare Turnstile** روی leaderboard POST برای guest lane (bot prevention بدون UX friction) | بالا | کم |
| LU-2 | گسترش ownership proof به practice/prediction/vault routes (close the A2 gap) | متوسط | متوسط |
| LU-3 | **Wallet session persistence**: پس از اولین proof، یک server-issued JWT/session cookie صادر شود که ۲۴ ساعت معتبر باشد (نیازی به re-sign در هر submit نیست) | متوسط | متوسط |
| LU-4 | افزودن **friend list** مبتنی بر wallet address (add/remove friends، friend leaderboard) | پایین (post-launch) | زیاد |

---

## ۲. ثبت و اعتبارسنجی امتیاز (Score Recording & Validation)

### ۲.۱ وضعیت فعلی

معماری فعلی **سه لایه اعتبارسنجی** دارد:

**لایه ۱ — HMAC Run Token (W1):**
- `GET /api/candles` یک token امضا‌شده با HMAC-SHA256 صادر می‌کند
- payload شامل: symbol, date, count, terrain fingerprint (sha256 اول ۱۶ کاراکتر), interval
- `POST /api/leaderboard` token را با `timingSafeEqual` اعتبارسنجی می‌کند
- symbol/date/interval **منحصراً** از token payload pin می‌شوند — client claims نادیده گرفته می‌شوند
- token یک روز پس از تاریخ خود stale می‌شود

**لایه ۲ — Board Validation (W5):**
- Score و candlesPassed با `Math.floor` clamp می‌شوند
- `MAX_SCORE_PER_CANDLE = 175` (engine max: base × combo × rush)
- `MAX_CANDLES = 5000`
- Score نباید از `candlesPassed × 175 + 20` بیشتر باشد (score↔candles consistency)
- Score نباید از `token.count × 175 + 20` بیشتر باشد (terrain-imposed physical cap)

**لایه ۳ — Ownership Proof (Official Lane):**
- EIP-191 `personal_sign` روی canonical message (wallet + score + candles + streak + date + interval + ts)
- ECDSA secp256k1 recovery با @noble/secp256k1
- ±۱۰-min freshness window
- Fail-open to guest: هر proof نامعتبر به guest lane downgrade می‌شود

### ۲.۲ تحلیل نقاط ضعف

#### ضعف B1 (CRITICAL): امتیاز client-authored است — هیچ replay verification وجود ندارد

این **مهم‌ترین نقطه ضعف** است. طبق مقاله Crux (منبع معتبر):
> «A cloud endpoint that blindly accepts `{score: 48210}` is still client-authoritative
> if the client chose 48,210.»

در وضعیت فعلی:
- کلاینت بازی می‌کند، score را locally محاسبه می‌کند، و به سرور می‌فرستد
- سرور فقط sanity-check می‌کند: «آیا این score با candles consistent است؟»
- اما **نمی‌تواند تایید کند که بازیکن واقعاً این score را کسب کرده**
- یک هکر با DevTools یا یک اسکریپت می‌تواند هر score‌ای در محدوده plausible ارسال کند

Candle Climber یک بازی **single-player, weakly verifiable** است. طبق جدول Crux:
> | Game shape | Useful authority |
> | Single-player, weakly verifiable | No trusted process observed the whole run. Treat the board as unverified, or use sanity checks. |

اما Candle Climber یک **مزیت رقابتی** دارد که اکثر بازی‌های single-player ندارند:
**deterministic terrain**. چون terrain از candle data مشخص (symbol+date+interval) و
engine fixed-timestep است، یک replay verification ممکن است.

#### ضعف B2: run-token deterministic و shared است
طبق خود ANTI-SYBIL-AUDIT:
> «The run token is deterministic and SHARED by every player on the same terrain (by design, W1)
> — so a token alone cannot identify a submitter»

این یعنی یک token می‌تواند برای submission‌های متعدد استفاده شود.
rate limit (۲۰/min) velocity را محدود می‌کند اما نمی‌تواند identity را ثابت کند.

#### ضعف B3: Physical caps فقط nonsense را catch می‌کنند
طبق Crux:
> «Bounds catch nonsense, not cheating. A maximum score can reject `999999999`;
> it cannot prove that a plausible `48,210` came from legal play.»

یک هکر که فیزیک بازی را بداند می‌تواند score‌ای در محدوده plausible اما غیر واقعی ارسال کند.

### ۲.۳ بهترین شیوه‌های صنعت

طبق تحقیق StackExchange و Reddit:
1. **Server-side simulation** (قوی‌ترین): سرور کل بازی را اجرا می‌کند — برای multiplayer مناسب است
2. **Replay verification** (متوسط): کلاینت input/event log را می‌فرستد، سرور replay می‌کند
3. **Sanity checks** (ضعیف‌ترین): فقط bounds — وضعیت فعلی Candle Climber

طبق Bugnet.io:
> «The server can re-simulate the session deterministically from those inputs to verify
> the resulting score. For games that are already deterministic, replay verification is
> relatively straightforward to implement.»

Candle Climber **تقریباً deterministic** است (fixed-timestep، seeded terrain) — این یعنی
replay verification یک گزینه واقع‌گرایانه است.

### ۲.۴ پیشنهادات Level Up

| ID | پیشنهاد | اولویت | تلاش |
|----|---------|--------|------|
| LU-5 | **Input-stream replay verification**: کلاینت input events (jump/press/release timestamps) را همراه با score ارسال کند. سرور یک headless engine اجرا می‌کند و score را re-derive می‌کند. فقط اگر server-computed score == client-claimed score بود، accept. | **بحرانی** | زیاد |
| LU-6 | **Ghost stream as proof**: هم‌اکنون ghost recorder position samples را ذخیره می‌کند. اگر submission همراه با position stream باشد، سرور می‌تواند sanity-check کند که trajectory با terrain consistent است (آیا بازیکن واقعاً روی platforms فرود آمده؟) | بالا | متوسط |
| LU-7 | **Statistical anomaly detection**: score‌هایی که در top 1% هستند flag شوند و برای manual review بروند (شبیه Trackmania community-driven approach) | متوسط | کم |
| LU-8 | **Per-submission unique nonce**: هر submission یک یک‌بار مصرف nonce بگیرد تا replay یک submission مشخص ممکن نباشد (حتی با token shared) | متوسط | کم |

---

## ۳. نگهداری رکوردها (Record Persistence)

### ۳.۱ وضعیت فعلی

چهار store اصلی وجود دارد:

| Store | Memory (default) | MongoDB (optional) |
|-------|-------------------|---------------------|
| Leaderboard | `MemoryStore` — max ۲۰۰۰ row، reset on restart | `MongoStore` — auto-activated با `DATABASE_URL` |
| Ghosts | `MemoryGhostStore` — per-terrain، max GHOSTS_PER_TERRAIN، TTL ۷ day | `MongoGhostStore` — TTL index |
| Duels | `MemoryDuelStore` — per-terrain، max ۵۰، TTL ۷ day | `MongoDuelStore` |
| Weights | `MemoryWeightsStore` | `MongoWeightsStore` |

**Fail-open pattern:** هر store failure به memory fallback می‌رود — بازی هرگز break نمی‌شود.
telemetry (Sentry) خطاها را capture می‌کند.

### ۳.۲ تحلیل نقاط ضعف

#### ضعف C1: Memory store = data loss on restart
اگر `DATABASE_URL` تنظیم نشود (که در sandbox فعلی تنظیم نشده)، **همه leaderboards،
duels، ghosts و weights با هر restart از بین می‌روند**. این برای dev/preview قابل قبول
است اما برای production **فاجعه‌بار** است.

#### ضعف C2: No data backup/recovery strategy
حتی با MongoDB، هیچ backup strategy یا point-in-time recovery تعریف نشده.

#### ضعف C3: No data migration path
Schema‌ها versioned نیستند (به جز `StatsLedger` با `v: 1`). اگر schema تغییر کند،
migration path مشخص نیست.

#### ضعف C4: in-memory rate limiter per-instance
rate limiter در memory است و per-instance. اگر چند instance (horizontal scaling) داشته
باشیم، rate limit بین آن‌ها share نمی‌شود — یک attacker می‌تواند با targeting instances
مختلف، limit را دور بزند.

### ۳.۳ پیشنهادات Level Up

| ID | پیشنهاد | اولویت | تلاش |
|----|---------|--------|------|
| LU-9 | **MongoDB تنظیم اجباری برای production** — یک startup check که اگر `DATABASE_URL` نبود و `NODE_ENV=production` بود، هشدار بدهد | بحرانی | کم |
| LU-10 | **Redis برای rate limiting** — rate limiter به Redis منتقل شود تا بین instances share شود | متوسط | متوسط |
| LU-11 | **Daily MongoDB backup** با `mongodump` (cron یا platform-managed) | متوسط | کم |
| LU-12 | **Schema versioning** برای همه stores — هر document یک `schemaVersion` بگیرد | پایین | متوسط |

---

## ۴. جلوگیری از تقلب (Anti-Cheat)

### ۴.۱ وضعیت فعلی — لایه‌های دفاعی

| لایه | چه چیزی را متوقف می‌کند | محدودیت |
|------|------------------------|---------|
| HMAC run-token | Forged submissions، client-claimed symbol/date | Token shared است — identity ثابت نمی‌کند |
| Terrain-physical caps | Impossible candle counts/scores | فقط nonsense — plausible cheating قابل تشخیص نیست |
| Score↔candles consistency | Score بزرگتر از candles | قابل gaming با شناخت فیزیک |
| Per-IP rate limit | Casual flooding (۲۰/min) | Per-instance، قابل bypass با proxy |
| Guest name cap | Name-flooding (۸/IP/day) | با proxy قابل دور زدن |
| Official-lane proof | Wallet impersonation | فقط روی leaderboard POST |
| Best-run-per-wallet dedupe | Official-board flooding | فقط official lane |
| Weights caps | Weights farming velocity | Multi-device با cap می‌رود |
| Identity↔wallet anomaly limit | >۲ identities/wallet flag | فقط snapshot time |

### ۴.۲ تحلیل نقاط ضعف

#### ضعف D1: هیچ bot-detection انسانی-محور وجود ندارد
هیچ CAPTCHA، Turnstile، یا behavioral check وجود ندارد. یک headless browser می‌تواند
به‌صورت خودکار بازی کند و score ارسال کند.

#### ضعف D2: No movement-pattern analysis
سرور نمی‌تواند تشخیص دهد که آیا یک score از human play آمده یا از TAS (tool-assisted).
طبق تحقیق StackExchange:
> «To detect tool assisted replays, what you really need is an active community
> of people that will manually examine the replays at the top of the leaderboard.»

#### ضعف D3: rate limit bypass با rotating IPs
با یک VPN یا proxy chain، rate limit per-IP کاملاً قابل دور زدن است.

#### ضعف D4: Guest board reputation contamination
چون guest board unverified است، یک attacker می‌تواند top leaderboard را با fake scores
پر کند و تجربه بازیکنان واقعی را خراب کند.

### ۴.۳ پیشنهادات Level Up

| ID | پیشنهاد | اولویت | تلاس |
|----|---------|--------|------|
| LU-1 (repeat) | **Cloudflare Turnstile** روی guest-lane POST (free، ۱M req/month، no CAPTCHA UX) | بالا | کم |
| LU-13 | **Behavioral fingerprinting**: زمان بین jump‌ها، hold duration distribution، death patterns — اگر robotic باشد flag شود | متوسط | زیاد |
| LU-14 | **Verified-only top board**: top ۱۰ فقط از official lane نشان داده شود، guest scores زیر آن | بالا | کم |
| LU-15 | **Report button**: بازیکنان بتوانند suspicious scores را report کنند (community moderation) | متوسط | کم |
| LU-16 | **Score distribution monitoring**: /ops dashboard نمودار توزیع score‌ها را نشان دهد تا anomaly‌ها واضح باشد | متوسط | متوسط |

---

## ۵. نمایش رتبه‌بندی (Leaderboard Display & Ranking)

### ۵.۱ وضعیت فعلی

**دو lane نمایش:**
- **Guest board**: typed names، همه submissions، unscored practice archived
- **Official board**: wallet-bound records، best-run-per-wallet، season-scoped

**ویژگی‌های موجود:**
- `GET /api/leaderboard?board=guest|official` — top ۵۰ entries
- `GET /api/leaderboard?date=YYYY-MM-DD` — برای archive dates
- `GET /api/leaderboard?interval=1w|1d|4h` — per-timeframe boards
- Masked wallets در public responses
- Season stamping (S1 opens 2026-10-10)
- `/api/report` — daily aggregated report (climbers, topScore, medianScore, etc.)
- `/stats` — per-device lifetime stats (honest-local)
- `/ops` — internal dashboard (aggregate counts only)

### ۵.۲ تحلیل نقاط ضعف

#### ضعف E1: No rank-around-me (همسایگان رتبه)
بازیکن رتبه خود را می‌بیند اما نمی‌داند چه کسی بالاتر و پایین‌تر از اوست.
طبق تحقیق Hello Interview و Yu-kai Chou:
> «A user should be able to glance at their dashboard and see: I'm ranked X,
> here are the people above and below me.»

این یکی از مهم‌ترین social hooks در بازی‌های رقابتی است.

#### ضعف E2: No friend leaderboard
طبق تحقیق Developex و JuegoStudio:
> «Players with friends are 3-5x more likely to return regularly.»

friend leaderboard یکی از قوی‌ترین retention drivers است و در حال حاضر وجود ندارد.

#### ضعف E3: No real-time updates
leaderboard در page load fetch می‌شود. هیچ WebSocket یا polling برای real-time rank
updates وجود ندارد. طبق تحقیق Hello Interview:
> «Players expect their rank to move within about 5 seconds of finishing a match.»

#### ضعف E4: No seasonal visualization
Seasons تعریف شده‌اند (S1) اما UI‌ای برای showing season progress، countdown to
season end، یا season history وجود ندارد.

#### ضعف E5: Guest board prominence
guest board (unverified) به‌طور پیش‌فرض نمایش داده می‌شود. این می‌تواند برای بازیکنان
جدید گمراه‌کننده باشد — نمی‌توانند تشخیص دهند کدام score واقعی است.

### ۵.۳ بهترین شیوه‌های صنعت

طبق Yu-kai Chou (Octalysis Framework):
> «Stick to 3-5 primary leaderboards. Make them meaningful. Make them visible.»

طبق Hello Interview:
> «Design a real-time gaming leaderboard system that displays global top rankings,
> user's current rank with surrounding players, and rankings within their friends list.»

طبق Reddit (seasonal resets):
> «Players tend to enjoy climbing the ranks more than maintaining a rank. By
> resetting you basically give them a chance to experience that climb again.»

### ۵.۴ پیشنهادات Level Up

| ID | پیشنهاد | اولویت | تلاش |
|----|---------|--------|------|
| LU-17 | **Rank-around-me API**: `GET /api/leaderboard?around=<rank>&window=5` — ۵ نفر بالا و ۵ نفر پایین بازیکن | بالا | متوسط |
| LU-18 | **Official-first display**: official board به‌عنوان default نمایش داده شود، guest به‌عنوان tab ثانویه | بالا | کم |
| LU-19 | **Season UI**: progress bar، countdown to season end، season history archive | متوسط | متوسط |
| LU-20 | **Polling leaderboard refresh** هر ۳۰ ثانیه (یا WebSocket اگر ترافیک justifed شد) | پایین | متوسط |
| LU-21 | **Daily report UI**: `/api/report` داده‌ها در یک panel جذاب روی ready screen نمایش داده شود | متوسط | کم |
| LU-22 | **Personal rank badge**: نشان رتبه (مثلاً "RANK #42 TODAY") روی ready screen | متوسط | کم |

---

## ۶. رقابت آنلاین و Social Features

### ۶.۱ وضعیت فعلی

**Duel System (P7.3):**
- یک بازیکن تمام‌شده را به یک challenge code تبدیل می‌کند
- کد shareable است (deep link `?duel=CODE`)
- بازیکن challenged همان terrain را بازی می‌کند و با challenger's ghost race می‌کند
- Verdict: higher score wins، tie broken by candles، full tie = draw
- Local tally (W-L-D) — هیچ server-side identity برای duel results وجود ندارد

**Ghost System (P7.2):**
- Position samples از completed runs ذخیره می‌شوند
- best ghosts per-terrain نمایش داده می‌شوند
- Ghost replay روی canvas نمایش داده می‌شود (cosmetic)

**Rival Bot (P7.1):**
- AI ghost با personality per character
- deterministic per level seed

### ۶.۲ تحلیل نقاط ضعف

#### ضعف F1: Duel results کاملاً local هستند
Duel tally فقط در localStorage بازیکن است. هیچ server-side record از duel outcomes
وجود ندارد. این یعنی:
- نمی‌توان global duel leaderboard ساخت
- نمی‌توان duel history را track کرد
- هیچ competitive integrity برای duels وجود ندارد

#### ضعف F2: No tournament system
هیچ tournament یا bracket system وجود ندارد. این یک feature است که در growth strategy
(P4) به آن اشاره شده اما پیاده‌سازی نشده.

#### ضعف F3: No spectator mode
بازیکنان نمی‌توانند run‌های دیگران را live تماشا کنند. این یک engagement driver قوی است.

#### ضعف F4: No chat یا communication
هیچ راهی برای ارتباط بازیکنان با هم وجود ندارد (به‌جز duel challenge codes).

### ۶.۳ پیشنهادات Level Up

| ID | پیشنهاد | اولویت | تلاش |
|----|---------|--------|------|
| LU-23 | **Server-side duel results**: duel outcome در MongoDB ذخیره شود (با wallet proof برای official) | متوسط | متوسط |
| LU-24 | **Daily tournament**: top N players از daily board به یک bracket tournament می‌روند | پایین (post-launch) | زیاد |
| LU-25 | **Replay sharing**: بازیکنان بتوانند replay خود را share کنند (deep link) | متوسط | متوسط |
| LU-26 | **Spectator mode**: بازی در حال انجام یک بازیکن دیگر را بتوان روی canvas دید | پایین | زیاد |

---

## ۷. جمع‌بندی: اولویت‌بندی پیشنهادات Level Up

### بحرانی (قبل از scale)
1. **LU-5**: Input-stream replay verification — single biggest integrity gap
2. **LU-9**: MongoDB mandatory for production — data loss prevention
3. **LU-14**: Verified-only top board — protect competitive integrity

### بالا (نزدیک‌ترین milestone)
4. **LU-1**: Cloudflare Turnstile on guest POST — cheap bot prevention
5. **LU-6**: Ghost stream as proof — leverage existing infrastructure
6. **LU-17**: Rank-around-me API — core social/competitive feature
7. **LU-18**: Official-first display — honest leaderboard UX
8. **LU-2**: Extend ownership proof to all wallet-touching routes

### متوسط (فاز بعدی)
9. **LU-3**: Wallet session persistence — UX improvement
10. **LU-7**: Statistical anomaly detection — defense in depth
11. **LU-8**: Per-submission nonce — replay prevention
12. **LU-10**: Redis rate limiter — horizontal scaling readiness
13. **LU-13**: Behavioral fingerprinting — advanced anti-cheat
14. **LU-15**: Report button — community moderation
15. **LU-16**: Score distribution monitoring — ops visibility
16. **LU-19**: Season UI — competitive narrative
17. **LU-21**: Daily report panel — engagement
18. **LU-22**: Personal rank badge — motivation
19. **LU-23**: Server-side duel results — competitive depth

### پایین (post-launch)
20. **LU-4**: Friend list & friend leaderboard
21. **LU-11**: Daily MongoDB backup
22. **LU-12**: Schema versioning
23. **LU-20**: Real-time leaderboard refresh
24. **LU-24**: Tournament system
25. **LU-25**: Replay sharing
26. **LU-26**: Spectator mode

---

## ۸. منابع تحقیق

1. **Crux (supercraft.host)** — "Your Public Leaderboard Will Get Cheated" — دسته‌بندی
   validation levels و trust boundaries
2. **GameDev StackExchange** — "Securing a replay-based leaderboard system" — replay
   verification approaches، TAS detection
3. **Bugnet.io** — "Debugging Leaderboard Score Anomalies" — deterministic replay verification
4. **arxiv.org (2512.21377)** — "A Systematic Review of Technical Defenses Against
   Software-Based Cheating" — server-side methods، statistical methods
5. **Hacken.io** — "Sybil Attack in Blockchain" — prevention mechanisms
6. **Wikipedia** — "Sybil attack" — identity validation، economic costs
7. **Cloudflare** — Turnstile documentation — bot prevention without CAPTCHA
8. **Yu-kai Chou** — "Leaderboard Design: Why Most Fail" — Octalysis framework
9. **Hello Interview** — "Design an Online Game Leaderboard" — real-time ranking، friends
10. **Developex** — "Social Features in E-Gaming" — retention metrics (3-5x with friends)
11. **JuegoStudio** — "Player Engagement: Social vs Competitive Features" — engagement drivers
12. **Game Developer** — "Leaderboards: the original and best social feature"
13. **Reddit r/gamedev** — "What's the design purpose of seasonal rank resets?"
14. **FusionAuth** — "Identity Verification Solutions for Online Gaming"
15. **Elatec** — "Gaming User Authentication"
16. **Internal**: `docs/council/2026-10-10-ANTI-SYBIL-AUDIT.md` — residual risk register
17. **Internal**: `docs/ECONOMY-LAWS.md` — LAW 1-5 governance framework
18. **Internal**: `docs/GROWTH-AND-HOOKS-STRATEGY.md` — growth loop design

---

*نوشته‌شده: ۲۰۲۶-۱۰-۱۲ · مبتنی بر ممیزی کامل کد و تحقیق وب ·
زبان: فارسی (سند) / انگلیسی (فنی) ·
وضعیت: آماده برای review و تصمیم‌گیری owner*
