# بنچمارک بازی‌های Manus Game Dev — دیپ‌دایو ۱۲ بازی (۲۰۲۶-۱۱-۱۴)

> **مرز شواهد.** این سند سه سطح مدرک را جدا نگه می‌دارد و هیچ‌کدام را جای دیگری
> نمی‌گذارد:
> **(۱) دیده‌شده** — صفحهٔ بازی واقعاً بارگذاری شد و متن/HUD/منوها خوانده شد
> (تاریخ ۲۰۲۶-۱۱-۱۴). **(۲) کاتالوگ** — فقط توضیح رسمی کاتالوگ Manus خوانده شد،
> خودِ بازی اجرا نشد. **(۳) دیده‌نشد** — بازی canvas بود و رندر نشد؛ هیچ ادعایی
> دربارهٔ حس بازی، صدا یا زمان بارگذاری آن ثبت نمی‌شود.
>
> منبع فهرست: صفحهٔ `https://manus.im/features/game-dev` (۱۲ بازی). کاتالوگ کامل
> ۴۰ بازی است؛ این سند فقط همان ۱۲ بازیِ لینکِ درخواست‌شده را پوشش می‌دهد.
> این سند **تحلیل** است، نه نقشهٔ راه و نه وعدهٔ زمانی.

---

## ۱. فهرست و وضعیت پوشش

| # | بازی | دسته (کاتالوگ) | لینک اجراشده | سطح مدرک |
|---|---|---|---|---|
| ۱ | Iron Rift FPS | Action | `ironrift-ilxdh8dd.manus.game` | **دیده‌شده** |
| ۲ | Space Worm 3D | Arcade/puzzle | `spaceworm-ghpurmn2.manus.game` | **دیده‌شده** |
| ۳ | Space Worm 2D | Arcade/puzzle | `spaceworm-bckxphtn.manus.game` | دیده‌نشد (canvas) + کاتالوگ |
| ۴ | The Rogue | Action | `therogue-nxtazlpc.manus.game` | **دیده‌شده** (HUD فقط) + کاتالوگ |
| ۵ | Canyon Circuit | Racing/sports | `canyonrace.manus-game-showcase.com` | **دیده‌شده** |
| ۶ | Super Dungeon | Action | `superdungeon.manustest.game` | **دیده‌شده** (منو/نقشه) + کاتالوگ |
| ۷ | Caveman vs Wild | Action | `cavwild-k48tgxml.manus.game` | **دیده‌شده** |
| ۸ | Sands | Strategy/sim | `sands-2.manustest.game` | **دیده‌شده** |
| ۹ | Frosthold | Strategy/sim | `frosthold-9cagdgfy.manus.game` | دیده‌نشد (canvas) + کاتالوگ |
| ۱۰ | Wildclaw: Colossus Hunt | Action | `wildclaw-dh6unrw2.manus.game` | **دیده‌شده** |
| ۱۱ | Game Dev Game | Strategy/sim | `gamedevgame.manustest.game` | دیده‌نشد (canvas) + کاتالوگ |
| ۱۲ | Lane Runner | Action | `lanerunner-dy5jumhh.manus.game` | **دیده‌شده** |

---

## ۲. تیردان هر بازی

قالب ثابت: حلقه / اسکلت جلسه / تلگراف خطر / شکست و تلاش مجدد / متا و ماندگاری /
تنظیمات و ورودی / آنچه از «تولید» لازم داشته.

### ۲.۱ Iron Rift FPS — دیده‌شده

- **اسکلت:** دو حالت روی منو با هزینهٔ صریح — «ON SLAUGHT · 8 WAVES · BOSS FIGHT»
  و «DEATHMATCH · 6-BOT FREE-FOR-ALL». بازیکن قبل از اولین کلیک می‌داند چه چیزی
  و چقدر طول می‌کشد.
- **قوس:** ۸ موج، و باس سه‌فاز که در HUD از قبل به‌صورت `PHASE 1 / 2 / 3` فهرست
  شده؛ یعنی ساختار پایان بازی یک «قرارداد» است، نه سورپرایز.
- **انتخاب درون‌جلسه:** بعد از هر موج «CHOOSE AN AUGMENT — PRESS 1·2·3 OR CLICK»؛
  یعنی escalation با انتخاب بازیکن قفل می‌شود.
- **کیفیت به‌عنوان مکانیک:** رتبهٔ استایل `D → SSS` که ضریب امتیاز است و با
  ضربه‌خوردن پایین می‌آید؛ Overdrive به‌صورت حلقهٔ شارژ + کلید `F`.
- **خوانایی منابع:** HEALTH و ARMOR جدا (`30 / 150`)، و pick-upها با رنگ ثابت
  معنا دارند (سبز=جان، آبی=زره، کهربایی=مهمات) و به بازیکن «کشیده» می‌شوند.
- **تلگراف:** هر خطر در HUD با کلمه اعلام می‌شود، نه فقط با شکل (نمونه: هشدارهای
  محیطی و متن «Spawn shield»).
- **تنظیمات:** حساسیت ماوس، FOV، **صدای افکت و صدای محیط جدا**، کیفیت گرافیک،
  معکوس‌کردن Y، «Reduce camera motion»، قطع کل صدا.
- **ورودی:** ۱۶ بایند در یک لیست خوانا + نگاشت گیم‌پد در همان لیست (dive/slide/prone
  به‌عنوان حرکت‌های تعریف‌شده، نه دکمهٔ خالی).
- **فوت‌نوت‌های تولید:** «Environment CC0 · Poly Haven · Robot rig · Mixamo X Bot» —
  منبع asset روی خودِ صفحه اعلام شده.

### ۲.۲ Space Worm 3D — دیده‌شده

- **دو حالت با طول صریح:** FFA و «6 v 6 · 4-minute match».
- **نام بازیکن قبل از شروع** گرفته می‌شود (هویت پیش از اولین ورودی).
- **پایداری و متا روی منو:** تب‌های `Skins`، `Records`، `How to play`، `Settings`.
- **باف‌ها تایمر دارند** (Magnet / Shield / Free boost با ثانیه) و منبع
  امتیاز (stardust) با آیکون یکسان در HUD و منو تکرار می‌شود.
- **خطر محیطی با کلمه:** «Arena rim!» و «Gravity well».
- **رشد = عدد + طول:** «Length» و leaderboard «Longest worms» — یک استات که
  همان لحظه قابل فهم است.

### ۲.۳ Space Worm 2D — دیده‌نشد

کاتالوگ: رشد با خوردن انرژی و اجرام، boost از میان خطر، «bite smaller rivals in two»،
گرفتن «bounty crown»، تعقیب «longest run». هیچ مشاهدهٔ مستقیمی ثبت نشد.

### ۲.۴ The Rogue — دیده‌شده (HUD) + کاتالوگ

- HUD حداقلی و چهارVerb: `ULT / SPELL / DASH / USE` + دکمهٔ توقف. یعنی بار
  شناختی روی صفحه کم است و توانایی‌ها همیشه در همان چهار جای ثابت‌اند.
- کاتالوگ: «forge a four-spell build from seven elements»، roguelite، حالت‌های
  solo/co-op/arena. (build از میان ۷ عنصر = فضای انتخاب، نه درخت پیچیده)

### ۲.۵ Canyon Circuit — دیده‌شده

- **بیانیهٔ انصاف روی صفحه:** «Every chassis has identical grip, acceleration,
  top speed, boost and handling. **Looks only.**»
- **چهار حالت با هزینه/فایدهٔ صریح:** Solo (۲ رقیب AI، ۳ دور، ۴۸ گیت، سقف ۳۰۰s)،
  Split-Screen (۲ بازیکن + ۱ AI)، Track Lab (ساخت مسیر + **share code** برای
  «Seed New layout» و Load)، Online Ghosts (تا ۳ نفر، بدون برخورد).
- **الگوی «اتومبیل برابر»:** یک تفاوت ظاهری مجاز است، هیچ تفاوت مکانیکی نه —
  دقیقاً همان قانونی که برای board روزانه لازم است.
- **تلگراف کلامیِ آیتم‌ها:** «SEEKER INCOMING»، «MINE AHEAD»، «LOCKED — CHANGE
  LANES OR SHIELD!»؛ آیتم بدون هشدار وجود ندارد.
- **حالت‌های شکست:** «WRONG WAY»، «RESPAWNING 3» با متن آرام‌کنندهٔ
  «Hold tight — engine restarting».
- **فیدبک مهارت:** زنجیرهٔ drift با ضریب (`×1 CHAIN`)، slipstream، wall-ride با
  گیج G، نیترو با وضعیت `READY`.
- **سختی به‌عنوان انتخاب:** `Relaxed / Pro` و `Items On/Off` قبل از مسابقه.
- **اعتبارسنجی سمت سرور:** «The service re-simulates every run to confirm results.»
- **ورودی:** هم کیبورد/گیم‌پد دسکتاپ و هم پد لمسی با همان مجموعهٔ دکمه‌ها.

### ۲.۶ Super Dungeon — دیده‌شده (منو/نقشه) + کاتالوگ

- سه ورودی روشن: `START PATROL` / `HOW TO PLAY` / `SETTINGS` + یک جملهٔ
  روایی («Curfew was an hour ago…») که هدف را می‌گوید.
- **بیانیهٔ ورودی:** «Best with keyboard + mouse. Gamepad and touch supported.»
- **نقشه به‌عنوان زبان:** لجند با معناهای ثابت (`+` چشمه، `$` فروشگاه، `!` همکلاسی
  گرفتار، `T` گنج، `C` چالش، `?` صفحهٔ lore، `E` نخبه، `B` باس، `X` خروج) و
  وضعیت «اتاق‌های خط‌چین: کشف‌شده اما کاوش‌نشده» — یعنی پیشرفت قابل خواندن است.
- **توانایی‌ها با نام کوتاه:** Barrier / Combo / Bolt / Dash / Nova.

### ۲.۷ Caveman vs Wild — دیده‌شده

- **ماندگاری محلی اعلام‌شده:** «Single-player · progress is saved in this browser»
  و `Continue expedition` در کنار `New expedition` (با دیالوگ تأیید بازنویسی).
- **مرگ نرم + توضیح:** «You collapsed… Carried back to camp. Nothing in your
  satchel was lost.» — شکست هست، جریمهٔ گم‌کردن نیست، و متن می‌گوید چه شد.
- **پایان با انتخاب:** «Signal Restored» + `Keep exploring / New expedition / Return`.
- **گیت محیطی به‌جای عدد:** «Scorching heat — find heat protection» (پیشرفت
  به ابزار گره خورده، نه به level).
- **ابزارهای مهارتی:** `tracked` و `snare` با شمارنده و کلید (`G`, `C` cycle).
- **محتوای بیرون از حلقه:** لینک `Enemy lab` — bestiary عمومی، جدا از run.
- **HUD فشرده:** sabatel/map/journal با `Tab / M / B` و کارت کنترل `Click to look around`.

### ۲.۸ Sands — دیده‌شده

- **قرارداد آرامش:** «No timers, no pressure. Your basin saves itself.»
- **نردبان milestone با عدد:** از «First Families 8» تا «Crown of the Sands 260»؛
  پیشرفت هم بصری و هم عددی.
- **صنعت‌ها با ظرفیت:** Water 4/4، Spice 6/6، Trade 5/5… (شش ردیف دیگر) — یعنی
  هر سیستم یک شمارندهٔ خوانا دارد.
- **درخواست‌های کاروان** به‌صورت سه quest با پاداش مشخص (0/3 +8، 0/1 +20، 5/10 +12).
- **حالت عکس** با DOF، blur، cinema bars و «Clean view H» — تولید محتوای کاربر.
- **ورودی/دسترسی:** ۱۵ بایند (تا `[`/`]` برای اندازهٔ قلم‌مو) + «Walk the streets»
  و «ride with the caravan» به‌عنوان verbهای غیرسازنده.

### ۲.۹ Frosthold — دیده‌نشد

کاتالوگ: بقا در سرما، نجات ۱۸ بازمانده، تخصیص شغل، گسترش سکونتگاه، ساخت beacon
پیش از انجماد. هیچ مشاهدهٔ مستقیمی ثبت نشد.

### ۲.۱۰ Wildclaw: Colossus Hunt — دیده‌شده

- **انتخاب هدف قبل از مبارزه:** سه شکار با نام، لقب و برچسب «THREAT — Not yet hunted»
  و یک پاراگراف توصیف که می‌گوید با چه چیزی روبه‌رو می‌شوی.
- **تلگراف آموزشی به‌صورت تیپ روی صفحه:** «Tip: dodge through an attack at the
  last moment to trigger a **Flow Evade**» — مکانیک در همان جایی که لازم است آموزش
  داده می‌شود.
- **تلگراف لحظه‌ای:** بنر «BRACE! — Hold Shift».
- **HUD با فریم‌های تصویری:** player frame / boss frame / minimap / lock-on /
  hook + شمارندهٔ potion.
- **کنترل کامل و یکسان روی هر سه ورودی:** ۱۰ بایند دسکتاپ + نوار لمسی با همان ۸ عمل.
- **محتوای بیرون از حلقه:** `Field notes`.
- **تأیید خروج:** «Abandon this hunt and return to the title screen? Keep hunting / Yes, abandon».

### ۲.۱۱ Game Dev Game — دیده‌نشد

کاتالوگ: جَم با تایمر، ساخت feature در برابر bug، انرژی و morale، devlog، رقابت با
jammerهای رقیب. هیچ مشاهدهٔ مستقیمی ثبت نشد.

### ۲.۱۲ Lane Runner — دیده‌شده

- **روزِ مشترک:** منو یک `DAILY RUN · 2026-11-14` دارد — همان ایدهٔ «چارت روز»
  ما، در یک endless runner کوچک.
- **بیانیهٔ صریح ضدمونتیزیشن:** «Endless and free. **No ads, no paywalls, no
  timers.** Everything is earned in play.»
- **ماندگاری رکورد شخصی:** `BEST SCORE`، `BEST DISTANCE`، `COINS` روی منو.
- **انتخاب در گره‌های پیشرفت:** «SECTOR CLEAR · CHOOSE A PERK — Press 1·2·3 or tap a card».
- **تلگراف با جملهٔ آموزشی:** «Bosses draw every attack on the ground before it
  lands. Step out of the red.»
- **وضعیت‌های خوانا:** COMBO `×1.00`، SECTOR، THREAT `1.0`، `BOSS / SHIELDED`،
  کول‌داون‌های `Q` و `E` با شمارنده.
- **ورودی دوگانه:** «DRAG or A/D ← → to steer» در همان یک خط.

---

## ۳. الگوهای عرضی (با شاهد کشوری)

| # | الگو | کجا دیده شد | چرا کار می‌کند |
|---|---|---|---|
| ۱ | **منو = جلسه‌سازی** | Iron Rift (۲ حالت با هزینه)، Canyon (۴ حالت)، Wildclaw (۳ شکار) | بازیکن قبل از اولین ورودی می‌داند چه چیزی، چقدر، با چه ریسکی |
| ۲ | **تلگراف کلامی خطر** | Canyon (`SEEKER INCOMING`)، Lane Runner («Step out of the red»)، Wildclaw (`BRACE!`)، Caveman (heat) | مرگِ «نمی‌دانستم» حذف می‌شود؛ نزدیک‌ترین چیز به عدالت در بازی سخت |
| ۳ | **شکست ارزان + توضیح‌دار** | Caveman (collapse + «nothing lost»)، Canyon (`RESPAWNING 3`)، Lane Runner (retry) | بازیکن دوباره تلاش می‌کند چون هزینه و علت روشن است |
| ۴ | **انتخاب در گره** | Iron Rift (augment هر موج)، Lane Runner (perk هر سکتور) | escalation را از «سخت‌تر شدن» به «تصمیم» تبدیل می‌کند |
| ۵ | **رکورد شخصی جدا از رکورد جهانی** | Lane Runner (best score/distance)، Space Worm (records/skins)، Caveman (browser save) | حتی وقتی سرور/فصل صفر می‌شود، تلاش بازیکن گم نمی‌شود |
| ۶ | **بیانیهٔ صریح انصاف** | Canyon («equal cars… looks only»)، Lane Runner («no paywalls») | اعتماد؛ مخصوصاً وقتی پول/توکن در تصویر است |
| ۷ | **هر منبع یک شمارنده** | Iron Rift (armor/health)، Canyon (hull/nitro/chain)، Sands (industry 4/4) | وضعیت بدون حدس خوانده می‌شود |
| ۸ | **سختی به‌عنوان انتخاب، نه پنهان** | Canyon (`Relaxed/Pro`, items on/off) | بازیکن تازه‌کار قفل نمی‌شود، بازیکن حرفه‌ای تخفیف نمی‌گیرد |
| ۹ | **ورودی سه‌گانه با همان مجموعهٔ عمل** | Iron Rift، Canyon، Wildclaw، Super Dungeon | «موبایل نسخهٔ دوم» نیست؛ همان بازی است |
| ۱۰ | **محتوای بیرون حلقه** | Caveman (`Enemy lab`)، Wildclaw (`Field notes`)، Sands (journal/photo)، Super Dungeon (نقشه + lore) | بازیکن در زمان «بدون بازی» هم با بازی درگیر می‌ماند |
| ۱۱ | **اعتبارسنجی سمت سرور** | Canyon («re-simulates every run») | ghost/board بدون آن قابل‌اعتماد نیست |
| ۱۲ | **روزِ مشترک حتی در بازی کوچک** | Lane Runner (DAILY RUN با تاریخ) | اعتبار ایدهٔ «یک چارت برای همه» را تأیید می‌کند |

## ۴. «تولید حرفه‌ای» در این بنچمارک یعنی چه

از خودِ صفحه‌ها استخراج شد، نه از تئوری:

1. **ورودی‌های اعلام‌شده و کامل** — لیست بایند + نگاشت پد + پد لمسی (۴ بازی).
2. **تنظیمات دیده‌بانی‌شده** — صدا (افکت/محیط جدا)، حساسیت، FOV، کیفیت،
   reduce camera motion، mute (Iron Rift)؛ سختی و آیتم (Canyon).
3. **بیانیهٔ انصاف/پول** — «looks only»، «no paywalls» (۲ بازی).
4. **ماندگاری** — save محلی یا رکوردهای ذخیره‌شده (۳ بازی).
5. **تولید محتوای کاربر** — share code مسیر (Canyon)، photo mode (Sands).
6. **اعتبارسنجی** — re-simulation سمت سرور (Canyon).
7. **منبع asset** — CC0/Poly Haven/Mixamo روی صفحه (Iron Rift).
8. **یک خط آموزش در لحظهٔ نیاز** — Wildclaw/Lane Runner به‌جای دیوار آموزش اولیه.

## ۵. چه چیزی از این بنچمارک به Candle Climber منتقل می‌شود و چه چیزی نه

**منتقل‌شدنی (و مستقل از موتور):** الگوهای ۱ تا ۱۲ بالا. مخصوصاً ۲، ۳، ۵، ۶، ۸، ۱۰.

**منتقل‌نشدنی (با دلیل):** دنیای ۳D و co-op زنده (هزینهٔ asset/شبکه بدون رابطه با
هستهٔ «چارت = مرحله»)، انتخاب خودرو/کاراکتر به‌عنوان تفاوت مکانیکی (board مشترک
را می‌شکند؛ Canyon خودش این را رد می‌کند و «looks only» می‌گذارد)، تایمر/انرژی
مصرفی (Lane Runner صریحاً ردش می‌کند و ما هم در `ECONOMY-LAWS` رد کرده‌ایم).

## ۶. محدودیت‌ها

- سه بازی canvas در رندر ابزار اجرا نشدند؛ ادعای حس/صدا/کارایی دربارهٔ آن‌ها نیست.
- زمان بارگذاری، نرخ فریم و کارایی روی دستگاه واقعی اندازه‌گیری نشد.
- این سند دربارهٔ **تجربهٔ انسانی** قضاوت نمی‌کند؛ فقط شواهد خوانده‌شده را ثبت می‌کند.
