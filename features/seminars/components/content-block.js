import { escapeAttribute, escapeHtml } from "../../../utils/html.js";

export function renderContentBlock(block, { view = "reading", className = "" } = {}) {
  switch (block.type) {
    case "heading": return renderHeading(block);
    case "paragraph": return renderParagraph(block, view);
    case "list": return renderList(block);
    case "code": return renderCode(block);
    case "quote": return renderQuote(block);
    case "summary": return renderSummary(block, className);
    case "image": return renderImage(block);
    default: throw new TypeError(`지원하지 않는 세미나 블록: ${block.type}`);
  }
}

function root(type, content, className = "") {
  return `<div class="content-block content-block--${type}${className ? ` ${className}` : ""}">${content}</div>`;
}

function renderHeading(block) {
  const level = block.level === 3 ? 3 : 2;
  return root("heading", `<h${level}>${escapeHtml(block.text)}</h${level}>`);
}

function renderParagraph(block, view) {
  const detail = view === "reading" && block.detail
    ? `<p class="content-block--detail">${escapeHtml(block.detail)}</p>` : "";
  return root("paragraph", `<p>${escapeHtml(block.summary)}</p>${detail}`);
}

function renderList(block) {
  return root("list", `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
}

function renderCode(block) {
  const language = block.language ? ` class="language-${escapeAttribute(block.language)}"` : "";
  const caption = block.caption ? `<p class="content-block--caption">${escapeHtml(block.caption)}</p>` : "";
  return root("code", `${caption}<pre><code${language}>${escapeHtml(block.code)}</code></pre>`);
}

function renderQuote(block) {
  const attribution = block.attribution || block.source
    ? `<footer>${block.attribution ? escapeHtml(block.attribution) : ""}${block.attribution && block.source ? ", " : ""}${block.source ? escapeHtml(block.source) : ""}</footer>` : "";
  return root("quote", `<blockquote><p>${escapeHtml(block.text)}</p>${attribution}</blockquote>`);
}

function renderSummary(block, className) {
  return root("summary", `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`, className);
}

function renderImage(block) {
  const alt = block.decorative ? "" : block.alt;
  const caption = block.caption ? `<figcaption class="content-block--caption">${escapeHtml(block.caption)}</figcaption>` : "";
  const credit = block.credit ? `<p class="content-block--credit">${escapeHtml(block.credit)}</p>` : "";
  return root("image", `<figure><img src="${escapeAttribute(block.src)}" alt="${escapeAttribute(alt)}">${caption}${credit}</figure>`);
}
