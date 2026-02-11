"use client";
import React, { useEffect, useRef, useState } from 'react';
import { newDeck, draw, handValue, dealerPlays, optimalDecision, evaluate } from '@/lib/blackjack';

type Decision = { action: string; optimal: string };

const SESSION_KEY = 'blackjack:session:v1';

export default function Play() {
  const [deck, setDeck] = useState(() => newDeck(true));
  const [player, setPlayer] = useState(() => draw(deck,2)[1]);
  const [d, setD] = useState(() => draw(draw(deck,2)[0],2)[1]);
  const [currentDeck, setCurrentDeck] = useState(() => draw(draw(deck,2)[0],2)[0]);
  const [showOptimal, setShowOptimal] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  // keep state var name unused to satisfy linter — we use a ref for the source of truth
  const [_decisions, setDecisions] = useState<Decision[]>([]);
  const decisionsRef = useRef<Decision[]>([]);
  const [lastHandDecisions, setLastHandDecisions] = useState<Decision[]>([]);

  // session stats (read from localStorage during initialization to avoid setState-in-effect)
  const [totalDecisions, setTotalDecisions] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.totalDecisions) return parsed.totalDecisions;
      }
    } catch (_e) {}
    return 0;
  });
  const [correctDecisions, setCorrectDecisions] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.correctDecisions) return parsed.correctDecisions;
      }
    } catch (_e) {}
    return 0;
  });
  const [handHistory, setHandHistory] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.handHistory)) return parsed.handHistory;
      }
    } catch (_e) {}
    return [];
  }); // per-hand accuracy percentages

  useEffect(() => {
    // persist session stats
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ totalDecisions, correctDecisions, handHistory }));
    } catch (_e) {}
  }, [totalDecisions, correctDecisions, handHistory]);

  function recordDecision(action: string) {
    const dealerUp = d[0];
    const optimal = optimalDecision(player, dealerUp);
    // update a ref synchronously so finalizeHand can read the latest decisions immediately
    decisionsRef.current.push({ action, optimal });
    setDecisions([...decisionsRef.current]);
    // update session counters
    const isCorrect = action === optimal;
    setTotalDecisions(t => t + 1);
    if (isCorrect) setCorrectDecisions(c => c + 1);
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
      finalizeHand();
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
    finalizeHand();
  }

  function stand() {
    if (result) return;
    recordDecision('stand');
    const dp = dealerPlays(currentDeck, d.slice());
    setD(dp.hand);
    setCurrentDeck(dp.deck);
    const res = evaluate(player, dp.hand);
    setResult(res);
    finalizeHand();
  }

  function finalizeHand() {
    // compute per-hand accuracy and add to history
    const currentDecisions = decisionsRef.current;
    if (!currentDecisions || currentDecisions.length === 0) return;
    const correctThisHand = currentDecisions.filter(x => x.action === x.optimal).length;
    const percent = Math.round((correctThisHand / currentDecisions.length) * 100);
    setHandHistory(h => {
      const next = [percent, ...h].slice(0,50); // keep last 50
      return next;
    });
    // store last hand decisions for grading UI, then clear
    setLastHandDecisions(decisionsRef.current);
    decisionsRef.current = [];
    setDecisions([]);
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
    decisionsRef.current = [];
    setDecisions([]);
  }

  const dealerUp = d[0];
  const sessionAccuracy = totalDecisions === 0 ? 0 : Math.round((correctDecisions / totalDecisions) * 100);

  return (
    <div className="min-h-screen bg-green-900 text-white p-6">
      <div className="max-w-3xl mx-auto bg-green-800/60 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Blackjack Trainer</h1>

        <div className="mb-4 flex items-center justify-between">
          <div>Dealer up: <span className="font-semibold">{dealerUp.rank}{dealerUp.suit}</span> (val {dealerUp.value})</div>
          <div className="text-right">
            <div className="text-sm">Session accuracy</div>
            <div className="text-xl font-semibold">{sessionAccuracy}%</div>
            <div className="text-xs">{correctDecisions}/{totalDecisions} decisions</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2">Player: <span className="font-semibold">{player.map(c=>`${c.rank}${c.suit}`).join(' ') }</span> - {handValue(player)}</div>
          <div className="flex gap-3 mb-2">
            <button className="px-4 py-2 bg-white text-green-900 rounded shadow" onClick={hit} disabled={!!result}>Hit</button>
            <button className="px-4 py-2 bg-white text-green-900 rounded shadow" onClick={stand} disabled={!!result}>Stand</button>
            <button className="px-4 py-2 bg-white text-green-900 rounded shadow" onClick={doubleDown} disabled={!!result || player.length!==2}>Double</button>
            <button className="px-4 py-2 bg-transparent border border-white rounded" onClick={reset}>Reset</button>
          </div>
          <div className="mb-2">
            <label className="mr-2">Show optimal decision</label>
            <input type="checkbox" checked={showOptimal} onChange={e=>setShowOptimal(e.target.checked)} />
            {showOptimal && <div className="mt-2">Optimal: {optimalDecision(player,dealerUp)}</div>}
          </div>
        </div>

        {result && <div className="mt-2 mb-4 font-semibold">Result: {result.toUpperCase()}</div>}

        {result && (
          <div className="mt-4 mb-4 bg-white/5 p-3 rounded">
            <h3 className="font-semibold">Decision grading</h3>
            <ul className="list-disc pl-6">
              {lastHandDecisions.map((d,idx)=>(
                <li key={idx} className={d.action===d.optimal? 'text-green-200':'text-red-200'}>
                  You chose: {d.action} — Optimal: {d.optimal} {d.action===d.optimal? '(correct)':'(wrong)'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold">Recent hands (accuracy %)</h3>
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {handHistory.length===0 && <div className="text-sm">No hands yet</div>}
            {handHistory.map((h,idx)=>(
              <div key={idx} className="min-w-[64px] bg-white/10 rounded p-2 text-center">
                <div className="text-xl font-bold">{h}%</div>
                <div className="text-xs">hand {handHistory.length-idx}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
