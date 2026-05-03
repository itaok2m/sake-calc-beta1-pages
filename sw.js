// 日本酒醸造 計算ツール
// ホーム画面追加・アプリ風起動用。
// 古いファイルの固定キャッシュ事故を避けるため、強制キャッシュは行わない。
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', () => {
  // ネットワーク標準挙動に任せる。古いファイルの固定キャッシュ事故を避ける。
});
