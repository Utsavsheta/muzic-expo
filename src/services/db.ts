import AsyncStorage from '@react-native-async-storage/async-storage';
import type { YTVideo } from '../types';

export interface UserPlaylist {
  id: string;
  name: string;
  songs: YTVideo[];
  createdAt: number;
}

interface AppData {
  likedSongs: YTVideo[];
  playlists: UserPlaylist[];
}

const DB_KEY = 'yt_music_player_expo_v1';

async function getData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (!raw) return { likedSongs: [], playlists: [] };
    const parsed = JSON.parse(raw);
    return {
      likedSongs: Array.isArray(parsed.likedSongs) ? parsed.likedSongs : [],
      playlists: Array.isArray(parsed.playlists)
        ? parsed.playlists.map((p: any) => ({ ...p, songs: Array.isArray(p.songs) ? p.songs : [] }))
        : [],
    };
  } catch {
    return { likedSongs: [], playlists: [] };
  }
}

async function saveData(data: AppData) {
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(data));
}

export async function fetchLikedSongs(): Promise<YTVideo[]> {
  return (await getData()).likedSongs;
}

export async function toggleLike(video: YTVideo): Promise<YTVideo[]> {
  const data = await getData();
  const index = data.likedSongs.findIndex((song) => song.videoId === video.videoId);
  if (index >= 0) data.likedSongs.splice(index, 1);
  else data.likedSongs.unshift(video);
  await saveData(data);
  return data.likedSongs;
}

export async function fetchPlaylists(): Promise<UserPlaylist[]> {
  return (await getData()).playlists;
}

export async function createPlaylist(name: string): Promise<UserPlaylist> {
  const data = await getData();
  const playlist: UserPlaylist = {
    id: `pl_${Date.now()}`,
    name,
    songs: [],
    createdAt: Date.now(),
  };
  data.playlists.push(playlist);
  await saveData(data);
  return playlist;
}

export async function deletePlaylist(id: string): Promise<UserPlaylist[]> {
  const data = await getData();
  data.playlists = data.playlists.filter((playlist) => playlist.id !== id);
  await saveData(data);
  return data.playlists;
}

export async function addSongToPlaylist(playlistId: string, video: YTVideo): Promise<UserPlaylist[]> {
  const data = await getData();
  const playlist = data.playlists.find((item) => item.id === playlistId);
  if (playlist && !playlist.songs.some((song) => song.videoId === video.videoId)) {
    playlist.songs.push(video);
  }
  await saveData(data);
  return data.playlists;
}

export async function removeSongFromPlaylist(playlistId: string, videoId: string): Promise<UserPlaylist[]> {
  const data = await getData();
  const playlist = data.playlists.find((item) => item.id === playlistId);
  if (playlist) playlist.songs = playlist.songs.filter((song) => song.videoId !== videoId);
  await saveData(data);
  return data.playlists;
}