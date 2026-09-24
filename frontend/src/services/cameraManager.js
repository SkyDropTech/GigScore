/**
 * Global Camera and MediaStream Manager for GigScore.
 * Tracks every MediaStreamTrack opened by the browser and ensures
 * all webcam hardware feeds are reliably terminated when verification finishes.
 */

const activeTracks = new Set();
let isCameraRequested = false;

// Intercept navigator.mediaDevices.getUserMedia to auto-register all tracks
if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
  const nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  navigator.mediaDevices.getUserMedia = async function (constraints) {
    isCameraRequested = true;
    try {
      const stream = await nativeGetUserMedia(constraints);

      // If camera was shut down while getUserMedia was resolving, kill tracks immediately
      if (!isCameraRequested) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch (e) {}
        });
        return stream;
      }

      // Register all tracks for tracking
      stream.getTracks().forEach((track) => {
        activeTracks.add(track);
        track.addEventListener('ended', () => {
          activeTracks.delete(track);
        });
      });

      return stream;
    } catch (err) {
      throw err;
    }
  };
}

/**
 * Forcefully stops and releases all open camera hardware tracks.
 */
export function stopAllCameras() {
  isCameraRequested = false;

  activeTracks.forEach((track) => {
    try {
      track.stop();
      track.enabled = false;
    } catch (e) {}
  });
  activeTracks.clear();

  // Also query all video elements in the DOM and clear their srcObject
  if (typeof document !== 'undefined') {
    document.querySelectorAll('video').forEach((video) => {
      try {
        if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
          video.srcObject.getTracks().forEach((t) => {
            try {
              t.stop();
              t.enabled = false;
            } catch (e) {}
          });
        }
        video.srcObject = null;
      } catch (e) {}
    });
  }
}

/**
 * Register any standalone MediaStream into the tracking registry.
 */
export function registerMediaStream(stream) {
  if (!stream) return stream;
  stream.getTracks().forEach((track) => {
    activeTracks.add(track);
    track.addEventListener('ended', () => {
      activeTracks.delete(track);
    });
  });
  return stream;
}

// Global window event listeners to release camera when backgrounded
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', stopAllCameras);
  window.addEventListener('pagehide', stopAllCameras);
}
