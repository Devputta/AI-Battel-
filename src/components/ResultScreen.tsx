import React, { useEffect, useState } from 'react';
import { BattleSession, JudgeResult } from '../types.js';
import { soundFx } from '../utils/audio.js';
import confetti from 'canvas-confetti';

interface ResultScreenProps {
  session: BattleSession;
  judgeResult: JudgeResult;
  onRematch: () => void;
  onNewMode: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  session,
  judgeResult,
  onRematch,
  onNewMode,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const isWin = judgeResult.overall >= 55;
    soundFx.scoreReveal(isWin);

    if (judgeResult.overall >= 70) {
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#ffffff', '#d4d4d8'],
        });
      } catch {}
    }
  }, [judgeResult]);

  const shareText = `AI ROAST BATTLE
Verdict: ${judgeResult.verdict.toUpperCase()} (${judgeResult.overall}/100)

Opponent: "${session.openingRoast}"
My Comeback: "${session.playerComeback || 'Time expired'}"

Judge: "${judgeResult.feedback}"`;

  const handleShare = async () => {
    soundFx.click();
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const cScore = Math.round(judgeResult.creativity / 10);
  const mScore = Math.round(judgeResult.comedy / 10);
  const dScore = Math.round(judgeResult.damage / 10);

  return (
    <div className="w-full max-w-6xl mx-auto py-8 sm:py-12 lg:py-16 px-4 sm:px-8 lg:px-12 flex-1 flex flex-col justify-center">
      {/* Top Banner / Verdict */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-3 mb-3 text-xs">
          <span className="uppercase tracking-wider text-amber-400 font-semibold">
            FINAL OUTCOME · {judgeResult.overall}/100
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400 font-mono">
            {judgeResult.overall >= 70 ? 'MIC DROP' : judgeResult.overall >= 55 ? 'WIN' : 'DEFEAT'}
          </span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[0.98] text-white">
          {judgeResult.verdict}
        </h1>
      </div>

      {/* 2-Column Desktop Grid / Stacked Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 my-6 sm:my-8 border-y border-zinc-800/60 py-8 sm:py-12 items-start">
        
        {/* Left Column: Duel Exchange */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-500 block mb-2 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>THE ROAST MACHINE DROPPED</span>
            </span>
            <blockquote className="text-zinc-300 text-lg sm:text-xl font-normal leading-relaxed pl-4 border-l-2 border-zinc-800">
              "{session.openingRoast}"
            </blockquote>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-amber-400 block mb-2 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>YOUR COMEBACK</span>
            </span>
            <blockquote className="text-white text-xl sm:text-2xl font-normal leading-relaxed pl-4 border-l-2 border-amber-400">
              {session.playerComeback ? (
                `"${session.playerComeback}"`
              ) : (
                <span className="text-zinc-500 italic">No comeback recorded before the buzzer.</span>
              )}
            </blockquote>
          </div>
        </div>

        {/* Right Column: Scores & Judge Feedback */}
        <div className="lg:col-span-5 space-y-8 lg:border-l lg:border-zinc-800/60 lg:pl-10">
          {/* Scores */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 mb-4 font-semibold">
              ROUND BREAKDOWN
            </div>

            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="tracking-wide">CREATIVITY</span>
                <span className="font-mono text-white font-bold">{cScore} / 10</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="tracking-wide">COMEDY</span>
                <span className="font-mono text-white font-bold">{mScore} / 10</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                <span className="tracking-wide">DAMAGE</span>
                <span className="font-mono text-white font-bold">{dScore} / 10</span>
              </div>
            </div>
          </div>

          {/* Judge Commentary */}
          <div className="pt-2">
            <span className="text-xs uppercase tracking-wider text-zinc-400 block mb-2 font-semibold">
              JUDGE VERDICT NOTE
            </span>
            <blockquote className="font-editorial text-xl sm:text-2xl text-zinc-200 font-normal leading-snug">
              "{judgeResult.feedback}"
            </blockquote>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
        <button
          onClick={() => {
            soundFx.click();
            onRematch();
          }}
          className="w-full sm:w-auto px-10 py-4 text-sm font-semibold tracking-wide text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer text-center"
        >
          PLAY AGAIN
        </button>

        <button
          onClick={handleShare}
          className="w-full sm:w-auto px-6 py-4 text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-center"
        >
          {copied ? '✓ Copied to clipboard' : 'Share Result'}
        </button>

        <button
          onClick={() => {
            soundFx.click();
            onNewMode();
          }}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer py-3 text-center sm:ml-auto"
        >
          Change Mode →
        </button>
      </div>
    </div>
  );
};
