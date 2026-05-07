// Fetches a direct audio stream URL from YouTube's internal Innertube API.
// No IFrame API → no ad server involvement → completely ad-free playback.
// Stream URLs expire after ~6 hours, which is fine for song-length playback.

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player';

// ANDROID_TESTSUITE client returns unencrypted stream URLs — no cipher needed.
const BODY_BASE = {
  context: {
    client: {
      clientName: 'ANDROID_TESTSUITE',
      clientVersion: '1.9',
      androidSdkVersion: 30,
      hl: 'en',
      gl: 'US',
      utcOffsetMinutes: 0,
    },
  },
};

const HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'com.google.android.youtube/17.31.35(Linux; U; Android 11) gzip',
};

function pickBestAudio(formats: any[]): string | null {
  const audio = formats.filter(
    (f) => f.url && typeof f.mimeType === 'string' && f.mimeType.startsWith('audio/'),
  );
  if (!audio.length) return null;
  // Prefer m4a (AAC) for widest device support, then any audio, highest bitrate first.
  const m4a = audio.filter((f) => f.mimeType.includes('mp4'));
  const pool = m4a.length ? m4a : audio;
  pool.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
  return pool[0].url;
}

export async function getAudioStreamUrl(videoId: string): Promise<string> {
  const res = await fetch(INNERTUBE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ ...BODY_BASE, videoId }),
  });

  if (!res.ok) throw new Error(`Innertube HTTP ${res.status}`);

  const data = await res.json();

  if (data.playabilityStatus?.status === 'UNPLAYABLE') {
    throw new Error(data.playabilityStatus?.reason ?? 'Video unplayable');
  }

  const formats = [
    ...(data.streamingData?.adaptiveFormats ?? []),
    ...(data.streamingData?.formats ?? []),
  ];

  const url = pickBestAudio(formats);
  if (!url) throw new Error('No audio stream found');
  return url;
}
