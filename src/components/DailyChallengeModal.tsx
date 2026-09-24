import React, { useState, useEffect } from 'react';
import { DailyData, JudgeResult } from '../types.js';
import { soundFx } from '../utils/audio.js';
import { ArrowLeft, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyChallengeModalProps {
  onBackToArena: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({ onBackToArena }) => {
  const [data, setData] = useState<DailyData | null>(null);
  const [comeback, setComeback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/daily')
      .then((res) => res.json())
      .then((d: DailyData) => {
        setData(d);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load daily challenge:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data?.secondsUntilReset) return;
    let remaining = data.secondsUntilReset;

    const updateStr = () => {
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      setTimeLeftStr(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateStr();
    const interval = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      updateStr();
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comeback.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    soundFx.submitWhoosh();

    try {
      const res = await fetch('/api/daily/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comeback: comeback.trim() }),
      });

      const responseData = await res.json();
      if (!res.ok) {
        setErrorMsg(responseData.message || 'Submission failed');
        setIsSubmitting(false);
        return;
      }

      setResult(responseData.judgeResult);
      soundFx.scoreReveal(responseData.judgeResult.overall >= 60);

      if (responseData.judgeResult.overall >= 70) {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#ffffff'],
        });
      }

      const updated = await fetch('/api/daily').then((r) => r.json());
      setData(updated);
    } catch {
      setErrorMsg('Failed to reach daily evaluation server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-14 lg:py-16 px-4 sm:px-8 lg:px-12 flex-1 flex flex-col justify-center">
      <button
        onClick={() => {
          soundFx.click();
          onBackToArena();
        }}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 sm:mb-8 cursor-pointer flex items-center gap-1.5 self-start py-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Arena</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8 sm:mb-10 pb-6 border-b border-zinc-800/60">
        <div>
          <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal text-white mb-2">
            Daily Challenge
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base">One global seed. One shot. No retries.</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400 bg-zinc-900/40 border border-zinc-800 p-2.5 px-3.5 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Streak: <strong className="text-amber-400 font-bold ml-1">{data?.streak || 0}</strong>
          </span>
          <span>·</span>
          <span>Reset in {timeLeftStr || '...'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-zinc-500 text-sm">
          Loading today's roast...
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Today's Roast Setup */}
          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-500 block mb-3 font-medium">
              TODAY'S ROAST
            </span>
            <blockquote className="font-editorial text-3xl sm:text-4xl md:text-5xl text-white font-normal leading-[1.15]">
              "{data.openingRoast}"
            </blockquote>
          </div>

          {/* Already completed note */}
          {data.completed && !result && (
            <div className="text-xs text-amber-400 border-l border-amber-400 pl-3 py-1">
              Completed today · Best Score: {data.bestScore}/100 ({data.bestVerdict})
            </div>
          )}

          {/* Result reveal if just evaluated */}
          {result && (
            <div className="py-6 border-y border-zinc-800/60 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="font-editorial text-4xl text-amber-400">{result.verdict}</span>
                <span className="font-mono text-white text-lg font-bold">{result.overall}/100</span>
              </div>
              <p className="font-editorial text-2xl text-zinc-200">
                "{result.feedback}"
              </p>
            </div>
          )}

          {/* Input Form without box borders */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-zinc-800/60">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <label htmlFor="daily-comeback" className="uppercase tracking-wider font-medium text-zinc-400">
                YOUR COMEBACK
              </label>
              <span className="tabular-nums font-mono">{comeback.length}/300</span>
            </div>

            <textarea
              id="daily-comeback"
              rows={4}
              maxLength={300}
              value={comeback}
              disabled={isSubmitting}
              onChange={(e) => setComeback(e.target.value)}
              placeholder="Write your comeback here..."
              className="w-full bg-[#0d0f14] border border-zinc-800 p-5 text-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-colors resize-none font-sans"
            />

            {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !comeback.trim()}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold tracking-wide text-zinc-950 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors cursor-pointer text-center"
              >
                {isSubmitting ? 'Evaluating...' : 'FIRE BACK →'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-red-400">Failed to load challenge.</div>
      )}
    </div>
  );
};
