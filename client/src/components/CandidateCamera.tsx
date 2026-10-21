'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface CandidateCameraProps {
  isEnabled: boolean;
  onCameraReady?: () => void;
  onPermissionDenied?: (msg: string) => void;
  className?: string;
}

/**
 * CandidateCamera — Live webcam preview using getUserMedia().
 * 
 * - Requests camera permission only when isEnabled becomes true.
 * - Cleans up stream on unmount or when disabled.
 * - Shows permission error state with a helpful fallback.
 * - Does NOT record or upload any video data.
 */
export const CandidateCamera: React.FC<CandidateCameraProps> = ({
  isEnabled,
  onCameraReady,
  onPermissionDenied,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const startCamera = useCallback(async () => {
    if (status === 'active' || status === 'requesting') return;
    setStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false, // Audio handled separately by Web Speech API
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setStatus('active');
          onCameraReady?.();
        };
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('denied');
        const msg = 'Camera permission was denied. Your face won\'t be visible, but the interview can still proceed normally.';
        setErrorMsg(msg);
        onPermissionDenied?.(msg);
      } else if (err.name === 'NotFoundError') {
        setStatus('error');
        const msg = 'No camera found on this device.';
        setErrorMsg(msg);
        onPermissionDenied?.(msg);
      } else {
        setStatus('error');
        const msg = `Camera error: ${err.message}`;
        setErrorMsg(msg);
        onPermissionDenied?.(msg);
      }
    }
  }, [status, onCameraReady, onPermissionDenied]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  useEffect(() => {
    if (isEnabled) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isEnabled]);

  if (!isEnabled || status === 'denied' || status === 'error') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-slate-900/90 rounded-2xl border border-slate-700 overflow-hidden ${className}`}
      >
        {status === 'denied' || status === 'error' ? (
          <div className="flex flex-col items-center gap-2 px-3 text-center">
            <AlertCircle className="w-6 h-6 text-slate-500" />
            <p className="text-[10px] text-slate-500 leading-tight">{errorMsg || 'Camera unavailable'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <CameraOff className="w-6 h-6 text-slate-600" />
            <p className="text-[10px] text-slate-600">Camera off</p>
          </div>
        )}

        {/* Avatar placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-16 h-16 rounded-full bg-slate-600" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-xl ${className}`}
    >
      {status === 'requesting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
          <div className="flex flex-col items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400 animate-pulse" />
            <p className="text-[10px] text-slate-400">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Mirror the video so it looks natural */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Camera active indicator */}
      {status === 'active' && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded-lg backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] text-white font-medium">LIVE</span>
        </div>
      )}

      {/* Subtle vignette for cinematic look */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
};
