> **EN ABSTRACT — Persian execution plan (10 packages / 24h): A1-A4 accessibility + settings, B1-B3 retention + mobile, C1-C2 UX polish, D verification. Rules: no engine.ts physics changes, no new dependencies, keep the test suite green. The English record is the shipped implementation on branch game-analysis-research + its integration into main (2026-10-13).**

# پکیج Level Up — Candle Climber

> **تاریخ:** ۱۴۰۵/۰۷/۲۱ (۲۰۲۶-۱۰-۱۲)
> **هدف:** آماده‌سازی محصول برای انتشار عمومی در کمتر از ۲۴ ساعت
> **مخاطب:** اجنت کودر (اجنت اجرایی)
> **وضعیت فعلی:** ۵۳۰ تست سبز · `tsc` تمیز · `lint` تمیز · اپ در حال اجرا
> **زبان سند:** فارسی (چت) / انگلیسی (کد)

---

## ۱. تحلیل معماری

### ۱.۱. پشته‌ی فناوری

| لایه | فناوری | وضعیت |
|---|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript strict | ✅ پایدار |
| Game Engine | Canvas 2D + fixed-timestep 60Hz | ✅ پایدار |
| Audio | WebAudio synth (بدون فایل صوتی) | ✅ پایدار |
| Backend API | Next.js API Routes (serverless) | ✅ پایدار |
| Database | MongoDB Atlas M0 (با memory fallback) | ✅ فعال |
| Blockchain | Robinhood Chain (testnet) — keyless reads | ✅ فعال |
| Auth | Wallet connect (injected provider, EIP-191) | ✅ فعال |
| Error Tracking | Sentry | ✅ فعال |
| CI/CD | GitHub Actions + Vercel | ✅ فعال |
| Testing | `bun test` — 530 تست، 42 فایل | ✅ سبز |
| Deployment | Vercel (candle-climber.vercel.app) | ✅ لایو |

### ۱.۲. ساختار پروژه

```
src/
  game/cc/          — هسته‌ی بازی (engine, render, level, sound, etc.)
    engine.ts       — فیزیک fixed-timestep، coyote/buffer/cut/hang
    render-v2.ts    — رندرر ۵-لایه parallax + juice
    level.ts        — تولید سطح دترمین از کندل‌ها
    level-source.ts — منبع داده‌ی پلاگین‌پذیر (Binance/Yahoo/Synthetic)
    mutations.ts    — ۵ موتاتور روزانه
    sound.ts        — WebAudio synth
    deathcard.ts    — کارت مرگ 1080×1350
    ghost.ts        — گوست ری‌پلی 30Hz
    duel.ts         — دوئل آسنکرون
    weather.ts      — آب‌وهوا از ATR/volume
    biome.ts        — بایوم از شرایط بازار
    characters.ts   — ۱۴ کاراکتر + FX
    types.ts        — تعریف انواع مشترک
    rng.ts          — PRNG دترمین (mulberry32)
  components/cc/     — کامپوننت‌های React
    GameCanvas.tsx  — شل اصلی بازی (104KB — نیاز به refactor)
    ModeSelector.tsx
    Tutorial.tsx
    WalletChip.tsx
    ArchiveBrowser.tsx
    MiniChart.tsx
    PredictionPanel.tsx
  lib/              — منطق سرور و دیتا
    leaderboard-store.ts  — Mongo + memory adapter
    run-token.ts          — HMAC anti-cheat
    board-validation.ts    — score caps + rate limit
    wallet-proof.ts        — EIP-191 ownership proof
    stats-ledger.ts        — آمار بازیکن
    wick-price.ts          — قیمت روی زنجیره
    partner-*.ts           — partner lane
  app/api/          — 20 endpoint (candles, leaderboard, ghosts, duels, etc.)
```

### ۱.۳. ارزیابی کیفیت معماری

| معیار | امتیاز | توضیح |
|---|---|---|
| جداسازی لایه‌ها | ۸/۱۰ | game/cc و lib و components به‌خوبی جدا شده‌اند |
| دترمینیسم | ۱۰/۱۰ | seed مشترک، fixed-timestep، W5 تست |
| امنیت | ۹/۱۰ | HMAC multi-layer، anti-cheat، rate limit |
| تست‌پذیری | ۸/۱۰ | 530 تست اما GameCanvas.tsx تست نشده (۱۰۴KB) |
| maintainability | ۶/۱۰ | GameCanvas.tsx بسیار بزرگ (نیاز به refactor) |
| performance | ۸/۱۰ | Canvas 2D سبک، 60fps، parallax pre-rendered |
| accessibility | ۳/۱۰ | اصلی‌ترین نقطه‌ضعف |
| mobile parity | ۶/۱۰ | RUSH فقط کیبورد، haptics ناموجود |

### ۱.۴. نقاط‌ضعف معماری

1. **GameCanvas.tsx (104KB):** یک فایل همه‌چیز — نیاز به شکستن به کامپوننت‌های مجزا
2. **نبود SettingsContext:** تنظیمات پراکنده در localStorage با کلیدهای مختلف
3. **نبود accessibility layer:** colorblind، reduced-motion، screen-reader پشتیبانی نمی‌شوند
4. **RUSH موبایل:** فقط کیبورد، موبایل فاقد parity است

---

## ۲. تحلیل اکوسیستم و پلتفرم

### ۲.۱. پلتفرم: vibe/vibe (Robinhood Chain)

Candle Climber روی اکوسیستم **vibe/vibe** ساخته شده — یک پلتفرم لانچ توکن روی Robinhood Chain.

| عامل اکوسیستمی | وضعیت | شواهد |
|---|---|---|
| E1 — MVP قابل‌بازی | 🟢 | لایو در candle-climber.vercel.app |
| E2 — چرخه‌ی محتوا (لانچ = سطح) | 🟢 | vibe-launch terrain فعال (لانچ #5963) |
| E3 — لایه‌ی توکن | 🟢 | $WICK لایو (CURVE_TRADING، meter ~0.17%) |
| E4 — اعتبار on-chain | 🟡 | wallet chip + weights ledger فعال؛ wallet-as-identity هنوز صف |
| E5 — حلقه‌ی وایرال X | 🟡 | مکانیزم کامل؛ reach ~0 (مالک) |
| E6 — هویت پلتفرم‌ناتیو | 🟡 | palette/type قفل؛ mascot متوقف |
| E7 — ضدتقلب | 🟢 | HMAC + caps + anti-sybil |
| E8 — ورود بدون اصطکاک | 🟢 | بازی رایگان، بدون نیاز به wallet |
| E9 — سرویس روزانه | 🟢 | Mongo-backed boards + weights |
| E10 — کیفیت موبایل | 🟡 | QA هدلس سبز؛ real-device معلق |

**امتیاز کلی: ۶ سبز / ۴ زرد / ۰ قرمز** — وضعیت قابل‌انتشار با بهبودهای هدفمند.

### ۲.۲. نقشه‌ی موقعیت رقابتی

```
                    مهارت‌محور ↑
                          │
           Celeste ●      │
                          │    ● Candle Climber
                          │    (داده‌ی واقعی + رقابت روزانه)
         Geometry Dash ●  │
                          │      ● Doodle Jump
     ─────────────────────┼──────────────────────→ کژوال
                          │
           Crossy Road ●  │  ● Wordle
                          │    (چالش روزانه)
                          │
                    داده‌ی واقعی ↓
```

**مزیت رقابتی منحصربه‌فرد:** ترکیب داده‌ی واقعی بازار + پلتفرمر مهارتی + چالش روزانه + کارت قابل‌اشتراک.

### ۲.۳. وابستگی‌های اکوسیستمی

| وابستگی | نوع | وضعیت | ریسک |
|---|---|---|---|
| Binance API | داده | ✅ رایگان، no-key | پایین (fallback موجود) |
| Yahoo Finance | داده | ✅ رایگان، no-key | متوسط (429 rate limit) |
| Robinhood Chain RPC | on-chain | ✅ رایگان، keyless | پایین |
| MongoDB Atlas | دیتابیس | ✅ M0 free tier | پایین |
| Vercel | هاست | ✅ Hobby free | پایین |
| vibe/vibe launchpad | توکن | ✅ فعال (testnet) | متوسط (وابسته به پلتفرم) |

---

## ۳. آمادگی انتشار — Checklist

### ۳.۱. موارد سبز (آماده)

- [x] هسته‌ی بازی (فیزیک، دترمینیسم، anti-cheat)
- [x] لیدربورد دو-لاین (guest + official)
- [x] کارت مرگ قابل‌اشتراک
- [x] گوست ری‌پلی (server + self)
- [x] دوئل آسنکرون
- [x] بات رقیب
- [x] سیستم آب‌وهوا و بایوم
- [x] جهانی دوم بی‌نهایت
- [x] ۱۴ کاراکتر + ۳ حالت + ۴ تایم‌فریم
- [x] $WICK توکن (testnet)
- [x] Balance Gate (cosmetic)
- [x] Weights ledger (Mongo)
- [x] Partner lane (code-complete)
- [x] OG/Twitter cards + PWA manifest
- [x] Sentry error tracking
- [x] 530 تست + tsc + lint سبز
- [x] دپلوی لایو در Vercel

### ۳.۲. موارد زرد (باید قبل از انتشار عمومی انجام شوند)

- [ ] **R1:** منوی تنظیمات مستقل
- [ ] **R2:** Colorblind mode
- [ ] **R3:** Volume slider
- [ ] **R4:** Haptics موبایل
- [ ] **R6:** prefers-reduced-motion کامل
- [ ] **R7:** Daily streak counter
- [ ] **R8:** RUSH در موبایل
- [ ] **R5:** Onboarding تعاملی درون‌بازی
- [ ] **R9:** سیستم اچیومنت/مدال
- [ ] **R11:** ساده‌سازی پنل آماده‌شدن

### ۳.۳. موارد قابل تأخیر (پس از انتشار)

- [ ] R10: i18n فارسی (حجم بزرگ، نیاز به تصمیم محصول)
- [ ] R12: Practice mode با checkpoint
- [ ] P7.4: رقابت زنده‌ی real-time (traction-gated)
- [ ] P5: Community flywheel (owner-side)
- [ ] P6: Graduation runtime (meter-gated)
- [ ] Mascot/V2 character (owner re-brief)

---

## ۴. بسته‌های وظیفه — اجرا در ۲۴ ساعت

ترتیب اجرا بر اساس: ارزش کاربر × اثر بر انتشار ÷ تلاش.

### فاز A — دسترس‌پذیری و تنظیمات (ساعات ۱-۶)

#### A1: Settings Context + Panel (R1 + R3)

**فایل‌های جدید:**
- `src/lib/settings-context.tsx` — React Context برای تنظیمات متمرکز
- `src/components/cc/SettingsPanel.tsx` — Dialog/Modal با Radix UI

**فایل‌های تغییر:**
- `src/components/cc/GameCanvas.tsx` — import SettingsProvider، اضافه‌کردن دکمه تنظیمات
- `src/game/cc/sound.ts` — اضافه‌کردن master GainNode + `setVolume(level)`

**مخزن داده:**
- `localStorage("cc_settings_v1")` → `{ volume: number, muted: boolean, colorblind: boolean, reducedMotion: boolean, haptics: boolean, ghostOn: boolean, botOn: boolean }`

**معیار پذیرش:**
- پنل از پنل آماده‌شدن و pause قابل دسترسی است
- Volume slider سطح صدا را تغییر می‌دهد
- تنظیمات در reload حفظ می‌شوند
- `tsc` + `lint` + `bun test` سبز

#### A2: Colorblind Mode (R2)

**فایل‌های تغییر:**
- `src/game/cc/render-v2.ts` — اضافه‌کردن pattern overlay برای سبز/قرمز
- `src/game/cc/render.ts` — همان (legacy renderer)

**پیاده‌سازی:**
- کندل سبز: راه‌راه عمودی سبز ✓
- کندل قرمز: نقطه‌چین قرمز ✗
- cap سبز: مثلث | cap قرمز: مربع
- pattern با `ctx.createPattern` pre-rendered (بدون overhead)

**معیار پذیرش:**
- با colorblind on، سبز و قرمز با الگو قابل‌تمایز هستند
- با colorblind off، ظاهر تغییری نمی‌کند

#### A3: Reduced Motion (R6)

**فایل‌های تغییر:**
- `src/game/cc/engine.ts` — gate `shake` با flag
- `src/game/cc/render-v2.ts` — gate tremor/confetti
- `src/components/cc/GameCanvas.tsx` — detection و انتقال

**معیار پذیرش:**
- با reduced-motion: no shake, no confetti, no tremor
- بدون reduced-motion: هیچ تغییری

#### A4: Haptics (R4)

**فایل جدید:**
- `src/game/cc/haptics.ts` — `vibrate(pattern)` با gate

**فایل‌های تغییر:**
- `src/components/cc/GameCanvas.tsx` — فراخوانی در رویدادهای کلیدی

**الگوها:**
- jump: 10ms | land: 15ms | death: [30, 20, 50] | milestone: [10, 30, 10]

---

### فاز B — نگهداشت و موبایل (ساعات ۶-۱۲)

#### B1: Daily Streak (R7)

**فایل‌های تغییر:**
- `src/lib/stats-ledger.ts` — `currentStreak`, `bestStreak`, `lastPlayedDate`
- `src/components/cc/GameCanvas.tsx` — update streak
- `src/app/stats/page.tsx` — نمایش streak

**منطق:**
- `lastPlayedDate === yesterday` → streak++
- `lastPlayedDate === today` → noop
- در غیر این صورت → streak = 1

#### B2: RUSH موبایل (R8)

**فایل‌های تغییر:**
- `src/components/cc/GameCanvas.tsx` — دکمه‌ی RUSH overlay برای coarsePointer

**پیاده‌سازی:**
- `<button>` نیمه‌شفاف در گوشه‌ی راست-پایین
- pointerdown → pressRush() | pointerup/leave → releaseRush()
- فقط روی `coarsePointer` (موبایل)

#### B3: سیستم اچیومنت (R9)

**فایل‌های جدید:**
- `src/lib/achievements.ts` — تعریف و logic
- `src/components/cc/AchievementToast.tsx` — toast با `sonner`

**فایل‌های تغییر:**
- `src/components/cc/GameCanvas.tsx` — بررسی بعد از هر اجرا
- `src/app/stats/page.tsx` — نمایش مدال‌ها

**مدال‌ها (V1):** first_blood, first_grad, combo_10, combo_12, candles_50, candles_100, no_rush_clear, streak_7, duel_win_1, world2

---

### فاز C — تجربه‌ی کاربری (ساعات ۱۲-۱۸)

#### C1: Onboarding تعاملی (R5)

**فایل جدید:**
- `src/game/cc/onboarding.ts` — step tracking

**فایل‌های تغییر:**
- `src/components/cc/GameCanvas.tsx` — state management
- `src/game/cc/render-v2.ts` — `drawOnboardingHints(ctx, e, step)`

**مراحل:**
1. کندل اول: فلش «↑ TAP TO JUMP»
2. بعد از پرش موفق: هینت محو
3. کندل قرمز نزدیک: «⚠ RED CRUMBLES»
4. بعد از ۳ کندل: هینت‌ها محو
5. بعد از ۲ اجرا: غیرفعال

#### C2: ساده‌سازی پنل آماده‌شدن (R11)

**فایل‌های تغییر:**
- `src/components/cc/GameCanvas.tsx` — بازسازی ساختار

**ساختار جدید:**
1. Primary: symbol + date + mutation + START + score/best
2. Quick options (collapsible): mode, timeframe, character
3. Advanced (folded): duel code, prediction, report, archive
4. Settings: → لینک به SettingsPanel

---

### فاز D — تأیید نهایی (ساعات ۱۸-۲۴)

- [ ] `bun test` سبز
- [ ] `bunx tsc --noEmit` تمیز
- [ ] `bun run lint` تمیز
- [ ] `bun run build` موفق
- [ ] تست دستی دسکتاپ: play → die → share → retry → settings
- [ ] تست دستی موبایل: play → RUSH → haptics → settings
- [ ] بررسی accessibility: colorblind + reduced-motion
- [ ] بررسی streak: بازی دو بار → streak افزایش
- [ ] بررسی achievements: trigger → toast → stats page
- [ ] دپلوی نهایی به Vercel

---

## ۵. ریسک‌ها و اقدامات

| ریسک | احتمال | اثر | اقدام |
|---|---|---|---|
| GameCanvas.tsx بسیار بزرگ | بالا | متوسط | refactor تدریجی؛ کامپوننت‌های جدید جدا |
| i18n به‌تعویق افتادن | قطعی | پایین | Phase 2 پس از انتشار |
| Real-device QA معلق | بالا | متوسط | BrowserStack یا تست دستی |
| Reach صفر (X/Twitter) | قطعی | بالا | owner-side action |
| Mascot متوقف | قطعی | پایین | placeholder blockbot فعلی کافی |

---

## ۶. دستورالعمل اجرا برای اجنت کودر

1. هر بسته را **یکجا** پیاده کن — تمام فایل‌های آن بسته با هم
2. بعد از هر بسته: `bun test && bunx tsc --noEmit && bun run lint` را اجرا کن
3. اگر تست شکست: قبل از رفتن به بسته‌ی بعد، اصلاح کن
4. فیزیک بازی (engine.ts) را **تغییر نده** مگر برای gate‌های accessibility
5. W5 anti-cheat tests را **نشکن**
6. هیچ dependency جدیدی اضافه نکن (همه‌ی لازم در package.json موجود است: Radix UI، sonner، next-intl)
7. فایل‌های جدید را در مسیرهای مشخص‌شده ایجاد کن
8. کد را به سبک موجود بنویس (TypeScript strict، Radix UI، functional)
9. هر تغییر را commit کن با پیام واضح: `feat: <description>`
10. قبل از پایان، تست نهایی کامل اجرا کن

---

## ۷. خلاصه‌ی مدیریتی

**وضعیت فعلی:** محصول از نظر فنی آماده‌ی انتشار است. هسته‌ی بازی، لیدربورد، توکن، و امنیت همگی سبز هستند. موانع انتشار عمومی در سه دسته‌اند:

1. **دسترس‌پذیری** (A1-A4): حیاتی برای طیف گسترده‌تر بازیکنان
2. **نگهداشت** (B1-B3): streak و achievements برای بازگشت روزانه
3. **تجربه‌ی کاربری** (C1-C2): onboarding و ساده‌سازی پنل

با اجرای این ۱۰ بسته در ۲۴ ساعت، محصول برای انتشار عمومی آماده می‌شود. i18n و practice mode به Phase 2 موکول می‌شوند.

**هدف نهایی:** یک بازی پلتفرمر مهارتی آنلاین که داده‌ی واقعی بازار را به سطح تبدیل می‌کند، با لیدربورد روزانه، کارت مرگ قابل‌اشتراک، توکن روی زنجیره، و تجربه‌ای دسترس‌پذیر برای همه.
