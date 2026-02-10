"use client";
import React, { useState } from 'react';
import { newDeck, draw, handValue, dealerPlays, optimalDecision, evaluate } from '@/lib/blackjack';

export default function Play() {
  const [deck, setDeck] = useState(() => newDeck(true));
  const [player, setPlayer] = useState(() => draw(deck,2)[1]);
  const [d, setD] = useState(() => draw(draw(deck,2)[0],2)[1]);
  const [currentDeck, setCurrentDeck] = useState(() => draw(draw(deck,2)[0],2)[0]);
  const [showOptimal, setShowOptimal] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function hit() {
    if (result) return;
    const drawRes = draw(currentDeck,1);
    setCurrentDeck(drawRes[0]);
    setPlayer(prev => prev.concat(drawRes[1]));
    const val = handValue(player.concat(drawRes[1]));
    if (val > 21) {
      // dealer not needed
      setResult('lose');
    }
  }

  function stand() {
    if (result) return;
    const dp = dealerPlays(currentDeck, d.slice());
    setD(dp.hand);
    setCurrentDeck(dp.deck);
    const res = evaluate(player, dp.hand);
    setResult(res);
  }

  function reset() {
    const deck2 = newDeck(true);
    const p = draw(deck2,2)[1];
    const rest = draw(deck2,2)[0];
    const dealerH = draw(rest,2)[1];
    const rest2 = draw(rest,2)[0];
    setDeck(deck2);
    setPlayer(p);
    setD(dealerH);
    setCurrentDeck(rest2);
    setShowOptimal(false);
    setResult(null);
  }

  const dealerUp = d[0];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Blackjack Trainer</h1>
      <div className="mb-4">Dealer up: {dealerUp.rank}{dealerUp.suit} (val {dealerUp.value})</div>
      <div className="mb-4">Player: {player.map(c=>`${c.rank}${c.suit}`).join(' ') } - {handValue(player)}</div>
      <div className="flex gap-2 mb-4">
        <button className="btn" onClick={hit}>Hit</button>
        <button className="btn" onClick={stand}>Stand</button>
        <button className="btn" onClick={reset}>Reset</button>
      </div>
      <div className="mb-4">
        <label className="mr-2">Show optimal decision</label>
        <input type="checkbox" checked={showOptimal} onChange={e=>setShowOptimal(e.target.checked)} />
        {showOptimal && <div className="mt-2">Optimal: {optimalDecision(player,dealerUp)}</div>}
      </div>
      {result && <div className="mt-4 font-semibold">Result: {result.toUpperCase()}</div>}
    </div>
  );
}
