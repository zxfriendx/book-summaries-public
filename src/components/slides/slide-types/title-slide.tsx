'use client';

import type { Slide } from '@/lib/types';

interface TitleSlideProps {
  slide: Slide;
  coverImage?: string;
}

export function TitleSlide({ slide, coverImage }: TitleSlideProps) {
  const isDark = slide.theme === 'dark';

  return (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {/* Subtitle / context line */}
      {slide.subtitle && (
        <p className={`text-xs uppercase tracking-[0.2em] font-semibold ${
          isDark ? 'text-[#3B82F6]' : 'text-french-blue/60'
        }`}>
          {slide.subtitle}
        </p>
      )}

      {/* Title */}
      <h1 className={`text-3xl sm:text-4xl font-black leading-[1.05] tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h1>

      {/* Accent line */}
      <div className={`w-20 h-1 ${isDark ? 'bg-[#3B82F6]' : 'bg-french-blue'}`} />

      {/* Author */}
      {slide.content && (
        <p className={`text-base font-medium ${
          isDark ? 'text-white/60' : 'text-deep-twilight/60'
        }`}>
          {slide.content}
        </p>
      )}
    </div>
  );
}
