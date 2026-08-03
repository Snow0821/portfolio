const roles = ["problem", "prior-art", "method", "cases", "conclusion"];

export function createValidSeminar(overrides = {}) {
  const sections = roles.map((role) => ({
    role,
    title: `${role} title`,
    blocks: [{ id: `sample-${role}`, type: "paragraph", summary: `${role} text` }],
  }));
  const slides = roles.map((sectionRole) => ({
    id: `${sectionRole}-slide`,
    type: "content",
    sectionRole,
    category: `${sectionRole} category`,
    title: `${sectionRole} title`,
    layout: "stack",
    blockIds: [`sample-${sectionRole}`],
  }));
  return {
    id: "sample-intro",
    format: "introductory-60",
    title: "Sample introduction",
    summary: "A sample topic for the seminar contract.",
    tags: ["sample"],
    author: "Sample author",
    updated: "2026-08-03",
    audience: "Interested non-specialists",
    prerequisites: [],
    outcomes: ["Explain the sample topic."],
    sections,
    presentation: {
      slides: [{ id: "cover", type: "cover" }, { id: "agenda", type: "agenda" }, ...slides,
        { id: "outro", type: "outro", title: "Questions", description: "Discuss the topic." }],
    },
    ...overrides,
  };
}
