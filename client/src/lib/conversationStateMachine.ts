/**
 * conversationStateMachine.ts
 * 
 * Defines the conversation state machine for the video interview experience.
 * Controls the flow: idle → interviewer_speaking → listening → processing → generating → interviewer_speaking
 */

export type ConversationPhase =
  | 'initializing'       // Loading interview data
  | 'intro_speaking'     // Interviewer giving intro
  | 'interviewer_speaking' // Interviewer asking question
  | 'listening'          // Candidate is speaking
  | 'processing_answer'  // Submitting answer to backend, waiting for AI
  | 'generating_followup' // AI generating next question
  | 'paused'             // Interview paused
  | 'completed'          // Interview finished
  | 'error';             // Error state

export interface ConversationState {
  phase: ConversationPhase;
  questionText?: string;
  transcriptBuffer: string;
  isInterviewerSpeaking: boolean;
  isListening: boolean;
  isMicMuted: boolean;
  isCameraOn: boolean;
  isSpeechMuted: boolean;
  silenceSecondsDetected: number;
  questionIndex: number;
  totalQuestions: number;
  isFollowUp: boolean;
  elapsedSeconds: number;
  interviewerPersona: InterviewerPersona;
  statusLabel: string;
}

export type InterviewerPersona = 'technical' | 'hr' | 'mentor';

export interface PersonaConfig {
  id: InterviewerPersona;
  name: string;
  title: string;
  avatarGradient: string;
  accentColor: string;
  introTemplate: string;
  speakingStyle: string;
}

export const PERSONA_CONFIGS: Record<InterviewerPersona, PersonaConfig> = {
  technical: {
    id: 'technical',
    name: 'Alex Chen',
    title: 'Senior Technical Interviewer',
    avatarGradient: 'from-indigo-600 to-violet-700',
    accentColor: 'text-indigo-400',
    introTemplate: (role: string) =>
      `Hello, I'm Alex Chen, a senior technical interviewer. Today we'll be evaluating your suitability for the ${role} position. I'll be asking technical questions based on your background and experience. Please take your time and speak clearly. Let's begin.`,
    speakingStyle: 'precise',
  },
  hr: {
    id: 'hr',
    name: 'Sarah Mitchell',
    title: 'HR & Talent Acquisition Lead',
    avatarGradient: 'from-rose-500 to-pink-600',
    accentColor: 'text-rose-400',
    introTemplate: (role: string) =>
      `Hi there! I'm Sarah Mitchell from the talent acquisition team. I'll be conducting your interview for the ${role} role today. We'll cover your experience, working style, and how you approach challenges. Feel free to be yourself — I'm here to have a genuine conversation. Let's get started!`,
    speakingStyle: 'warm',
  },
  mentor: {
    id: 'mentor',
    name: 'Dr. Marcus Webb',
    title: 'Principal Engineer & Engineering Mentor',
    avatarGradient: 'from-emerald-500 to-teal-600',
    accentColor: 'text-emerald-400',
    introTemplate: (role: string) =>
      `Welcome! I'm Dr. Marcus Webb, and I've been mentoring engineers for over 15 years. Today's session for the ${role} position is designed to understand your thinking process — not just your answers. Don't worry if you're uncertain about something; I value how you reason through problems. Ready to dive in?`,
    speakingStyle: 'educational',
  },
} as any;

// Make intro template usable at runtime
export function getPersonaIntro(persona: InterviewerPersona, targetRole: string): string {
  const templates: Record<InterviewerPersona, string> = {
    technical: `Hello, I'm Alex Chen, a senior technical interviewer. Today we'll be evaluating your suitability for the ${targetRole} position. I'll be asking technical and architecture questions based on your background. Please take your time and speak clearly. Let's begin.`,
    hr: `Hi there! I'm Sarah Mitchell from the talent acquisition team. I'll be conducting your interview for the ${targetRole} role today. We'll cover your experience, working style, and how you approach challenges. Feel free to be yourself. Let's get started!`,
    mentor: `Welcome! I'm Dr. Marcus Webb, and I've been mentoring engineers for over 15 years. Today's session for the ${targetRole} position is designed to understand your thinking process. Don't worry if you're uncertain about something — I value how you reason through problems. Ready to dive in?`,
  };
  return templates[persona];
}

export function getStatusLabel(phase: ConversationPhase, isFollowUp: boolean): string {
  switch (phase) {
    case 'initializing': return 'Connecting...';
    case 'intro_speaking': return 'Introducing...';
    case 'interviewer_speaking': return isFollowUp ? 'Follow-up Question' : 'Asking Question';
    case 'listening': return 'Listening...';
    case 'processing_answer': return 'Evaluating Answer';
    case 'generating_followup': return 'Thinking...';
    case 'paused': return 'Paused';
    case 'completed': return 'Interview Complete';
    case 'error': return 'Error';
    default: return '';
  }
}
