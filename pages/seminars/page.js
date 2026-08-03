import { renderSeminarList } from "../../components/seminar-list.js";
import { seminarList } from "../../data/seminars.js";

const presentationPath = (mode, topicId) =>
  `../presentation/${mode}.html?topic=${encodeURIComponent(topicId)}`;

renderSeminarList(document.getElementById("seminar-list-container"), {
  seminars: seminarList,
  paths: {
    vertical: (topicId) => presentationPath("vertical", topicId),
    horizontal: (topicId) => presentationPath("horizontal", topicId),
  },
  onDownload: () => {
    window.alert(
      "직접 PDF 다운로드는 준비 중입니다. 읽기 또는 발표 페이지를 연 뒤 브라우저의 인쇄 기능을 이용해 주세요.",
    );
  },
});
