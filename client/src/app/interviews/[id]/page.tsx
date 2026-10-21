'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import {
  InterviewItem,
  InterviewQuestionItem,
  InterviewAnswerItem,
} from '@/lib/types';
import { BrowserSpeechService } from '@/lib/speech';
import { AudioWaveform } from '@/components/AudioWaveform';
import {
  Mic,
  Mic2,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Pause,
  Play,
  StopCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Brain,
  Clock,
  Keyboard,
  HelpCircle,
} from 'lucide-react';

export default function LiveInterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [interview, setInterview] = useState<InterviewItem | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestionItem | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Audio / Speech State
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState<boolean>(false);
  const [speechMuted, setSpeechMuted] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(true);

  // Answer Buffer
  const [transcript, setTranscript] = useState<string>('');
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Timer & Session State
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Speech Recognition controller ref
  const recognitionControllerRef = useRef<{ stop: () => void } | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // 1. Initial Load & Setup
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (id) {
      loadInterviewSession();
    }

    setRecognitionSupported(BrowserSpeechService.isRecognitionSupported());

    return () => {
      BrowserSpeechService.stopSpeaking();
      if (recognitionControllerRef.current) {
        recognitionControllerRef.current.stop();
      }
    };
  }, [id, user, authLoading]);

  // 2. Timer Loop
  useEffect(() => {
    if (isPaused || interview?.state === 'completed') return;

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, interview?.state]);

  const loadInterviewSession = async () => {
    try {
      setLoading(true);
      const data = await api.getInterviewById(id);

      if (data.interview.state === 'completed') {
        router.push(`/interviews/${id}/report`);
        return;
      }

      setInterview(data.interview);
      setTotalQuestions(data.questions.length);
      setCurrentIndex(data.interview.currentQuestionIndex);

      const activeQ = data.currentQuestion || data.questions[data.interview.currentQuestionIndex] || data.questions[0];
      setCurrentQuestion(activeQ);
      setIsPaused(data.interview.state === 'paused');

      if (!data.interview.configuration?.voiceMode) {
        setMode('text');
      }

      // Automatically speak the question if voice mode is active and not muted
      if (activeQ && !speechMuted && data.interview.configuration?.voiceMode !== false) {
        speakQuestion(activeQ.questionText);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load interview session');
    } finally {
      setLoading(false);
    }
  };

  const speakQuestion = (text: string) => {
    if (speechMuted) return;

    BrowserSpeechService.speak(text, {
      onStart: () => setIsInterviewerSpeaking(true),
      onEnd: () => setIsInterviewerSpeaking(false),
      onError: (err) => {
        console.warn('Speech synthesis notice:', err);
        setIsInterviewerSpeaking(false);
      },
    });
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionControllerRef.current) {
        recognitionControllerRef.current.stop();
        recognitionControllerRef.current = null;
      }
      setIsRecording(false);
    } else {
      // Start recording
      BrowserSpeechService.stopSpeaking();
      setIsInterviewerSpeaking(false);
      setError(null);

      const controller = BrowserSpeechService.startListening({
        onTranscript: (newText) => {
          setTranscript(newText);
        },
        onError: (err) => {
          setError(err);
          setIsRecording(false);
        },
        onEnd: () => {
          setIsRecording(false);
        },
      });

      recognitionControllerRef.current = controller;
      setIsRecording(true);
    }
  };

  const handleReplayQuestion = () => {
    if (currentQuestion) {
      speakQuestion(currentQuestion.questionText);
    }
  };

  const handleToggleMute = () => {
    if (!speechMuted) {
      BrowserSpeechService.stopSpeaking();
      setIsInterviewerSpeaking(false);
    }
    setSpeechMuted(!speechMuted);
  };

  const handleTogglePause = async () => {
    if (isPaused) {
      // Resume
      try {
        await api.resumeInterview(id);
        setIsPaused(false);
        if (currentQuestion && !speechMuted) {
          speakQuestion(currentQuestion.questionText);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to resume interview');
      }
    } else {
      // Pause
      try {
        BrowserSpeechService.stopSpeaking();
        if (isRecording && recognitionControllerRef.current) {
          recognitionControllerRef.current.stop();
          setIsRecording(false);
        }
        await api.pauseInterview(id);
        setIsPaused(true);
      } catch (err: any) {
        setError(err.message || 'Failed to pause interview');
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!transcript.trim()) {
      setError('Please provide your answer before submitting.');
      return;
    }

    if (!currentQuestion) return;

    // Stop recording and speech
    if (isRecording && recognitionControllerRef.current) {
      recognitionControllerRef.current.stop();
      setIsRecording(false);
    }
    BrowserSpeechService.stopSpeaking();
    setIsInterviewerSpeaking(false);

    setError(null);
    setSubmitting(true);

    const durationSeconds = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    try {
      const result = await api.submitAnswer(id, {
        questionId: currentQuestion._id,
        transcript: transcript.trim(),
        durationSeconds,
      });

      if (result.isCompleted) {
        // Complete! Redirect to performance report
        router.push(`/interviews/${id}/report`);
        return;
      }

      // Next question or follow-up
      if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        setCurrentIndex(result.currentIndex || 0);
        setTotalQuestions(result.totalQuestions || totalQuestions);
        setTranscript('');
        questionStartTimeRef.current = Date.now();

        // Speak next question
        if (!speechMuted) {
          speakQuestion(result.nextQuestion.questionText);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndEarly = async () => {
    setShowEndModal(false);
    try {
      setSubmitting(true);
      await api.completeInterview(id);
      router.push(`/interviews/${id}/report`);
    } catch (err: any) {
      setError(err.message || 'Failed to finalize interview');
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !interview) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading interview room...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#060913] max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* ROOM HEADER: PROGRESS, TIMER & CONTROLS */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Role & Question Step */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Mic2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{interview.targetRole}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {interview.interviewType}
              </span>
            </h2>
            <p className="text-xs text-indigo-400 font-medium">
              {currentQuestion?.isFollowUp ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Adaptive Follow-Up Question
                </span>
              ) : (
                `Question ${currentIndex + 1} of ${totalQuestions}`
              )}
            </p>
          </div>
        </div>

        {/* Center: Timer & Mode indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <button
            onClick={handleTogglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>

        {/* Right: End Session button */}
        <button
          onClick={() => setShowEndModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition flex items-center gap-1.5"
        >
          <StopCircle className="w-3.5 h-3.5" />
          <span>Conclude Interview</span>
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* AI INTERVIEWER CARD */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border border-indigo-500/40 flex items-center justify-center relative">
              <Brain className="w-6 h-6 text-indigo-400" />
              {isInterviewerSpeaking && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                Senior Technical Interviewer
                {currentQuestion?.isFollowUp && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Probing Depth
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {isInterviewerSpeaking
                  ? 'Speaking question aloud...'
                  : isRecording
                  ? 'Listening to candidate response...'
                  : 'Ready for candidate answer'}
              </p>
            </div>
          </div>

          {/* Speech Playback Controls */}
          <div className="flex items-center gap-2">
            <AudioWaveform isActive={isInterviewerSpeaking} color="purple" barCount={10} />

            <button
              onClick={handleReplayQuestion}
              title="Replay Question Audio"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleMute}
              title={speechMuted ? 'Unmute Interviewer Speech' : 'Mute Interviewer Speech'}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            >
              {speechMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Current Question Text */}
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-xl border border-slate-800">
          <p className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold mb-2">
            Prompt
          </p>
          <p className="text-lg sm:text-xl font-medium text-white leading-relaxed">
            {currentQuestion?.questionText}
          </p>
        </div>
      </div>

      {/* CANDIDATE ANSWER CARD */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Your Answer</span>
            <span className="text-[11px] text-slate-500">
              (Speak using microphone or edit the transcript text)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('voice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                mode === 'voice'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" /> Voice Mode
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                mode === 'text'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" /> Text Input
            </button>
          </div>
        </div>

        {/* VOICE RECORDING BAR (WHEN IN VOICE MODE) */}
        {mode === 'voice' && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <p className="text-xs font-semibold text-white">
                  {isRecording ? 'Listening to microphone... Speak clearly.' : 'Click to start speaking your answer'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isRecording ? 'Click again when finished to review draft transcript' : 'Web Speech API is active'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">Audio In:</span>
              <AudioWaveform isActive={isRecording} color="emerald" barCount={10} />
            </div>
          </div>
        )}

        {/* EDITABLE TRANSCRIPT / TEXT AREA */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Review & Edit Your Response Before Submitting:</span>
            <span className="font-mono text-[11px] text-slate-500">
              {transcript.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </label>
          <textarea
            rows={5}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={
              mode === 'voice'
                ? 'Your spoken answer will appear here in real time. You can freely edit or expand upon it before submitting.'
                : 'Type your comprehensive response here...'
            }
            className="w-full p-4 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed transition"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scores & correct rubric answers are revealed upon interview completion</span>
          </span>

          <button
            type="button"
            disabled={submitting || !transcript.trim()}
            onClick={handleSubmitAnswer}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating with AI Rubric...</span>
              </>
            ) : (
              <>
                <span>Submit Answer</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* END INTERVIEW CONFIRMATION MODAL */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-rose-400" />
              <span>Conclude Interview Session?</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to conclude now? The AI engine will finalize your interview and generate your performance report based on the answers provided so far.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={handleEndEarly}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Conclude & View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
