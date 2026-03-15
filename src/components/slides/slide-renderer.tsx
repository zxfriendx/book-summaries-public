'use client';

import type { Slide } from '@/lib/types';
import { SlideFrame } from './slide-frame';
import { TitleSlide } from './slide-types/title-slide';
import { OverviewSlide } from './slide-types/overview-slide';
import { TakeawaySlide } from './slide-types/takeaway-slide';
import { QuoteSlide } from './slide-types/quote-slide';
import { AudienceSlide } from './slide-types/audience-slide';
import { RatingSlide } from './slide-types/rating-slide';
import { ChapterMapSlide } from './slide-types/chapter-map-slide';
import { KeyStatSlide } from './slide-types/key-stat-slide';
import { ComparisonSlide } from './slide-types/comparison-slide';
import { FrameworkSlide } from './slide-types/framework-slide';
import { DataCascadeSlide } from './slide-types/data-cascade-slide';
import { HierarchySlide } from './slide-types/hierarchy-slide';
import { ProcessSlide } from './slide-types/process-slide';
import { ArgumentSlide } from './slide-types/argument-slide';
import { ActionSlide } from './slide-types/action-slide';

interface SlideRendererProps {
  slide: Slide;
  coverImage?: string;
  exportMode?: boolean;
  slideId?: string;
}

export function SlideRenderer({ slide, coverImage, exportMode, slideId }: SlideRendererProps) {
  const theme = slide.theme ?? 'light';
  const isDark = theme === 'dark';

  const renderSlide = () => {
    switch (slide.type) {
      case 'title':
        return <TitleSlide slide={slide} coverImage={coverImage} />;
      case 'overview':
        return <OverviewSlide slide={slide} />;
      case 'takeaway':
        return <TakeawaySlide slide={slide} />;
      case 'quote':
        return <QuoteSlide slide={slide} />;
      case 'audience':
        return <AudienceSlide slide={slide} />;
      case 'rating':
        return <RatingSlide slide={slide} />;
      case 'chapter-map':
        return <ChapterMapSlide slide={slide} />;
      case 'key-stat':
        return <KeyStatSlide slide={slide} />;
      case 'comparison':
        return <ComparisonSlide slide={slide} />;
      case 'framework':
        return <FrameworkSlide slide={slide} />;
      case 'data-cascade':
        return <DataCascadeSlide slide={slide} />;
      case 'hierarchy':
        return <HierarchySlide slide={slide} />;
      case 'process':
        return <ProcessSlide slide={slide} />;
      case 'argument':
        return <ArgumentSlide slide={slide} />;
      case 'action':
        return <ActionSlide slide={slide} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-deep-twilight/50">
            Unknown slide type
          </div>
        );
    }
  };

  return (
    <SlideFrame
      exportMode={exportMode}
      id={slideId}
      theme={theme}
      bottomStatement={slide.bottomStatement}
      illustration={slide.illustration}
    >
      {renderSlide()}
    </SlideFrame>
  );
}
