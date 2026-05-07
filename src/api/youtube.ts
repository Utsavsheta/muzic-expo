import type { YTPlaylist, YTVideo } from '../types';

export const API_KEYS = [
  'AIzaSyCaONHLkL5lH2O2iLa33ebGeIPW0ebUc6Q',
  // Add more Google API keys here.
];

const BASE_URL = 'https://www.googleapis.com/youtube/v3';
let activeKeyIndex = 0;

export class ApiKeyExhaustedError extends Error {
  constructor() {
    super('ADD_MORE_TOKENS');
  }
}

async function fetchYoutube(endpoint: string, params: Record<string, string>): Promise<any> {
  if (activeKeyIndex >= API_KEYS.length) throw new ApiKeyExhaustedError();

  const query = new URLSearchParams({ ...params, key: API_KEYS[activeKeyIndex] });
  const response = await fetch(`${BASE_URL}${endpoint}?${query.toString()}`);

  if (response.status === 403) {
    const body = await response.json().catch(() => null);
    const reasons = body?.error?.errors?.map((e: any) => e.reason) || [];
    if (reasons.includes('quotaExceeded') || reasons.includes('dailyLimitExceeded')) {
      activeKeyIndex += 1;
      return fetchYoutube(endpoint, params);
    }
    throw new Error(body?.error?.message || 'YouTube request forbidden');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || `YouTube API error ${response.status}`);
  }

  return response.json();
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function mapVideos(items: any[]): YTVideo[] {
  return (items || []).map((item) => {
    const duration = parseDuration(item.contentDetails?.duration || 'PT0S');
    return {
      id: item.id,
      videoId: item.id,
      title: item.snippet?.title || 'Unknown',
      channelTitle: item.snippet?.channelTitle || 'Unknown',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      thumbnailHigh: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
      duration,
      durationFormatted: formatDuration(duration),
      publishedAt: item.snippet?.publishedAt || '',
    };
  });
}

async function fetchVideoDetails(videoIds: string): Promise<YTVideo[]> {
  if (!videoIds) return [];
  const data = await fetchYoutube('/videos', {
    part: 'contentDetails,snippet,status',
    id: videoIds,
  });
  // Drop videos the owner has blocked from embedding (causes error 150/152)
  const embeddable = (data.items || []).filter((item: any) => item.status?.embeddable !== false);
  return mapVideos(embeddable);
}

export interface PaginatedVideos {
  videos: YTVideo[];
  nextPageToken: string | null;
}

export interface PaginatedPlaylists {
  playlists: YTPlaylist[];
  nextPageToken: string | null;
}

export async function fetchTrendingMusic(maxResults = 12, pageToken?: string): Promise<PaginatedVideos> {
  const data = await fetchYoutube('/videos', {
    part: 'snippet,contentDetails,status',
    chart: 'mostPopular',
    videoCategoryId: '10',
    regionCode: 'US',
    maxResults: String(maxResults),
    ...(pageToken ? { pageToken } : {}),
  });
  const embeddable = (data.items || []).filter((item: any) => item.status?.embeddable !== false);
  return { videos: mapVideos(embeddable), nextPageToken: data.nextPageToken || null };
}

export async function searchVideos(query: string, maxResults = 12, pageToken?: string): Promise<PaginatedVideos> {
  const data = await fetchYoutube('/search', {
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    videoEmbeddable: 'true',
    q: query,
    maxResults: String(maxResults),
    ...(pageToken ? { pageToken } : {}),
  });
  const ids = data.items?.map((item: any) => item.id?.videoId).filter(Boolean).join(',');
  return { videos: await fetchVideoDetails(ids), nextPageToken: data.nextPageToken || null };
}

export async function searchPlaylists(query: string, maxResults = 8, pageToken?: string): Promise<PaginatedPlaylists> {
  const data = await fetchYoutube('/search', {
    part: 'snippet',
    type: 'playlist',
    q: `${query} music`,
    maxResults: String(maxResults),
    ...(pageToken ? { pageToken } : {}),
  });

  const ids = data.items?.map((item: any) => item.id?.playlistId).filter(Boolean).join(',');
  if (!ids) return { playlists: [], nextPageToken: null };

  const details = await fetchYoutube('/playlists', {
    part: 'snippet,contentDetails',
    id: ids,
  });

  return {
    playlists: (details.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet?.title || 'Unknown',
      channelTitle: item.snippet?.channelTitle || 'Unknown',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      thumbnailHigh: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
      itemCount: item.contentDetails?.itemCount || 0,
      description: item.snippet?.description || '',
    })),
    nextPageToken: data.nextPageToken || null,
  };
}

export async function fetchPlaylistItems(playlistId: string, maxResults = 20, pageToken?: string): Promise<PaginatedVideos> {
  const data = await fetchYoutube('/playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: String(maxResults),
    ...(pageToken ? { pageToken } : {}),
  });
  const ids = data.items?.map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId).filter(Boolean).join(',');
  return { videos: await fetchVideoDetails(ids), nextPageToken: data.nextPageToken || null };
}

export async function fetchPopularPlaylists(): Promise<YTPlaylist[]> {
  const result = await searchPlaylists('Top Hits 2025', 8);
  return result.playlists;
}