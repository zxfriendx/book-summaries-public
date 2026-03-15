'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AmazonButton } from '@/components/books/amazon-button';

interface Chapter {
  number: number;
  title: string;
  keyIdeas: string[];
  memorableInsight?: string;
}

interface ChapterSummaryProps {
  chapters: Chapter[];
  bookSlug: string;
  bookTitle: string;
  bookAuthor: string;
}

function ChapterAccordion({
  chapter,
  isOpen,
  onToggle,
}: {
  chapter: Chapter;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-french-blue/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-french-blue">
              {chapter.number}
            </span>
          </span>
          <h4 className="font-medium text-foreground">{chapter.title}</h4>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 space-y-4">
            {/* Key Ideas */}
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">
                Key Ideas
              </h5>
              <ul className="space-y-2">
                {chapter.keyIdeas.map((idea, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-french-blue/60 mt-2 shrink-0" />
                    {idea}
                  </li>
                ))}
              </ul>
            </div>

            {/* Memorable Insight */}
            {chapter.memorableInsight && (
              <div className="flex items-start gap-3 bg-french-blue/5 rounded-lg p-4">
                <Sparkles className="w-4 h-4 text-french-blue mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {chapter.memorableInsight}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChapterSummary({ chapters, bookSlug, bookTitle, bookAuthor }: ChapterSummaryProps) {
  const [openChapters, setOpenChapters] = useState<Set<number>>(new Set());
  const allOpen = openChapters.size === chapters.length;

  const toggleChapter = (num: number) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allOpen) {
      setOpenChapters(new Set());
    } else {
      setOpenChapters(new Set(chapters.map((c) => c.number)));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Chapter Summaries
        </h3>
        <button
          onClick={toggleAll}
          className="text-sm text-french-blue hover:text-french-blue/80 transition-colors"
        >
          {allOpen ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="space-y-2">
        {chapters.map((chapter) => (
          <ChapterAccordion
            key={chapter.number}
            chapter={chapter}
            isOpen={openChapters.has(chapter.number)}
            onToggle={() => toggleChapter(chapter.number)}
          />
        ))}
      </div>

      {/* Amazon CTA */}
      <div className="mt-6 p-5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-french-blue shrink-0" />
          <p className="text-sm text-foreground/80">
            Want the full details? Read the complete book.
          </p>
        </div>
        <AmazonButton title={bookTitle} author={bookAuthor} variant="compact" />
      </div>
    </div>
  );
}
