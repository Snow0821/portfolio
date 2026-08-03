import { PresentationController } from "./components/presentation-controller.js";
import { renderSeminarError } from "./components/error-state.js";
import "./components/slide-header.js";
import { getSeminar } from "./data/seminars.js";
import { inspectLayoutAfterRender } from "./layouts/overflow.js";
import { renderPresentationSlides } from "./layouts/presentation-slides.js";
import { renderReadingDocument } from "./layouts/reading-document.js";

export function initializePresentationPage({
  documentRef = document,
  windowRef = window,
  mode,
  topicId,
  getTopic = getSeminar,
  inspectLayout = inspectLayoutAfterRender,
} = {}) {
  const container = documentRef.getElementById("presentation-container");
  try {
    const state = resolveState({ mode, topicId, getTopic });
    configurePage(documentRef, state);
    renderPage(container, state, documentRef);
    inspectRenderedLayout(inspectLayout, container, documentRef, windowRef);
    return { ok: true, ...state };
  } catch (error) {
    console.error(error);
    renderSeminarError(container);
    return { ok: false, error };
  }
}

function resolveState({ mode, topicId, getTopic }) {
  const normalizedMode = mode === "vertical" ? "vertical" : "horizontal";
  const resolvedTopicId = topicId ?? "python-intro";
  const topicData = getTopic(resolvedTopicId);
  if (!topicData) throw new Error(`Unknown seminar topic: ${resolvedTopicId}`);
  return { mode: normalizedMode, topicData, topicId: topicData.id };
}

function configurePage(documentRef, state) {
  const horizontal = state.mode === "horizontal";
  const header = documentRef.getElementById("main-slide-header");
  documentRef.title = `${state.topicData.title} — ${horizontal ? "발표용 슬라이드" : "읽기용 문서"}`;
  const attributes = {
    title: state.topicData.title,
    badge: horizontal ? "발표용 슬라이드" : "읽기용 문서",
    "badge-class": horizontal ? "" : "doc-badge",
    "back-href": "../seminars/",
    "alt-href": `./${horizontal ? "vertical" : "horizontal"}.html?topic=${encodeURIComponent(state.topicId)}`,
    "alt-text": horizontal ? "읽기용 문서 ↗" : "발표용 슬라이드 ↗",
    "is-presentation": String(horizontal),
  };
  for (const [name, value] of Object.entries(attributes)) {
    if (value) header?.setAttribute(name, value);
    else header?.removeAttribute(name);
  }
}

function renderPage(container, state, documentRef) {
  if (state.mode === "horizontal") {
    renderPresentationSlides(container, state.topicData, { seminarsHref: "../seminars/" });
    new PresentationController(documentRef);
  } else renderReadingDocument(container, state.topicData);
}

function inspectRenderedLayout(inspectLayout, container, documentRef, windowRef) {
  let inspection;
  try {
    inspection = inspectLayout(container, { documentRef, windowRef });
  } catch (error) {
    container.dataset.layoutStatus = "error";
    console.error(error);
    return;
  }
  Promise.resolve(inspection)
    .then((issues) => {
      if (!issues.length) {
        container.dataset.layoutStatus = "ok";
        return;
      }
      container.dataset.layoutStatus = "error";
      console.error(`세미나 레이아웃 overflow: ${issues.map(({ id }) => id).join(", ")}`);
    }, (error) => {
      container.dataset.layoutStatus = "error";
      console.error(error);
    });
}
