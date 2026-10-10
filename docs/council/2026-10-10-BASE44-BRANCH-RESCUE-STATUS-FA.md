# نجات branch پایه۴۴ با توکن دسترسی شخصی — گزارش وضعیت

**تاریخ:** ۲۰۲۶-۱۰-۱۰ · **مسئول:** Super Z · **ورودی:** توکن شخصی base44 (نام: token1) که مالک ساخت
**نتیجه‌ی یک‌خطی:** توکن به درد خورد ✅ — branch پایه۴۴ **زنده و تأییدشده** است؛ اما خواندن مستقیم فایل‌هایش از بیرون مسدود است و آخرین قدمِ نجات یک کلیک از مالک می‌خواهد.

---

## ۱) چه چیزهایی با توکن واقعاً باز شد

| توانایی | وضعیت |
|---|---|
| فهرست اپ‌های ورک‌اسپیس با REST | ✅ کار کرد — اپ `candle-climber` با id `6ac68ceb25db22ecc8639f4c` پیدا شد |
| فهرست branch های اپ (REST + CLI) | ✅ — **`base44/setup-d43d28a1` وجود دارد و active است** |
| وضعیت اتصال GitHub اپ | ✅ — `connected:true`، حالت `per_user`، `can_push:true`، اما `installation_id:null` و `webhook_active:false` |
| مکالمه‌ی کامل ایجنت روی branch | ✅ — **۲۰۸ پیام / ۱٫۳MB** شامل ۴۷ عملیات فایل، ۷۲ دستور shell، ۳ تلاش شکست‌خورده‌ی PR |
| چک‌پوینت‌های branch | ✅ — **۳۵ چک‌پوینت** از «Setup Complete» (۷ اکتبر ۱۸:۲۱) تا «خطای ایجاد پول ریکوئست» (۱۰ اکتبر ۰۶:۵۹) |
| خواندن محتوای فایل‌های branch | ❌ بسته — سه دلیل فنی پایین |
| پیش‌نمایش زنده‌ی branch | ❌ سرد — «Branch preview not available» |

**حکم قبلی من ارتقا یافت:** از «قابل تأیید نیست 🟡» به «**وجودش تأیید شد؛ محتوا از راه دور قابل استخراج نیست؛ مسیر نجات آماده است**».

## ۲) فهرست دقیق ۲۶ فایلِ تغییرکرده (از مکالمه استخراج شد)

زیرساخت: `docker-compose.base44.yml` · `.base44/environment.json` · `next.config.ts` · `AGENTS.md` · `.env.example`
هسته‌ی ادغام آنچین: `src/lib/robinhood-chain.ts` (نوشته‌ی جدید) · `src/app/api/onchain/quote/route.ts` (جدید) · `src/app/api/candles/route.ts` · `src/game/cc/types.ts` · `src/game/cc/level-source.ts` · `src/components/cc/GameCanvas.tsx` · `src/app/globals.css` · `test/robinhood-chain.test.ts` (جدید)
مستندات: `docs/ROBINHOOD-CHAIN-INTEGRATION.md` (جدید) · `docs/TRUTH-TABLE.md` (جدید) · `docs/ECOSYSTEM-QUESTIONS.md` (جدید) · `docs/README.md` · `docs/FEEDS.md` · `README.md` + بنر HISTORICAL روی ۴ سند قدیمی (HANDOFF / LOOPBACK-REVIEW / FINAL-SPRINT-PLAN / VARIANT-REVIEW / MANUS×۲)
ابزار: `scripts/verify-feeds.ts` (جدید)

این فهرست با ادعاهای خود base44 در مکالمه (۱۲ فایل +۹۴۳ در چرخه‌ی ادغام، ۱۳ فایل +۳۹۳ در چرخه‌ی نهایی) منطبق است.

## ۳) چرا استخراج خودکار فایل‌ها بسته است (سه دلیل فنی)

1. **سندباکس-بریج پولی است:** دستورهای `sandbox read/ls/run` خطای «External coding agents require the Builder plan or above» می‌دهند — ورک‌اسپیس فعلاً پلن رایگان است.
2. **خواندن مستقیم فایل برای این اپ خاموش است:** سند اپ مقدار `supports_direct_file_reads:false` دارد و export-to-zip هم فقط فایل‌های builder اپ را می‌دهد (قالب خالی)، نه فایل‌های git.
3. **آرگومان‌های tool call در API مکالمه عمداً بریده می‌شوند:** داکیومنت خود base44 می‌گوید فقط call های «منتظر ورودی کاربر» آرگومان کامل دارند؛ بقیه cut short می‌شوند. از ۴۷ عملیات، فقط ۱۰ مورد آرگومان کامل دارند.

**کشف ایمنی مهم:** endpoint رسمی «Push changes to GitHub» فقط main line را push می‌کند و صریحاً می‌گوید «هرگز branch را push نمی‌کند» — و چون main سمت base44 از زمان import آپدیت نشده (`webhook_active:false`)، یک push دستی می‌توانست main گیتهاب ما را به عقب برگرداند. **من عمداً آن را صدا نزدم.**

## ۴) آخرین قدم — ۳ دقیقه کار مالک (تنها راه منتقل کردن branch به گیتهاب)

علت ریشه‌ای شکست PR (هر ۳ تلاش): اپ گیتهاب Base44 روی ریپو نصب نیست (`installation_id:null`).

1. گیتهاب → Settings → **GitHub Apps** → Base44 (اگر در لیست نیست، از پایگاه اتصال حساب Base44 بخش GitHub → Install) → **Configure** → ریپوی `0o0r7/candle-climber` را انتخاب و ذخیره کن.
2. برگرد به base44 → اپ candle-climber → به ایجنت بگو: «دوباره تلاش کن PR بساز» (همان ابزار create_pull_request حالا کار می‌کند و خودش branch را به گیتهاب push می‌کند).
3. PR که باز شد، لینکش را برای من بفرست — بعدش کار من است و دیگر به توکن base44 نیازی نیست: بازبینی کامل diff، تکرار مستقل تست‌ها، گذر از شورا برای سطوح اقتصادی/زبانی، و merge منظم (پایه‌ی branch حدود ۷ کامیت عقب است؛ تداخل در README/FEEDS/route/GameCanvas انتظار می‌رود و خودم حل می‌کنم).

**گزینه‌ی جایگزین (اختیاری):** اگر روزی ورک‌اسپیس به پلن Builder ارتقا یابد، با همان توکن می‌توانم خودم مستقیم فایل‌های branch را بخوانم و branch را در گیتهاب بازسازی کنم — بدون نیاز به کلیکbase44.

## ۵) امنیت توکن — دو توصیه

- توکن ساخته‌شده (token1) **دسترسی کامل** به همه‌ی اپ‌ها و Superagent ها دارد و در چت پیست شده؛ پس از انجام کار، از Workspace settings → Secrets → Personal access tokens **حذفش کن** (طبق عادت rotate خودت). کار باقی‌مانده به آن نیاز ندارد.
- من کپی توکن را از محیط خودم پاک می‌کنم (فایل auth احراز CLI حذف شد) و هیچ‌جا در ریپو/مستندات ثبتش نکردم.

## ۶) شواهد آرشیو شده

- مکالمه‌ی کامل ۲۰۸ پیامی: `download/base44-branch-conversation.json` (۱٫۳MB)
- مانیفست ۴۷ عملیات فایل + ۳ تلاش PR: `download/base44-file-manifest.json`
- تایم‌لاین ۳۵ چک‌پوینت: `download/base44-checkpoints.json`
