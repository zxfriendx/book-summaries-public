const AMAZON_ASSOCIATE_ID = 'atmavailabi08-20';

export function getAmazonSearchUrl(title: string, author: string): string {
  const query = `${title} ${author}`;
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_ASSOCIATE_ID}`;
}
