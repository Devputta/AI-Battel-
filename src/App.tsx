/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BattleSession,
  GameView,
  JudgeResult,
  RoastCategory,
  RoastIntensity,
  RoastMode,
} from './types.js';
import { Navbar } from './components/Navbar.js';
import { BattleScreen } from './components/BattleScreen.js';
import { ResultScreen } from './components/ResultScreen.js';
import { DeveloperModeScreen } from './components/DeveloperModeScreen.js';
import { ChaosModeScreen } from './components/ChaosModeScreen.js';
import { DailyChallengeModal } from './components/DailyChallengeModal.js';
import { StatsModal } from './components/StatsModal.js';
import { HowToPlayModal } from './components/HowToPlayModal.js';
import { soundFx, isSoundMuted, setSoundMuted } from './utils/audio.js';
import stageFlowImg from './assets/images/roast_stage_flow_1790264920001.jpg';
import judgeMicImg from './assets/images/comedy_judge_mic_1790264933070.jpg';

export default function App() {
  const [currentView, setCurrentView] = useState<GameView>('TITLE_MENU');
  const [selectedMode, setSelectedMode] = useState<RoastMode>('standard');
  const [selectedCategory, setSelectedCategory] = useState<RoastCategory>('general');
  const [selectedIntensity, setSelectedIntensity] = useState<RoastIntensity>('spicy');
  const [userTopic, setUserTopic] = useState<string>('');

  // Battle session state
  const [currentSession, setCurrentSession] = useState<BattleSession | null>(null);
  const [currentJudgeResult, setCurrentJudgeResult] = useState<JudgeResult | null>(null);
  const [isStartingBattle, setIsStartingBattle] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & settings
  const [isMuted, setIsMuted] = useState(isSoundMuted());
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
  };

  const handleStartBattle = async (
    modeOverride?: RoastMode,
    categoryOverride?: RoastCategory,
    intensityOverride?: RoastIntensity,
    topicOverride?: string
  ) => {
    soundFx.click();
    setIsStartingBattle(true);
    setErrorMessage(null);

    const mode = modeOverride || selectedMode;
    const category = categoryOverride || selectedCategory;
    const intensity = intensityOverride || selectedIntensity;
    const topic = topicOverride !== undefined ? topicOverride : (userTopic.trim() || undefined);

    try {
      const res = await fetch('/api/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, category, intensity, userTopic: topic }),
      });

      if (!res.ok) {
        throw new Error('Failed to start battle');
      }

      const data = await res.json();
      const session: BattleSession = {
        id: data.sessionId,
        mode: data.mode,
        category: data.category,
        intensity: data.intensity,
        modifier: data.modifier,
        userTopic: data.userTopic || topic,
        openingRoast: data.openingRoast,
        startedAt: data.startedAt,
        expiresAt: data.startedAt + (data.durationSeconds + 5) * 1000,
        status: 'active',
      };

      setCurrentSession(session);
      setCurrentJudgeResult(null);
      setCurrentView('ACTIVE_BATTLE');
      soundFx.battleStart();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('The roast machine coughed. Try starting another round.');
    } finally {
      setIsStartingBattle(false);
    }
  };

  const handleSubmitComeback = async (
    comeback: string,
    elapsedSeconds: number,
    isTimedOut: boolean
  ) => {
    if (!currentSession) return;

    setIsJudging(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/battle/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          comeback,
          elapsedSeconds,
          isTimedOut,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Judging failed');
      }

      const updatedSession: BattleSession = {
        ...currentSession,
        status: 'completed',
        playerComeback: comeback,
        judgeResult: data.judgeResult,
        elapsedSeconds,
        isTimedOut,
      };

      setCurrentSession(updatedSession);
      setCurrentJudgeResult(data.judgeResult);
      setCurrentView('RESULT_SCREEN');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'The judge choked on their drink. Give it another shot.');
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-100 flex flex-col font-sans selection:bg-amber-400/30">
      {/* Clean Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setErrorMessage(null);
          setCurrentView(view);
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenStats={() => {
          soundFx.click();
          setShowStatsModal(true);
        }}
        onOpenHowToPlay={() => {
          soundFx.click();
          setShowHowToPlay(true);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {errorMessage && (
          <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-8 lg:px-12 w-full">
            <div className="p-4 bg-red-950/50 border border-red-900 text-sm text-red-200 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-white text-sm ml-3 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: TITLE / ARENA HOMEPAGE */}
        {currentView === 'TITLE_MENU' && (
          <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 flex flex-col justify-start">
            
            {/* Top Stage Area: Visual Flow & Direct Input */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Side: Crisp Hero, Prompt Input, and Fire Button */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="mb-6">
                  {/* Keep "Say something. Get roasted. Fire back." in small / modest size */}
                  <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-zinc-100 tracking-tight leading-snug">
                    Say something. Get roasted. <span className="italic text-amber-400">Fire back.</span>
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed mt-2 max-w-lg">
                    Give the roast machine an angle to attack. Take the burn on the chin, then unleash your counter-punch in 30 seconds.
                  </p>
                </div>

                {/* Input Area (No nested card boxes, clean responsive space) */}
                <div className="w-full max-w-xl">
                  <div className="text-xs uppercase tracking-wider text-zinc-400 font-mono mb-2.5">
                    WHAT SHOULD I GIVE YOU?
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        id="user-topic-input"
                        type="text"
                        value={userTopic}
                        onChange={(e) => setUserTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleStartBattle();
                          }
                        }}
                        placeholder="I'm an IIT professor"
                        maxLength={140}
                        className="w-full bg-[#0d0f15] border-b-2 border-zinc-700 focus:border-amber-400 text-white placeholder-zinc-600 px-4 py-3.5 text-base sm:text-lg font-sans focus:outline-none transition-colors"
                      />
                      {userTopic.trim() && (
                        <button
                          type="button"
                          onClick={() => setUserTopic('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer p-1"
                          title="Clear"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Example prompts as human text links */}
                    <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-y-1.5">
                      <span className="mr-1 text-zinc-400 font-mono">Try:</span>
                      {[
                        "I write Python for a living.",
                        "I have four monitors and no social life.",
                        "I drink too much coffee.",
                      ].map((sample, idx) => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => {
                            soundFx.click();
                            setUserTopic(sample);
                          }}
                          className="underline decoration-zinc-700 hover:text-amber-300 cursor-pointer mr-2.5 py-0.5 transition-colors"
                        >
                          {sample}
                          {idx < 2 ? ' ·' : ''}
                        </button>
                      ))}
                    </div>

                    {/* Bold Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleStartBattle()}
                        disabled={isStartingBattle}
                        className="w-full sm:w-auto px-10 py-3.5 text-sm font-semibold tracking-wider uppercase text-zinc-950 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isStartingBattle ? (
                          <>
                            <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                            <span>ENTERING THE ARENA...</span>
                          </>
                        ) : (
                          <span>ROAST ME →</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Visual Flow & Illustrated Game Stage (Replaces cluttered box cards) */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="relative overflow-hidden border border-zinc-800/80 bg-[#090b10] group">
                  {/* Generated Indie Stage Artwork */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                    <img
                      src={stageFlowImg}
                      alt="Roast Battle Stage"
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-95 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-black/30 to-transparent" />
                    
                    {/* Small Mascot Stamp */}
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-full border border-amber-400/40 overflow-hidden shadow-lg bg-black/60">
                      <img
                        src={judgeMicImg}
                        alt="AI Judge"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="absolute top-3 left-3 text-[11px] font-mono tracking-widest uppercase text-amber-400/90 bg-black/60 px-2 py-0.5 border border-amber-400/20">
                      LIVE COMEDY ARENA
                    </div>
                  </div>

                  {/* 3-Step Visual Narrative Flow */}
                  <div className="p-4 sm:p-5 pt-3">
                    <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
                      HOW A MATCH UNFOLDS
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-left">
                      <div className="space-y-1">
                        <div className="text-amber-400 font-mono text-xs font-semibold">01 · GIVE</div>
                        <div className="text-xs text-zinc-300 font-medium">Your Hook</div>
                        <div className="text-[11px] text-zinc-500 leading-tight">Hand over your job, ego, or quirk.</div>
                      </div>

                      <div className="space-y-1 border-l border-zinc-800/80 pl-3">
                        <div className="text-amber-400 font-mono text-xs font-semibold">02 · BURN</div>
                        <div className="text-xs text-zinc-300 font-medium">The Roast</div>
                        <div className="text-[11px] text-zinc-500 leading-tight">AI comic delivers an uncensored punchline.</div>
                      </div>

                      <div className="space-y-1 border-l border-zinc-800/80 pl-3">
                        <div className="text-amber-400 font-mono text-xs font-semibold">03 · FIGHT</div>
                        <div className="text-xs text-zinc-300 font-medium">30s Comeback</div>
                        <div className="text-[11px] text-zinc-500 leading-tight">Hit back before time runs out to score.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* DOWN BELOW: The Poster-Style GAME SETUP Screen */}
            <div className="mt-14 sm:mt-20 pt-10 border-t border-zinc-800">
              
              <div className="flex items-baseline justify-between mb-8">
                <div className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  PICK YOUR FIGHT
                </div>
                <div className="text-xs text-zinc-600">
                  Author your match
                </div>
              </div>

              {/* Mode Selection: Dominant STANDARD Hero, Smaller Alternatives (No cards!) */}
              <div className="mb-12">
                {/* Primary Choice: STANDARD */}
                <div
                  onClick={() => {
                    soundFx.click();
                    setSelectedMode('standard');
                  }}
                  className="cursor-pointer group inline-block text-left mb-8"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-editorial text-4xl sm:text-5xl md:text-6xl text-white group-hover:text-amber-300 transition-colors">
                      STANDARD
                    </span>
                    {selectedMode === 'standard' && (
                      <span className="text-xs font-mono text-amber-400 tracking-wider uppercase">
                        [ SELECTED ]
                      </span>
                    )}
                  </div>
                  <div
                    className={`h-0.5 mt-2 transition-all duration-300 ${
                      selectedMode === 'standard' ? 'w-28 bg-amber-400' : 'w-0 group-hover:w-16 bg-zinc-600'
                    }`}
                  />
                  <p className="text-base sm:text-lg text-zinc-300 font-editorial italic mt-3">
                    The classic roast battle.
                  </p>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    One topic. One counter-punch. Thirty seconds.
                  </p>
                </div>

                {/* Secondary Alternatives: Subordinated Hierarchy (No cards!) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 pt-4 border-t border-zinc-800/60">
                  {/* 30 Seconds Chaos */}
                  <div
                    onClick={() => {
                      soundFx.click();
                      setCurrentView('CHAOS_MODE');
                    }}
                    className="cursor-pointer group text-left"
                  >
                    <div className="text-sm font-semibold tracking-wide text-zinc-300 group-hover:text-amber-400 transition-colors">
                      30 SECONDS CHAOS →
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Think fast. Random comedic rules and wild modifiers.
                    </div>
                  </div>

                  {/* Developer Mode */}
                  <div
                    onClick={() => {
                      soundFx.click();
                      setCurrentView('DEVELOPER_MODE');
                    }}
                    className="cursor-pointer group text-left"
                  >
                    <div className="text-sm font-semibold tracking-wide text-zinc-300 group-hover:text-amber-400 transition-colors">
                      DEVELOPER MODE →
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      For engineers who commit directly to main on Friday.
                    </div>
                  </div>

                  {/* Daily Challenge */}
                  <div
                    onClick={() => {
                      soundFx.click();
                      setCurrentView('DAILY_CHALLENGE');
                    }}
                    className="cursor-pointer group text-left"
                  >
                    <div className="text-sm font-semibold tracking-wide text-zinc-300 group-hover:text-amber-400 transition-colors">
                      DAILY CHALLENGE →
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      One prompt per day. Compete for the global record.
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard Options: Topic & Heat (Text Only, No Cards!) */}
              {selectedMode === 'standard' && (
                <div className="pt-8 border-t border-zinc-800/60 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
                  {/* What are we roasting? (Text List with Yellow Dot) */}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-400 font-mono mb-4">
                      WHAT ARE WE ROASTING?
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'general', label: 'Everyday life' },
                        { id: 'tech_work', label: 'Work & Tech' },
                        { id: 'lifestyle', label: 'Habits' },
                        { id: 'gaming', label: 'Gaming' },
                      ].map((cat) => {
                        const isSel = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              soundFx.click();
                              setSelectedCategory(cat.id as RoastCategory);
                            }}
                            className={`flex items-center gap-2.5 text-base sm:text-lg cursor-pointer transition-all ${
                              isSel
                                ? 'text-amber-400 font-medium translate-x-1'
                                : 'text-zinc-400 hover:text-zinc-200 hover:translate-x-1'
                            }`}
                          >
                            <span className={`text-xs ${isSel ? 'text-amber-400' : 'text-transparent'}`}>
                              ●
                            </span>
                            <span className={isSel ? 'underline decoration-amber-400/50 underline-offset-4' : ''}>
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* How Hot? (Text Choices with Underline/Dot, No Cards!) */}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-400 font-mono mb-4">
                      HOW HOT?
                    </div>
                    <div className="flex items-start gap-8 sm:gap-12 pt-1">
                      {[
                        { id: 'mild', label: 'Mild', desc: 'Playful jab' },
                        { id: 'spicy', label: 'Spicy', desc: 'Direct hit' },
                        { id: 'savage', label: 'Savage', desc: 'No mercy' },
                      ].map((lvl) => {
                        const isSel = selectedIntensity === lvl.id;
                        return (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => {
                              soundFx.click();
                              setSelectedIntensity(lvl.id as RoastIntensity);
                            }}
                            className="group cursor-pointer text-left focus:outline-none"
                          >
                            <div className={`text-base sm:text-lg tracking-wide uppercase transition-colors ${
                              isSel ? 'text-amber-400 font-semibold' : 'text-zinc-400 group-hover:text-zinc-200'
                            }`}>
                              {lvl.label}
                            </div>
                            <div className={`h-0.5 mt-1 transition-all ${
                              isSel ? 'w-full bg-amber-400' : 'w-0 group-hover:w-1/2 bg-zinc-600'
                            }`} />
                            <div className="text-xs text-zinc-500 mt-1">{lvl.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* VIEW 2: ACTIVE BATTLE SCREEN */}
        {currentView === 'ACTIVE_BATTLE' && currentSession && (
          <BattleScreen
            session={currentSession}
            onSubmitComeback={handleSubmitComeback}
            isJudging={isJudging}
            onCancelBattle={() => {
              soundFx.click();
              setCurrentView('TITLE_MENU');
            }}
          />
        )}

        {/* VIEW 3: RESULT SCREEN */}
        {currentView === 'RESULT_SCREEN' && currentSession && currentJudgeResult && (
          <ResultScreen
            session={currentSession}
            judgeResult={currentJudgeResult}
            onRematch={() => handleStartBattle(currentSession.mode, currentSession.category, currentSession.intensity, currentSession.userTopic)}
            onNewMode={() => setCurrentView('TITLE_MENU')}
          />
        )}

        {/* VIEW 4: DEVELOPER MODE SCREEN */}
        {currentView === 'DEVELOPER_MODE' && (
          <DeveloperModeScreen
            onStartDevBattle={(intensity, devTopic) => handleStartBattle('developer', 'developer', intensity, devTopic)}
            onBackToArena={() => setCurrentView('TITLE_MENU')}
          />
        )}

        {/* VIEW 5: CHAOS MODE SCREEN */}
        {currentView === 'CHAOS_MODE' && (
          <ChaosModeScreen
            onStartChaosBattle={(intensity, chaosTopic) => handleStartBattle('chaos', 'general', intensity, chaosTopic)}
            onBackToArena={() => setCurrentView('TITLE_MENU')}
          />
        )}

        {/* VIEW 6: DAILY CHALLENGE SCREEN */}
        {currentView === 'DAILY_CHALLENGE' && (
          <DailyChallengeModal
            onBackToArena={() => setCurrentView('TITLE_MENU')}
          />
        )}
      </main>

      {/* Global Modals */}
      {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} />}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-zinc-800/40 py-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>AI Roast Battle · A tiny independent comedy game.</div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                soundFx.click();
                setShowHowToPlay(true);
              }}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => {
                soundFx.click();
                setShowStatsModal(true);
              }}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Player Record
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
