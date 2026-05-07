import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import YoutubePlayer, { type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { useMusic } from '../store/player-store';

export function PlayerEngine() {
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const [videoId, setVideoId] = useState<string | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const { handlePlayerMessage, registerSender } = useMusic();

  useEffect(() => {
    registerSender(async (data: any) => {
      try {
        switch (data.type) {
          case 'load':
            setVideoId(data.videoId);
            setPlaying(true);
            break;
          case 'play':
            setPlaying(true);
            break;
          case 'pause':
            setPlaying(false);
            break;
          case 'seek':
            playerRef.current?.seekTo(data.seconds ?? 0, true);
            break;
          case 'volume':
            setVolume(data.volume ?? 100);
            break;
          case 'tick': {
            const p = playerRef.current;
            if (!p) break;
            const [time, duration] = await Promise.all([
              p.getCurrentTime().catch(() => 0),
              p.getDuration().catch(() => 0),
            ]);
            handlePlayerMessage({ type: 'tick', payload: { time, duration } });
            break;
          }
        }
      } catch (err: any) {
        handlePlayerMessage({ type: 'error', payload: { code: err?.message ?? 'unknown' } });
      }
    });
  }, [handlePlayerMessage, registerSender]);

  return (
    <View style={styles.offscreenWrap} pointerEvents="none">
      <YoutubePlayer
        ref={playerRef}
        height={220}
        width={220}
        videoId={videoId}
        play={playing}
        volume={volume}
        initialPlayerParams={{ controls: false, preventFullScreen: true, rel: false }}
        onReady={() => {
          handlePlayerMessage({ type: 'ready' });
        }}
        onChangeState={(state: string) => {
          if (state === 'ended') handlePlayerMessage({ type: 'state', payload: { state: 0 } });
          else if (state === 'playing') handlePlayerMessage({ type: 'state', payload: { state: 1 } });
          else if (state === 'paused') handlePlayerMessage({ type: 'state', payload: { state: 2 } });
        }}
        onError={(error: string) => {
          handlePlayerMessage({ type: 'error', payload: { code: error || 'unknown' } });
        }}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreenWrap: { position: 'absolute', left: -1000, top: -1000, opacity: 0 },
});
