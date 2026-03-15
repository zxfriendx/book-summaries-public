#!/usr/bin/env python3
"""
Chapter split + summarize pipeline.

Phase 1: Programmatically detect and split chapters from book markdown.
Phase 2: Per-chapter Gemini summarization (keyIdeas, memorableInsight, quote, detailedSummary).
Phase 3: Assemble chapters into books.json and save per-chapter markdown files.

Usage:
    # Test chapter detection only (no API calls)
    python scripts/chapter_pipeline.py --detect "The Art of War"

    # Detect chapters for all books (dry run)
    python scripts/chapter_pipeline.py --detect-all

    # Full pipeline for one book
    python scripts/chapter_pipeline.py --book "The Art of War"

    # Full pipeline for all books missing chapters
    python scripts/chapter_pipeline.py --all
"""

import os
import sys
import json
import re
import time
import argparse
from pathlib import Path
from datetime import datetime

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
MARKDOWN_DIR = Path(os.environ.get("BOOK_INPUT_DIR", str(PROJECT_ROOT / "input")))
BOOKS_JSON = PROJECT_ROOT / "src" / "data" / "books.json"
CHAPTERS_DIR = PROJECT_ROOT / "public" / "chapters"

# Add summarize dir for utilities
sys.path.insert(0, str(SCRIPT_DIR / "summarize"))
from classify import parse_title_author, classify_content

# Gemini config
GEMINI_MODEL = "gemini-2.5-flash"
RATE_LIMIT_SECONDS = 2

# Front/back matter patterns to skip
FRONT_MATTER_PATTERNS = [
    r"^(table of )?contents?$",
    r"^copyright",
    r"^dedication",
    r"^acknowledgments?",
    r"^about the authors?",
    r"^foreword",
    r"^preface",
    r"^prologue",
    r"^introduction$",
    r"^epigraph",
    r"^title page",
    r"^also by",
    r"^praise for",
    r"^cover",
    r"^note from the publisher",
]

BACK_MATTER_PATTERNS = [
    r"^(end)?notes?$",
    r"^bibliography",
    r"^index$",
    r"^glossary",
    r"^appendix",
    r"^references?$",
    r"^further reading",
    r"^about the authors?$",
    r"^acknowledgments?$",
    r"^credits?$",
]


def is_front_matter(title: str) -> bool:
    t = title.lower().strip()
    return any(re.match(p, t) for p in FRONT_MATTER_PATTERNS)


def is_back_matter(title: str) -> bool:
    t = title.lower().strip()
    return any(re.match(p, t) for p in BACK_MATTER_PATTERNS)


# ---------------------------------------------------------------------------
# Chapter Detection
# ---------------------------------------------------------------------------

WORD_TO_NUM = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
    "twenty-one": 21, "twenty-two": 22, "twenty-three": 23, "twenty-four": 24,
    "twenty-five": 25, "twenty-six": 26, "twenty-seven": 27, "twenty-eight": 28,
    "twenty-nine": 29, "thirty": 30,
}


def _parse_chapter_number(text: str) -> int | None:
    """Parse a chapter number from digits or written-out words like 'One', 'Twenty-Three'."""
    text = text.strip()
    if text.isdigit():
        return int(text)
    lower = text.lower()
    if lower in WORD_TO_NUM:
        return WORD_TO_NUM[lower]
    return None


def detect_chapters(content: str, filename: str = "") -> list[dict]:
    """
    Detect chapters in a markdown file. Returns list of:
    {number, title, start_line, end_line, char_count}

    Strategy:
    1. Look for markdown headings (# or ##) with chapter-like content
    2. Look for bare "Chapter N" / "CHAPTER N" lines (digits or words)
    3. Look for numbered top-level headings that form a sequence
    4. Fall back to major structural headings (# level)
    """
    lines = content.split("\n")
    candidates = []

    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue

        # Pattern 1: Markdown headings with chapter-like titles
        md_match = re.match(r'^(#{1,3})\s+(.+)$', stripped)
        if md_match:
            level = len(md_match.group(1))
            title = md_match.group(2).strip()

            # Skip empty headings
            if not title or title == '#':
                continue

            # Chapter/Part/Rule explicit markers
            chap_match = re.match(
                r'(?:Chapter|CHAPTER|Ch\.?)\s*([\w-]+)[\s:\.\-]*(.*)',
                title, re.IGNORECASE
            )
            if chap_match and _parse_chapter_number(chap_match.group(1)) is None:
                chap_match = None
            rule_match_heading = re.match(
                r'(?:Rule)\s*#?\s*(\d+)[\s:\.\-]*(.*)',
                title, re.IGNORECASE
            )
            if not chap_match and rule_match_heading:
                chap_match = rule_match_heading
            part_match = re.match(
                r'(?:Part|PART)\s+([IVXLCDM]+|\d+)[\s:\.\-]*(.*)',
                title, re.IGNORECASE
            )

            # CJK chapter markers in headings (第N章)
            cjk_heading = re.match(
                r'第\s*([0-9０-９]+)\s*章\s*(.*)',
                title
            )

            if chap_match:
                num_hint = _parse_chapter_number(chap_match.group(1))
                chapter_title = chap_match.group(2).strip() or f"Chapter {num_hint}"
                candidates.append({
                    "line": i, "level": level, "title": chapter_title,
                    "type": "chapter_heading", "num_hint": num_hint,
                    "raw": title,
                })
            elif cjk_heading:
                num_str = cjk_heading.group(1)
                num_str = num_str.translate(str.maketrans('０１２３４５６７８９', '0123456789'))
                num_hint = int(num_str)
                chapter_title = cjk_heading.group(2).strip() or f"Chapter {num_hint}"
                candidates.append({
                    "line": i, "level": level, "title": chapter_title,
                    "type": "chapter_cjk", "num_hint": num_hint,
                    "raw": title,
                })
            elif part_match:
                candidates.append({
                    "line": i, "level": level, "title": title,
                    "type": "part_heading", "num_hint": None,
                    "raw": title,
                })
            else:
                candidates.append({
                    "line": i, "level": level, "title": title,
                    "type": "heading", "num_hint": None,
                    "raw": title,
                })
            continue

        # Pattern 2: Bare "Chapter N" or "Chapter One" lines (no markdown heading)
        chap_bare = re.match(
            r'^(?:Chapter|CHAPTER|Ch\.?)\s+([\w-]+)[\s:\.\-]*(.*)',
            stripped, re.IGNORECASE
        )
        if chap_bare:
            num_hint = _parse_chapter_number(chap_bare.group(1))
            if num_hint is not None:
                chapter_title = chap_bare.group(2).strip()
                # If no title on same line, look ahead past blanks and underlines
                if not chapter_title:
                    for j in range(i + 1, min(i + 5, len(lines))):
                        ahead = lines[j].strip()
                        if not ahead or re.match(r'^[-=]+$', ahead):
                            continue
                        if not re.match(r'^(?:Chapter|CHAPTER|PART|#{1,3}\s)', ahead):
                            chapter_title = ahead
                        break
                chapter_title = chapter_title or f"Chapter {num_hint}"
                candidates.append({
                    "line": i, "level": 0, "title": chapter_title,
                    "type": "chapter_bare", "num_hint": num_hint,
                    "raw": stripped,
                })
                continue

        # Pattern 3: Bare number words as chapter markers (e.g., "ONE", "TWO", "TWENTY-THREE", "1", "2")
        if (stripped.upper() == stripped or stripped.isdigit()) and len(stripped) < 20:
            num_hint = _parse_chapter_number(stripped)
            if num_hint is not None:
                # Look ahead for title past blanks and underlines
                lookahead_title = ""
                for j in range(i + 1, min(i + 5, len(lines))):
                    ahead = lines[j].strip()
                    if not ahead or re.match(r'^[-=]+$', ahead):
                        continue
                    if not re.match(r'^(?:Chapter|CHAPTER|PART|#{1,3}\s|\d+$)', ahead):
                        lookahead_title = ahead
                    break
                candidates.append({
                    "line": i, "level": 0,
                    "title": lookahead_title or f"Chapter {num_hint}",
                    "type": "chapter_bare", "num_hint": num_hint,
                    "raw": stripped,
                })
                continue

        # Pattern 4: CJK chapter markers (第N章)
        cjk_match = re.match(r'^(?:#{1,3}\s+)?第\s*(\d+|[１２３４５６７８９０]+)\s*章', stripped)
        if cjk_match:
            num_str = cjk_match.group(1)
            # Convert fullwidth digits
            num_str = num_str.translate(str.maketrans('１２３４５６７８９０', '1234567890'))
            num_hint = int(num_str)
            # Title is the rest of the line after the chapter marker
            title_rest = re.sub(r'^(?:#{1,3}\s+)?第\s*(?:\d+|[１２３４５６７８９０]+)\s*章\s*', '', stripped).strip()
            chapter_title = title_rest or f"Chapter {num_hint}"
            candidates.append({
                "line": i, "level": 1, "title": chapter_title,
                "type": "chapter_cjk", "num_hint": num_hint,
                "raw": stripped,
            })

    if not candidates:
        return []

    # Pick the best set of candidates
    chapters = _select_chapters(candidates, lines)

    # Filter front/back matter
    chapters = [c for c in chapters if not is_front_matter(c["title"]) and not is_back_matter(c["title"])]

    # Assign line ranges and char counts
    for idx, chap in enumerate(chapters):
        start = chap["start_line"]
        end = chapters[idx + 1]["start_line"] if idx + 1 < len(chapters) else len(lines)
        chap["end_line"] = end
        chap["text"] = "\n".join(lines[start:end])
        chap["char_count"] = len(chap["text"])

    # Filter out very short "chapters" (likely headings or section markers)
    chapters = [c for c in chapters if c["char_count"] >= 500]

    # Renumber sequentially
    for i, chap in enumerate(chapters):
        chap["number"] = i + 1

    return chapters


def _detect_toc_cluster(chapter_types: list[dict]) -> set[int]:
    """Detect TOC clusters — runs of 3+ chapter markers within 5 lines of each other.
    Returns the set of line numbers that belong to a TOC cluster."""
    if len(chapter_types) < 3:
        return set()
    sorted_by_line = sorted(chapter_types, key=lambda c: c["line"])
    toc_lines: set[int] = set()
    # Sliding window: if 3+ consecutive markers have max gap ≤ 5 lines, it's a TOC
    run_start = 0
    for i in range(1, len(sorted_by_line)):
        if sorted_by_line[i]["line"] - sorted_by_line[i - 1]["line"] > 5:
            if i - run_start >= 3:
                for j in range(run_start, i):
                    toc_lines.add(sorted_by_line[j]["line"])
            run_start = i
    # Check final run
    if len(sorted_by_line) - run_start >= 3:
        for j in range(run_start, len(sorted_by_line)):
            toc_lines.add(sorted_by_line[j]["line"])
    return toc_lines


def _select_chapters(candidates: list[dict], lines: list[str]) -> list[dict]:
    """Select the best chapter candidates from all detected headings."""

    # Priority 1: Explicit chapter headings (Chapter N, 第N章)
    chapter_types = [c for c in candidates if c["type"] in ("chapter_heading", "chapter_bare", "chapter_cjk")]
    if len(chapter_types) >= 3:
        # Deduplicate: if same chapter number appears multiple times,
        # detect TOC clusters (markers packed tightly together) and prefer
        # the non-TOC occurrence.  Appendix summaries come AFTER real chapters,
        # so among non-TOC occurrences, keep the first.
        toc_lines = _detect_toc_cluster(chapter_types)
        by_num = {}
        for c in chapter_types:
            in_toc = c["line"] in toc_lines
            if c["num_hint"] in by_num:
                prev_in_toc = by_num[c["num_hint"]]["_in_toc"]
                # Prefer non-TOC over TOC; among same category, keep first
                if prev_in_toc and not in_toc:
                    c["_in_toc"] = in_toc
                    by_num[c["num_hint"]] = c
                # else keep existing (first non-TOC wins, or first TOC if all are TOC)
            else:
                c["_in_toc"] = in_toc
                by_num[c["num_hint"]] = c
        deduped = list(by_num.values())
        if len(deduped) >= 3:
            return [{"number": c["num_hint"], "title": c["title"], "start_line": c["line"]}
                    for c in sorted(deduped, key=lambda x: x["line"])]

    # Priority 2: Headings by level — prefer the coarsest level that gives 3-30 chapters
    # Try each level, pick the one closest to the ideal range
    best_level_result = None
    best_level_score = float('inf')
    for level in (1, 2, 3):
        at_level = [c for c in candidates
                    if c["level"] == level
                    and c["type"] == "heading"
                    and not is_front_matter(c["title"])
                    and not is_back_matter(c["title"])
                    and len(c["title"]) > 1]
        if len(at_level) >= 3:
            # Score: 0 if in ideal range (3-30), distance from range otherwise
            # Prefer coarser levels (lower level number) as tiebreaker
            count = len(at_level)
            if 3 <= count <= 30:
                score = level  # just use level as tiebreaker (lower = better)
            else:
                score = 100 + abs(count - 15) + level  # penalize, prefer closer to 15
            if score < best_level_score:
                best_level_score = score
                best_level_result = at_level

    if best_level_result is not None:
        return [{"number": i + 1, "title": c["title"], "start_line": c["line"]}
                for i, c in enumerate(best_level_result)]

    # Priority 3: All content headings — but if too many, only use the coarsest level present
    content_headings = [c for c in candidates
                        if not is_front_matter(c["title"])
                        and not is_back_matter(c["title"])
                        and c["type"] != "part_heading"
                        and len(c["title"]) > 1]
    if len(content_headings) >= 3:
        if len(content_headings) > 30:
            # Too many — find the coarsest level among them
            min_level = min(c["level"] for c in content_headings)
            coarse = [c for c in content_headings if c["level"] == min_level]
            if len(coarse) >= 3:
                content_headings = coarse
        return [{"number": i + 1, "title": c["title"], "start_line": c["line"]}
                for i, c in enumerate(content_headings)]

    # Fallback: return everything we found
    return [{"number": i + 1, "title": c["title"], "start_line": c["line"]}
            for i, c in enumerate(candidates) if not is_front_matter(c["title"])]


# ---------------------------------------------------------------------------
# AI Chapter Detection (for flat files and over-split books)
# ---------------------------------------------------------------------------

AI_DETECT_PROMPT = """\
You are analyzing a book's structure to identify its CHAPTER-LEVEL divisions. \
Not sub-sections, not parts — the main chapters that a table of contents would list.

Book: "{title}" by {author}

{headings_section}

Here are samples from the book text (with line numbers):

--- BEGINNING (lines 1-200) ---
{first_chunk}

--- MIDDLE (sampled) ---
{middle_chunk}

--- END ---
{last_chunk}

Return a JSON array of chapters. Each chapter needs:
- "title": the chapter title as it appears in the book
- "line_keyword": a UNIQUE phrase (5+ words) from the first sentence or heading of that \
chapter that I can search for to locate its exact position. Must be verbatim from the text.

Target 5-25 chapters. If the book has Parts containing chapters, list the chapters (not parts).
Skip front matter (TOC, copyright, dedication) and back matter (index, notes, bibliography).
If there are 30+ headings that all look like chapters, pick only the major chapter-level ones.

Return ONLY valid JSON array. Example:
[
  {{"title": "The New Rules", "line_keyword": "The New Rules of Negotiation"}},
  {{"title": "Be a Mirror", "line_keyword": "Be a Mirror: How to Get Your"}}
]"""


def _recover_truncated_json_array(raw: str) -> list | None:
    """Recover complete JSON objects from a truncated array like '[{...}, {... (cut off)'."""
    # Find all complete {...} objects in the string
    objects = []
    i = raw.find('[')
    if i < 0:
        i = 0
    i += 1  # skip the opening [

    while i < len(raw):
        # Find next object start
        start = raw.find('{', i)
        if start < 0:
            break
        # Find matching close brace
        depth = 0
        in_string = False
        escape = False
        found_end = None
        for j in range(start, len(raw)):
            c = raw[j]
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
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    found_end = j
                    break
        if found_end is None:
            break  # This object is truncated — stop here
        try:
            obj = json.loads(raw[start:found_end + 1])
            objects.append(obj)
        except json.JSONDecodeError:
            pass
        i = found_end + 1

    return objects if objects else None


def ai_detect_chapters(client, content: str, title: str, author: str) -> list[dict] | None:
    """Use Gemini to detect chapter boundaries when programmatic detection fails."""
    lines = content.split("\n")

    # Collect all headings for context
    headings = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if re.match(r'^#{1,3}\s+.+', stripped):
            headings.append(f"  L{i}: {stripped[:80]}")

    if headings:
        headings_section = "Headings found in the markdown (line number: heading):\n" + "\n".join(headings[:200])
    else:
        headings_section = "No markdown headings found. Chapter breaks may be INLINE (concatenated without line breaks, e.g., '...end of prev chapter.Chapter OneTitle Here...'). Look for 'Chapter', 'CHAPTER', 'Part', 'Rule #', section numbers, or topic shifts. Search within lines, not just at line starts."

    total = len(lines)

    # For flat files (no headings), send strategic samples to find chapter breaks
    if len(headings) <= 1 and len(content) > 10000:
        # Strategy: scan for lines containing chapter-like keywords AND send regular samples
        # This catches inline "Chapter OneTitle" patterns that appear mid-line
        keyword_lines = []
        for i, line in enumerate(lines):
            if line.strip() and re.search(
                r'chapter\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)'
                r'|rule\s*#?\s*\d+'
                r'|part\s+(?:one|two|three|1|2|3|[ivx]+)\b'
                r'|(?:introduction|conclusion|epilogue|prologue)(?=[A-Z]|$)',
                line, re.IGNORECASE
            ):
                # Show the keyword line plus surrounding context
                ctx_start = max(0, i - 1)
                ctx_end = min(len(lines), i + 2)
                for j in range(ctx_start, ctx_end):
                    keyword_lines.append(f"L{j}: {lines[j][:300]}")
                keyword_lines.append("")

        keyword_section = ""
        if keyword_lines:
            keyword_section = "\n\n--- LINES WITH CHAPTER-LIKE KEYWORDS ---\n" + "\n".join(keyword_lines[:200])

        first_chunk_lines = [f"L{i}: {line[:300]}" for i, line in enumerate(lines[:100]) if line.strip()]
        first_chunk = "\n".join(first_chunk_lines[:60])

        # Sample at regular intervals
        middle_samples = []
        for pct in range(10, 95, 8):
            start = int(total * pct / 100)
            sample = []
            for j in range(50):
                if start + j < total and lines[start + j].strip():
                    sample.append(f"L{start+j}: {lines[start+j][:300]}")
            if sample:
                middle_samples.append(f"\n--- ~{pct}% (line {start}) ---")
                middle_samples.extend(sample[:15])
        middle_chunk = "\n".join(middle_samples) + keyword_section

        last_start = max(0, total - 100)
        last_lines = [f"L{last_start+j}: {lines[last_start+j][:300]}" for j in range(100) if last_start+j < total and lines[last_start+j].strip()]
        last_chunk = "\n".join(last_lines[:40])
    else:
        # For books with headings (over-split case), send samples
        first_lines = [f"L{i}: {line}" for i, line in enumerate(lines[:200]) if line.strip()]
        first_chunk = "\n".join(first_lines[:100])

        middle_samples = []
        for pct in (0.2, 0.35, 0.5, 0.65, 0.8):
            start = int(total * pct)
            sample_lines = [f"L{start+j}: {lines[start+j]}" for j in range(40) if start+j < total and lines[start+j].strip()]
            middle_samples.append(f"--- Around line {start} ({int(pct*100)}%) ---")
            middle_samples.extend(sample_lines[:20])
        middle_chunk = "\n".join(middle_samples)

        last_start = max(0, total - 100)
        last_lines = [f"L{last_start+j}: {lines[last_start+j]}" for j in range(100) if last_start+j < total and lines[last_start+j].strip()]
        last_chunk = "\n".join(last_lines[:50])

    prompt = AI_DETECT_PROMPT.format(
        title=title,
        author=author,
        headings_section=headings_section,
        first_chunk=first_chunk,
        middle_chunk=middle_chunk,
        last_chunk=last_chunk,
    )

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={"temperature": 0.2, "max_output_tokens": 8192},
        )
    except Exception as e:
        print(f"    AI detection error: {e}")
        return None

    if not response.text:
        return None

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = re.sub(r'^```\w*\n?', '', raw)
        raw = re.sub(r'\n?```\s*$', '', raw)
        raw = raw.strip()

    try:
        chapter_list = json.loads(raw)
    except json.JSONDecodeError:
        # Try to find complete JSON array
        start = raw.find('[')
        if start >= 0:
            depth = 0
            in_string = False
            escape = False
            for i in range(start, len(raw)):
                c = raw[i]
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
                if c == '[':
                    depth += 1
                elif c == ']':
                    depth -= 1
                    if depth == 0:
                        try:
                            chapter_list = json.loads(raw[start:i+1])
                            break
                        except json.JSONDecodeError:
                            pass
            else:
                # Array was truncated — recover complete objects
                chapter_list = _recover_truncated_json_array(raw[start:] if start >= 0 else raw)
                if not chapter_list:
                    return None
        else:
            return None

    if not isinstance(chapter_list, list) or len(chapter_list) == 0:
        return None

    # Find each chapter's position in the text by searching for the keyword
    chapters = []
    for idx, ch in enumerate(chapter_list):
        keyword = ch.get("line_keyword", ch.get("title", ""))
        chapter_title = ch.get("title", f"Chapter {idx + 1}")

        # Search for the keyword in lines
        found_line = None
        keyword_lower = keyword.lower().strip()
        for i, line in enumerate(lines):
            if keyword_lower in line.lower():
                found_line = i
                break

        if found_line is not None:
            chapters.append({
                "number": idx + 1,
                "title": chapter_title,
                "start_line": found_line,
            })

    if not chapters:
        return None

    # Sort by position and assign text/char_count
    chapters.sort(key=lambda x: x["start_line"])
    for idx, chap in enumerate(chapters):
        start = chap["start_line"]
        end = chapters[idx + 1]["start_line"] if idx + 1 < len(chapters) else len(lines)
        chap["text"] = "\n".join(lines[start:end])
        chap["char_count"] = len(chap["text"])
        chap["end_line"] = end

    # Filter short chapters and renumber
    chapters = [c for c in chapters if c["char_count"] >= 500]
    for i, chap in enumerate(chapters):
        chap["number"] = i + 1

    return chapters


# ---------------------------------------------------------------------------
# Gemini Summarization
# ---------------------------------------------------------------------------

NONFICTION_PROMPT = """\
You are extracting the key knowledge from a book chapter. Write as if you absorbed \
the content and are sharing the insights directly — NOT as if you're describing what \
the author wrote.

RULES:
- NEVER write "the author explains/argues/discusses/describes/suggests"
- NEVER write "this chapter covers/explores/examines/introduces"
- NEVER write "the reader learns" or "we are told"
- State insights as FACTS with specific examples, names, and data from the text
- Be concise and direct — every sentence must carry information

Book: "{title}" by {author}
Chapter {number}: {chapter_title}

--- BEGIN CHAPTER TEXT ---
{chapter_text}
--- END CHAPTER TEXT ---

Produce a JSON object:
{{
  "keyIdeas": ["3-5 tweet-length bullets — direct statements of insight, not descriptions"],
  "memorableInsight": "The single most surprising or useful idea from this chapter — one sentence",
  "quote": {{"text": "Best direct quote from the chapter", "context": "One phrase on why it matters"}},
  "detailedSummary": "2-3 paragraphs of distilled knowledge stated as direct fact. CRITICAL RULES: (1) Never reference the author by name — don't say 'Clear argues' or 'Pink explains'. (2) Never say 'this chapter' or 'the book'. (3) Never use meta-framing like 'the central metaphor is' or 'the key insight is'. (4) Never write like an academic paper — no 'as evidenced by Smith (2007)' or 'research by Jones demonstrates'. Name researchers only when their specific finding IS the point, not as citations. (5) Teach the IDEAS using vivid examples from the text, not a catalog of who studied what. Example — BAD: 'Clear introduces three layers of behavior change.' GOOD: 'Behavior change has three layers: outcomes, processes, and identity.' BAD: 'Research by Ariely (2005) demonstrated that high incentives resulted in worse outcomes.' GOOD: 'High incentives backfire for cognitive tasks — people offered the largest bonuses performed worst.'"
}}

If no good quote exists, set quote to null.
Return ONLY valid JSON. No markdown fences, no commentary."""

FICTION_PROMPT = """\
You are writing Cliff's Notes-style analysis of a book chapter. Cover plot, character \
development, and thematic significance. Write directly — not as a book report.

RULES:
- NEVER write "the author shows/reveals/uses/employs"
- NEVER write "this chapter depicts/portrays/illustrates"
- State what HAPPENS and what it MEANS — directly
- Be concise: every sentence advances understanding

Book: "{title}" by {author}
Chapter {number}: {chapter_title}

--- BEGIN CHAPTER TEXT ---
{chapter_text}
--- END CHAPTER TEXT ---

Produce a JSON object:
{{
  "keyIdeas": ["3-5 tweet-length bullets — key plot developments and thematic beats"],
  "memorableInsight": "The most significant thematic or character moment — one sentence",
  "quote": {{"text": "Most powerful line from the chapter", "context": "One phrase on its significance"}},
  "detailedSummary": "2-3 paragraphs: what happens, why it matters, how it connects to the larger story. CRITICAL: never reference the author by name, never say 'this chapter', never use literary analysis framing like 'serves to illustrate' or 'the author employs'. Just describe what happens and what it means. Use character names, specific events, thematic threads."
}}

If no good quote exists, set quote to null.
Return ONLY valid JSON. No markdown fences, no commentary."""

FICTION_CATEGORIES = {"Fiction", "Literature", "Poetry", "Drama"}


def get_book_category(books_data: dict, title: str) -> str | None:
    """Look up a book's category from books.json."""
    for book in books_data.get("books", []):
        if book.get("title", "").lower() == title.lower():
            return book.get("category")
        # Fuzzy: check if title is contained
        if title.lower() in book.get("title", "").lower():
            return book.get("category")
    return None


def summarize_chapter(client, title: str, author: str, chapter: dict, is_fiction: bool) -> dict | None:
    """Send one chapter to Gemini and get structured summary."""
    prompt_template = FICTION_PROMPT if is_fiction else NONFICTION_PROMPT

    # Truncate very long chapters
    chapter_text = chapter["text"]
    if len(chapter_text) > 200_000:
        chapter_text = chapter_text[:200_000]

    prompt = prompt_template.format(
        title=title,
        author=author,
        number=chapter["number"],
        chapter_title=chapter["title"],
        chapter_text=chapter_text,
    )

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "temperature": 0.4,
                "max_output_tokens": 8192,
            }
        )
    except Exception as e:
        print(f"    API error: {e}")
        return None

    if not response.text:
        print(f"    Empty response from Gemini")
        return None

    raw = response.text.strip()

    # Strip markdown fences
    if raw.startswith("```"):
        raw = re.sub(r'^```\w*\n?', '', raw)
        raw = re.sub(r'\n?```\s*$', '', raw)
        raw = raw.strip()

    # Try to extract JSON (handle trailing text)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Find balanced JSON object
        start = raw.find('{')
        if start >= 0:
            depth = 0
            in_string = False
            escape = False
            for i in range(start, len(raw)):
                c = raw[i]
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
                if c == '{':
                    depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(raw[start:i+1])
                        except json.JSONDecodeError:
                            break

    # Fallback: extract partial fields from truncated JSON
    result = _recover_partial_summary(raw)
    if result:
        print(f"    Recovered partial JSON ({len(result.get('keyIdeas', []))} ideas)")
        return result

    print(f"    Failed to parse JSON: {raw[:200]}...")
    return None


def _recover_partial_summary(raw: str) -> dict | None:
    """Extract whatever fields we can from a truncated JSON summary response."""
    result = {}

    # Extract keyIdeas array
    key_ideas_match = re.search(r'"keyIdeas"\s*:\s*\[', raw)
    if key_ideas_match:
        start = key_ideas_match.end() - 1  # include the [
        ideas = _extract_string_array(raw[start:])
        if ideas:
            result["keyIdeas"] = ideas

    # Extract simple string fields
    for field in ["memorableInsight", "quote", "detailedSummary"]:
        match = re.search(rf'"{field}"\s*:\s*"', raw)
        if match:
            val_start = match.end()
            # Find the closing quote (handle escaped quotes)
            i = val_start
            while i < len(raw):
                if raw[i] == '\\':
                    i += 2
                    continue
                if raw[i] == '"':
                    break
                i += 1
            if i < len(raw):
                try:
                    val = json.loads('"' + raw[val_start:i] + '"')
                    result[field] = val
                except json.JSONDecodeError:
                    pass

    return result if result.get("keyIdeas") or result.get("detailedSummary") else None


def _extract_string_array(raw: str) -> list[str]:
    """Extract complete strings from a possibly truncated JSON array."""
    if not raw.startswith('['):
        return []
    strings = []
    i = 1
    while i < len(raw):
        # Skip whitespace/commas
        while i < len(raw) and raw[i] in ' \t\n\r,':
            i += 1
        if i >= len(raw) or raw[i] == ']':
            break
        if raw[i] != '"':
            break
        # Extract string
        i += 1
        start = i
        while i < len(raw):
            if raw[i] == '\\':
                i += 2
                continue
            if raw[i] == '"':
                break
            i += 1
        if i >= len(raw):
            break  # truncated
        try:
            s = json.loads('"' + raw[start:i] + '"')
            strings.append(s)
        except json.JSONDecodeError:
            pass
        i += 1
    return strings


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def load_books_json() -> dict:
    if BOOKS_JSON.exists():
        with open(BOOKS_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"books": []}


def save_books_json(data: dict):
    BOOKS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(BOOKS_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)



def find_markdown_file(book_name: str) -> Path | None:
    """Find markdown file matching book name (fuzzy)."""
    book_lower = book_name.lower().strip()
    for md_file in MARKDOWN_DIR.glob("*.md"):
        title, _ = parse_title_author(md_file.name)
        if title.lower() == book_lower:
            return md_file
    for md_file in MARKDOWN_DIR.glob("*.md"):
        if book_lower in md_file.stem.lower():
            return md_file
    return None


def save_chapter_files(slug: str, chapters: list[dict]):
    """Save per-chapter markdown files to public/chapters/{slug}/."""
    out_dir = CHAPTERS_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    for chap in chapters:
        if chap.get("text"):
            chapter_file = out_dir / f"chapter-{chap['number']}.md"
            with open(chapter_file, "w", encoding="utf-8") as f:
                f.write(chap["text"])


def extract_title_author_from_content(content: str, filename_title: str, filename_author: str) -> tuple[str, str]:
    """Try to extract title and author from the markdown content itself.

    Looks for patterns like:
      # Title
      **Author** (...)
    Falls back to filename-derived values.
    """
    lines = content.split('\n', 20)  # Only check first 20 lines
    title = filename_title
    author = filename_author

    for i, line in enumerate(lines):
        stripped = line.strip()
        # Title from first H1 heading
        if stripped.startswith('# ') and not stripped.startswith('## '):
            candidate = stripped[2:].strip()
            # Skip if it's a chapter heading
            if not re.match(r'(?i)chapter\s+[IVXL\d]', candidate):
                title = candidate
                # Look for author on next non-empty lines
                for j in range(i + 1, min(i + 5, len(lines))):
                    author_line = lines[j].strip()
                    # **Author Name** or **Author Name** (translator info)
                    m = re.match(r'\*\*(.+?)\*\*', author_line)
                    if m:
                        author = m.group(1).strip()
                        break
                    # "by Author Name"
                    m = re.match(r'(?i)by\s+(.+)', author_line)
                    if m:
                        author = m.group(1).strip()
                        break
                break

    return title, author


def slugify(text: str) -> str:
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')


def find_book_in_json(books_data: dict, title: str, author: str) -> dict | None:
    """Find a book entry in books.json by title/slug/author match."""
    title_lower = title.lower()
    title_slug = slugify(title)
    author_slug = slugify(author) if author else ""

    # Pass 1: exact title match
    for book in books_data.get("books", []):
        if book.get("title", "").lower() == title_lower:
            return book

    # Pass 2: title substring match
    for book in books_data.get("books", []):
        book_title = book.get("title", "").lower()
        if title_lower in book_title or book_title in title_lower:
            return book

    # Pass 3: slug-based match (handles punctuation/formatting differences)
    for book in books_data.get("books", []):
        book_slug = book.get("slug", "")
        # Check if our title slug is contained in book slug or vice versa
        if title_slug and (title_slug in book_slug or book_slug.startswith(title_slug)):
            return book

    # Pass 4: match by author slug + partial title overlap
    if author_slug:
        for book in books_data.get("books", []):
            book_slug = book.get("slug", "")
            if author_slug in book_slug:
                # Author matches — check if any significant title words match
                title_words = set(re.sub(r'[^a-z0-9\s]', '', title_lower).split()) - {'the', 'a', 'an', 'of', 'and', 'in', 'to', 'for'}
                book_title_lower = book.get("title", "").lower()
                book_words = set(re.sub(r'[^a-z0-9\s]', '', book_title_lower).split()) - {'the', 'a', 'an', 'of', 'and', 'in', 'to', 'for'}
                if title_words & book_words:
                    return book

    return None


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------

def process_book(
    title: str,
    author: str,
    md_path: Path,
    books_data: dict,
    client=None,
    detect_only: bool = False,
) -> bool:
    """Process one book: detect chapters, optionally summarize, write results."""
    with open(md_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    # Try to get better title/author from content
    title, author = extract_title_author_from_content(content, title, author)

    print(f"\n{'='*60}")
    print(f"  {title} by {author}")
    print(f"  File: {md_path.name}")

    quality = classify_content(str(md_path))
    if quality == "blurb":
        print(f"  Skipping — blurb quality ({len(content)} chars)")
        return False

    # Phase 1: Detect chapters
    chapters = detect_chapters(content, md_path.name)

    # If detection failed or is unreliable (0-1 chapters or 50+), try AI detection
    needs_ai_detection = len(chapters) <= 1 or len(chapters) > 50
    if needs_ai_detection and not detect_only and client is not None:
        print(f"  Programmatic detection got {len(chapters)} chapters — trying AI detection...")
        ai_chapters = ai_detect_chapters(client, content, title, author)
        # Accept AI result only if it's reasonable AND not drastically fewer than programmatic
        prog_count = len(chapters)
        ai_count = len(ai_chapters) if ai_chapters else 0
        if ai_chapters and 2 <= ai_count <= 50 and (prog_count <= 1 or ai_count >= prog_count * 0.3):
            chapters = ai_chapters
        else:
            print(f"  AI detection returned {ai_count} — using programmatic result")
    elif needs_ai_detection and detect_only:
        print(f"  ({len(chapters)} chapters — would use AI detection in full mode)")

    print(f"  Detected {len(chapters)} chapters:")
    for ch in chapters:
        print(f"    {ch['number']:>2}. {ch['title'][:60]:<60} ({ch['char_count']:>6,} chars)")

    if not chapters or len(chapters) <= 1:
        print(f"  Insufficient chapters detected — skipping")
        return False

    if detect_only:
        return True

    # Phase 2: Summarize each chapter via Gemini
    category = get_book_category(books_data, title)
    is_fiction = category in FICTION_CATEGORIES if category else False
    print(f"  Category: {category or 'unknown'} ({'fiction' if is_fiction else 'non-fiction'} prompt)")

    summarized_chapters = []
    for ch in chapters:
        print(f"    Chapter {ch['number']}: {ch['title'][:50]}...", end=" ")
        summary = summarize_chapter(client, title, author, ch, is_fiction)
        if summary:
            summarized_chapters.append({
                "number": ch["number"],
                "title": ch["title"],
                "keyIdeas": summary.get("keyIdeas", []),
                "memorableInsight": summary.get("memorableInsight", ""),
                "quote": summary.get("quote"),
                "detailedSummary": summary.get("detailedSummary", ""),
            })
            n_ideas = len(summary.get("keyIdeas", []))
            print(f"OK ({n_ideas} ideas)")
        else:
            # Still include chapter with empty summary
            summarized_chapters.append({
                "number": ch["number"],
                "title": ch["title"],
                "keyIdeas": [],
                "memorableInsight": "",
                "quote": None,
                "detailedSummary": "",
            })
            print("FAILED")

        time.sleep(RATE_LIMIT_SECONDS)

    # Phase 3: Save results
    # Find or create book entry
    book_entry = find_book_in_json(books_data, title, author)
    slug = book_entry["slug"] if book_entry else slugify(f"{title} {author}")

    # Save chapter markdown files
    save_chapter_files(slug, chapters)
    print(f"  Saved {len(chapters)} chapter files to public/chapters/{slug}/")

    # Update or create books.json entry
    if book_entry:
        book_entry["chapters"] = summarized_chapters
        print(f"  Updated books.json: {len(summarized_chapters)} chapters")
    else:
        # Create a new book entry with sensible defaults
        new_entry = {
            "id": slug,
            "slug": slug,
            "title": title,
            "author": author,
            "category": "Uncategorized",
            "coverImage": f"/covers/{slug}.jpg",
            "oneLiner": "",
            "keyTakeaways": [],
            "notableQuotes": [],
            "whoShouldRead": [],
            "slides": [],
            "rating": None,
            "verdict": "",
            "contentQuality": quality,
            "chapters": summarized_chapters,
        }
        books_data.setdefault("books", []).append(new_entry)
        print(f"  Created new books.json entry: {slug} ({len(summarized_chapters)} chapters)")

    # Save after each book
    save_books_json(books_data)
    return True



def main():
    parser = argparse.ArgumentParser(description="Chapter split + summarize pipeline")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--detect", type=str, help="Detect chapters for one book (no API)")
    group.add_argument("--detect-all", action="store_true", help="Detect chapters for all books (no API)")
    group.add_argument("--book", type=str, help="Full pipeline for one book")
    group.add_argument("--books", nargs="+", type=str, help="Full pipeline for multiple books")
    group.add_argument("--all", action="store_true", help="Full pipeline for all books missing chapters")
    parser.add_argument("--force", action="store_true", help="Re-process even if chapters exist")
    args = parser.parse_args()

    detect_only = args.detect is not None or args.detect_all

    # Load books.json
    books_data = load_books_json()
    print(f"Loaded books.json: {len(books_data.get('books', []))} entries")

    # Determine targets
    if args.detect:
        md_path = find_markdown_file(args.detect)
        if not md_path:
            print(f"No markdown found for '{args.detect}'")
            sys.exit(1)
        title, author = parse_title_author(md_path.name)
        targets = [(title, author, md_path)]

    elif args.detect_all:
        targets = []
        for md_file in sorted(MARKDOWN_DIR.glob("*.md")):
            title, author = parse_title_author(md_file.name)
            if classify_content(str(md_file)) != "blurb":
                targets.append((title, author, md_file))

    elif args.book:
        md_path = find_markdown_file(args.book)
        if not md_path:
            print(f"No markdown found for '{args.book}'")
            sys.exit(1)
        title, author = parse_title_author(md_path.name)
        targets = [(title, author, md_path)]

    elif args.books:
        targets = []
        for query in args.books:
            md_path = find_markdown_file(query)
            if not md_path:
                print(f"No markdown found for '{query}'")
                continue
            title, author = parse_title_author(md_path.name)
            targets.append((title, author, md_path))

    elif args.all:
        targets = []
        for md_file in sorted(MARKDOWN_DIR.glob("*.md")):
            title, author = parse_title_author(md_file.name)
            if classify_content(str(md_file)) == "blurb":
                continue
            # Skip if already has chapters (unless --force)
            if not args.force:
                book_entry = find_book_in_json(books_data, title, author)
                if book_entry and book_entry.get("chapters"):
                    continue
            targets.append((title, author, md_file))

    print(f"Targets: {len(targets)} books")

    # Initialize Gemini client if doing summarization
    client = None
    if not detect_only:
        try:
            from google import genai
        except ImportError:
            print("Missing google-genai. Install with: pip install google-genai")
            sys.exit(1)

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("Error: GEMINI_API_KEY not set")
            sys.exit(1)

        client = genai.Client(api_key=api_key)

    # Process each book
    success = 0
    fail = 0
    for title, author, md_path in targets:
        ok = process_book(title, author, md_path, books_data, client, detect_only)
        if ok:
            success += 1
        else:
            fail += 1

    print(f"\n{'='*60}")
    print(f"Done: {success} succeeded, {fail} failed out of {len(targets)} books")


if __name__ == "__main__":
    main()
