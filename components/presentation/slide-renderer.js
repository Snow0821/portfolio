import { escapeAttribute, escapeHtml } from "../../utils/html.js";

export function renderPresentationSlides(
  container,
  topicData,
  { seminarsHref = "#" } = {},
) {
  if (!container || !topicData?.slides) return;

  container.innerHTML = topicData.slides
    .map((slide) => renderSlide(slide, seminarsHref))
    .join("");
}

function renderSlide(slide, seminarsHref) {
  switch (slide.type) {
    case "cover":
      return `
        <section class="slide-card slide-cover">
          <div class="slide-content-inner">
            <p class="slide-subtitle">${slide.slideNumber ?? "SEMINAR SLIDE"}</p>
            <h1>${slide.title}<br><span class="slide-cover-subtitle">${slide.subtitle ?? ""}</span></h1>
            <p class="slide-desc">${slide.description ?? ""}</p>
            <div class="slide-meta"><p>${slide.authorInfo ?? ""}</p></div>
          </div>
        </section>
      `;

    case "agenda":
    case "summary":
      return `
        <section class="slide-card">
          <div class="slide-content-inner">
            ${renderCardHeader(slide, slide.type === "agenda" ? "AGENDA" : "SUMMARY")}
            <div class="slide-card-body">
              <ul>${(slide.items ?? []).map((item) => `<li>${item}</li>`).join("")}</ul>
            </div>
            ${renderCardFooter(slide)}
          </div>
        </section>
      `;

    case "split-code":
      return `
        <section class="slide-card">
          <div class="slide-content-inner">
            ${renderCardHeader(slide, "CODE")}
            <div class="slide-card-body">
              <div class="slide-split-grid">
                <div>
                  <h3>${slide.pointsTitle ?? "특징"}</h3>
                  <ul>${(slide.points ?? []).map((point) => `<li>${point}</li>`).join("")}</ul>
                </div>
                <div class="slide-code-block"><pre><code>${escapeHtml(slide.code ?? "")}</code></pre></div>
              </div>
            </div>
            ${renderCardFooter(slide)}
          </div>
        </section>
      `;

    case "outro":
      return `
        <section class="slide-card slide-cover">
          <div class="slide-content-inner">
            <p class="slide-subtitle">${slide.subtitle ?? "THANK YOU"}</p>
            <h1>${slide.title}</h1>
            <p class="slide-desc">${slide.description ?? ""}</p>
            <div class="slide-meta">
              <p><a href="${escapeAttribute(seminarsHref)}" class="slide-return-link">← 세미나 목록으로 돌아가기</a></p>
            </div>
          </div>
        </section>
      `;

    default:
      return "";
  }
}

function renderCardHeader(slide, fallbackCategory) {
  return `
    <div class="slide-card-header">
      <span class="slide-category">${slide.category ?? fallbackCategory}</span>
      <h2>${slide.title}</h2>
    </div>
  `;
}

function renderCardFooter(slide) {
  return `
    <div class="slide-card-footer">
      <span>${slide.footerLeft ?? ""}</span>
      <span>${slide.footerRight ?? ""}</span>
    </div>
  `;
}
