import { Router, Request, Response } from 'express';
import { config } from '../config/env.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      clientSpeechRecognitionSupported: true,
      clientSpeechSynthesisSupported: true,
      hasExternalSttKey: Boolean(config.speechToTextApiKey && config.speechToTextApiKey.length > 0),
      hasExternalTtsKey: Boolean(config.textToSpeechApiKey && config.textToSpeechApiKey.length > 0),
      preferredEngine: config.speechToTextApiKey && config.textToSpeechApiKey ? 'deepgram-murf' : 'browser-native',
      serverStt: Boolean(config.speechToTextApiKey),
      serverTts: Boolean(config.textToSpeechApiKey),
    },
  });
});

router.post('/transcribe', (req: Request, res: Response) => {
  if (!config.speechToTextApiKey) {
    res.status(200).json({
      success: true,
      adapter: 'browser-speech-recognition',
      message: 'Browser Web Speech API is the recommended and active transcription engine. Set SPEECH_TO_TEXT_API_KEY in .env for server-side Whisper transcription.',
    });
    return;
  }

  res.status(501).json({
    success: false,
    message: 'Server-side audio transcription is ready for Whisper API integration with configured key.',
  });
});

router.post('/synthesize', (req: Request, res: Response) => {
  if (!config.textToSpeechApiKey) {
    res.status(200).json({
      success: true,
      adapter: 'browser-speech-synthesis',
      message: 'Browser SpeechSynthesisUtterance is active. Set TEXT_TO_SPEECH_API_KEY in .env for ElevenLabs neural voice synthesis.',
    });
    return;
  }

  res.status(501).json({
    success: false,
    message: 'Server-side TTS is ready for ElevenLabs API integration with configured key.',
  });
});

router.post('/tts', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text || text.length > 1500) {
    res.status(400).json({ success: false, message: 'Text is required (max 1500 characters).' });
    return;
  }
  if (!config.textToSpeechApiKey) {
    res.status(503).json({ success: false, message: 'TEXT_TO_SPEECH_API_KEY is not configured.' });
    return;
  }

  try {
    const upstream = await fetch('https://global.api.murf.ai/v1/speech/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': config.textToSpeechApiKey },
      body: JSON.stringify({ text, voiceId: config.murfVoiceId, format: 'MP3', sampleRate: 24000 }),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '');
      console.error('[Voice] Murf TTS failed:', upstream.status, detail.slice(0, 300));
      res.status(502).json({ success: false, message: `Murf TTS failed (${upstream.status})` });
      return;
    }

    res.status(200).set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' });
    const reader = upstream.body.getReader();
    req.on('close', () => reader.cancel().catch(() => {}));
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err: any) {
    console.error('[Voice] TTS error:', err.message);
    if (!res.headersSent) res.status(502).json({ success: false, message: 'Text-to-speech failed' });
    else res.end();
  }
});

export default router;
