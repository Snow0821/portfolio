import { PresentationController } from "../../components/presentation/controller.js";
import { renderReadingDocument } from "../../components/presentation/document-renderer.js";
import { renderPresentationSlides } from "../../components/presentation/slide-renderer.js";
import "../../components/presentation/slide-header.js";
import { seminarsDatabase } from "../../data/seminars.js";

export function resolvePresentationState({ database, mode, search = "" }) {
  const params = new URLSearchParams(search);
  const requestedTopicId = params.get("topic") ?? "python-intro";
  const fallbackTopic = database["python-intro"] ?? Object.values(database)[0];
  const topicData = database[requestedTopicId] ?? fallbackTopic;

  if (!topicData) {
    throw new Error("표시할 세미나 주제 데이터가 없습니다.");
  }

  return {
    mode: mode === "vertical" ? "vertical" : "horizontal",
    topicData,
    topicId: topicData.id,
    shouldPrint: params.get("print") === "true",
  };
}

export function initializePresentationPage({
  documentRef = document,
  windowRef = window,
  database = seminarsDatabase,
} = {}) {
  const state = resolvePresentationState({
    database,
    mode: documentRef.body.dataset.presentationMode,
    search: windowRef.location.search,
  });
  const isHorizontal = state.mode === "horizontal";
  const header = documentRef.getElementById("main-slide-header");
  const container = documentRef.getElementById("presentation-container");
  const alternateMode = isHorizontal ? "vertical" : "horizontal";

  documentRef.title = `${state.topicData.title} — ${
    isHorizontal ? "발표용 슬라이드" : "읽기용 문서"
  }`;

  const headerAttributes = {
    title: state.topicData.title,
    badge: isHorizontal ? "발표용 슬라이드" : "읽기용 문서",
    "badge-class": isHorizontal ? "" : "doc-badge",
    "back-href": "../seminars/",
    "alt-href": `./${alternateMode}.html?topic=${encodeURIComponent(state.topicId)}`,
    "alt-text": isHorizontal ? "읽기용 문서 ↗" : "발표용 슬라이드 ↗",
    "is-presentation": String(isHorizontal),
  };

  for (const [name, value] of Object.entries(headerAttributes)) {
    if (value) header?.setAttribute(name, value);
    else header?.removeAttribute(name);
  }

  if (isHorizontal) {
    renderPresentationSlides(container, state.topicData, {
      seminarsHref: "../seminars/",
    });
    new PresentationController(documentRef);
  } else {
    renderReadingDocument(container, state.topicData);
  }

  if (state.shouldPrint) {
    windowRef.setTimeout(() => windowRef.print(), 350);
  }

  return state;
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  initializePresentationPage();
}
