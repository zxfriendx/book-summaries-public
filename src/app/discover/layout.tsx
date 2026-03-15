import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="fixed inset-0 z-50 w-full h-dvh overflow-hidden bg-background">
        <Link
          href="/"
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          aria-label="Close discover feed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Link>
        {children}
      </div>
    </ThemeProvider>
  );
}
