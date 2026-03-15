'use client';

import type { Slide } from '@/lib/types';
import * as LucideIcons from 'lucide-react';
import { Lightbulb } from 'lucide-react';

interface TakeawaySlideProps {
  slide: Slide;
}

function getIcon(iconName?: string) {
  if (!iconName) return Lightbulb;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return Icon || Lightbulb;
}

export function TakeawaySlide({ slide }: TakeawaySlideProps) {
  const isDark = slide.theme === 'dark';
  const Icon = getIcon(slide.icon);

  return (
    <div className="flex-1 flex flex-col justify-center gap-5">
      {/* Number badge */}
      {slide.number && (
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDark ? 'bg-[#3B82F6]' : 'bg-french-blue'
          }`}>
            <span className="text-xl font-black text-white">{slide.number}</span>
          </div>
          <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-french-blue/15'}`} />
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        isDark ? 'bg-[#3B82F6]/20' : 'bg-frozen-water/50'
      }`}>
        <Icon className={`w-6 h-6 ${isDark ? 'text-[#3B82F6]' : 'text-french-blue'}`} />
      </div>

      {/* Title — bold assertion */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {/* Content */}
      <p className={`text-base leading-relaxed ${
        isDark ? 'text-white/70' : 'text-deep-twilight/80'
      }`}>
        {slide.content}
      </p>

      {/* Supporting quote */}
      {slide.quote && (
        <div className={`pl-4 border-l-2 ${
          isDark ? 'border-[#3B82F6]/30' : 'border-french-blue/20'
        }`}>
          <p className={`text-sm italic leading-relaxed ${
            isDark ? 'text-white/40' : 'text-deep-twilight/50'
          }`}>
            &ldquo;{slide.quote}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
