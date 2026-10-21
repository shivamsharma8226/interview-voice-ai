'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PERSONA_CONFIGS, InterviewerPersona } from '@/lib/conversationStateMachine';

interface AvatarPresenterProps {
  persona: InterviewerPersona;
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  isPaused: boolean;
}

/**
 * AvatarPresenter — Animated AI interviewer avatar.
 * 
 * Uses CSS animations to render a realistic-looking human avatar with:
 * - Blinking eyes with natural timing
 * - Mouth animation synchronized with isSpeaking state  
 * - Idle breathing / subtle head movement
 * - Thinking pulsation when isThinking
 * - Ambient particle/glow effects
 * 
 * This is a locally-rendered animated avatar that works without any paid API.
 * For production, replace the avatar SVG/mesh with a HeyGen or D-ID stream
 * by swapping the <AnimatedFace> section with the provider's video element.
 */
export const AvatarPresenter: React.FC<AvatarPresenterProps> = ({
  persona,
  isSpeaking,
  isThinking,
  isListening,
  isPaused,
}) => {
  const personaConfig = PERSONA_CONFIGS[persona];
  const [blinkState, setBlinkState] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0); // 0–1
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Natural blinking: every 2–5 seconds, blink for 150ms
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 3000;
      blinkTimerRef.current = setTimeout(() => {
        setBlinkState(true);
        setTimeout(() => {
          setBlinkState(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // Mouth animation when speaking
  useEffect(() => {
    if (isSpeaking) {
      mouthTimerRef.current = setInterval(() => {
        setMouthOpen(0.2 + Math.random() * 0.7);
      }, 120);
    } else {
      if (mouthTimerRef.current) clearInterval(mouthTimerRef.current);
      setMouthOpen(0);
    }
    return () => {
      if (mouthTimerRef.current) clearInterval(mouthTimerRef.current);
    };
  }, [isSpeaking]);

  const gradientId = `grad-${persona}`;

  const statusRingColor = isSpeaking
    ? '#6366f1'
    : isThinking
    ? '#f59e0b'
    : isListening
    ? '#10b981'
    : isPaused
    ? '#64748b'
    : '#1e293b';

  const statusRingOpacity = isSpeaking || isThinking || isListening ? 1 : 0.4;

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Ambient glow background */}
      <div
        className="absolute inset-0 rounded-3xl transition-all duration-700"
        style={{
          background: isSpeaking
            ? 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)'
            : isThinking
            ? 'radial-gradient(ellipse at center, rgba(245,158,11,0.12) 0%, transparent 70%)'
            : isListening
            ? 'radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(15,23,42,0.5) 0%, transparent 70%)',
        }}
      />

      {/* Avatar SVG */}
      <div
        className="relative z-10 flex flex-col items-center gap-4"
        style={{
          animation: isPaused ? 'none' : 'breathe 4s ease-in-out infinite',
        }}
      >
        <svg
          width="220"
          height="280"
          viewBox="0 0 220 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl"
          style={{
            filter: isSpeaking
              ? 'drop-shadow(0 0 20px rgba(99,102,241,0.5))'
              : isThinking
              ? 'drop-shadow(0 0 15px rgba(245,158,11,0.4))'
              : 'drop-shadow(0 0 8px rgba(99,102,241,0.2))',
            transform: `scale(${isPaused ? 0.97 : 1})`,
            transition: 'transform 0.3s ease, filter 0.4s ease',
          }}
        >
          <defs>
            {/* Skin gradient */}
            <radialGradient id={`skin-${persona}`} cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#f5cba7" />
              <stop offset="100%" stopColor="#e8a87c" />
            </radialGradient>
            {/* Background gradient per persona */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {persona === 'technical' && (
                <>
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </>
              )}
              {persona === 'hr' && (
                <>
                  <stop offset="0%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#db2777" />
                </>
              )}
              {persona === 'mentor' && (
                <>
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#0d9488" />
                </>
              )}
            </linearGradient>
            {/* Hair gradient */}
            <linearGradient id="hair-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={persona === 'technical' ? '#2d1b69' : persona === 'hr' ? '#1a0a0a' : '#1a2e05'} />
              <stop offset="100%" stopColor={persona === 'technical' ? '#1e0a57' : persona === 'hr' ? '#0d0404' : '#0d1a02'} />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Collar / Suit */}
          <ellipse cx="110" cy="268" rx="80" ry="40" fill={`url(#${gradientId})`} opacity="0.9" />
          <rect x="90" y="230" width="40" height="50" fill={`url(#${gradientId})`} rx="4" />
          {/* Shirt collar */}
          <path d="M85 235 L110 250 L135 235 L110 225 Z" fill="white" opacity="0.9" />

          {/* Neck */}
          <rect x="97" y="198" width="26" height="40" fill={`url(#skin-${persona})`} rx="8" />

          {/* Head */}
          <ellipse
            cx="110"
            cy="145"
            rx="68"
            ry="78"
            fill={`url(#skin-${persona})`}
            filter="url(#shadow)"
          />

          {/* Hair */}
          <ellipse cx="110" cy="80" rx="68" ry="40" fill="url(#hair-grad)" />
          <rect x="42" y="80" width="15" height="60" fill="url(#hair-grad)" rx="7" />
          <rect x="163" y="80" width="15" height="60" fill="url(#hair-grad)" rx="7" />

          {/* Ears */}
          <ellipse cx="42" cy="148" rx="10" ry="14" fill={`url(#skin-${persona})`} />
          <ellipse cx="178" cy="148" rx="10" ry="14" fill={`url(#skin-${persona})`} />

          {/* Eyebrows */}
          <path
            d="M72 118 Q84 112 96 116"
            stroke="#5d4037"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            style={{
              transform: isThinking ? 'translateY(-2px)' : 'none',
              transition: 'transform 0.3s',
            }}
          />
          <path
            d="M124 116 Q136 112 148 118"
            stroke="#5d4037"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            style={{
              transform: isThinking ? 'translateY(-2px)' : 'none',
              transition: 'transform 0.3s',
            }}
          />

          {/* Eyes */}
          {/* Left eye */}
          <ellipse cx="84" cy="136" rx="14" ry={blinkState ? 1 : 11} fill="white" />
          {!blinkState && (
            <>
              <ellipse cx="84" cy="137" rx="9" ry="9" fill="#3b2a1a" />
              <ellipse cx="84" cy="137" rx="5" ry="5" fill="#1a0a00" />
              <ellipse cx="80" cy="134" rx="2.5" ry="2.5" fill="white" opacity="0.8" />
            </>
          )}
          {/* Right eye */}
          <ellipse cx="136" cy="136" rx="14" ry={blinkState ? 1 : 11} fill="white" />
          {!blinkState && (
            <>
              <ellipse cx="136" cy="137" rx="9" ry="9" fill="#3b2a1a" />
              <ellipse cx="136" cy="137" rx="5" ry="5" fill="#1a0a00" />
              <ellipse cx="132" cy="134" rx="2.5" ry="2.5" fill="white" opacity="0.8" />
            </>
          )}

          {/* Nose */}
          <path
            d="M106 152 Q110 172 114 152"
            stroke="#c8906a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="104" cy="170" rx="5" ry="3.5" fill="#c8906a" opacity="0.6" />
          <ellipse cx="116" cy="170" rx="5" ry="3.5" fill="#c8906a" opacity="0.6" />

          {/* Mouth */}
          {mouthOpen < 0.1 ? (
            // Neutral / slight smile
            <path
              d="M88 185 Q110 194 132 185"
              stroke="#c0725a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            // Speaking - open mouth
            <>
              <ellipse
                cx="110"
                cy="190"
                rx={18 + mouthOpen * 6}
                ry={3 + mouthOpen * 14}
                fill="#8b0000"
              />
              <ellipse
                cx="110"
                cy={186 + mouthOpen * 6}
                rx={16 + mouthOpen * 4}
                ry={1.5 + mouthOpen * 5}
                fill="#f5c8c8"
                opacity="0.7"
              />
              {/* Lips outline */}
              <path
                d={`M${92 - mouthOpen * 2} 185 Q110 ${180 - mouthOpen * 2} ${128 + mouthOpen * 2} 185`}
                stroke="#c0725a"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M${92 - mouthOpen * 2} 185 Q110 ${195 + mouthOpen * 12} ${128 + mouthOpen * 2} 185`}
                stroke="#c0725a"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Status indicator dot on forehead area */}
          <circle
            cx="110"
            cy="62"
            r="6"
            fill={statusRingColor}
            opacity={statusRingOpacity}
            style={{ transition: 'fill 0.3s, opacity 0.3s' }}
          />
          {(isSpeaking || isThinking) && (
            <circle
              cx="110"
              cy="62"
              r="10"
              fill="none"
              stroke={statusRingColor}
              strokeWidth="2"
              opacity="0.5"
              style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}
            />
          )}
        </svg>

        {/* Thinking indicator dots */}
        {isThinking && (
          <div className="flex items-center gap-2 -mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-amber-400"
                style={{
                  animation: `bounce 1s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Speaking audio waveform ring around avatar */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              className="absolute rounded-full border border-indigo-500/30"
              style={{
                width: `${180 + ring * 40}px`,
                height: `${180 + ring * 40}px`,
                animation: `ping ${0.8 + ring * 0.3}s ease-out infinite`,
                animationDelay: `${ring * 0.2}s`,
                opacity: 1 / (ring * 1.5),
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.005); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};
