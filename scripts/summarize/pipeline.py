#!/usr/bin/env python3
"""
Book summarization pipeline using Google Gemini API.
Reads markdown files, classifies content quality, generates structured summaries
and slide content, fetches covers, and writes books.json.

Usage:
    # Set API key
    export GEMINI_API_KEY=your_key_here

    # Run on 3 sample books (default)
    python scripts/summarize/pipeline.py

    # Run on specific books
    python scripts/summarize/pipeline.py --books "Atomic Habits" "Determined"

    # Run on all books
    python scripts/summarize/pipeline.py --all

    # Dry run (classify only, no API calls)
    python scripts/summarize/pipeline.py --dry-run
"""

import os
import sys
import json
import time
import re
import argparse
from pathlib import Path
from datetime import datetime

# Add scripts dir to path
sys.path.insert(0, str(Path(__file__).parent))

from classify import classify_content, get_content_stats, parse_title_author
from prompts import get_analysis_prompt, get_outline_prompt, get_slides_prompt
from cover_fetcher import fetch_cover

try:
    from google import genai
except ImportError:
    print("Missing google-genai. Install with: pip install google-genai")
    sys.exit(1)

# Paths
MARKDOWN_DIR = Path(os.environ.get("BOOK_INPUT_DIR", str(Path(__file__).resolve().parent.parent.parent / "input")))
OUTPUT_FILE = Path(__file__).parent.parent.parent / "src" / "data" / "books.json"

# Rate limiting
DELAY_BETWEEN_REQUESTS = 6  # seconds

# Model
GEMINI_MODEL = "gemini-2.5-flash"

# Sample books (one per quality tier)
SAMPLE_BOOKS = [
    "Determined  Robert Sapolsky.md",          # full (1.5MB)
    "First Break All the Rules  Marcus Buckingham.md",  # partial (43KB)
    "Atomic Habits  James Clear.md",            # blurb (5.5KB)
]


def slugify(text: str) -> str:
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


def extract_json(text: str) -> dict | list:
    """Extract JSON from model response, handling markdown code blocks and trailing text."""
    text = text.strip()
    # Strip markdown code blocks
    if text.startswith("```"):
        text = re.sub(r'^```\w*\n?', '', text)
        text = re.sub(r'\n?```\s*$', '', text)
        text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find the outermost JSON object or array
    # Look for { ... } or [ ... ] with balanced braces
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start = text.find(start_char)
        if start == -1:
            continue
        depth = 0
        in_string = False
        escape = False
        for i in range(start, len(text)):
            c = text[i]
            if escape:
                escape = False
                continue
            if c == '\\' and in_string:
                escape = True
                continue
            if c == '"' and not escape:
                in_string = not in_string
                continue
            if in_string:
                continue
            if c == start_char:
                depth += 1
            elif c == end_char:
                depth -= 1
                if depth == 0:
                    return json.loads(text[start:i+1])

    # Last resort: try removing trailing comma before closing brace
    text = re.sub(r',\s*([}\]])', r'\1', text)
    return json.loads(text)


class Pipeline:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.request_count = 0

    def call_gemini(self, prompt: str) -> str:
        """Call Gemini API with rate limiting and token tracking."""
        if self.request_count > 0:
            print(f"  Rate limiting: waiting {DELAY_BETWEEN_REQUESTS}s...")
            time.sleep(DELAY_BETWEEN_REQUESTS)

        response = self.client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "temperature": 0.7,
                "max_output_tokens": 16384,
            }
        )

        self.request_count += 1

        # Track token usage
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            usage = response.usage_metadata
            input_tokens = getattr(usage, 'prompt_token_count', 0) or 0
            output_tokens = getattr(usage, 'candidates_token_count', 0) or 0
            self.total_input_tokens += input_tokens
            self.total_output_tokens += output_tokens
            print(f"  Tokens: {input_tokens} in / {output_tokens} out")

        return response.text

    def process_book(self, filepath: Path) -> dict | None:
        """Process a single book markdown file into structured summary."""
        title, author = parse_title_author(filepath.name)
        slug = slugify(f"{title} {author}")
        stats = get_content_stats(str(filepath))

        print(f"\n{'='*60}")
        print(f"Processing: {title} by {author}")
        print(f"Quality: {stats['quality']} ({stats['size_kb']}KB, {stats['word_count']} words)")

        # Read content
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        # Step 1: Deep analysis
        print("  Step 1: Deep analysis...")
        analysis_prompt = get_analysis_prompt(title, author, content, stats['quality'])
        analysis_text = self.call_gemini(analysis_prompt)

        try:
            analysis = extract_json(analysis_text)
        except json.JSONDecodeError as e:
            print(f"  ERROR: Failed to parse analysis JSON: {e}")
            print(f"  Raw response: {analysis_text[:500]}...")
            return None

        analysis_str = json.dumps(analysis, indent=2)

        # Step 2: Slide outline
        print("  Step 2: Generating slide outline...")
        outline_prompt = get_outline_prompt(title, author, analysis_str)
        outline_text = self.call_gemini(outline_prompt)

        try:
            outline = extract_json(outline_text)
        except json.JSONDecodeError as e:
            print(f"  WARNING: Failed to parse outline JSON: {e}")
            print(f"  Retrying outline generation...")
            outline_text = self.call_gemini(outline_prompt)
            try:
                outline = extract_json(outline_text)
            except json.JSONDecodeError as e2:
                print(f"  ERROR: Retry also failed: {e2}")
                print(f"  Raw response: {outline_text[:500]}...")
                return None

        outline_str = json.dumps(outline, indent=2)

        # Step 3: Full slide content
        print("  Step 3: Generating full slides...")
        slides_prompt = get_slides_prompt(title, author, analysis_str, outline_str)
        slides_text = self.call_gemini(slides_prompt)

        try:
            slides = extract_json(slides_text)
        except json.JSONDecodeError as e:
            print(f"  WARNING: Failed to parse slides JSON: {e}")
            print(f"  Retrying slides generation...")
            slides_text = self.call_gemini(slides_prompt)
            try:
                slides = extract_json(slides_text)
            except json.JSONDecodeError as e2:
                print(f"  ERROR: Retry also failed: {e2}")
                print(f"  Raw response: {slides_text[:500]}...")
                return None

        # Use analysis data for summary fields (replaces old summary step)
        summary = analysis

        # Step 3: Fetch cover
        print("  Step 3: Fetching cover...")
        cover_path = fetch_cover(title, author, slug)

        # Assemble book object
        book = {
            "id": slug,
            "slug": slug,
            "title": summary.get("title", title),
            "author": summary.get("author", author),
            "category": summary.get("category", "Uncategorized"),
            "coverImage": cover_path,
            "oneLiner": summary.get("oneLiner", ""),
            "keyTakeaways": summary.get("keyTakeaways", []),
            "notableQuotes": summary.get("notableQuotes", []),
            "whoShouldRead": summary.get("whoShouldRead", []),
            "slides": slides if isinstance(slides, list) else [],
            "rating": summary.get("rating", 3),
            "verdict": summary.get("verdict", ""),
            "contentQuality": stats['quality'],
        }

        print(f"  Done: {len(book['slides'])} slides, {len(book['keyTakeaways'])} takeaways")
        return book

    def run(self, book_files: list[Path], output_path: Path):
        """Run the pipeline on a list of book files."""
        print(f"Pipeline starting: {len(book_files)} books")
        print(f"Output: {output_path}")

        books = []
        for filepath in book_files:
            try:
                book = self.process_book(filepath)
                if book:
                    books.append(book)
            except Exception as e:
                title, author = parse_title_author(filepath.name)
                print(f"  FAILED: {title} — {e}")
                continue

        # Merge with existing books.json if present
        existing_books = []
        if output_path.exists():
            try:
                with open(output_path, 'r') as f:
                    existing = json.load(f)
                existing_books = existing.get("books", [])
            except (json.JSONDecodeError, KeyError):
                pass

        # Replace existing books by slug, append new ones
        new_slugs = {b["slug"] for b in books}
        merged = [b for b in existing_books if b["slug"] not in new_slugs] + books

        output = {
            "books": merged,
            "generatedAt": datetime.now(tz=None).isoformat() + "Z",
            "version": "1.0.0",
        }

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print(f"\n{'='*60}")
        print(f"Pipeline complete!")
        print(f"  Books processed: {len(books)}/{len(book_files)}")
        print(f"  API requests: {self.request_count}")
        print(f"  Total tokens: {self.total_input_tokens:,} input / {self.total_output_tokens:,} output")
        print(f"  Estimated cost: ~${self._estimate_cost():.4f}")
        print(f"  Output: {output_path}")

    def _estimate_cost(self) -> float:
        """Estimate cost based on Gemini 2.5 Flash pricing."""
        # Gemini 2.5 Flash: $0.15/M input, $0.60/M output (approx)
        input_cost = (self.total_input_tokens / 1_000_000) * 0.15
        output_cost = (self.total_output_tokens / 1_000_000) * 0.60
        return input_cost + output_cost


def main():
    parser = argparse.ArgumentParser(description="Book summarization pipeline")
    parser.add_argument("--all", action="store_true", help="Process all books")
    parser.add_argument("--books", nargs="+", help="Specific book titles to process")
    parser.add_argument("--dry-run", action="store_true", help="Classify only, no API calls")
    parser.add_argument("--output", default=str(OUTPUT_FILE), help="Output JSON path")
    args = parser.parse_args()

    # Check markdown dir
    if not MARKDOWN_DIR.exists():
        print(f"Markdown directory not found: {MARKDOWN_DIR}")
        sys.exit(1)

    # Get book files
    all_files = sorted(MARKDOWN_DIR.glob("*.md"))
    print(f"Found {len(all_files)} markdown files in {MARKDOWN_DIR}")

    if args.dry_run:
        # Just classify and report
        for f in all_files:
            stats = get_content_stats(str(f))
            title, author = parse_title_author(f.name)
            print(f"  [{stats['quality']:>7}] {stats['size_kb']:>8.1f}KB  {title} — {author}")
        return

    # Select books to process
    if args.all:
        book_files = all_files
    elif args.books:
        book_files = []
        for query in args.books:
            matches = [f for f in all_files if query.lower() in f.stem.lower()]
            if matches:
                book_files.append(matches[0])
            else:
                print(f"Warning: no match for '{query}'")
    else:
        # Default: sample books
        book_files = []
        for name in SAMPLE_BOOKS:
            path = MARKDOWN_DIR / name
            if path.exists():
                book_files.append(path)
            else:
                print(f"Warning: sample book not found: {name}")

    if not book_files:
        print("No books to process!")
        sys.exit(1)

    # Check API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set")
        print("Set it with: export GEMINI_API_KEY=your_key_here")
        sys.exit(1)

    # Run pipeline
    pipeline = Pipeline(api_key)
    pipeline.run(book_files, Path(args.output))


if __name__ == "__main__":
    main()
