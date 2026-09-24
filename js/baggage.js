// Baggage tracker: tells you where your bag is. It is never where you think.
import { $ } from "./dom.js";

const PLACES = [
  "at SCG003, or possibly SCG007",
  "in first class, having a lovely time",
  "at Lujin's (Lujin has been informed)",
  "at Mdm Wrong-Wrong's, being corrected",
  "on a different plane, going somewhere nicer than you",
  "in Scraggyton, eating dinner",
  "right behind you. Do not turn around",
  "in the Secret Waiting Room at Gate 9¾"
];

const form = $("#track-form");
const out = $("#track-out");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const tag = form.elements.tag.value.trim();
  const where = PLACES[Math.floor(Math.random() * PLACES.length)];
  out.textContent = tag
    ? `Bag ${tag.slice(0, 20)} is ${where}. Last seen: eventually.`
    : "Type a bag tag first. Any tag. We are not fussy.";
});
