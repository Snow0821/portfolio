/* Level 4 Presentation Template Renderer (Data -> Vertical Reading Document HTML Template) */

export function renderReadingDocument(container, topicData) {
  if (!container || !topicData || !topicData.doc) return;

  const doc = topicData.doc;

  const sectionsHTML = (doc.sections || []).map((sec) => `
    <section class="reading-doc-section">
      <h2>${sec.title}</h2>
      ${sec.content ? `<p>${sec.content}</p>` : ""}
      ${sec.callout ? `
        <div class="callout-box">
          <p><strong>${sec.callout}</strong></p>
        </div>
      ` : ""}
      ${sec.extraContent ? `<p>${sec.extraContent}</p>` : ""}
      ${sec.bullets ? `
        <ul>
          ${sec.bullets.map(b => `<li>${b}</li>`).join("")}
        </ul>
      ` : ""}
      ${sec.code ? `
        <div class="slide-code-block" style="margin-top: 1.2rem;">
          <pre style="margin:0;"><code>${escapeHTML(sec.code)}</code></pre>
        </div>
      ` : ""}
      ${sec.subsections ? sec.subsections.map(sub => `
        <h3>${sub.heading}</h3>
        <p>${sub.text}</p>
      `).join("") : ""}
    </section>
  `).join("");

  container.innerHTML = `
    <article class="reading-doc-container">
      <header class="reading-doc-header">
        <span class="reading-doc-category">${doc.category || "READING HANDOUT"}</span>
        <h1 class="reading-doc-title">${doc.title}</h1>
        <p class="reading-doc-lead">${doc.lead || ""}</p>
        <div class="reading-doc-meta">
          ${(doc.meta || []).map(m => `<span>${m}</span>`).join("")}
        </div>
      </header>

      ${sectionsHTML}
    </article>
  `;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
