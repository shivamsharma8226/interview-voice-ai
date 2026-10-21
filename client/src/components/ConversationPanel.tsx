'use client';

import React from 'react';
import { ConversationPhase, InterviewerPersona, PERSONA_CONFIGS } from '@/lib/conversationStateMachine';
import { AudioWaveform } from '@/components/AudioWaveform';
import { Mic, MicOff, Brain, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface ConversationPanelProps {
  phase: ConversationPhase;
  persona: InterviewerPersona;
  currentQuestionText: string;
  isFollowUp: boolean;
  questionIndex: number;
  totalQuestions: number;
  transcriptBuffer: string;
  onTranscriptChange: (val: string) => void;
  isListening: boolean;
  isMicMuted: boolean;
  conversationHistory: { role: 'interviewer' | 'candidate'; text: string; isFollowUp?: boolean }[];
  className?: string;
}

/**
 * ConversationPanel — Side panel showing question progress, 
 * live transcript, and conversation history.
 */
export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  phase,
  persona,
  currentQuestionText,
  isFollowUp,
  questionIndex,
  totalQuestions,
  transcriptBuffer,
  onTranscriptChange,
  isListening,
  isMicMuted,
  conversationHistory,
  className = '',
}) => {
  const personaConfig = PERSONA_CONFIGS[persona];
  const progressPct = totalQuestions > 0 ? Math.round(((questionIndex + 1) / totalQuestions) * 100) : 0;

  return (
    <div
      className={`flex flex-col h-full bg-slate-950/90 border-l border-slate-800 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Interview Progress
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {questionIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          {isFollowUp ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Sparkles className="w-3 h-3" /> Follow-Up
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Current Question
            </span>
          )}
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {currentQuestionText || (
            <span className="text-slate-500 italic">
              {phase === 'initializing' ? 'Loading...' : 'Preparing next question...'}
            </span>
          )}
        </p>
      </div>

      {/* Conversation history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold mb-2">
          Conversation
        </p>
        {conversationHistory.length === 0 ? (
          <p className="text-xs text-slate-600 italic">Interview hasn&apos;t started yet...</p>
        ) : (
          conversationHistory.map((entry, i) => (
            <div
              key={i}
              className={`flex gap-2 animate-fade-in ${
                entry.role === 'interviewer' ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 ${
                  entry.role === 'interviewer'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                    : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                }`}
              >
                {entry.role === 'interviewer' ? 'AI' : 'Me'}
              </div>
              {/* Bubble */}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  entry.role === 'interviewer'
                    ? 'bg-slate-800/80 text-slate-300 rounded-tl-none'
                    : 'bg-indigo-600/15 text-slate-200 rounded-tr-none border border-indigo-600/20'
                }`}
              >
                {entry.isFollowUp && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 mb-1">
                    <Sparkles className="w-2.5 h-2.5" /> Follow-up
                  </span>
                )}
                <p className="line-clamp-4">{entry.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live transcript / answer area */}
      <div className="p-4 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
            {isListening ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Transcript
              </>
            ) : (
              <>
                <Mic className="w-3 h-3" />
                Your Answer
              </>
            )}
          </label>
          <span className="text-[10px] font-mono text-slate-600">
            {transcriptBuffer.trim().split(/\s+/).filter(Boolean).length}w
          </span>
        </div>

        <div className="relative">
          {isListening && (
            <div className="absolute top-2 right-2 z-10">
              <AudioWaveform isActive={true} color="emerald" barCount={7} />
            </div>
          )}
          <textarea
            value={transcriptBuffer}
            onChange={(e) => onTranscriptChange(e.target.value)}
            placeholder={
              isMicMuted
                ? 'Mic is muted. Type your answer here...'
                : isListening
                ? 'Listening... your words appear here in real time'
                : 'Your spoken or typed answer will appear here'
            }
            rows={4}
            className="w-full p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70 leading-relaxed resize-none transition"
          />
        </div>

        {/* Hint */}
        {phase === 'listening' && !isMicMuted && (
          <p className="mt-1.5 text-[10px] text-slate-600">
            <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-600" />
            Edit the transcript above if needed before submitting
          </p>
        )}
      </div>
    </div>
  );
};
