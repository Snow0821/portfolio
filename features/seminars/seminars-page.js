import { renderSeminarList } from "./components/seminar-list.js";
import { renderSeminarError } from "./components/error-state.js";
import { getSeminar, getSeminarList } from "./data/seminars.js";
import { renderPresentationSlides } from "./layouts/presentation-slides.js";
import { renderReadingDocument } from "./layouts/reading-document.js";
import { exportSeminarPdf } from "./services/pdf/exporter.js";

export const createPresentationPath = (mode, topicId) =>
  `../presentation/${mode}.html?topic=${encodeURIComponent(topicId)}`;

export const createPrintFallbackUrl = (mode, topicId) =>
  `${createPresentationPath(mode, topicId)}&print=true`;

export function initializeSeminarsPage({
  documentRef = document,
  windowRef = window,
  getTopics = getSeminarList,
  getTopic = getSeminar,
} = {}) {
  const container = documentRef.getElementById("seminar-list-container");
  try {
    renderSeminarList(container, {
      seminars: getTopics(),
      paths: {
        vertical: (topicId) => createPresentationPath("vertical", topicId),
        horizontal: (topicId) => createPresentationPath("horizontal", topicId),
      },
      onDownload: createDownloadHandler({ documentRef, windowRef, getTopic }),
    });
    return { ok: true };
  } catch (error) {
    console.error(error);
    renderSeminarError(container);
    return { ok: false, error };
  }
}

function createDownloadHandler({ documentRef, windowRef, getTopic }) {
  return async ({ topicId, mode }) => {
    try {
      const topicData = getTopic(topicId);
      if (!topicData) throw new Error(`Unknown seminar topic: ${topicId}`);
      const renderContent = mode === "horizontal"
        ? (target, data) => renderPresentationSlides(target, data, { seminarsHref: "../seminars/" })
        : renderReadingDocument;
      await exportSeminarPdf({
        topicData, mode, renderContent, html2pdf: windowRef.html2pdf, documentRef,
        onFallback: () => windowRef.open(
          createPrintFallbackUrl(mode, topicId), "_blank", "noopener,noreferrer",
        ),
      });
    } catch (error) {
      console.error("PDF 다운로드 중 오류가 발생했습니다.", error);
      windowRef.alert(
        "PDF 생성 중 오류가 발생했습니다. 자료를 연 뒤 브라우저의 인쇄 기능을 이용해 주세요.",
      );
    }
  };
}
