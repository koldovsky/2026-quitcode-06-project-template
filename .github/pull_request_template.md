## Тип PR

<!-- Залиште один варіант. Межі змін перевіряє CodeRabbit (перевірка «Тип PR і межі змін»). -->
- [ ] **Оновлення вимог** — гілка `sync/<дата>` від команди агента `/spec-sync`: лише `product/` і `openspec/specs/` (копія `main`
  репо вимог PM) та `docs/conformance.md` (шапка «Вимоги: …», рядки нових AC «відкладено (нова вимога — чекає реалізації)»,
  без рядків прибраних AC). Виняток — окремий коміт, що прибирає з ваших файлів ID прибраних PM AC (назви тестів, інакше
  ORPHAN) або слово з нового `product/denylist.txt` PM (інакше DENYLIST).
- [ ] **Реалізація** — гілка `task/<коротко>` (у день 0 — `setup/bootstrap`): `src/`, `supabase/migrations/`, тести,
  `docs/conformance.md`, `docs/decisions/`, `docs/spec-reading.md`, `docs/bootstrap.md`, `docs/img/`,
  `supabase/demo-users.json`, власна зміна `openspec/changes/impl-<зріз>/`. Без `product/` і `openspec/specs/`.
- [ ] **Оновлення шаблону** — гілка `template/<коротко>`: `git cherry-pick` коміту шаблону курсу (README, «Оновлення шаблону»).

## Вимоги

<!-- Рядок «Вимоги: …» із шапки docs/conformance.md (для «Оновлення вимог» — новий, після /spec-sync). -->
Вимоги:

## AC, які покриває PR

<!-- Перелік AC ID і що з ними сталося; для «Оновлення вимог» — нові / змінені / прибрані AC зі звіту /spec-sync.
Питання й рішення PM — посиланням на issue в репо PM: <pm>/<team-slug>-spec#N
(не «Closes #N»: issue живе в іншому репо, і закриває його PM). -->
- AC-…: реалізовано / відкладено (причина)

## Що змінилось

<!-- 2–5 пунктів. Для міграцій — які таблиці й політики. -->

## Чекліст

- [ ] Одна зміна — один намір; гілка від свіжого `main`
- [ ] `product/` і `openspec/specs/` змінено лише в «Оновленні вимог» і лише командою `/spec-sync` (не руками)
- [ ] Тести з AC ID на початку назви (`it("AC-…: …")`), без `.skip` для «реалізовано»; `npm test` зелений
- [ ] Рядок `docs/conformance.md` для кожного AC оновлено в цьому ж PR; `npm run ac:coverage` зелений
- [ ] Міграція — лише новим файлом з `npx supabase migration new` у цьому PR; у вашу базу її застосує CI (`db-deploy`) після merge.
  Жодного `supabase db push` з ноутбука, жодного DDL у SQL Editor; `db-check` зелений
- [ ] Кожна нова таблиця: `enable row level security`, `revoke all … from anon, authenticated`, явні `grant`, політика на кожну операцію `to authenticated` з `(select auth.uid())`
- [ ] Для «Оновлення вимог»: `npm run spec:validate`, `npm run spec:check` і `npm run ac:coverage` зелені; змінені AC перелічено вище для перевірки
- [ ] Жодних секретів і справжніх даних: ключі лише в `.env.local` / Vercel / GitHub Environments, дані — синтетичні (`*@example.test`)
- [ ] CI зелений (`spec`, `app`, `conformance`, `db-check`); на кожен коментар CodeRabbit — виправлення або відповідь, чому ні
- [ ] Preview на Vercel відкривається (для «Реалізації»); для останнього PR зрізу — запис екрана з прод-URL

<!-- Публічні репозиторії з < 10 зірок CodeRabbit не рецензує автоматично.
Рев'ю запускає КОМЕНТАР у PR (не цей опис): після створення PR напишіть окремим коментарем рядок нижче. -->
Нагадування: окремим коментарем у PR — `@coderabbitai review`
