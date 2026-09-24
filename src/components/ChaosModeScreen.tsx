import React, { useState } from 'react';
import { soundFx } from '../utils/audio.js';
import { Shuffle, ArrowLeft } from 'lucide-react';
import { RoastIntensity } from '../types.js';

interface ChaosModeScreenProps {
  onStartChaosBattle: (intensity: RoastIntensity, userTopic?: string) => void;
  onBackToArena: () => void;
}

const SAMPLE_MODIFIERS = [
  "Must rhyme your comeback in couplets",
  "Must include an innocent animal in the insult",
  "Must write like a corporate LinkedIn thought leader",
  "Must sound like an overly dramatic Victorian aristocrat",
  "Must insult my Wi-Fi speed and nothing else",
  "Must frame your roast as an apology",
  "Must sound like a sports commentator losing their mind",
];

export const ChaosModeScreen: React.FC<ChaosModeScreenProps> = ({
  onStartChaosBattle,
  onBackToArena,
}) => {
  const [intensity, setIntensity] = useState<RoastIntensity>('savage');
  const [previewModifier, setPreviewModifier] = useState(SAMPLE_MODIFIERS[0]);
  const [chaosTopic, setChaosTopic] = useState('');

  const handleReroll = () => {
    soundFx.click();
    const next = SAMPLE_MODIFIERS[Math.floor(Math.random() * SAMPLE_MODIFIERS.length)];
    setPreviewModifier(next);
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
      <div className="mb-8 sm:mb-10">
        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal text-white mb-3">
          30-Second Chaos
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl">
          Standard roast rules are suspended. Every round rolls an unpredictable comedic constraint that the judge strictly evaluates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start border-t border-zinc-800/60 pt-8">
        {/* Left Column: Modifier Preview */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
            <span className="uppercase tracking-wider font-semibold text-amber-400">RANDOM COMEDIC RULE</span>
            <button
              onClick={handleReroll}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 cursor-pointer text-xs transition-colors py-1 underline decoration-zinc-700 hover:decoration-amber-400"
            >
              <Shuffle className="w-3 h-3" />
              <span>Reroll Example</span>
            </button>
          </div>

          <p className="font-editorial text-3xl sm:text-4xl text-zinc-100 font-normal leading-snug my-4">
            "{previewModifier}"
          </p>
          <p className="text-xs text-zinc-500">
            A surprise comedic constraint is rolled live when your round begins. Obey the rule or take a point penalty from the judge.
          </p>
        </div>

        {/* Right Column: Intensity, Input & Launch */}
        <div className="lg:col-span-5 space-y-6">
          {/* Heat Intensity */}
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">
              HOW HOT?
            </div>
            <div className="flex items-center gap-8">
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
                      {level}
                    </div>
                    <div className={`h-0.5 mt-1 transition-all ${
                      isSel ? 'w-full bg-amber-400' : 'w-0 group-hover:w-1/2 bg-zinc-600'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic input */}
          <div className="pt-2">
            <label className="text-xs text-zinc-400 block mb-2 font-medium">
              What should I roast? (Optional)
            </label>
            <input
              type="text"
              value={chaosTopic}
              onChange={(e) => setChaosTopic(e.target.value)}
              placeholder="e.g. I collect mechanical keyboards"
              maxLength={140}
              className="w-full bg-[#0b0e14] border-b-2 border-zinc-700 text-white placeholder-zinc-600 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Launch Button */}
          <div className="pt-4">
            <button
              onClick={() => {
                soundFx.click();
                onStartChaosBattle(intensity, chaosTopic.trim() || undefined);
              }}
              className="w-full sm:w-auto px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>START CHAOS ROUND →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
