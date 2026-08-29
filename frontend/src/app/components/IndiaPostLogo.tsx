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
    sm: { width: 34, height: 34 },
    md: { width: 44, height: 44 },
    lg: { width: 54, height: 54 },
    xl: { width: 64, height: 64 },
  };

  const currentSize = emblemSizes[size] || emblemSizes.md;

  if (variant === 'official') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        {/* Emblem with Sanskrit above */}
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold text-[#A31D1D] tracking-wider leading-none mb-0.5 select-none">
            भारतीय डाक
          </span>
          <div 
            className="relative flex items-center justify-center shrink-0 rounded-md shadow-xs overflow-hidden"
            style={{
              width: `${currentSize.width}px`,
              height: `${currentSize.height * 0.78}px`,
              background: '#D1242F',
            }}
          >
            {/* Winged Postal SVG Emblem */}
            <svg
              viewBox="0 0 100 80"
              className="w-full h-full p-1"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Gold Top Wing */}
              <path
                d="M10 58 L50 16 L90 58 L50 40 Z"
                fill="#FAB52C"
              />
              {/* Deep Red Wing Fold */}
              <path
                d="M14 60 L50 24 L86 60 L50 46 Z"
                fill="#A31D1D"
              />
              {/* Gold Diagonal Streak */}
              <path
                d="M26 62 L66 18 L74 24 L34 68 Z"
                fill="#FAB52C"
              />
              {/* White Envelope Notch */}
              <path
                d="M42 42 L50 32 L58 42 L50 38 Z"
                fill="#FFFFFF"
              />
              {/* Horizontal Speed Lines */}
              <line x1="16" y1="64" x2="84" y2="64" stroke="#FAB52C" strokeWidth="3" strokeLinecap="round" />
              <line x1="22" y1="70" x2="78" y2="70" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Text Section */}
        <div className="flex flex-col justify-center">
          <span className="text-sm md:text-base font-black text-[#A31D1D] tracking-tight leading-tight">
            Department of Posts
          </span>
          <span className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
            Government of India
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official India Post Winged Envelope Emblem */}
      <div className="flex flex-col items-center">
        {variant !== 'symbol-only' && (
          <span className={`text-[8px] font-bold tracking-wider leading-none mb-0.5 ${isLightText ? 'text-[#FAB52C]' : 'text-[#A31D1D]'}`}>
            भारतीय डाक
          </span>
        )}
        <div 
          className="relative flex items-center justify-center shrink-0 rounded-lg shadow-sm overflow-hidden"
          style={{
            width: `${currentSize.width}px`,
            height: `${currentSize.height * 0.8}px`,
            background: 'linear-gradient(135deg, #D1242F 0%, #B01E28 100%)',
          }}
        >
          <svg
            viewBox="0 0 100 80"
            className="w-full h-full p-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 58 L50 16 L90 58 L50 40 Z" fill="#FAB52C" />
            <path d="M14 60 L50 24 L86 60 L50 46 Z" fill="#A31D1D" />
            <path d="M26 62 L66 18 L74 24 L34 68 Z" fill="#FAB52C" />
            <path d="M42 42 L50 32 L58 42 L50 38 Z" fill="#FFFFFF" />
            <line x1="16" y1="64" x2="84" y2="64" stroke="#FAB52C" strokeWidth="3" strokeLinecap="round" />
            <line x1="22" y1="70" x2="78" y2="70" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Typography Section */}
      {variant !== 'symbol-only' && (
        <div className="flex flex-col justify-center">
          <span className={`font-black text-sm tracking-tight leading-tight ${isLightText ? 'text-white' : 'text-[#A31D1D]'}`}>
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

