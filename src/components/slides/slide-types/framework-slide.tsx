'use client';

import type { Slide } from '@/lib/types';

interface FrameworkSlideProps {
  slide: Slide;
}

export function FrameworkSlide({ slide }: FrameworkSlideProps) {
  const isDark = slide.theme === 'dark';
  const quadrants = slide.quadrants ?? [];
  const isGrid = quadrants.length === 4;

  return (
    <div className="flex-1 flex flex-col justify-center gap-4">
      {/* Headline */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight text-center ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Framework name */}
      {slide.frameworkName && (
        <p className={`text-sm text-center ${
          isDark ? 'text-white/40' : 'text-deep-twilight/50'
        }`}>
          {slide.frameworkName}
        </p>
      )}

      {/* Grid layout */}
      {isGrid ? (
        <div className={`grid grid-cols-2 gap-px rounded-xl overflow-hidden flex-1 ${
          isDark ? 'bg-[#3B82F6]/30' : 'bg-french-blue/20'
        }`}>
          {quadrants.map((q, i) => (
            <div
              key={i}
              className={`p-5 flex flex-col justify-center gap-2 ${
                isDark ? 'bg-[#1A1A1A]' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-black ${
                  isDark ? 'text-[#3B82F6]' : 'text-french-blue'
                }`}>{i + 1}</span>
                <h3 className={`text-sm font-bold uppercase tracking-wide ${
                  isDark ? 'text-white' : 'text-midnight-violet'
                }`}>
                  {q.label}
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${
                isDark ? 'text-white/50' : 'text-deep-twilight/60'
              }`}>
                {q.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* List layout for non-4 items */
        <div className={`grid gap-3 flex-1 ${
          quadrants.length === 3 ? 'grid-cols-3' : quadrants.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
        }`}>
          {quadrants.map((q, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 flex flex-col items-center text-center gap-3 border ${
                isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-frozen-water/30 border-frozen-water/50'
              }`}
            >
              {/* Icon placeholder */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDark ? 'bg-[#3B82F6]/20' : 'bg-french-blue/10'
              }`}>
                <svg viewBox="0 0 24 24" className={`w-6 h-6 ${isDark ? 'text-[#3B82F6]' : 'text-french-blue'}`}>
                  <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
                  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h3 className={`text-base font-bold ${
                isDark ? 'text-white' : 'text-midnight-violet'
              }`}>
                {q.label}
              </h3>
              <p className={`text-xs leading-relaxed ${
                isDark ? 'text-white/50' : 'text-deep-twilight/60'
              }`}>
                {q.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
