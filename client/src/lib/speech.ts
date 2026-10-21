// Browser Speech Synthesis (TTS) and Speech Recognition (STT) Service

export class BrowserSpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;
  private static isSpeaking = false;

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
    } = {}
  ): void {
    if (!this.synth) {
      options.onError?.('Speech synthesis is not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech to avoid overlapping
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    // Pick best English voice available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))) ||
        v.lang === 'en-US'
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      options.onError?.(e);
    };

    this.synth.speak(utterance);
  }

  public static stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
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
   * Create and start a speech recognition session
   */
  public static startListening(options: {
    onTranscript: (transcript: string, isFinal: boolean) => void;
    onError: (error: string) => void;
    onEnd: () => void;
    lang?: string;
  }): { stop: () => void } {
    if (!this.isRecognitionSupported()) {
      options.onError('Speech recognition is not supported in this browser. Please use text answer fallback.');
      return { stop: () => {} };
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang || 'en-US';

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
      options.onTranscript(combined, Boolean(final));
    };

    recognition.onerror = (event: any) => {
      let msg = 'Speech recognition error';
      if (event.error === 'not-allowed') {
        msg = 'Microphone permission was denied. Please allow microphone access or use text input.';
      } else if (event.error === 'no-speech') {
        msg = 'No speech detected. Please speak clearly into your microphone.';
      } else if (event.error === 'network') {
        msg = 'Speech recognition network error. Switched to manual input.';
      }
      options.onError(msg);
    };

    recognition.onend = () => {
      options.onEnd();
    };

    try {
      recognition.start();
      this.recognition = recognition;
    } catch (err: any) {
      options.onError(`Failed to start microphone: ${err.message}`);
    }

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {}
      },
    };
  }
}
