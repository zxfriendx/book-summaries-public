'use client';

import type { Slide } from '@/lib/types';

interface ActionSlideProps {
  slide: Slide;
}

export function ActionSlide({ slide }: ActionSlideProps) {
  const isDark = slide.theme === 'dark';
  const steps = slide.steps ?? [];

  return (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {/* Headline */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Accent line */}
      <div className={`w-16 h-1 ${isDark ? 'bg-[#3B82F6]' : 'bg-french-blue'}`} />

      {/* Steps */}
      <div className="flex flex-col gap-4">
        {steps.map((item, i) => (
          <div key={i} className="flex items-start gap-4">
            {/* Step number — large and bold */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isDark ? 'bg-[#3B82F6]/20' : 'bg-french-blue/10'
            }`}>
              <span className={`text-lg font-black ${
                isDark ? 'text-[#3B82F6]' : 'text-french-blue'
              }`}>{i + 1}</span>
            </div>

            {/* Step content */}
            <div className="flex-1 pt-1">
              <p className={`text-base font-bold leading-snug ${
                isDark ? 'text-white' : 'text-midnight-violet'
              }`}>
                {item.step}
              </p>
              {item.example && (
                <p className={`text-sm mt-1.5 leading-relaxed ${
                  isDark ? 'text-white/40' : 'text-deep-twilight/50'
                }`}>
                  {item.example}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
