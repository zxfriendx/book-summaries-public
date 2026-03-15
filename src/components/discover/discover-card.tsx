'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lightbulb, Quote, Users, Sparkles, BookOpen, ChevronRight, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';
import type { BookSummary } from '@/lib/types';
import { useReadingStore } from '@/store/reading-store';
import { getAmazonSearchUrl } from '@/lib/amazon';

interface DiscoverCardProps {
  book: BookSummary;
  index: number;
  isActive: boolean;
  onRef: (el: HTMLDivElement | null) => void;
  onPaneChange?: (pane: number) => void;
  requestedPane?: number;
}

type Chapter = NonNullable<BookSummary['chapters']>[number];

const PANE_COUNT = 5;
const CHAPTER_LIST_PANE = 3;
const CHAPTER_DETAIL_PANE = 4;
const PANE_LABELS = ['Cover', 'Takeaways', 'Quotes', 'Chapters', 'Key Ideas'];
const SWIPE_THRESHOLD = 50;

function getCategoryGradient(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('self-help') || cat.includes('psychology')) {
    return 'linear-gradient(160deg, rgba(79,70,229,0.08) 0%, rgba(15,23,42,0.12) 100%)';
  }
  if (cat.includes('business') || cat.includes('leadership') || cat.includes('entrepreneurship')) {
    return 'linear-gradient(160deg, rgba(79,70,229,0.08) 0%, rgba(99,102,241,0.06) 100%)';
  }
  if (cat.includes('fiction')) {
    return 'linear-gradient(160deg, rgba(180,120,60,0.1) 0%, rgba(200,160,80,0.06) 100%)';
  }
  if (cat.includes('science') || cat.includes('technology') || cat.includes('tech')) {
    return 'linear-gradient(160deg, rgba(16,185,129,0.08) 0%, rgba(79,70,229,0.06) 100%)';
  }
  if (cat.includes('history') || cat.includes('biography')) {
    return 'linear-gradient(160deg, rgba(160,120,80,0.1) 0%, rgba(120,80,50,0.06) 100%)';
  }
  return 'linear-gradient(160deg, rgba(15,23,42,0.08) 0%, rgba(51,65,85,0.06) 100%)';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? 'text-accent fill-accent' : 'text-foreground/20'
          }`}
          fill={s <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Pane 0: Cover ─── */
function CoverPane({ book }: { book: BookSummary }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6 pb-20 pt-16 sm:px-12 md:px-20 max-w-2xl mx-auto gap-3">
      <div className="relative w-28 h-40 sm:w-32 sm:h-44 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={`${book.title} cover`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 112px, 128px"
          />
        ) : (
          <div className="w-full h-full bg-accent/20 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-accent/40" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
          {book.category}
        </span>
        {book.rating && <StarRating rating={book.rating} />}
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center leading-tight">
        {book.title}
      </h2>

      <p className="text-sm text-muted-foreground text-center -mt-1">
        {book.author}
      </p>

      <p className="text-sm text-foreground/80 text-center leading-relaxed max-w-md line-clamp-3">
        {book.oneLiner}
      </p>

      {book.verdict && (
        <p className="text-xs text-foreground/60 text-center leading-relaxed max-w-xs line-clamp-2">
          {book.verdict}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Link
          href={`/book/${book.slug}?from=discover`}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          Full Summary &rarr;
        </Link>
        <a
          href={getAmazonSearchUrl(book.title, book.author)}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Get on Amazon &rarr;
        </a>
      </div>
    </div>
  );
}

/* ─── Pane 1: Key Takeaways ─── */
function TakeawaysPane({ book }: { book: BookSummary }) {
  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-20 pt-16 sm:px-8 md:px-12 max-w-2xl mx-auto">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          Key Takeaways
        </h3>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {book.keyTakeaways.map((t, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border px-4 py-3"
            >
              <h4 className="text-sm font-medium text-card-foreground mb-0.5">
                {t.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Pane 2: Notable Quotes + Who Should Read ─── */
function QuotesPane({ book }: { book: BookSummary }) {
  return (
    <div className="h-full w-full overflow-y-auto px-6 pb-20 pt-16 sm:px-12 md:px-20 max-w-2xl mx-auto">
      <div className="space-y-8">
        {book.notableQuotes.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Quote className="w-5 h-5 text-accent" />
              Notable Quotes
            </h3>
            <div className="space-y-4">
              {book.notableQuotes.map((q, i) => (
                <div key={i} className="border-l-2 border-accent/30 pl-4 py-1">
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
        )}

        {book.whoShouldRead.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Who Should Read This
            </h3>
            <ul className="space-y-2.5">
              {book.whoShouldRead.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ─── Pane 3: Chapter List (all chapters, scrollable) ─── */
function ChapterListPane({
  book,
  chapterIndex,
  onSelectChapter,
}: {
  book: BookSummary;
  chapterIndex: number;
  onSelectChapter: (ch: Chapter, idx: number) => void;
}) {
  const chapters = book.chapters || [];

  if (chapters.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center px-6">
        <div className="text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Chapter details coming soon</p>
          <Link
            href={`/book/${book.slug}?from=discover`}
            className="inline-flex items-center gap-1 text-sm text-accent mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            View Full Summary &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto px-6 pb-20 pt-16 sm:px-12 md:px-20 max-w-2xl mx-auto">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Chapters <span className="text-sm font-normal text-muted-foreground ml-1">{chapters.length}</span>
        </h3>

        <div className="space-y-2">
          {chapters.map((ch, i) => (
            <button
              key={ch.number}
              onClick={(e) => {
                e.stopPropagation();
                onSelectChapter(ch, i);
              }}
              className={`w-full border rounded-lg flex items-center justify-between px-5 py-4 text-left transition-colors ${
                i === chapterIndex
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  i === chapterIndex ? 'bg-accent text-white' : 'bg-accent/10 text-accent'
                }`}>
                  <span className="text-sm font-bold">{ch.number}</span>
                </span>
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground truncate">{ch.title}</h4>
                  {ch.keyIdeas.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {ch.keyIdeas[0]}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Pane 4: Chapter Key Ideas + Get the Book CTA ─── */
function ChapterDetailPane({
  book,
  chapter,
  chapterIndex,
  totalChapters,
}: {
  book: BookSummary;
  chapter: Chapter | null;
  chapterIndex: number;
  totalChapters: number;
}) {
  if (!chapter) {
    return (
      <div className="h-full w-full flex items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Select a chapter to see details</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto px-6 pb-20 pt-14 sm:px-12 md:px-20 max-w-2xl mx-auto">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-accent">{chapter.number}</span>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-foreground leading-tight">{chapter.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chapter {chapterIndex + 1} of {totalChapters}
            </p>
          </div>
        </div>

        {/* Key Ideas */}
        <div>
          <h5 className="text-sm font-medium text-muted-foreground mb-2">Key Ideas</h5>
          <ul className="space-y-2">
            {chapter.keyIdeas.map((idea, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-2 shrink-0" />
                {idea}
              </li>
            ))}
          </ul>
        </div>

        {/* Memorable Insight */}
        {chapter.memorableInsight && (
          <div className="flex items-start gap-3 bg-accent/5 rounded-lg p-4">
            <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              {chapter.memorableInsight}
            </p>
          </div>
        )}

        {/* Get the Book CTA */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-5 text-center space-y-3">
          <ShoppingCart className="w-6 h-6 text-accent mx-auto" />
          <p className="text-sm text-foreground/80">
            Enjoying the summary? Get the full book for the complete experience.
          </p>
          <a
            href={getAmazonSearchUrl(book.title, book.author)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Get on Amazon
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Card ─── */
export function DiscoverCard({ book, index, isActive, onRef, onPaneChange, requestedPane }: DiscoverCardProps) {
  const lastTapRef = useRef(0);
  const [showHeart, setShowHeart] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentPane, setCurrentPane] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const toggleFavorite = useReadingStore((s) => s.toggleFavorite);
  const favorites = useReadingStore((s) => s.favorites);
  const isFav = favorites.includes(book.slug);
  const chapters = book.chapters || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset when card becomes inactive
  useEffect(() => {
    if (!isActive) {
      setCurrentPane(0);
      setChapterIndex(0);
      setSelectedChapter(null);
    }
  }, [isActive]);

  // Reset chapter selection when leaving chapter panes
  useEffect(() => {
    if (currentPane < CHAPTER_LIST_PANE) {
      setChapterIndex(0);
      setSelectedChapter(null);
    }
  }, [currentPane]);

  // Sync with parent's requested pane (keyboard nav)
  useEffect(() => {
    if (requestedPane !== undefined && requestedPane !== currentPane) {
      if (
        requestedPane === CHAPTER_DETAIL_PANE &&
        !selectedChapter &&
        chapters.length > 0
      ) {
        setSelectedChapter(chapters[0]);
        setChapterIndex(0);
      }
      setCurrentPane(requestedPane);
    }
  }, [requestedPane]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of pane changes
  useEffect(() => {
    onPaneChange?.(currentPane);
  }, [currentPane, onPaneChange]);

  const goToPane = useCallback((pane: number) => {
    const clamped = Math.max(0, Math.min(PANE_COUNT - 1, pane));
    setCurrentPane(clamped);
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleFavorite(book.slug);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [book.slug, toggleFavorite]);

  // Chapter selection (from list tap or swipe forward)
  const handleSelectChapter = useCallback((ch: Chapter, idx: number) => {
    setSelectedChapter(ch);
    setChapterIndex(idx);
    setCurrentPane(CHAPTER_DETAIL_PANE);
  }, []);

  // Navigate to next/prev chapter (vertical swipe on pane 4)
  const navigateChapter = useCallback((direction: 1 | -1) => {
    const maxIdx = chapters.length - 1;
    const newIdx = Math.max(0, Math.min(maxIdx, chapterIndex + direction));
    if (newIdx !== chapterIndex) {
      setChapterIndex(newIdx);
      setSelectedChapter(chapters[newIdx]);
    }
  }, [chapterIndex, chapters]);

  const isChapterPane = currentPane === CHAPTER_DETAIL_PANE;

  // Unified drag start
  const handleDragStart = useCallback((x: number, y: number) => {
    dragStartRef.current = { x, y, time: Date.now() };
    isDraggingRef.current = false;
  }, []);

  // Unified drag end — horizontal + vertical swipes
  const handleDragEnd = useCallback((x: number, y: number) => {
    if (!dragStartRef.current) return;
    const dx = x - dragStartRef.current.x;
    const dy = y - dragStartRef.current.y;
    const dt = Date.now() - dragStartRef.current.time;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (dt > 500) {
      dragStartRef.current = null;
      return;
    }

    // Vertical swipe — navigate chapters on detail pane
    if (absDy > SWIPE_THRESHOLD && absDy > absDx * 1.5 && isChapterPane && selectedChapter) {
      isDraggingRef.current = true;
      navigateChapter(dy < 0 ? 1 : -1);
      dragStartRef.current = null;
      return;
    }

    // Horizontal swipe
    if (absDx > SWIPE_THRESHOLD && absDx > absDy * 1.5) {
      isDraggingRef.current = true;
      if (dx < 0) {
        // Swipe forward
        if (currentPane === CHAPTER_LIST_PANE && chapters.length > 0) {
          if (!selectedChapter) {
            setSelectedChapter(chapters[0]);
            setChapterIndex(0);
          }
          setCurrentPane(CHAPTER_DETAIL_PANE);
        } else if (currentPane < PANE_COUNT - 1) {
          setCurrentPane((p) => p + 1);
        }
      } else if (dx > 0) {
        // Swipe back
        if (currentPane > 0) {
          setCurrentPane((p) => p - 1);
        }
      }
    }
    dragStartRef.current = null;
  }, [currentPane, isChapterPane, selectedChapter, navigateChapter, chapters]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, [handleDragEnd]);

  // Mouse handlers (desktop drag)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    handleDragEnd(e.clientX, e.clientY);
  }, [handleDragEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (currentPane === 0) {
      handleTap();
    }
  }, [currentPane, handleTap]);

  const gradient = getCategoryGradient(book.category);

  const getLabel = () => {
    if (isChapterPane && selectedChapter) {
      const chTitle = selectedChapter.title;
      const short = chTitle.length > 18 ? chTitle.slice(0, 18) + '\u2026' : chTitle;
      return `Ch ${chapterIndex + 1} \u203A ${short}`;
    }
    return PANE_LABELS[currentPane];
  };

  return (
    <div
      ref={onRef}
      data-index={index}
      className="h-dvh w-full flex-shrink-0 relative overflow-clip select-none"
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        touchAction: isChapterPane && selectedChapter ? 'none' : 'pan-y',
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Background base */}
      <div className="absolute inset-0 bg-background" style={{ zIndex: -1 }} />

      {/* Horizontal pane slider */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{
          width: `${PANE_COUNT * 100}%`,
          transform: `translateX(-${(currentPane * 100) / PANE_COUNT}%)`,
        }}
      >
        <div className="h-full relative" style={{ width: `${100 / PANE_COUNT}%`, background: gradient }}>
          <CoverPane book={book} />
        </div>

        <div className="h-full relative" style={{ width: `${100 / PANE_COUNT}%`, background: gradient }}>
          <TakeawaysPane book={book} />
        </div>

        <div className="h-full relative" style={{ width: `${100 / PANE_COUNT}%`, background: gradient }}>
          <QuotesPane book={book} />
        </div>

        <div className="h-full relative" style={{ width: `${100 / PANE_COUNT}%`, background: gradient }}>
          <ChapterListPane book={book} chapterIndex={chapterIndex} onSelectChapter={handleSelectChapter} />
        </div>

        <div className="h-full relative" style={{ width: `${100 / PANE_COUNT}%`, background: gradient }}>
          <ChapterDetailPane book={book} chapter={selectedChapter} chapterIndex={chapterIndex} totalChapters={chapters.length} />
        </div>
      </div>

      {/* Full-height tap zones with centered arrow (Apple-style) */}
      {currentPane > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPane(currentPane - 1); }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute left-0 top-0 bottom-20 w-14 sm:w-20 z-20 group cursor-pointer flex items-center justify-start pl-2 sm:pl-3"
          aria-label="Previous"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/10 group-active:bg-foreground/15 transition-all duration-200">
            <svg className="w-5 h-5 text-foreground/0 group-hover:text-foreground/60 group-active:text-foreground/80 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </button>
      )}
      {currentPane < PANE_COUNT - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPane(currentPane + 1); }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-20 w-14 sm:w-20 z-20 group cursor-pointer flex items-center justify-end pr-2 sm:pr-3"
          aria-label="Next"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/10 group-active:bg-foreground/15 transition-all duration-200">
            <svg className="w-5 h-5 text-foreground/0 group-hover:text-foreground/60 group-active:text-foreground/80 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* Vertical chapter nav (pane 4): full-width top/bottom tap zones */}
      {isChapterPane && selectedChapter && chapters.length > 1 && (
        <>
          {chapterIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateChapter(-1); }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="absolute top-0 left-14 right-14 sm:left-20 sm:right-20 h-16 z-20 group cursor-pointer flex items-end justify-center pb-1"
              aria-label="Previous chapter"
            >
              <div className="flex flex-col items-center gap-0.5 opacity-40 group-hover:opacity-80 group-active:opacity-100 transition-opacity">
                <ChevronUp className="w-5 h-5 text-accent" />
                <span className="text-[10px] text-accent font-medium">Ch {chapterIndex}</span>
              </div>
            </button>
          )}
          {chapterIndex < chapters.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateChapter(1); }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="absolute bottom-20 left-14 right-14 sm:left-20 sm:right-20 h-16 z-20 group cursor-pointer flex items-start justify-center pt-1"
              aria-label="Next chapter"
            >
              <div className="flex flex-col items-center gap-0.5 opacity-40 group-hover:opacity-80 group-active:opacity-100 transition-opacity">
                <span className="text-[10px] text-accent font-medium">Ch {chapterIndex + 2}</span>
                <ChevronDown className="w-5 h-5 text-accent" />
              </div>
            </button>
          )}
        </>
      )}

      {/* Bottom indicator bar — prominent progress + label */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-3 pt-8 bg-gradient-to-t from-black/15 via-black/5 to-transparent pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          {/* Progress track */}
          <div className="relative flex items-center gap-0 w-[min(60vw,240px)] h-1 rounded-full bg-foreground/10 overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${((currentPane + 1) / PANE_COUNT) * 100}%` }}
            />
          </div>

          {/* Tappable dots row */}
          <div className="flex items-center gap-2">
            {Array.from({ length: PANE_COUNT }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goToPane(i); }}
                className={`rounded-full transition-all duration-300 ${
                  i === currentPane
                    ? 'w-6 h-2 bg-accent'
                    : i < currentPane
                    ? 'w-2 h-2 bg-accent/40'
                    : 'w-2 h-2 bg-foreground/15 hover:bg-foreground/30'
                }`}
                aria-label={`Go to ${PANE_LABELS[i]}`}
              />
            ))}
          </div>

          {/* Label */}
          <span className="text-[11px] font-medium text-foreground/50 tracking-wide">
            {getLabel()}
            {currentPane < PANE_COUNT - 1 && (
              <span className="text-foreground/25 ml-1.5">
                &middot; swipe for {PANE_LABELS[currentPane + 1]}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Favorite heart indicator */}
      {isMounted && (
        <button
          className="absolute top-5 left-5 z-40 p-2"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(book.slug);
          }}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg
            className={`w-6 h-6 transition-colors ${
              isFav ? 'text-red-500 fill-red-500' : 'text-foreground/30'
            }`}
            fill={isFav ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      )}

      {/* Double-tap heart animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <svg
            className="w-24 h-24 text-red-500 fill-red-500 discover-heart-pop"
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
      )}
    </div>
  );
}
