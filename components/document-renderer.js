import { escapeHtml } from "../utils/html.js";

export function renderReadingDocument(container, topicData) {
  if (!container || !topicData?.doc) return;

  const doc = topicData.doc;
  const sections = (doc.sections ?? [])
    .map(
      (section) => `
        <section class="reading-doc-section">
          <h2>${section.title}</h2>
          ${section.content ? `<p>${section.content}</p>` : ""}
          ${
            section.callout
              ? `<div class="callout-box"><p><strong>${section.callout}</strong></p></div>`
              : ""
          }
          ${section.extraContent ? `<p>${section.extraContent}</p>` : ""}
          ${
            section.bullets
              ? `<ul>${section.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>`
              : ""
          }
          ${
            section.code
              ? `<div class="slide-code-block reading-doc-code"><pre><code>${escapeHtml(section.code)}</code></pre></div>`
              : ""
          }
          ${
            section.subsections
              ? section.subsections
                  .map(
                    (subsection) =>
                      `<h3>${subsection.heading}</h3><p>${subsection.text}</p>`,
                  )
                  .join("")
              : ""
          }
        </section>
      `,
    )
    .join("");

  container.innerHTML = `
    <article class="reading-doc-container">
      <header class="reading-doc-header">
        <span class="reading-doc-category">${doc.category ?? "READING HANDOUT"}</span>
        <h1 class="reading-doc-title">${doc.title}</h1>
        <p class="reading-doc-lead">${doc.lead ?? ""}</p>
        <div class="reading-doc-meta">
          ${(doc.meta ?? []).map((item) => `<span>${item}</span>`).join("")}
        </div>
      </header>
      ${sections}
    </article>
  `;
}
