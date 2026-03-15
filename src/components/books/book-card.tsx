'use client';

import Link from 'next/link';
import { Star, BookOpen, Heart } from 'lucide-react';
import type { BookSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useReadingStore } from '@/store/reading-store';

interface BookCardProps {
  book: BookSummary;
}

export function BookCard({ book }: BookCardProps) {
  const { isFavorite, toggleFavorite } = useReadingStore();
  const fav = isFavorite(book.slug);

  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(book.slug);
        }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className={cn('w-4 h-4', fav ? 'fill-red-500 text-red-500' : 'text-deep-twilight/40')} />
      </button>

      <Link href={`/book/${book.slug}`} className="block">
        {/* Cover */}
        <div className="aspect-[3/4] bg-gradient-to-br from-french-blue/10 to-frozen-water/30 flex items-center justify-center p-6">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="max-h-full max-w-full object-contain rounded shadow-md"
              loading="lazy"
            />
          ) : (
            <PlaceholderCover title={book.title} author={book.author} />
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-2">
          {/* Category badge */}
          <span className="inline-block self-start text-xs font-medium px-2.5 py-1 rounded-full bg-french-blue/10 text-french-blue">
            {book.category}
          </span>

          {/* Title */}
          <h3 className="font-semibold text-card-foreground line-clamp-2 leading-tight group-hover:text-french-blue transition-colors">
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-sm text-muted-foreground">{book.author}</p>

          {/* Rating */}
          {book.rating && (
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'w-3.5 h-3.5',
                    s <= book.rating! ? 'text-french-blue fill-french-blue' : 'text-muted/50'
                  )}
                />
              ))}
            </div>
          )}

          {/* Slide count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <BookOpen className="w-3 h-3" />
            <span>{book.slides.length} slides</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function PlaceholderCover({ title, author }: { title: string; author: string }) {
  return (
    <div className="w-full h-full rounded-lg bg-gradient-to-br from-french-blue to-deep-twilight flex flex-col items-center justify-center text-white p-4 text-center shadow-md">
      <BookOpen className="w-8 h-8 mb-3 opacity-50" />
      <h4 className="font-bold text-sm leading-tight mb-1">{title}</h4>
      <p className="text-xs opacity-70">{author}</p>
    </div>
  );
}
