'use client';

import React, { useEffect, useRef } from 'react';
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

/**
 * Fully animated cartoon avatar interviewer.
 * Pure CSS + SVG — no images needed.
 * Features: blinking eyes, lip-sync mouth, breathing body, ambient glow.
 */
export const AvatarPresenter: React.FC<AvatarPresenterProps> = ({
  persona,
  isIntro,
  isSpeaking,
  isThinking,
  isListening,
  isPaused,
  onIntroComplete,
}) => {
  const personaConfig = PERSONA_CONFIGS[persona];

  // Mouth open height: 0 when silent, animates when speaking
  const mouthOpen = isSpeaking;

  const stateLabel = isSpeaking
    ? 'Speaking'
    : isThinking
    ? 'Thinking...'
    : isListening
    ? 'Listening'
    : isPaused
    ? 'Paused'
    : 'Ready';

  const dotColor = isSpeaking
    ? 'bg-violet-400 animate-pulse'
    : isThinking
    ? 'bg-amber-400 animate-pulse'
    : isListening
    ? 'bg-emerald-400 animate-pulse'
    : 'bg-slate-500';

  // Intro completion handler with ref to prevent cancellation across re-renders
  const onIntroCompleteRef = useRef(onIntroComplete);
  useEffect(() => {
    onIntroCompleteRef.current = onIntroComplete;
  }, [onIntroComplete]);

  useEffect(() => {
    if (isIntro) {
      const t = setTimeout(() => {
        onIntroCompleteRef.current?.();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isIntro]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070b18] flex items-center justify-center">

      {/* ── Ambient glow based on state ─────────────────────────── */}
      <div
        className="absolute inset-0 transition-all duration-1000 pointer-events-none"
        style={{
          background: isSpeaking
            ? 'radial-gradient(ellipse 70% 55% at 50% 60%, rgba(109,40,217,0.28) 0%, transparent 70%)'
            : isListening
            ? 'radial-gradient(ellipse 70% 55% at 50% 60%, rgba(16,185,129,0.18) 0%, transparent 70%)'
            : isThinking
            ? 'radial-gradient(ellipse 70% 55% at 50% 60%, rgba(245,158,11,0.18) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 70% 55% at 50% 60%, rgba(30,50,100,0.3) 0%, transparent 70%)',
        }}
      />

      {/* ── Floor / desk shadow ──────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,8,20,0.9) 0%, transparent 100%)' }} />

      {/* ── Name plate ──────────────────────────────────────────── */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
        <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-sm">
          <p className="text-xs sm:text-sm font-bold text-white tracking-wide">{personaConfig.name}</p>
        </div>
        <p className="text-[10px] text-slate-400">{personaConfig.title}</p>
      </div>

      {/* ── Speaking waveform ────────────────────────────────────── */}
      {isSpeaking && (
        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-end gap-[3px] pointer-events-none">
          {[0,1,2,3,4,5,6].map((i) => (
            <span
              key={i}
              className="wave-bar w-[3px] rounded-full bg-gradient-to-t from-violet-600 to-violet-300"
              style={{ animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      )}

      {/* ── Thinking dots ────────────────────────────────────────── */}
      {isThinking && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/70 border border-amber-500/20 backdrop-blur-sm pointer-events-none">
          {[0,1,2].map((i) => (
            <span key={i} className="think-dot h-2 w-2 rounded-full bg-amber-400" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
          <span className="ml-1 text-[10px] text-amber-300/80 font-medium">Thinking...</span>
        </div>
      )}

      {/* ── Listening rings ──────────────────────────────────────── */}
      {isListening && (
        <>
          <div className="listen-ring absolute h-72 w-72 sm:h-96 sm:w-96 rounded-full border-2 border-emerald-400/15 pointer-events-none" />
          <div className="listen-ring absolute h-56 w-56 sm:h-72 sm:w-72 rounded-full border border-emerald-400/20 pointer-events-none" style={{ animationDelay: '0.7s' }} />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          CARTOON AVATAR SVG
      ══════════════════════════════════════════════════════════════ */}
      <div
        className={`relative z-10 select-none ${isPaused ? 'opacity-60 saturate-0' : ''} ${isSpeaking ? 'avatar-speaking' : !isThinking ? 'avatar-breathe' : ''}`}
        style={{ width: 'min(300px, 55vw)', maxWidth: '320px' }}
      >
        <svg
          viewBox="0 0 200 280"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))' }}
        >
          <defs>
            {/* Suit gradient */}
            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            {/* Skin gradient */}
            <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fcd7b5" />
              <stop offset="100%" stopColor="#e8a87c" />
            </radialGradient>
            {/* Hair gradient */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c1810" />
              <stop offset="100%" stopColor="#1a0f08" />
            </linearGradient>
            {/* Shirt gradient */}
            <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            {/* Tie gradient */}
            <linearGradient id="tieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
            {/* Shadow under chin */}
            <radialGradient id="chinShadow" cx="50%" cy="100%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            {/* Iris gradient */}
            <radialGradient id="irisGrad" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </radialGradient>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── BODY / SUIT ──────────────────────────────────────── */}
          {/* Suit body */}
          <ellipse cx="100" cy="265" rx="68" ry="28" fill="#0f172a" opacity="0.6" />
          <path d="M 40 280 L 42 200 Q 60 190 100 188 Q 140 190 158 200 L 160 280 Z" fill="url(#suitGrad)" />
          {/* Lapels */}
          <path d="M 100 210 L 78 198 L 72 215 L 96 225 Z" fill="#1e293b" />
          <path d="M 100 210 L 122 198 L 128 215 L 104 225 Z" fill="#1e293b" />
          {/* Shirt / tie area */}
          <path d="M 100 210 L 88 200 L 100 220 L 112 200 Z" fill="url(#shirtGrad)" />
          {/* Tie */}
          <path d="M 97 205 L 100 212 L 103 205 L 101 202 L 99 202 Z" fill="url(#tieGrad)" />
          <path d="M 98 212 L 100 240 L 102 212 Z" fill="url(#tieGrad)" />
          {/* Pocket square */}
          <rect x="126" y="210" width="8" height="5" rx="1" fill="#6d28d9" opacity="0.7" />

          {/* ── NECK ─────────────────────────────────────────────── */}
          <rect x="89" y="168" width="22" height="28" rx="8" fill="url(#skinGrad)" />
          {/* Neck shadow */}
          <rect x="89" y="180" width="22" height="16" rx="4" fill="rgba(0,0,0,0.1)" />

          {/* ── HEAD ─────────────────────────────────────────────── */}
          {/* Head shadow behind */}
          <ellipse cx="101" cy="125" rx="44" ry="48" fill="rgba(0,0,0,0.2)" transform="translate(3,4)" />
          {/* Head */}
          <ellipse cx="100" cy="120" rx="44" ry="48" fill="url(#skinGrad)" />
          {/* Chin shadow */}
          <ellipse cx="100" cy="163" rx="28" ry="8" fill="url(#chinShadow)" />

          {/* ── HAIR ─────────────────────────────────────────────── */}
          {/* Hair top */}
          <path d="M 58 105 Q 60 72 100 70 Q 140 72 142 105 Q 130 85 100 83 Q 70 85 58 105 Z" fill="url(#hairGrad)" />
          {/* Side hair left */}
          <path d="M 57 105 Q 54 115 57 128 Q 60 108 63 105 Z" fill="url(#hairGrad)" />
          {/* Side hair right */}
          <path d="M 143 105 Q 146 115 143 128 Q 140 108 137 105 Z" fill="url(#hairGrad)" />
          {/* Hair highlight */}
          <path d="M 78 75 Q 100 71 120 76 Q 108 73 100 73 Q 90 73 78 75 Z" fill="rgba(255,255,255,0.12)" />

          {/* ── EARS ─────────────────────────────────────────────── */}
          <ellipse cx="57" cy="122" rx="7" ry="9" fill="url(#skinGrad)" />
          <ellipse cx="57" cy="122" rx="4" ry="6" fill="#e8a87c" opacity="0.6" />
          <ellipse cx="143" cy="122" rx="7" ry="9" fill="url(#skinGrad)" />
          <ellipse cx="143" cy="122" rx="4" ry="6" fill="#e8a87c" opacity="0.6" />

          {/* ── EYEBROWS ─────────────────────────────────────────── */}
          {/* Left eyebrow */}
          <path
            d={isThinking ? "M 74 98 Q 83 93 90 96" : "M 74 97 Q 83 94 90 97"}
            stroke="#2c1810" strokeWidth="2.5" strokeLinecap="round" fill="none"
            className={isThinking ? 'brow-think' : ''}
          />
          {/* Right eyebrow */}
          <path
            d={isThinking ? "M 110 96 Q 117 93 126 98" : "M 110 97 Q 117 94 126 97"}
            stroke="#2c1810" strokeWidth="2.5" strokeLinecap="round" fill="none"
            className={isThinking ? 'brow-think' : ''}
          />

          {/* ── EYES ─────────────────────────────────────────────── */}
          {/* Eye whites */}
          <ellipse cx="82" cy="112" rx="10" ry="9" fill="white" />
          <ellipse cx="118" cy="112" rx="10" ry="9" fill="white" />

          {/* Irises */}
          <circle cx="82" cy="113" r="6" fill="url(#irisGrad)" />
          <circle cx="118" cy="113" r="6" fill="url(#irisGrad)" />

          {/* Pupils */}
          <circle cx="83" cy="113" r="3.5" fill="#0f172a" />
          <circle cx="119" cy="113" r="3.5" fill="#0f172a" />

          {/* Eye highlights */}
          <circle cx="84.5" cy="111" r="1.3" fill="white" opacity="0.9" />
          <circle cx="120.5" cy="111" r="1.3" fill="white" opacity="0.9" />

          {/* Eyelid blink (covers eyes) */}
          <ellipse cx="82" cy="112" rx="10" ry="9" fill="url(#skinGrad)" className="blink-lid blink-lid-l" />
          <ellipse cx="118" cy="112" rx="10" ry="9" fill="url(#skinGrad)" className="blink-lid blink-lid-r" />

          {/* ── NOSE ─────────────────────────────────────────────── */}
          <path d="M 98 123 Q 96 132 93 135 Q 100 137 107 135 Q 104 132 102 123 Z" fill="#e8a87c" opacity="0.5" />
          <ellipse cx="95" cy="135" rx="3.5" ry="2" fill="rgba(0,0,0,0.15)" />
          <ellipse cx="105" cy="135" rx="3.5" ry="2" fill="rgba(0,0,0,0.15)" />

          {/* ── CHEEKS ───────────────────────────────────────────── */}
          <ellipse cx="72" cy="138" rx="10" ry="7" fill="#f87171" opacity="0.18" />
          <ellipse cx="128" cy="138" rx="10" ry="7" fill="#f87171" opacity="0.18" />

          {/* ── MOUTH ────────────────────────────────────────────── */}
          {/* Mouth container */}
          <g transform="translate(100, 152)">
            {/* Lip outline / closed smile */}
            {!mouthOpen && (
              <path d="M -14 0 Q -7 5 0 5 Q 7 5 14 0 Q 7 3 0 3 Q -7 3 -14 0 Z" fill="#c0624a" />
            )}
            {/* Open mouth — speaking */}
            {mouthOpen && (
              <g className="mouth-speak">
                {/* Upper lip */}
                <path d="M -13 -2 Q -5 -5 0 -4 Q 5 -5 13 -2 Q 7 0 0 0 Q -7 0 -13 -2 Z" fill="#c0624a" />
                {/* Lower lip */}
                <path d="M -12 2 Q 0 8 12 2 Q 7 4 0 4 Q -7 4 -12 2 Z" fill="#d4735a" />
                {/* Teeth top */}
                <rect x="-8" y="-1" width="16" height="4" rx="2" fill="white" />
                {/* Teeth bottom */}
                <rect x="-7" y="3" width="14" height="3" rx="1.5" fill="#f1f5f9" />
                {/* Mouth cavity */}
                <ellipse cx="0" cy="4" rx="8" ry="3" fill="#7f1d1d" opacity="0.7" />
                {/* Tongue */}
                <ellipse cx="0" cy="5" rx="6" ry="2.5" fill="#f87171" opacity="0.8" />
              </g>
            )}
            {/* Lip corners */}
            <circle cx="-13" cy="0" r="2" fill="#c0624a" />
            <circle cx="13" cy="0" r="2" fill="#c0624a" />
          </g>

          {/* ── GLASSES (for tech persona) ───────────────────────── */}
          {persona === 'technical' && (
            <g opacity="0.85">
              {/* Left frame */}
              <rect x="69" y="105" width="26" height="18" rx="6" fill="none" stroke="#334155" strokeWidth="2" />
              {/* Right frame */}
              <rect x="105" y="105" width="26" height="18" rx="6" fill="none" stroke="#334155" strokeWidth="2" />
              {/* Bridge */}
              <line x1="95" y1="114" x2="105" y2="114" stroke="#334155" strokeWidth="1.5" />
              {/* Left arm */}
              <line x1="69" y1="114" x2="57" y2="114" stroke="#334155" strokeWidth="1.5" />
              {/* Right arm */}
              <line x1="131" y1="114" x2="143" y2="114" stroke="#334155" strokeWidth="1.5" />
              {/* Lens glare */}
              <path d="M 73 108 Q 76 106 80 108" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" strokeLinecap="round" />
              <path d="M 109 108 Q 112 106 116 108" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* State glow ring behind head */}
          {(isSpeaking || isListening) && (
            <ellipse
              cx="100" cy="120" rx="48" ry="52"
              fill="none"
              stroke={isSpeaking ? 'rgba(139,92,246,0.35)' : 'rgba(52,211,153,0.3)'}
              strokeWidth="3"
              filter="url(#glow)"
              className={isSpeaking ? 'ring-speak' : 'ring-listen'}
            />
          )}
        </svg>
      </div>

      {/* State badge */}
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-md z-20">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="hidden sm:inline">{stateLabel}</span>
      </div>

      {/* Intro badge — floating chip instead of dark obscuring screen */}
      {isIntro && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/40 backdrop-blur-md flex items-center gap-2 shadow-lg">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-400 think-dot" style={{ animationDelay: `${i * 180}ms` }} />
            ))}
          </div>
          <span className="text-[11px] font-medium text-indigo-200">Alex is joining your interview...</span>
        </div>
      )}

      {/* CSS */}
      <style>{`
        /* Avatar breathing */
        .avatar-breathe { animation: avatarBreathe 4.5s ease-in-out infinite; transform-origin: center bottom; }
        @keyframes avatarBreathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-4px) scale(1.01); }
        }

        /* Speaking head movement */
        .avatar-speaking { animation: avatarSpeakBob 0.6s ease-in-out infinite alternate; transform-origin: center bottom; }
        @keyframes avatarSpeakBob {
          0%   { transform: translateY(0px) rotate(0deg); }
          50%  { transform: translateY(-3px) rotate(0.4deg); }
          100% { transform: translateY(-1px) rotate(-0.4deg); }
        }

        /* Eye blinking */
        .blink-lid { transform: scaleY(0); transform-origin: center 112px; animation: blink 4s ease-in-out infinite; }
        .blink-lid-r { animation-delay: 0.05s; }
        @keyframes blink {
          0%, 88%, 100% { transform: scaleY(0); }
          92%, 96%      { transform: scaleY(1); }
        }

        /* Mouth speaking — dynamic lip sync animation */
        .mouth-speak { animation: mouthMove 160ms cubic-bezier(0.4, 0, 0.2, 1) infinite alternate; transform-origin: 0px 3px; }
        @keyframes mouthMove {
          0%   { transform: scaleY(0.3) scaleX(0.85); }
          50%  { transform: scaleY(1.1) scaleX(1.05); }
          100% { transform: scaleY(0.6) scaleX(0.95); }
        }

        /* Thinking brow raise */
        .brow-think { animation: browRaise 1.2s ease-in-out infinite alternate; }
        @keyframes browRaise {
          from { transform: translateY(0); }
          to   { transform: translateY(-2px); }
        }

        /* Glow rings */
        .ring-speak  { animation: ringPulse 1.4s ease-in-out infinite alternate; }
        .ring-listen { animation: ringPulse 2.0s ease-in-out infinite alternate; }
        @keyframes ringPulse {
          from { opacity: 0.2; stroke-width: 2; }
          to   { opacity: 0.7; stroke-width: 4; }
        }

        /* Waveform bars */
        .wave-bar { height: 5px; animation: waveBounce 480ms ease-in-out infinite alternate; }
        @keyframes waveBounce {
          from { height: 4px;  opacity: 0.5; }
          to   { height: 20px; opacity: 1;   }
        }

        /* Thinking dots */
        .think-dot { animation: dotBounce 0.6s ease-in-out infinite alternate; }
        @keyframes dotBounce {
          from { transform: translateY(0);    opacity: 0.4; }
          to   { transform: translateY(-6px); opacity: 1;   }
        }

        /* Listening ring */
        .listen-ring { animation: listenPulse 2.6s ease-out infinite; }
        @keyframes listenPulse {
          0%   { transform: scale(0.92); opacity: 0.6; }
          50%  { transform: scale(1.08); opacity: 0.15; }
          100% { transform: scale(0.92); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};
