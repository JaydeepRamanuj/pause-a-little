// Installing the app to the home screen. Browsers offer it through an event we keep until the
// user chooses, so the settings panel can offer it whenever it is possible.

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

export function setupInstall() {
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export const canInstall = () => deferred !== null;

export function subscribeInstall(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function install() {
  if (!deferred) return;
  const prompt = deferred;
  deferred = null;
  notify();
  await prompt.prompt();
  await prompt.userChoice;
}
