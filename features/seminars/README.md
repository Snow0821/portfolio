# Seminar Feature Domain

`features/seminars/` owns seminar-specific data, rendering, layouts, assets,
PDF support, and tests. Pages remain URL and DOM entrypoints; they do not own
seminar rules or content.

## Public boundary

The public module is `features/seminars/index.js`. It exports only
`initializeSeminarsPage` and `initializePresentationPage`. The two existing
seminar and presentation URL contracts remain unchanged; their page
entrypoints may use this facade only, across static, bare side-effect, and
dynamic import forms; they never import feature internals.

## Internal roles

- `data/` contains topic sources, registry accessors, and the validator.
- `formats/` contains human-facing authoring rules.
- `components/`, `layouts/`, and `services/` contain feature-local UI,
  projections, and PDF support.
- `assets/` holds topic-owned local images under each topic ID.
- `tests/` verifies the feature contract and feature behavior.

Feature modules may use `utils/html.js` and global CSS tokens. Global modules
must not import seminar internals. Promote a feature module to a global module
only after a real second consumer demonstrates that shared ownership is needed.
Legacy top-level seminar data, presentation components, PDF services, and
seminar styles are intentionally absent; add future seminar behavior under
this feature rather than restoring a top-level owner.

Seminar-list PDF controls are native `print=true` anchors with distinct
accessible button names. They retain browser navigation when `html2pdf` is
unavailable; the list intercepts the click for loading state and direct export
only when its synchronous availability predicate succeeds. Direct export uses
a per-control in-flight guard and `aria-disabled`. Mouse and Enter retain the
anchor's native new-tab fallback; Space uses the page's injected same-tab
location navigation when the CDN is absent and remains intercepted for direct
export when it is present.

## Validation lifecycle

Registry accessors validate a topic when a consumer requests it, not while an
ES module is evaluated. `validateSeminar(topic)` returns the original topic or
throws one field-aware `TypeError` after collecting all contract errors. Page
orchestrators catch that failure and render a generic user-facing error state.

Run all repository and feature tests with:

```bash
npm.cmd test
```
