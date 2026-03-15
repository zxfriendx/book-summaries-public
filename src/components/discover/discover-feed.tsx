'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { BookSummary } from '@/lib/types';
import { DiscoverCard } from './discover-card';
import { Search, X } from 'lucide-react';

// Disable scroll restoration immediately at module level — before any render
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

interface DiscoverFeedProps {
  books: BookSummary[];
}

function shuffleArray<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  // Fisher-Yates with simple seeded PRNG
  let s = seed;
  const random = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function DiscoverFeed({ books }: DiscoverFeedProps) {
  const searchParams = useSearchParams();
  const targetSlug = searchParams.get('book');
  const [shuffledBooks, setShuffledBooks] = useState<BookSummary[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activePane, setActivePane] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Stable seed within session so back-navigation preserves order
    let seed: number;
    const stored = sessionStorage.getItem('discover-seed');
    if (stored) {
      seed = parseInt(stored, 10);
    } else {
      seed = Date.now();
      sessionStorage.setItem('discover-seed', String(seed));
    }
    const shuffled = shuffleArray(books, seed);
    // If a target book is specified, move it to the front
    if (targetSlug) {
      const targetIndex = shuffled.findIndex((b) => b.slug === targetSlug);
      if (targetIndex > 0) {
        const [target] = shuffled.splice(targetIndex, 1);
        shuffled.unshift(target);
      }
    }
    setShuffledBooks(shuffled);
  }, [books, targetSlug]);

  // Ensure scrollTop=0 synchronously before paint when books first render
  useLayoutEffect(() => {
    if (shuffledBooks.length > 0 && containerRef.current) {
      containerRef.current.scrollTop = 0;
      setReady(true);
    }
  }, [shuffledBooks]);

  const displayBooks = useMemo(() => {
    if (!searchQuery) return shuffledBooks;
    const lower = searchQuery.toLowerCase();
    return shuffledBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(lower) ||
        b.author.toLowerCase().includes(lower) ||
        b.category.toLowerCase().includes(lower)
    );
  }, [shuffledBooks, searchQuery]);

  // IntersectionObserver to track visible card
  useEffect(() => {
    if (!containerRef.current || displayBooks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) {
              setActiveIndex(idx);
              setActivePane(0);
            }
          }
        }
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      }
    );

    cardRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [displayBooks]);

  // Keyboard navigation — scroll container directly instead of scrollIntoView
  // (scrollIntoView scrolls ALL ancestors and causes unwanted side-effects)
  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        const cardHeight = containerRef.current.clientHeight;
        containerRef.current.scrollTo({ top: index * cardHeight, behavior: 'smooth' });
      }
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when search is focused
      if (searchOpen && document.activeElement === searchInputRef.current) return;

      if (e.key === '/' && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
        return;
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, displayBooks.length - 1);
        scrollToIndex(next);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        scrollToIndex(prev);
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        setActivePane((p) => Math.min(p + 1, 5));
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault();
        setActivePane((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, displayBooks.length, scrollToIndex, searchOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const setCardRef = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      if (el) {
        cardRefs.current.set(index, el);
      } else {
        cardRefs.current.delete(index);
      }
    },
    []
  );

  if (shuffledBooks.length === 0) {
    return <div className="h-dvh bg-background" />;
  }

  return (
    <div
      ref={containerRef}
      className="h-dvh overflow-y-scroll discover-scroll-snap"
      style={{
        scrollSnapType: 'y mandatory',
        opacity: ready ? 1 : 0,
      }}
    >
      {/* Floating search — positioned over the feed */}
      <div className="fixed top-3 right-16 z-30 w-[min(60vw,300px)]">
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-background/95 backdrop-blur-sm text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-lg"
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            {searchQuery && (
              <div className="absolute top-full mt-1 left-0 right-0 text-center">
                <span className="text-xs text-white/70 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {displayBooks.length} {displayBooks.length === 1 ? 'book' : 'books'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border text-muted-foreground text-sm shadow-md hover:bg-background/95 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <kbd className="hidden sm:inline text-xs bg-muted px-1.5 py-0.5 rounded ml-auto">/</kbd>
          </button>
        )}
      </div>

      {displayBooks.map((book, i) => (
        <DiscoverCard
          key={book.slug}
          book={book}
          index={i}
          isActive={i === activeIndex}
          onRef={(el) => setCardRef(i, el)}
          requestedPane={i === activeIndex ? activePane : undefined}
          onPaneChange={i === activeIndex ? setActivePane : undefined}
        />
      ))}

      {displayBooks.length === 0 && searchQuery && (
        <div className="h-dvh flex items-center justify-center" style={{ scrollSnapAlign: 'start' }}>
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">No books found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
}
