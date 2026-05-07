export function playerHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#000; overflow:hidden; }
  #player { width:240px; height:135px; }
</style>
</head>
<body>
<div id="player"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
var yt = null;
var adActive = false;

// Tracks the last position we explicitly seeked to.
// Re-applied before playVideo() to guard against YouTube resetting position
// during buffering (which can cause the video to restart from 0 on resume).
var pendingSeekSeconds = -1;

function post(type, payload) {
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
  } catch(e) {}
}

// Poll for ads every 300 ms.
// getAdState(): -1 = no ad, 0 = ad ended, 1 = ad playing, 2 = ad paused, 3 = buffering ad.
// skipAd() skips a skippable ad as soon as the skip button becomes available.
// Muting during non-skippable ads prevents the user from hearing them.
setInterval(function() {
  if (!yt || typeof yt.getAdState !== 'function') return;
  try {
    var adState = yt.getAdState();
    if (adState !== -1 && adState !== 0) {
      // Ad is active — mute and attempt to skip.
      if (!adActive) {
        adActive = true;
        yt.mute();
      }
      if (typeof yt.skipAd === 'function') yt.skipAd();
    } else if (adActive) {
      // Ad just ended — restore volume.
      adActive = false;
      yt.unMute();
    }
  } catch(e) {}
}, 300);

function onYouTubeIframeAPIReady() {
  yt = new YT.Player('player', {
    width: 240,
    height: 135,
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      rel: 0,
      fs: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      origin: 'https://lonelycpp.github.io',
    },
    events: {
      onReady: function() { post('ready'); },
      onStateChange: function(e) { post('state', { state: e.data }); },
      onError: function(e) { post('error', { code: e.data }); }
    }
  });
}

// Commands are sent via injectJavaScript (not postMessage) for reliability.
window.handleCmd = function(msg) {
  try {
    if (!yt || typeof yt.playVideo !== 'function') return;
    switch (msg.type) {
      case 'load':
        // Reset pending seek on a new video load.
        pendingSeekSeconds = -1;
        yt.loadVideoById(msg.videoId);
        break;
      case 'play':
        // Re-apply the last explicit seek before starting playback.
        // YouTube can reset position to 0 during buffering after a seekTo(),
        // so we re-seek here to guarantee the correct start position.
        if (pendingSeekSeconds >= 0) {
          yt.seekTo(pendingSeekSeconds, true);
          pendingSeekSeconds = -1;
        }
        yt.playVideo();
        break;
      case 'pause':
        yt.pauseVideo();
        break;
      case 'seek':
        pendingSeekSeconds = msg.seconds || 0;
        yt.seekTo(pendingSeekSeconds, true);
        break;
      case 'volume':
        if (!adActive) yt.setVolume(msg.volume);
        break;
      case 'tick':
        post('tick', {
          time: yt.getCurrentTime() || 0,
          duration: yt.getDuration() || 0,
        });
        break;
    }
  } catch(e) {}
};
</script>
</body>
</html>`;
}
