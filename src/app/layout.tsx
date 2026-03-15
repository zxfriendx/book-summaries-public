import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Book Summaries",
  description: "Visual infographic summaries of 100+ books — browse, learn, and export slides for social media.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${inter.variable} ${geistMono.variable} font-sans antialiased`}
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="border-b border-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-french-blue flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg text-foreground">Book Summaries</span>
                </a>
                <nav className="flex items-center gap-4">
                  <a
                    href="/discover"
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                    Discover
                  </a>
                </nav>
              </div>
            </header>

            {/* Main */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
              <div className="max-w-7xl mx-auto px-4 space-y-2">
                <p>Visual book summaries for study and social sharing</p>
                <p className="text-xs text-muted-foreground/60">
                  These summaries contain original analysis and are not substitutes for the original works.
                  As an Amazon Associate, I earn from qualifying purchases.
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
