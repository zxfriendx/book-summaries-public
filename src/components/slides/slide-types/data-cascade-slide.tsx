'use client';

import type { Slide } from '@/lib/types';

interface DataCascadeSlideProps {
  slide: Slide;
}

export function DataCascadeSlide({ slide }: DataCascadeSlideProps) {
  const isDark = slide.theme === 'dark';
  const points = slide.dataPoints ?? [];

  // Font sizes decrease for each successive data point
  const sizes = [
    'text-7xl sm:text-8xl',
    'text-5xl sm:text-6xl',
    'text-4xl sm:text-5xl',
    'text-3xl sm:text-4xl',
    'text-2xl sm:text-3xl',
  ];

  // Colors fade for lower items
  const colors = isDark
    ? ['text-white', 'text-[#3B82F6]', 'text-white/70', 'text-white/50', 'text-white/30']
    : ['text-midnight-violet', 'text-french-blue', 'text-french-blue/70', 'text-french-blue/50', 'text-deep-twilight/40'];

  return (
    <div className="flex-1 flex flex-col justify-center gap-4">
      {/* Headline */}
      <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-wide leading-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {slide.subtitle && (
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-deep-twilight/50'}`}>
          {slide.subtitle}
        </p>
      )}

      {/* Cascading numbers — stacked vertically, decreasing size */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        {points.map((point, i) => (
          <div key={i} className="flex items-baseline gap-4">
            <span className={`${sizes[i] ?? sizes[sizes.length - 1]} font-black leading-none tracking-tighter ${
              colors[i] ?? colors[colors.length - 1]
            }`}>
              {point.value}
            </span>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${
                isDark ? 'text-white/60' : 'text-deep-twilight/70'
              }`}>
                {point.label}
              </span>
              {point.context && (
                <span className={`text-xs ${
                  isDark ? 'text-white/30' : 'text-deep-twilight/40'
                }`}>
                  {point.context}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Content / context paragraph */}
      {slide.content && (
        <p className={`text-sm leading-relaxed ${
          isDark ? 'text-white/50' : 'text-deep-twilight/60'
        }`}>
          {slide.content}
        </p>
      )}
    </div>
  );
}
