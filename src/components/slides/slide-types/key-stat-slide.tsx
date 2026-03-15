'use client';

import type { Slide } from '@/lib/types';

interface KeyStatSlideProps {
  slide: Slide;
}

export function KeyStatSlide({ slide }: KeyStatSlideProps) {
  const isDark = slide.theme === 'dark';
  const hasDataPoints = slide.dataPoints && slide.dataPoints.length > 0;

  const displayNumber = slide.number !== undefined
    ? slide.number >= 1000
      ? slide.number.toLocaleString()
      : String(slide.number)
    : '—';

  if (hasDataPoints) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        {slide.title && (
          <p className={`text-sm uppercase tracking-widest font-semibold ${
            isDark ? 'text-[#3B82F6]' : 'text-french-blue/60'
          }`}>
            {slide.title}
          </p>
        )}

        <div className={`grid gap-6 ${
          slide.dataPoints!.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          {slide.dataPoints!.map((point, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`text-4xl sm:text-5xl font-black leading-none ${
                isDark ? 'text-[#3B82F6]' : 'text-french-blue'
              }`}>
                {point.value}
              </div>
              <div className={`text-sm font-medium mt-1 ${
                isDark ? 'text-white' : 'text-midnight-violet'
              }`}>
                {point.label}
              </div>
              {point.context && (
                <div className={`text-xs mt-0.5 ${
                  isDark ? 'text-white/40' : 'text-deep-twilight/50'
                }`}>
                  {point.context}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
      {/* Decorative background circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-64 h-64 rounded-full border-2 ${
          isDark ? 'border-white/5' : 'border-frozen-water/20'
        }`} />
      </div>

      {slide.title && (
        <p className={`text-sm uppercase tracking-widest font-semibold relative z-10 ${
          isDark ? 'text-[#3B82F6]' : 'text-french-blue/60'
        }`}>
          {slide.title}
        </p>
      )}

      <div className="relative z-10">
        <div className={`text-7xl sm:text-8xl font-black leading-none ${
          isDark ? 'text-white' : 'text-french-blue'
        }`}>
          {displayNumber}
        </div>
        {slide.label && (
          <div className={`text-xl font-medium mt-2 ${
            isDark ? 'text-white/60' : 'text-midnight-violet'
          }`}>
            {slide.label}
          </div>
        )}
      </div>

      <div className={`w-16 h-0.5 relative z-10 ${isDark ? 'bg-[#3B82F6]/30' : 'bg-french-blue/30'}`} />

      {slide.context && (
        <p className={`text-base leading-relaxed max-w-[75%] relative z-10 ${
          isDark ? 'text-white/60' : 'text-deep-twilight/70'
        }`}>
          {slide.context}
        </p>
      )}
    </div>
  );
}
