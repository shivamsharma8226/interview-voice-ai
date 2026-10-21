import type { Server as HttpServer, IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

export const STT_WS_PATH = '/api/voice/stt';

/**
 * Relays browser microphone audio (16 kHz linear16) to Deepgram Flux and
 * Flux JSON messages back, so the Deepgram key never reaches the browser.
 */
export const attachVoiceGateway = (server: HttpServer): WebSocketServer => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url || '', 'http://localhost');
    if (url.pathname !== STT_WS_PATH) return;

    try {
      const token = url.searchParams.get('token');
      if (!token) throw new Error('No token');
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
      if (!(await User.exists({ _id: decoded.id }))) throw new Error('Unknown user');
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (client) => relay(client, url.searchParams));
  });

  return wss;
};

const relay = (client: WebSocket, params: URLSearchParams): void => {
  if (!config.speechToTextApiKey) {
    client.send(JSON.stringify({ type: 'Error', message: 'SPEECH_TO_TEXT_API_KEY is not configured' }));
    client.close();
    return;
  }

  const query = new URLSearchParams({
    model: config.deepgramModel,
    encoding: 'linear16',
    sample_rate: '16000',
    eot_threshold: params.get('eot_threshold') || '0.8',
    eot_timeout_ms: params.get('eot_timeout_ms') || '6000',
  });
  const eager = params.get('eager_eot_threshold');
  if (eager) query.set('eager_eot_threshold', eager);
  // Resume skills bias recognition toward the candidate's technical vocabulary
  for (const term of params.getAll('keyterm').slice(0, 50)) query.append('keyterm', term);

  const dg = new WebSocket(`wss://api.deepgram.com/v2/listen?${query.toString()}`, {
    headers: { Authorization: `Token ${config.speechToTextApiKey}` },
  });

  const pending: Buffer[] = [];

  dg.on('open', () => {
    for (const chunk of pending.splice(0)) dg.send(chunk);
  });
  dg.on('message', (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) client.send(data, { binary: isBinary });
  });
  dg.on('unexpected-response', (_req, res) => {
    client.send(JSON.stringify({ type: 'Error', message: `Deepgram rejected the connection (${res.statusCode})` }));
    client.close();
  });
  dg.on('error', (err) => {
    console.error('[VoiceGateway] Deepgram error:', err.message);
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'Error', message: 'Speech recognition connection failed' }));
    }
  });
  dg.on('close', () => client.close());

  client.on('message', (data, isBinary) => {
    if (!isBinary) {
      // Control messages from the browser (e.g. CloseStream) pass through as text
      if (dg.readyState === WebSocket.OPEN) dg.send(data.toString());
      return;
    }
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
    if (dg.readyState === WebSocket.OPEN) dg.send(chunk);
    else if (dg.readyState === WebSocket.CONNECTING) pending.push(chunk);
  });
  client.on('close', () => {
    if (dg.readyState === WebSocket.OPEN) {
      dg.send(JSON.stringify({ type: 'CloseStream' }));
    }
    dg.close();
  });
};
