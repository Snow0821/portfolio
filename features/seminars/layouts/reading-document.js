import { escapeAttribute, escapeHtml } from "../../../utils/html.js";
import { renderContentBlock } from "../components/content-block.js";

export function renderReadingDocument(container, topicData) {
  if (!container || !topicData) return;
  const prerequisites = topicData.prerequisites.length
    ? topicData.prerequisites.map(escapeHtml).join(", ") : "None";
  const tags = topicData.tags.map(escapeHtml).join(", ");
  const sections = topicData.sections.map((section) => `
    <section class="reading-section reading-doc-section" data-section-role="${escapeAttribute(section.role)}">
      <h2>${escapeHtml(section.title)}</h2>
      <div class="reading-blocks">${section.blocks.map((block) => renderContentBlock(block, {
        className: block.type === "code" ? "slide-code-block reading-doc-code"
          : block.type === "summary" ? "callout-box" : "",
      })).join("")}</div>
    </section>`).join("");
  container.innerHTML = `
    <article class="reading-document reading-doc-container">
      <header class="reading-document__header reading-doc-header">
        <p class="reading-doc-category">${escapeHtml(topicData.format)}</p><h1 class="reading-doc-title">${escapeHtml(topicData.title)}</h1>
        <p class="reading-doc-lead">${escapeHtml(topicData.subtitle)}</p>
        <div class="reading-doc-meta"><span>${tags}</span><span>${escapeHtml(topicData.author)} · ${escapeHtml(topicData.updated)}</span></div>
        <p>${escapeHtml(topicData.summary)}</p>
      </header>
      <section class="reading-document__metadata reading-doc-section">
        <h2>Audience</h2><p>${escapeHtml(topicData.audience)}</p>
        <h2>Prerequisites</h2><p>${prerequisites}</p>
        <h2>Outcomes</h2><ul>${topicData.outcomes.map((outcome) => `<li>${escapeHtml(outcome)}</li>`).join("")}</ul>
      </section>${sections}
    </article>`;
}
