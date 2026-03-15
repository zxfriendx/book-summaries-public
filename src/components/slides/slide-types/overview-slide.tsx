'use client';

import type { Slide } from '@/lib/types';

interface OverviewSlideProps {
  slide: Slide;
}

export function OverviewSlide({ slide }: OverviewSlideProps) {
  const isDark = slide.theme === 'dark';

  return (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {/* Headline — bold assertion style */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Hook text */}
      <p className={`text-base leading-relaxed ${
        isDark ? 'text-white/70' : 'text-deep-twilight/80'
      }`}>
        {slide.content}
      </p>

      {/* Divider */}
      <div className={`w-full h-px ${isDark ? 'bg-white/10' : 'bg-french-blue/10'}`} />

      {/* Stats grid */}
      {slide.stats && (
        <div className="grid grid-cols-3 gap-3">
          {slide.stats.map((stat, i) => (
            <div
              key={i}
              className={`text-center p-4 rounded-xl border ${
                isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-frozen-water/30 border-frozen-water/50'
              }`}
            >
              <div className={`text-2xl font-black ${
                isDark ? 'text-[#3B82F6]' : 'text-french-blue'
              }`}>{stat.value}</div>
              <div className={`text-xs mt-1 uppercase tracking-wide ${
                isDark ? 'text-white/40' : 'text-deep-twilight/60'
              }`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
