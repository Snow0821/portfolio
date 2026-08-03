import { initializePresentationPage } from "../../features/seminars/index.js";

if (typeof document !== "undefined" && typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  initializePresentationPage({
    documentRef: document,
    windowRef: window,
    mode: document.body.dataset.presentationMode,
    topicId: params.get("topic"),
    shouldPrint: params.get("print") === "true",
  });
}
