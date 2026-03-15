'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Slide } from '@/lib/types';
import { SlideRenderer } from './slide-renderer';
import { cn } from '@/lib/utils';

interface SlideCarouselProps {
  slides: Slide[];
  coverImage?: string;
  onSlideChange?: (index: number) => void;
}

export function SlideCarousel({ slides, coverImage, onSlideChange }: SlideCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = useCallback((index: number) => {
    const newIndex = Math.max(0, Math.min(slides.length - 1, index));
    setCurrentIndex(newIndex);
    onSlideChange?.(newIndex);
  }, [slides.length, onSlideChange]);

  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main slide */}
      <div className="relative group">
        <div className="max-w-lg mx-auto">
          <SlideRenderer
            slide={slides[currentIndex]}
            coverImage={currentIndex === 0 ? coverImage : undefined}
            slideId={`slide-${currentIndex}`}
          />
        </div>

        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-french-blue/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 text-french-blue" />
          </button>
        )}
        {currentIndex < slides.length - 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-french-blue/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 text-french-blue" />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'rounded-full transition-all',
              i === currentIndex
                ? 'w-6 h-2 bg-french-blue'
                : 'w-2 h-2 bg-french-blue/20 hover:bg-french-blue/40'
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <p className="text-center text-sm text-deep-twilight/50">
        {currentIndex + 1} / {slides.length}
      </p>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-1">
        {slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'shrink-0 w-16 h-20 rounded-md border-2 overflow-hidden transition-all',
              i === currentIndex
                ? 'border-french-blue shadow-md scale-105'
                : 'border-transparent opacity-60 hover:opacity-100'
            )}
          >
            <div className="w-full h-full bg-white flex items-center justify-center">
              <span className="text-[8px] text-deep-twilight/60 font-medium text-center px-1 leading-tight">
                {slide.title || slide.type}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
