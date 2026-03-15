"""
Three-phase prompt pipeline for Gemini API book summarization.

Phase 1: Deep Analysis — extract thesis, conflicts, frameworks, data points
Phase 2: Slide Outline — narrative sequence with slide types and headlines
Phase 3: Slide Content — full slide JSON with all fields populated

Quality-aware: full books get deep analysis, partials get condensed treatment.
"""

SLIDE_TYPES_SPEC = """
Slide types and their required fields:

EXISTING TYPES:
1. "title" — title, subtitle, content (author name)
2. "overview" — title (a provocative hook, NOT "The Big Idea"), content (hook paragraph), stats (array of {label, value})
3. "takeaway" — number (1-based), title, content, icon (Lucide icon name), quote (optional supporting quote at bottom)
4. "quote" — quote (the quote text), attribution (author name), context (optional setup paragraph above quote)
5. "audience" — title ("Who Should Read This"), items (array of short bullets)
6. "rating" — rating (1-5 integer), verdict (1-2 sentence assessment)
7. "chapter-map" — title ("Chapter Map"), chapters (array of {title, description})
8. "key-stat" — title (section label), dataPoints (array of {value, label, context?}) — use for 1-3 numbers

NEW TYPES:
9. "comparison" — title (provocative headline), leftColumn ({heading, points[]}), rightColumn ({heading, points[]})
   Use for: conventional wisdom vs book's argument, old approach vs new approach
10. "framework" — title (headline), frameworkName (name of the model), quadrants (array of {label, description})
    Use for: named models, 2x2 grids, multi-part frameworks the book introduces
11. "data-cascade" — title (headline), dataPoints (array of {value, label, context?})
    Use for: cascading numbers that tell a story (e.g., "1M → 80K → 400 → 12")
12. "hierarchy" — title (headline), tiers (array of {level: number, label, description})
    Use for: pyramids, stacked rankings, layered concepts. Level 1 = top/most important.
13. "process" — title (headline), stages (array of {label, description})
    Use for: timelines, causal chains, step-by-step methods (3-6 stages)
14. "argument" — title (headline), thesis (the claim), counterpoint (the objection), evidence (how the book resolves it)
    Use for: thesis + counter-argument + resolution, "False Exit" patterns, myth-busting
15. "action" — title (headline), steps (array of {step, example?})
    Use for: numbered actionable steps with concrete examples
"""

ICON_LIST = """
Use these Lucide React icon names for takeaway icons:
Brain, Target, TrendingUp, Heart, Lightbulb, Scale, Puzzle, Route,
Settings, User, Users, List, Layout, BookOpen, Sparkles, Zap,
Shield, Lock, Eye, Compass, Map, Clock, Star, Award, Flag,
Rocket, Globe, Layers, GitBranch, RefreshCw, CheckCircle,
AlertTriangle, Dna, Dice5, ClipboardList, BarChart, PieChart
"""

ANTI_SLOP_RULES = """
WRITING RULES (violating these makes the output worthless):
- Write like a sharp magazine editor. No filler phrases. Every sentence must earn its place.
- NEVER use "Key Takeaway" or "Key Insight" as a heading. Every headline should make the reader stop scrolling.
- NEVER use "Title: Subtitle" format for headlines. Use bold assertions instead.
- NEVER use these cliche phrases: "game-changer", "deep dive", "unpacks", "explores", "in today's world", "at its core", "it turns out", "the power of"
- Use direct, confident, active language. Not "The author argues that..." but state the argument directly.
- Slide titles must be PROVOCATIVE ASSERTIONS, not labels. "Talent Can't Be Taught" not "Understanding Talent".
- Each slide tells a micro-story. There must be tension, surprise, or a specific insight — never just a restated fact.
- Use SPECIFIC examples, data, and named studies from the book. Generic summaries are worthless.

CONCISENESS RULES:
- NEVER write "the chapter explains", "the author discusses", "this section covers", or any meta-commentary about the book's structure. Extract the INSIGHTS DIRECTLY.
- BAD: "The chapter explains how habits work through a loop of cue, routine, and reward."
- GOOD: "Habits run on a loop: cue → routine → reward. Change the routine, keep the cue and reward."
- State findings as facts, not as descriptions of what the book says. You are extracting knowledge, not writing a book report.
- Every bullet, description, and content field should be 1-2 sentences max. If you need more, the insight isn't sharp enough.
- Cover ALL chapters and major sections of the book. Do not stop at the first half.
"""


def get_analysis_prompt(title: str, author: str, content: str, quality: str) -> str:
    """Phase 1: Deep analysis — extract structured insights from the book."""

    quality_instruction = {
        "full": f"""This is the FULL text of "{title}" by {author}. You have the complete book.
Analyze it deeply — find the real arguments, the surprising data, the specific studies and examples.
Pull exact quotes. Identify where the author challenges conventional wisdom.""",

        "partial": f"""This is a PARTIAL summary/notes version of "{title}" by {author}.
You have key points and excerpts but not the full text. Extract everything available —
especially specific examples, data points, named studies, and direct quotes.""",

        "blurb": f"""This is a brief BLURB of "{title}" by {author}.
You have limited content. Use your knowledge of this book to supplement.
Focus on the book's most counter-intuitive claims and specific frameworks.""",
    }

    max_chars = {"full": 800_000, "partial": 100_000, "blurb": 8_000}
    truncated = content[:max_chars.get(quality, 100_000)]

    return f"""You are a book analyst preparing raw material for an infographic designer.
Your job is to extract the REAL substance of this book — not generic summaries.

{quality_instruction.get(quality, quality_instruction["partial"])}

{ANTI_SLOP_RULES}

Analyze the content and produce a JSON object with this exact structure:

{{
  "title": "exact book title",
  "author": "author name",
  "category": "one of: Business, Self-Help, Science, Psychology, Leadership, Technology, Philosophy, History, Fiction, Biography, Economics, Health, Creativity, Communication, Productivity",
  "oneLiner": "One punchy sentence that hooks a reader — the book's boldest claim or most surprising insight. NOT a description of the book.",
  "coreThesis": "The book's central argument in one bold sentence. Not a description of what the book is about — the actual CLAIM it makes.",
  "narrativeArc": [
    {{
      "beat": "setup|tension|insight|evidence|twist|resolution",
      "summary": "What happens at this story beat — what does the reader learn or feel?"
    }}
  ],
  "keyConflicts": [
    {{
      "conventional": "What most people believe",
      "bookArgument": "What the book argues instead",
      "evidence": "The specific evidence the book uses"
    }}
  ],
  "frameworks": [
    {{
      "name": "The name the author gives this model/framework",
      "components": ["component 1", "component 2", "..."],
      "description": "One sentence on what this framework explains"
    }}
  ],
  "dataPoints": [
    {{
      "value": "the number or statistic",
      "label": "what it measures",
      "context": "why it's surprising or important",
      "source": "study name or chapter reference if available"
    }}
  ],
  "hierarchies": [
    {{
      "name": "What this ranking/hierarchy represents",
      "tiers": ["top tier", "second tier", "..."],
      "description": "Why the ordering matters"
    }}
  ],
  "processes": [
    {{
      "name": "Name of this method or causal chain",
      "steps": ["step 1", "step 2", "..."],
      "description": "What this process achieves"
    }}
  ],
  "provocativeInsights": [
    {{
      "claim": "A counter-intuitive assertion from the book",
      "evidence": "How the book supports it",
      "whyItMatters": "Why the reader should care"
    }}
  ],
  "bestQuotes": [
    {{
      "quote": "Exact quote from the book",
      "context": "Where and why this quote appears",
      "narrativeUse": "How this quote could work in a slide (as a hook, as evidence, as a closer)"
    }}
  ],
  "keyTakeaways": [
    {{
      "title": "Provocative assertion (NOT 'Key Takeaway 1')",
      "description": "1-2 sentence explanation with a specific example or data point",
      "icon": "LucideIconName"
    }}
  ],
  "notableQuotes": [
    {{
      "quote": "Exact quote from the book",
      "context": "One sentence on where/why this quote matters"
    }}
  ],
  "actionableSteps": [
    {{
      "step": "A concrete action the reader can take",
      "example": "Specific example from the book"
    }}
  ],
  "whoShouldRead": ["audience description 1", "audience description 2"],
  "rating": 4,
  "verdict": "1-2 sentence assessment — what makes this book worth (or not worth) reading"
}}

Guidelines:
- coreThesis: ONE bold sentence. Not "This book is about X" but the actual claim.
- narrativeArc: 4-6 beats that capture the book's argument structure
- keyConflicts: 2-4 items. The BEST conventional-vs-book contrasts.
- frameworks: 1-3 items. Only named frameworks the author actually introduces. Empty array if none.
- dataPoints: 3-6 items. Specific numbers, percentages, study results. Empty array if the book has none.
- hierarchies: 0-2 items. Only if the book has ranked/layered concepts.
- processes: 0-2 items. Only if the book describes step-by-step methods.
- provocativeInsights: 3-5 items. The claims that would make someone argue with you at a dinner party.
- bestQuotes: 3-5 items. Real quotes from the text when available.
- keyTakeaways: 5-7 items. Each with a provocative title, concise description, and Lucide icon name.
- notableQuotes: 3-5 items. Exact quotes with one-sentence context.
- actionableSteps: 3-5 items. Concrete actions with specific examples.
- whoShouldRead: 4-5 items.
- oneLiner: ONE sentence. A hook, not a description. "X does Y" not "This book is about X".
- rating: integer 1-5.

{ICON_LIST}

IMPORTANT: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanation.

Book content:
{truncated}"""


def get_outline_prompt(title: str, author: str, analysis_json: str) -> str:
    """Phase 2: Slide outline — narrative sequence with types and headlines."""

    return f"""You are a visual storytelling editor creating the narrative structure for a book summary carousel.

Book: "{title}" by {author}

You have this deep analysis:
{analysis_json}

{SLIDE_TYPES_SPEC}

{ANTI_SLOP_RULES}

Create an ordered array of 12-16 slide descriptors. Each slide must have:
- "type": one of the slide types above
- "narrativeRole": why this slide exists in the sequence (one of: hook, context, tension, evidence, framework, contrast, data, insight, twist, action, resolution, closer)
- "headline": a PROVOCATIVE ASSERTION that makes the reader stop scrolling. Not a label.
- "contentBrief": 2-3 sentences describing exactly what content goes on this slide. Reference specific data, quotes, or examples from the analysis.
- "sourceField": which field from the analysis this slide draws from (e.g., "keyConflicts[0]", "frameworks[0]", "dataPoints", "provocativeInsights[2]")

SEQUENCE RULES:
1. ALWAYS start with a "title" slide
2. Second slide should be "overview" — hook the reader with the book's boldest claim
3. Mix slide types for variety — never use the same type twice in a row
4. Use "comparison" and "argument" slides for the book's key conflicts
5. Use "framework" slides only when the book has a named framework
6. Use "data-cascade" when there are multiple related numbers that tell a cascading story
7. Use "process" for step-by-step methods the book teaches
8. Use "hierarchy" for ranked or layered concepts
9. Use "action" near the end — give the reader something to DO
10. End with "rating" slide (always last)
11. Sprinkle "quote" slides between heavier content slides for breathing room
12. Every slide MUST reference specific content from the analysis — no generic filler

Target: 12-16 slides. Use AT LEAST 3 of the new types (comparison, framework, data-cascade, hierarchy, process, argument, action) where the analysis supports them.

IMPORTANT: Return ONLY a valid JSON array. No markdown, no code blocks, no explanation.

Example format:
[
  {{"type": "title", "narrativeRole": "hook", "headline": "Book Title", "contentBrief": "Title slide with author name", "sourceField": "title"}},
  {{"type": "overview", "narrativeRole": "context", "headline": "The Bold Claim", "contentBrief": "Hook paragraph using coreThesis...", "sourceField": "coreThesis"}},
  ...
]"""


def get_slides_prompt(title: str, author: str, analysis_json: str, outline_json: str) -> str:
    """Phase 3: Full slide content from analysis + outline."""

    return f"""You are creating the final slide content for a visual book summary platform.

Book: "{title}" by {author}

Deep analysis:
{analysis_json}

Slide outline to follow:
{outline_json}

{SLIDE_TYPES_SPEC}

{ICON_LIST}

{ANTI_SLOP_RULES}

Generate the final slides array. Follow the outline EXACTLY — same order, same types, same headlines.
For each slide, populate ALL required fields for its type.

FIELD RULES PER TYPE:
- "title": {{"type": "title", "title": "Book Title", "subtitle": "tagline", "content": "Author Name"}}
- "overview": {{"type": "overview", "title": "Provocative Hook", "content": "paragraph", "stats": [{{"label": "...", "value": "..."}}]}}
- "takeaway": {{"type": "takeaway", "number": 1, "title": "Assertion", "content": "explanation", "icon": "LucideIcon", "quote": "optional supporting quote"}}
- "quote": {{"type": "quote", "quote": "the quote", "attribution": "Author", "context": "optional setup paragraph"}}
- "audience": {{"type": "audience", "title": "Who Should Read This", "items": ["..."]}}
- "rating": {{"type": "rating", "rating": 4, "verdict": "assessment"}}
- "chapter-map": {{"type": "chapter-map", "title": "Chapter Map", "chapters": [{{"title": "...", "description": "..."}}]}}
- "key-stat": {{"type": "key-stat", "title": "Section Label", "dataPoints": [{{"value": "42%", "label": "what it measures", "context": "why it matters"}}]}}
- "comparison": {{"type": "comparison", "title": "Provocative Headline", "leftColumn": {{"heading": "Old Way", "points": ["..."]}}, "rightColumn": {{"heading": "New Way", "points": ["..."]}}}}
- "framework": {{"type": "framework", "title": "Headline", "frameworkName": "The Model Name", "quadrants": [{{"label": "Part 1", "description": "..."}}]}}
- "data-cascade": {{"type": "data-cascade", "title": "Headline", "dataPoints": [{{"value": "1M", "label": "...", "context": "..."}}]}}
- "hierarchy": {{"type": "hierarchy", "title": "Headline", "tiers": [{{"level": 1, "label": "Top", "description": "..."}}]}}
- "process": {{"type": "process", "title": "Headline", "stages": [{{"label": "Stage 1", "description": "..."}}]}}
- "argument": {{"type": "argument", "title": "Headline", "thesis": "the claim", "counterpoint": "the objection", "evidence": "the resolution"}}
- "action": {{"type": "action", "title": "Headline", "steps": [{{"step": "Do this", "example": "Like this..."}}]}}

QUALITY CHECKS:
- Every comparison slide must have real contrasts from the analysis, not vague generalities
- Every data-cascade must use real numbers from the analysis
- Every framework must reference a named framework from the book
- Every argument must have a real counter-argument, not a strawman
- Every action step must have a concrete example
- Quote slides should set up the quote with context when available
- Takeaway slides can include a supporting quote at the bottom

IMPORTANT: Return ONLY a valid JSON array of slide objects. No markdown, no code blocks, no explanation."""
