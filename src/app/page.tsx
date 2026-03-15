'use client';

import { useState, useMemo } from 'react';
import { getAllBooks, getCategories } from '@/lib/content';
import { BookGrid } from '@/components/books/book-grid';
import { CategoryFilter } from '@/components/books/category-filter';
import { SearchBar } from '@/components/books/search-bar';
import { BookOpen, Library, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortOption = 'title' | 'author' | 'rating';
type Section = 'nonfiction' | 'fiction';

const FICTION_CATEGORY = 'Fiction';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('title');
  const [section, setSection] = useState<Section>('nonfiction');

  const allBooks = getAllBooks();

  const sectionBooks = useMemo(
    () =>
      section === 'fiction'
        ? allBooks.filter((b) => b.category === FICTION_CATEGORY)
        : allBooks.filter((b) => b.category !== FICTION_CATEGORY),
    [allBooks, section]
  );

  const categories = useMemo(() => {
    const cats = new Set(sectionBooks.map((b) => b.category));
    return Array.from(cats).sort();
  }, [sectionBooks]);

  // Reset category filter when switching sections
  const handleSectionChange = (s: Section) => {
    setSection(s);
    setCategory(null);
  };

  const filteredBooks = useMemo(() => {
    let books = sectionBooks;

    if (search) {
      const lower = search.toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(lower) ||
          b.author.toLowerCase().includes(lower) ||
          b.category.toLowerCase().includes(lower) ||
          b.oneLiner.toLowerCase().includes(lower)
      );
    }

    if (category) {
      books = books.filter((b) => b.category === category);
    }

    books = [...books].sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'rating':
          return (b.rating ?? 0) - (a.rating ?? 0);
        default:
          return 0;
      }
    });

    return books;
  }, [sectionBooks, search, category, sort]);

  const nonfictionCount = allBooks.filter((b) => b.category !== FICTION_CATEGORY).length;
  const fictionCount = allBooks.filter((b) => b.category === FICTION_CATEGORY).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-accent" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
          Book Summaries
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Visual infographic summaries of {allBooks.length} books. Browse, learn, and export slides for social media.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit mx-auto mb-8">
        <button
          onClick={() => handleSectionChange('nonfiction')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            section === 'nonfiction'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Library className="w-4 h-4" />
          Non-Fiction
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            section === 'nonfiction' ? 'bg-accent/10 text-accent' : 'bg-muted-foreground/10 text-muted-foreground'
          )}>
            {nonfictionCount}
          </span>
        </button>
        <button
          onClick={() => handleSectionChange('fiction')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            section === 'fiction'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BookText className="w-4 h-4" />
          Fiction
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            section === 'fiction' ? 'bg-accent/10 text-accent' : 'bg-muted-foreground/10 text-muted-foreground'
          )}>
            {fictionCount}
          </span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/95 backdrop-blur-sm">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-sm py-1.5 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
        {search && ` matching "${search}"`}
        {category && ` in ${category}`}
      </p>

      {/* Grid */}
      <BookGrid books={filteredBooks} />
    </div>
  );
}
