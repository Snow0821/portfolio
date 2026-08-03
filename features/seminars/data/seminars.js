import { pythonIntroData } from "./topics/python-intro.js";
import { webIntroData } from "./topics/web-intro.js";
import { validateSeminar } from "./validation.js";

const topics = Object.freeze([pythonIntroData, webIntroData]);
const seminarsDatabase = Object.freeze(
  Object.fromEntries(topics.map((topic) => [topic.id, topic])),
);

export function getSeminarList() {
  return topics.map(validateSeminar);
}

export function getSeminar(id) {
  const topic = seminarsDatabase[id];
  return topic ? validateSeminar(topic) : null;
}
