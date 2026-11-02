// Per-viewer memory. Keys keep the names the two original rooms used, so saved
// stats, playlists and preferences carry over. Every access is guarded: storage
// can be blocked (private windows) and the app must still work without it.

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep going */
  }
}
