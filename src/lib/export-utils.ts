import type { ExportFormat, ExportDimensions } from './types';
import { EXPORT_FORMATS } from './types';

export function getExportDimensions(format: ExportFormat): ExportDimensions {
  return EXPORT_FORMATS[format];
}

export function getSlideAspectRatio(format: ExportFormat): string {
  const dims = EXPORT_FORMATS[format];
  return `${dims.width} / ${dims.height}`;
}

export function generateFilename(bookTitle: string, slideIndex: number, format: ExportFormat): string {
  const slug = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  const dims = EXPORT_FORMATS[format];
  return `${slug}-slide-${String(slideIndex + 1).padStart(2, '0')}-${dims.width}x${dims.height}.png`;
}

export function generateZipFilename(bookTitle: string, format: ExportFormat): string {
  const slug = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  const dims = EXPORT_FORMATS[format];
  return `${slug}-slides-${dims.width}x${dims.height}.zip`;
}
