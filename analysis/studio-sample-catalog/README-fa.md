# پایگاه و روش بررسی ۴۰ بازی نمونه

## نتیجه‌ی این دور

کاتالوگ رسمی ۴۰ عنوان دارد و برای هر ۴۰ عنوان یک رکورد ساختاریافته تهیه شده است. این به‌معنای ۴۰ آزمون کامل گیم‌پلی نیست: ۲۵ مورد `page_only` هستند و ۱۵ مورد فقط نشانه‌ی محدود از بازی فعال دارند؛ هیچ چرخه‌ی کامل یا نتیجه‌ی برد/باخت در این مجموعه تأیید نشده است. برداشت مرورگر ۱۸۸ قاب برای ۳۹ عنوان نگه داشته است: ۳۵ عنوان پنج قاب، سه عنوان چهار قاب، یک عنوان یک قاب و یک عنوان بدون قاب. قاب‌ها ممکن است منو یا بارگذاری باشند.

پایگاه JSON و CSV هرکدام ۴۰ شناسه‌ی یکتا دارند و شامل عنوان/دسته، ادعای کارت، شواهد، هدف/پیشرفت/تصمیم، پاداش/جریمه/نتیجه، محدودیت‌ها، سطح اطمینان و سرنخ فنی است. متن کارت، مشاهده‌ی مستقیم و سرنخ فنی از هم جدا هستند؛ هرچه دیده نشد «مشاهده نشد/نامشخص» می‌ماند.

فایل‌های اصلی در همین پوشه‌اند: `database/game-database.json`, `database/game-database.csv`, `report-fa-final.md`, `process-fa.md`, `game-review-prompt-fa.md` و `candle-climber-v1-baseline-fa.md`. تحلیل مستقل هر بازی در `game-analysis-results/` است. فایل‌های خام شامل URL مستقیم در پایگاه توزیعی نیستند؛ از JSON/CSV نهایی برای استفاده و اشتراک‌گذاری استفاده شود.

## بازتولید گذر فنی

`catalog.json` ورودی کاتالوگ است و `scripts/studio-sample-tech-audit.mjs` با Chromium، پنج مرحله‌ی تصویری و فراداده‌ی صفحه را ثبت می‌کند. GitHub Actions فقط روی شاخه‌ی `research/studio-sample-catalog-v2` اجرا می‌شود؛ `main` و production تغییر نمی‌کنند. اجرای محلی پس از آماده‌سازی Node 20، Playwright 1.49.0 و Chromium:

```bash
node scripts/studio-sample-tech-audit.mjs
```

این توالی ورودی عمومی است، نه کنترل اختصاصی هر بازی. تغییر تصویر پذیرش ورودی را ثابت نمی‌کند و نشانه‌ی فنی به‌تنهایی موتور یا رفتار بازی را اثبات نمی‌کند. باندل کامل بازی منتشر یا ذخیره نمی‌شود.

## بازبینی مستقل و ساخت پایگاه

برای هر عنوان، متن صفحه و JPGهای مرحله‌بندی‌شده به یک تحلیلگر داده شد. پرامپت و تعریف سطح مشاهده در `game-review-prompt-fa.md` آمده‌اند. مرورگر و تحلیلگر فقط شواهد همان بازی را بررسی می‌کنند؛ بازی یا کنترل پنهان را حدس نمی‌زنند. روش کامل، منشأ قاب‌ها و معیارهای QA در `process-fa.md` ثبت شده است.

برای ساخت دوباره‌ی JSON/CSV از کاتالوگ، برداشت فنی، رکوردهای تحلیل و نمایه‌ی قاب‌ها:

```bash
python3 scripts/build_game_database.py \
  --catalog analysis/studio-sample-catalog/catalog.json \
  --technical analysis/studio-sample-catalog/technical-audit.json \
  --analysis-dir analysis/studio-sample-catalog/game-analysis-results \
  --review-assets-index analysis/studio-sample-catalog/review-assets/workflow-items.json \
  --capture-run-id <current-run-id> \
  --fallback-run-id <supplemental-run-id> \
  --output-dir analysis/studio-sample-catalog/database
```

سازنده‌ی پایگاه تعداد ۴۰ عنوان، شناسه‌های یکتا، کامل‌بودن JSON/CSV، شمار سطح مشاهده و نشت‌نکردن URL مستقیم را کنترل می‌کند. تصاویر در artifact مرورگر نگهداری می‌شوند تا تاریخچه‌ی Git حجیم نشود؛ پایگاه مرحله و منشأ هر قاب را ثبت می‌کند.

## نقشه‌ی راه Candle Climber v2

گزارش `report-fa-final.md` پیشنهاد می‌کند به‌جای افزودن کنترل یا اقتصاد تازه، هدف نزدیک و Summit در HUD خواناتر شوند: یک Summit Rail کم‌حجم، Candle Call مهارتی و پیام علت‌محور برای RUSH، combo، crumble و پایان run. این ایده باید از P0 (baseline و عدالت) شروع شود، در P1/P2 با آزمون خوانایی و یادگیری سنجیده شود و تنها پس از موفقیت گسترش یابد. امتیاز، فیزیک و رتبه skill-only می‌مانند؛ مزیت wallet، free brake، کنترل افقی جدید و مسیر شاخه‌ای در نقشه‌ی پایه نیستند.
