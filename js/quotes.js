// Mdm Wrong-Wrong quotes. Each page can have several; one is picked at random per visit.
const WHO = "Mdm Wrong-Wrong, English Teacher";

export const QUOTES = {
  home: [{ text: "Scraggy is haunting me.", who: WHO }],
  inflight: [{ text: "The snacks were good. The Wi-Fi was emotionally unavailable.", who: WHO }],
  points: [{ text: "I have 12 miles. Apparently this is enough for one biscuit.", who: WHO }],
  book: [{ text: "Scraggy First sounds luxurious. I demand pants.", who: WHO }],
  about: [{ text: "Scraggy is haunting me.", who: WHO }],
  destinations: [{ text: "Wrong destination. Try again. Actually, all of them are wrong.", who: WHO }],
  baggage: [{ text: "That is not your bag. Now it is your problem.", who: WHO }],
  crew: [{ text: "Wrong crew, wrong day. Very correct pilot though.", who: WHO }],
  fleet: [{ text: "Those numbers are wrong. I checked. I was wrong.", who: WHO }],
  redeem: [{ text: "That is the wrong thing to buy. Buy it anyway.", who: WHO }],
  airport: [{ text: "You are lost. I am not. I am also wrong, so it evens out.", who: WHO }],
  login: [{ text: "Wrong password. Or right. Hard to say.", who: WHO }],
  notFound: [{ text: "You are wrong. The page is also wrong. We tie.", who: WHO }]
};

export function pickQuote(page) {
  const list = QUOTES[page] || QUOTES.home;
  return list[Math.floor(Math.random() * list.length)];
}

export function pickAnyQuote() {
  const all = Object.values(QUOTES).flat();
  return all[Math.floor(Math.random() * all.length)];
}
