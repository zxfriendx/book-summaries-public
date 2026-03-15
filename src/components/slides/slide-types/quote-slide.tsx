'use client';

import type { Slide } from '@/lib/types';

interface QuoteSlideProps {
  slide: Slide;
}

export function QuoteSlide({ slide }: QuoteSlideProps) {
  const isDark = slide.theme === 'dark';

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 px-4">
      {/* Context paragraph */}
      {slide.context && (
        <p className={`text-sm leading-relaxed max-w-[80%] ${
          isDark ? 'text-white/40' : 'text-deep-twilight/60'
        }`}>
          {slide.context}
        </p>
      )}

      {/* Large quote mark — SVG */}
      <svg viewBox="0 0 40 30" className={`w-12 h-9 ${isDark ? 'text-[#3B82F6]/30' : 'text-french-blue/20'}`}>
        <text x="0" y="28" className="text-[36px] font-serif fill-current">&ldquo;</text>
      </svg>

      {/* Quote text — large and bold */}
      <blockquote className={`text-xl sm:text-2xl font-bold leading-relaxed max-w-[85%] ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        &ldquo;{slide.quote}&rdquo;
      </blockquote>

      {/* Divider */}
      <div className={`w-16 h-0.5 ${isDark ? 'bg-[#3B82F6]/30' : 'bg-french-blue/30'}`} />

      {/* Attribution */}
      {slide.attribution && (
        <p className={`text-sm font-semibold uppercase tracking-wider ${
          isDark ? 'text-[#3B82F6]' : 'text-french-blue'
        }`}>
          {slide.attribution}
        </p>
      )}
    </div>
  );
}
