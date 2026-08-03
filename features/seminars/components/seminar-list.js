import { escapeAttribute, escapeHtml } from "../../../utils/html.js";

function renderTags(tags = []) {
  return tags
    .map((tag) => `<span class="tag-badge">${escapeHtml(tag)}</span>`)
    .join("");
}

function renderSeminarCard(item, paths) {
  const title = escapeHtml(item.title);
  const subtitle = item.subtitle ? ` (${escapeHtml(item.subtitle)})` : "";
  const topicId = escapeAttribute(item.id);
  const accessibleTitle = escapeAttribute(item.title);

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
          <a href="${escapeAttribute(paths.verticalPrint(item.id))}" target="_blank" rel="noopener noreferrer" role="button" class="btn-icon-download" data-topic-id="${topicId}" data-mode="vertical" aria-label="${accessibleTitle} 읽기용 문서 PDF 다운로드">
            <span class="icon" aria-hidden="true">📥</span>
          </a>
        </div>
        <div class="action-pair">
          <a href="${escapeAttribute(paths.horizontal(item.id))}" target="_blank" rel="noopener noreferrer" class="btn-slide">
            발표용 슬라이드 (가로) ↗
          </a>
          <a href="${escapeAttribute(paths.horizontalPrint(item.id))}" target="_blank" rel="noopener noreferrer" role="button" class="btn-icon-download" data-topic-id="${topicId}" data-mode="horizontal" aria-label="${accessibleTitle} 발표용 슬라이드 PDF 다운로드">
            <span class="icon" aria-hidden="true">📥</span>
          </a>
        </div>
      </div>
    </article>
  `;
}

export function renderSeminarList(
  container,
  {
    seminars, paths, canDownloadDirectly = () => false,
    navigateFallback = () => {}, onDownload = () => {},
  },
) {
  if (!container) return;

  container.innerHTML = seminars
    .map((item) => renderSeminarCard(item, paths))
    .join("");

  for (const button of container.querySelectorAll(".btn-icon-download")) {
    let isExporting = false;
    button.addEventListener("click", async (event) => {
      if (!canDownloadDirectly()) return;
      event.preventDefault();
      if (isExporting) return;
      isExporting = true;
      const icon = button.querySelector(".icon");
      const originalIcon = icon?.textContent ?? "📥";

      button.setAttribute("aria-disabled", "true");
      button.classList.add("loading");
      if (icon) icon.textContent = "⏳";

      try {
        await onDownload({
          topicId: button.dataset.topicId,
          mode: button.dataset.mode,
          button,
        });
      } finally {
        isExporting = false;
        button.removeAttribute("aria-disabled");
        button.classList.remove("loading");
        if (icon) icon.textContent = originalIcon;
      }
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== " ") return;
      event.preventDefault();
      if (canDownloadDirectly()) {
        button.click();
        return;
      }
      navigateFallback(button.getAttribute("href"));
    });
  }
}
