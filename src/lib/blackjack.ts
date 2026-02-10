export type Card = { suit: string; rank: string; value: number };

const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUITS = ['♠','♥','♦','♣'];

export function newDeck(shuffle = true) {
  const deck: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      let value = 0;
      if (r === 'A') value = 11;
      else if (['J','Q','K'].includes(r)) value = 10;
      else value = parseInt(r, 10);
      deck.push({ suit: s, rank: r, value });
    }
  }
  if (shuffle) return shuffleDeck(deck);
  return deck;
}

export function shuffleDeck(deck: Card[]) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function draw(deck: Card[], n = 1) {
  return [deck.slice(n), deck.slice(0,n)];
}

export function handValue(cards: Card[]) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += c.value;
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10; // count Ace as 1 instead of 11
    aces--;
  }
  return total;
}

export function isBlackjack(cards: Card[]) {
  return cards.length === 2 && handValue(cards) === 21;
}

export function dealerPlays(deck: Card[], dealerHand: Card[]) {
  let d = deck.slice();
  let hand = dealerHand.slice();
  while (handValue(hand) < 17) {
    const drawRes = draw(d,1);
    d = drawRes[0];
    hand = hand.concat(drawRes[1]);
  }
  return { deck: d, hand };
}

// very simple basic strategy helper: return 'stand' if total>=12 and dealer up 2-6 => stand, otherwise hit for totals < 17
export function optimalDecision(playerHand: Card[], dealerUp: Card) {
  const total = handValue(playerHand);
  // simple rules
  if (total >= 17) return 'stand';
  if (total <= 11) return 'hit';
  // totals 12-16
  const dealerVal = dealerUp.value === 11 ? 11 : dealerUp.value;
  if (dealerVal >= 2 && dealerVal <= 6) return 'stand';
  return 'hit';
}

export function evaluate(playerHand: Card[], dealerHand: Card[]) {
  const p = handValue(playerHand);
  const d = handValue(dealerHand);
  if (p > 21) return 'lose';
  if (d > 21) return 'win';
  if (p > d) return 'win';
  if (p < d) return 'lose';
  return 'push';
}
