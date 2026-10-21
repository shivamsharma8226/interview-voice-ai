'use client';

import React, { useState } from 'react';
import { InterviewerPersona, PERSONA_CONFIGS } from '@/lib/conversationStateMachine';

interface AvatarPresenterProps {
  persona: InterviewerPersona;
  isIntro: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  isPaused: boolean;
  onIntroComplete: () => void;
}

/** A photo-based interviewer tile with subtle live-conversation feedback. */
export const AvatarPresenter: React.FC<AvatarPresenterProps> = ({
  persona,
  isIntro,
  isSpeaking,
  isThinking,
  isListening,
  isPaused,
  onIntroComplete,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const personaConfig = PERSONA_CONFIGS[persona];
  const state = isSpeaking ? 'speaking' : isThinking ? 'thinking' : isListening ? 'listening' : 'ready';
  const stateLabel = isSpeaking
    ? 'Speaking'
    : isThinking
      ? 'Reviewing your answer'
      : isListening
        ? 'Listening'
        : isPaused
          ? 'Paused'
          : 'Ready';
  const accentClass = isSpeaking
    ? 'bg-violet-400'
    : isThinking
      ? 'bg-amber-400'
      : isListening
        ? 'bg-emerald-400'
        : 'bg-slate-400';

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      {isIntro && (
        <video
          className="absolute inset-0 z-20 h-full w-full bg-black object-contain"
          src="/videos/interviewer-intro.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={onIntroComplete}
          onError={onIntroComplete}
        />
      )}
      {!imageFailed ? (
        <img
          src="/images/alex-chen-interviewer-wide.png"
          alt={`${personaConfig.name}, ${personaConfig.title}`}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 ${
            isPaused ? 'scale-100 saturate-50' : 'scale-[1.015] interviewer-idle'
          }`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#20153f] text-center text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold">A</div>
          <p className="mt-4 text-sm font-semibold">{personaConfig.name}</p>
          <p className="mt-1 text-xs text-violet-200">Interviewer video is temporarily unavailable</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/10" />
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          isSpeaking ? 'bg-violet-500/10 opacity-100' : isThinking ? 'bg-amber-500/10 opacity-100' : 'opacity-0'
        }`}
      />

      {isSpeaking && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-8">
          <div className="flex h-8 items-center gap-1 rounded-full bg-slate-950/55 px-3 backdrop-blur-md">
            {[0, 1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className="w-1 rounded-full bg-violet-300 interviewer-wave"
                style={{ animationDelay: `${bar * 100}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/65 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-md">
        <span className={`h-2 w-2 rounded-full ${accentClass} ${state !== 'ready' ? 'animate-pulse' : ''}`} />
        {stateLabel}
      </div>

      <style>{`
        .interviewer-idle { animation: interviewer-idle 7s ease-in-out infinite; }
        .interviewer-wave { height: 8px; animation: interviewer-wave 750ms ease-in-out infinite alternate; }
        @keyframes interviewer-idle {
          0%, 100% { transform: scale(1.015) translateY(0); }
          50% { transform: scale(1.035) translateY(-3px); }
        }
        @keyframes interviewer-wave {
          from { height: 7px; opacity: .65; }
          to { height: 25px; opacity: 1; }
        }
      `}</style>
    </div>
  );
};
