# Шаблон проєкту розробника: Next.js + Supabase + OpenSpec

Стартовий репозиторій для вебзастосунку «з нуля». Кожен розробник команди створює з шаблону **власне** репо й робить у
ньому **свою** реалізацію продукту команди: власні Supabase і Vercel, задачі → гілки → PR → CodeRabbit → merge.
Вимоги веде PM у своєму репо вимог (шаблон [`koldovsky/2026-quitcode-06-spec-template`](https://github.com/koldovsky/2026-quitcode-06-spec-template)):
сюди вони приходять командою агента `/spec-sync`, без скриптів і тегів. Наприкінці PM порівнює, як різні розробники
(і їхні агенти) прочитали й реалізували ті самі вимоги. В агенції шаблон так само береться для нового клієнтського проєкту.

- **Застосунок:** Next.js 16 (App Router, `src/`), вхід email + пароль через Supabase Auth, сторінка
  з email і роллю користувача з таблиці `profiles`; сесію оновлює `src/proxy.ts`.
- **База як код:** ваша власна база Supabase; `supabase/migrations/` (профілі й ролі з RLS і явними GRANT),
  ідемпотентний `seed.sql`, синтетичні користувачі (`npm run users:demo`). Міграції в базу застосовує лише CI.
- **Специфікація:** OpenSpec (`openspec/`) з правилами в `openspec/config.yaml`. `product/` і `openspec/specs/` — копія
  вимог PM (оновлює лише `/spec-sync`), `openspec/changes/impl-<зріз>` — ваш план реалізації; AC ID наскрізно:
  вимога → задача → назва тесту → `docs/conformance.md`.
- **Агенти:** `AGENTS.md` (+ `CLAUDE.md` = `@AGENTS.md`), команди `/spec-sync`, `/conformance` і `/opsx:*`, скіл
  `spec-clarify` — однаково в Claude Code і Cursor; `.mcp.json` (Supabase MCP лише на читання) і `.claude/settings.json`
  (заборона читати `.env*` і запускати `supabase db push` та деструктивні команди Supabase CLI) діють лише в Claude Code —
  Cursor цих файлів не читає (див. AGENTS.md, «Секрети»).
- **Ворота:** GitHub Actions `ci.yml` (`spec`, `app`, `conformance`, `db-check` — обов'язкові для PR; `db-deploy` — міграції
  в прод після merge), ruleset `solo-main`, шаблон PR, `.coderabbit.yaml`.

| Шар курсу | Де в шаблоні |
|---|---|
| Правила й команди | `AGENTS.md`, `CLAUDE.md`, `.claude/commands/` (`spec-sync`, `conformance`, `opsx/`), `.cursor/commands/` |
| Скіли | `.claude/skills/` (Cursor читає цю ж теку) |
| MCP з мінімальними правами | `.mcp.json`, `.claude/settings.json` (лише Claude Code) |
| Специфікації | `product/`, `openspec/`, `scripts/check-*.mjs`, `docs/conformance.md` |
| Процес і ворота | `.github/` (CI, шаблон PR), `.coderabbit.yaml`, `docs/bootstrap.md` |

## Модель роботи: репо вимог PM і власне репо розробника

```text
 PM:  <pm>/<team-slug>-spec          (шаблон вимог, публічне)
      main = поточні вимоги: product/ + openspec/specs/
      issues «Питання до специфікації» (мітка spec-question) — тут питають і відповідають
          ▲ питання й пропозиції                    │ /spec-sync у Claude Code чи Cursor:
          │ (issue через вебформу)                  ▼ агент копіює вимоги з main PM у ваше репо
 Ви:  <dev>/<team-slug>              (цей шаблон, публічне) — у кожного розробника своє
        ├─ main               ← лише через PR (ruleset solo-main: зелений CI, 0 approve)
        ├─ sync/<дата>        ← /spec-sync: product/, openspec/specs/, docs/conformance.md
        ├─ task/<коротко>     ← реалізація: код, міграції, тести, рядки матриці
        └─ template/<коротко> ← виправлення шаблону (cherry-pick)
      Supabase: ваша організація й проєкт   ← міграції застосовує CI (db-deploy)
      Vercel: ваш проєкт, прод з main, preview для кожного PR
```

Три правила:

1. **Вимоги — у `main` репо PM.** PM злив зміни в `main` і написав у чат команди «вимоги оновлено».
2. **У своєму репо ви підтягуєте вимоги командою `/spec-sync`.** `product/` і `openspec/specs/` руками не правите.
3. **Питання й пропозиції до вимог — issues у репо PM** (вебформа `https://github.com/<pm>/<team-slug>-spec/issues/new/choose`).
   Відповіді там само — їх бачить уся команда.

| Роль | Де працює | Що робить |
|---|---|---|
| PM | репо вимог `<pm>/<team-slug>-spec` | `product/`, зміни OpenSpec, відповіді на issues `spec-question`, `product/CHANGELOG.md`; наприкінці — нотатка-порівняння реалізацій |
| Розробник | власне репо `<dev>/<team-slug>` з цього шаблону | налаштування (`docs/bootstrap.md`), `/spec-sync`, питання (`spec-clarify`), зміна `impl-<зріз>`, задачі PR-ами |

Колег у вашому репо немає: approve не потрібен, рев'ю робить CodeRabbit (коментар `@coderabbitai review`), а ви
відповідаєте на кожен його коментар — виправленням або поясненням, чому ні. Команда лишається: той самий бриф, чат,
зустріч команди й питання в репо PM. Подивитися реалізації колег можна, але це необов'язково.

## Перед початком

- Node 24 (`node -v`), Git, GitHub CLI (`gh`).
- OpenSpec CLI **глобально** й тієї ж версії, що в `package.json`:
  `npm i -g @fission-ai/openspec@1.14.1` → `openspec --version` має показати `1.14.1`
  (стара глобальна версія — оновіть тією ж командою). Команди `/opsx:*` і скіли `openspec-*` викликають
  просто `openspec`, а в PATH оболонки агента немає `node_modules/.bin`. Скрипти `npm run spec:*` і CI
  беруть версію з devDependencies. Телеметрію вимикає `openspec config set telemetry.enabled false`.
- Docker **не** потрібен: локально — лише `npm run dev` проти вашої бази; міграції на одноразовій базі перевіряє CI (`db-check`).

## Шлях розробника

1. **Налаштування (день 0).** Пройдіть чекліст `docs/bootstrap.md` по порядку: **Use this template → Create a new
   repository** (власник — ваш особистий акаунт, назва `<team-slug>`, **Public**: ruleset на GitHub Free діє лише в
   публічних репо) → CodeRabbit на репо → Supabase (власні організація й проєкт, реєстрацію й Confirm email вимкнено) →
   environment `production` із секретом `SUPABASE_DB_URL` → Vercel (дві змінні `NEXT_PUBLIC_…`, Require Log In
   вимкнено) → Supabase URL Configuration → **Actions → CI → Run workflow** на `main` з `include_seed` (перша міграція й
   сид) → `npm run users:demo` → зелений CI на `main` → ruleset `solo-main` (імпорт `materials/rulesets/solo-main.json`
   з курсового репо) → перший PR із заповненим `docs/bootstrap.md` (тип «Реалізація»).
2. **Зустріч команди (дні 0–1).** Перший раунд питань до брифу; організує PM. Адреса репо вимог PM — у чаті команди.
3. **Вимоги.** Коли PM написав «вимоги оновлено» — у Claude Code чи Cursor `/spec-sync <pm>/<team-slug>-spec` (адреса
   потрібна лише вперше, далі просто `/spec-sync`; можна й словами: «підтягни оновлені вимоги») → звіт про нові AC →
   PR «Оновлення вимог» → merge. Як це працює — розділ нижче.
4. **Читання вимог:** скіл `spec-clarify` → питання як issues у репо PM через вебформу (спершу пошук: питання вже є —
   коментар із новим випадком у тому issue) → журнал `docs/spec-reading.md`. `gh issue create` не використовуйте: без
   доступу на запис до репо PM мітка `spec-question` мовчки губиться, а форма її ставить.
5. **Як реалізуєте:** власна зміна `npx openspec new change impl-<зріз>` → `skip_specs: true` у `.openspec.yaml` →
   `design.md` (таблиці, RLS, server actions, сторінки — з AC ID) і `tasks.md` (вертикальні задачі з «Done when: AC-…»)
   → PR «Реалізація». Технічні рішення, які вимоги свідомо лишають відкритими, — ADR у `docs/decisions/`.
6. **Задача:** `git switch main && git pull` → `git switch -c task/<коротко>` → код + тести `it("AC-…: …")` →
   `/conformance` (рядок матриці → «реалізовано») → `npm run lint && npm run typecheck && npm test` → push → PR
   «Реалізація» → окремим коментарем `@coderabbitai review` → виправлення або відповіді на коментарі → зелений CI →
   **Squash and merge** → прод-деплой Vercel. Галочки в `openspec/changes/impl-<зріз>/tasks.md` ставте в PR задачі
   (`/opsx:apply` робить це сам); в останньому PR зрізу, до merge, — `npx openspec archive impl-<зріз> -y`.
7. **Міграція в задачі:** `npx supabase migration new <назва>` → SQL (RLS, GRANT, політики) → у тому ж PR; `db-check`
   застосує всі міграції на одноразовій базі й звірить порядок з `main`; після merge `db-deploy` застосує її у вашу базу.
   Ніколи `supabase db push` з ноутбука, ніколи DDL у SQL Editor. Типи для нових таблиць — готовий `database.types.ts`
   у Summary прогону `db-check`.
8. **Після уточнень PM (день 4) — знову `/spec-sync`.** Нові й змінені AC — у звіті й у матриці; хоча б один новий чи
   змінений AC реалізуйте або відкладіть із посиланням на рішення PM.

## Як вимоги потрапляють у репо: `/spec-sync`

Команда агента (`.claude/commands/spec-sync.md`; у Cursor — `.cursor/commands/spec-sync.md`, що відсилає до того ж
файлу). Жодних скриптів синхронізації, тегів чи службових файлів: лише `git`, `npm` і шапка матриці. Агент:

1. Бере адресу репо PM із шапки `docs/conformance.md` — рядок `Вимоги: <адреса> · коміт <40 символів> · <дата>`.
   До першої синхронізації там `Вимоги: — (заповнює /spec-sync)`, і адресу дає аргумент (`<owner>/<repo>` або URL) чи
   відповідь людини.
2. Перевіряє, що робоче дерево чисте, оновлює `main` і робить гілку `sync/<дата>`.
3. Бере свіжий `main` репо PM звичайним git — без тимчасових тек, у будь-якій оболонці:
   `git fetch --depth 1 <адреса> main` → `git rm -r -q --ignore-unmatch product openspec/specs` →
   `git checkout FETCH_HEAD -- product openspec/specs`.
4. Показує, що змінилось: які AC і вимоги додано, змінено, прибрано; нові записи `product/CHANGELOG.md` і `product/decisions.md`.
5. Оновлює `docs/conformance.md`: шапку (адреса · коміт · дата коміту PM); рядок кожного нового AC зі статусом
   `відкладено (нова вимога — чекає реалізації)`; прибирає рядки прибраних AC і перелічує тести, що досі їх згадують;
   рядки змінених AC лишає й перелічує для перевірки.
6. Запускає `npm run spec:validate`, `npm run spec:check`, `npm run ac:coverage` (мають бути зелені; вимоги руками не правимо).
7. Комітить «Оновлення вимог з `<owner>/<repo>@<sha7>`» і **лише після вашого «так»** пушить гілку й відкриває PR
   «Оновлення вимог» (`gh pr create --web`).

Що далі з новими AC: реалізуйте їх PR-ом «Реалізація» (тест + рядок «реалізовано») або залиште «відкладено» з
конкретною причиною й посиланням на рішення PM: `відкладено (рішення PM: <pm>/<team-slug>-spec#7)`. Тест з AC ID,
якого ще немає в `openspec/specs/`, дає ORPHAN — за новою поведінкою працюйте після злитого PR «Оновлення вимог».
Якщо PM прибрав AC, на який посилаються ваші тести, `ac:coverage` покаже ORPHAN: `/spec-sync` запропонує прибрати ID з
назв цих тестів окремим комітом у тій самій гілці (єдиний виняток із меж PR «Оновлення вимог»).

Побічний ефект `--depth 1`: git позначає ваш локальний клон як неглибокий (`git rev-parse --is-shallow-repository` →
`true`), бо коміт PM узято без історії. Ваших гілок і `main` це не стосується: push, fetch, `git log` і
`scripts/check-migration-order.mjs` працюють як звичайно.

## Міграції в прод

**Основний шлях.** Секрет environment `production` `SUPABASE_DB_URL` = рядок **Session pooler** з Supabase → **Connect**
(`postgresql://postgres.<ref>:<пароль>@<pooler-host>:5432/postgres`; порт **5432**, не 6543 — у transaction mode DDL не
застосовуємо; прямий хост на Free лише IPv6, а раннери GitHub — IPv4). Спецсимволи пароля — percent-encoded
(`@` → `%40`, `#` → `%23`, `/` → `%2F`). Job `db-deploy` на push у `main` виконує
`supabase db push --db-url "$SUPABASE_DB_URL"` (спершу `--dry-run` для журналу; без `--include-all`); сид — лише
вручну: **Actions → CI → Run workflow** на `main` з `include_seed` (`--include-seed`). Без секрету job пропускає
крок з повідомленням. Перевіряємо прогоном у день 0.

**Запасний шлях** (якщо `--db-url` не працює): офіційний `supabase link` + `supabase db push`. Створіть scoped token
(Supabase → Account → Access Tokens; доступ лише до вашого проєкту, дозвіл **Project Settings → API Keys → API Key
Secrets: Read**; точні назви перевірте в інтерфейсі) і задайте в environment `production` секрети `SUPABASE_ACCESS_TOKEN`,
`SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID` (ref проєкту), а `SUPABASE_DB_URL` видаліть — `db-deploy` сам перейде на цей шлях:

```bash
supabase link --project-ref "$SUPABASE_PROJECT_ID"   # токен і пароль — з env SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD
supabase db push --dry-run && supabase db push
```

Scoped tokens вийшли в GA 06.10.2026, і є відкритий звіт про 403 на `supabase link` зі scoped token
(supabase/supabase#50244) — тому цей шлях запасний; працює він у вашому проєкті чи ні, звіряємо прогоном.
Класичний токен доступу відкриває всі ваші організації Supabase — у секрети репо його не кладемо.

**Збої й відновлення:**

- `db-check` FAIL `OLDER` — міграцію з іншої вашої гілки злито раніше: перейменуйте файл новою міткою (команду `git mv`
  друкує `scripts/check-migration-order.mjs`) і запуште.
- `db-deploy` FAIL «Found local migration files to be inserted before the last migration on remote database» — два PR-и
  з міграціями пройшли перевірки паралельно (статуси не вимагають «up to date») і злились у зворотному порядку. Окремий PR:
  `git mv` старшого (ще не застосованого — див. журнал `db-deploy`) файлу на нову мітку без зміни SQL → `db-check`
  покаже попередження `RENAMED`, не FAIL → звірте журнал `db-deploy` → merge → `db-deploy` застосує. Ніколи `--include-all`.
- `db-deploy` скасовано (cancelled) на якомусь коміті `main` — кілька merge поспіль: у групі `supabase-prod` GitHub тримає
  один прогін в очікуванні, і новіший замінює старіший. Нічого не втрачено: наступний прогін застосовує всі міграції з `main`.
- `db-deploy` FAIL «Remote migration versions not found in local migrations directory» — міграцію застосовано не
  через `main` (`db push` з ноутбука чи з гілки). Якщо зміна потрібна — PR із цим файлом у `main`; якщо ні —
  `supabase migration repair --status reverted <версія> --db-url "<рядок pooler>"` зі свого ноутбука (сам, не агентом:
  `.claude/settings.json` це забороняє) і відкат змін схеми новою міграцією (точний порядок звіряйте з документацією Supabase CLI).
- Проєкт Free призупинено після тижня без активності — Dashboard → **Restore project** (точну назву кнопки перевірте в інтерфейсі).

## Оновлення шаблону

Виправлення шаблону викладач оголошує в чаті курсу з SHA звичайного (не merge) коміту: `git cherry-pick` merge-коміту
без `-m 1` не працює. Не `git merge` шаблону: «Use this template» починає нову історію, і merge дає конфлікт у кожному
файлі, що відрізняється. Натомість (один раз)
`git remote add template https://github.com/koldovsky/2026-quitcode-06-project-template.git` → `git fetch template` →
`git switch -c template/<коротко> origin/main` → `git cherry-pick <sha>` →
`npm ci && npm run lint && npm run typecheck && npm test && npm run spec:check` →
`git push -u origin template/<коротко>` → PR «Оновлення шаблону» → зелений CI → merge.
Кожен розробник переносить виправлення у своє репо сам.

## Перевірки

| Команда | Що перевіряє |
|---|---|
| `npm run lint` / `typecheck` / `test` / `build` | ESLint без попереджень, типи (`next typegen` + `tsc`), Vitest, збірка з `ƒ Proxy (Middleware)` |
| `npm run spec:validate` | `openspec validate --all --strict` — структура специфікацій |
| `npm run spec:check` | AC ID на початку кожного `#### Scenario:` (схожий на ID, але з кириличною літерою чи трьома цифрами — з підказкою); унікальність у `openspec/specs` і після archive кожної активної зміни; denylist (за початком слова, тож ловить відмінки; фраза — і через перенесення рядка) у `product/`, `openspec/`, `docs/`, `src/`, `supabase/`, `tests/`, `README.md`, `AGENTS.md`; немає «бродячого» `product/denylist.local*` під іншим іменем; у кожній зміні без `skip_specs` — `proposal.md` з усіма сімома розділами в порядку правил PM |
| `npm run ac:coverage` | кожен AC має рядок у `docs/conformance.md`; статус дослівно «реалізовано» або «відкладено (причина)»; «реалізовано» має непропущений тест у `*.test.ts(x)` у `src/` чи `tests/` (їх запускає `npm test`), назва якого починається з ID; шляхи з колонок «Код»/«Тест» існують; тести не посилаються на неіснуючі AC. E2e-тести (`tests/e2e/*.spec.ts`) не рахуються, доки їх не запускає крок CI |
| `node scripts/check-migration-order.mjs` | міграції, яких немає в `origin/main` (перевизначення — `MIGRATION_BASE` або `--base <ref>`), новіші за найновішу там (`OLDER`); назви `<14 цифр>_<назва>.sql` (`NAME`); без однакових міток (`DUPLICATE`); застосовані файли не змінено (`CHANGED`) і не видалено (`DELETED`); той самий SQL старшого за найновіший файлу під новішою міткою — попередження `RENAMED` (відновлення, див. «Збої й відновлення») |
| CI `db-check` | `supabase db start` — усі міграції й сид на одноразовій базі в раннері (що саме застосовує `db start`, звіряємо на першому прогоні); у PR — `check-migration-order.mjs`; готовий `database.types.ts` у Summary прогону |

## Як цей шаблон зібрано з нуля

Повторюваний рецепт (Git Bash / macOS / Linux; Node 24, npm 11). Для нового клієнта зазвичай достатньо
«Use this template»; рецепт — щоб оновити шаблон на нові версії або зібрати його заново.

```bash
# 1. Скелет Next.js (версію зафіксовано; --turbopack не потрібен, --import-alias — за замовчуванням)
npx --yes create-next-app@16.4.0 my-project --ts --app --eslint --tailwind --src-dir --use-npm \
  --no-agent-feedback --no-cache-components
cd my-project
git branch -M main

# 2. Залежності (спершу @types/node 24 — інакше Vitest 5 дає ERESOLVE)
npm i -E @supabase/supabase-js@2.117.3 @supabase/ssr@0.12.7
npm i -D @types/node@^24
npm i -D -E supabase@2.120.0 @fission-ai/openspec@1.14.1 vitest@5.0.3
npm pkg set engines.node=24.x scripts.lint="eslint --max-warnings 0" \
  scripts.typecheck="next typegen && tsc --noEmit" scripts.test="vitest run" \
  scripts.spec:validate="openspec validate --all --strict" scripts.spec:check="node scripts/check-spec.mjs" \
  scripts.ac:coverage="node scripts/check-ac-coverage.mjs" \
  scripts.db:types="supabase gen types typescript --linked > src/lib/supabase/database.types.ts" \
  scripts.users:demo="node --env-file=.env.local scripts/create-demo-users.mjs"
printf '\n!.env.example\n/product/denylist.local*\n' >> .gitignore
# !.env.example — .env.example комітимо (правило після `.env*` скасовує його для цього файлу);
# /product/denylist.local* — справжні назви клієнтів для spec:check лише локально (зірочка ловить і denylist.local.txt.txt, якщо Провідник приховав розширення)
printf '* text=auto eol=lf\n*.ico binary\n*.png binary\n' > .gitattributes

# 3. Supabase: конфіг і міграція
npx supabase init
# supabase/config.toml: [api] auto_expose_new_tables = false; [auth] site_url = "http://localhost:3000",
#   additional_redirect_urls = ["http://localhost:3000/**"], enable_signup = false (користувачі — лише
#   npm run users:demo через Admin API); [auth.email] enable_confirmations = false
# supabase/migrations/20261012000000_profiles_and_roles.sql, supabase/seed.sql, supabase/demo-users.json

# 4. OpenSpec: глобальний CLI тієї ж версії (його викликають /opsx:* і скіли), профіль custom з verify
#    (глобальний конфіг цієї машини), потім init
npm i -g @fission-ai/openspec@1.14.1 && openspec --version   # 1.14.1
export OPENSPEC_TELEMETRY=0
npx openspec config set profile custom
npx openspec config set workflows '["propose","explore","apply","verify","update","sync","archive"]'
npx openspec init --tools claude,cursor --language Ukrainian --profile custom
npx openspec update
# openspec/config.yaml: context + rules (кожен пункт у лапках); порожні openspec/specs і openspec/changes з .gitkeep

# 5. Перенести з цього шаблону файли, написані вручну:
#   src/proxy.ts, src/lib/supabase/*, src/app/{layout.tsx,page.tsx,login/*}, scripts/**, tests/**, vitest.config.mts,
#   .claude/{settings.json,commands/spec-sync.md,commands/conformance.md,skills/spec-clarify},
#   .cursor/commands/{spec-sync.md,conformance.md}, .cursorignore, .mcp.json,
#   .github/**, .coderabbit.yaml, AGENTS.md (наші розділи після блоку Next.js), CLAUDE.md,
#   product/README.md, docs/**, .env.example
rm -r public   # демо-SVG скелета шаблон не використовує
# tsconfig.json: "exclude" + "tests/fixtures"; eslint.config.mjs: globalIgnores + "tests/fixtures/**"

# 6. Перевірити
npm run lint && npm run typecheck && npm test && npm run build
npm run spec:validate && npm run spec:check && npm run ac:coverage
```

У Windows PowerShell 5.1 лапки всередині JSON треба екранувати:
`npx openspec config set workflows '[\"propose\",\"explore\",\"apply\",\"verify\",\"update\",\"sync\",\"archive\"]'`
(або інтерактивно: `npx openspec config profile`). Змінна середовища: `$env:OPENSPEC_TELEMETRY = "0"`.

Чому саме так — коротко:

- `--no-cache-components`: з Cache Components за замовчуванням (16.4) офіційний патерн Supabase для захищеної
  сторінки не збирається; `proxy.ts` з `--src-dir` має лежати в `src/`, інакше його мовчки ігнорують.
- `setAll(cookies, headers)` у `src/lib/supabase/proxy.ts` копіює заголовки кешування у відповідь (`@supabase/ssr` ≥ 0.10).
- `auto_expose_new_tables = false`: як у хмарі — нові проєкти без автогрантів приблизно з 30.05.2026, усі — з 30.10.2026.
- Профіль OpenSpec зберігається на машині, а не в репозиторії, тому згенеровані `.claude/` і `.cursor/` закомічені.
- Вимоги — командою агента, а не скриптом: `/spec-sync` — це кілька команд `git` і оновлення матриці, які агент і так
  робить добре; людина бачить звіт і вирішує, чи пушити.

## Журнал виправлень шаблону

Виправлення після дня 0. Викладач оголошує кожне в чаті курсу з SHA; кожен розробник переносить його у своє репо
PR-ом «Оновлення шаблону» (розділ «Оновлення шаблону» вище).

| Дата | SHA | Що виправлено |
|---|---|---|
| — | — | поки немає |

## Ліцензія

MIT — див. [LICENSE](LICENSE): шаблон можна вільно брати для власних і клієнтських проєктів. Протокол уточнень у
`.claude/skills/spec-clarify` адаптовано з [GitHub Spec Kit](https://github.com/github/spec-kit) (MIT, Copyright GitHub, Inc.).
