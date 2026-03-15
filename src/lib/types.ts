export type SlideType =
  | 'title'
  | 'overview'
  | 'takeaway'
  | 'quote'
  | 'audience'
  | 'rating'
  | 'chapter-map'
  | 'key-stat'
  | 'comparison'
  | 'framework'
  | 'data-cascade'
  | 'hierarchy'
  | 'process'
  | 'argument'
  | 'action';

export type SlideTheme = 'light' | 'dark';

export interface Slide {
  type: SlideType;
  theme?: SlideTheme;
  title?: string;
  subtitle?: string;
  content?: string;
  items?: string[];
  icon?: string;
  quote?: string;
  attribution?: string;
  number?: number;
  label?: string;
  context?: string;
  rating?: number;
  verdict?: string;
  bottomStatement?: string;
  illustration?: string; // path to generated image
  chapters?: { title: string; description: string }[];
  stats?: { label: string; value: string }[];
  // comparison
  leftColumn?: { heading: string; points: string[] };
  rightColumn?: { heading: string; points: string[] };
  // framework
  quadrants?: { label: string; description: string }[];
  frameworkName?: string;
  // data-cascade + key-stat multi-point
  dataPoints?: { value: string; label: string; context?: string }[];
  // hierarchy
  tiers?: { level: number; label: string; description: string }[];
  // process
  stages?: { label: string; description: string }[];
  // argument
  thesis?: string;
  counterpoint?: string;
  evidence?: string;
  // action
  steps?: { step: string; example?: string }[];
}

export interface BookSummary {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  isbn?: string;
  coverImage?: string;
  oneLiner: string;
  keyTakeaways: {
    title: string;
    description: string;
    icon: string;
  }[];
  notableQuotes: {
    quote: string;
    context?: string;
  }[];
  whoShouldRead: string[];
  slides: Slide[];
  rating?: number;
  verdict?: string;
  contentQuality: 'full' | 'partial' | 'blurb';
  chapters?: Array<{
    number: number;
    title: string;
    keyIdeas: string[];
    memorableInsight?: string;
    quote?: { text: string; context?: string };
    detailedSummary?: string;
  }>;
}

export interface BooksData {
  books: BookSummary[];
  generatedAt: string;
  version: string;
}

export type ExportFormat = 'instagram-carousel' | 'instagram-square' | 'instagram-story' | 'linkedin';

export interface ExportDimensions {
  width: number;
  height: number;
  label: string;
}

export const EXPORT_FORMATS: Record<ExportFormat, ExportDimensions> = {
  'instagram-carousel': { width: 1080, height: 1350, label: 'Instagram Carousel (4:5)' },
  'instagram-square': { width: 1080, height: 1080, label: 'Instagram Square (1:1)' },
  'instagram-story': { width: 1080, height: 1920, label: 'Instagram Story (9:16)' },
  'linkedin': { width: 1080, height: 1350, label: 'LinkedIn (4:5)' },
};
