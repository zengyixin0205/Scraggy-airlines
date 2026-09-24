// Redeem page: spend Scraggy Points on joke rewards. Balance goes down, tier never does.
import { backend } from "./backend.js";
import { refreshHeader } from "./main.js";
import { $, el, setMsg } from "./dom.js";
import { REWARDS, friendlyError } from "./data.js";
import { pickQuote } from "./quotes.js";

const fmt = (n) => n.toLocaleString("en-GB");
let profile = null;
let api = null;

function owned(r) {
  return !!profile && r.once && profile.redemptions.some((x) => x.id === r.id);
}

function card(r) {
  const msg = el("p", { class: "msg", role: "status" });
  const noteId = "note-" + r.id;
  const note = r.needsNote
    ? el("div", { class: "field" },
        el("label", { for: noteId }, r.noteLabel),
        el("input", { type: "text", id: noteId, maxlength: "30", autocomplete: "off" }))
    : null;

  const btn = el("button", { class: "btn", type: "button" }, "Redeem for " + fmt(r.cost) + " pts");
  const article = el("article", { class: "card" },
    el("h3", {}, r.name),
    el("p", {}, r.blurb),
    el("p", {}, el("span", { class: "tag" }, fmt(r.cost) + " pts"), r.once ? el("span", { class: "tag" }, "Once per account") : null),
    note, btn, msg);

  const refreshState = () => {
    if (!profile) { btn.disabled = true; btn.textContent = "Log in to redeem"; return; }
    if (owned(r)) { btn.disabled = true; btn.textContent = "You have this"; return; }
    if (profile.points < r.cost) {
      btn.disabled = true;
      btn.textContent = `Need ${fmt(r.cost - profile.points)} more points`;
      return;
    }
    btn.disabled = false;
    btn.textContent = "Redeem for " + fmt(r.cost) + " pts";
  };
  refreshState();
  article._refresh = refreshState;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    setMsg(msg, "");
    try {
      const res = await api.redeem(r.id, note ? $("#" + noteId).value : null);
      profile = await api.getProfile();
      let text = `Redeemed! New balance: ${fmt(res.points)} points.`;
      if (r.id === "voicemail") text += ` Mdm Wrong-Wrong says: “${pickQuote("baggage").text}”`;
      if (r.id === "cockpit-selfie") text += " Scraggy is ready. The camera is not.";
      setMsg(msg, text, "ok");
      updateBalance();
      window.dispatchEvent(new CustomEvent("scraggy:auth-changed"));
      refreshHeader();
    } catch (e) {
      setMsg(msg, friendlyError(e), "error");
    }
    document.querySelectorAll("#reward-grid article").forEach((a) => a._refresh && a._refresh());
  });
  return article;
}

function updateBalance() {
  const box = $("#redeem-balance");
  box.textContent = profile ? `Your balance: ${fmt(profile.points)} points` : "Log in to see your balance.";
}

async function init() {
  try {
    api = await backend();
    const user = await api.getUser();
    if (user) profile = await api.getProfile();
  } catch { profile = null; }
  $("#redeem-guest").hidden = !!profile;
  updateBalance();
  $("#reward-grid").replaceChildren(...REWARDS.map(card));
}

init();
