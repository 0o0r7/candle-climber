> **EN ABSTRACT — Persian research companion (product-implementation audit): a deep audit of the shipped game vs. direct/online benchmarks — onboarding, accessibility, retention, difficulty curve and monetizable-surface honesty — producing the gap list that became the Level-Up package. The actionable English record is the shipped code: settings store, haptics, achievements, mobile RUSH, and the security wave (LU-1/2/7/8/9/14/15/17) landed from this branch.**

# پژوهش عمیق Candle Climber — ممیزی، بنچمارک و نقشه‌راه اجرایی

> **تاریخ تهیه:** ۱۴۰۵/۰۷/۲۰ (۲۰۲۶-۱۰-۱۲)
> **روش:** ممیزی کد منبع (۳۵+ فایل)، تجربهٔ قابل مشاهده، بنچمارک بازی‌های مستقیم و محصولات آنلاین گسترده‌تر، جستجوهای وب (۲۰۲۶-۱۰-۱۲)
> **هدف:** تولید دیتا و پلن دقیق و عملیاتی برای اجنت کودر جهت بهبود نواقص، کسری‌ها و نقاط ضعف

---

## فهرست

1. [خلاصهٔ مدیریتی](#۱-خلاصهٔ-مدیریتی)
2. [تعریف دسته‌بندی و کاتگوری](#۲-تعریف-دسته‌بندی-و-کاتگوری)
3. [ممیزی Candle Climber](#۳-ممیزی-candle-climber)
4. [بنچمارک بازی‌های مستقیم](#۴-بنچمارک-بازیهای-مستقیم)
5. [بنچمارک محصولات آنلاین گسترده‌تر](#۵-بنچمارک-محصولات-آنلاین-گستردهتر)
6. [ماتریس قوی/ضعیف/ناموجود/نامشخص](#۶-ماتریس-قویضعیفناموجودنامشخص)
7. [نقشه‌راه اولویت‌بندی‌شده](#۷-نقشه‌راه-اولویتبندیشده)
8. [بسته‌های وظیفهٔ آمادهٔ واگذاری به اجنت کودر](#۸-بستههای-وظیفهٔ-آمادهٔ-واگذاری-به-اجنت-کودر)
9. [منابع](#۹-منابع)

---

## ۱. خلاصهٔ مدیریتی

Candle Climber یک پلتفرمر مهارتیِ آنلاین است که در آن داده‌های واقعی کندل استیک به地形 (terrain) بازی تبدیل می‌شود. حلقهٔ اصلی ~۹۰ ثانیه‌ای بازی شامل صعود کندل‌های سبز (جامپ‌پد)، اجتناب از کندل‌های قرمز (فروپاشی)، زنجیرهٔ کامبو، مرگ (لیکویید شدن) و اشتراک‌گذاری «کارت مرگ» است. بازی دارای لیدربورد روزانه، گوست (ری‌پلی بهترین اجرا)، دوئل‌های آسنکرون، بات رقیب، سیستم آب‌وهوا/بایوم، ۱۴ کاراکتر اسپرایت، جهانی دوم بی‌نهایت و لایهٔ اقتصادی WICK است.

**نقاط قوت کلیدی:** فیزیک نرم و عالی (coyote time, jump buffering, jump cut, gravity-hang)، دترمینیسم دقیق (seed مشترک روزانه)، انتی‌چیت چندلایه (HMAC run-token + کلاه‌های فیزیکی)، کارت مرگ قابل‌اشتراک، گوست ری‌پلی، سیستم جهانی دوم، تنوع بصری (بایوم/آب‌وهوا/موشن).

**نقاط ضعف و کسری کلیدی:** عدم وجود منوی تنظیمات مستقل، نبود حالت کالر-بایند، عدم پشتیبانی از i18n (فارسی)، نبود تنظیم جداگانه-volume صدا، عدم پشتیبانی از haptics موبایل، نبود حالت تمرین آزاد/سندباکس، نبود سیستم اچیومنت/مدال، نبود تاریخچهٔ اجراهای گذشته (برتر از خود-گوست)، عدم وجود توضیحات داخل-بازی برای آیتم‌های زنده (آب‌وهوا، بایوم، گوست), UX آماده‌شدن اغلب شلوغ و متراکم، نبود مسیر onboarding تعاملی (فقط توتوریال پاپ‌آپ).

**اولویت‌های برتر:** (۱) منوی تنظیمات کامل با کالر-بایند و volume slider، (۲) پشتیبانی از haptics موبایل، (۳) onboarding تعاملی درون‌بازی، (۴) سیستم اچیومنت/مدال، (۵) i18n فارسی، (۶) ساده‌سازی پنل آماده‌شدن.

---

## ۲. تعریف دسته‌بندی و کاتگوری

Candle Climber در دو دستهٔ همپوشان قرار می‌گیرد:

### ۲.۱. بازی‌های پلتفرمر/رانر مهارتی-کژوال

بازی‌هایی که در آن‌ها کنترل کاراکتر روی پلتفرم‌ها با تاکید بر زمان‌بندی و رفلکس‌هاست. زیرشاخه: **auto-runner** (حرکت خودکار به جلو) + **precision platformer** (دقت پرش). نمونه‌ها: Doodle Jump، Geometry Dash، Crossy Road، Flappy Bird، Celeste، Super Mario Bros.

### ۲.۲. بازی‌ها/محصولات آنلاین با چالش روزانه و رقابت اجتماعی

بازی‌ها و محصولاتی که بر پایهٔ یک محتوای روزانهٔ مشترک برای همهٔ کاربران و لیدربورد/رقابت اجتماعی ساخته شده‌اند. نمونه‌ها: Wordle، daily puzzle games، Ghost Pro Racing، GAMEE.

Candle Climber در **تلاقی** این دو دسته است: یک پلتفرمر رانر با چالش روزانهٔ دترمین، لیدربورد جهانی و کارت قابل‌اشتراک — ترکیبی منحصربه‌فرد که داده‌های بازار واقعی را به地形 تبدیل می‌کند.

---

## ۳. ممیزی Candle Climber

ممیزی بر اساس خواندن کد منبع انجام شده است. هر یافته به فایل/مسیر/رفتار قابل مشاهده ارجاع داده می‌شود.

### ۳.۱. حلقهٔ اصلی بازی (Core Loop)

| عنصر | وضعیت | شواهد (فایل/رفتار) |
|---|---|---|
| حرکت خودکار (auto-runner) | ✅ **قوی** | `engine.ts`: `camX += speed * dt`؛ سرعت: `CAM_BASE=148 → CAM_MAX=400 @ +3.2/s` |
| پرش با ارتفاع متغیر (variable-height jump) | ✅ **قوی** | `engine.ts`: `JUMP_CUT=0.72` (رهای زود = پرش کوتاه) |
| Coyote time | ✅ **قوی** | `engine.ts`: `COYOTE=0.12s` |
| Jump buffering | ✅ **قوی** | `engine.ts`: `BUFFER=0.16s` |
| Gravity-hang (نیمه‌گرانش در اوج پرش) | ✅ **قوی** | `engine.ts`: `HANG_GRAVITY=0.5` وقتی `vy<0 && jumpHeld` |
| RUSH (Shift = سرعت ×۱.۲۸ + امتیاز ×۱.۲۵) | ✅ **قوی** | `engine.ts`: `RUSH_SPEED=1.28`، `scoring.ts`: `RUSH_GAIN=1.25` |
| Crumble (کندل قرمز فرومی‌پاشد) | ✅ **قوی** | `engine.ts`: `CRUMBLE_TIME=0.26s`، state machine: solid → crumbling → gone |
| کامبو (زنجیرهٔ فرود سبز) | ✅ **قوی** | `scoring.ts`: `COMBO_STEP=0.5`، `COMBO_CAP=12` (حداکثر ×۷) |
| مرگ = سقوط از پایین صفحه | ✅ **قوی** | `engine.ts`: `die()` وقتی `py > camY + VIEW_H + 80` |
| کارت مرگ قابل‌اشتراک | ✅ **قوی** | `deathcard.ts`: 1080×1350 PNG با score/symbol/date/cause/rank/mutation/rival |
| حلقهٔ «یک بار دیگه» | ✅ **قوی** | `GameCanvas.tsx`: `startRun()` — retry فوری بدون اصطکاک |

### ۳.۲. دترمینیسم و یکپارچگی

| عنصر | وضعیت | شواهد |
|---|---|---|
| Seed روزانه (UTC date → symbol + window) | ✅ **قوی** | `level-source.ts`: `pickSeed(date)`، `rng.ts`: `mulberry32(hashString(...))` |
| همهٔ بازیکنان همان سطح را می‌بینند | ✅ **قوی** | `candles/route.ts`: سرور symbol/date را pin می‌کند |
| HMAC run-token (امنیت امتیاز) | ✅ **قوی** | `run-token.ts`: `signRunToken` با sha256 fingerprint + HMAC |
| انتی‌چیت چندلایه | ✅ **قوی** | `board-validation.ts`: score ≤ candles × 175، name sanitizing، per-IP rate limit (20/min) |
| Staneness (توکن منقضی) | ✅ **قوی** | `run-token.ts`: `isTokenStale` (UTC date + 1 day) |
| جهانی دوم (World 2 — بی‌نهایت) | ✅ **قوی** | `level.ts`: `genWorld2Chunk` دترمین، `engine.ts`: `enterWorld2()` |

### ۳.۳. سیستم‌های اجتماعی و رقابتی

| عنصر | وضعیت | شواهد |
|---|---|---|
| لیدربورد روزانه جهانی | ✅ **قوی** | `leaderboard/route.ts`: دو لاین (guest/official)، MongoDB یا in-memory |
| لاین رسمی (wallet-bound با personal_sign) | ✅ **قوی** | `wallet-proof.ts`: EIP-191 ownership proof |
| گوست (ری‌پلی بهترین اجرا) | ✅ **قوی** | `ghost.ts`: 30Hz position stream، validate + replay |
| دوئل آسنکرون (challenge code) | ✅ **قوی** | `duel.ts`: challenge create + verdict + local tally |
| بات رقیب (VS BOT) | ✅ **قوی** | `rival/bot.ts`: headless Engine + heuristic planner + personality |
| خود-گوست (بهترین اجرای خود دستگاه) | ✅ **قوی** | `self-ghost.ts`: localStorage per-terrain |
| کارت مرگ با تگ رقیب | ✅ **قوی** | `deathcard.ts`: `normalizeRivalTag` + challenge stamp |
| اشتراک‌گذاری (navigator.share) | ✅ **قوی** | `GameCanvas.tsx`: share + download |

### ۳.۴. تنوع گیم‌پلی

| عنصر | وضعیت | شواهد |
|---|---|---|
| Daily Mutations (۵ موتاتور) | ✅ **قوی** | `mutations.ts`: clean/lowgrav/heavy/rush/fragile + rain (decor) |
| Archive (بازی تاریخ گذشته) | ✅ **قوی** | `archive.ts`: past UTC dates as practice |
| ۳ حالت (crypto/stocks/launchpad) | ✅ **قوی** | `ModeSelector.tsx`: 3-mode toggle + persist |
| ۴ تایم‌فریم (1h/4h/1d/1w) | ✅ **قوی** | `level-source.ts`: `INTERVALS` |
| ۱۴ کاراکتر اسپرایت + کلاسیک | ✅ **قوی** | `characters.ts`: 15 entry با FX profile |
| سیستم آب‌وهوا (ATR→wind، volume→fog، red→tremor) | ✅ **قوی** | `weather.ts`: pure derivation |
| سیستم بایوم (desert/tundra/storm/temperate) | ✅ **قوی** | `biome.ts`: market-condition mapping |
| Wick Vault (صندوق روی peak wick) | ✅ **قوی** | `GameCanvas.tsx`: `/api/vault` + sprite |
| پیش‌بینی مسیر (route prediction) | ✅ **قوی** | `PredictionPanel.tsx` + `/api/prediction` |
| Wreckage (نقشهٔ مرگ‌های دستگاه) | ✅ **قوی** | `wreckage.ts`: per-device frozen ghosts |

### ۳.۵. کنترل و ورودی

| عنصر | وضعیت | شواهد |
|---|---|---|
| کیبورد (Space/↑/W = پرش، Shift = RUSH) | ✅ **قوی** | `GameCanvas.tsx`: `keydown`/`keyup` listeners |
| تاچ/پوینتر (tap = پرش) | ✅ **قوی** | `GameCanvas.tsx`: `onPointerDown`/`onPointerUp` |
| Pause (P/Escape + auto-pause on blur/visibility) | ✅ **قوی** | `GameCanvas.tsx`: `applyPause` + `visibilitychange` |
| RUSH فقط کیبورد (نه موبایل) | ⚠️ **ضعیف** | `GameCanvas.tsx`: `coarsePointer` detection فقط برای پنهان‌کردن label، نه برای جایگزینی |
| ادامهٔ ورودی بعد از focus change | ✅ **قوی** | `GameCanvas.tsx`: `release()` on keyup unconditional |

### ۳.۶. صدا و بازخورد حسی

| عنصر | وضعیت | شواهد |
|---|---|---|
| WebAudio synth (blip/noise) | ✅ **قوی** | `sound.ts`: jump/land/crumble/death/milestone/victory |
| Mute toggle (localStorage) | ✅ **قوی** | `GameCanvas.tsx`: `MUTE_KEY`، `setMuted` |
| Haptics (لرزش موبایل) | ❌ **ناموجود** | هیچ ارجاع به `navigator.vibrate` در کد نیست |
| Volume slider جداگانه | ❌ **ناموجود** | فقط mute on/off؛ volume کنترل وجود ندارد |
| موسیقی پس‌زمینه | ❌ **ناموجود** | فقط SFX — موسیقی پس‌زمینه وجود ندارد (طراحی عمدی؟) |

### ۳.۷. دسترس‌پذیری (Accessibility)

| عنصر | وضعیت | شواهد |
|---|---|---|
| ARIA roles (dialog/button/radio/tab/status) | ✅ **قوی** | `GameCanvas.tsx`: role="dialog"، aria-label، role="radiogroup" |
| Focus management (death panel، pause) | ✅ **قوی** | `GameCanvas.tsx`: `deathPanelRef.current?.focus()` |
| `prefers-reduced-motion` | ⚠️ **ضعیف** | `globals.css`: فقط `.cc-burn-flame`/`.cc-gcf` را disable می‌کند؛ canvas animations و screen shake کنترل نمی‌شوند |
| Colorblind mode | ❌ **ناموجود** | سبز/قرمز کندل‌ها فقط رنگی هستند؛ الگو/شکل جایگزین وجود ندارد |
| کنتراست رنگ | ⚠️ **نامشخص** | پالت: bg `#101214`، lime `#CCFF00`، up-green `#5BD08A`، down-coral `#E07856` — کنتراست متن خوب است اما تمایز سبز/قرمز برای کالر-بایند مشکل‌ساز |
| تنظیم اندازهٔ متن/UI | ❌ **ناموجود** | canvas-based — scale ثابت 800×480 |
| پشتیبانی از صفحه‌خوان برای canvas | ⚠️ **ضعیف** | canvas `aria-label` دارد اما محتوای داخل-بازی قابل خواندن نیست |

### ۳.۸. رابط کاربری (UI/UX)

| عنصر | وضعیت | شواهد |
|---|---|---|
| Landing page | ✅ **قوی** | `page.tsx`: Hero + ModeSelect + HowToPlay + Features + Footer |
| صفحهٔ آماده‌شدن (ready) | ⚠️ **ضعیف** | `GameCanvas.tsx`: پنل آماده‌شدن شامل name input، leaderboard، report، prediction، archive، mode selector، character select، duel code، ghost toggle، bot toggle — بسیار متراکم |
| HUD (score/combo/candles) | ✅ **قوی** | `GameCanvas.tsx`: `setHud` با JetBrains Mono |
| صفحهٔ مرگ (death panel) | ✅ **قوی** | submit score + death card + mint + verdict |
| صفحهٔ فارغ‌التحصیلی (graduated panel) | ✅ **قوی** | enter world 2 or retry |
| صفحهٔ آمار (/stats) | ✅ **قوی** | `stats/page.tsx`: lifetime ledger + duel tally |
| منوی تنظیمات مستقل | ❌ **ناموجود** | تنظیمات داخل پنل آماده‌شدن پراکنده‌اند |
| توتوریال | ⚠️ **ضعیف** | `Tutorial.tsx`: ۵ مرحله پاپ‌آپ با visual static — تعاملی نیست، فقط تصویری |
| آرشیو مرورگر | ✅ **قوی** | `ArchiveBrowser.tsx` |
| i18n (فارسی) | ❌ **ناموجود** | تمام UI انگلیسی است؛ `next-intl` در dependencies اما استفاده نشده |
| Responsive (mobile/desktop) | ✅ **قوی** | `GameCanvas.tsx`: contain-fit + `coarsePointer` detection |

### ۳.۹. لایهٔ اقتصادی و Web3

| عنصر | وضعیت | شواهد |
|---|---|---|
| Wallet connect | ✅ **قوی** | `WalletChip.tsx` + localStorage |
| On-chain price feed (Chainlink) | ✅ **قوی** | `robinhood-chain.ts`: keyless read |
| Airdrop weights | ✅ **قوی** | `weights-store.ts` + `/airdrop` page |
| $WICK token economy | ✅ **قوی** | `docs/ECONOMY-LAWS.md` + `/api/vault` + `/api/burn` |
| Death Card NFT mint (testnet) | ✅ **قوی** | `deathcard-claim.ts` + contract `CCDeathCard.sol` |
| Partner pool | ✅ **قوی** | `partner-store.ts` + `/partners` page |
| Season system | ✅ **قوی** | `seasons.ts`: `currentSeason()` |
| Anti-sybil | ✅ **قوی** | بدون reward loop مبتنی بر self-play |

### ۳.۱۰. کیفیت فنی

| عنصر | وضعیت | شواهد |
|---|---|---|
| Fixed-timestep physics (60Hz) | ✅ **قوی** | `GameCanvas.tsx`: accumulator `while (accRef >= FIXED)` |
| Canvas 2D engine | ✅ **قوی** | `render-v2.ts`: ۵-layer parallax + juice |
| Sentry error tracking | ✅ **قوی** | `sentry.server.config.ts` + `instrumentation.ts` |
| QA: 450+ headless sim rounds | ✅ **قوی** | `qa/` artifacts + `scripts/e2e-gamer-bot.ts` |
| CI pipeline | ✅ **قوی** | `.github/workflows/ci.yml` + `e2e.yml` |
| TypeScript strict | ✅ **قوی** | `tsconfig.json` + `tsc --noEmit` |
| Graceful degradation (offline) | ✅ **قوی** | `GameCanvas.tsx`: synthetic fallback |
| PWA manifest | ✅ **قوی** | `public/manifest.webmanifest` + icon-192/512 |

---

## ۴. بنچمارک بازی‌های مستقیم

### ۴.۱. Celeste (Maddy Thorson)

**معیار انتخاب:** مرجع طلایی کنترل پلتفرمر مهارتی؛ تحقیق موجود در `docs/PLATFORMER-UX-RESEARCH.md` بر اساس این بازی نوشته شده.

| ویژگی | Celeste | Candle Climber | ارزیابی |
|---|---|---|---|
| Coyote time | ✅ | ✅ (0.12s) | هم‌تراز |
| Jump buffering | ✅ | ✅ (0.16s) | هم‌تراز |
| Variable jump height | ✅ | ✅ (JUMP_CUT 0.72) | هم‌تراز |
| Gravity-hang | ✅ | ✅ (HANG_GRAVITY 0.5) | هم‌تراز |
| Corner correction | ✅ | ❌ (N/A — نه head-bonk، نه wall) | قابل‌اقتباس نیست |
| Assist mode (تنظیم دشواری) | ✅ | ❌ | **کسری** |
| فصل/سطح انتخاب آزاد | ✅ | ⚠️ (Archive وجود دارد اما محدود) | **ضعیف** |
| دسترس‌پذیری گسترده | ✅ | ❌ | **کسری** |

**الگوهای قابل‌اقتباس:**
- **Assist Mode**: اجازهٔ تغییر سرعت، تعداد dash، یا immortal mode برای بازیکنان جدید یا با نیاز ویژه. Candle Climber می‌تواند یک حالت «آسان‌تر» با CAM_BASE کمتر و coyote time بیشتر ارائه دهد.
- **تنظیم دشواری قابل انتخاب**: نه فقط mutations روزانه، بلکه انتخاب سطح دشواری توسط بازیکن.

### ۴.۲. Doodle Jump (Lima Sky)

**معیار انتخاب:** یکی از موفق‌ترین auto-runner/vertical climber موبایلی؛ چرخهٔ گیم‌پلی مشابه (صعود بی‌نهایت، مرگ، retry).

| ویژگی | Doodle Jump | Candle Climber | ارزیابی |
|---|---|---|---|
| صعود بی‌نهایت | ✅ | ✅ (World 2) | هم‌تراز |
| تنظیمات آسان | ✅ | ❌ | **کسری** |
| Haptics | ✅ | ❌ | **کسری** |
| اشتراک‌گذاری نتیجه | ✅ | ✅ (Death Card) | Candle Climber قوی‌تر |
| لیدربورد | ✅ | ✅ | هم‌تراز |
| Personalization (skin/theme) | ✅ | ✅ (۱۴ کاراکتر) | هم‌تراز |

**الگوهای قابل‌اقتباس:**
- **Haptics**: لرزش کوتاه هنگام فرود، مرگ، و milestone — ارزان و اثرگذار.
- **منوی تنظیمات ساده و دسترس‌پذیر**: volume، haptics on/off، sound on/off.

### ۴.۳. Geometry Dash

**معیار انتخاب:** پلتفرمر ریتمیک با سیستم لول‌سازی و اشتراک‌گذاری؛ رفلکس‌محور.

| ویژگی | Geometry Dash | Candle Climber | ارزیابی |
|---|---|---|---|
| Practice mode | ✅ | ⚠️ (Archive فقط) | **ضعیف** |
| آیکن‌ها و رنگ سفارشی | ✅ | ✅ (۱۴ کاراکتر) | هم‌تراز |
| تلاش مجدد سریع | ✅ | ✅ | هم‌تراز |
| آمار و اچیومنت | ✅ | ⚠️ (stats page اما بدون اچیومنت/مدال) | **ضعیف** |
| کلاب/گروه اجتماعی | ✅ | ❌ | **کسری** |

**الگوهای قابل‌اقتباس:**
- **Practice Mode**: حالتی که در آن بازیکن می‌تواند checkpoint داشته باشد و سرعت کمتر باشد — برای یادگیری الگوهای سطح.
- **سیستم اچیومنت/مدال**: «اولین فارغ‌التحصیل»، «۱۰ کامبو پشت‌سرهم»، «بدون راش تمام کن»، «۵۰ کندل در یک اجرا».

### ۴.۴. Crossy Road (Hipster Whale)

**معیار انتخاب:** casual runner با مرگ سریع و اشتراک‌گذاری؛ موفق در موبایل.

| ویژگی | Crossy Road | Candle Climber | ارزیابی |
|---|---|---|---|
| مرگ سریع و خنده‌دار | ✅ | ✅ (Death Card) | هم‌تراز |
| شخصیت‌های متنوع | ✅ | ✅ (۱۴ کاراکتر) | هم‌تراز |
| Onboarding تعاملی | ✅ | ❌ (فقط پاپ‌آپ) | **کسری** |
| Settings (sound/music) | ✅ | ⚠️ (فقط mute) | **ضعیف** |

**الگوهای قابل‌اقتباس:**
- **Onboarding تعاملی درون‌بازی**: به‌جای پاپ‌آپ جدا، آموزش در حین بازی اول (مثل اولین کندل سبز/قرمز با arrow/هینت روی canvas).

### ۴.۵. Wordle (NYT)

**معیار انتخاب:** مرجع طلایی بازی روزانه با بازگشت روزانه و اشتراک‌گذاری اجتماعی.

| ویژگی | Wordle | Candle Climber | ارزیابی |
|---|---|---|---|
| یک چالش روزانه برای همه | ✅ | ✅ | هم‌تراز |
| Streak و آمار | ✅ | ⚠️ (stats page اما بدون streak روزانه) | **ضعیف** |
| اشتراک‌گذاری بدون لو دادن جواب | ✅ | ✅ (Death Card) | هم‌تراز |
| Minimal friction | ✅ | ⚠️ (صفحهٔ آماده‌شدن شلوغ) | **ضعیف** |
| بازگشت روزانه (hook) | ✅ | ✅ (daily chart + report) | هم‌تراز |

**الگوهای قابل‌اقتباس:**
- **Daily Streak**: شمارش روزهای متوالی بازی (نه فقط تعداد اجراها). یک streak شکستنی.
- **ساده‌سازی first-time experience**: Wordle در کمتر از ۳ ثانیه شروع می‌شود؛ Candle Climber پنل آماده‌شدن متراکمی دارد.

### ۴.۶. Ghost Pro Racing (HTML5)

**معیار انتخاب:** async multiplayer با ghost replay در وب — مشابه سیستم گوست Candle Climber.

| ویژگی | Ghost Pro Racing | Candle Climber | ارزیابی |
|---|---|---|---|
| Ghost replay | ✅ | ✅ | هم‌تراز |
| Daily challenge | ✅ | ✅ | هم‌تراز |
| Challenge code | ✅ | ✅ (duel) | هم‌تراز |
| رقابت همزمان | ❌ | ❌ | هر دو async-only |

---

## ۵. بنچمارک محصولات آنلاین گسترده‌تر

### ۵.۱. الگوهای ورود و شروع سریع (Onboarding & FTUE)

**یافته‌های کلیدی از منابع:** ([Medium: Mobile Game Onboarding](https://medium.com/@amol346bhalerao/mobile-game-onboarding-top-ux-strategies-that-boost-retention-6ef266f433cb)، [Game-Ace: Game UX Guide](https://game-ace.com/blog/the-complete-game-ux-guide/))

- بازیکن باید بتواند در کمتر از ۱۰ ثانیه شروع به بازی کند.
- آموزش باید «از طریق بازی» باشد نه «دیوار متن».
- اگر بازیکن در جلسهٔ اول احساس موفقیت نکند، احتمال بازگشت به شدت کاهش می‌یابد.
- باید «دلیلی برای بازگشت فردا» وجود داشته باشد.

**وضعیت Candle Climber:**
- ✅ شروع سریع (tap/Space = play)
- ⚠️ توتوریال پاپ‌آپی است نه تعاملی درون‌بازی
- ❌ «quick win» برای بازیکن جدید وجود ندارد (مرگ در ۲-۳ کندل اول رایج بود، اگرچه P2.۷ این را بهبود داد)
- ✅ دلیل بازگشت روزانه (daily chart + report + streak)

**الگوهای قابل‌اقتباس:**
- آموزش تعاملی: دو-سه کندل اول با هینت روی canvas («بپر!» روی کندل سبز، «فرار کن!» روی قرمز)
- حالت «quick win»: اولین اجرا کوتاه و موفق (مثلاً ۳-۴ کندل اول همه سبز و بدون گپ)

### ۵.۲. الگوهای نگهداشت و پیشرفت (Retention & Progression)

**یافته‌های کلیدی:** ([Pixelfield: Game Retention Design](https://pixelfield.co.uk/blog/how-to-design-games-for-retention/))

- session length، frequency، churn rate، day-7 retention متریک‌های کلیدی هستند.
- اگر بازیکن در ۳ دقیقه احساس موفقیت کند، احتمال بازگشت فردا بیشتر است.
- شاخص‌های پیشرفت باید واضح باشند.
- باید به‌جای فرضیات، با دادهٔ واقعی iterate شود.

**وضعیت Candle Climber:**
- ✅ آمار در `/stats` موجود است
- ✅ best score در localStorage ذخیره می‌شود
- ⚠️ streak روزانه وجود ندارد (فقط تعداد اجراها)
- ❌ اچیومنت/مدال وجود ندارد
- ❌ tracking تحلیلی (mixpanel/amplitude یا Sentry analytics) محدود به Sentry error است

**الگوهای قابل‌اقتباس:**
- **Daily Streak counter**: روزهای متوالی بازی (شکستنی)
- **Achievement system**: مدال‌های قابل کسب
- **Progress bar**: نوار پیشرفت فصلی یا روزانه

### ۵.۳. الگوهای رقابت و اجتماع (Competition & Social)

**وضعیت Candle Climber:**
- ✅ لیدربورد روزانه (guest + official)
- ✅ دوئل آسنکرون با کد
- ✅ بات رقیب محلی
- ✅ کارت مرگ قابل‌اشتراک
- ✅ گوست ری‌پلی
- ✅ referral attribution (?ref=)
- ❌ گیلد/کلان وجود ندارد (در roadmap اما اجرایی نشده)
- ❌ تورنمنت زنده وجود ندارد (پس از graduation در roadmap)

**الگوهای قابل‌اقتباس:**
- **Guild/Team system**: گروه‌های بازیکن با امتیاز تجمعی (در roadmap D11-12)
- **Weekly tournament**: رقابت هفتگی با جایزه

### ۵.۴. الگوهای شخصی‌سازی

**وضعیت Candle Climber:**
- ✅ ۱۴ کاراکتر اسپرایت با FX profile
- ✅ نام بازیکن قابل تنظیم
- ✅ رقیب تگ (X handle)
- ⚠️ انتخاب رنگ/تم وجود ندارد
- ❌ شخصی‌سازی رابط کاربری وجود ندارد

**الگوهای قابل‌اقتباس:**
- **Theme/skin selection**: تم‌های نوری/تاریک یا پالت‌های رنگی جایگزین
- **Custom trail color**: رنگ دنباله کاراکتر

### ۵.۵. الگوهای بازگشت‌پذیری (Replayability)

**وضعیت Candle Climber:**
- ✅retry نامحدود
- ✅ جهانی دوم بی‌نهایت
- ✅ Archive (تاریخ گذشته)
- ✅ mutations روزانه
- ✅ ۳ حالت + ۴ تایم‌فریم
- ⚠️ «حالت تمرین» با checkpoint وجود ندارد
- ❌ لول‌های سفارشی کاربر وجود ندارد

**الگوهای قابل‌اقتباس:**
- **Practice mode**: checkpoint + سرعت کمتر + بدون امتیاز
- **Daily archive browser**: مرور تاریخ‌های گذشته با توضیح دشواری

---

## ۶. ماتریس قوی/ضعیف/ناموجود/نامشخص

| # | قابلیت | وضعیت | شواهد/فایل | اولویت بهبود |
|---|---|---|---|---|
| ۱ | فیزیک نرم و کنترل (coyote/buffer/cut/hang) | ✅ قوی | `engine.ts` | — |
| ۲ | دترمینیسم روزانه (seed مشترک) | ✅ قوی | `level-source.ts`, `rng.ts` | — |
| ۳ | انتی‌چیت چندلایه (HMAC + caps + rate limit) | ✅ قوی | `run-token.ts`, `board-validation.ts` | — |
| ۴ | کارت مرگ قابل‌اشتراک | ✅ قوی | `deathcard.ts` | — |
| ۵ | گوست ری‌پلی (server + self) | ✅ قوی | `ghost.ts`, `self-ghost.ts` | — |
| ۶ | دوئل آسنکرون | ✅ قوی | `duel.ts` | — |
| ۷ | بات رقیب محلی | ✅ قوی | `rival/bot.ts` | — |
| ۸ | سیستم آب‌وهوا و بایوم | ✅ قوی | `weather.ts`, `biome.ts` | — |
| ۹ | جهانی دوم بی‌نهایت | ✅ قوی | `level.ts` (genWorld2Chunk) | — |
| ۱۰ | ۱۴ کاراکتر اسپرایت | ✅ قوی | `characters.ts` | — |
| ۱۱ | ۳ حالت + ۴ تایم‌فریم | ✅ قوی | `ModeSelector.tsx` | — |
| ۱۲ | لیدربورد دو-لاین (guest/official) | ✅ قوی | `leaderboard/route.ts` | — |
| ۱۳ | توتوریال | ⚠️ ضعیف | `Tutorial.tsx` — پاپ‌آپی، غیرتعاملی | بالا |
| ۱۴ | منوی تنظیمات مستقل | ❌ ناموجود | پراکنده در پنل آماده‌شدن | بالا |
| ۱۵ | Volume slider صدا | ❌ ناموجود | فقط mute on/off | بالا |
| ۱۶ | Haptics موبایل | ❌ ناموجود | هیچ `navigator.vibrate` | بالا |
| ۱۷ | Colorblind mode | ❌ ناموجود | سبز/قرمز فقط رنگی | بالا |
| ۱۸ | `prefers-reduced-motion` کامل | ⚠️ ضعیف | `globals.css` — فقط burn flame | متوسط |
| ۱۹ | i18n (فارسی) | ❌ ناموجود | تمام UI انگلیسی | متوسط |
| ۲۰ | Daily streak counter | ❌ ناموجود | فقط تعداد اجراها | متوسط |
| ۲۱ | سیستم اچیومنت/مدال | ❌ ناموجود | — | متوسط |
| ۲۲ | Practice mode با checkpoint | ❌ ناموجود | Archive بدون checkpoint | متوسط |
| ۲۳ | RUSH در موبایل | ⚠️ ضعیف | `coarsePointer` فقط پنهان‌سازی | متوسط |
| ۲۴ | پنل آماده‌شدن ساده | ⚠️ ضعیف | `GameCanvas.tsx` — متراکم | متوسط |
| ۲۵ | تنظیم دشواری قابل انتخاب | ❌ ناموجود | فقط mutations روزانه | پایین |
| ۲۶ | گیلد/کلان | ❌ ناموجود | roadmap D11-12 | پایین |
| ۲۷ | تورنمنت زنده | ❌ ناموجود | roadmap post-grad | پایین |
| ۲۸ | موسیقی پس‌زمینه | ❌ ناموجود | فقط SFX | پایین |
| ۲۹ | Analytics/tracking بازیکن | ⚠️ نامشخص | فقط Sentry error | پایین |
| ۳۰ | پشتیبانی صفحه‌خوان canvas | ⚠️ ضعیف | `aria-label` اما محتوای داخل-بازی ناخوانا | پایین |

---

## ۷. نقشه‌راه اولویت‌بندی‌شده

ترتیب بر اساس: اثر بر تجربهٔ اصلی × اطمینان شواهد ÷ تلاش تقریبی.

| ردیف | اقدام | مسئله | ارزش کاربر | اندازه | ریسک | وابستگی | معیار موفقیت |
|---|---|---|---|---|---|---|---|
| **R1** | منوی تنظیمات مستقل | تنظیمات پراکنده، بدون دسترس‌پذیری | دسترسی سریع و متمرکز به همهٔ تنظیمات | متوسط | پایین | — | یک صفحه/مودال تنظیمات با دسترسی از پنل آماده‌شدن و pause |
| **R2** | Colorblind mode | سبز/قرمز فقط رنگی برای ~۸٪ مردان قابل‌تمایز نیست | بازی برای کالر-بایند قابل‌بازی | کوچک | پایین | R1 | الگو/شکل/آیکن اضافه برای تمایز سبز/قرمز + toggle در تنظیمات |
| **R3** | Volume slider | فقط mute on/off، کنترل دقیق صدا وجود ندارد | کنترل سطح صدا | کوچک | پایین | R1 | slider 0-100% در تنظیمات، persist در localStorage |
| **R4** | Haptics موبایل | هیچ بازخورد لمسی در موبایل | احساس فیزیکی پرش/فرود/مرگ | کوچک | پایین | — | `navigator.vibrate` در jump/land/death/milestone با toggle در تنظیمات |
| **R5** | Onboarding تعاملی درون‌بازی | توتوریال پاپ‌آپی غیرتعاملی | یادگیری با بازی کردن | متوسط | متوسط | — | ۳-۴ کندل اول با هینت روی canvas، auto-trigger در اولین اجرا |
| **R6** | `prefers-reduced-motion` کامل | screen shake و canvas animations کنترل نمی‌شوند | تجربهٔ امن برای حساس به حرکت | کوچک | پایین | — | disable shake/tremor/confetti وقتی reduced-motion فعال است |
| **R7** | Daily streak counter | فقط تعداد اجراها، نه روزهای متوالی | بازگشت روزانه | کوچک | پایین | — | شمارش روزهای متوالی بازی، نمایش در /stats و پنل آماده‌شدن |
| **R8** | RUSH در موبایل | Shift فقط کیبورد است، موبایل RUSH ندارد | parity کنترل در موبایل | کوچک | متوسط | — | دکمه/ژست RUSH لمسی (مثلاً swipe یا hold دو-انگشتی) |
| **R9** | سیستم اچیومنت/مدال | هیچ سیستم دستاوردی وجود ندارد | انگیزه و هدف بلندمدت | متوسط | متوسط | R7 (streak) | ۸-۱۰ مدال: first grad، 10x combo، no-rush clear، 50 candles، 7-day streak، etc. |
| **R10** | i18n فارسی | تمام UI انگلیسی است | دسترسی برای کاربر فارسی‌زبان | بزرگ | متوسط | — | همهٔ رشته‌های UI به فارسی، toggle زبان، persist |
| **R11** | ساده‌سازی پنل آماده‌شدن | پنل متراکم و شلوغ | تجربهٔ روان‌تر first-time | متوسط | متوسط | R1 (settings), R5 (onboarding) | collapsible sections، اولویت‌بندی محتوا، progressive disclosure |
| **R12** | Practice mode با checkpoint | Archive بدون checkpoint، تمرین محدود | یادگیری عمیق‌تر الگوهای سطح | متوسط | متوسط | — | حالت تمرین با checkpoint + بدون امتیاز + سرعت اختیاری |

---

## ۸. بسته‌های وظیفهٔ آمادهٔ واگذاری به اجنت کودر

### بستهٔ R1: منوی تنظیمات مستقل

**محدودهٔ تغییر:**
- فایل جدید: `src/components/cc/SettingsPanel.tsx`
- تغییر: `src/components/cc/GameCanvas.tsx` — اضافه‌کردن دکمهٔ «⚙ SETTINGS» در پنل آماده‌شدن و pause overlay
- تغییر: `src/app/globals.css` — استایل‌های پنل تنظیمات

**جریان کاربر:**
1. بازیکن روی «⚙ SETTINGS» کلیک می‌کند (در پنل آماده‌شدن یا pause)
2. پنل تنظیمات باز می‌شود با بخش‌ها: Sound, Accessibility, Gameplay
3. تنظیمات در localStorage ذخیره می‌شوند (`cc_settings_v1`)
4. بستن پنل → تنظیمات فوری اعمال می‌شوند

**نیازمندی‌های فنی:**
- `SettingsPanel.tsx`: یک Dialog/Modal با Radix UI
- بخش Sound: volume slider (0-100), mute toggle
- بخش Accessibility: colorblind toggle, reduced-motion toggle
- بخش Gameplay: ghost on/off, bot on/off (انتقال از پنل آماده‌شدن)
- persist با `localStorage.setItem("cc_settings_v1", JSON.stringify({...}))`
- load در init effect `GameCanvas.tsx`

**حالت‌های خطا/لبه:**
- localStorage پر شده → try/catch (الگو موجود در کل پروژه)
- SSR → فقط در client اجرا شود (`"use client"`)

**معیارهای پذیرش:**
- ✅ پنل تنظیمات باز/بسته می‌شود از پنل آماده‌شدن و pause
- ✅ Volume slider سطح صدا را تغییر می‌دهد
- ✅ تنظیمات در localStorage persist می‌شوند
- ✅ بعد از reload تنظیمات حفظ می‌شوند

**آزمون‌ها:**
- `test/settings.test.ts`: تایید parse/load/save تنظیمات
- تست دستی: تغییر volume → شنیدن تفاوت، reload → حفظ تنظیمات

---

### بستهٔ R2: Colorblind Mode

**محدودهٔ تغییر:**
- تغییر: `src/game/cc/render-v2.ts` و `src/game/cc/render.ts` — اضافه‌کردن الگو/شکل برای تمایز سبز/قرمز
- تغییر: `src/components/cc/GameCanvas.tsx` — خواندن flag از settings
- تغییر: `src/app/globals.css` — استایل‌های colorblind

**جریان کاربر:**
1. بازیکن colorblind mode را در SettingsPanel فعال می‌کند
2. کندل‌های سبز: علاوه بر رنگ، الگوی راه‌راه عمودی یا آیکن ✓ می‌گیرند
3. کندل‌های قرمز: علاوه بر رنگ، الگوی نقطه‌چین یا آیکن ✗ می‌گیرند
4. cap (سطح فرود): شکل متمایز (مثلث سبز vs مربع قرمز)

**نیازمندی‌های فنی:**
- یک flag `colorblindMode` که از localStorage خوانده می‌شود و به renderer پاس داده می‌شود
- در `drawSlabV2`: اگر colorblind فعال است، pattern overlay روی body
- در `drawChasmV2`: هشدار بصری اضافی
- در HUD: آیکن‌های ✓/✗ کنار score برای سبز/قرمز آخرین فرود

**حالت‌های خطا/لبه:**
- renderer state باید flag را به‌درستی handle کند
- نباید performance قابل‌توجهی بگیرد (pattern pre-render شده)

**معیارهای پذیرش:**
- ✅ با colorblind on، سبز و قرمز با الگو/شکل قابل‌تمایز هستند
- ✅ با colorblind off، ظاهر تغییری نمی‌کند
- ✅ toggle در تنظیمات persist می‌شود

**آزمون‌ها:**
- تست بصری: فعال‌کردن mode و بررسی تمایز
- تست غیر‌بازگشتی: colorblind off → output با قبل یکسان است

---

### بستهٔ R3: Volume Slider

**محدودهٔ تغییر:**
- تغییر: `src/game/cc/sound.ts` — اضافه‌کردن `setVolume(level: number)`
- تغییر: `src/components/cc/GameCanvas.tsx` — خواندن volume از settings

**نیازمندی‌های فنی:**
- در `sound.ts`: یک `GainNode` master اضافه شود
- `setVolume(0..1)`: تنظیم `gainNode.gain.value`
- هر `blip()`/`noise()` از master gain عبور کند
- `setMuted` همچنان suspend/resume کند

**معیارهای پذیرش:**
- ✅ Volume slider سطح صدا را واقعاً تغییر می‌دهد
- ✅ Mute = volume 0
- ✅ Persist در localStorage

**آزمون‌ها:**
- تست دستی: volume 0 → سکوت، volume 100 → صدای کامل

---

### بستهٔ R4: Haptics موبایل

**محدودهٔ تغییر:**
- تغییر: `src/game/cc/sound.ts` یا فایل جدید `src/game/cc/haptics.ts`
- تغییر: `src/components/cc/GameCanvas.tsx` — فراخوانی haptics در رویدادهای کلیدی
- تغییر: SettingsPanel — toggle haptics

**جریان کاربر:**
1. بازیکن haptics را در تنظیمات فعال می‌کند
2. هنگام پرش: لرزش کوتاه (۱۰ms)
3. هنگام فرود: لرزش کوتاه (۱۵ms)
4. هنگام مرگ: لرزش طولانی (۵۰ms)
5. هنگام milestone (combo 5/10): لرزش دوتایی

**نیازمندی‌های فنی:**
- `haptics.ts`:
  ```ts
  export function vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  }
  ```
- در `EngineCallbacks.onSfx`: هنگام jump/land/death/milestone، haptics هم فراخوانی شود
- gate با `hapticsEnabled` flag از localStorage
- فقط روی `coarsePointer` (موبایل) فعال باشد

**معیارهای پذیرش:**
- ✅ در موبایل با haptics on، لرزش در رویدادهای کلیدی احساس می‌شود
- ✅ در desktop بدون اثر
- ✅ toggle در تنظیمات persist می‌شود

**آزمون‌ها:**
- تست دستی روی موبایل

---

### بستهٔ R5: Onboarding تعاملی درون‌بازی

**محدودهٔ تغییر:**
- تغییر: `src/components/cc/GameCanvas.tsx` — منطق onboarding در حین بازی اول
- تغییر: `src/game/cc/engine.ts` — (بدون تغییر فیزیک؛ فقط flag برای hints)
- تغییر: `src/game/cc/render-v2.ts` — رسم هینت روی canvas
- فایل جدید (اختیاری): `src/game/cc/onboarding.ts` — منطق step tracking

**جریان کاربر:**
1. اولین اجرای بازیکن (localStorage: `cc_runs_v1 === 0`)
2. ۳ کندل اول همه سبز، بدون گپ (launch pad)
3. روی کندل اول: فلش «↑ TAP TO JUMP» روی canvas
4. بعد از اولین پرش موفق: هینت محو
5. اگر کندل قرمز نزدیک شد: هینت «⚠ RED CRUMBLES»
6. بعد از ۳ کندل: هینت‌ها محو، بازی عادی ادامه می‌یابد

**نیازمندی‌های فنی:**
- در `GameCanvas.tsx`: state `onboardingStep` که در حین بازی pre-updated می‌شود
- در `render-v2.ts`: یک `drawOnboardingHints(ctx, e, step)` که هینت‌های متنی روی canvas رسم کند
- launch pad فعلی (`LAUNCH_PAD=6`) کافی است — فقط هینت اضافه شود
- بعد از ۲ اجرا (`cc_runs_v1 >= 2`) هینت‌ها غیرفعال شوند (الگوی فعلی `eng.showHints = runs < 2`)

**معیارهای پذیرش:**
- ✅ در اولین اجرا، هینت‌های تعاملی روی canvas ظاهر می‌شوند
- ✅ بعد از اتمام launch pad، هینت‌ها محو می‌شوند
- ✅ بعد از ۲ اجرا، هینت‌ها غیرفعال می‌شوند
- ✅ توتوریال پاپ‌آپی همچنان قابل دسترسی است (دکمه «HOW TO PLAY»)

**آزمون‌ها:**
- تست دستی: clear localStorage → اجرای اول → بررسی هینت‌ها
- تست: `cc_runs_v1 = 3` → هیچ هینتی ظاهر نمی‌شود

---

### بستهٔ R6: `prefers-reduced-motion` کامل

**محدودهٔ تغییر:**
- تغییر: `src/game/cc/engine.ts` — gate `shake` با reduced-motion
- تغییر: `src/game/cc/render-v2.ts` — gate tremor/confetti با reduced-motion
- تغییر: `src/components/cc/GameCanvas.tsx` — detection و انتقال به renderer

**نیازمندی‌های فنی:**
- در `GameCanvas.tsx` init effect:
  ```ts
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ```
- انتقال به renderer به‌عنوان پارامتر یا ref
- در `render-v2.ts`:
  - `drawCelebrationV2`: confetti skip شود، فقط light column باقی بماند
  - tremor: `tremAmp = 0` وقتی reduced-motion
- در `engine.ts`:
  - `shake` به 0 set شود یا ضریب 0.3 اعمال شود

**معیارهای پذیرش:**
- ✅ با reduced-motion فعال، screen shake وجود ندارد
- ✅ confetti graduation نمایش داده نمی‌شود (فقط light column)
- ✅ tremor weather غیرفعال می‌شود
- ✅ بدون reduced-motion، هیچ تغییری در تجربه نیست

**آزمون‌ها:**
- تست دستی: فعال‌کردن reduced-motion در OS → بررسی

---

### بستهٔ R7: Daily Streak Counter

**محدودهٔ تغییر:**
- تغییر: `src/lib/stats-ledger.ts` — اضافه‌کردن `currentStreak`, `bestStreak` به `StatsLedger`
- تغییر: `src/components/cc/GameCanvas.tsx` — update streak در `recordFinishedRun`
- تغییر: `src/app/stats/page.tsx` — نمایش streak

**نیازمندی‌های فنی:**
- در `StatsLedger`: `lastPlayedDate: string` اضافه شود
- در `recordRun`: اگر `lastPlayedDate === yesterday` → `currentStreak++`، اگر `today` → noop، در غیر این صورت `currentStreak = 1`
- `bestStreak = Math.max(bestStreak, currentStreak)`
- نمایش در پنل آماده‌شدن: «🔥 ۳ DAY STREAK»

**معیارهای پذیرش:**
- ✅ روز اول: streak = 1
- ✅ روز بعد (بازی): streak = 2
- ✅ شکست یک روز: streak = 1
- ✅ نمایش در /stats و پنل آماده‌شدن

**آزمون‌ها:**
- `test/stats-ledger.test.ts`: streak logic (consecutive, skip, same-day)

---

### بستهٔ R8: RUSH در موبایل

**محدودهٔ تغییر:**
- تغییر: `src/components/cc/GameCanvas.tsx` — اضافه‌کردن دکمهٔ RUSH لمسی

**جریان کاربر:**
1. در موبایل، یک دکمهٔ RUSH (نیمه‌شفاف) در گوشهٔ راست-پایین canvas
2. hold = RUSH فعال، release = RUSH غیرفعال
3. در desktop این دکمه پنهان است

**نیازمندی‌های فنی:**
- در `GameCanvas.tsx`: اگر `coarsePointer` → render یک `<button>` overlay روی canvas
- `onPointerDown` → `engineRef.current?.pressRush()`
- `onPointerUp`/`onPointerLeave` → `engineRef.current?.releaseRush()`
- styling: `position: absolute`, `opacity: 0.5`, z-index بالاتر از canvas

**معیارهای پذیرش:**
- ✅ در موبایل، دکمه RUSH ظاهر می‌شود
- ✅ hold → سرعت و امتیاز افزایش می‌یابد
- ✅ release → بازگشت به حالت عادی
- ✅ در desktop، دکمه پنهان است

**آزمون‌ها:**
- تست دستی روی موبایل

---

### بستهٔ R9: سیستم اچیومنت/مدال

**محدودهٔ تغییر:**
- فایل جدید: `src/lib/achievements.ts` — تعریف و logic اچیومنت‌ها
- فایل جدید: `src/components/cc/AchievementToast.tsx` — toast notification
- تغییر: `src/components/cc/GameCanvas.tsx` — بررسی اچیومنت‌ها بعد از هر اجرا
- تغییر: `src/app/stats/page.tsx` — نمایش مدال‌ها

**لیست اچیومنت‌ها (V1):**
| ID | نام | شرط |
|---|---|---|
| `first_blood` | FIRST LIQUIDATION | اولین مرگ |
| `first_grad` | SUMMIT REACHED | اولین فارغ‌التحصیلی |
| `combo_10` | ON FIRE | کامبو ×۱۰ |
| `combo_12` | MAX LEVERAGE | کامبو ×۱۲ (cap) |
| `candles_50` | HALF CHART | ۵۰ کندل در یک اجرا |
| `candles_100` | CENTURY CLIMBER | ۱۰۰ کندل در یک اجرا |
| `no_rush_clear` | DIAMOND HANDS | فارغ‌التحصیل بدون RUSH |
| `streak_7` | WEEKLY WARRIOR | ۷ روز streak |
| `duel_win_1` | CHART CHALLENGER | اولین برد دوئل |
| `world2` | BUYBACK KING | ورود به جهانی دوم |

**نیازمندی‌های فنی:**
- `achievements.ts`: `AchievementDef[]` با `id`, `name`, `desc`, `check(stats): boolean`
- `unlockAchievement(ledger, id): { unlocked: boolean, newlyUnlocked: boolean }`
- persist در `localStorage` (`cc_achievements_v1`)
- toast: `sonner` (هم‌اکنون در dependencies)

**معیارهای پذیرش:**
- ✅ بعد از تحقق شرط، toast نمایش داده می‌شود
- ✅ مدال‌ها در /stats قابل‌مشاهده هستند
- ✅ مدال‌های unlocked در localStorage persist می‌شوند

**آزمون‌ها:**
- `test/achievements.test.ts`: check logic برای هر اچیومنت

---

### بستهٔ R10: i18n فارسی

**محدودهٔ تغییر:**
- تغییر: `src/app/layout.tsx` — NextIntlClientProvider
- فایل‌های جدید: `src/messages/fa.json`, `src/messages/en.json`
- تغییر: تمام کامپوننت‌های `src/components/cc/` و `src/components/landing/` — استفاده از `useTranslations`
- تغییر: `src/components/cc/SettingsPanel.tsx` — toggle زبان

**نیازمندی‌های فنی:**
- `next-intl` هم‌اکنون در dependencies است اما استفاده نشده
- messages/fa.json: تمام رشته‌های UI
- `locale` در localStorage (`cc_locale_v1`) با fallback به `fa`
- direction: `rtl` برای فارسی

**محدودهٔ رشته‌ها (نمونه):**
```json
{
  "ready": "آماده",
  "start_climbing": "شروع صعود",
  "score": "امتیاز",
  "candles": "کندل‌ها",
  "best_streak": "بهترین زنجیره",
  "personal_best": "رکورد شخصی",
  "submit_score": "ثبت امتیاز",
  "download_card": "دانلود کارت",
  "share": "اشتراک‌گذاری",
  "how_to_play": "چگونه بازی کنیم",
  "settings": "تنظیمات",
  "sound": "صدا",
  "accessibility": "دسترس‌پذیری",
  "gameplay": "گیم‌پلی"
}
```

**معیارهای پذیرش:**
- ✅ با انتخاب فارسی، تمام UI به فارسی نمایش داده می‌شود
- ✅ direction rtl اعمال می‌شود
- ✅ انتخاب زبان persist می‌شود

**⚠️ نیاز به تصمیم محصول:** آیا تمام UI باید فارسی شود یا فقط بخش‌های کلیدی؟ آیا نام‌های تخصصی (LIQUIDATED, COMBO) فارسی شوند یا حفظ شوند؟

---

### بستهٔ R11: ساده‌سازی پنل آماده‌شدن

**محدودهٔ تغییر:**
- تغییر: `src/components/cc/GameCanvas.tsx` — بازسازی ساختار پنل آماده‌شدن
- تغییر: `src/app/globals.css` — استایل‌های بازسازی‌شده

**جریان کاربر فعلی (مشکل):**
پنل آماده‌شدن شامل هم‌زمان: name input، top-3 leaderboard، daily report (folded)، prediction panel، archive browser، mode selector، character select، duel code input، ghost toggle، bot toggle، timeframe selector، burn counter — همه در یک view.

**جریان پیشنهادی:**
1. **Primary area (همیشه visible):** symbol + date + mutation + START button + score/best
2. **Quick options ( collapsible):** mode، timeframe، character
3. **Advanced (folded by default):** duel code، prediction، report، archive
4. **Settings:** → لینک به SettingsPanel (R1)

**معیارهای پذیرش:**
- ✅ پنل آماده‌شدن اولیه کمتر از ۵ عنصر visible دارد
- ✅ بخش‌های پیشرفته قابل expand/collapse هستند
- ✅ START button همیشه visible و در دسترس است
- ✅ در موبایل، پنل بدون اسکرول عمودی fits شود (یا حداقل یک اسکرول)

---

### بستهٔ R12: Practice Mode با Checkpoint

**محدودهٔ تغییر:**
- تغییر: `src/components/cc/GameCanvas.tsx` — حالت تمرین
- تغییر: `src/game/cc/engine.ts` — (بدون تغییر فیزیک؛ فقط checkpoint logic در GameCanvas)

**جریان کاربر:**
1. بازیکن «PRACTICE» را انتخاب می‌کند (در پنل آماده‌شدن یا Archive)
2. هر ۱۰ کندل، یک checkpoint ناپیدا ثبت می‌شود
3. هنگام مرگ: «RETRY FROM CHECKPOINT?» به‌جای شروع از ابتدا
4. اجرا در حالت تمرین unscored است (هیچ امتیازی ثبت نمی‌شود)
5. سرعت قابل تنظیم: ۰.۷x / ۱x

**نیازمندی‌های فنی:**
- state `practiceMode: boolean` و `checkpointCamX: number`
- در `onDeath`: اگر practice → برنگرد به checkpoint به‌جای شروع جدید
- در `startRun`: اگر practice → `eng.speed *= 0.7` (اختیاری)
- در submit: اگر practice → suppress (الگوی موجود برای archive)

**معیارهای پذیرش:**
- ✅ در حالت practice، checkpoint بعد از هر ۱۰ کندل ثبت می‌شود
- ✅ مرگ → بازگشت به checkpoint
- ✅ هیچ امتیازی ثبت نمی‌شود
- ✅ سرعت ۰.۷x قابل انتخاب است

---

## ۹. منابع

### ۹.۱. منابع کد (ممیزی)

| فایل | محتوا |
|---|---|
| `src/game/cc/engine.ts` | موتور فیزیک، کنترل، دوربین |
| `src/game/cc/types.ts` | تعریف انواع داده |
| `src/game/cc/level.ts` | تبدیل کندل به پلتفرم |
| `src/game/cc/render-v2.ts` | رندرر ۵-لایه |
| `src/game/cc/sound.ts` | WebAudio synth |
| `src/game/cc/deathcard.ts` | تولید کارت مرگ PNG |
| `src/game/cc/mutations.ts` | موتاتورهای روزانه |
| `src/game/cc/rival/bot.ts` | بات رقیب |
| `src/game/cc/ghost.ts` | گوست ری‌پلی |
| `src/game/cc/duel.ts` | دوئل آسنکرون |
| `src/game/cc/weather.ts` | سیستم آب‌وهوا |
| `src/game/cc/biome.ts` | سیستم بایوم |
| `src/game/cc/characters.ts` | رجیستری کاراکتر |
| `src/components/cc/GameCanvas.tsx` | کامپوننت اصلی بازی |
| `src/components/cc/Tutorial.tsx` | توتوریال |
| `src/components/cc/ModeSelector.tsx` | انتخاب حالت |
| `src/components/cc/PredictionPanel.tsx` | پنل پیش‌بینی |
| `src/app/api/leaderboard/route.ts` | API لیدربورد |
| `src/app/api/candles/route.ts` | API دادهٔ کندل |
| `src/app/api/duels/route.ts` | API دوئل |
| `src/app/api/ghosts/route.ts` | API گوست |
| `src/lib/run-token.ts` | HMAC run-token |
| `src/lib/board-validation.ts` | انتی‌چیت validation |
| `src/lib/scoring.ts` | ثابت‌های امتیاز |
| `src/lib/stats-ledger.ts` | آمار localStorage |
| `docs/GAME_DESIGN.md` | سند طراحی بازی |
| `docs/PLATFORMER-UX-RESEARCH.md` | تحقیق UX پلتفرمر |
| `docs/GROWTH-AND-HOOKS-STRATEGY.md` | استراتژی رشد |

### ۹.۲. منابع وب (بنچمارک)

| منبع | URL | تاریخ بررسی | معیار انتخاب |
|---|---|---|---|
| Celeste & Forgiveness (Maddy Thorson) | mattmakesgames.com | 2026-10-01 (via PLATFORMER-UX-RESEARCH.md) | مرجع طلایی کنترل پلتفرمر |
| Wordle UX (Joe Bernstein) | uxdesign.cc | 2026-10-12 | الگوی daily challenge و retention |
| Wordle UX Breakdown | medium.com/design-bootcamp | 2026-10-12 | تحلیل UX کم-is-more |
| Game Onboarding (Amol Bhalerao) | medium.com | 2026-10-12 | FTUE و onboarding موبایل |
| Game UX Guide (Game-Ace) | game-ace.com | 2026-10-12 | اصول UX بازی |
| Game Retention Design (Pixelfield) | pixelfield.co.uk | 2026-10-12 | retention و progression |
| WCAG 2.1 | w3.org | 2026-10-12 | استاندارد دسترس‌پذیری |
| prefers-reduced-motion (W3C) | w3.org/WAI/WCAG22/Techniques/css/C39 | 2026-10-12 | کاهش حرکت |
| Color Contrast Guide 2025 | allaccessible.org | 2026-10-12 | کنتراست و کالر-بایند |
| Color Blindness Guide | caniplaythat.com | 2026-10-12 | طراحی برای کالر-بایند |
| Ghost Pro Racing (HN) | news.ycombinator.com | 2026-10-12 | async multiplayer و ghost |
| Daily Games Retention | gamedeveloper.com | 2026-10-12 | طراحی بازی روزانه |
| Once-a-Day Games | futuremediahubs.com | 2026-10-12 | retention strategy |

---

> **پایان سند.** این پژوهش از تغییر کد جدا نگه داشته شده تا یافته‌ها و برنامهٔ اجرایی پیش از پیاده‌سازی قابل‌بازبینی باشند. هر بستهٔ وظیفه با معیارهای پذیرش و آزمون‌های مشخص آمادهٔ واگذاری به اجنت کودر است.
