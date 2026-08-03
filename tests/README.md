# Tests

The package command runs both repository-wide tests and feature-local seminar
tests:

```bash
npm.cmd test
```

Root tests own global architecture, home-page behavior, API policy, generic
local-reference checks, and module policy. Module policy scans feature modules
and resolves their imports; only seminar topic content is excluded from line
limits. Seminar contract, data, layouts, UI, pages, PDF lifecycle, and the
public-boundary/legacy-ownership checks belong in `features/seminars/tests/`.

## Root test files

- `foundation.test.mjs`: development environment, Vercel, and the health API.
- `home.test.mjs`: home foundation and site-header behavior.
- `module-policy.test.mjs`: file length and local ES-module imports, including
  feature modules.
- `structure.test.mjs`: canonical documents, generic legacy paths, and local
  HTML/CSS reference resolution.

Shared fake DOM and file-search helpers are under `tests/helpers/`; helpers do
not run as standalone tests.

## Commands

Use Node.js 24. On Windows, run:

```bash
npm.cmd test
node --test tests/<domain>.test.mjs
node --test features/seminars/tests/<domain>.test.mjs
```

Executable JavaScript, CSS, and test files should stay at or under 200 lines.
Files from 201 through 300 lines require the documented exception enforced by
`module-policy.test.mjs`; files over 300 lines are not allowed.
