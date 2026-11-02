/** Toggle the page's fullscreen. Quietly does nothing where the browser refuses. */
export function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else void document.exitFullscreen?.();
  } catch {
    /* refused: nothing to do */
  }
}

export const canFullscreen = () => typeof document.documentElement.requestFullscreen === 'function';
