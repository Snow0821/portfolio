# Seminar Workflow Simplification Design

## Goal

Reduce LLM and process overhead while making seminar reading and presentation
tabs clean, navigation-free artifacts and adding a durable place to discuss
shared rules and topic intent before editing runtime data.

## Evidence and problem statement

The previous seminar migration ran from 2026-08-03 20:27 to 2026-08-04 00:39
and produced 29 commits. The final 60-test suite took about 0.2 seconds, so raw
test execution was not the delay. Most time came from small preservation
commits, repeated documentation and review passes, five PDF fallback fixes and
browser rechecks, two PDF direction changes, and worktree integration cleanup.

The current material tabs also include a fixed slide header with site links,
mode switching, a counter and buttons. The presentation outro adds another
site link. This conflicts with the purpose of opening a clean standalone
artifact in a new tab.

The feature has a final format contract and runtime topic data, but no explicit
workspace for discussing general seminar policy or the intended scope of each
topic.

## Working policy

Update `AGENTS.md` with these project rules:

- Work directly on `main` by default.
- Create a branch or worktree only when the user explicitly requests it.
- Use subagents, independent review, and temporary plans only for high-risk
  work or when the user requests them.
- After two failed attempts with the same approach, stop before a third attempt
  and report the root cause, evidence, and a simpler alternative.
- If 30 minutes pass without a user-visible result, report the delay and a
  reduced-scope option before continuing.
- When direction changes, remove obsolete compatibility code, tests, plans and
  documentation instead of preserving a path the user no longer wants.
- Run focused test groups while iterating. Run the complete automated verifier
  once before completion and browser-check a changed UI once after it settles.
- Consolidate canonical documentation and annual history in one final pass.
- Prefer one cohesive implementation commit and one necessary correction over
  a sequence of micro-commits.

The existing requirements for evidence, current documentation and final
verification remain. These rules reduce repeated process, not quality gates.

## Navigation-free material tabs

Keep both seminar-card anchors as native `target="_blank"` links with
`rel="noopener noreferrer"`.

Remove all visible navigation from the two material pages:

- remove `<slide-header>` from both HTML files;
- remove the slide-header component, its registration tests and its stylesheet;
- remove header configuration from the presentation initializer;
- remove the presentation outro's `Back to seminars` link;
- remove the visible counter and previous/next buttons with the header.

Keep document titles, the seminar content, horizontal scroll snap, touch and
trackpad scrolling, and Arrow/Space keyboard navigation. The presentation
controller already treats its counter and buttons as optional, so it continues
to own invisible keyboard and scroll state. Reading remains a continuous
document. An explicit unknown topic continues to render the generic error
state without adding site navigation.

Update layout CSS from header-offset dimensions to the full viewport:

- the wrapper begins at the top and uses at least `100vh`;
- the horizontal container and cards use the full viewport height;
- reading keeps normal document flow and no horizontal overflow.

## Automated test workflow

Keep valuable behavior coverage because the suite is fast. Delete or merge
only tests whose production owner disappears with the slide header.

Add compact package scripts grouped by change type:

- `test:foundation`: global foundation and home behavior;
- `test:seminars:content`: contract, data, projections and escaping;
- `test:seminars:ui`: seminar list, page initialization and presentation
  interaction;
- `test:structure`: global and seminar ownership, module and reference policy;
- `test`: all groups using Node's compact reporter;
- `verify`: the full test suite followed by `git diff --check`.

Do not add change-detection infrastructure or a Git-hook installer. During
implementation, call the nearest group after a related edit. At completion,
call only `npm run verify`; investigate detailed output only when it fails.
This keeps validation automated without creating another maintenance system.

Tests for the new screen contract must prove:

- both list links still open a new tab safely;
- neither material page emits a slide header or visible navigation control;
- the outro emits no return link;
- presentation keyboard navigation still changes slides without buttons;
- reading and presentation content contracts remain intact.

## Discussion workspace

Create this permanent feature-owned structure:

```text
features/seminars/discussions/
├── README.md
├── common.md
└── topics/
    ├── python-intro.md
    └── web-intro.md
```

`README.md` defines the flow: discuss intent, record a decision, reflect an
accepted common rule in `formats/`, reflect accepted topic content in
`data/topics/`, then verify both projections. Discussion files are never
runtime imports or the final content source.

`common.md` covers shared audience assumptions, explanatory depth, the relation
between reading and presentation, evidence and example standards, and open
cross-topic questions.

Each topic document records purpose, audience, core question, required content,
excluded content, example and evidence candidates, decisions and open
questions. Initial documents describe the current Python and Web intent; this
task does not silently rewrite the approved runtime topic content.

## Documentation

- `docs/architecture.md`: add discussion ownership and remove slide-header
  ownership.
- `docs/conventions.md`: add the discussion-to-contract/data workflow and the
  efficient test invocation rule.
- `docs/decisions.md`: record main-only development and clean material tabs.
- `docs/status.md`: replace the temporary design state with the implemented
  state and retain only genuine pending work.
- `docs/history/2026.md`: record the delay analysis, user corrections, RED/GREEN
  evidence, browser verification and final commands.
- Feature and test READMEs: document the new UI boundary and test groups.

Remove this temporary spec after its durable guidance is absorbed during the
implementation task.

## Non-goals

- No PDF generation or download links.
- No seminar factual-content rewrite.
- No new framework, bundler, Git hook, branch or worktree.
- No visible replacement navigation inside the material pages.
- No deletion of useful fast tests solely to reduce their count.

## Success criteria

- Both material links open clean new tabs containing only the requested
  artifact and its content-level markup.
- Presentation Arrow/Space and scroll navigation still work without visible
  controls.
- The discussion workspace clearly separates proposals from canonical format
  rules and runtime topic data.
- One compact `npm run verify` command proves tests and whitespace hygiene.
- Browser verification covers the list and both material modes at desktop and
  mobile once, with no repeated matrix after a passing final state.
- Work stays on `main`, current docs and history are updated once, the temporary
  spec is removed, and the final working tree is clean.
