'use client';
import React from 'react';

interface IndiaPostLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'symbol-only' | 'header' | 'official';
  textColor?: 'dark' | 'light';
  className?: string;
}

export default function IndiaPostLogo({
  size = 'md',
  variant = 'official',
  textColor = 'dark',
  className = '',
}: IndiaPostLogoProps) {
  const isLightText = textColor === 'light';

  // Dimension scaling for the emblem
  const emblemSizes = {
    sm: { width: 38, height: 30 },
    md: { width: 50, height: 40 },
    lg: { width: 62, height: 50 },
    xl: { width: 75, height: 60 },
  };

  const currentSize = emblemSizes[size] || emblemSizes.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official India Post Winged Emblem with Devanagari */}
      <div className="flex flex-col items-center shrink-0">
        <span 
          className="text-[9px] font-bold text-[#A31D1D] tracking-wider leading-none mb-0.5 select-none"
          style={{ fontFamily: "'Noto Sans Devanagari', 'Segoe UI', system-ui, sans-serif" }}
        >
          भारतीय डाक
        </span>
        <div 
          className="relative flex items-center justify-center shrink-0 rounded-xs shadow-xs overflow-hidden"
          style={{
            width: `${currentSize.width}px`,
            height: `${currentSize.height}px`,
            background: '#C41220',
          }}
        >
          {/* Authentic India Post Wing Silhouette */}
          <svg
            viewBox="0 0 100 80"
            className="w-full h-full p-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Wing Stroke (Angular Forward Flight) */}
            <path
              d="M12 56 L48 12 L88 12 L38 56 Z"
              fill="#FAB52C"
            />
            {/* Middle Wing Stroke (Speed Acceleration) */}
            <path
              d="M18 64 L54 22 L76 22 L32 64 Z"
              fill="#FAB52C"
            />
            {/* Bottom Wing / Envelope Base */}
            <path
              d="M24 72 L60 32 L68 32 L28 72 Z"
              fill="#FAB52C"
            />
            {/* Aerodynamic Speed Lines */}
            <rect x="36" y="68" width="52" height="3.5" rx="1.75" fill="#FAB52C" />
            <rect x="52" y="74" width="36" height="2" rx="1" fill="#FFFFFF" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* Typography: Department of Posts / Government of India */}
      {variant !== 'symbol-only' && (
        <div className="flex flex-col justify-center">
          <span className={`text-sm md:text-base font-black tracking-tight leading-tight ${isLightText ? 'text-white' : 'text-[#A31D1D]'}`}>
            Department of Posts
          </span>
          <span className={`text-[11px] font-medium leading-tight mt-0.5 ${isLightText ? 'text-slate-300' : 'text-slate-500'}`}>
            Government of India
          </span>
        </div>
      )}
    </div>
  );
}



