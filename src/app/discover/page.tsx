import { Suspense } from 'react';
import { getAllBooks } from '@/lib/content';
import { DiscoverFeed } from '@/components/discover/discover-feed';

export const metadata = {
  title: 'Discover Books',
  description: 'Swipe through book summaries in a discovery feed.',
};

export default function DiscoverPage() {
  const books = getAllBooks();

  return (
    <Suspense>
      <DiscoverFeed books={books} />
    </Suspense>
  );
}
