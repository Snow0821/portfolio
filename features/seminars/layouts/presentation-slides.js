import { escapeAttribute, escapeHtml } from "../../../utils/html.js";
import { renderContentBlock } from "../components/content-block.js";

export function renderPresentationSlides(container, topicData, { seminarsHref = "#" } = {}) {
  if (!container || !topicData) return;
  const blocks = new Map(topicData.sections.flatMap((section) => section.blocks.map((block) => [block.id, block])));
  container.innerHTML = topicData.presentation.slides
    .map((slide) => renderSlide(slide, topicData, blocks, seminarsHref)).join("");
}

function renderSlide(slide, topic, blocks, seminarsHref) {
  const boundary = `data-layout-boundary data-layout-id="${escapeAttribute(slide.id)}"`;
  if (slide.type === "cover") return `
    <section class="slide-card slide-cover" ${boundary}>
      <p>${escapeHtml(topic.tags.join(" · "))}</p><h1>${escapeHtml(topic.title)}</h1>
      <p>${escapeHtml(topic.subtitle)}</p>
      <p>${escapeHtml(topic.summary)}</p><p>${escapeHtml(topic.author)} · ${escapeHtml(topic.updated)}</p>
    </section>`;
  if (slide.type === "agenda") return `
    <section class="slide-card" ${boundary}><h2>Agenda</h2>
      <ol>${topic.sections.map((section) => `<li>${escapeHtml(section.title)}</li>`).join("")}</ol>
    </section>`;
  if (slide.type === "content") {
    const renderedBlocks = slide.blockIds.map((id) => renderContentBlock(blocks.get(id), { view: "presentation" })).join("");
    return `
      <section class="slide-card" ${boundary} data-section-role="${escapeAttribute(slide.sectionRole)}">
        <p>${escapeHtml(slide.category)}</p><h2>${escapeHtml(slide.title)}</h2>
        <div class="slide-blocks slide-blocks--${escapeAttribute(slide.layout)}">${renderedBlocks}</div>
      </section>`;
  }
  return `
    <section class="slide-card slide-outro" ${boundary}><h2>${escapeHtml(slide.title)}</h2>
      <p>${escapeHtml(slide.description)}</p><p><a href="${escapeAttribute(seminarsHref)}">Back to seminars</a></p>
    </section>`;
}
