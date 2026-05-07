import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as DB from '../services/db';
import type { UserPlaylist } from '../services/db';
import {
  fetchPlaylistItems,
  fetchPopularPlaylists,
  fetchTrendingMusic,
  searchPlaylists,
  searchVideos,
} from '../api/youtube';
import type { RepeatMode, ViewMode, YTPlaylist, YTVideo } from '../types';

type PlayerMessage = { type: string; payload?: any };

type MusicContextType = {
  ready: boolean;
  queue: YTVideo[];
  currentIndex: number;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
  repeat: RepeatMode;
  shuffle: boolean;
  view: ViewMode;
  query: string;
  searchTab: 'songs' | 'playlists';
  loading: boolean;
  loadingMore: boolean;
  toast: string;
  trending: YTVideo[];
  popularPlaylists: YTPlaylist[];
  searchSongs: YTVideo[];
  searchPls: YTPlaylist[];
  playlistSongs: YTVideo[];
  activePlaylist: YTPlaylist | null;
  activeUserPlaylist: UserPlaylist | null;
  likedSongs: YTVideo[];
  userPlaylists: UserPlaylist[];
  current: YTVideo | null;
  shownPlaylistSongs: YTVideo[];
  setView: (v: ViewMode) => void;
  setQuery: (q: string) => void;
  setSearchTab: (tab: 'songs' | 'playlists') => void;
  setVolume: (v: number) => void;
  setRepeat: (r: RepeatMode) => void;
  setShuffle: (v: boolean) => void;
  runSearch: () => Promise<void>;
  openPlaylist: (playlist: YTPlaylist) => Promise<void>;
  openUserPlaylist: (playlist: UserPlaylist) => void;
  openLiked: () => void;
  loadMoreContent: () => Promise<void>;
  playTrack: (track: YTVideo, sourceList?: YTVideo[]) => void;
  playList: (songs: YTVideo[], start?: number) => void;
  next: (auto?: boolean) => void;
  previous: () => void;
  togglePlay: () => void;
  toggleLike: (track: YTVideo) => Promise<void>;
  createPlaylist: (name: string) => Promise<boolean>;
  addToPlaylist: (playlistId: string, track: YTVideo) => Promise<void>;
  removeFromPlaylist: (playlistId: string, videoId: string) => Promise<void>;
  handlePlayerMessage: (msg: PlayerMessage) => void;
  registerSender: (fn: (data: any) => void) => void;
};

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const senderRef = useRef<(data: any) => void>(() => {});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<YTVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [view, setView] = useState<ViewMode>('home');
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'songs' | 'playlists'>('songs');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState('');
  const [trending, setTrending] = useState<YTVideo[]>([]);
  const [popularPlaylists, setPopularPlaylists] = useState<YTPlaylist[]>([]);
  const [searchSongs, setSearchSongs] = useState<YTVideo[]>([]);
  const [searchPls, setSearchPls] = useState<YTPlaylist[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<YTVideo[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<YTPlaylist | null>(null);
  const [activeUserPlaylist, setActiveUserPlaylist] = useState<UserPlaylist | null>(null);
  const [likedSongs, setLikedSongs] = useState<YTVideo[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [trendToken, setTrendToken] = useState<string | null>(null);
  const [searchVideoToken, setSearchVideoToken] = useState<string | null>(null);
  const [searchPlaylistToken, setSearchPlaylistToken] = useState<string | null>(null);
  const [playlistToken, setPlaylistToken] = useState<string | null>(null);

  const current = currentIndex >= 0 ? queue[currentIndex] : null;
  const shownPlaylistSongs = activeUserPlaylist ? activeUserPlaylist.songs : activePlaylist ? playlistSongs : likedSongs;

  const flash = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const sendPlayer = useCallback((data: any) => {
    senderRef.current(data);
  }, []);

  const registerSender = useCallback((fn: (data: any) => void) => {
    senderRef.current = fn;
  }, []);

  const handleApiError = useCallback((error: any) => {
    if (error?.message === 'ADD_MORE_TOKENS') flash('Add more API tokens');
    else flash(error?.message || 'Request failed');
  }, [flash]);

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const [home, playlists] = await Promise.all([fetchTrendingMusic(12), fetchPopularPlaylists()]);
      setTrending(home.videos);
      setTrendToken(home.nextPageToken);
      setPopularPlaylists(playlists);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    DB.fetchLikedSongs().then(setLikedSongs);
    DB.fetchPlaylists().then(setUserPlaylists);
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing) timerRef.current = setInterval(() => sendPlayer({ type: 'tick' }), 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, sendPlayer]);

  useEffect(() => {
    if (ready) sendPlayer({ type: 'volume', volume });
  }, [ready, sendPlayer, volume]);

  const playTrack = (track: YTVideo, sourceList?: YTVideo[]) => {
    if (sourceList?.length) {
      const idx = sourceList.findIndex((item) => item.videoId === track.videoId);
      if (idx >= 0) {
        setQueue(sourceList);
        setCurrentIndex(idx);
      }
    } else {
      const existing = queue.findIndex((item) => item.videoId === track.videoId);
      if (existing >= 0) setCurrentIndex(existing);
      else {
        setQueue((prev) => [...prev, track]);
        setCurrentIndex(queue.length);
      }
    }
    setTime(0);
    setDuration(track.duration);
    sendPlayer({ type: 'load', videoId: track.videoId });
    setPlaying(true);
  };

  const playList = (songs: YTVideo[], start = 0) => {
    if (!songs.length) return;
    setQueue(songs);
    setCurrentIndex(start);
    setTime(0);
    setDuration(songs[start]?.duration || 0);
    sendPlayer({ type: 'load', videoId: songs[start].videoId });
    setPlaying(true);
  };

  const next = useCallback((auto = false) => {
    if (!queue.length) return;
    if (auto && repeat === 'one') {
      sendPlayer({ type: 'seek', seconds: 0 });
      sendPlayer({ type: 'play' });
      return;
    }
    let nextIndex = shuffle ? Math.floor(Math.random() * queue.length) : currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeat === 'all' || !auto) nextIndex = 0;
      else return setPlaying(false);
    }
    setCurrentIndex(nextIndex);
    const nextTrack = queue[nextIndex];
    setTime(0);
    setDuration(nextTrack.duration);
    sendPlayer({ type: 'load', videoId: nextTrack.videoId });
    setPlaying(true);
  }, [currentIndex, queue, repeat, sendPlayer, shuffle]);

  const previous = () => {
    if (!queue.length) return;
    const nextIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(nextIndex);
    const nextTrack = queue[nextIndex];
    setTime(0);
    setDuration(nextTrack.duration);
    sendPlayer({ type: 'load', videoId: nextTrack.videoId });
    setPlaying(true);
  };

  const togglePlay = () => {
    if (!current) return;
    // Let the engine confirm state via onStatus callback; we optimistically
    // flip the UI so it feels instant.
    if (playing) {
      sendPlayer({ type: 'pause' });
      setPlaying(false);
    } else {
      sendPlayer({ type: 'play' });
      setPlaying(true);
    }
  };

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setView('search');
    setLoading(true);
    try {
      const [songs, playlists] = await Promise.all([searchVideos(query, 12), searchPlaylists(query, 8)]);
      setSearchSongs(songs.videos);
      setSearchVideoToken(songs.nextPageToken);
      setSearchPls(playlists.playlists);
      setSearchPlaylistToken(playlists.nextPageToken);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const openPlaylist = async (playlist: YTPlaylist) => {
    setView('playlist');
    setActivePlaylist(playlist);
    setActiveUserPlaylist(null);
    setLoading(true);
    try {
      const result = await fetchPlaylistItems(playlist.id, 20);
      setPlaylistSongs(result.videos);
      setPlaylistToken(result.nextPageToken);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const openUserPlaylist = (playlist: UserPlaylist) => {
    setView('playlist');
    setActiveUserPlaylist(playlist);
    setActivePlaylist(null);
  };

  const openLiked = () => {
    setView('playlist');
    setActivePlaylist(null);
    setActiveUserPlaylist(null);
  };

  const loadMoreContent = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      if (view === 'home' && trendToken) {
        const result = await fetchTrendingMusic(12, trendToken);
        setTrending((prev) => [...prev, ...result.videos]);
        setTrendToken(result.nextPageToken);
      }
      if (view === 'search' && searchTab === 'songs' && searchVideoToken) {
        const result = await searchVideos(query, 12, searchVideoToken);
        setSearchSongs((prev) => [...prev, ...result.videos]);
        setSearchVideoToken(result.nextPageToken);
      }
      if (view === 'search' && searchTab === 'playlists' && searchPlaylistToken) {
        const result = await searchPlaylists(query, 8, searchPlaylistToken);
        setSearchPls((prev) => [...prev, ...result.playlists]);
        setSearchPlaylistToken(result.nextPageToken);
      }
      if (view === 'playlist' && activePlaylist && playlistToken) {
        const result = await fetchPlaylistItems(activePlaylist.id, 20, playlistToken);
        setPlaylistSongs((prev) => [...prev, ...result.videos]);
        setPlaylistToken(result.nextPageToken);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleLike = async (track: YTVideo) => {
    setLikedSongs(await DB.toggleLike(track));
  };

  const createPlaylist = async (name: string) => {
    if (!name.trim()) return false;
    await DB.createPlaylist(name.trim());
    setUserPlaylists(await DB.fetchPlaylists());
    flash('Playlist created');
    return true;
  };

  const addToPlaylist = async (playlistId: string, track: YTVideo) => {
    const updated = await DB.addSongToPlaylist(playlistId, track);
    setUserPlaylists(updated);
    if (activeUserPlaylist?.id === playlistId) {
      setActiveUserPlaylist(updated.find((item) => item.id === playlistId) || null);
    }
    flash('Added to playlist');
  };

  const removeFromPlaylist = async (playlistId: string, videoId: string) => {
    const updated = await DB.removeSongFromPlaylist(playlistId, videoId);
    setUserPlaylists(updated);
    setActiveUserPlaylist(updated.find((item) => item.id === playlistId) || null);
  };

  const handlePlayerMessage = useCallback((msg: PlayerMessage) => {
    if (msg.type === 'ready') setReady(true);
    if (msg.type === 'state') {
      if (msg.payload.state === 0) next(true);
      if (msg.payload.state === 1) setPlaying(true);
      if (msg.payload.state === 2) setPlaying(false);
    }
    if (msg.type === 'tick') {
      setTime(msg.payload.time || 0);
      if (msg.payload.duration > 0) setDuration(msg.payload.duration);
    }
    if (msg.type === 'error') flash(`Playback error: ${msg.payload?.code || 'unknown'}`);
  }, [flash, next]);

  const value = useMemo<MusicContextType>(() => ({
    ready,
    queue,
    currentIndex,
    playing,
    time,
    duration,
    volume,
    repeat,
    shuffle,
    view,
    query,
    searchTab,
    loading,
    loadingMore,
    toast,
    trending,
    popularPlaylists,
    searchSongs,
    searchPls,
    playlistSongs,
    activePlaylist,
    activeUserPlaylist,
    likedSongs,
    userPlaylists,
    current,
    shownPlaylistSongs,
    setView,
    setQuery,
    setSearchTab,
    setVolume,
    setRepeat,
    setShuffle,
    runSearch,
    openPlaylist,
    openUserPlaylist,
    openLiked,
    loadMoreContent,
    playTrack,
    playList,
    next,
    previous,
    togglePlay,
    toggleLike,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    handlePlayerMessage,
    registerSender,
  }), [
    ready, queue, currentIndex, playing, time, duration, volume, repeat, shuffle, view, query, searchTab,
    loading, loadingMore, toast, trending, popularPlaylists, searchSongs, searchPls, playlistSongs,
    activePlaylist, activeUserPlaylist, likedSongs, userPlaylists, current, shownPlaylistSongs,
    runSearch, openPlaylist, loadMoreContent, next, handlePlayerMessage, registerSender,
  ]);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const value = useContext(MusicContext);
  if (!value) throw new Error('useMusic must be used inside MusicProvider');
  return value;
}

