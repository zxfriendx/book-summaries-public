'use client';

import { useState } from 'react';
import { Download, Image, Package } from 'lucide-react';
import type { ExportFormat } from '@/lib/types';
import { EXPORT_FORMATS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ExportPanelProps {
  onExportSingle: (format: ExportFormat) => void;
  onExportAll: (format: ExportFormat) => void;
  slideCount: number;
  currentSlide: number;
  isExporting?: boolean;
}

export function ExportPanel({
  onExportSingle,
  onExportAll,
  slideCount,
  currentSlide,
  isExporting,
}: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('instagram-carousel');

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <Download className="w-4 h-4" />
        Export Slides
      </h3>

      {/* Format picker */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(Object.entries(EXPORT_FORMATS) as [ExportFormat, { label: string; width: number; height: number }][]).map(
          ([key, value]) => (
            <button
              key={key}
              onClick={() => setFormat(key)}
              className={cn(
                'text-xs py-2 px-3 rounded-lg border transition-colors text-left',
                key === format
                  ? 'border-french-blue bg-french-blue/10 text-french-blue'
                  : 'border-border text-muted-foreground hover:border-french-blue/30'
              )}
            >
              <div className="font-medium">{value.label.split('(')[0].trim()}</div>
              <div className="opacity-60">{value.width}x{value.height}</div>
            </button>
          )
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onExportSingle(format)}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-french-blue text-white text-sm font-medium hover:bg-french-blue/90 disabled:opacity-50 transition-colors"
        >
          <Image className="w-4 h-4" />
          {isExporting ? 'Exporting...' : `Export Slide ${currentSlide + 1}`}
        </button>
        <button
          onClick={() => onExportAll(format)}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-french-blue text-french-blue text-sm font-medium hover:bg-french-blue/5 disabled:opacity-50 transition-colors"
        >
          <Package className="w-4 h-4" />
          {isExporting ? 'Packaging...' : `Export All ${slideCount} Slides (ZIP)`}
        </button>
      </div>
    </div>
  );
}
