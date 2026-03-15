#!/usr/bin/env python3
"""Unified pipeline: drop markdown files into input/, run this script, get a built site.

Steps:
1. Detect chapters in each markdown file
2. Summarize chapters via Gemini 2.5 Flash
3. Generate/update books.json
4. Fetch cover images from Open Library

Requires: GEMINI_API_KEY environment variable

Usage:
    python scripts/process_books.py                    # Process all new files in input/
    python scripts/process_books.py --books "Title"    # Process specific book(s)
    python scripts/process_books.py --detect-only      # Detect chapters without summarizing
"""

import argparse
import os
import sys
from pathlib import Path

# Add scripts dir to path
SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))


def main():
    parser = argparse.ArgumentParser(description='Process books end-to-end')
    parser.add_argument('--books', nargs='+', help='Specific book titles to process')
    parser.add_argument('--detect-only', action='store_true', help='Only detect chapters (no Gemini API calls)')
    parser.add_argument('--skip-covers', action='store_true', help='Skip cover image fetching')
    parser.add_argument('--force', action='store_true', help='Re-process books that already have chapters')
    args = parser.parse_args()

    input_dir = PROJECT_ROOT / 'input'

    # Ensure input directory exists
    if not input_dir.exists():
        input_dir.mkdir()
        print(f'Created {input_dir}/')
        print('Drop markdown (.md) files into this directory, then run again.')
        return

    md_files = list(input_dir.glob('*.md'))
    if not md_files:
        print(f'No markdown files found in {input_dir}/')
        print('Drop markdown (.md) files into this directory, then run again.')
        return

    if not args.detect_only and not os.environ.get('GEMINI_API_KEY'):
        print('Error: GEMINI_API_KEY environment variable is required for summarization.')
        print('Get one at https://aistudio.google.com/apikey')
        print('Or use --detect-only to just detect chapters without summarizing.')
        sys.exit(1)

    print(f'Found {len(md_files)} markdown file(s) in input/')
    for f in md_files:
        print(f'  - {f.name}')

    # Step 1: Chapter detection + summarization
    print('\n=== Step 1: Chapter Detection & Summarization ===')

    # Build sys.argv for chapter_pipeline's argparse
    pipeline_argv = ['chapter_pipeline.py']
    if args.detect_only:
        if args.books:
            pipeline_argv.extend(['--detect', args.books[0]])
        else:
            pipeline_argv.append('--detect-all')
    elif args.books:
        pipeline_argv.extend(['--books'] + args.books)
    else:
        pipeline_argv.append('--all')
    if args.force:
        pipeline_argv.append('--force')

    old_argv = sys.argv
    sys.argv = pipeline_argv
    try:
        from chapter_pipeline import main as pipeline_main
        pipeline_main()
    except SystemExit as e:
        if e.code != 0:
            print(f'Chapter pipeline exited with code {e.code}')
    except Exception as e:
        print(f'Chapter pipeline error: {e}')
        import traceback
        traceback.print_exc()
    finally:
        sys.argv = old_argv

    # Step 2: Fetch covers
    if not args.skip_covers and not args.detect_only:
        print('\n=== Step 2: Fetch Cover Images ===')
        try:
            sys.path.insert(0, str(SCRIPTS_DIR / 'summarize'))
            from cover_fetcher import main as cover_main
            cover_main()
        except ImportError:
            print('Warning: cover_fetcher.py not available. Skipping covers.')
        except Exception as e:
            print(f'Warning: Cover fetching error: {e}')

    print('\n=== Done! ===')
    print('Run `npm run build` to generate the static site in out/')


if __name__ == '__main__':
    main()
