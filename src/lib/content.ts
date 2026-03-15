import booksData from '@/data/books.json';
import type { BookSummary, BooksData } from './types';

const data = booksData as BooksData;

export const getAllBooks = (): BookSummary[] => {
  return data.books;
};

export const getBookBySlug = (slug: string): BookSummary | undefined => {
  return data.books.find(b => b.slug === slug);
};

export const getCategories = (): string[] => {
  const categories = new Set(data.books.map(b => b.category));
  return Array.from(categories).sort();
};

export const getBooksByCategory = (category: string): BookSummary[] => {
  return data.books.filter(b => b.category === category);
};

export const getChapter = (slug: string, chapterNumber: number) => {
  const book = getBookBySlug(slug);
  if (!book?.chapters) return undefined;
  return book.chapters.find(c => c.number === chapterNumber);
};

export const searchBooks = (query: string): BookSummary[] => {
  const lower = query.toLowerCase();
  return data.books.filter(b =>
    b.title.toLowerCase().includes(lower) ||
    b.author.toLowerCase().includes(lower) ||
    b.category.toLowerCase().includes(lower) ||
    b.oneLiner.toLowerCase().includes(lower)
  );
};
