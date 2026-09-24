// Airport Guide: gates SCG001 to SCG011, plus the hidden Gate 9¾ (needs a typed spell).
import { backend } from "./backend.js";
import { refreshHeader } from "./main.js";
import { $, el, setMsg } from "./dom.js";
import { SECRET_BONUS, SECRET_CODE, SPELL, friendlyError, normalizeSpell } from "./data.js";

export const GATES = [
  { id: "SCG001", to: "Scraggy House", joke: "The easy one. Do not get used to this.", real: true },
  { id: "SCG002", to: "Mdm Wrong-Wrong's", joke: "Please arrive wrong.", real: true },
  { id: "SCG003", to: "Lujin's", joke: "Follow the signs. The signs are wrong.", real: true },
  { id: "SCG004", to: "Nowhere", joke: "A gate to a wall. Very popular." },
  { id: "SCG005", to: "Baggage claim", joke: "Your bag is at SCG003. Or SCG007. Or Lujin's." },
  { id: "SCG006", to: "Also SCG001", joke: "Same as SCG001, but further away." },
  { id: "SCG007", to: "Closed", joke: "Closed for being open." },
  { id: "SCG008", to: "Snack corner", joke: "Snacks are a state of mind." },
  { id: "SCG009", to: "Departures", joke: "Turn left. No, the other left." },
  { magic: true },
  { id: "SCG010", to: "The rest of the airport", joke: "Still lost? Good." },
  { id: "SCG011", to: "The last gate", joke: "You made it to the end. There is nothing here. Well done." }
];

const WRONG_SPELLS = [
  "Wrong spell. Try being more magical.",
  "The wall is unimpressed.",
  "That is not magic. That is typing.",
  "Mdm Wrong-Wrong says: wrong. She is also wrong about that."
];

const DIRECTIONS = [
  "Go straight, then left, then back the way you came, then wait.",
  "Follow the signs. The signs are following someone else.",
  "It is 5 minutes away. From a different airport.",
  "Turn left at the biscuit. If there is no biscuit, you have gone too far.",
  "Ask at the information desk. It is at SCG004. It is a wall."
];

let namedGate = null;
let loggedIn = false;

function gateCard(g) {
  return el("li", { class: "gate" + (g.real ? " real" : ""), id: "gate-" + g.id },
    el("div", { class: "gate-id" }, g.id),
    el("p", {}, el("strong", {}, g.to)),
    el("p", {}, g.joke),
    g.real ? el("a", { href: "book.html" }, "Book a flight") : null);
}

function magicCard() {
  const msg = el("p", { class: "msg", role: "status" });
  const input = el("input", { type: "text", id: "spell", name: "spell", autocomplete: "off", spellcheck: "false", placeholder: "Type the spell" });
  const room = el("div", { class: "secret-room", hidden: true });

  const formEl = el("form", {},
    el("div", { class: "field" }, el("label", { for: "spell" }, "Say the magic word"), input),
    el("button", { class: "btn", type: "submit" }, "Cast spell"));

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (normalizeSpell(input.value) !== SPELL) {
      setMsg(msg, WRONG_SPELLS[Math.floor(Math.random() * WRONG_SPELLS.length)], "error");
      return;
    }
    setMsg(msg, "The wall opens. Somewhere, a biscuit falls over.", "ok");
    formEl.hidden = true;
    room.hidden = false;
    room.replaceChildren(
      el("h3", {}, "The Secret Waiting Room"),
      el("p", {}, "A tiny room. A tiny bench. Scraggy is here, wearing a wizard hat (it is not a good look)."),
      el("p", {}, "“You found it. I did not lose you. I lost the gate.” — Mdm Wrong-Wrong, English Teacher"),
      loggedIn
        ? el("button", { class: "btn", type: "button", id: "claim", onclick: claim }, `Claim ${SECRET_BONUS} bonus points`)
        : el("p", { class: "note" }, el("a", { href: "login.html?next=airport.html" }, "Log in"), ` and you could have claimed ${SECRET_BONUS} bonus points here.`),
      el("p", { class: "msg", id: "claim-msg", role: "status" })
    );
  });

  async function claim() {
    const btn = $("#claim");
    const out = $("#claim-msg");
    btn.disabled = true;
    try {
      const b = await backend();
      const res = await b.claimSecret(SECRET_CODE);
      setMsg(out, `+${SECRET_BONUS} points! New balance: ${res.points.toLocaleString("en-GB")}.`, "ok");
      window.dispatchEvent(new CustomEvent("scraggy:auth-changed"));
      refreshHeader();
    } catch (e) {
      setMsg(out, friendlyError(e), "error");
    }
  }

  return el("li", { class: "gate magic", id: "gate-9-3-4" },
    el("div", { class: "gate-id" }, "Gate 9¾"),
    el("p", {}, el("strong", {}, "Magic required")),
    el("p", {}, "A solid brick wall between SCG009 and SCG010. It has a sign. The sign says “Gate 9¾”. It does not say how."),
    formEl, msg, room);
}

async function render() {
  const list = $("#gate-list");
  const cards = GATES.map((g) => (g.magic ? magicCard() : gateCard(g)));
  if (namedGate) {
    cards.push(el("li", { class: "gate real", id: "gate-named" },
      el("div", { class: "gate-id" }, "Gate " + namedGate),
      el("p", {}, el("strong", {}, "Named by you")),
      el("p", {}, "Nobody will find it. It is yours anyway.")));
  }
  list.replaceChildren(...cards);
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
}

async function init() {
  try {
    const b = await backend();
    const user = await b.getUser();
    loggedIn = !!user;
    if (user) {
      const p = await b.getProfile();
      const named = p.redemptions.find((r) => r.id === "name-gate" && r.note);
      if (named) namedGate = named.note;
    }
  } catch { loggedIn = false; }
  await render();

  const out = $("#directions-out");
  $("#directions-btn").addEventListener("click", () => {
    out.textContent = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  });
}

init();
