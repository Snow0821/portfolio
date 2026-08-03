/* Level 3: Seminar List Renderer with Robust Direct PDF Generator */
import { seminarList, seminarsDatabase } from "../../data/seminars.js";
import { renderReadingDocument } from "../level4-presentation/document-renderer.js";
import { renderPresentationSlides } from "../level4-presentation/slide-renderer.js";

export function renderSeminarList(container) {
  if (!container) return;

  // Render cards with Reading Document FIRST, Presentation Slide SECOND
  const cardsHTML = seminarList.map((item) => `
    <article class="seminar-card">
      <div class="seminar-card-header">
        <div>
          <h2 class="seminar-title">${item.title} (${item.subtitle})</h2>
        </div>
        <div class="seminar-tags">
          ${(item.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join("")}
        </div>
      </div>
      <p class="seminar-description">${item.summary}</p>
      <div class="seminar-actions">
        
        <!-- 1st: Reading Document (세로) + Attached PDF Icon Download -->
        <div class="action-pair">
          <a href="./slides/viewer-vertical.html?topic=${item.id}" target="_blank" rel="noopener noreferrer" class="btn-slide primary">
            <span>읽기용 문서 (세로) ↗</span>
          </a>
          <button type="button" class="btn-icon-download btn-pdf-direct" data-topic="${item.id}" data-type="vertical" title="읽기용 문서 PDF 바로 다운로드">
            <span class="icon">📥</span>
          </button>
        </div>

        <!-- 2nd: Presentation Slide (가로) + Attached PDF Icon Download -->
        <div class="action-pair">
          <a href="./slides/viewer-horizontal.html?topic=${item.id}" target="_blank" rel="noopener noreferrer" class="btn-slide">
            <span>발표용 슬라이드 (가로) ↗</span>
          </a>
          <button type="button" class="btn-icon-download btn-pdf-direct" data-topic="${item.id}" data-type="horizontal" title="발표용 슬라이드 PDF 바로 다운로드">
            <span class="icon">📥</span>
          </button>
        </div>

      </div>
    </article>
  `).join("");

  container.innerHTML = cardsHTML;

  // Bind Direct PDF Download Click Listeners
  const downloadBtns = container.querySelectorAll(".btn-pdf-direct");
  downloadBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const topicId = btn.getAttribute("data-topic");
      const type = btn.getAttribute("data-type");
      await handleDirectPDFDownload(topicId, type, btn);
    });
  });
}

/**
 * Generates and downloads PDF directly without blank pages.
 */
async function handleDirectPDFDownload(topicId, type, btnEl) {
  const topicData = seminarsDatabase[topicId];
  if (!topicData) return;

  const iconSpan = btnEl.querySelector(".icon");
  const originalIcon = iconSpan ? iconSpan.textContent : "📥";

  try {
    btnEl.classList.add("loading");
    if (iconSpan) iconSpan.textContent = "⏳";

    // 1. Create a container positioned at top:0, left:0 but behind current page (z-index: -99999)
    // This allows html2canvas to capture full DOM layout & CSS without blank canvas errors.
    const pdfContainer = document.createElement("div");
    pdfContainer.id = "pdf-temp-render-zone";
    pdfContainer.style.position = "fixed";
    pdfContainer.style.top = "0";
    pdfContainer.style.left = "0";
    pdfContainer.style.zIndex = "-99999";
    pdfContainer.style.opacity = "1";
    pdfContainer.style.pointerEvents = "none";
    pdfContainer.style.backgroundColor = "#ffffff";
    pdfContainer.style.boxSizing = "border-box";

    if (type === "vertical") {
      pdfContainer.style.width = "800px";
      pdfContainer.className = "slide-wrapper";
      renderReadingDocument(pdfContainer, topicData);
    } else {
      pdfContainer.style.width = "1024px";
      pdfContainer.className = "slide-wrapper pdf-slide-mode";
      renderPresentationSlides(pdfContainer, topicData);

      // Force slide-container to be visible blocks for page breaks instead of horizontal flex scroll
      const slideBox = pdfContainer.querySelector(".slide-container.horizontal");
      if (slideBox) {
        slideBox.style.display = "block";
        slideBox.style.height = "auto";
        slideBox.style.overflow = "visible";

        const cards = slideBox.querySelectorAll(".slide-card");
        cards.forEach((card, idx) => {
          card.style.height = "640px";
          card.style.width = "100%";
          card.style.pageBreakAfter = idx === cards.length - 1 ? "auto" : "always";
          card.style.breakAfter = idx === cards.length - 1 ? "auto" : "page";
        });
      }
    }

    document.body.appendChild(pdfContainer);

    // Wait 300ms for browser to finish font rendering & layout calculation
    await new Promise((resolve) => setTimeout(resolve, 300));

    const sanitizeTitle = topicData.title.replace(/[^\w\s가-힣-]/g, "").replace(/\s+/g, "_");
    const fileName = `${sanitizeTitle}_${type === "vertical" ? "읽기용문서" : "발표슬라이드"}.pdf`;

    // 2. Direct client-side PDF generation via html2pdf.js
    if (window.html2pdf) {
      const opt = {
        margin: type === "vertical" ? [12, 10, 12, 10] : [0, 0, 0, 0],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: type === "horizontal" ? 'landscape' : 'portrait'
        },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await window.html2pdf().set(opt).from(pdfContainer).save();
    } else {
      // Fallback: If html2pdf library script is blocked, launch print preview
      window.print();
    }

    // Clean up temporary DOM element
    if (pdfContainer.parentNode) {
      pdfContainer.parentNode.removeChild(pdfContainer);
    }
  } catch (err) {
    console.error("PDF 다운로드 중 오류 발생:", err);
    alert("PDF 생성 중 오류가 발생했습니다. 세미나 페이지에서 열어보기 후 인쇄 기능을 이용해 주세요.");
  } finally {
    btnEl.classList.remove("loading");
    if (iconSpan) iconSpan.textContent = originalIcon;
  }
}
