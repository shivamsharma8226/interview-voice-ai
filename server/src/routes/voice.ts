import { Router, Request, Response } from 'express';
import { config } from '../config/env.js';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      clientSpeechRecognitionSupported: true,
      clientSpeechSynthesisSupported: true,
      hasExternalSttKey: Boolean(config.speechToTextApiKey && config.speechToTextApiKey.length > 0),
      hasExternalTtsKey: Boolean(config.textToSpeechApiKey && config.textToSpeechApiKey.length > 0),
      preferredEngine: 'browser-native', // Free, zero-latency, private client-side Web Speech API
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

export default router;
