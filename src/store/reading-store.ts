'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReadingState {
  favorites: string[];
  bookmarks: string[];
  toggleFavorite: (slug: string) => void;
  toggleBookmark: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  isBookmarked: (slug: string) => boolean;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      favorites: [],
      bookmarks: [],
      toggleFavorite: (slug) =>
        set((state) => ({
          favorites: state.favorites.includes(slug)
            ? state.favorites.filter((s) => s !== slug)
            : [...state.favorites, slug],
        })),
      toggleBookmark: (slug) =>
        set((state) => ({
          bookmarks: state.bookmarks.includes(slug)
            ? state.bookmarks.filter((s) => s !== slug)
            : [...state.bookmarks, slug],
        })),
      isFavorite: (slug) => get().favorites.includes(slug),
      isBookmarked: (slug) => get().bookmarks.includes(slug),
    }),
    {
      name: 'book-summaries-reading',
    }
  )
);
