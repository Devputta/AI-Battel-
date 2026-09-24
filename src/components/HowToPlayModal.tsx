import React from 'react';
import { soundFx } from '../utils/audio.js';
import { X } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
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
          How it works
        </h3>

        <div className="space-y-6 text-sm text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/80 pt-6">
          <div>
            <strong className="text-white block font-medium mb-1">1. The Setup</strong>
            Give the AI something about yourself—your job, your weird coffee obsession, or your bad habits. Or don't, and let it take an unprovoked swing.
          </div>

          <div>
            <strong className="text-white block font-medium mb-1">2. The 30-Second Clock</strong>
            The roast drops and your timer starts ticking immediately. Type fast and hit back before the buzzer sounds.
          </div>

          <div>
            <strong className="text-white block font-medium mb-1">3. The Comedy Judge</strong>
            The judge evaluates your response across Creativity, Comedy, and Damage. Land a genuine counter-punch and you might get a Mic Drop.
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={() => {
              soundFx.click();
              onClose();
            }}
            className="px-6 py-2.5 text-xs font-semibold tracking-wide text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
