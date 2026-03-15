'use client';

import { useState, useRef, useCallback } from 'react';
import { SlideCarousel } from '@/components/slides/slide-carousel';
import { SlideRenderer } from '@/components/slides/slide-renderer';
import { ExportPanel } from '@/components/export/export-panel';
import { ChapterSummary } from '@/components/books/chapter-summary';
import { exportSlideAsPng, exportAllSlidesAsZip } from '@/components/export/export-engine';
import type { ExportFormat, BookSummary } from '@/lib/types';
import { EXPORT_FORMATS } from '@/lib/types';
import {
  ArrowLeft,
  Star,
  BookOpen,
  Quote,
  Users,
  Lightbulb,
  Heart,
  Bookmark,
  Presentation,
} from 'lucide-react';
import { AmazonButton } from '@/components/books/amazon-button';
import { cn } from '@/lib/utils';
import { useReadingStore } from '@/store/reading-store';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'learn' | 'share';

interface BookDetailProps {
  book: BookSummary;
}

export function BookDetail({ book }: BookDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDiscover = searchParams.get('from') === 'discover';
  const [activeTab, setActiveTab] = useState<Tab>('learn');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite, isBookmarked, toggleBookmark } = useReadingStore();

  const handleExportSingle = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      try {
        const dims = EXPORT_FORMATS[format];
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.width = `${dims.width}px`;
        container.style.height = `${dims.height}px`;
        document.body.appendChild(container);

        const { createRoot } = await import('react-dom/client');
        const root = createRoot(container);

        await new Promise<void>((resolve) => {
          root.render(
            <SlideRenderer
              slide={book.slides[currentSlide]}
              coverImage={currentSlide === 0 ? book.coverImage : undefined}
              exportMode
              slideId="export-slide"
            />
          );
          setTimeout(resolve, 1500);
        });

        const slideEl = container.querySelector('#export-slide') as HTMLElement;
        if (slideEl) {
          await exportSlideAsPng(slideEl, book.title, currentSlide, format);
        }

        root.unmount();
        document.body.removeChild(container);
      } finally {
        setIsExporting(false);
      }
    },
    [book, currentSlide]
  );

  const handleExportAll = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      try {
        const dims = EXPORT_FORMATS[format];
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        const elements: HTMLElement[] = [];
        const { createRoot } = await import('react-dom/client');

        for (let i = 0; i < book.slides.length; i++) {
          const slideContainer = document.createElement('div');
          slideContainer.style.width = `${dims.width}px`;
          slideContainer.style.height = `${dims.height}px`;
          container.appendChild(slideContainer);

          const root = createRoot(slideContainer);
          await new Promise<void>((resolve) => {
            root.render(
              <SlideRenderer
                slide={book.slides[i]}
                coverImage={i === 0 ? book.coverImage : undefined}
                exportMode
                slideId={`export-slide-${i}`}
              />
            );
            setTimeout(resolve, 1500);
          });

          const el = slideContainer.querySelector(`#export-slide-${i}`) as HTMLElement;
          if (el) elements.push(el);
        }

        await exportAllSlidesAsZip(elements, book.title, format);

        document.body.removeChild(container);
      } finally {
        setIsExporting(false);
      }
    },
    [book]
  );

  const fav = isFavorite(book.slug);
  const marked = isBookmarked(book.slug);

  const hasSlides = book.slides.length > 0;
  const hasChapters = book.chapters && book.chapters.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back nav */}
      {fromDiscover ? (
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </button>
      ) : (
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Books
        </Link>
      )}

      {/* Book header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-french-blue/10 text-french-blue">
              {book.category}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {book.contentQuality} summary
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
            {book.title}
          </h1>
          <p className="text-lg text-muted-foreground">{book.author}</p>
          {book.rating && (
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'w-4 h-4',
                    s <= book.rating! ? 'text-french-blue fill-french-blue' : 'text-muted/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/discover?book=${book.slug}`}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium flex items-center gap-2 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Presentation className="w-4 h-4" />
            Discover
          </Link>
          <button
            onClick={() => toggleFavorite(book.slug)}
            className={cn(
              'px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors',
              fav
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Heart className={cn('w-4 h-4', fav && 'fill-current')} />
            {fav ? 'Favorited' : 'Favorite'}
          </button>
          <button
            onClick={() => toggleBookmark(book.slug)}
            className={cn(
              'px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors',
              marked
                ? 'border-french-blue bg-french-blue/10 text-french-blue'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Bookmark className={cn('w-4 h-4', marked && 'fill-current')} />
            {marked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <AmazonButton title={book.title} author={book.author} />
        </div>
      </div>

      {/* One-liner */}
      <p className="text-xl text-foreground/80 leading-relaxed mb-8 max-w-3xl">
        {book.oneLiner}
      </p>

      {/* Tab bar */}
      <div className="border-b border-border mb-8">
        <nav className="flex gap-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('learn')}
            className={cn(
              'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'learn'
                ? 'border-french-blue text-french-blue'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <BookOpen className="w-4 h-4" />
            Learn
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={cn(
              'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'share'
                ? 'border-french-blue text-french-blue'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Presentation className="w-4 h-4" />
            Share
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'learn' && (
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Key Takeaways */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-french-blue" />
              Key Takeaways
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {book.keyTakeaways.map((t, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border p-5 flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-french-blue/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-french-blue">{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground mb-1">
                      {t.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Chapter Summaries */}
          <section>
            {hasChapters ? (
              <ChapterSummary chapters={book.chapters!} bookSlug={book.slug} bookTitle={book.title} bookAuthor={book.author} />
            ) : (
              <div className="text-center py-8 border border-dashed border-border rounded-xl">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chapter summaries coming soon
                </p>
              </div>
            )}
          </section>

          {/* Notable Quotes */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Quote className="w-5 h-5 text-french-blue" />
              Notable Quotes
            </h3>
            <div className="space-y-4">
              {book.notableQuotes.map((q, i) => (
                <div
                  key={i}
                  className="border-l-2 border-french-blue/30 pl-4 py-1"
                >
                  <p className="text-sm italic text-foreground/80 leading-relaxed">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  {q.context && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {q.context}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Who Should Read */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-french-blue" />
              Who Should Read This
            </h3>
            <ul className="space-y-2.5">
              {book.whoShouldRead.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-french-blue/60 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeTab === 'share' && (
        <div>
          {hasSlides ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Slide carousel */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Presentation className="w-5 h-5 text-french-blue" />
                  Visual Summary ({book.slides.length} slides)
                </h2>
                <SlideCarousel
                  slides={book.slides}
                  coverImage={book.coverImage}
                  onSlideChange={setCurrentSlide}
                />
              </div>

              {/* Export panel */}
              <div>
                <ExportPanel
                  onExportSingle={handleExportSingle}
                  onExportAll={handleExportAll}
                  slideCount={book.slides.length}
                  currentSlide={currentSlide}
                  isExporting={isExporting}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <Presentation className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Visual summary not yet generated
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden export container */}
      <div ref={exportContainerRef} className="fixed left-[-9999px] top-0" aria-hidden="true" />
    </div>
  );
}
