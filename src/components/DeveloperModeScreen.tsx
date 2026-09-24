import React from 'react';
import { soundFx } from '../utils/audio.js';
import { Terminal, Play } from 'lucide-react';
import { RoastIntensity } from '../types.js';

interface DeveloperModeScreenProps {
  onStartDevBattle: (intensity: RoastIntensity, userTopic?: string) => void;
  onBackToArena: () => void;
}

export const DeveloperModeScreen: React.FC<DeveloperModeScreenProps> = ({
  onStartDevBattle,
  onBackToArena,
}) => {
  const [intensity, setIntensity] = React.useState<RoastIntensity>('spicy');
  const [devSin, setDevSin] = React.useState('');

  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-14 lg:py-16 px-4 sm:px-8 lg:px-12 flex-1 flex flex-col justify-center">
      <button
        onClick={() => {
          soundFx.click();
          onBackToArena();
        }}
        className="text-xs font-mono text-zinc-500 hover:text-white transition-colors mb-6 cursor-pointer flex items-center gap-1.5 self-start py-1"
      >
        <span>← Back to Arena</span>
      </button>

      <div className="mb-8 border-b border-zinc-800/80 pb-6">
        <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1.5 font-bold">
          <Terminal className="w-3.5 h-3.5" />
          <span>TERMINAL COMBAT</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-6xl font-normal text-white mb-2">
          Developer Mode
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl">
          No pull request goes unpunished. No useEffect is too nested. Your unmerged branches are about to be exposed.
        </p>
      </div>

      {/* Terminal View */}
      <div className="border border-slate-800 bg-[#07090d] p-6 mb-8 font-mono text-xs sm:text-sm">
        <div className="text-amber-400 font-bold mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>$ roast-cli init --target="senior_engineer" --strict</span>
        </div>

        <p className="text-slate-300 leading-relaxed mb-6 font-sans text-xs sm:text-sm">
          The AI opponent targets software architecture, 4:59 PM Friday deploys, git push --force on main, and commit messages that just say "fixed bug".
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 text-xs font-mono">
          <div className="p-3 border border-slate-800">
            <span className="text-amber-400 block font-bold mb-1">[01] Git Traumas</span>
            <span className="text-slate-400 text-[11px]">Rebase collisions and unmerged branches.</span>
          </div>

          <div className="p-3 border border-slate-800">
            <span className="text-amber-400 block font-bold mb-1">[02] Syntax Crimes</span>
            <span className="text-slate-400 text-[11px]">Nested ternaries and arbitrary type casts.</span>
          </div>

          <div className="p-3 border border-slate-800">
            <span className="text-amber-400 block font-bold mb-1">[03] DevOps Sins</span>
            <span className="text-slate-400 text-[11px]">Muting PagerDuty to get eight hours of sleep.</span>
          </div>
        </div>

        {/* Custom Developer Sin Input */}
        <div className="border-t border-slate-800/80 pt-4 mt-4">
          <label className="text-xs text-zinc-400 block mb-2 font-sans font-medium">
            What's your code sin or tech stack? (Optional)
          </label>
          <input
            type="text"
            value={devSin}
            onChange={(e) => setDevSin(e.target.value)}
            placeholder='e.g. "I push directly to main without running tests"'
            maxLength={140}
            className="w-full bg-[#0b0e14] border-b-2 border-zinc-700 text-white placeholder-zinc-600 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition-colors"
          />
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-zinc-500">
            <span className="text-zinc-400">Try:</span>
            {[
              "I push directly to main without tests.",
              "I write useEffect hooks that loop indefinitely.",
              "I spend 4 hours tweaking Neovim configs.",
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  soundFx.click();
                  setDevSin(sample);
                }}
                className="underline decoration-zinc-700 hover:text-amber-300 cursor-pointer mr-2 py-0.5"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Intensity selector */}
      <div className="border-t border-slate-800 pt-6 mb-8">
        <label className="text-xs uppercase tracking-wider text-zinc-400 block mb-3 font-semibold">
          HOW HOT?
        </label>
        <div className="flex items-center gap-8 sm:gap-12">
          {(['mild', 'spicy', 'savage'] as RoastIntensity[]).map((level) => {
            const isSel = intensity === level;
            return (
              <button
                key={level}
                onClick={() => {
                  soundFx.click();
                  setIntensity(level);
                }}
                className="group cursor-pointer text-left focus:outline-none"
              >
                <div className={`text-base tracking-wide uppercase transition-colors ${
                  isSel ? 'text-amber-400 font-semibold' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}>
                  {level === 'mild' ? 'Warnings' : level === 'spicy' ? 'Errors' : 'Segfault'}
                </div>
                <div className={`h-0.5 mt-1 transition-all ${
                  isSel ? 'w-full bg-amber-400' : 'w-0 group-hover:w-1/2 bg-zinc-600'
                }`} />
                <div className="text-xs text-zinc-500 mt-1">
                  {level === 'mild' ? 'Mild jab' : level === 'spicy' ? 'Spicy' : 'Savage'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <div>
        <button
          onClick={() => {
            soundFx.click();
            onStartDevBattle(intensity, devSin.trim() || undefined);
          }}
          className="w-full sm:w-auto px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>START DEVELOPER BATTLE →</span>
        </button>
      </div>
    </div>
  );
};
