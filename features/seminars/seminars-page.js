import { renderSeminarList } from "./components/seminar-list.js";
import { renderSeminarError } from "./components/error-state.js";
import { getSeminarList } from "./data/seminars.js";

export const createPresentationPath = (mode, topicId) =>
  `../presentation/${mode}.html?topic=${encodeURIComponent(topicId)}`;

export function initializeSeminarsPage({
  documentRef = document,
  getTopics = getSeminarList,
} = {}) {
  const container = documentRef.getElementById("seminar-list-container");
  try {
    renderSeminarList(container, {
      seminars: getTopics(),
      paths: {
        vertical: (topicId) => createPresentationPath("vertical", topicId),
        horizontal: (topicId) => createPresentationPath("horizontal", topicId),
      },
    });
    return { ok: true };
  } catch (error) {
    console.error(error);
    renderSeminarError(container);
    return { ok: false, error };
  }
}
