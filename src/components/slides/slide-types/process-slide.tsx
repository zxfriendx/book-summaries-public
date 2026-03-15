'use client';

import type { Slide } from '@/lib/types';

interface ProcessSlideProps {
  slide: Slide;
}

export function ProcessSlide({ slide }: ProcessSlideProps) {
  const isDark = slide.theme === 'dark';
  const stages = slide.stages ?? [];

  return (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {/* Headline */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Horizontal timeline (for 3-5 stages) or vertical (for 6+) */}
      {stages.length <= 5 ? (
        /* Horizontal film-strip style */
        <div className="flex-1 flex flex-col justify-center gap-4">
          {/* Timeline bar */}
          <div className="relative flex items-center mx-4">
            <div className={`absolute left-0 right-0 h-0.5 ${
              isDark ? 'bg-[#3B82F6]/30' : 'bg-french-blue/20'
            }`} />
            <div className="relative flex justify-between w-full">
              {stages.map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 ${
                  i === stages.length - 1
                    ? isDark ? 'bg-[#3B82F6] border-[#3B82F6]' : 'bg-french-blue border-french-blue'
                    : isDark ? 'bg-[#1A1A1A] border-[#3B82F6]/50' : 'bg-white border-french-blue/40'
                }`} />
              ))}
            </div>
          </div>

          {/* Stage cards */}
          <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
            {stages.map((stage, i) => (
              <div key={i} className={`rounded-lg p-3 border ${
                isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-frozen-water/20 border-frozen-water/40'
              }`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                  isDark ? 'text-[#3B82F6]' : 'text-french-blue'
                }`}>
                  {stage.label}
                </p>
                <p className={`text-[11px] leading-relaxed ${
                  isDark ? 'text-white/50' : 'text-deep-twilight/60'
                }`}>
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Vertical timeline for many stages */
        <div className="flex-1 flex flex-col gap-0 relative">
          <div className={`absolute left-[15px] top-4 bottom-4 w-0.5 ${
            isDark ? 'bg-[#3B82F6]/20' : 'bg-french-blue/15'
          }`} />
          {stages.map((stage, i) => (
            <div key={i} className="flex items-start gap-4 relative py-2">
              <div className={`relative z-10 shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center ${
                i === stages.length - 1
                  ? isDark ? 'bg-[#3B82F6]' : 'bg-french-blue'
                  : isDark ? 'bg-[#1A1A1A] border-2 border-[#3B82F6]/40' : 'bg-white border-2 border-french-blue/40'
              }`}>
                <span className={`text-xs font-bold ${
                  i === stages.length - 1 ? 'text-white' : isDark ? 'text-[#3B82F6]' : 'text-french-blue'
                }`}>{i + 1}</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-midnight-violet'}`}>
                  {stage.label}
                </h3>
                <p className={`text-xs mt-0.5 leading-relaxed ${
                  isDark ? 'text-white/50' : 'text-deep-twilight/60'
                }`}>
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
