'use client';

import type { BookSummary } from '@/lib/types';
import { BookCard } from './book-card';

interface BookGridProps {
  books: BookSummary[];
}

export function BookGrid({ books }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No books found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
