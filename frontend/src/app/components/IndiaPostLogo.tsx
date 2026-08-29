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
    sm: { width: 36, height: 28 },
    md: { width: 48, height: 38 },
    lg: { width: 60, height: 48 },
    xl: { width: 72, height: 56 },
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
            background: '#D1242F',
          }}
        >
          {/* Authentic India Post Wing Silhouette */}
          <svg
            viewBox="0 0 120 90"
            className="w-full h-full p-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Golden Flying Wing */}
            <path
              d="M12 68 L60 14 L108 68 L60 46 Z"
              fill="#FAB52C"
            />
            {/* Dark Red Geometric Inner Fold */}
            <path
              d="M18 70 L60 24 L102 70 L60 52 Z"
              fill="#A31D1D"
            />
            {/* Dynamic Gold Forward Slant */}
            <path
              d="M32 72 L80 18 L90 24 L42 78 Z"
              fill="#FAB52C"
            />
            {/* Central White Aero-Fold */}
            <path
              d="M50 48 L60 36 L70 48 L60 44 Z"
              fill="#FFFFFF"
            />
            {/* Bottom Postal Speed Stripes */}
            <line x1="20" y1="74" x2="100" y2="74" stroke="#FAB52C" strokeWidth="4" strokeLinecap="round" />
            <line x1="28" y1="82" x2="92" y2="82" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
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


