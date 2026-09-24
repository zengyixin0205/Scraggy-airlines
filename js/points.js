// Scraggy Points page: balance, tier, progress and history.
import { backend } from "./backend.js";
import { $, el } from "./dom.js";
import { TIERS, nextTier, tierFor } from "./data.js";

function fmt(n) {
  return n.toLocaleString("en-GB");
}

function renderTierTable(lifetime) {
  const current = lifetime === null ? null : tierFor(lifetime);
  const body = $("#tier-rows");
  body.replaceChildren(
    ...TIERS.map((t) =>
      el("tr", { class: current && current.id === t.id ? "you" : "" },
        el("td", {}, el("span", { class: "badge badge-" + t.id }, t.name)),
        el("td", { class: "num" }, t.min === 0 ? "0" : fmt(t.min) + "+"),
        el("td", {}, t.perk))
    )
  );
}

async function init() {
  const guest = $("#points-guest");
  const member = $("#points-member");
  let b, user;
  try {
    b = await backend();
    user = await b.getUser();
  } catch { user = null; }

  if (!user) {
    guest.hidden = false;
    member.hidden = true;
    renderTierTable(null);
    return;
  }

  let p;
  try {
    p = await b.getProfile();
  } catch {
    guest.hidden = false;
    renderTierTable(null);
    return;
  }

  guest.hidden = true;
  member.hidden = false;
  const tier = tierFor(p.lifetime);
  const next = nextTier(p.lifetime);

  $("#pts-name").textContent = p.username;
  $("#pts-balance").textContent = fmt(p.points);
  $("#pts-lifetime").textContent = fmt(p.lifetime);
  const badge = $("#pts-tier");
  badge.textContent = tier.name;
  badge.className = "badge badge-" + tier.id;
  $("#pts-perk").textContent = tier.perk;

  const bar = $("#pts-progress");
  const text = $("#pts-next");
  if (next) {
    bar.max = next.min - tier.min;
    bar.value = p.lifetime - tier.min;
    text.textContent = `${fmt(next.min - p.lifetime)} more lifetime points to reach ${next.name}.`;
  } else {
    bar.max = 1;
    bar.value = 1;
    text.textContent = "You have reached the top. There is nothing above the pants.";
  }

  const rows = $("#ledger-rows");
  if (!p.ledger.length) {
    rows.replaceChildren(el("tr", {}, el("td", { colspan: "3" }, "Nothing yet. Book a flight. Eventually.")));
  } else {
    rows.replaceChildren(
      ...p.ledger.slice(0, 50).map((l) =>
        el("tr", {},
          el("td", {}, new Date(l.t).toLocaleDateString("en-GB")),
          el("td", {}, l.label),
          el("td", { class: "num " + (l.delta >= 0 ? "pos" : "neg") }, (l.delta >= 0 ? "+" : "") + fmt(l.delta)))
      )
    );
  }
  renderTierTable(p.lifetime);
}

init();
