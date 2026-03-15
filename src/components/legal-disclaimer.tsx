export function AffiliateDisclosure() {
  return (
    <p className="text-xs text-muted-foreground/60">
      As an Amazon Associate, I earn from qualifying purchases.
    </p>
  );
}

export function LegalDisclaimer() {
  return (
    <div className="text-xs text-muted-foreground/60 space-y-1">
      <p>
        These summaries contain original analysis and are not substitutes for the original works.
        All book titles and author names are property of their respective owners.
      </p>
      <AffiliateDisclosure />
    </div>
  );
}
