// The end-of-session notification, for when the tab is hidden. The permission is asked once,
// the first time a session starts, so the question comes when the person is already using the app.

import { getState, persist, persistKeys } from "../lib/store";
import { load, save } from "../lib/storage";
import { setState } from "../lib/store";
import type { Note } from "./notifyMath";

const supported = () => typeof Notification !== "undefined";

/** Ask for permission, but only on the very first session start (and never if it is off). */
export function askNotifyOnce() {
  if (!supported() || !getState().notify) return;
  if (Notification.permission !== "default" || load(persistKeys.notifyAsked, false)) return;
  save(persistKeys.notifyAsked, true);
  try {
    void Notification.requestPermission();
  } catch {
    /* an old browser: nothing to ask */
  }
}

/** Show the note if the person is away from the tab and allowed it. */
export function notifyEnd(note: Note) {
  if (!supported() || !getState().notify || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;
  const opts: NotificationOptions = { body: note.body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "pause-a-little" };
  try {
    const n = new Notification(note.title, opts);
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // some phones only allow notifications through the service worker
    navigator.serviceWorker?.getRegistration().then((r) => r?.showNotification(note.title, opts)).catch(() => {});
  }
}

export function setNotify(on: boolean) {
  persist("notify", on);
  setState({ notify: on });
  if (on) askNotifyOnce();
}

/** "granted", "denied", "default" or "unsupported", for the settings text. */
export const notifyPermission = () => (supported() ? Notification.permission : "unsupported");
