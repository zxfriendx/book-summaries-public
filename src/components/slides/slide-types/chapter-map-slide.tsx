'use client';

import type { Slide } from '@/lib/types';

interface ChapterMapSlideProps {
  slide: Slide;
}

export function ChapterMapSlide({ slide }: ChapterMapSlideProps) {
  const isDark = slide.theme === 'dark';

  return (
    <div className="flex-1 flex flex-col justify-center gap-4">
      {/* Headline */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Divider */}
      <div className={`w-16 h-1 ${isDark ? 'bg-[#3B82F6]' : 'bg-french-blue'}`} />

      {/* Chapters */}
      <div className="flex flex-col gap-3">
        {slide.chapters?.map((chapter, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              isDark ? 'bg-[#3B82F6]/20' : 'bg-french-blue/10'
            }`}>
              <span className={`text-sm font-black ${
                isDark ? 'text-[#3B82F6]' : 'text-french-blue'
              }`}>{i + 1}</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-base font-bold ${
                isDark ? 'text-white' : 'text-midnight-violet'
              }`}>{chapter.title}</h3>
              <p className={`text-sm mt-0.5 ${
                isDark ? 'text-white/40' : 'text-deep-twilight/60'
              }`}>{chapter.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
