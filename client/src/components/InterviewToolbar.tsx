'use client';

import React from 'react';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Send,
  Loader2,
  Pause,
  Play,
} from 'lucide-react';
import { ConversationPhase } from '@/lib/conversationStateMachine';

interface InterviewToolbarProps {
  phase: ConversationPhase;
  isMicMuted: boolean;
  isCameraOn: boolean;
  isSpeechMuted: boolean;
  isPaused: boolean;
  isSubmitting: boolean;
  transcriptLength: number;
  elapsedSeconds: number;

  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleSpeech: () => void;
  onTogglePause: () => void;
  onSubmitAnswer: () => void;
  onEndInterview: () => void;
}

/**
 * InterviewToolbar — Bottom control bar similar to Google Meet / Zoom.
 * Contains mic, camera, speech, submit, pause, and end call controls.
 */
export const InterviewToolbar: React.FC<InterviewToolbarProps> = ({
  phase,
  isMicMuted,
  isCameraOn,
  isSpeechMuted,
  isPaused,
  isSubmitting,
  transcriptLength,
  elapsedSeconds,
  onToggleMic,
  onToggleCamera,
  onToggleSpeech,
  onTogglePause,
  onSubmitAnswer,
  onEndInterview,
}) => {
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canSubmit =
    transcriptLength > 0 &&
    (phase === 'listening' || phase === 'interviewer_speaking') &&
    !isSubmitting;

  const isActive = phase !== 'completed' && phase !== 'error' && phase !== 'initializing';

  return (
    <div className="relative flex items-center justify-between w-full px-4 sm:px-8 py-3 bg-[#05080f]/95 border-t border-slate-800 backdrop-blur-md">
      {/* Left: Timer & status */}
      <div className="flex items-center gap-4 min-w-[120px]">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              phase === 'listening'
                ? 'bg-emerald-400 animate-pulse'
                : phase === 'interviewer_speaking' || phase === 'intro_speaking'
                ? 'bg-indigo-400 animate-pulse'
                : phase === 'processing_answer' || phase === 'generating_followup'
                ? 'bg-amber-400 animate-pulse'
                : phase === 'paused'
                ? 'bg-slate-500'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-mono text-slate-300">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Center: Main controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Microphone */}
        <ToolbarButton
          onClick={onToggleMic}
          active={!isMicMuted}
          activeClass="bg-slate-700 text-white hover:bg-slate-600"
          inactiveClass="bg-red-600/90 text-white hover:bg-red-500"
          title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          disabled={!isActive}
        >
          {isMicMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        </ToolbarButton>

        {/* Camera */}
        <ToolbarButton
          onClick={onToggleCamera}
          active={isCameraOn}
          activeClass="bg-slate-700 text-white hover:bg-slate-600"
          inactiveClass="bg-red-600/90 text-white hover:bg-red-500"
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <Camera className="w-4 h-4 sm:w-5 sm:h-5" /> : <CameraOff className="w-4 h-4 sm:w-5 sm:h-5" />}
        </ToolbarButton>

        {/* Submit Answer — central prominent action */}
        {isActive && (
          <button
            onClick={onSubmitAnswer}
            disabled={!canSubmit}
            title="Submit your answer"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg ${
              canSubmit
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 scale-100 hover:scale-105 active:scale-95'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Evaluating...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Submit Answer</span>
              </>
            )}
          </button>
        )}

        {/* Interviewer TTS / Volume */}
        <ToolbarButton
          onClick={onToggleSpeech}
          active={!isSpeechMuted}
          activeClass="bg-slate-700 text-white hover:bg-slate-600"
          inactiveClass="bg-slate-800 text-slate-400 hover:bg-slate-700"
          title={isSpeechMuted ? 'Unmute interviewer' : 'Mute interviewer'}
        >
          {isSpeechMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </ToolbarButton>

        {/* Pause / Resume */}
        {isActive && (
          <ToolbarButton
            onClick={onTogglePause}
            active={!isPaused}
            activeClass="bg-slate-700 text-white hover:bg-slate-600"
            inactiveClass="bg-amber-600/80 text-white hover:bg-amber-500"
            title={isPaused ? 'Resume interview' : 'Pause interview'}
          >
            {isPaused ? (
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </ToolbarButton>
        )}
      </div>

      {/* Right: End interview */}
      <div className="flex justify-end min-w-[120px]">
        <button
          onClick={onEndInterview}
          title="End interview"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition shadow-lg shadow-red-600/25 active:scale-95"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">End</span>
        </button>
      </div>
    </div>
  );
};

// Reusable circular toolbar button
const ToolbarButton: React.FC<{
  onClick: () => void;
  active: boolean;
  activeClass: string;
  inactiveClass: string;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, active, activeClass, inactiveClass, title, disabled, children }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed ${
      active ? activeClass : inactiveClass
    }`}
  >
    {children}
  </button>
);
