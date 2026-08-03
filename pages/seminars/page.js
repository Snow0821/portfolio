import { renderReadingDocument } from "../../components/document-renderer.js";
import { renderSeminarList } from "../../components/seminar-list.js";
import { renderPresentationSlides } from "../../components/slide-renderer.js";
import { seminarList, seminarsDatabase } from "../../data/seminars.js";
import { exportSeminarPdf } from "../../services/pdf-exporter.js";

export const createPresentationPath = (mode, topicId) =>
  `../presentation/${mode}.html?topic=${encodeURIComponent(topicId)}`;

export const createPrintFallbackUrl = (mode, topicId) =>
  `${createPresentationPath(mode, topicId)}&print=true`;

export function initializeSeminarsPage({
  documentRef = document,
  windowRef = window,
  database = seminarsDatabase,
  seminars = seminarList,
} = {}) {
  renderSeminarList(documentRef.getElementById("seminar-list-container"), {
    seminars,
    paths: {
      vertical: (topicId) => createPresentationPath("vertical", topicId),
      horizontal: (topicId) => createPresentationPath("horizontal", topicId),
    },
    onDownload: async ({ topicId, mode }) => {
      const topicData = database[topicId];
      if (!topicData) return;

      const renderContent =
        mode === "horizontal"
          ? (target, data) =>
              renderPresentationSlides(target, data, {
                seminarsHref: "../seminars/",
              })
          : renderReadingDocument;

      try {
        await exportSeminarPdf({
          topicData,
          mode,
          renderContent,
          html2pdf: windowRef.html2pdf,
          documentRef,
          onFallback: () =>
            windowRef.open(
              createPrintFallbackUrl(mode, topicId),
              "_blank",
              "noopener,noreferrer",
            ),
        });
      } catch (error) {
        console.error("PDF 다운로드 중 오류가 발생했습니다.", error);
        windowRef.alert(
          "PDF 생성 중 오류가 발생했습니다. 자료를 연 뒤 브라우저의 인쇄 기능을 이용해 주세요.",
        );
      }
    },
  });
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  initializeSeminarsPage();
}
