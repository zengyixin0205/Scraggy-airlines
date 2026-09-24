// Live clock panel: shown at the side of every page (a slim strip on phones).
import { CONFIG } from "./config.js";
import { el } from "./dom.js";

function makeFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  } catch {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }
}

export function startClock() {
  if (document.getElementById("clock")) return;

  const timeNodes = {
    local: el("time", { class: "clock-time" }, "--:--:--"),
    sia: el("time", { class: "clock-time" }, "--:--:--"),
    wrong: el("time", { class: "clock-time" }, "--:--:--")
  };
  const dateNode = el("div", { class: "clock-date" }, "");

  const panel = el(
    "aside",
    { id: "clock", class: "clock", "aria-label": "Current time" },
    el("div", { class: "clock-row" }, el("span", { class: "clock-label" }, "Your time"), timeNodes.local),
    el("div", { class: "clock-row" }, el("span", { class: "clock-label" }, "SIA time"), timeNodes.sia),
    el(
      "div",
      { class: "clock-row" },
      el("span", { class: "clock-label" }, "Mdm Wrong-Wrong's time"),
      timeNodes.wrong
    ),
    dateNode
  );
  document.body.prepend(panel);

  const localFmt = makeFormatter(undefined);
  const siaFmt = makeFormatter(CONFIG.SIA_TIMEZONE);
  const dateFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  function tick() {
    const now = new Date();
    timeNodes.local.textContent = localFmt.format(now);
    timeNodes.sia.textContent = siaFmt.format(now);
    timeNodes.wrong.textContent = localFmt.format(new Date(now.getTime() + CONFIG.WRONG_MINUTES * 60000));
    dateNode.textContent = dateFmt.format(now);
  }

  let timer = null;
  function start() {
    if (timer) return;
    tick();
    timer = setInterval(tick, 1000);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
}
