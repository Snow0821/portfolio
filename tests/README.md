# Tests

Fast tests stay grouped by the kind of change so iteration can call the nearest
group without LLM-driven file selection. The final verifier always runs the
complete suite and whitespace check.

Root tests own global architecture, home-page behavior, API policy, generic
local-reference checks, and module policy. Module policy scans feature modules
and resolves their imports; only seminar topic content is excluded from line
limits. Seminar contract, data, layouts, UI, pages, and the
public-boundary/legacy-ownership checks belong in `features/seminars/tests/`.
Those boundary checks cover static, bare side-effect, and dynamic feature
imports, all of which may use only the public facade.

## Root test files

- `foundation.test.mjs`: development environment, Vercel, and the health API.
- `home.test.mjs`: home foundation and site-header behavior.
- `module-policy.test.mjs`: file length and local ES-module imports, including
  feature modules.
- `structure.test.mjs`: canonical documents, generic legacy paths, and local
  HTML/CSS reference resolution.

Shared fake DOM and file-search helpers are under `tests/helpers/`; helpers do
not run as standalone tests. Repository-wide collection skips `.git`,
`.worktrees`, and `node_modules` so an isolated worktree nested under the main
checkout is not mistaken for current project source.

## Commands

Use Node.js 24. Compact dot output is intentional on success; switch to a
focused raw `node --test` command only to investigate a failure.

| Change | Command |
| --- | --- |
| Environment, home or shared foundation | `npm run test:foundation` |
| Seminar contract, data, layout or escaping | `npm run test:seminars:content` |
| Seminar list, page or interaction | `npm run test:seminars:ui` |
| Ownership, imports, references or file limits | `npm run test:structure` |
| Completed task | `npm run verify` |

On Windows, `npm.cmd` may be used in place of `npm`. During an active task with
temporary `docs/superpowers` files, run the nearest feature-local structure
test; the root structure boundary is expected to pass after final cleanup.

Detailed investigation examples:

```bash
node --test tests/<domain>.test.mjs
node --test features/seminars/tests/<domain>.test.mjs
```

Executable JavaScript, CSS, and test files should stay at or under 200 lines.
Files from 201 through 300 lines require the documented exception enforced by
`module-policy.test.mjs`; files over 300 lines are not allowed.
