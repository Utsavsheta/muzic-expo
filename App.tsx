import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import type { WebView as WebViewType } from 'react-native-webview';
import type { RepeatMode, ViewMode, YTPlaylist, YTVideo } from './src/types';
import {
  fetchPlaylistItems,
  fetchPopularPlaylists,
  fetchTrendingMusic,
  searchPlaylists,
  searchVideos,
} from './src/api/youtube';
import * as DB from './src/services/db';
import type { UserPlaylist } from './src/services/db';

const RED = '#ef4444';
const BG = '#121212';
const PANEL = '#181818';

function playerHtml(videoId?: string) {
  return `<!doctype html><html><body style="margin:0;background:#000"><div id="player"></div><script src="https://www.youtube.com/iframe_api"></script><script>
    var player;
    function post(type, payload){ window.ReactNativeWebView.postMessage(JSON.stringify({type:type,payload:payload || {}})); }
    function onYouTubeIframeAPIReady(){
      player = new YT.Player('player',{ height:'1', width:'1', videoId:'${videoId || ''}', playerVars:{playsinline:1,controls:0,disablekb:1,rel:0}, events:{
        onReady:function(){ post('ready'); },
        onStateChange:function(e){ post('state',{state:e.data}); },
        onError:function(e){ post('error',{code:e.data}); }
      }});
    }
    window.addEventListener('message', function(e){
      var msg = JSON.parse(e.data);
      if(!player) return;
      if(msg.type==='load') player.loadVideoById(msg.videoId);
      if(msg.type==='play') player.playVideo();
      if(msg.type==='pause') player.pauseVideo();
      if(msg.type==='seek') player.seekTo(msg.seconds,true);
      if(msg.type==='volume') player.setVolume(msg.volume);
      if(msg.type==='tick') post('tick',{time:player.getCurrentTime()||0,duration:player.getDuration()||0});
    });
  </script></body></html>`;
}

export default function App() {
  const webRef = useRef<WebViewType>(null);
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

  const [createVisible, setCreateVisible] = useState(false);
  const [playlistPickerVideo, setPlaylistPickerVideo] = useState<YTVideo | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const current = currentIndex >= 0 ? queue[currentIndex] : null;
  const likedSet = useMemo(() => new Set(likedSongs.map((song) => song.videoId)), [likedSongs]);
  const shownPlaylistSongs = activeUserPlaylist ? activeUserPlaylist.songs : activePlaylist ? playlistSongs : likedSongs;

  const sendPlayer = useCallback((message: any) => {
    webRef.current?.postMessage(JSON.stringify(message));
  }, []);

  const flash = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2400);
  }, []);

  const handleApiError = useCallback((error: any) => {
    if (error?.message === 'ADD_MORE_TOKENS') flash('Add more API key tokens');
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

  const playTrack = (track: YTVideo) => {
    if (!ready) return flash('Player loading');
    const existing = queue.findIndex((item) => item.videoId === track.videoId);
    if (existing >= 0) setCurrentIndex(existing);
    else {
      setQueue((prev) => [...prev, track]);
      setCurrentIndex(queue.length);
    }
    setTime(0);
    setDuration(track.duration);
    sendPlayer({ type: 'load', videoId: track.videoId });
    setPlaying(true);
    setTimeout(() => sendPlayer({ type: 'play' }), 350);
  };

  const playList = (songs: YTVideo[], start = 0) => {
    if (!songs.length || !ready) return;
    setQueue(songs);
    setCurrentIndex(start);
    setTime(0);
    setDuration(songs[start].duration);
    sendPlayer({ type: 'load', videoId: songs[start].videoId });
    setPlaying(true);
    setTimeout(() => sendPlayer({ type: 'play' }), 350);
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
    setTime(0);
    setDuration(queue[nextIndex].duration);
    sendPlayer({ type: 'load', videoId: queue[nextIndex].videoId });
    setPlaying(true);
  }, [currentIndex, queue, repeat, sendPlayer, shuffle]);

  const previous = () => {
    if (!queue.length) return;
    const nextIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(nextIndex);
    setTime(0);
    setDuration(queue[nextIndex].duration);
    sendPlayer({ type: 'load', videoId: queue[nextIndex].videoId });
    setPlaying(true);
  };

  const togglePlay = () => {
    if (!current) return;
    if (playing) sendPlayer({ type: 'pause' });
    else sendPlayer({ type: 'play' });
    setPlaying((prev) => !prev);
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

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await DB.createPlaylist(newPlaylistName.trim());
    setUserPlaylists(await DB.fetchPlaylists());
    setNewPlaylistName('');
    setCreateVisible(false);
    flash('Playlist created');
  };

  const addToPlaylist = async (playlistId: string, track: YTVideo) => {
    const updated = await DB.addSongToPlaylist(playlistId, track);
    setUserPlaylists(updated);
    if (activeUserPlaylist?.id === playlistId) setActiveUserPlaylist(updated.find((item) => item.id === playlistId) || null);
    setPlaylistPickerVideo(null);
    flash('Added to playlist');
  };

  const removeFromPlaylist = async (playlistId: string, videoId: string) => {
    const updated = await DB.removeSongFromPlaylist(playlistId, videoId);
    setUserPlaylists(updated);
    setActiveUserPlaylist(updated.find((item) => item.id === playlistId) || null);
  };

  const renderTrack = ({ item, index }: { item: YTVideo; index: number }) => (
    <TrackRow
      track={item}
      index={index}
      active={current?.videoId === item.videoId}
      liked={likedSet.has(item.videoId)}
      onPress={() => playTrack(item)}
      onLike={() => toggleLike(item)}
      onAdd={() => setPlaylistPickerVideo(item)}
      onRemove={activeUserPlaylist ? () => removeFromPlaylist(activeUserPlaylist.id, item.videoId) : undefined}
    />
  );

  const renderPlaylist = ({ item }: { item: YTPlaylist }) => <PlaylistCard playlist={item} onPress={() => openPlaylist(item)} />;
  const renderHomeTrack = ({ item }: { item: YTVideo }) => (
    <TrackCard track={item} active={current?.videoId === item.videoId} liked={likedSet.has(item.videoId)} onPress={() => playTrack(item)} onLike={() => toggleLike(item)} onAdd={() => setPlaylistPickerVideo(item)} />
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <WebView ref={webRef} source={{ html: playerHtml() }} style={styles.hiddenPlayer} onMessage={(event) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
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
        } catch {}
      }} />

      <View style={styles.header}>
        <Text style={styles.logo}>Music</Text>
        <Text style={[styles.status, ready ? styles.ok : styles.warn]}>{ready ? 'Ready' : 'Loading player'}</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search songs, artists, playlists" placeholderTextColor="#777" value={query} onChangeText={setQuery} onSubmitEditing={runSearch} />
      </View>

      <View style={styles.navRow}>
        <NavButton active={view === 'home'} title="Home" onPress={() => setView('home')} />
        <NavButton active={view === 'search'} title="Search" onPress={() => setView('search')} />
        <NavButton active={view === 'playlist' && !activePlaylist && !activeUserPlaylist} title="Liked" onPress={openLiked} />
        <NavButton active={false} title="+ Playlist" onPress={() => setCreateVisible(true)} />
      </View>

      {view === 'home' && (
        <FlatList
          data={trending}
          keyExtractor={(item, index) => `${item.videoId}-${index}`}
          renderItem={renderHomeTrack}
          numColumns={2}
          contentContainerStyle={styles.content}
          ListHeaderComponent={<HomeHeader playlists={popularPlaylists} onPlaylist={openPlaylist} onPlayAll={() => playList(trending)} />}
          onEndReached={loadMoreContent}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading || loadingMore ? <ActivityIndicator color={RED} style={{ margin: 24 }} /> : null}
        />
      )}

      {view === 'search' && (
        searchTab === 'songs' ? (
          <FlatList
            data={searchSongs}
            keyExtractor={(item, index) => `${item.videoId}-${index}`}
            renderItem={renderTrack}
            contentContainerStyle={styles.content}
            ListHeaderComponent={<SearchHeader tab={searchTab} setTab={setSearchTab} />}
            onEndReached={loadMoreContent}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loading || loadingMore ? <ActivityIndicator color={RED} style={{ margin: 24 }} /> : null}
          />
        ) : (
          <FlatList
            data={searchPls}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderPlaylist}
            contentContainerStyle={styles.content}
            ListHeaderComponent={<SearchHeader tab={searchTab} setTab={setSearchTab} />}
            onEndReached={loadMoreContent}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loading || loadingMore ? <ActivityIndicator color={RED} style={{ margin: 24 }} /> : null}
          />
        )
      )}

      {view === 'playlist' && (
        <FlatList
          data={shownPlaylistSongs}
          keyExtractor={(item, index) => `${item.videoId}-${index}`}
          renderItem={renderTrack}
          contentContainerStyle={styles.content}
          ListHeaderComponent={<PlaylistHeader title={activeUserPlaylist?.name || activePlaylist?.title || 'Liked Songs'} count={shownPlaylistSongs.length} onPlay={() => playList(shownPlaylistSongs)} userPlaylists={userPlaylists} onOpenUserPlaylist={openUserPlaylist} />}
          onEndReached={loadMoreContent}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading || loadingMore ? <ActivityIndicator color={RED} style={{ margin: 24 }} /> : null}
        />
      )}

      <PlayerBar current={current} playing={playing} time={time} duration={duration} volume={volume} repeat={repeat} shuffle={shuffle} liked={!!current && likedSet.has(current.videoId)} onPrev={previous} onNext={() => next(false)} onToggle={togglePlay} onLike={() => current && toggleLike(current)} onRepeat={() => setRepeat((prev) => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off')} onShuffle={() => setShuffle((prev) => !prev)} onVolume={(v) => setVolume(v)} />

      <CreatePlaylistModal visible={createVisible} name={newPlaylistName} setName={setNewPlaylistName} onClose={() => setCreateVisible(false)} onCreate={createPlaylist} />
      <AddToPlaylistModal visible={!!playlistPickerVideo} playlists={userPlaylists} onClose={() => setPlaylistPickerVideo(null)} onCreate={() => { setPlaylistPickerVideo(null); setCreateVisible(true); }} onAdd={(playlistId) => playlistPickerVideo && addToPlaylist(playlistId, playlistPickerVideo)} />
      {!!toast && <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}
    </SafeAreaView>
  );
}

function NavButton({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.navButton, active && styles.navButtonActive]}><Text style={[styles.navText, active && styles.navTextActive]}>{title}</Text></Pressable>;
}

function HomeHeader({ playlists, onPlaylist, onPlayAll }: { playlists: YTPlaylist[]; onPlaylist: (p: YTPlaylist) => void; onPlayAll: () => void }) {
  return <View><View style={styles.sectionHeader}><Text style={styles.title}>Trending</Text><Pressable style={styles.primaryBtn} onPress={onPlayAll}><Text style={styles.primaryBtnText}>Play All</Text></Pressable></View><Text style={styles.subTitle}>Popular Playlists</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>{playlists.map((p) => <PlaylistCard key={p.id} playlist={p} onPress={() => onPlaylist(p)} />)}</ScrollView></View>;
}

function SearchHeader({ tab, setTab }: { tab: 'songs' | 'playlists'; setTab: (t: 'songs' | 'playlists') => void }) {
  return <View><Text style={styles.title}>Search Results</Text><View style={styles.navRow}><NavButton title="Songs" active={tab === 'songs'} onPress={() => setTab('songs')} /><NavButton title="Playlists" active={tab === 'playlists'} onPress={() => setTab('playlists')} /></View></View>;
}

function PlaylistHeader({ title, count, onPlay, userPlaylists, onOpenUserPlaylist }: { title: string; count: number; onPlay: () => void; userPlaylists: UserPlaylist[]; onOpenUserPlaylist: (p: UserPlaylist) => void }) {
  return <View><LinearGradient colors={['#ef4444', '#181818']} style={styles.playlistHero}><Text style={styles.heroTitle}>{title}</Text><Text style={styles.heroMeta}>{count} songs</Text><Pressable style={styles.roundPlay} onPress={onPlay}><Text style={styles.roundPlayText}>▶</Text></Pressable></LinearGradient><Text style={styles.subTitle}>Your Playlists</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>{userPlaylists.map((p) => <Pressable key={p.id} onPress={() => onOpenUserPlaylist(p)} style={styles.userPlaylistPill}><Text style={styles.userPlaylistText}>{p.name}</Text></Pressable>)}</ScrollView></View>;
}

function TrackCard({ track, active, liked, onPress, onLike, onAdd }: { track: YTVideo; active: boolean; liked: boolean; onPress: () => void; onLike: () => void; onAdd: () => void }) {
  return <Pressable style={styles.card} onPress={onPress}><Image source={{ uri: track.thumbnailHigh || track.thumbnail }} style={styles.cardImage} /><Text style={[styles.cardTitle, active && { color: RED }]} numberOfLines={1}>{track.title}</Text><Text style={styles.cardMeta} numberOfLines={1}>{track.channelTitle}</Text><View style={styles.cardActions}><Pressable onPress={onLike}><Text style={styles.icon}>{liked ? '♥' : '♡'}</Text></Pressable><Pressable onPress={onAdd}><Text style={styles.icon}>＋</Text></Pressable></View></Pressable>;
}

function TrackRow({ track, index, active, liked, onPress, onLike, onAdd, onRemove }: { track: YTVideo; index: number; active: boolean; liked: boolean; onPress: () => void; onLike: () => void; onAdd: () => void; onRemove?: () => void }) {
  return <Pressable style={[styles.row, active && styles.rowActive]} onPress={onPress}><Text style={styles.rowIndex}>{index + 1}</Text><Image source={{ uri: track.thumbnail }} style={styles.rowImage} /><View style={styles.rowText}><Text style={[styles.rowTitle, active && { color: RED }]} numberOfLines={1}>{track.title}</Text><Text style={styles.rowMeta} numberOfLines={1}>{track.channelTitle}</Text></View><Pressable onPress={onLike}><Text style={styles.icon}>{liked ? '♥' : '♡'}</Text></Pressable><Pressable onPress={onAdd}><Text style={styles.icon}>＋</Text></Pressable>{onRemove && <Pressable onPress={onRemove}><Text style={styles.remove}>×</Text></Pressable>}</Pressable>;
}

function PlaylistCard({ playlist, onPress }: { playlist: YTPlaylist; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.playlistCard}><Image source={{ uri: playlist.thumbnailHigh || playlist.thumbnail }} style={styles.playlistImage} /><Text style={styles.cardTitle} numberOfLines={1}>{playlist.title}</Text><Text style={styles.cardMeta} numberOfLines={1}>{playlist.channelTitle}</Text></Pressable>;
}

function PlayerBar(props: { current: YTVideo | null; playing: boolean; time: number; duration: number; volume: number; repeat: RepeatMode; shuffle: boolean; liked: boolean; onPrev: () => void; onNext: () => void; onToggle: () => void; onLike: () => void; onRepeat: () => void; onShuffle: () => void; onVolume: (v: number) => void }) {
  const pct = props.duration > 0 ? Math.min(100, (props.time / props.duration) * 100) : 0;
  return <View style={styles.player}><View style={styles.progress}><View style={[styles.progressFill, { width: pct }]} /></View><View style={styles.playerRow}>{props.current ? <Image source={{ uri: props.current.thumbnail }} style={styles.playerImage} /> : <View style={styles.playerImage} />}<View style={styles.playerText}><Text style={styles.playerTitle} numberOfLines={1}>{props.current?.title || 'Select a song'}</Text><Text style={styles.playerMeta}>{fmtTime(props.time)} / {fmtTime(props.duration)}</Text></View><Pressable onPress={props.onLike}><Text style={styles.icon}>{props.liked ? '♥' : '♡'}</Text></Pressable><Pressable onPress={props.onShuffle}><Text style={[styles.icon, props.shuffle && { color: RED }]}>⤨</Text></Pressable><Pressable onPress={props.onPrev}><Text style={styles.control}>⏮</Text></Pressable><Pressable onPress={props.onToggle}><Text style={styles.playButton}>{props.playing ? 'Ⅱ' : '▶'}</Text></Pressable><Pressable onPress={props.onNext}><Text style={styles.control}>⏭</Text></Pressable><Pressable onPress={props.onRepeat}><Text style={[styles.icon, props.repeat !== 'off' && { color: RED }]}>{props.repeat === 'one' ? '↻1' : '↻'}</Text></Pressable></View></View>;
}

function CreatePlaylistModal({ visible, name, setName, onClose, onCreate }: { visible: boolean; name: string; setName: (v: string) => void; onClose: () => void; onCreate: () => void }) {
  return <Modal transparent visible={visible} animationType="fade"><View style={styles.modalBackdrop}><View style={styles.modal}><Text style={styles.modalTitle}>Create Playlist</Text><TextInput value={name} onChangeText={setName} placeholder="Playlist name" placeholderTextColor="#777" style={styles.modalInput} autoFocus /><View style={styles.modalRow}><Pressable style={styles.modalButton} onPress={onClose}><Text style={styles.modalButtonText}>Cancel</Text></Pressable><Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={onCreate}><Text style={styles.modalButtonText}>Create</Text></Pressable></View></View></View></Modal>;
}

function AddToPlaylistModal({ visible, playlists, onClose, onCreate, onAdd }: { visible: boolean; playlists: UserPlaylist[]; onClose: () => void; onCreate: () => void; onAdd: (id: string) => void }) {
  return <Modal transparent visible={visible} animationType="fade"><View style={styles.modalBackdrop}><View style={styles.modal}><Text style={styles.modalTitle}>Add to Playlist</Text><Pressable style={styles.newPlaylistButton} onPress={onCreate}><Text style={styles.newPlaylistText}>+ New Playlist</Text></Pressable>{playlists.map((p) => <Pressable key={p.id} style={styles.playlistOption} onPress={() => onAdd(p.id)}><Text style={styles.playlistOptionTitle}>{p.name}</Text><Text style={styles.cardMeta}>{p.songs.length} songs</Text></Pressable>)}<Pressable style={styles.modalButton} onPress={onClose}><Text style={styles.modalButtonText}>Close</Text></Pressable></View></View></Modal>;
}

function fmtTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  hiddenPlayer: { width: 1, height: 1, opacity: 0, position: 'absolute' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  logo: { color: '#fff', fontSize: 22, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  status: { fontSize: 10, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  ok: { color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.12)' },
  warn: { color: '#facc15', backgroundColor: 'rgba(250,204,21,0.12)' },
  searchRow: { paddingHorizontal: 16, paddingBottom: 10 },
  searchInput: { height: 44, backgroundColor: '#202020', borderRadius: 22, paddingHorizontal: 18, color: '#fff', fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  navButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#202020' },
  navButtonActive: { backgroundColor: '#fff' }, 
  navText: { color: '#999', fontWeight: '900', fontSize: 12 },
  navTextActive: { color: '#000' },
  content: { paddingHorizontal: 14, paddingBottom: 130 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 12, marginTop: 6 },
  primaryBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  primaryBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },
  card: { width: '48%', margin: '1%', padding: 10, borderRadius: 18, backgroundColor: '#1b1b1b' },
  cardImage: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: '#333' },
  cardTitle: { color: '#fff', fontWeight: '900', marginTop: 10, fontSize: 13 },
  cardMeta: { color: '#777', fontSize: 11, marginTop: 3 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  icon: { color: '#fff', fontSize: 20, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, marginBottom: 4 },
  rowActive: { backgroundColor: '#242424' },
  rowIndex: { color: '#777', width: 28, fontWeight: '900', textAlign: 'center' },
  rowImage: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#333' },
  rowText: { flex: 1, marginHorizontal: 10 },
  rowTitle: { color: '#fff', fontWeight: '900', fontSize: 13 },
  rowMeta: { color: '#777', fontSize: 11, marginTop: 3 },
  remove: { color: RED, fontSize: 24, fontWeight: '900' },
  playlistCard: { width: 150, padding: 10, marginRight: 10, borderRadius: 18, backgroundColor: '#1b1b1b' },
  playlistImage: { width: 130, height: 130, borderRadius: 14, backgroundColor: '#333' },
  playlistHero: { padding: 22, borderRadius: 24, marginBottom: 18 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  heroMeta: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', marginTop: 6 },
  roundPlay: { width: 54, height: 54, borderRadius: 27, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  roundPlayText: { color: '#fff', fontWeight: '900', fontSize: 24 },
  userPlaylistPill: { backgroundColor: '#222', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 },
  userPlaylistText: { color: '#fff', fontWeight: '900' },
  player: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: PANEL, borderTopWidth: 1, borderTopColor: '#262626' },
  progress: { height: 3, backgroundColor: '#333' },
  progressFill: { height: 3, backgroundColor: RED },
  playerRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  playerImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#333' },
  playerText: { flex: 1 },
  playerTitle: { color: '#fff', fontWeight: '900', fontSize: 13 },
  playerMeta: { color: '#777', fontSize: 10, marginTop: 3 },
  control: { color: '#fff', fontSize: 18, fontWeight: '900' },
  playButton: { color: '#000', fontSize: 18, fontWeight: '900', backgroundColor: '#fff', width: 38, height: 38, textAlign: 'center', lineHeight: 38, borderRadius: 19, overflow: 'hidden' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 360, backgroundColor: '#222', borderRadius: 22, padding: 20 },
  modalTitle: { color: '#fff', fontWeight: '900', fontSize: 20, marginBottom: 14 },
  modalInput: { backgroundColor: '#151515', borderRadius: 14, padding: 14, color: '#fff', fontWeight: '800', marginBottom: 16 },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, backgroundColor: '#333', padding: 14, borderRadius: 999, alignItems: 'center', marginTop: 8 },
  modalButtonPrimary: { backgroundColor: RED },
  modalButtonText: { color: '#fff', fontWeight: '900' },
  newPlaylistButton: { borderWidth: 1, borderColor: '#444', borderStyle: 'dashed', borderRadius: 14, padding: 14, marginBottom: 12 },
  newPlaylistText: { color: '#fff', fontWeight: '900' },
  playlistOption: { padding: 14, borderRadius: 14, backgroundColor: '#191919', marginBottom: 8 },
  playlistOptionTitle: { color: '#fff', fontWeight: '900' },
  toast: { position: 'absolute', bottom: 95, right: 16, backgroundColor: RED, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  toastText: { color: '#fff', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' },
});