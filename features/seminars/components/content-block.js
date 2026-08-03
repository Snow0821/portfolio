import { escapeAttribute, escapeHtml } from "../../../utils/html.js";

export function renderContentBlock(block, { view = "reading", className = "" } = {}) {
  let markup;
  switch (block.type) {
    case "heading": markup = renderHeading(block); break;
    case "paragraph": markup = renderParagraph(block, view); break;
    case "list": markup = renderList(block); break;
    case "code": markup = renderCode(block); break;
    case "quote": markup = renderQuote(block); break;
    case "summary": markup = renderSummary(block); break;
    case "image": markup = renderImage(block); break;
    default: throw new TypeError(`지원하지 않는 세미나 블록: ${block.type}`);
  }
  return className
    ? markup.replace(`content-block--${block.type}`, `content-block--${block.type} ${escapeAttribute(className)}`)
    : markup;
}

function root(type, content) {
  return `<div class="content-block content-block--${type}">${content}</div>`;
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

function renderSummary(block) {
  return root("summary", `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
}

function renderImage(block) {
  const alt = block.decorative ? "" : block.alt;
  const caption = block.caption ? `<figcaption class="content-block--caption">${escapeHtml(block.caption)}</figcaption>` : "";
  const credit = block.credit ? `<p class="content-block--credit">${escapeHtml(block.credit)}</p>` : "";
  return root("image", `<figure><img src="${escapeAttribute(block.src)}" alt="${escapeAttribute(alt)}">${caption}${credit}</figure>`);
}
