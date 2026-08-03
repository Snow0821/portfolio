/* Level 4 Presentation Template Renderer (Data -> Horizontal Presentation HTML Template) */

export function renderPresentationSlides(container, topicData) {
  if (!container || !topicData || !topicData.slides) return;

  const slidesHTML = topicData.slides.map((slide) => {
    switch (slide.type) {
      case "cover":
        return `
          <section class="slide-card slide-cover">
            <div class="slide-content-inner">
              <p class="slide-subtitle">${slide.slideNumber || "SEMINAR SLIDE"}</p>
              <h1>${slide.title}<br><span style="font-size: 0.6em; color: var(--color-muted);">${slide.subtitle || ""}</span></h1>
              <p class="slide-desc">${slide.description || ""}</p>
              <div class="slide-meta">
                <p style="margin:0;">${slide.authorInfo || ""}</p>
              </div>
            </div>
          </section>
        `;

      case "agenda":
        return `
          <section class="slide-card">
            <div class="slide-content-inner">
              <div class="slide-card-header">
                <span class="slide-category">${slide.category || "AGENDA"}</span>
                <h2>${slide.title}</h2>
              </div>
              <div class="slide-card-body">
                <ul>
                  ${(slide.items || []).map(item => `<li>${item}</li>`).join("")}
                </ul>
              </div>
              <div class="slide-card-footer">
                <span>${slide.footerLeft || ""}</span>
                <span>${slide.footerRight || ""}</span>
              </div>
            </div>
          </section>
        `;

      case "split-code":
        return `
          <section class="slide-card">
            <div class="slide-content-inner">
              <div class="slide-card-header">
                <span class="slide-category">${slide.category || "CODE"}</span>
                <h2>${slide.title}</h2>
              </div>
              <div class="slide-card-body">
                <div class="slide-split-grid">
                  <div>
                    <h3 style="font-size:1.1rem; margin-top:0;">${slide.pointsTitle || "특징"}</h3>
                    <ul>
                      ${(slide.points || []).map(point => `<li>${point}</li>`).join("")}
                    </ul>
                  </div>
                  <div class="slide-code-block">
                    <pre style="margin:0;"><code>${escapeHTML(slide.code || "")}</code></pre>
                  </div>
                </div>
              </div>
              <div class="slide-card-footer">
                <span>${slide.footerLeft || ""}</span>
                <span>${slide.footerRight || ""}</span>
              </div>
            </div>
          </section>
        `;

      case "summary":
        return `
          <section class="slide-card">
            <div class="slide-content-inner">
              <div class="slide-card-header">
                <span class="slide-category">${slide.category || "SUMMARY"}</span>
                <h2>${slide.title}</h2>
              </div>
              <div class="slide-card-body">
                <ul>
                  ${(slide.items || []).map(item => `<li>${item}</li>`).join("")}
                </ul>
              </div>
              <div class="slide-card-footer">
                <span>${slide.footerLeft || ""}</span>
                <span>${slide.footerRight || ""}</span>
              </div>
            </div>
          </section>
        `;

      case "outro":
        return `
          <section class="slide-card slide-cover">
            <div class="slide-content-inner">
              <p class="slide-subtitle">${slide.subtitle || "THANK YOU"}</p>
              <h1>${slide.title}</h1>
              <p class="slide-desc">${slide.description || ""}</p>
              <div class="slide-meta">
                <p style="margin:0;"><a href="../seminar.html" style="color:var(--color-accent); text-decoration:none; font-weight:600;">← 세미나 목록으로 돌아가기</a></p>
              </div>
            </div>
          </section>
        `;

      default:
        return "";
    }
  }).join("");

  container.innerHTML = slidesHTML;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
