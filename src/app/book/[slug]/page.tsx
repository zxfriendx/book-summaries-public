import { Suspense } from 'react';
import { getAllBooks, getBookBySlug } from '@/lib/content';
import { BookDetail } from '@/components/books/book-detail';
import Link from 'next/link';

export const dynamicParams = false;

export function generateStaticParams() {
  const books = getAllBooks();
  if (books.length === 0) return [{ slug: '_placeholder' }];
  return books.map((book) => ({ slug: book.slug }));
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = getBookBySlug(slug);

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Book not found</h1>
        <Link href="/" className="text-french-blue hover:underline">
          Back to all books
        </Link>
      </div>
    );
  }

  return (
    <Suspense>
      <BookDetail book={book} />
    </Suspense>
  );
}
