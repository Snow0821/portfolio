export function findLayoutOverflow(root) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll("[data-layout-boundary]")].flatMap((element) => {
    const horizontal = element.scrollWidth > element.clientWidth + 1;
    const vertical = element.scrollHeight > element.clientHeight + 1;
    if (!horizontal && !vertical) return [];
    return [{ id: element.dataset.layoutId || "<unknown>", horizontal, vertical }];
  });
}

export async function inspectLayoutAfterRender(root, { documentRef, windowRef } = {}) {
  if (documentRef?.fonts?.ready) await documentRef.fonts.ready;
  await waitForImages(root);
  await new Promise((resolve) => {
    if (windowRef?.requestAnimationFrame) windowRef.requestAnimationFrame(resolve);
    else resolve();
  });
  return findLayoutOverflow(root);
}

function waitForImages(root) {
  if (!root?.querySelectorAll) return Promise.resolve();
  return Promise.all([...root.querySelectorAll("img")].map(waitForImage));
}

function waitForImage(image) {
  if (image.complete) return Promise.resolve(image.decode?.()).catch(() => undefined);
  return new Promise((resolve) => {
    const done = () => {
      image.removeEventListener?.("load", done);
      image.removeEventListener?.("error", done);
      resolve();
    };
    image.addEventListener?.("load", done, { once: true });
    image.addEventListener?.("error", done, { once: true });
  });
}
