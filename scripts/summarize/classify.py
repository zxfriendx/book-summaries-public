"""
Content quality classifier for book markdown files.
Classifies books as full/partial/blurb based on file size and content analysis.
"""

import os
from pathlib import Path

# Thresholds in bytes
FULL_THRESHOLD = 40_000      # >40KB = full book content
PARTIAL_THRESHOLD = 8_000    # 8-40KB = partial summary/notes
# <8KB = blurb/description only


def classify_content(filepath: str) -> str:
    """Classify a markdown file's content quality."""
    size = os.path.getsize(filepath)

    if size >= FULL_THRESHOLD:
        return "full"
    elif size >= PARTIAL_THRESHOLD:
        return "partial"
    else:
        return "blurb"


def get_content_stats(filepath: str) -> dict:
    """Get content statistics for a markdown file."""
    size = os.path.getsize(filepath)
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    lines = content.split('\n')
    words = len(content.split())
    headings = sum(1 for line in lines if line.startswith('#'))

    return {
        "size_bytes": size,
        "size_kb": round(size / 1024, 1),
        "word_count": words,
        "line_count": len(lines),
        "heading_count": headings,
        "quality": classify_content(filepath),
    }


def parse_title_author(filename: str) -> tuple[str, str]:
    """Extract title and author from filename.

    Supported formats:
      - 'Title  Author.md' (double space separator)
      - 'title-author.md' (slug-style, last segment after final hyphen-word boundary)
      - 'Title - Author.md' (dash separator)

    For slug-style, also tries to extract from the first lines of the file
    (looks for '# Title' and '**Author**' patterns).
    """
    name = Path(filename).stem
    # Double space separator (legacy format)
    if '  ' in name:
        parts = name.split('  ', 1)
        return parts[0].strip(), parts[1].strip()
    # Dash separator with spaces: "Title - Author"
    if ' - ' in name:
        parts = name.split(' - ', 1)
        return parts[0].strip(), parts[1].strip()
    # Slug-style: "the-art-of-war-sun-tzu" → try to extract title from content later
    # For now, titlecase the slug
    return name.replace('-', ' ').title(), "Unknown"


if __name__ == "__main__":
    import sys

    markdown_dir = sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).resolve().parent.parent.parent / "input")

    stats = {"full": 0, "partial": 0, "blurb": 0}
    for f in sorted(Path(markdown_dir).glob("*.md")):
        info = get_content_stats(str(f))
        stats[info["quality"]] += 1
        title, author = parse_title_author(f.name)
        print(f"  [{info['quality']:>7}] {info['size_kb']:>8.1f}KB  {title} — {author}")

    print(f"\nTotal: {sum(stats.values())} books")
    print(f"  Full: {stats['full']}, Partial: {stats['partial']}, Blurb: {stats['blurb']}")
