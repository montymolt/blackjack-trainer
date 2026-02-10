"use client";
import React, { useState } from 'react';
import { newDeck, draw, handValue, dealerPlays, optimalDecision, evaluate } from '@/lib/blackjack';

type Decision = { action: string; optimal: string };

export default function Play() {
  const [deck, setDeck] = useState(() => newDeck(true));
  const [player, setPlayer] = useState(() => draw(deck,2)[1]);
  const [d, setD] = useState(() => draw(draw(deck,2)[0],2)[1]);
  const [currentDeck, setCurrentDeck] = useState(() => draw(draw(deck,2)[0],2)[0]);
  const [showOptimal, setShowOptimal] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  function recordDecision(action: string) {
    const dealerUp = d[0];
    const optimal = optimalDecision(player, dealerUp);
    setDecisions(prev => [...prev, { action, optimal }]);
  }

  function hit() {
    if (result) return;
    recordDecision('hit');
    const drawRes = draw(currentDeck,1);
    setCurrentDeck(drawRes[0]);
    setPlayer(prev => prev.concat(drawRes[1]));
    const val = handValue(player.concat(drawRes[1]));
    if (val > 21) {
      // dealer not needed
      setResult('lose');
    }
  }

  function doubleDown() {
    if (result) return;
    // allow double only on first two cards
    if (player.length !== 2) return;
    recordDecision('double');
    const drawRes = draw(currentDeck,1);
    setCurrentDeck(drawRes[0]);
    const newHand = player.concat(drawRes[1]);
    setPlayer(newHand);
    // after double, player stands
    const dp = dealerPlays(currentDeck, d.slice());
    setD(dp.hand);
    setCurrentDeck(dp.deck);
    const res = evaluate(newHand, dp.hand);
    setResult(res);
  }

  function stand() {
    if (result) return;
    recordDecision('stand');
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
    setDecisions([]);
  }

  const dealerUp = d[0];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Blackjack Trainer</h1>
      <div className="mb-4">Dealer up: {dealerUp.rank}{dealerUp.suit} (val {dealerUp.value})</div>
      <div className="mb-4">Player: {player.map(c=>`${c.rank}${c.suit}`).join(' ') } - {handValue(player)}</div>
      <div className="flex gap-2 mb-4">
        <button className="btn" onClick={hit} disabled={!!result}>Hit</button>
        <button className="btn" onClick={stand} disabled={!!result}>Stand</button>
        <button className="btn" onClick={doubleDown} disabled={!!result || player.length!==2}>Double</button>
        <button className="btn" onClick={reset}>Reset</button>
      </div>
      <div className="mb-4">
        <label className="mr-2">Show optimal decision</label>
        <input type="checkbox" checked={showOptimal} onChange={e=>setShowOptimal(e.target.checked)} />
        {showOptimal && <div className="mt-2">Optimal: {optimalDecision(player,dealerUp)}</div>}
      </div>

      {result && <div className="mt-4 font-semibold">Result: {result.toUpperCase()}</div>}

      {result && (
        <div className="mt-4">
          <h3 className="font-semibold">Decision grading</h3>
          <ul className="list-disc pl-6">
            {decisions.map((d,idx)=>(
              <li key={idx} className={d.action===d.optimal? 'text-green-600':'text-red-600'}>
                You chose: {d.action} — Optimal: {d.optimal} {d.action===d.optimal? '(correct)':'(wrong)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
