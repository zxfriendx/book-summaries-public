'use client';

import type { Slide } from '@/lib/types';
import { Star } from 'lucide-react';

interface RatingSlideProps {
  slide: Slide;
}

export function RatingSlide({ slide }: RatingSlideProps) {
  const isDark = slide.theme === 'dark';
  const rating = slide.rating ?? 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
      {/* Label */}
      <p className={`text-xs uppercase tracking-widest font-semibold ${
        isDark ? 'text-[#3B82F6]' : 'text-french-blue/60'
      }`}>
        {slide.title || 'Final Verdict'}
      </p>

      {/* Stars */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-10 h-10 ${
              star <= rating
                ? isDark ? 'text-[#3B82F6] fill-[#3B82F6]' : 'text-french-blue fill-french-blue'
                : isDark ? 'text-white/15' : 'text-light-blue/40'
            }`}
          />
        ))}
      </div>

      {/* Rating number */}
      <div className={`text-6xl font-black ${isDark ? 'text-white' : 'text-midnight-violet'}`}>
        {rating}<span className={`text-2xl ${isDark ? 'text-white/30' : 'text-deep-twilight/40'}`}>/5</span>
      </div>

      {/* Divider */}
      <div className={`w-16 h-0.5 ${isDark ? 'bg-[#3B82F6]/30' : 'bg-french-blue/30'}`} />

      {/* Verdict */}
      {slide.verdict && (
        <p className={`text-lg leading-relaxed max-w-[80%] ${
          isDark ? 'text-white/70' : 'text-deep-twilight/80'
        }`}>
          {slide.verdict}
        </p>
      )}
    </div>
  );
}
