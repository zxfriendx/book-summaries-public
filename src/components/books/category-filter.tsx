'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, X } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!sheetOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sheetOpen]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const handleSelect = (cat: string | null) => {
    onSelect(cat);
    setSheetOpen(false);
  };

  const pillClasses = (active: boolean) =>
    cn(
      'px-4 py-2 rounded-full text-sm font-medium transition-colors',
      active
        ? 'bg-accent text-white'
        : 'bg-accent/10 text-accent hover:bg-accent/20'
    );

  return (
    <>
      {/* Desktop: inline pills */}
      <div className="hidden md:flex flex-wrap gap-2">
        <button onClick={() => onSelect(null)} className={pillClasses(selected === null)}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat === selected ? null : cat)}
            className={pillClasses(cat === selected)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Mobile: filter button */}
      <button
        onClick={() => setSheetOpen(true)}
        className={cn(
          'md:hidden flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
          selected
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border text-foreground'
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {selected || 'All categories'}
      </button>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-200"
          >
            {/* Handle */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Filter by category</h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category list */}
            <div className="overflow-y-auto p-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleSelect(null)}
                className={pillClasses(selected === null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleSelect(cat === selected ? null : cat)}
                  className={pillClasses(cat === selected)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
