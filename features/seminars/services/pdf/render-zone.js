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
    position: "fixed", top: "0", left: "0", zIndex: "-99999",
    width: normalizedMode === "horizontal" ? "1024px" : "800px",
    boxSizing: "border-box", backgroundColor: "#ffffff", opacity: "1", pointerEvents: "none",
  });

  if (normalizedMode === "horizontal") {
    target.className = "slide-container horizontal";
    Object.assign(target.style, {
      display: "block", width: "100%", height: "auto", overflow: "visible",
    });
  } else target.className = "pdf-document-target";

  renderZone.appendChild(target);
  renderContent(target, topicData);
  if (normalizedMode === "horizontal") styleCards(target);
  return renderZone;
}

function styleCards(target) {
  const cards = target.querySelectorAll(".slide-card");
  cards.forEach((card, index) => {
    const last = index === cards.length - 1;
    Object.assign(card.style, {
      width: "100%", height: "724px",
      pageBreakAfter: last ? "auto" : "always", breakAfter: last ? "auto" : "page",
    });
  });
}

export async function waitForPdfLayout(documentRef) {
  if (documentRef.fonts?.ready) await documentRef.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
