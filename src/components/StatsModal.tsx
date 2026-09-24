import React, { useEffect, useState } from 'react';
import { PlayerStats, BattleSession } from '../types.js';
import { soundFx } from '../utils/audio.js';
import { X } from 'lucide-react';

interface StatsModalProps {
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [recentBattles, setRecentBattles] = useState<BattleSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/battle/history')
      .then((res) => res.json())
      .then((d) => {
        setStats(d.stats);
        setRecentBattles(d.battles || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load stats:', err);
        setIsLoading(false);
      });
  }, []);

  const winRate =
    stats && stats.totalBattles > 0
      ? Math.round((stats.wins / stats.totalBattles) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0e1117] border border-zinc-800 w-full max-w-xl p-5 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => {
            soundFx.click();
            onClose();
          }}
          className="absolute top-5 sm:top-6 right-5 sm:right-6 text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-editorial text-3xl sm:text-4xl font-normal text-white mb-6">
          Player Record
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-500">Loading history...</div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Simple Clean Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 text-left border-y border-zinc-800/80 py-4">
              <div>
                <span className="text-xs text-zinc-500 block">Rounds</span>
                <span className="text-xl font-mono font-bold text-white tabular-nums">{stats.totalBattles}</span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 block">Win Rate</span>
                <span className="text-xl font-mono font-bold text-amber-400 tabular-nums">{winRate}%</span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 block">Best Score</span>
                <span className="text-xl font-mono font-bold text-white tabular-nums">{stats.highestScore}</span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 block">Streak</span>
                <span className="text-xl font-mono font-bold text-amber-400 tabular-nums">{stats.dailyStreak}</span>
              </div>
            </div>

            {/* Recent Rounds */}
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
                Recent Rounds
              </div>

              {recentBattles.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6">No rounds logged yet.</p>
              ) : (
                <div className="divide-y divide-zinc-800/60 max-h-52 overflow-y-auto text-xs">
                  {recentBattles.map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="truncate flex-1">
                        <span className="text-zinc-200 block truncate">
                          "{b.playerComeback || b.openingRoast}"
                        </span>
                        <span className="text-zinc-500 capitalize">
                          {b.category.replace('_', ' ')} · {b.intensity}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-amber-400 tabular-nums">
                          {b.judgeResult?.overall ?? 0}/100
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-red-400">Failed to load statistics.</div>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={() => {
              soundFx.click();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
