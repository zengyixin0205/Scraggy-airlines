// Fake (joke) booking form. Every flight starts or ends at SIA. No payment details are collected.
import { backend } from "./backend.js";
import { refreshHeader } from "./main.js";
import { $, el, setMsg } from "./dom.js";
import {
  AIRCRAFT, CLASSES, HUB, PLACES, REASONS, ROUTES, SNACKS, SURPRISE,
  friendlyError, isoDate, legPoints, placeName, planLegs
} from "./data.js";

const DRAFT_KEY = "scraggy.booking.draft";
const TOTAL_STEPS = 6;

const form = $("#book-form");
const stepMsg = $("#step-msg");
const routeMsg = $("#route-msg");
const result = $("#book-result");
const stepsNav = $("#steps-nav");
const btnBack = $("#btn-back");
const btnNext = $("#btn-next");
const btnConfirm = $("#btn-confirm");
const loginNote = $("#login-note");

let step = 1;
let user = null;

/* ---------- build option lists ---------- */
function buildOptions() {
  const aircraftBox = $("#aircraft-options");
  [...AIRCRAFT, SURPRISE].forEach((a, i) => {
    aircraftBox.append(
      el("label", { class: "opt" },
        el("input", { type: "radio", name: "aircraft", value: a.id, checked: i === AIRCRAFT.length }),
        a.name, el("small", {}, a.blurb))
    );
  });
  const classBox = $("#class-options");
  CLASSES.forEach((c, i) => {
    const bonus = c.bonus ? ` (+${c.bonus} points per flight)` : "";
    classBox.append(
      el("label", { class: "opt" },
        el("input", { type: "radio", name: "travelClass", value: c.id, checked: i === 0 }),
        c.name + bonus, el("small", {}, c.joke))
    );
  });
  const placeOptions = Object.entries(PLACES).map(([id, p]) => el("option", { value: id }, p.name));
  $("#from").append(...placeOptions.map((o) => o.cloneNode(true)));
  $("#to").append(...placeOptions.map((o) => o.cloneNode(true)));
  $("#reason").append(...REASONS.map((r) => el("option", { value: r }, r)));
  $("#step-total").textContent = String(TOTAL_STEPS);
  for (let i = 1; i <= TOTAL_STEPS; i++) stepsNav.append(el("li", {}, "Step " + i));
}

function buildSnacks() {
  const select = $("#snack");
  const previous = select.value;
  const cls = form.elements.travelClass.value;
  const list = cls === "scraggy" ? SNACKS.scraggy : SNACKS.standard;
  select.replaceChildren(...list.map((s) => el("option", { value: s }, s)));
  if (list.includes(previous)) select.value = previous;
  $("#snack-hint").textContent = cls === "scraggy" ? "Scraggy Class food comes from Scraggyton." : "Upgrade to Scraggy Class for food from Scraggyton.";
}

/* ---------- state ---------- */
function readState() {
  const f = form.elements;
  return {
    tripType: f.tripType.value,
    from: f.from.value,
    to: f.to.value,
    date: f.date.value,
    returnDate: f.returnDate.value,
    aircraft: f.aircraft.value,
    travelClass: f.travelClass.value,
    name: f.name.value.trim(),
    seat: f.seat.value,
    snack: f.snack.value,
    bags: f.bags.value,
    reason: f.reason.value,
    t1: f.t1.checked,
    t2: f.t2.checked
  };
}

function applyState(s) {
  const f = form.elements;
  f.tripType.value = s.tripType;
  f.from.value = s.from;
  f.to.value = s.to;
  f.date.value = s.date;
  f.returnDate.value = s.returnDate;
  f.aircraft.value = s.aircraft;
  f.travelClass.value = s.travelClass;
  buildSnacks();
  f.name.value = s.name || "";
  f.seat.value = s.seat;
  f.snack.value = s.snack;
  f.bags.value = s.bags;
  f.reason.value = s.reason;
  f.t1.checked = !!s.t1;
  f.t2.checked = !!s.t2;
  syncReturn();
}

function saveDraft() {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(readState())); } catch { /* ignore */ }
}
function takeDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DRAFT_KEY);
    return JSON.parse(raw);
  } catch { return null; }
}

/* ---------- route rule: SIA at exactly one end ---------- */
function onRouteChange(changed) {
  const f = form.elements;
  const other = changed === "from" ? "to" : "from";
  setMsg(routeMsg, "");
  if (f.from.value === f.to.value) {
    f[other].value = f[changed].value === HUB ? "scraggy-house" : HUB;
  }
  if (f.from.value !== HUB && f.to.value !== HUB) {
    f[other].value = HUB;
    setMsg(routeMsg, "No direct flights. Everything goes through SIA. Even your sadness. We fixed it for you.", "error");
  }
}

function syncReturn() {
  const isReturn = form.elements.tripType.value === "return";
  $("#return-field").hidden = !isReturn;
}

/* ---------- steps ---------- */
function showStep(n) {
  step = n;
  form.querySelectorAll("fieldset[data-step]").forEach((fs) => (fs.hidden = Number(fs.dataset.step) !== n));
  [...stepsNav.children].forEach((li, i) => {
    if (i + 1 === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  });
  btnBack.hidden = n === 1;
  btnNext.hidden = n === TOTAL_STEPS;
  btnConfirm.hidden = n !== TOTAL_STEPS;
  setMsg(stepMsg, "");
  if (n === 4) buildSnacks();
  if (n === TOTAL_STEPS) renderReview();
  stepsNav.scrollIntoView({ block: "nearest" });
}

function validate(n) {
  const s = readState();
  if (n === 1) {
    try { planLegs(s.from, s.to, s.tripType === "return"); } catch (e) { return friendlyError(e); }
    const today = isoDate(new Date());
    if (!s.date || s.date < today) return "Pick a departure date from today onwards. Time travel is not included.";
    if (s.tripType === "return" && (!s.returnDate || s.returnDate < s.date)) return "Your return date must not be before you leave. That is just leaving early.";
  }
  if (n === 4) {
    if (s.name.length < 2 || s.name.length > 40) return "Passenger name needs 2 to 40 characters. A fake one is fine.";
  }
  if (n === 5) {
    if (!s.reason) return "Please choose a reason for travelling. Any reason.";
    if (!s.t1 || !s.t2) return "You must accept both statements. Scraggy insists.";
  }
  return null;
}

function renderReview() {
  const s = readState();
  const legs = planLegs(s.from, s.to, s.tripType === "return");
  const pts = legs.reduce((sum, leg) => sum + legPoints(leg.dest, s.travelClass), 0);
  const cls = CLASSES.find((c) => c.id === s.travelClass);
  const air = [...AIRCRAFT, SURPRISE].find((a) => a.id === s.aircraft);
  const dl = $("#review");
  const rows = [
    ["Trip", s.tripType === "return" ? "Return" : "One way"],
    ["Route", legs.map((l) => `${l.flightNo}: ${placeName(l.origin)} to ${placeName(l.destination)}`).join("  |  ")],
    ["Dates", s.tripType === "return" ? `${s.date} and ${s.returnDate}` : s.date],
    ["Aircraft", air.name],
    ["Class", cls.name],
    ["Passenger", s.name],
    ["Seat", s.seat],
    ["Snack", s.snack],
    ["Bags", `${s.bags} (they will be lost in 1 to 5 places)`],
    ["Reason", s.reason],
    ["Payment", "Paid in vibes. No money will be taken."],
    ["Points you will earn", `${pts.toLocaleString("en-GB")} Scraggy Points`]
  ];
  dl.replaceChildren(...rows.flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]));
  if (user) {
    btnConfirm.textContent = "Confirm (no money will be taken)";
    loginNote.hidden = true;
  } else {
    btnConfirm.textContent = "Log in to confirm and earn points";
    loginNote.hidden = false;
  }
}

/* ---------- confirm ---------- */
async function confirm() {
  if (!user) {
    saveDraft();
    location.href = "login.html?next=book.html";
    return;
  }
  const s = readState();
  btnConfirm.disabled = true;
  setMsg(stepMsg, "Booking... (we will lose this later)", "");
  try {
    const b = await backend();
    const res = await b.bookFlight({
      origin: s.from,
      destination: s.to,
      isReturn: s.tripType === "return",
      travelClass: s.travelClass,
      aircraft: s.aircraft,
      seat: s.seat,
      date: s.date,
      returnDate: s.returnDate
    });
    showResult(res, s);
    window.dispatchEvent(new CustomEvent("scraggy:auth-changed"));
    refreshHeader();
  } catch (e) {
    setMsg(stepMsg, friendlyError(e), "error");
  } finally {
    btnConfirm.disabled = false;
  }
}

function showResult(res, s) {
  const passes = res.legs.map((leg) => {
    const air = AIRCRAFT.find((a) => a.id === leg.aircraft);
    const cls = CLASSES.find((c) => c.id === (leg.travelClass || s.travelClass));
    return el("article", { class: "pass", "aria-label": "Boarding pass " + leg.flightNo },
      el("div", { class: "pass-top" },
        el("span", { class: "flight" }, leg.flightNo),
        el("span", {}, "Booking ref: " + res.ref)),
      el("p", { class: "route" }, `${placeName(leg.origin)} to ${placeName(leg.destination)} (${leg.direction})`),
      el("dl", { class: "review" },
        el("dt", {}, "Passenger"), el("dd", {}, s.name),
        el("dt", {}, "Date"), el("dd", {}, leg.date),
        el("dt", {}, "Aircraft"), el("dd", {}, air ? air.name : leg.aircraft),
        el("dt", {}, "Class"), el("dd", {}, cls ? cls.name : ""),
        el("dt", {}, "Seat"), el("dd", {}, leg.seat || s.seat),
        el("dt", {}, "Gate"), el("dd", {}, el("a", { href: "airport.html#gate-" + leg.gate }, leg.gate + " (View in Airport Guide)")),
        el("dt", {}, "Points"), el("dd", {}, "+" + leg.points)));
  });
  result.replaceChildren(
    el("h2", {}, "You are booked (probably)"),
    el("p", { class: "msg ok", role: "status" },
      `+${res.total.toLocaleString("en-GB")} Scraggy Points. New balance: ${res.points.toLocaleString("en-GB")}.`),
    ...passes,
    el("div", { class: "actions" },
      el("a", { class: "btn", href: "points.html" }, "See my points"),
      el("a", { class: "btn secondary", href: "book.html" }, "Book another"))
  );
  result.hidden = false;
  form.hidden = true;
  stepsNav.hidden = true;
  result.scrollIntoView({ block: "start" });
}

/* ---------- init ---------- */
async function init() {
  buildOptions();
  const today = new Date();
  const in7 = new Date(today.getTime() + 7 * 864e5);
  const in14 = new Date(today.getTime() + 14 * 864e5);
  form.elements.date.min = isoDate(today);
  form.elements.returnDate.min = isoDate(today);
  form.elements.date.value = isoDate(in7);
  form.elements.returnDate.value = isoDate(in14);
  form.elements.from.value = HUB;
  form.elements.to.value = "scraggy-house";

  const q = new URLSearchParams(location.search);
  const wanted = q.get("to");
  if (wanted && ROUTES[wanted]) { form.elements.from.value = HUB; form.elements.to.value = wanted; }

  form.elements.from.addEventListener("change", () => onRouteChange("from"));
  form.elements.to.addEventListener("change", () => onRouteChange("to"));
  form.elements.tripType.forEach((r) => r.addEventListener("change", syncReturn));
  form.elements.travelClass.forEach((r) => r.addEventListener("change", buildSnacks));
  syncReturn();

  btnBack.addEventListener("click", () => showStep(step - 1));
  btnNext.addEventListener("click", () => {
    const problem = validate(step);
    if (problem) { setMsg(stepMsg, problem, "error"); return; }
    showStep(step + 1);
  });
  btnConfirm.addEventListener("click", confirm);
  form.addEventListener("submit", (e) => e.preventDefault());

  try { const b = await backend(); user = await b.getUser(); } catch { user = null; }
  if (user && !form.elements.name.value) form.elements.name.value = user.username;

  const draft = takeDraft();
  if (draft) {
    applyState(draft);
    if (user && !draft.name) form.elements.name.value = user.username;
    showStep(TOTAL_STEPS);
  } else {
    showStep(1);
  }
}

init();
