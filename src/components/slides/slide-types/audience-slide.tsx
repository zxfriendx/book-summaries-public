'use client';

import type { Slide } from '@/lib/types';
import { CheckCircle } from 'lucide-react';

interface AudienceSlideProps {
  slide: Slide;
}

export function AudienceSlide({ slide }: AudienceSlideProps) {
  const isDark = slide.theme === 'dark';

  return (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {/* Headline */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Divider */}
      <div className={`w-16 h-1 ${isDark ? 'bg-[#3B82F6]' : 'bg-french-blue'}`} />

      {/* Audience items */}
      <div className="flex flex-col gap-4">
        {slide.items?.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
              isDark ? 'text-[#3B82F6]' : 'text-french-blue'
            }`} />
            <span className={`text-base leading-relaxed ${
              isDark ? 'text-white/70' : 'text-deep-twilight/80'
            }`}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
