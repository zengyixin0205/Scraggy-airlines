// Log in / Sign up with a username and password (Scraggy Points account).
import { backend, isDemo } from "./backend.js";
import { refreshHeader } from "./main.js";
import { $, setMsg } from "./dom.js";
import { PASSWORD_MIN, friendlyError } from "./data.js";

function safeNext() {
  const next = new URLSearchParams(location.search).get("next");
  return next && /^[a-z0-9-]+\.html$/.test(next) ? next : "points.html";
}

const tabLogin = $("#tab-login");
const tabSignup = $("#tab-signup");
const formLogin = $("#form-login");
const formSignup = $("#form-signup");

function show(which) {
  const signup = which === "signup";
  formLogin.hidden = signup;
  formSignup.hidden = !signup;
  tabLogin.setAttribute("aria-selected", String(!signup));
  tabSignup.setAttribute("aria-selected", String(signup));
}

tabLogin.addEventListener("click", () => show("login"));
tabSignup.addEventListener("click", () => show("signup"));
if (location.hash === "#signup") show("signup");

if (isDemo()) $("#demo-note").hidden = false;

async function done() {
  window.dispatchEvent(new CustomEvent("scraggy:auth-changed"));
  await refreshHeader();
  location.href = safeNext();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#msg-login");
  setMsg(msg, "Checking... (we lose things)");
  try {
    const b = await backend();
    await b.logIn(formLogin.elements.username.value, formLogin.elements.password.value);
    await done();
  } catch (err) {
    setMsg(msg, friendlyError(err), "error");
  }
});

formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#msg-signup");
  const f = formSignup.elements;
  if (f.password.value !== f.confirm.value) {
    setMsg(msg, "Those passwords do not match. Even our own records agree more.", "error");
    return;
  }
  if (f.password.value.length < PASSWORD_MIN) {
    setMsg(msg, friendlyError({ code: "bad_password" }), "error");
    return;
  }
  setMsg(msg, "Creating your account...");
  try {
    const b = await backend();
    await b.signUp(f.username.value, f.password.value);
    await done();
  } catch (err) {
    setMsg(msg, friendlyError(err), "error");
  }
});
