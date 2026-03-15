'use client';

import type { Slide } from '@/lib/types';

interface ComparisonSlideProps {
  slide: Slide;
}

export function ComparisonSlide({ slide }: ComparisonSlideProps) {
  const isDark = slide.theme === 'dark';

  return (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {/* Headline */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Two columns with vertical divider */}
      <div className="flex-1 flex gap-0 relative">
        {/* Vertical divider */}
        <div className={`absolute left-1/2 top-0 bottom-0 w-px ${
          isDark ? 'bg-white/15' : 'bg-french-blue/15'
        }`} />

        {/* Left column — "old way" */}
        <div className="flex-1 pr-5 flex flex-col gap-3">
          <div className={`inline-flex self-start px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${
            isDark ? 'bg-white/10 text-white/60' : 'bg-deep-twilight/5 text-deep-twilight/50'
          }`}>
            {slide.leftColumn?.heading}
          </div>
          <ul className="flex flex-col gap-3">
            {slide.leftColumn?.points?.map((point, i) => (
              <li key={i} className={`text-sm leading-relaxed ${
                isDark ? 'text-white/50' : 'text-deep-twilight/60'
              }`}>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Right column — "new way" */}
        <div className="flex-1 pl-5 flex flex-col gap-3">
          <div className={`inline-flex self-start px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${
            isDark ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'bg-french-blue/10 text-french-blue'
          }`}>
            {slide.rightColumn?.heading}
          </div>
          <ul className="flex flex-col gap-3">
            {slide.rightColumn?.points?.map((point, i) => (
              <li key={i} className={`text-sm leading-relaxed font-medium ${
                isDark ? 'text-white' : 'text-midnight-violet'
              }`}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
