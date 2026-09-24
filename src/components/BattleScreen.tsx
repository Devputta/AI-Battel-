import React, { useState, useEffect, useRef } from 'react';
import { BattleSession } from '../types.js';
import { soundFx } from '../utils/audio.js';
import { AlertCircle } from 'lucide-react';

interface BattleScreenProps {
  session: BattleSession;
  onSubmitComeback: (comeback: string, elapsedSeconds: number, isTimedOut: boolean) => void;
  isJudging: boolean;
  onCancelBattle: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  session,
  onSubmitComeback,
  isJudging,
  onCancelBattle,
}) => {
  const [comeback, setComeback] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // 30-second countdown
  useEffect(() => {
    const startTime = Date.now();
    const durationMs = 30 * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingSeconds = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 6 && remainingSeconds > 0) {
        soundFx.tick(remainingSeconds <= 3);
      }

      if (remainingSeconds === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setHasTimedOut(true);
        soundFx.timeoutBuzzer();
        onSubmitComeback(comeback.trim(), 30, true);
      }
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onSubmitComeback, comeback]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isJudging) return;

    const trimmed = comeback.trim();
    if (!trimmed) {
      setErrorMsg("Say something before the timer expires.");
      return;
    }

    if (trimmed.length < 2) {
      setErrorMsg("Give me more than a single letter to work with.");
      return;
    }

    setErrorMsg(null);
    soundFx.submitWhoosh();
    const elapsedSeconds = 30 - timeLeft;
    onSubmitComeback(trimmed, elapsedSeconds, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Subtle urgency coloring on timer
  const timerUrgencyClass =
    timeLeft <= 5
      ? 'text-red-400'
      : timeLeft <= 10
      ? 'text-amber-400'
      : 'text-zinc-200';

  // Human commentary
  const statusNote =
    timeLeft > 22
      ? 'Your move.'
      : timeLeft > 12
      ? "Don't overthink it."
      : timeLeft > 5
      ? "Time's running."
      : 'Buzzer incoming.';

  return (
    <div className="w-full max-w-6xl mx-auto py-8 sm:py-12 lg:py-16 px-4 sm:px-8 lg:px-12 flex-1 flex flex-col justify-center">
      {/* Top: Round & Forfeit */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pb-6 sm:pb-8 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-zinc-200 font-semibold tracking-wide">ROUND 01</span>
          <span className="text-zinc-700">/</span>
          <span className="capitalize text-zinc-400">{session.category.replace('_', ' ')}</span>
          <span className="text-zinc-700">/</span>
          <span className="capitalize text-amber-400 font-medium">{session.intensity}</span>
        </div>

        <button
          onClick={onCancelBattle}
          disabled={isJudging}
          className="hover:text-zinc-200 transition-colors cursor-pointer text-zinc-500 disabled:opacity-40 py-1 px-2 -mr-2"
        >
          Forfeit
        </button>
      </div>

      {/* Chaos Modifier if active */}
      {session.modifier && (
        <div className="mt-6 text-sm sm:text-base text-amber-300 flex items-baseline gap-2 bg-amber-400/10 p-3 sm:p-4 border-l-2 border-amber-400">
          <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold shrink-0">Rule:</span>
          <span>{session.modifier}</span>
        </div>
      )}

      {/* Target topic if player provided ammunition */}
      {session.userTopic && (
        <div className="mt-6 text-sm text-zinc-400">
          <span className="text-xs uppercase tracking-wider text-zinc-500 block mb-1">Target Ammunition</span>
          <p className="text-zinc-200 text-base sm:text-lg italic">"{session.userTopic}"</p>
        </div>
      )}

      {/* Visual Centerpiece: The Roast (Large expansive stage) */}
      <div className="my-10 sm:my-14 lg:my-16">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-4 font-semibold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>THE ROAST MACHINE</span>
        </div>

        <blockquote className="font-editorial text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-normal leading-[1.08] text-balance">
          "{session.openingRoast}"
        </blockquote>
      </div>

      {/* Asymmetric Transition to Player Response */}
      <div className="pt-8 sm:pt-10 border-t border-zinc-800/60">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              YOUR TURN
            </div>
            <div className="text-xs sm:text-sm text-zinc-500 mt-1">
              {statusNote}
            </div>
          </div>

          {/* Large prominent timer on opposite side */}
          <div className="text-right">
            <span className={`font-mono text-5xl sm:text-6xl lg:text-7xl font-bold tabular-nums leading-none tracking-tight ${timerUrgencyClass}`}>
              {timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase block tracking-wider mt-1">SECONDS REMAINING</span>
          </div>
        </div>

        {/* Input Form without enclosing cards */}
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={4}
              maxLength={300}
              disabled={isJudging || hasTimedOut}
              value={comeback}
              onChange={(e) => {
                setComeback(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Write your comeback here..."
              className="w-full bg-[#0d0f14] border border-zinc-800/90 p-4 sm:p-6 text-base sm:text-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all resize-none leading-relaxed font-sans"
            />

            <div className="absolute right-4 bottom-4 text-xs font-mono text-zinc-600 tabular-nums pointer-events-none">
              {comeback.length}/300
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-zinc-500 hidden sm:block">
              Press ⌘+Enter to send before the buzzer
            </div>

            <button
              type="submit"
              disabled={isJudging || hasTimedOut || !comeback.trim()}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 text-sm font-semibold tracking-wide text-zinc-950 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all cursor-pointer flex items-center justify-center gap-2 sm:ml-auto"
            >
              {isJudging ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>JUDGING COMEBACK...</span>
                </>
              ) : (
                <span>FIRE BACK →</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
