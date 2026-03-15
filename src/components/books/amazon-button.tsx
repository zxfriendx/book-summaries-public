import { ShoppingCart } from 'lucide-react';
import { getAmazonSearchUrl } from '@/lib/amazon';

interface AmazonButtonProps {
  title: string;
  author: string;
  variant?: 'default' | 'compact';
}

export function AmazonButton({ title, author, variant = 'default' }: AmazonButtonProps) {
  const url = getAmazonSearchUrl(title, author);

  if (variant === 'compact') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex items-center gap-1.5 text-sm text-french-blue hover:text-french-blue/80 transition-colors"
      >
        Get on Amazon &rarr;
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-french-blue text-white text-sm font-medium hover:bg-french-blue/90 transition-colors"
    >
      <ShoppingCart className="w-4 h-4" />
      Buy on Amazon
    </a>
  );
}
