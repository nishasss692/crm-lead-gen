'use client';
import React from 'react';

interface IndiaPostLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'symbol-only' | 'header';
  textColor?: 'dark' | 'light';
  className?: string;
}

export default function IndiaPostLogo({
  size = 'md',
  variant = 'full',
  textColor = 'dark',
  className = '',
}: IndiaPostLogoProps) {
  const isLightText = textColor === 'light';

  // Dimension scaling for the emblem
  const emblemSizes = {
    sm: { width: 32, height: 32 },
    md: { width: 44, height: 44 },
    lg: { width: 54, height: 54 },
    xl: { width: 68, height: 68 },
  };

  const currentSize = emblemSizes[size] || emblemSizes.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official India Post Winged Envelope Emblem */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-xl shadow-md overflow-hidden transition-transform duration-200 hover:scale-105"
        style={{
          width: `${currentSize.width}px`,
          height: `${currentSize.height}px`,
          background: 'linear-gradient(135deg, #D1242F 0%, #B01E28 100%)',
          boxShadow: '0 4px 14px rgba(209, 36, 47, 0.3)',
        }}
      >
        {/* Authentic Geometric Wings & Postal Flaps SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Background Accent */}
          <rect width="100" height="100" rx="14" fill="#D1242F" />
          
          {/* Flying Golden Wing Top Flap */}
          <path
            d="M18 68 L50 22 L82 68 L50 48 Z"
            fill="#FAB52C"
            opacity="0.95"
          />

          {/* Postal Red Dynamic Wing Folds */}
          <path
            d="M20 70 L50 32 L80 70 L50 56 Z"
            fill="#B01E28"
          />

          {/* Golden Yellow Diagonal Accent */}
          <path
            d="M32 72 L68 28 L76 34 L40 78 Z"
            fill="#FAB52C"
          />

          {/* Pure White Central Aerodynamic Envelope Notch */}
          <path
            d="M42 50 L50 38 L58 50 L50 46 Z"
            fill="#FFFFFF"
          />

          {/* Modern Speed Envelope Lines */}
          <line x1="24" y1="74" x2="76" y2="74" stroke="#FAB52C" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="30" y1="80" x2="70" y2="80" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
        </svg>

        {/* Gloss highlight */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/20 pointer-events-none" />
      </div>

      {/* Typography Section */}
      {variant !== 'symbol-only' && (
        <div className="flex flex-col justify-center">
          {/* Top Title: Bilingual India Post Brand */}
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-wider uppercase ${
                isLightText ? 'text-[#FAB52C]' : 'text-[#D1242F]'
              } ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : size === 'xl' ? 'text-lg' : 'text-sm'}`}
              style={{ letterSpacing: '0.04em' }}
            >
              भारतीय डाक
            </span>
            <span className={isLightText ? 'text-slate-400' : 'text-slate-300'}>•</span>
            <span
              className={`font-extrabold tracking-tight uppercase ${
                isLightText ? 'text-white' : 'text-slate-900'
              } ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : size === 'xl' ? 'text-lg' : 'text-sm'}`}
            >
              India Post
            </span>
          </div>

          {/* Subtitle variants */}
          {variant === 'full' && (
            <p
              className={`text-[10px] sm:text-[11px] font-medium leading-tight mt-1 ${
                isLightText ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Department of Posts • Ministry of Communications, Govt. of India
            </p>
          )}

          {variant === 'header' && (
            <p
              className={`text-[10px] sm:text-[11px] font-semibold leading-tight mt-0.5 ${
                isLightText ? 'text-amber-300/90' : 'text-slate-500'
              }`}
            >
              Govt. of India Enterprise • Karnataka Circle
            </p>
          )}

          {variant === 'compact' && (
            <p
              className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                isLightText ? 'text-amber-300/90' : 'text-[#D1242F]'
              }`}
            >
              Karnataka Postal Circle
            </p>
          )}
        </div>
      )}
    </div>
  );
}
