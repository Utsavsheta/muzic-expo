import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import { useMusic } from '../store/player-store';
import { playerHtml } from './player-html';

// Stable module-level constant — never recreated, so WebView never reloads.
const SOURCE = { html: playerHtml(), baseUrl: 'https://lonelycpp.github.io' };

export function PlayerEngine() {
  const webViewRef = useRef<WebView | null>(null);
  const { handlePlayerMessage, registerSender } = useMusic();

  useEffect(() => {
    // Sender injects JS directly into the WebView so commands are reliable
    // and synchronous — no React render cycle required, no play-prop race.
    registerSender((data: any) => {
      webViewRef.current?.injectJavaScript(
        `window.handleCmd(${JSON.stringify(data)});true;`,
      );
    });
  }, [registerSender]);

  return (
    <View style={styles.offscreenWrap} pointerEvents="none">
      <WebView
        ref={webViewRef}
        source={SOURCE}
        onMessage={(event) => {
          try {
            // handlePlayerMessage is read from the latest render closure here,
            // so isSeeking and next are always current.
            handlePlayerMessage(JSON.parse(event.nativeEvent.data));
          } catch {}
        }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        style={styles.player}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreenWrap: { position: 'absolute', left: -1000, top: -1000, opacity: 0 },
  player: { width: 240, height: 135 },
});
