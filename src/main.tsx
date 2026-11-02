import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';
import { toast } from './app/session';
import { setupInstall } from './lib/pwa';

// The service worker keeps the app working offline. A new version waits until the user
// reloads, so it never interrupts a song.
registerSW({
  onOfflineReady() {
    toast('Ready to use offline');
  },
  onNeedRefresh() {
    toast('A new version is ready. Reload when you are between songs.');
  },
});
setupInstall();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
