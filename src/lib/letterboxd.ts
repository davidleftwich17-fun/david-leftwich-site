import { XMLParser } from 'fast-xml-parser';

export interface Film {
  title: string;
  year: number;
  rating: number;
  watchedDate: string;
  posterUrl: string;
  reviewUrl: string;
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  'letterboxd:filmTitle': string;
  'letterboxd:filmYear': string;
  'letterboxd:memberRating'?: string;
  'letterboxd:watchedDate': string;
  'tmdb:movieId'?: string;
}

function extractPosterUrl(description: string): string {
  const match = description.match(/src="([^"]+)"/);
  return match ? match[1] : '';
}

export async function getLetterboxdFilms(username: string): Promise<Film[]> {
  try {
    const response = await fetch(`https://letterboxd.com/${username}/rss/`);

    if (!response.ok) {
      console.error(`Failed to fetch Letterboxd RSS: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const result = parser.parse(xmlText);
    const items: RSSItem[] = result?.rss?.channel?.item || [];

    if (!Array.isArray(items)) {
      return items ? [items].map(parseItem) : [];
    }

    return items.map(parseItem);
  } catch (error) {
    console.error('Error fetching Letterboxd data:', error);
    return [];
  }
}

function parseItem(item: RSSItem): Film {
  return {
    title: item['letterboxd:filmTitle'] || extractTitleFromRSS(item.title),
    year: parseInt(item['letterboxd:filmYear'] || '0', 10),
    rating: parseFloat(item['letterboxd:memberRating'] || '0'),
    watchedDate: item['letterboxd:watchedDate'] || '',
    posterUrl: extractPosterUrl(item.description || ''),
    reviewUrl: item.link || '',
  };
}

function extractTitleFromRSS(rssTitle: string): string {
  // RSS title format: "Film Title, Year - ★★★★"
  const match = rssTitle.match(/^(.+?),\s*\d{4}/);
  return match ? match[1] : rssTitle;
}
