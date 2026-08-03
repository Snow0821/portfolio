import { escapeAttribute, escapeHtml } from "../../../utils/html.js";
import { renderContentBlock } from "../components/content-block.js";

export function renderReadingDocument(container, topicData) {
  if (!container || !topicData) return;
  const prerequisites = topicData.prerequisites.length
    ? topicData.prerequisites.map(escapeHtml).join(", ") : "None";
  const sections = topicData.sections.map((section) => `
    <section class="reading-section" data-section-role="${escapeAttribute(section.role)}">
      <h2>${escapeHtml(section.title)}</h2>
      <div class="reading-blocks">${section.blocks.map((block) => renderContentBlock(block)).join("")}</div>
    </section>`).join("");
  container.innerHTML = `
    <article class="reading-document">
      <header class="reading-document__header">
        <p>${escapeHtml(topicData.format)}</p><h1>${escapeHtml(topicData.title)}</h1>
        <p>${escapeHtml(topicData.summary)}</p><p>${escapeHtml(topicData.author)} · ${escapeHtml(topicData.updated)}</p>
      </header>
      <section class="reading-document__metadata">
        <h2>Audience</h2><p>${escapeHtml(topicData.audience)}</p>
        <h2>Prerequisites</h2><p>${prerequisites}</p>
        <h2>Outcomes</h2><ul>${topicData.outcomes.map((outcome) => `<li>${escapeHtml(outcome)}</li>`).join("")}</ul>
      </section>${sections}
    </article>`;
}
