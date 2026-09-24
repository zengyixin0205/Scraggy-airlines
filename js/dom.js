// Tiny helper for building DOM safely (uses textContent, never innerHTML for user data).
export function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function setMsg(node, text, kind = "") {
  if (!node) return;
  node.textContent = text || "";
  node.className = "msg" + (kind ? " " + kind : "");
}
