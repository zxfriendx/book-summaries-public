'use client';

import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import type { ExportFormat } from '@/lib/types';
import { EXPORT_FORMATS } from '@/lib/types';
import { generateFilename, generateZipFilename } from '@/lib/export-utils';

/** Wait for all <img> elements inside a container to finish loading */
async function waitForImages(container: HTMLElement, timeoutMs = 5000): Promise<void> {
  const images = container.querySelectorAll('img');
  if (images.length === 0) return;

  const promises = Array.from(images).map((img) => {
    if (img.complete && img.naturalHeight > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // don't block on broken images
    });
  });

  await Promise.race([
    Promise.all(promises),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

async function captureSlide(slideElement: HTMLElement, dims: { width: number; height: number }): Promise<Blob> {
  // Detect actual background color from the slide element
  const computedBg = window.getComputedStyle(slideElement).backgroundColor;

  const canvas = await html2canvas(slideElement, {
    width: dims.width,
    height: dims.height,
    scale: 2,
    backgroundColor: computedBg || null,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png', 1.0)
  );
}

export async function exportSlideAsPng(
  slideElement: HTMLElement,
  bookTitle: string,
  slideIndex: number,
  format: ExportFormat
): Promise<void> {
  const dims = EXPORT_FORMATS[format];

  await waitForImages(slideElement);
  const blob = await captureSlide(slideElement, dims);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = generateFilename(bookTitle, slideIndex, format);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAllSlidesAsZip(
  slideElements: HTMLElement[],
  bookTitle: string,
  format: ExportFormat
): Promise<void> {
  const dims = EXPORT_FORMATS[format];
  const zip = new JSZip();

  for (let i = 0; i < slideElements.length; i++) {
    await waitForImages(slideElements[i]);
    const blob = await captureSlide(slideElements[i], dims);
    zip.file(generateFilename(bookTitle, i, format), blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = generateZipFilename(bookTitle, format);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
