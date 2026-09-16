import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for instant offline caching of site assets and data
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Portal Sekolah: Konten baru tersedia.');
  },
  onOfflineReady() {
    console.log('Portal Sekolah: Siap digunakan secara offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

