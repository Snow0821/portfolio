import { escapeAttribute, escapeHtml } from "../../../utils/html.js";

function renderTags(tags = []) {
  return tags
    .map((tag) => `<span class="tag-badge">${escapeHtml(tag)}</span>`)
    .join("");
}

function renderSeminarCard(item, paths) {
  const title = escapeHtml(item.title);
  const subtitle = item.subtitle ? ` (${escapeHtml(item.subtitle)})` : "";

  return `
    <article class="seminar-card">
      <div class="seminar-card-header">
        <h2 class="seminar-title">${title}${subtitle}</h2>
        <div class="seminar-tags">${renderTags(item.tags)}</div>
      </div>
      <p class="seminar-description">${escapeHtml(item.summary)}</p>
      <div class="seminar-actions">
        <div class="action-pair">
          <a href="${escapeAttribute(paths.vertical(item.id))}" target="_blank" rel="noopener noreferrer" class="btn-slide primary">
            읽기용 문서 (세로) ↗
          </a>
        </div>
        <div class="action-pair">
          <a href="${escapeAttribute(paths.horizontal(item.id))}" target="_blank" rel="noopener noreferrer" class="btn-slide">
            발표용 슬라이드 (가로) ↗
          </a>
        </div>
      </div>
    </article>
  `;
}

export function renderSeminarList(container, { seminars, paths }) {
  if (!container) return;

  container.innerHTML = seminars
    .map((item) => renderSeminarCard(item, paths))
    .join("");
}
