'use client';

import type { Slide } from '@/lib/types';

interface HierarchySlideProps {
  slide: Slide;
}

export function HierarchySlide({ slide }: HierarchySlideProps) {
  const isDark = slide.theme === 'dark';
  const tiers = [...(slide.tiers ?? [])].sort((a, b) => a.level - b.level);
  const totalTiers = tiers.length;

  return (
    <div className="flex-1 flex flex-col justify-center gap-4">
      {/* Headline */}
      <h2 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight text-center ${
        isDark ? 'text-white' : 'text-midnight-violet'
      }`}>
        {slide.title}
      </h2>

      {slide.subtitle && (
        <p className={`text-sm text-center ${
          isDark ? 'text-white/40' : 'text-deep-twilight/50'
        }`}>
          {slide.subtitle}
        </p>
      )}

      {/* SVG Pyramid */}
      <div className="flex-1 flex items-center justify-center px-4">
        <svg viewBox="0 0 400 300" className="w-full max-w-md h-auto">
          {tiers.map((tier, i) => {
            const tierHeight = 260 / totalTiers;
            const y = 20 + i * tierHeight;
            // Pyramid widens from top to bottom
            const topWidth = 60 + (i / totalTiers) * 300;
            const bottomWidth = 60 + ((i + 1) / totalTiers) * 300;
            const topX = (400 - topWidth) / 2;
            const bottomX = (400 - bottomWidth) / 2;

            const fillOpacity = isDark
              ? 1 - (i * 0.15)
              : 0.8 - (i * 0.15);
            const fill = isDark ? '#3B82F6' : '#26408B';

            return (
              <g key={i}>
                <path
                  d={`M ${topX} ${y} L ${topX + topWidth} ${y} L ${bottomX + bottomWidth} ${y + tierHeight - 2} L ${bottomX} ${y + tierHeight - 2} Z`}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  stroke={isDark ? '#2A2A2A' : '#fff'}
                  strokeWidth="2"
                />
                <text
                  x="200"
                  y={y + tierHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[11px] font-bold fill-white"
                >
                  <tspan className="font-black uppercase">{tier.label}</tspan>
                </text>
                <text
                  x="200"
                  y={y + tierHeight / 2 + 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[8px] fill-white/60"
                >
                  {tier.description.length > 50 ? tier.description.slice(0, 50) + '...' : tier.description}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
