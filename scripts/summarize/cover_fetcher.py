"""
Fetch book cover images from Open Library API.
Free, no auth required. Falls back to placeholder if not found.
"""

import os
import re
import time
import urllib.request
import urllib.parse
import json
from pathlib import Path


COVERS_DIR = Path(__file__).parent.parent.parent / "public" / "covers"
OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json"
OPEN_LIBRARY_COVER = "https://covers.openlibrary.org/b/olid/{}-L.jpg"


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


def search_open_library(title: str, author: str) -> str | None:
    """Search Open Library for a book and return the cover edition key."""
    params = urllib.parse.urlencode({
        "title": title,
        "author": author,
        "limit": 3,
        "fields": "key,title,author_name,cover_edition_key,edition_key",
    })
    url = f"{OPEN_LIBRARY_SEARCH}?{params}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "BookSummaries/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        for doc in data.get("docs", []):
            # Try cover_edition_key first
            if doc.get("cover_edition_key"):
                return doc["cover_edition_key"]
            # Fall back to first edition_key
            if doc.get("edition_key"):
                return doc["edition_key"][0]

    except Exception as e:
        print(f"  Open Library search failed: {e}")

    return None


def download_cover(edition_key: str, output_path: str) -> bool:
    """Download a cover image from Open Library."""
    url = OPEN_LIBRARY_COVER.format(edition_key)

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "BookSummaries/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            # Check it's actually an image (not a 1x1 pixel placeholder)
            if len(data) < 1000:
                return False
            with open(output_path, 'wb') as f:
                f.write(data)
            return True
    except Exception as e:
        print(f"  Cover download failed: {e}")
        return False


def fetch_cover(title: str, author: str, book_slug: str) -> str | None:
    """Fetch and save a book cover. Returns the public path or None."""
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = COVERS_DIR / f"{book_slug}.jpg"

    # Skip if already downloaded
    if output_path.exists() and output_path.stat().st_size > 1000:
        return f"/covers/{book_slug}.jpg"

    print(f"  Fetching cover for: {title} by {author}")
    edition_key = search_open_library(title, author)

    if not edition_key:
        print(f"  No cover found on Open Library")
        return None

    time.sleep(1)  # Rate limit

    if download_cover(edition_key, str(output_path)):
        print(f"  Cover saved: {output_path.name}")
        return f"/covers/{book_slug}.jpg"

    return None


def main():
    """Fetch covers for all books in books.json that don't have one yet."""
    books_json = Path(__file__).parent.parent.parent / "src" / "data" / "books.json"
    if not books_json.exists():
        print("No books.json found")
        return

    with open(books_json) as f:
        data = json.load(f)

    books = data.get("books", [])
    if not books:
        print("No books in books.json")
        return

    fetched = 0
    skipped = 0
    for book in books:
        cover_path = COVERS_DIR / f"{book['slug']}.jpg"
        if cover_path.exists() and cover_path.stat().st_size > 1000:
            skipped += 1
            continue

        result = fetch_cover(book["title"], book["author"], book["slug"])
        if result:
            book["coverImage"] = result
            fetched += 1
        time.sleep(1)

    # Save updated books.json with cover paths
    with open(books_json, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nCovers: {fetched} fetched, {skipped} already existed")


if __name__ == "__main__":
    main()
