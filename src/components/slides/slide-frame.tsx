'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import type { SlideTheme } from '@/lib/types';

interface SlideFrameProps {
  children: ReactNode;
  className?: string;
  exportMode?: boolean;
  id?: string;
  theme?: SlideTheme;
  bottomStatement?: string;
  illustration?: string;
}

export function SlideFrame({ children, className, exportMode, id, theme = 'light', bottomStatement, illustration }: SlideFrameProps) {
  const isDark = theme === 'dark';

  return (
    <div
      id={id}
      className={cn(
        'relative overflow-hidden',
        isDark ? 'bg-[#1A1A1A]' : 'bg-white',
        exportMode
          ? 'w-[1080px] h-[1350px]'
          : 'w-full aspect-[4/5]',
        className
      )}
      style={{
        border: isDark ? '3px solid #2A2A2A' : '3px solid rgb(38, 64, 139)',
        borderRadius: exportMode ? '0' : '12px',
      }}
    >
      {/* Top decorative line */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1.5',
        isDark ? 'bg-[#3B82F6]' : 'bg-french-blue'
      )} />

      {/* Content */}
      <div className="relative h-full flex flex-col p-6 sm:p-8">
        {illustration ? (
          /* ─── Layout WITH illustration: vertical stack ─── */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Text content: top ~60% */}
            <div className="flex-[3] flex flex-col min-h-0 overflow-hidden">
              {children}
            </div>

            {/* Illustration: bottom ~40% */}
            <div className="flex-[2] flex items-center justify-center p-2 min-h-0">
              <img
                src={illustration}
                alt=""
                className={cn(
                  'max-w-full max-h-full object-contain rounded-xl',
                  isDark ? 'opacity-90' : 'opacity-95'
                )}
              />
            </div>
          </div>
        ) : (
          /* ─── Layout WITHOUT illustration: full height ─── */
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        )}

        {/* Bottom statement */}
        {bottomStatement && (
          <div className={cn(
            'pt-3 border-t flex-shrink-0',
            isDark ? 'border-white/10' : 'border-french-blue/10'
          )}>
            <p className={cn(
              'text-xs sm:text-sm font-semibold leading-snug',
              isDark ? 'text-white/60' : 'text-midnight-violet/60'
            )}>
              {bottomStatement}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
