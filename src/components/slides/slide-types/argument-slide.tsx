'use client';

import type { Slide } from '@/lib/types';

interface ArgumentSlideProps {
  slide: Slide;
}

export function ArgumentSlide({ slide }: ArgumentSlideProps) {
  const isDark = slide.theme === 'dark';

  return (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {/* Headline */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Argument vs Rebuttal — two-column with center visual */}
      <div className="flex-1 flex items-stretch gap-0 relative">
        {/* Center divider with VS or visual */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <svg viewBox="0 0 60 60" className="w-14 h-14">
            <circle cx="30" cy="30" r="28" fill={isDark ? '#1A1A1A' : '#fff'} stroke={isDark ? '#3B82F6' : '#26408B'} strokeWidth="2" />
            <text x="30" y="32" textAnchor="middle" dominantBaseline="central"
              className={`text-[11px] font-black ${isDark ? 'fill-[#3B82F6]' : 'fill-[#26408B]'}`}>
              VS
            </text>
          </svg>
        </div>

        {/* The Argument (left) */}
        <div className={`flex-1 rounded-l-xl p-5 flex flex-col gap-3 ${
          isDark ? 'bg-white/5' : 'bg-deep-twilight/5'
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-white/40' : 'text-deep-twilight/40'
          }`}>
            The Argument
          </span>
          <p className={`text-sm leading-relaxed ${
            isDark ? 'text-white/60' : 'text-deep-twilight/70'
          }`}>
            {slide.thesis}
          </p>
        </div>

        {/* Vertical divider */}
        <div className={`w-px ${isDark ? 'bg-white/10' : 'bg-french-blue/15'}`} />

        {/* The Rebuttal (right) */}
        <div className={`flex-1 rounded-r-xl p-5 flex flex-col gap-3 ${
          isDark ? 'bg-[#3B82F6]/10' : 'bg-french-blue/5'
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-[#3B82F6]' : 'text-french-blue'
          }`}>
            The Rebuttal
          </span>
          <p className={`text-sm leading-relaxed font-medium ${
            isDark ? 'text-white' : 'text-midnight-violet'
          }`}>
            {slide.counterpoint}
          </p>
        </div>
      </div>

      {/* Evidence / Resolution */}
      {slide.evidence && (
        <div className={`rounded-lg p-4 border ${
          isDark
            ? 'bg-[#3B82F6]/5 border-[#3B82F6]/20'
            : 'bg-frozen-water/30 border-frozen-water/50'
        }`}>
          <p className={`text-sm leading-relaxed ${
            isDark ? 'text-white/70' : 'text-midnight-violet/80'
          }`}>
            {slide.evidence}
          </p>
        </div>
      )}
    </div>
  );
}
