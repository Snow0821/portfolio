function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderTags(tags = []) {
  return tags
    .map((tag) => `<span class="tag-badge">${escapeHtml(tag)}</span>`)
    .join("");
}

function renderSeminarCard(item, paths) {
  const title = escapeHtml(item.title);
  const subtitle = item.subtitle ? ` (${escapeHtml(item.subtitle)})` : "";
  const topicId = escapeHtml(item.id);

  return `
    <article class="seminar-card">
      <div class="seminar-card-header">
        <h2 class="seminar-title">${title}${subtitle}</h2>
        <div class="seminar-tags">${renderTags(item.tags)}</div>
      </div>
      <p class="seminar-description">${escapeHtml(item.summary)}</p>
      <div class="seminar-actions">
        <div class="action-pair">
          <a href="${escapeHtml(paths.vertical(item.id))}" target="_blank" rel="noopener noreferrer" class="btn-slide primary">
            읽기용 문서 (세로) ↗
          </a>
          <button type="button" class="btn-icon-download" data-topic-id="${topicId}" data-mode="vertical" aria-label="${title} 읽기용 문서 PDF 다운로드">
            <span class="icon" aria-hidden="true">📥</span>
          </button>
        </div>
        <div class="action-pair">
          <a href="${escapeHtml(paths.horizontal(item.id))}" target="_blank" rel="noopener noreferrer" class="btn-slide">
            발표용 슬라이드 (가로) ↗
          </a>
          <button type="button" class="btn-icon-download" data-topic-id="${topicId}" data-mode="horizontal" aria-label="${title} 발표용 슬라이드 PDF 다운로드">
            <span class="icon" aria-hidden="true">📥</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

export function renderSeminarList(
  container,
  { seminars, paths, onDownload = () => {} },
) {
  if (!container) return;

  container.innerHTML = seminars
    .map((item) => renderSeminarCard(item, paths))
    .join("");

  for (const button of container.querySelectorAll(".btn-icon-download")) {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const icon = button.querySelector(".icon");
      const originalIcon = icon?.textContent ?? "📥";

      button.disabled = true;
      button.classList.add("loading");
      if (icon) icon.textContent = "⏳";

      try {
        await onDownload({
          topicId: button.dataset.topicId,
          mode: button.dataset.mode,
          button,
        });
      } finally {
        button.disabled = false;
        button.classList.remove("loading");
        if (icon) icon.textContent = originalIcon;
      }
    });
  }
}
