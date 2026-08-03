# Seminar PDF service

`render-zone.js` creates an off-screen, A4-oriented DOM target for the selected
seminar layout and waits for browser layout stability. `exporter.js` runs
html2pdf when available, otherwise awaits the print fallback. Every path removes
the temporary render zone in `finally`, including failed exports and pending
fallback completion.
