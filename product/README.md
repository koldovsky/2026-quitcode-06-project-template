# Продуктовий контекст PM (копія)

Цю теку разом з `openspec/specs/` приносить команда агента `/spec-sync` з `main` репо вимог PM
(`https://github.com/<pm>/<team-slug>-spec`). Після першої синхронізації тут будуть файли PM — `vision.md`,
`glossary.md`, `roles.md` (матриця прав), `roadmap.md`, `decisions.md`, `CHANGELOG.md`, `denylist.txt`, — а цей файл зникне.

- Руками тут нічого не змінюйте: кожен `/spec-sync` замінює теку цілком версією PM (README, «Як вимоги потрапляють у репо»).
- Питання й пропозиції до вимог — issues у репо PM через вебформу «Питання до специфікації»
  (`https://github.com/<pm>/<team-slug>-spec/issues/new/choose`), не правки тут.
- Звідки й з якого коміту вимоги — рядок «Вимоги: …» у шапці `docs/conformance.md`.
- Справжні назви клієнта — лише в локальному `product/denylist.local.txt` (у `.gitignore`; список PM надсилає особистим
  повідомленням): git його не відстежує, тож `/spec-sync` його не чіпає, а `npm run spec:check` читає й значень не друкує.
