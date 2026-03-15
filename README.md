# Book Summaries

Generate a visual book summary website from raw text. Drop markdown files, run the pipeline, get a static site with slide decks, a discovery feed, and social media export.

## Prerequisites

- **Node.js 18+** — for the frontend ([download](https://nodejs.org/))
- **Python 3.10+** — for the processing pipeline
- **Google Gemini API key** — free tier available, used for chapter summarization (see [Setup](#gemini-api-key-setup) below)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/zxfriendx/book-summaries-public.git
cd book-summaries-public
npm install
```

### 2. Set up Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
pip install google-genai
```

### 3. Gemini API Key Setup

The pipeline uses Google's Gemini 2.5 Flash model to summarize chapters. You need a free API key:

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select an existing Google Cloud project, or create a new one
5. Copy the generated key (starts with `AIza...`)

Set the key as an environment variable:

```bash
# Linux/macOS — set for current session
export GEMINI_API_KEY=AIzaSy...your_key_here

# To persist across sessions, add that line to ~/.bashrc or ~/.zshrc:
echo 'export GEMINI_API_KEY=AIzaSy...your_key_here' >> ~/.bashrc

# Windows PowerShell
$env:GEMINI_API_KEY="AIzaSy...your_key_here"
```

**Free tier limits**: Gemini 2.5 Flash offers a generous free tier — typically enough to process dozens of books per day. The pipeline uses ~1 API call per chapter (a 15-chapter book = ~15 calls). Check current limits at [Google AI Studio](https://aistudio.google.com/).

> **Never commit your API key to git.** The `.env` file is already in `.gitignore`.

### 4. Process the sample book

A public domain copy of *The Art of War* by Sun Tzu is included in `input/` so you can test immediately:

```bash
python scripts/process_books.py
```

This will:
- Detect 13 chapters automatically
- Summarize each chapter via Gemini (key ideas, memorable insights, quotes)
- Fetch a cover image from Open Library
- Write everything to `src/data/books.json`

### 5. Build and preview

```bash
npm run build
npx serve out
```

Open `http://localhost:3000` to see your site.

For development with hot reload:

```bash
npm run dev
```

## Adding Your Own Books

1. Get your book as a markdown (`.md`) file — plain text with chapter headings works best
2. Drop it into the `input/` directory
3. Run the pipeline

```bash
python scripts/process_books.py
npm run build
```

### Filename conventions

The pipeline extracts title and author from your files. Any of these work:

| Filename | Title | Author |
|----------|-------|--------|
| `Atomic Habits - James Clear.md` | Atomic Habits | James Clear |
| `Atomic Habits  James Clear.md` (double space) | Atomic Habits | James Clear |
| `atomic-habits-james-clear.md` | Atomic Habits James Clear | (from content) |

For slug-style filenames, put the title and author in the first lines of the file:

```markdown
# Atomic Habits
**James Clear**

Chapter 1: The Surprising Power of Atomic Habits
...
```

### Pipeline options

```bash
# Process all new files in input/
python scripts/process_books.py

# Dry run — detect chapters without calling Gemini
python scripts/process_books.py --detect-only

# Process specific book(s) by title
python scripts/process_books.py --books "Art of War"

# Re-process books that already have chapters
python scripts/process_books.py --force

# Skip cover image fetching
python scripts/process_books.py --skip-covers
```

## What You Get

- **Home page** — searchable book grid with category filters and sorting
- **Book detail** — key takeaways, chapter summaries, notable quotes, who should read
- **Discover feed** — swipeable card feed (cover, takeaways, quotes, chapters, Amazon links)
- **Slide decks** — 15 visual slide types per book for social media
- **Export** — PNG/ZIP export in Instagram and LinkedIn formats
- **Dark/light mode** — system-aware theme switching

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| State | Zustand (favorites, bookmarks, persisted to localStorage) |
| Export | html2canvas + JSZip (slide PNG/ZIP) |
| Pipeline | Python, Google Gemini 2.5 Flash |
| Covers | Open Library API (free, no auth) |
| Deployment | Static export — deploy to any host (Netlify, Vercel, S3, etc.) |

## Project Structure

```
input/                    # Drop markdown files here
src/
├── app/                  # Next.js pages (home, discover, book detail)
├── components/           # React components (books, discover, slides, export)
├── lib/                  # Types, utilities, data accessors, Amazon helper
├── data/books.json       # Generated book data (pipeline output)
└── store/                # Zustand state (favorites, bookmarks)
public/
├── covers/               # Fetched cover images (pipeline output)
└── chapters/             # Chapter markdown files (pipeline output)
scripts/
├── process_books.py      # Main entry point — run this
├── chapter_pipeline.py   # Chapter detection + Gemini summarization
└── summarize/            # Cover fetcher, content classifier, prompts
```

## Troubleshooting

**"GEMINI_API_KEY environment variable is required"**
You haven't set the key. See [Gemini API Key Setup](#3-gemini-api-key-setup). Use `--detect-only` to test chapter detection without a key.

**"No markdown files found in input/"**
Drop a `.md` file into the `input/` directory and run again.

**"Insufficient chapters detected"**
The file may be too short (<8KB is classified as a "blurb" and skipped) or doesn't have recognizable chapter headings. Try adding `# Chapter 1: Title` style headings. The pipeline also has AI-powered chapter detection as a fallback.

**Build fails with "missing generateStaticParams"**
Run the pipeline first to populate `books.json`. The site needs at least one processed book to build.

## License

MIT
