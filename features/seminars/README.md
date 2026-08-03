# Seminar Feature Domain

`features/seminars/` owns seminar-specific data, rendering, layouts, local
assets, styles, and tests. Pages remain URL and DOM entrypoints; they do not
own seminar rules or content.

## Public boundary

The public module is `features/seminars/index.js`. It exports only
`initializeSeminarsPage` and `initializePresentationPage`. The seminar list,
horizontal presentation, and vertical reading entrypoints may use this facade
only; they never import feature internals.

## Internal roles

- `data/` contains topic sources, registry accessors, and the validator.
- `formats/` contains human-facing authoring rules.
- `components/` and `layouts/` contain feature-local UI and projections.
- `assets/topics/` holds topic-owned local images under each topic ID.
- `assets/pdf/README.md` reserves the manual PDF handoff contract; it does not
  imply that a PDF file or download link exists.
- `styles/` owns both screen and manual browser-print presentation.
- `tests/` verifies the feature contract and behavior.

Feature modules may use `utils/html.js` and global CSS tokens. Global modules
must not import seminar internals. Promote a feature module to a global module
only after a real second consumer demonstrates that shared ownership is needed.
Legacy top-level seminar data, presentation components, PDF services, and
seminar styles are intentionally absent.

## PDF publication boundary

The runtime exposes only the two HTML views. It does not load a PDF library,
generate a PDF, open a print fallback, or display a download control. Feature
print CSS remains available when the user manually prints a visible reading or
presentation page.

After the user supplies and visually reviews the four files reserved in
`assets/pdf/README.md`, a later change may add ordinary `<a download>` links.
That change must first verify each file exists, starts with a PDF signature,
and downloads successfully in the browser. A missing file must never have a
published link.

## Validation lifecycle

Registry accessors validate a topic when a consumer requests it, not while an
ES module is evaluated. `validateSeminar(topic)` returns the original topic or
throws one field-aware `TypeError` after collecting all contract errors. Page
orchestrators catch that failure and render a generic user-facing error state.

Run all repository and feature tests with:

```bash
npm.cmd test
```
