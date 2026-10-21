import dotenv from 'dotenv';
import path from 'path';

// Load server/.env first, then the repo-root .env (the one documented in .env.example).
// dotenv never overrides values that are already set, so server/.env wins.
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewai',
  jwtSecret: process.env.JWT_SECRET || 'interviewai_jwt_default_secret_key_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  llmProvider: (process.env.LLM_PROVIDER || 'local').toLowerCase(),
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'gemini-1.5-flash',
  speechToTextApiKey: process.env.SPEECH_TO_TEXT_API_KEY || '',
  textToSpeechApiKey: process.env.TEXT_TO_SPEECH_API_KEY || '',
  murfVoiceId: process.env.MURF_VOICE_ID || 'en-US-wayne',
  deepgramModel: process.env.DEEPGRAM_MODEL || 'flux-general-en',
  uploadDir: path.resolve(process.cwd(), 'uploads'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
};
