const RENDER_ZONE_ID = "pdf-temp-render-zone";

export function createPdfRenderZone({
  topicData,
  mode,
  renderContent,
  documentRef = globalThis.document,
}) {
  if (!documentRef?.createElement) {
    throw new Error("PDF 렌더링에 사용할 document가 없습니다.");
  }

  const normalizedMode = mode === "horizontal" ? "horizontal" : "vertical";
  const renderZone = documentRef.createElement("div");
  const target = documentRef.createElement("div");

  renderZone.id = RENDER_ZONE_ID;
  renderZone.className = `pdf-render-zone pdf-render-zone--${normalizedMode}`;
  Object.assign(renderZone.style, {
    position: "fixed",
    top: "0",
    left: "0",
    zIndex: "-99999",
    width: normalizedMode === "horizontal" ? "1024px" : "800px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    opacity: "1",
    pointerEvents: "none",
  });

  if (normalizedMode === "horizontal") {
    target.className = "slide-container horizontal";
    Object.assign(target.style, {
      display: "block",
      width: "100%",
      height: "auto",
      overflow: "visible",
    });
  } else {
    target.className = "pdf-document-target";
  }

  renderZone.appendChild(target);
  renderContent(target, topicData);

  if (normalizedMode === "horizontal") {
    const cards = target.querySelectorAll(".slide-card");
    cards.forEach((card, index) => {
      Object.assign(card.style, {
        width: "100%",
        height: "724px",
        pageBreakAfter: index === cards.length - 1 ? "auto" : "always",
        breakAfter: index === cards.length - 1 ? "auto" : "page",
      });
    });
  }

  return renderZone;
}

export async function exportSeminarPdf({
  topicData,
  mode,
  renderContent,
  html2pdf = globalThis.window?.html2pdf,
  onFallback = () => {},
  documentRef = globalThis.document,
  waitForLayout = defaultWaitForLayout,
}) {
  let renderZone;

  try {
    renderZone = createPdfRenderZone({
      topicData,
      mode,
      renderContent,
      documentRef,
    });
    documentRef.body.appendChild(renderZone);
    await waitForLayout(documentRef);

    if (!html2pdf) {
      await onFallback({ topicData, mode });
      return;
    }

    const exporter = html2pdf();
    await exporter.set(createPdfOptions(topicData, mode)).from(renderZone).save();
  } finally {
    renderZone?.remove();
  }
}

export function createPdfOptions(topicData, mode) {
  const isHorizontal = mode === "horizontal";
  const title = String(topicData.title)
    .replace(/[^\w\s가-힣-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  return {
    margin: isHorizontal ? [0, 0, 0, 0] : [12, 10, 12, 10],
    filename: `${title}_${isHorizontal ? "발표슬라이드" : "읽기용문서"}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: isHorizontal ? "landscape" : "portrait",
    },
    pagebreak: { mode: ["css", "legacy"] },
  };
}

async function defaultWaitForLayout(documentRef) {
  if (documentRef.fonts?.ready) await documentRef.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
