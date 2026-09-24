// Shared page furniture: header, footer, Mdm Wrong-Wrong quote box, live clock, login state.
import { backend } from "./backend.js";
import { tierFor } from "./data.js";
import { el } from "./dom.js";
import { startClock } from "./clock.js";
import { pickAnyQuote, pickQuote } from "./quotes.js";

const NAV = [
  ["index.html", "Home"],
  ["destinations.html", "Destinations"],
  ["book.html", "Book"],
  ["airport.html", "Airport Guide"],
  ["baggage.html", "Baggage"],
  ["inflight.html", "In-Flight"],
  ["crew.html", "Crew"],
  ["fleet.html", "Fleet"],
  ["about.html", "Our CEO"],
  ["points.html", "Points"],
  ["redeem.html", "Redeem"]
];

const MASCOT = "assets/scraggy.png";
const MASCOT_FALLBACK = "assets/scraggy-placeholder.png";

function currentPage() {
  const last = location.pathname.split("/").pop();
  return last || "index.html";
}

function mascot(cls, size) {
  const img = el("img", { src: MASCOT, alt: "", width: size, height: size, class: cls });
  img.addEventListener(
    "error",
    () => {
      img.src = MASCOT_FALLBACK;
    },
    { once: true }
  );
  return img;
}

function buildHeader() {
  const host = document.getElementById("site-header");
  if (!host) return;
  const page = currentPage();

  const links = NAV.map(([href, label]) => {
    const a = el("a", { href }, label);
    if (href === page) a.setAttribute("aria-current", "page");
    return a;
  });

  const toggle = el("button", { class: "nav-toggle", type: "button", "aria-expanded": "false", "aria-controls": "site-nav" }, "Menu");
  const nav = el("nav", { id: "site-nav", class: "site-nav", "aria-label": "Main" }, links);
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  const logo = el("a", { class: "logo", href: "index.html" }, mascot("logo-img", 52), el("span", {}, "Scraggy Airlines"));
  const auth = el("div", { id: "auth-box", class: "auth-box" });

  host.replaceChildren(el("div", { class: "header-inner" }, logo, toggle, auth, nav));
}

function buildFooter() {
  const host = document.getElementById("site-footer");
  if (!host) return;
  host.replaceChildren(
    el(
      "div",
      { class: "footer-inner" },
      el("p", { class: "footer-main" }, "Scraggy Airlines. CEO: Scraggy. Legal team: also Scraggy."),
      el("p", {}, "Fly Somewhere Eventually. Every flight starts or ends at Scraggy International Airport (SIA)."),
      el("p", { class: "small" }, "Rewards and Scraggy Points have no real-world value. No real flights, bags or biscuits are involved."),
      el(
        "p",
        { class: "small" },
        "Fan-made parody site. Not affiliated with or endorsed by Nintendo, Game Freak or The Pokémon Company. Scraggy is their character. ",
        el("a", { href: "https://github.com/zengyixin0205/Scraggy-airlines/blob/main/CREDITS.md" }, "Image credits")
      )
    )
  );
}

function renderQuote(box, quote) {
  box.replaceChildren(
    el("p", { class: "quote-label" }, "Mdm Wrong-Wrong says:"),
    el("blockquote", { class: "quote-text" }, "“" + quote.text + "”"),
    el("p", { class: "quote-who" }, "— " + quote.who),
    el("button", { class: "btn small-btn", type: "button", onclick: () => renderQuote(box, pickAnyQuote()) }, "Another one")
  );
}

function buildQuote() {
  const box = document.getElementById("wrong-wrong");
  if (!box) return;
  renderQuote(box, pickQuote(box.dataset.page));
}

function buildMascots() {
  document.querySelectorAll("img[data-mascot]").forEach((img) => {
    img.src = MASCOT;
    img.addEventListener(
      "error",
      () => {
        img.src = MASCOT_FALLBACK;
      },
      { once: true }
    );
  });
}

export async function refreshHeader() {
  const box = document.getElementById("auth-box");
  if (!box) return;
  const loginLink = el("a", { class: "btn small-btn", href: "login.html" }, "Log in / Sign up");
  try {
    const b = await backend();
    const user = await b.getUser();
    if (!user) {
      box.replaceChildren(loginLink);
      return;
    }
    const profile = await b.getProfile();
    const tier = tierFor(profile.lifetime);
    const logout = el(
      "button",
      {
        class: "btn secondary small-btn",
        type: "button",
        onclick: async () => {
          await b.logOut();
          window.dispatchEvent(new CustomEvent("scraggy:auth-changed"));
          if (/^(points|redeem)\.html$/.test(currentPage())) location.reload();
        }
      },
      "Log out"
    );
    box.replaceChildren(
      el("a", { class: "who", href: "points.html" }, "Hi, " + profile.username),
      el("span", { class: "pts" }, profile.points.toLocaleString("en-GB") + " pts"),
      el("span", { class: "badge badge-" + tier.id }, tier.name),
      logout
    );
  } catch {
    box.replaceChildren(loginLink);
  }
}

window.addEventListener("scraggy:auth-changed", refreshHeader);

buildHeader();
buildFooter();
buildQuote();
buildMascots();
startClock();
refreshHeader();
