'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { InterviewItem, InterviewQuestionItem } from '@/lib/types';
import { BrowserSpeechService } from '@/lib/speech';
import { startDeepgramListener, ServerSpeaker, ListenerHandle } from '@/lib/voiceClient';
import {
  ConversationPhase,
  InterviewerPersona,
  PERSONA_CONFIGS,
  getStatusLabel,
} from '@/lib/conversationStateMachine';
import { AvatarPresenter } from '@/components/AvatarPresenter';
import { CandidateCamera } from '@/components/CandidateCamera';
import { ConversationPanel } from '@/components/ConversationPanel';
import { InterviewToolbar } from '@/components/InterviewToolbar';
import { Loader2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';

type ConversationEntry = {
  role: 'interviewer' | 'candidate';
  text: string;
  isFollowUp?: boolean;
};

export default function VideoInterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // ─── Interview Data ──────────────────────────────────────────────────
  const [interview, setInterview] = useState<InterviewItem | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestionItem | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // ─── Conversation State Machine ──────────────────────────────────────
  const [phase, setPhase] = useState<ConversationPhase>('initializing');
  const [persona] = useState<InterviewerPersona>('technical');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);

  // ─── Answer / Transcript ─────────────────────────────────────────────
  const [transcriptBuffer, setTranscriptBuffer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Media Controls ──────────────────────────────────────────────────
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ─── Timer ───────────────────────────────────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ─── UI State ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  // ─── Refs ─────────────────────────────────────────────────────────────
  const recognitionControllerRef = useRef<{ stop: () => void } | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const phaseRef = useRef<ConversationPhase>('initializing');
  const listenerRef = useRef<ListenerHandle | null>(null);
  const serverVoiceRef = useRef(false);
  const speakSeqRef = useRef(0);
  const questionRef = useRef<InterviewQuestionItem | null>(null);
  const answerBufferRef = useRef('');
  const keytermsRef = useRef<string[]>([]);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgedRef = useRef(false);
  const turnBusyRef = useRef(false);
  const pendingUtterancesRef = useRef<string[]>([]);
  const isMicMutedRef = useRef(false);
  const voiceFallbackInProgressRef = useRef(false);
  const interviewRoomRef = useRef<HTMLDivElement>(null);

  const joinText = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(' ');

  const stopAllSpeech = () => {
    ServerSpeaker.stop();
    BrowserSpeechService.stopSpeaking();
  };

  const clearIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
  };

  const stopServerListener = () => {
    listenerRef.current?.stop();
    listenerRef.current = null;
  };

  // Keep phaseRef in sync for use inside callbacks
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsBrowserFullscreen(document.fullscreenElement === interviewRoomRef.current);
    };
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  // ─── Timer Loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || phase === 'completed' || phase === 'error' || phase === 'initializing') return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused, phase]);

  // ─── Auth Guard ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // ─── Load Interview ───────────────────────────────────────────────────
  useEffect(() => {
    if (id && user) {
      loadInterviewSession();
    }
    return () => {
      stopAllSpeech();
      clearIdleTimer();
      stopServerListener();
      recognitionControllerRef.current?.stop();
    };
  }, [id, user]);

  const loadInterviewSession = async () => {
    try {
      setLoading(true);
      const data = await api.getInterviewById(id);

      if (data.interview.state === 'completed') {
        router.push(`/interviews/${id}/report`);
        return;
      }

      setInterview(data.interview);

      // Prefer server voice (Deepgram listening + Murf speaking) when both keys are configured
      try {
        const voice = await api.getVoiceStatus();
        serverVoiceRef.current = Boolean(voice.serverStt && voice.serverTts);
      } catch {
        serverVoiceRef.current = false;
      }
      // Resume skills bias the speech recognizer toward the candidate's technical vocabulary
      if (data.interview.resumeId) {
        try {
          const { resume } = await api.getResumeById(String(data.interview.resumeId));
          keytermsRef.current = resume.parsedProfile?.targetSkills || [];
        } catch {
          keytermsRef.current = [];
        }
      }

      setTotalQuestions(data.questions.length);
      setQuestionIndex(data.interview.currentQuestionIndex);

      const activeQ =
        data.currentQuestion ||
        data.questions[data.interview.currentQuestionIndex] ||
        data.questions[0];
      setCurrentQuestion(activeQ);
      questionRef.current = activeQ;
      setIsPaused(data.interview.state === 'paused');

      // Determine persona from interview type
      const personaByType: Record<string, InterviewerPersona> = {
        technical: 'technical',
        system_design: 'technical',
        coding: 'technical',
        fullstack: 'technical',
        hr: 'hr',
        behavioral: 'hr',
        custom: 'mentor',
      };

      setLoading(false);

      // After loading, deliver intro then first question
      if (data.interview.state !== 'paused') {
        const detectedPersona =
          personaByType[data.interview.interviewType] || 'technical';

        // Play the supplied presenter clip while browser speech reads the
        // identical script. The clip ending, not the speech callback, advances
        // the room so the visual introduction completes first.
        setPhase('intro_speaking');
        speakText(
          "Hello, I'm Alex, your technical interviewer. I'll ask one question at a time. Please explain your thinking clearly. Let's begin.",
          detectedPersona
        );
      } else {
        setPhase('paused');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load interview session');
      setPhase('error');
      setLoading(false);
    }
  };

  // ─── Speech Helpers ───────────────────────────────────────────────────

  const speakText = (
    text: string,
    speakerPersona: InterviewerPersona,
    onFinished?: () => void
  ) => {
    if (isSpeechMuted) {
      onFinished?.();
      return;
    }

    const seq = ++speakSeqRef.current;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      onFinished?.();
    };
    const markSpeaking = () => {
      if (seq !== speakSeqRef.current) return;
      setPhase((prev) => (prev === 'intro_speaking' ? 'intro_speaking' : 'interviewer_speaking'));
    };
    const browserSpeak = () =>
      BrowserSpeechService.speak(text, {
        persona: speakerPersona,
        onStart: markSpeaking,
        onEnd: done,
        onError: (err) => {
          console.warn('TTS error:', err);
          done();
        },
      });

    if (serverVoiceRef.current) {
      markSpeaking();
      ServerSpeaker.speak(text)
        .then(done)
        .catch((err) => {
          if (seq !== speakSeqRef.current) return done(); // interrupted, not a failure
          console.warn('Murf TTS failed, using browser voice:', err);
          browserSpeak();
        });
      return;
    }
    browserSpeak();
  };

  const speakAsync = (text: string) =>
    new Promise<void>((resolve) => speakText(text, persona, resolve));

  const beginQuestion = (question: InterviewQuestionItem, isFollowUp: boolean) => {
    setCurrentQuestion(question);
    questionRef.current = question;
    questionStartTimeRef.current = Date.now();
    answerBufferRef.current = '';
    pendingUtterancesRef.current = [];
    nudgedRef.current = false;
    clearIdleTimer();
    setTranscriptBuffer('');
    setPhase('interviewer_speaking');

    // Add question to conversation history
    setConversationHistory((prev) => [
      ...prev,
      { role: 'interviewer', text: question.questionText, isFollowUp },
    ]);

    // Speak the question, then start listening
    if (!isSpeechMuted) {
      speakText(question.questionText, persona, () => {
        if (phaseRef.current !== 'paused' && phaseRef.current !== 'completed') {
          startListening();
        }
      });
    } else {
      // If speech is muted, go straight to listening
      startListening();
    }
  };

  const startListening = () => {
    if (isMicMuted) {
      setPhase('listening');
      return; // User can type in text area
    }

    setPhase('listening');

    if (serverVoiceRef.current) {
      startServerListening();
      return;
    }

    const controller = BrowserSpeechService.startListening({
      onTranscript: (text, isFinal) => {
        setTranscriptBuffer(text);
      },
      onError: (err) => {
        console.warn('Browser speech recognition error:', err);
        setError(err);
        setPhase('listening');
      },
      onEnd: () => {
        // Recognition ended naturally; stay in listening phase so user can review transcript
      },
      silenceThresholdSeconds: 4,
      onSilenceDetected: (secs) => {
        // Inform user but don't auto-submit
      },
    });

    recognitionControllerRef.current = controller;
  };

  const bargeIn = () => {
    speakSeqRef.current++;
    stopAllSpeech();
    setPhase('listening');
  };

  const startServerListening = async () => {
    if (listenerRef.current) {
      listenerRef.current.setMuted(isMicMutedRef.current);
      return;
    }
    try {
      listenerRef.current = await startDeepgramListener(
        {
          onInterim: (text) => {
            clearIdleTimer();
            const speaking =
              phaseRef.current === 'interviewer_speaking' || phaseRef.current === 'intro_speaking';
            // Two or more words heard while the interviewer talks = the candidate is interrupting
            if (speaking && text.split(/\s+/).length >= 2) bargeIn();
            if (phaseRef.current === 'listening') {
              setTranscriptBuffer(joinText(answerBufferRef.current, text));
            }
          },
          onSpeechStart: clearIdleTimer,
          onEndOfTurn: (text) => handleCandidateTurn(text),
          onError: (message) => {
            console.warn('Realtime voice error:', message);
            // A failed WebSocket must not leave the interview silently listening.
            // Chrome's built-in recognizer is a reliable fallback when available.
            if (!voiceFallbackInProgressRef.current && serverVoiceRef.current) {
              voiceFallbackInProgressRef.current = true;
              serverVoiceRef.current = false;
              stopServerListener();
              setError(`${message}. Switched to browser speech recognition.`);
              setTimeout(() => {
                voiceFallbackInProgressRef.current = false;
                if (phaseRef.current === 'listening' && !isMicMutedRef.current) startListening();
              }, 0);
            }
          },
        },
        keytermsRef.current
      );
      listenerRef.current.setMuted(isMicMutedRef.current);
    } catch (err) {
      // Mic denied or server voice unavailable: fall back to browser recognition
      console.warn('Server listening unavailable, falling back to browser speech:', err);
      serverVoiceRef.current = false;
      startListening();
    }
  };

  const scheduleIdleNudge = () => {
    clearIdleTimer();
    if (nudgedRef.current || !answerBufferRef.current.trim()) return;
    idleTimerRef.current = setTimeout(async () => {
      if (phaseRef.current !== 'listening' || turnBusyRef.current) return;
      nudgedRef.current = true;
      const line = 'Take your time. Is there anything you would like to add, or shall we move on?';
      setConversationHistory((prev) => [...prev, { role: 'interviewer', text: line }]);
      await speakAsync(line);
      const after = phaseRef.current as ConversationPhase; // may have changed while speaking
      if (after !== 'paused' && after !== 'completed') setPhase('listening');
    }, 8000);
  };

  const handleCandidateTurn = async (utterance: string) => {
    const phaseNow = phaseRef.current;
    if (phaseNow === 'paused' || phaseNow === 'completed' || phaseNow === 'error' || phaseNow === 'processing_answer') return;
    if (!questionRef.current) return;
    if (turnBusyRef.current) {
      pendingUtterancesRef.current.push(utterance);
      return;
    }

    turnBusyRef.current = true;
    clearIdleTimer();
    if (phaseNow === 'interviewer_speaking' || phaseNow === 'intro_speaking') bargeIn();

    let next: string | undefined = utterance;
    let lastIntent = '';
    try {
      while (next) {
        const heard: string = next;
        next = undefined;
        setConversationHistory((prev) => [...prev, { role: 'candidate', text: heard }]);
        setPhase('generating_followup');

        const q = questionRef.current;
        if (!q) return;

        let turn;
        try {
          turn = await api.chatTurn(id, {
            questionId: q._id,
            utterance: heard,
            answerSoFar: answerBufferRef.current,
          });
        } catch (err) {
          // Interviewer brain unavailable: keep the candidate's exact words as part of the answer
          console.warn('Chat turn failed, treating as answer:', err);
          turn = { intent: 'answer' as const, reply: '', answerComplete: false, conversational: false };
        }
        lastIntent = turn.intent;

        if (turn.intent === 'answer') {
          answerBufferRef.current = joinText(answerBufferRef.current, heard);
          setTranscriptBuffer(answerBufferRef.current);
        }
        if (turn.intent === 'skip') {
          await handleSubmitAnswer('I would like to skip this question.');
          return;
        }
        if (turn.reply.trim()) {
          setConversationHistory((prev) => [...prev, { role: 'interviewer', text: turn.reply.trim() }]);
          await speakAsync(turn.reply.trim());
        }
        if (turn.intent === 'answer' && turn.answerComplete && answerBufferRef.current.trim()) {
          await handleSubmitAnswer(answerBufferRef.current);
          return;
        }

        const queued = pendingUtterancesRef.current.splice(0).join(' ');
        if (queued) next = queued;
      }
      if (phaseRef.current !== 'paused' && phaseRef.current !== 'completed') {
        setPhase('listening');
        if (lastIntent === 'answer') scheduleIdleNudge();
      }
    } finally {
      turnBusyRef.current = false;
    }
  };

  const stopListening = () => {
    recognitionControllerRef.current?.stop();
    recognitionControllerRef.current = null;
  };

  // ─── Event Handlers ───────────────────────────────────────────────────

  const handleToggleMic = () => {
    if (!isMicMuted) {
      // Muting — stop active recognition
      stopListening();
      listenerRef.current?.setMuted(true);
      setIsMicMuted(true);
    } else {
      setIsMicMuted(false);
      listenerRef.current?.setMuted(false);
      if (phaseRef.current === 'listening') {
        startListening();
      }
    }
  };

  const handleToggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  const handleToggleSpeech = () => {
    if (!isSpeechMuted) {
      stopAllSpeech();
      // If we were in speaking phase, jump to listening
      if (phaseRef.current === 'interviewer_speaking' || phaseRef.current === 'intro_speaking') {
        startListening();
      }
    }
    setIsSpeechMuted((prev) => !prev);
  };

  const handleTogglePause = async () => {
    if (isPaused) {
      try {
        await api.resumeInterview(id);
        setIsPaused(false);
        setPhase('listening');
        if (currentQuestion && !isSpeechMuted) {
          beginQuestion(currentQuestion, currentQuestion.isFollowUp);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to resume interview');
      }
    } else {
      try {
        stopAllSpeech();
        clearIdleTimer();
        stopListening();
        stopServerListener();
        await api.pauseInterview(id);
        setIsPaused(true);
        setPhase('paused');
      } catch (err: any) {
        setError(err.message || 'Failed to pause interview');
      }
    }
  };

  const handleSubmitAnswer = async (textOverride?: unknown) => {
    const answerText = (typeof textOverride === 'string' ? textOverride : transcriptBuffer).trim();
    const activeQuestion = questionRef.current || currentQuestion;
    if (!answerText || !activeQuestion) return;

    // Stop speech; the server listener stays open between questions
    clearIdleTimer();
    stopListening();
    stopAllSpeech();
    setPhase('processing_answer');
    setIsSubmitting(true);

    // Conversational turns are already in history; only a manual submit adds the answer here
    if (typeof textOverride !== 'string') {
      setConversationHistory((prev) => [...prev, { role: 'candidate', text: answerText }]);
    }

    const durationSeconds = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    try {
      const result = await api.submitAnswer(id, {
        questionId: activeQuestion._id,
        transcript: answerText,
        durationSeconds,
      });

      answerBufferRef.current = '';
      setTranscriptBuffer('');

      if (result.isCompleted) {
        setPhase('completed');
        router.push(`/interviews/${id}/report`);
        return;
      }

      if (result.nextQuestion) {
        setQuestionIndex(result.currentIndex || 0);
        setTotalQuestions(result.totalQuestions || totalQuestions);
        setPhase('generating_followup');

        // Short pause for realism before next question
        setTimeout(() => {
          if (result.nextQuestion) {
            beginQuestion(result.nextQuestion, result.isFollowUp || false);
          }
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
      setPhase('listening');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndInterview = () => setShowEndModal(true);

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await interviewRoomRef.current?.requestFullscreen();
      }
    } catch {
      setError('Full-screen mode is not available in this browser.');
    }
  };

  const handleConfirmEnd = async () => {
    setShowEndModal(false);
    clearIdleTimer();
    stopListening();
    stopServerListener();
    stopAllSpeech();
    try {
      setIsSubmitting(true);
      await api.completeInterview(id);
      router.push(`/interviews/${id}/report`);
    } catch (err: any) {
      setError(err.message || 'Failed to finalize interview');
      setIsSubmitting(false);
    }
  };

  // ─── Render Helpers ───────────────────────────────────────────────────
  const personaConfig = PERSONA_CONFIGS[persona];
  const isSpeaking = phase === 'interviewer_speaking' || phase === 'intro_speaking';
  const isThinking = phase === 'processing_answer' || phase === 'generating_followup';
  const isListening = phase === 'listening';
  const handleIntroComplete = () => {
    if (phaseRef.current !== 'intro_speaking') return;
    stopAllSpeech();
    const firstQuestion = questionRef.current;
    if (firstQuestion) beginQuestion(firstQuestion, false);
  };

  // ─── Loading State ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#060913] flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <div className="absolute inset-0 blur-xl bg-indigo-500/20 rounded-full" />
          </div>
          <p className="text-sm text-slate-400 animate-pulse">Joining interview room...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────
  if (phase === 'error' || (!loading && !interview)) {
    return (
      <div className="fixed inset-0 bg-[#060913] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <h2 className="text-lg font-bold text-white">Failed to Join Interview</h2>
          <p className="text-sm text-slate-400">{error || 'Unknown error occurred'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Video Room Layout ───────────────────────────────────────────
  return (
    <div
      ref={interviewRoomRef}
      className="fixed inset-0 flex flex-col bg-[#060913] overflow-hidden"
      style={{ zIndex: 40 }}
    >
      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#05080f]/90 border-b border-slate-800 flex-shrink-0 z-10">
        {/* Left: Interview info */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-indigo-400 text-[10px] font-bold">AI</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-tight">
              {interview?.targetRole}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">
              {interview?.interviewType?.replace('_', ' ')} • {interview?.difficulty}
            </p>
          </div>
        </div>

        {/* Center: Status pill */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
            isSpeaking
              ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300'
              : isThinking
              ? 'bg-amber-600/15 border-amber-500/30 text-amber-300'
              : isListening
              ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-300'
              : isPaused
              ? 'bg-slate-700/30 border-slate-600/30 text-slate-400'
              : 'bg-slate-800/50 border-slate-700/30 text-slate-500'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isSpeaking
                ? 'bg-indigo-400 animate-pulse'
                : isThinking
                ? 'bg-amber-400 animate-pulse'
                : isListening
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-slate-500'
            }`}
          />
          {getStatusLabel(phase, currentQuestion?.isFollowUp || false)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
            title={isBrowserFullscreen ? 'Exit full screen' : 'Enter full screen'}
          >
            {isBrowserFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
            title={isPanelExpanded ? 'Hide panel' : 'Show panel'}
          >
            {isPanelExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── VIDEO AREA ──────────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0 bg-[#060913]">
          {/* AI Interviewer — main tile */}
          <div className="absolute inset-0">
            <div className="relative h-full w-full">
              {/* Background card with grid lines for realism */}
              <div
                className="absolute inset-0 overflow-hidden border border-slate-800/80"
                style={{
                  background:
                    'linear-gradient(135deg, #090d1a 0%, #0e1527 50%, #090d1a 100%)',
                  backgroundImage: `
                    linear-gradient(135deg, #090d1a 0%, #0e1527 50%, #090d1a 100%),
                    repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 39px,
                      rgba(30,41,59,0.3) 40px
                    ),
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 39px,
                      rgba(30,41,59,0.3) 40px
                    )
                  `,
                }}
              />

              {/* Avatar presenter */}
              <AvatarPresenter
                persona={persona}
                isIntro={phase === 'intro_speaking'}
                isSpeaking={isSpeaking}
                isThinking={isThinking}
                isListening={isListening}
                isPaused={isPaused}
                onIntroComplete={handleIntroComplete}
              />

              {/* Persona name tag */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-xl backdrop-blur-sm border border-white/10">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'}`} />
                <div>
                  <p className="text-xs font-semibold text-white">{personaConfig.name}</p>
                  <p className="text-[10px] text-slate-400">{personaConfig.title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── CANDIDATE PREVIEW — floating top-right corner ─────────── */}
          <div
            className="absolute top-3 right-3 z-20 transition-all duration-300"
            style={{ width: isPanelExpanded ? '160px' : '200px' }}
          >
            <CandidateCamera
              isEnabled={isCameraOn}
              className="w-full aspect-video rounded-2xl"
              onPermissionDenied={(msg) => console.warn('Camera:', msg)}
            />
            {/* My name tag */}
            <div className="mt-1 px-2 py-1 bg-black/60 rounded-lg backdrop-blur-sm flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${!isMicMuted ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <p className="text-[10px] text-white font-medium">{user?.name || 'You'}</p>
            </div>
          </div>

          {/* ── Error Banner ─────────────────────────────────────────── */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 p-3 bg-rose-900/80 rounded-xl border border-rose-500/40 backdrop-blur-sm text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">✕</button>
              </div>
            </div>
          )}

          {/* ── Paused Overlay ─────────────────────────────────────── */}
          {isPaused && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3 p-6 bg-slate-900/90 rounded-2xl border border-slate-700">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <span className="text-amber-400 text-lg">⏸</span>
                </div>
                <p className="text-sm font-semibold text-white">Interview Paused</p>
                <p className="text-xs text-slate-400">Press Resume in the toolbar to continue</p>
              </div>
            </div>
          )}
        </div>

        {/* ── CONVERSATION PANEL ───────────────────────────────────────── */}
        {isPanelExpanded && (
          <div className="w-80 xl:w-96 flex-shrink-0 border-l border-slate-800 flex flex-col">
            <ConversationPanel
              phase={phase}
              persona={persona}
              currentQuestionText={currentQuestion?.questionText || ''}
              isFollowUp={currentQuestion?.isFollowUp || false}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              transcriptBuffer={transcriptBuffer}
              onTranscriptChange={(value) => {
                answerBufferRef.current = value;
                setTranscriptBuffer(value);
              }}
              isListening={isListening && !isMicMuted}
              isMicMuted={isMicMuted}
              conversationHistory={conversationHistory}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* ── BOTTOM TOOLBAR ────────────────────────────────────────────── */}
      <InterviewToolbar
        phase={phase}
        isMicMuted={isMicMuted}
        isCameraOn={isCameraOn}
        isSpeechMuted={isSpeechMuted}
        isPaused={isPaused}
        isSubmitting={isSubmitting}
        transcriptLength={transcriptBuffer.trim().length}
        elapsedSeconds={elapsedSeconds}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleSpeech={handleToggleSpeech}
        onTogglePause={handleTogglePause}
        onSubmitAnswer={handleSubmitAnswer}
        onEndInterview={handleEndInterview}
      />

      {/* ── END INTERVIEW MODAL ──────────────────────────────────────── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <span className="text-red-400">✕</span>
              </div>
              <h3 className="text-base font-bold text-white">End Interview Session?</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              The AI engine will finalize your performance evaluation based on all answers
              submitted so far and generate your full report.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition"
              >
                Continue Interview
              </button>
              <button
                onClick={handleConfirmEnd}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing...</>
                ) : (
                  'End & View Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
