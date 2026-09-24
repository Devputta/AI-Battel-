import React from 'react';
import { GameView } from '../types.js';
import { Volume2, VolumeX, Trophy } from 'lucide-react';
import { soundFx } from '../utils/audio.js';

interface NavbarProps {
  currentView: GameView;
  onNavigate: (view: GameView) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenStats: () => void;
  onOpenHowToPlay?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isMuted,
  onToggleMute,
  onOpenStats,
  onOpenHowToPlay,
}) => {
  return (
    <header className="w-full border-b border-zinc-800/60 bg-[#0a0c10]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Title */}
        <button
          onClick={() => {
            soundFx.click();
            onNavigate('TITLE_MENU');
          }}
          className="text-left group cursor-pointer focus:outline-none flex items-center gap-2.5 shrink-0"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-sm sm:text-base font-bold tracking-tight text-zinc-100 group-hover:text-amber-400 transition-colors">
            AI ROAST BATTLE
          </span>
        </button>

        {/* Quiet Navigation */}
        <nav className="flex items-center gap-4 sm:gap-7 text-xs sm:text-sm text-zinc-400">
          <button
            onClick={() => {
              soundFx.click();
              onNavigate('TITLE_MENU');
            }}
            className={`hover:text-zinc-100 transition-colors cursor-pointer py-1.5 px-1 ${
              currentView === 'TITLE_MENU' ? 'text-amber-400 font-medium' : ''
            }`}
          >
            Arena
          </button>

          <button
            onClick={() => {
              soundFx.click();
              onNavigate('DAILY_CHALLENGE');
            }}
            className={`hover:text-zinc-100 transition-colors cursor-pointer py-1.5 px-1 ${
              currentView === 'DAILY_CHALLENGE' ? 'text-amber-400 font-medium' : ''
            }`}
          >
            Daily
          </button>

          <button
            onClick={() => {
              soundFx.click();
              if (onOpenHowToPlay) onOpenHowToPlay();
            }}
            className="hidden md:inline hover:text-zinc-100 transition-colors cursor-pointer py-1.5 px-1"
          >
            How it works
          </button>

          <button
            onClick={() => {
              soundFx.click();
              onOpenStats();
            }}
            className="hover:text-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 py-1.5 px-1"
          >
            <Trophy className="w-3.5 h-3.5 text-zinc-400" />
            <span>Record</span>
          </button>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer p-2 rounded-md hover:bg-zinc-900"
            title={isMuted ? 'Muted' : 'Sound active'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-zinc-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
