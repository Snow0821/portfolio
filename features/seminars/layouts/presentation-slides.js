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
    <section class="slide-card slide-cover" ${boundary}><div class="slide-content-inner">
      <p class="slide-subtitle">${escapeHtml(topic.tags.join(" · "))}</p>
      <h1>${escapeHtml(topic.title)}<br><span class="slide-cover-subtitle">${escapeHtml(topic.subtitle)}</span></h1>
      <p class="slide-desc">${escapeHtml(topic.summary)}</p>
      <div class="slide-meta"><p>${escapeHtml(topic.author)} · ${escapeHtml(topic.updated)}</p></div>
    </div></section>`;
  if (slide.type === "agenda") return `
    <section class="slide-card" ${boundary}><div class="slide-content-inner">
      <div class="slide-card-header"><span class="slide-category">AGENDA</span><h2>Agenda</h2></div>
      <div class="slide-card-body"><ol>${topic.sections.map((section) => `<li>${escapeHtml(section.title)}</li>`).join("")}</ol></div>
    </div></section>`;
  if (slide.type === "content") {
    const renderedBlocks = slide.blockIds.map((id) => {
      const block = blocks.get(id);
      return renderContentBlock(block, {
        view: "presentation",
        className: block.type === "code" ? "slide-code-block" : "",
      });
    }).join("");
    return `
      <section class="slide-card" ${boundary} data-section-role="${escapeAttribute(slide.sectionRole)}">
        <div class="slide-content-inner">
          <div class="slide-card-header"><span class="slide-category">${escapeHtml(slide.category)}</span><h2>${escapeHtml(slide.title)}</h2></div>
          <div class="slide-card-body"><div class="slide-blocks slide-blocks--${escapeAttribute(slide.layout)}">${renderedBlocks}</div></div>
        </div>
      </section>`;
  }
  return `
    <section class="slide-card slide-cover slide-outro" ${boundary}><div class="slide-content-inner">
      <p class="slide-subtitle">THANK YOU</p><h1>${escapeHtml(slide.title)}</h1>
      <p class="slide-desc">${escapeHtml(slide.description)}</p>
      <div class="slide-meta"><p><a href="${escapeAttribute(seminarsHref)}" class="slide-return-link">Back to seminars</a></p></div>
    </div></section>`;
}
