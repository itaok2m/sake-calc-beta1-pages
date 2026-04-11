// beta1 Android向け最小PWA対応
// 今回はオフライン用の重いキャッシュは持たせず、installable 判定に必要な最小構成だけを入れています。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
