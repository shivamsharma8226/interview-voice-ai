'use client';

import React from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  color?: 'purple' | 'emerald' | 'blue';
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  color = 'purple',
  barCount = 12,
}) => {
  const colorMap = {
    purple: 'bg-violet-400',
    emerald: 'bg-emerald-400',
    blue: 'bg-indigo-400',
  };

  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className="flex items-center gap-[3px] h-8 px-2">
      {bars.map((i) => {
        // Vary heights and delays for a natural voice audio look
        const delay = (i * 0.12).toFixed(2);
        const duration = (0.6 + (i % 5) * 0.15).toFixed(2);

        return (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-all duration-200 ${colorMap[color]} ${
              isActive ? 'animate-pulse' : 'opacity-40'
            }`}
            style={{
              height: isActive ? `${Math.max(6, Math.sin(i) * 22 + 10)}px` : '4px',
              animationDuration: isActive ? `${duration}s` : '0s',
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};
