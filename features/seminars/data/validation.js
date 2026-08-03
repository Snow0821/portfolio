export const SECTION_ROLES = Object.freeze([
  "problem",
  "prior-art",
  "method",
  "cases",
  "conclusion",
]);

export const BLOCK_TYPES = Object.freeze([
  "heading",
  "paragraph",
  "list",
  "code",
  "quote",
  "summary",
  "image",
]);
const SLIDE_TYPES = new Set(["cover", "agenda", "content", "outro"]);
const LAYOUTS = new Set(["stack", "split"]);
const isText = (value) => typeof value === "string" && value.trim() !== "";

function requireText(value, path, errors) {
  if (!isText(value)) errors.push(`${path} must be a non-empty string`);
}

function optionalText(value, path, errors) {
  if (value !== undefined && typeof value !== "string") {
    errors.push(`${path} must be a string when present`);
  }
}

function validateItems(items, path, errors) {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  items.forEach((item, index) => requireText(item, `${path}[${index}]`, errors));
}

function validateBlock(block, path, topicId, blockIds, blockOwners, role, errors) {
  if (!block || typeof block !== "object") {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!isText(block.id)) errors.push(`${path}.id must be a non-empty string`);
  else if (blockIds.has(block.id)) errors.push(`${path}.id duplicate block id "${block.id}"`);
  else {
    blockIds.add(block.id);
    blockOwners.set(block.id, role);
  }
  if (!BLOCK_TYPES.includes(block.type)) {
    errors.push(`${path}.type must be a supported block type`);
    return;
  }
  if (block.type === "heading") {
    requireText(block.text, `${path}.text`, errors);
    if (block.level !== 2 && block.level !== 3) errors.push(`${path}.level must be 2 or 3`);
  }
  if (block.type === "paragraph") {
    requireText(block.summary, `${path}.summary`, errors);
    optionalText(block.detail, `${path}.detail`, errors);
  }
  if (block.type === "list" || block.type === "summary") {
    validateItems(block.items, `${path}.items`, errors);
  }
  if (block.type === "code") {
    requireText(block.code, `${path}.code`, errors);
    optionalText(block.language, `${path}.language`, errors);
    optionalText(block.caption, `${path}.caption`, errors);
  }
  if (block.type === "quote") {
    requireText(block.text, `${path}.text`, errors);
    optionalText(block.attribution, `${path}.attribution`, errors);
    optionalText(block.source, `${path}.source`, errors);
  }
  if (block.type === "image") validateImage(block, path, topicId, errors);
}
function validateImage(block, path, topicId, errors) {
  const prefix = `/features/seminars/assets/${topicId}/`;
  if (typeof block.src !== "string" || !block.src.startsWith(prefix)) {
    errors.push(`${path}.image src must start with ${prefix}`);
  }
  if (block.decorative !== undefined && typeof block.decorative !== "boolean") {
    errors.push(`${path}.image decorative must be a boolean when present`);
  }
  if (block.decorative === true && block.alt !== "") {
    errors.push(`${path}.image decorative alt must be empty`);
  }
  if (block.decorative !== true && !isText(block.alt)) {
    errors.push(`${path}.image alt must be non-empty unless decorative is true`);
  }
  if (block.owned !== undefined && typeof block.owned !== "boolean") {
    errors.push(`${path}.image owned must be a boolean when present`);
  }
  if (block.owned === false && !isText(block.credit)) {
    errors.push(`${path}.image credit must be non-empty when owned is false`);
  }
  optionalText(block.caption, `${path}.caption`, errors);
  optionalText(block.credit, `${path}.credit`, errors);
}

function validateSections(sections, topicId, errors) {
  const blockIds = new Set();
  const blockOwners = new Map();
  if (!Array.isArray(sections)) {
    errors.push("sections must be an array");
    return blockOwners;
  }
  const roles = sections.map((section) => section?.role);
  if (JSON.stringify(roles) !== JSON.stringify(SECTION_ROLES)) {
    errors.push(`sections must use roles in order: ${SECTION_ROLES.join(", ")}`);
  }
  sections.forEach((section, index) => {
    const path = `sections[${index}]`;
    if (!section || typeof section !== "object") {
      errors.push(`${path} must be an object`);
      return;
    }
    requireText(section.title, `${path}.title`, errors);
    if (!Array.isArray(section.blocks)) {
      errors.push(`${path}.blocks must be an array`);
      return;
    }
    section.blocks.forEach((block, blockIndex) => {
      validateBlock(block, `${path}.blocks[${blockIndex}]`, topicId, blockIds, blockOwners,
        section.role, errors);
    });
  });
  return blockOwners;
}
function validateSlides(presentation, blockOwners, errors) {
  if (!presentation || typeof presentation !== "object" || !Array.isArray(presentation.slides)) {
    errors.push("presentation.slides must be an array");
    return;
  }
  const slideIds = new Set();
  const coveredRoles = new Set();
  presentation.slides.forEach((slide, index) => {
    const path = `presentation.slides[${index}]`;
    if (!slide || typeof slide !== "object") {
      errors.push(`${path} must be an object`);
      return;
    }
    if (!isText(slide.id)) errors.push(`${path}.id must be a non-empty string`);
    else if (slideIds.has(slide.id)) errors.push(`${path}.id duplicate slide id "${slide.id}"`);
    else slideIds.add(slide.id);
    if (!SLIDE_TYPES.has(slide.type)) errors.push(`${path}.type must be a supported slide type`);
    if (slide.type === "cover" || slide.type === "agenda") {
      if ("blockIds" in slide) errors.push(`${path}.blockIds is not allowed for ${slide.type}`);
    }
    if (slide.type === "content") validateContentSlide(slide, path, blockOwners, coveredRoles, errors);
    if (slide.type === "outro") {
      requireText(slide.title, `${path}.title`, errors);
      requireText(slide.description, `${path}.description`, errors);
    }
  });
  const missingRoles = SECTION_ROLES.filter((role) => !coveredRoles.has(role));
  if (missingRoles.length > 0) errors.push(`presentation content slides must cover roles: ${missingRoles.join(", ")}`);
}

function validateContentSlide(slide, path, blockOwners, coveredRoles, errors) {
  if (!SECTION_ROLES.includes(slide.sectionRole)) {
    errors.push(`${path}.sectionRole must be a known section role`);
  } else coveredRoles.add(slide.sectionRole);
  requireText(slide.category, `${path}.category`, errors);
  requireText(slide.title, `${path}.title`, errors);
  if (!LAYOUTS.has(slide.layout)) errors.push(`${path}.layout must be stack or split`);
  if (!Array.isArray(slide.blockIds) || slide.blockIds.length === 0) {
    errors.push(`${path}.blockIds must reference at least one section block`);
    return;
  }
  let hasOwnedBlock = false;
  slide.blockIds.forEach((blockId, index) => {
    if (!isText(blockId) || !blockOwners.has(blockId)) {
      errors.push(`${path}.blockIds[${index}] missing block reference`);
    } else if (blockOwners.get(blockId) === slide.sectionRole) hasOwnedBlock = true;
  });
  if (!hasOwnedBlock) errors.push(`${path}.blockIds must include a ${slide.sectionRole} block`);
}

export function validateSeminar(topic) {
  const errors = [];
  const data = topic && typeof topic === "object" ? topic : {};
  if (data !== topic) errors.push("topic must be an object");
  ["id", "format", "title", "subtitle", "summary", "author", "updated", "audience"].forEach((field) => {
    requireText(data[field], field, errors);
  });
  validateItems(data.outcomes, "outcomes", errors);
  ["tags", "prerequisites"].forEach((field) => {
    if (!Array.isArray(data[field])) errors.push(`${field} must be an array`);
  });
  if (data.format !== "introductory-60") errors.push("format must be introductory-60");
  const blockOwners = validateSections(data.sections, data.id, errors);
  validateSlides(data.presentation, blockOwners, errors);
  if (errors.length > 0) {
    const topicId = topic?.id || "<unknown>";
    throw new TypeError(`세미나 ${topicId}: ${errors.join("; ")}`);
  }
  return topic;
}
