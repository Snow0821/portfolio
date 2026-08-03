import { createPdfRenderZone, waitForPdfLayout } from "./render-zone.js";

export async function exportSeminarPdf({
  topicData,
  mode,
  renderContent,
  html2pdf = globalThis.window?.html2pdf,
  onFallback = () => {},
  documentRef = globalThis.document,
  waitForLayout = waitForPdfLayout,
}) {
  let renderZone;
  try {
    renderZone = createPdfRenderZone({ topicData, mode, renderContent, documentRef });
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
    html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
    jsPDF: { unit: "mm", format: "a4", orientation: isHorizontal ? "landscape" : "portrait" },
    pagebreak: { mode: ["css", "legacy"] },
  };
}
