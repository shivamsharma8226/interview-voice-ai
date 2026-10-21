/**
 * Enhanced speech service with silence detection, interrupt support,
 * and voice state machine integration.
 */

export type SpeechEventType = 
  | 'transcript_interim'
  | 'transcript_final'
  | 'silence_detected'
  | 'mic_started'
  | 'mic_stopped'
  | 'mic_error'
  | 'tts_started'
  | 'tts_ended'
  | 'tts_error';

export interface SpeechEvent {
  type: SpeechEventType;
  data?: any;
}

export type SpeechEventListener = (event: SpeechEvent) => void;

export class BrowserSpeechService {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;
  private static isSpeaking = false;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  /**
   * Speak question or text using SpeechSynthesis
   */
  public static speak(
    text: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      rate?: number;
      pitch?: number;
      persona?: 'technical' | 'hr' | 'mentor';
    } = {}
  ): void {
    if (!this.synth) {
      options.onError?.('Speech synthesis is not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech to avoid overlapping
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Voice settings by persona
    switch (options.persona) {
      case 'hr':
        utterance.rate = options.rate ?? 1.05;
        utterance.pitch = options.pitch ?? 1.1;
        break;
      case 'mentor':
        utterance.rate = options.rate ?? 0.95;
        utterance.pitch = options.pitch ?? 0.95;
        break;
      default: // technical
        utterance.rate = options.rate ?? 1.0;
        utterance.pitch = options.pitch ?? 1.0;
    }

    // Pick best English voice available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Karen'))) ||
        v.lang === 'en-US'
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.currentUtterance = utterance;

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onError?.(e);
    };

    // Chrome bug workaround: voices sometimes pause after ~15s
    this.synth.speak(utterance);
  }

  public static stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  public static getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if browser supports Web Speech API speech recognition
   */
  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Create and start a speech recognition session with silence detection
   */
  public static startListening(options: {
    onTranscript: (transcript: string, isFinal: boolean) => void;
    onError: (error: string) => void;
    onEnd: () => void;
    onSilenceDetected?: (seconds: number) => void;
    silenceThresholdSeconds?: number;
    lang?: string;
  }): { stop: () => void } {
    if (!this.isRecognitionSupported()) {
      options.onError(
        'Speech recognition is not supported in this browser. Please use text answer fallback.'
      );
      return { stop: () => {} };
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang || 'en-US';

    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let silenceSeconds = 0;
    const silenceThreshold = options.silenceThresholdSeconds ?? 3;

    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceSeconds = 0;
      silenceTimer = setTimeout(() => {
        silenceSeconds++;
        options.onSilenceDetected?.(silenceSeconds);
      }, silenceThreshold * 1000);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const combined = (final || interim).trim();
      if (combined) {
        resetSilenceTimer();
        options.onTranscript(combined, Boolean(final));
      }
    };

    recognition.onerror = (event: any) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      let msg = 'Speech recognition error';
      if (event.error === 'not-allowed') {
        msg =
          'Microphone permission was denied. Please allow microphone access or use text input.';
      } else if (event.error === 'no-speech') {
        msg = 'No speech detected. Please speak clearly into your microphone.';
      } else if (event.error === 'network') {
        msg = 'Speech recognition network error. Switched to manual input.';
      } else if (event.error === 'aborted') {
        return; // Intentional stop, not an error
      }
      options.onError(msg);
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      options.onEnd();
    };

    // Start silence tracking immediately
    resetSilenceTimer();

    try {
      recognition.start();
      this.recognition = recognition;
    } catch (err: any) {
      options.onError(`Failed to start microphone: ${err.message}`);
    }

    return {
      stop: () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        try {
          recognition.stop();
        } catch {}
      },
    };
  }
}
