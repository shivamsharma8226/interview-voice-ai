/**
 * Voice I/O backed by the InterviewAI server:
 *  - DeepgramListener: mic -> 16 kHz PCM -> server WebSocket -> Deepgram Flux turn events
 *  - ServerSpeaker: text -> Murf TTS (via server) -> audio playback
 * The Deepgram and Murf keys stay on the server.
 */

const WORKLET_SOURCE = `
class PcmDownsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0;
    this.out = [];
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        const s = Math.max(-1, Math.min(1, ch[i]));
        this.out.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      }
    }
    // 80 ms chunks (1280 samples at 16 kHz) as recommended for Flux
    while (this.out.length >= 1280) {
      const chunk = new Int16Array(this.out.splice(0, 1280));
      this.port.postMessage(chunk.buffer, [chunk.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-downsampler', PcmDownsampler);
`;

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('interviewai_token') : null;

const wsBase = () =>
  process.env.NEXT_PUBLIC_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:5000`;

export interface ListenerCallbacks {
  /** Live (interim) text of the current turn, as heard so far */
  onInterim: (text: string) => void;
  /** Candidate began talking (use for barge-in) */
  onSpeechStart: () => void;
  /** Candidate finished a turn; text is exactly what was heard */
  onEndOfTurn: (text: string) => void;
  onError: (message: string) => void;
}

export interface ListenerHandle {
  stop: () => void;
  setMuted: (muted: boolean) => void;
}

export async function startDeepgramListener(
  callbacks: ListenerCallbacks,
  keyterms: string[] = []
): Promise<ListenerHandle> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });

  const audioCtx = new AudioContext();
  const workletUrl = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: 'application/javascript' }));
  await audioCtx.audioWorklet.addModule(workletUrl);
  URL.revokeObjectURL(workletUrl);

  const params = new URLSearchParams({ token });
  keyterms.slice(0, 40).forEach((k) => params.append('keyterm', k));
  const ws = new WebSocket(`${wsBase()}/api/voice/stt?${params.toString()}`);
  ws.binaryType = 'arraybuffer';

  let muted = false;
  let closed = false;

  const source = audioCtx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(audioCtx, 'pcm-downsampler');
  source.connect(node);
  node.port.onmessage = (e) => {
    if (!muted && ws.readyState === WebSocket.OPEN) ws.send(e.data as ArrayBuffer);
  };

  ws.onmessage = (e) => {
    if (typeof e.data !== 'string') return;
    let msg: any;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg.type === 'Error') {
      callbacks.onError(msg.message || 'Speech recognition error');
      return;
    }
    if (msg.type !== 'TurnInfo') return;
    const text: string = (msg.transcript || '').trim();
    switch (msg.event) {
      case 'StartOfTurn':
        callbacks.onSpeechStart();
        if (text) callbacks.onInterim(text);
        break;
      case 'Update':
      case 'TurnResumed':
        if (text) callbacks.onInterim(text);
        break;
      case 'EndOfTurn':
        if (text) callbacks.onEndOfTurn(text);
        break;
    }
  };
  ws.onerror = () => callbacks.onError('Could not connect to the speech service');
  ws.onclose = () => {
    if (!closed) callbacks.onError('Speech connection closed');
  };

  const stop = () => {
    closed = true;
    try {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'CloseStream' }));
      ws.close();
    } catch {}
    node.port.onmessage = null;
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    audioCtx.close().catch(() => {});
  };

  return { stop, setMuted: (m) => { muted = m; } };
}

let currentAudio: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;
let currentUrl: string | null = null;

/** Group sentences into chunks so audio for later chunks is fetched while earlier ones play */
const splitForTts = (text: string): string[] => {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*\s*/g) || [text];
  const chunks: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if (buf && (buf + s).length > 220) {
      chunks.push(buf.trim());
      buf = '';
    }
    buf += s;
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
};

const fetchSpeech = async (text: string, signal: AbortSignal): Promise<Blob> => {
  const res = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status})`);
  return res.blob();
};

export const ServerSpeaker = {
  /** Resolves when playback ends or is stopped. Rejects if TTS fails so the caller can fall back. */
  async speak(text: string): Promise<void> {
    ServerSpeaker.stop();
    const abort = new AbortController();
    currentAbort = abort;

    const pending = splitForTts(text).map((chunk) => {
      const p = fetchSpeech(chunk, abort.signal);
      p.catch(() => {});
      return p;
    });

    for (const p of pending) {
      const blob = await p;
      if (abort.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;
      currentUrl = url;

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
        audio.onpause = () => {
          if (currentAudio !== audio) resolve();
        };
        audio.play().catch(reject);
      });
      if (abort.signal.aborted) return;
      URL.revokeObjectURL(url);
      if (currentUrl === url) currentUrl = null;
    }
    if (currentAbort === abort) ServerSpeaker.stop();
  },

  stop(): void {
    currentAbort?.abort();
    currentAbort = null;
    if (currentAudio) {
      const a = currentAudio;
      currentAudio = null;
      a.pause();
    }
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      currentUrl = null;
    }
  },

  isSpeaking(): boolean {
    return currentAudio !== null && !currentAudio.paused;
  },
};
