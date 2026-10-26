/* =========================================================
   Davusic · cliente
   Vanilla JS, sin bundler. Funciona en Tauri y en navegador
   (el navegador usa la demo y <audio>; Tauri usa audio nativo).
   ========================================================= */

const TAURI = window.__TAURI__ || null;
const IS_TAURI = Boolean(TAURI && TAURI.core && TAURI.core.invoke);
const inv = (cmd, args) => TAURI.core.invoke(cmd, args);
const onEvent = (name, cb) => (IS_TAURI && TAURI.event ? TAURI.event.listen(name, cb) : Promise.resolve(() => {}));
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const els = {
  app: qs('#app'),
  view: qs('#view'),
  mainScroll: qs('#mainScroll'),
  searchbox: qs('#searchbox'),
  searchInput: qs('#searchInput'),
  searchClear: qs('#searchClear'),
  shortcutsBtn: qs('#shortcutsBtn'),
  settingsBtn: qs('#settingsBtn'),
  profileTopBtn: qs('#profileTopBtn'),
  profileBtn: qs('#profileBtn'),
  newPlaylistBtn: qs('#newPlaylistBtn'),
  newPlaylistBtn2: qs('#newPlaylistBtn2'),
  importBtn: qs('#importBtn'),
  playlistNav: qs('#playlistNav'),
  likedCount: qs('#likedCount'),
  libraryPillText: qs('#libraryPillText'),
  titlebarStatus: qs('#titlebarStatus'),
  playerbar: qs('#playerbar'),
  playBtn: qs('#playBtn'),
  prevBtn: qs('#prevBtn'),
  nextBtn: qs('#nextBtn'),
  shuffleBtn: qs('#shuffleBtn'),
  repeatBtn: qs('#repeatBtn'),
  playerTitle: qs('#playerTitle'),
  playerArtist: qs('#playerArtist'),
  playerCover: qs('#playerCover'),
  playerCoverImg: qs('#playerCoverImg'),
  playerLike: qs('#playerLike'),
  playerAdd: qs('#playerAdd'),
  currentTime: qs('#currentTime'),
  totalTime: qs('#totalTime'),
  progress: qs('#progress'),
  progressFill: qs('#progressFill'),
  progressBuffered: qs('#progressBuffered'),
  progressTooltip: qs('#progressTooltip'),
  volume: qs('#volume'),
  volumeFill: qs('#volumeFill'),
  muteBtn: qs('#muteBtn'),
  lyricsBtn: qs('#lyricsBtn'),
  queueBtn: qs('#queueBtn'),
  immersiveBtn: qs('#immersiveBtn'),
  contextPanel: qs('#contextPanel'),
  contextBody: qs('#contextBody'),
  contextClose: qs('#contextClose'),
  navBack: qs('#navBack'),
  navForward: qs('#navForward'),
  palette: qs('#commandPalette'),
  paletteInput: qs('#commandInput'),
  paletteResults: qs('#commandResults'),
  settingsSheet: qs('#settingsSheet'),
  settingsBody: qs('#settingsBody'),
  shortcutsSheet: qs('#shortcutsSheet'),
  shortcutsBody: qs('#shortcutsBody'),
  playlistModal: qs('#playlistModal'),
  playlistForm: qs('#playlistForm'),
  playlistName: qs('#playlistName'),
  playlistDescription: qs('#playlistDescription'),
  trackMenu: qs('#trackMenu'),
  trackMenuHeader: qs('#trackMenuHeader'),
  trackMenuLike: qs('#trackMenuLike'),
  addMenu: qs('#addMenu'),
  addMenuList: qs('#addMenuList'),
  addMenuCreate: qs('#addMenuCreate'),
  immersive: qs('#immersive'),
  immersiveClose: qs('#immersiveClose'),
  immersiveMenu: qs('#immersiveMenu'),
  immersivePrev: qs('#immersivePrev'),
  immersiveNext: qs('#immersiveNext'),
  immersiveArt: qs('#immersiveArt'),
  immersiveBackdrop: qs('#immersiveBackdrop'),
  immersiveGlow: qs('#immersiveGlow'),
  immersiveTitle: qs('#immersiveTitle'),
  immersiveArtist: qs('#immersiveArtist'),
  immersiveAlbum: qs('#immersiveAlbum'),
  immersiveLyrics: qs('#immersiveLyrics'),
  immersiveProgress: qs('#immersiveProgress'),
  immersiveProgressFill: qs('#immersiveProgressFill'),
  immersiveCurrent: qs('#immersiveCurrent'),
  immersiveTotal: qs('#immersiveTotal'),
  immersivePlay: qs('#immersivePlay'),
  immersiveShuffle: qs('#immersiveShuffle'),
  immersiveLike: qs('#immersiveLike'),
  immersiveSource: qs('#immersiveSource'),
  scanIndicator: qs('#scanIndicator'),
  scanText: qs('#scanText'),
  scanBar: qs('#scanBar'),
  toasts: qs('#toasts'),
  scrim: qs('#scrim'),
  wallpaperLayer: qs('#wallpaperLayer'),
  importModal: qs('#importModal'),
  importBody: qs('#importBody'),
  importTabs: qs('#importTabs'),
  importTopBtn: qs('#importTopBtn'),
  factoryResetModal: qs('#factoryResetModal'),
  factoryResetConfirm: qs('#factoryResetConfirm'),
  factoryResetSubmit: qs('#factoryResetSubmit'),
  factoryResetStatus: qs('#factoryResetStatus'),
};

const STORE = {
  prefs: 'davusic:v1:prefs',
  likes: 'davusic:v1:likes',
  playlists: 'davusic:v1:playlists',
  recents: 'davusic:v1:recents',
  signals: 'davusic:v2:signals',
  wallpaper: 'davusic:v2:wallpaper',
  streams: 'davusic:v1:streams',
  lyrics: 'davusic:v1:lyrics',
  fonts: 'davusic:v1:fonts',
  profile: 'davusic:v1:profile',
  session: 'davusic:v1:session',
};

// Claves heredadas de la primera versión. Solo se leen una vez para migrar
// los datos existentes; todas las escrituras nuevas usan STORE.
const LEGACY_STORE = {
  prefs: 'auralis:v1:prefs',
  likes: 'auralis:v1:likes',
  playlists: 'auralis:v1:playlists',
  recents: 'auralis:v1:recents',
  signals: 'auralis:v2:signals',
  wallpaper: 'auralis:v2:wallpaper',
  streams: 'auralis:v1:streams',
  lyrics: 'auralis:v1:lyrics',
  fonts: 'auralis:v1:fonts',
  profile: 'auralis:v1:profile',
  session: 'auralis:v1:session',
};

const DEFAULT_PREFS = {
  theme: 'nocturne',
  accent: 'cyan',
  fontPack: 'davito',
  motion: 'full',
  volume: 0.78,
  contextTab: 'queue',
  searchHistory: [],
  librarySort: 'title',
  resumeSession: true,
};

const FONT_PACKS = [
  { id: 'davito', name: 'Davito', sans: 'Manrope', display: 'Instrument Serif', mono: 'JetBrains Mono' },
  { id: 'hud', name: 'HUD', sans: 'Adwaita / Inter', display: 'Adwaita Sans', mono: 'JetBrains Mono' },
  { id: 'terminal', name: 'Terminal', sans: 'JetBrains Mono', display: 'JetBrains Mono', mono: 'IBM Plex Mono' },
  { id: 'editorial', name: 'Editorial', sans: 'Manrope', display: 'Instrument Serif', mono: 'IBM Plex Mono' },
  { id: 'system', name: 'Sistema', sans: 'system-ui', display: 'system-ui', mono: 'ui-monospace' },
  { id: 'noto', name: 'Noto', sans: 'Noto Sans', display: 'Noto Serif', mono: 'Noto Sans Mono' },
  { id: 'ubuntu', name: 'Ubuntu', sans: 'Ubuntu', display: 'Ubuntu', mono: 'Ubuntu Mono' },
  { id: 'custom', name: 'Propias', sans: 'Archivo local', display: 'Archivo local', mono: 'Archivo local' },
];

const DEFAULT_PROFILE = {
  name: 'Davo',
  handle: 'davito_03',
  avatar: '',
};

const state = {
  demo: { tracks: [], albums: [], artists: [], playlists: [], moods: [] },
  local: { tracks: [], albums: [], artists: [], folders: [] },
  stream: { tracks: [] },
  allTracks: [],
  tracksById: new Map(),
  albums: [],
  artists: [],
  moods: [],
  playlists: [],
  userPlaylists: [],
  likes: [],
  recents: [],
  prefs: { ...DEFAULT_PREFS },
  view: { name: 'home', params: {} },
  nav: { stack: [{ name: 'home', params: {} }], index: 0 },
  ui: {
    libraryFilter: 'all',
    librarySort: 'title',
    query: '',
    paletteItems: [],
    paletteIndex: 0,
    scanVisible: false,
    draggingProgress: false,
    draggingVolume: false,
    draggedQueue: null,
    lastLyricLine: -1,
    listWindow: {},
    customFonts: {},
    pendingPlaylistTrack: null,
    menuTrack: null,
    addMenuTrack: null,
    booted: false,
    importFilter: 'all',
    onlineSearch: { query: '', loading: false, results: [], error: '' },
    lyrics: { byId: {}, loading: {}, error: {} },
    factoryResetting: false,
  },
  signals: emptySignals(),
  recs: null,
  profile: { ...DEFAULT_PROFILE },
  wallpaper: {
    themes: [],
    folder: '',
    selected: null,
    loaded: false,
    attempted: false,
    busy: false,
    error: '',
    progress: { done: 0, total: 0, current: '', stage: '' },
  },
  import: newImportState(),
  spotify: newSpotifyState(),
  player: {
    trackId: null,
    queue: [],
    index: -1,
    context: null,
    unshuffled: null,
    playing: false,
    loading: false,
    statusLabel: '',
    position: 0,
    duration: 0,
    volume: 0.78,
    muted: false,
    lastVolume: 0.78,
    shuffle: false,
    repeat: 'off',
    endedAt: 0,
  },
};

function emptySignals() {
  return {
    version: 2,
    tracks: {},
    searches: [],
    nowPlaying: null,
    updatedAt: 0,
  };
}

function newSpotifyState() {
  return {
    status: null,
    loading: false,
    authBusy: false,
    cancelBusy: false,
    error: '',
    notice: '',
    editClient: false,
    clientIdDraft: '',
    playlists: [],
    playlistsLoading: false,
    playlistsError: '',
    playlistsOffset: 0,
    playlistsNextOffset: null,
    playlistsTotal: 0,
    playlistsLoaded: false,
    importBusy: '',
    importProgress: { done: 0, total: 0 },
  };
}

function newImportState() {
  return {
    tab: 'library',
    step: 'source',
    bundle: null,
    selectedPlaylists: [],
    items: [],
    matches: [],
    selection: {},
    matching: false,
    downloading: false,
    progress: { done: 0, total: 0, stage: '', label: '', percent: 0 },
    loading: false,
    loadingMessage: '',
    urlDraft: '',
    textDraft: '',
    tools: null,
    toolsLoading: false,
    installing: false,
    result: null,
    error: '',
  };
}

/* ---------- utilidades ---------- */

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function fold(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function fmtTime(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function fmtLong(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${Math.max(1, m)} min`;
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function icon(name, cls = '') {
  return `<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function isHex(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ''));
}

function hex(value, fallback = '#ffa094') {
  return isHex(value) ? value : fallback;
}

function rgbTriplet(value, fallback = '255, 160, 148') {
  if (!isHex(value)) return fallback;
  const n = parseInt(value.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function cssUrl(value) {
  const url = String(value || '').replace(/["\\\n\r]/g, (ch) => encodeURIComponent(ch));
  return `url("${url}")`;
}

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeStore(key, value) {
  if (state.ui.factoryResetting) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function migrateLegacyStore() {
  Object.entries(STORE).forEach(([name, key]) => {
    const legacyKey = LEGACY_STORE[name];
    if (!legacyKey) return;
    try {
      if (localStorage.getItem(key) != null) return;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy != null) localStorage.setItem(key, legacy);
    } catch (_) {}
  });
}

function uid(prefix) {
  const rand = (window.crypto && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function placeholderCover(label, accent = '#ffa094', accent2 = '#80e5d2') {
  const a = hex(accent);
  const b = hex(accent2, '#80e5d2');
  const text = String(label || 'A').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'A';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="r" cx="30%" cy="22%" r="80%"><stop offset="0" stop-color="#ffffff" stop-opacity=".28"/><stop offset="1" stop-color="#08070a" stop-opacity="0"/></radialGradient></defs><rect width="400" height="400" fill="#121016"/><rect width="400" height="400" fill="url(#g)" opacity=".52"/><rect width="400" height="400" fill="url(#r)"/><g stroke="#fff" stroke-opacity=".18" fill="none"><circle cx="200" cy="200" r="118"/><circle cx="200" cy="200" r="82"/><circle cx="200" cy="200" r="46"/></g><path d="M0 286 Q60 250 120 282 T240 278 T400 300 V400 H0Z" fill="#08070a" opacity=".46"/><text x="28" y="367" fill="#f5eee7" font-family="Manrope, sans-serif" font-size="43" font-weight="700" letter-spacing="-2">${esc(text)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function likedCover() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa094"/><stop offset="1" stop-color="#9a5fbd"/></linearGradient></defs><rect width="400" height="400" fill="#1b1020"/><rect width="400" height="400" fill="url(#g)" opacity=".62"/><path d="M200 292c-58-36-92-70-92-112 0-27 20-47 45-47 19 0 34 11 47 32 13-21 28-32 47-32 25 0 45 20 45 47 0 42-34 76-92 112Z" fill="#fff" fill-opacity=".9"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function coverSrc(item, fallbackLabel) {
  if (item && item.cover) return item.cover;
  return placeholderCover(fallbackLabel || item?.title || item?.name || item?.artist || 'Davusic', item?.accent, item?.accent2);
}

function coverImg(item, cls = '', fallbackLabel = '') {
  const src = coverSrc(item, fallbackLabel);
  return `<img class="${esc(cls)}" src="${esc(src)}" alt="" loading="lazy" draggable="false">`;
}

function setImage(img, src) {
  if (!img) return;
  if (!src) {
    img.hidden = true;
    img.removeAttribute('src');
    return;
  }
  if (img.getAttribute('src') !== src) img.src = src;
  img.hidden = false;
}

function playlistCover(playlist) {
  if (playlist?.cover) return playlist.cover;
  const first = playlist && playlist.track_ids && playlist.track_ids.length ? trackFromId(playlist.track_ids[0]) : null;
  if (first) return coverSrc(first);
  return placeholderCover(playlist?.name || 'Playlist', playlist?.accent);
}

function playlistMosaic(trackIds, cls = '') {
  const covers = [];
  for (const id of trackIds || []) {
    const track = state.tracksById.get(id);
    if (!track) continue;
    const src = coverSrc(track);
    if (!covers.includes(src)) covers.push(src);
    if (covers.length >= 4) break;
  }
  if (!covers.length) {
    return `<div class="playlist-mosaic ${cls}"><img src="${esc(placeholderCover('Davusic'))}" alt=""></div>`;
  }
  if (covers.length === 1) {
    return `<div class="playlist-mosaic playlist-mosaic--single ${cls}"><img src="${esc(covers[0])}" alt=""></div>`;
  }
  while (covers.length < 4) covers.push(covers[covers.length % Math.max(1, new Set(covers).size)]);
  return `<div class="playlist-mosaic ${cls}">${covers.slice(0, 4).map((src) => `<img src="${esc(src)}" alt="">`).join('')}</div>`;
}

function toast(message, iconName = 'sparkle', ms = 3200) {
  if (!els.toasts) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = `${icon(iconName)}<span>${message}</span>`;
  els.toasts.appendChild(node);
  window.setTimeout(() => {
    node.classList.add('toast--out');
    window.setTimeout(() => node.remove(), 240);
  }, ms);
}

function showScan(text = 'Indexando tu música…', pct = 0) {
  if (!els.scanIndicator) return;
  state.ui.scanVisible = true;
  els.scanIndicator.hidden = false;
  els.scanText.textContent = text;
  els.scanBar.style.width = `${clamp(pct, 0, 100)}%`;
}

function hideScan(delay = 450) {
  if (!els.scanIndicator) return;
  window.setTimeout(() => {
    state.ui.scanVisible = false;
    els.scanIndicator.hidden = true;
    els.scanBar.style.width = '0%';
  }, delay);
}

/* ---------- preferencias y datos ---------- */

function applyPrefs() {
  const p = state.prefs;
  const themeId = THEMES.some((t) => t.id === p.theme) ? p.theme : 'nocturne';
  els.app.dataset.theme = themeId;
  const accentId = ACCENTS.some((a) => a.id === p.accent) ? p.accent : 'cyan';
  if (accentId === 'cyan') els.app.removeAttribute('data-accent');
  else els.app.dataset.accent = accentId;
  if (p.motion === 'reduced') els.app.dataset.motion = 'reduced';
  else els.app.removeAttribute('data-motion');
  applyFonts();
  if (typeof clearWallpaperVars === 'function') clearWallpaperVars();
  state.player.volume = clamp(Number(p.volume) || 0.78, 0, 1);
  state.player.lastVolume = state.player.volume || 0.78;
  updateProfileChrome();
}

function applyFonts() {
  if (!els.app) return;
  const pack = FONT_PACKS.some((item) => item.id === state.prefs.fontPack) ? state.prefs.fontPack : 'davito';
  const custom = state.ui.customFonts || {};
  if (pack === 'davito') els.app.removeAttribute('data-font');
  else els.app.dataset.font = pack;
  injectCustomFonts(custom);
}

function injectCustomFonts(custom) {
  let tag = document.getElementById('davusicFontFaces');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'davusicFontFaces';
    document.head.appendChild(tag);
  }
  const faces = [];
  const slots = [
    ['sans', 'Davusic Sans'],
    ['display', 'Davusic Display'],
    ['mono', 'Davusic Mono'],
  ];
  slots.forEach(([slot, family]) => {
    const font = custom[slot];
    if (!font || !font.data) return;
    const mime = font.mime || 'font/ttf';
    faces.push(`@font-face{font-family:"${family}";src:url("${font.data}") format("${fontFormat(mime, font.name)}");font-weight:100 900;font-style:normal;font-display:swap;}`);
  });
  tag.textContent = faces.join('\n');
  if (custom.sans) els.app.style.setProperty('--font-custom-sans', '"Davusic Sans"');
  if (custom.display) els.app.style.setProperty('--font-custom-display', '"Davusic Display"');
  if (custom.mono) els.app.style.setProperty('--font-custom-mono', '"Davusic Mono"');
}

function fontFormat(mime, name) {
  const lower = `${mime || ''} ${name || ''}`.toLowerCase();
  if (lower.includes('woff2')) return 'woff2';
  if (lower.includes('woff')) return 'woff';
  if (lower.includes('otf') || lower.includes('opentype')) return 'opentype';
  return 'truetype';
}

function savePrefs() {
  writeStore(STORE.prefs, state.prefs);
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function youtubeVideoId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function youtubeWatchUrl(value) {
  const id = youtubeVideoId(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : String(value || '').trim();
}

function youtubeCover(value) {
  const id = youtubeVideoId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

function sourceLabel(track, options = {}) {
  if (!track) return '';
  if (track.source === 'demo') return options.long ? 'Demo incluida · sin conexión' : 'Demo incluida';
  if (track.source === 'stream') return options.long ? 'Streaming · YouTube' : 'Streaming';
  return options.long ? 'Biblioteca local · sin conexión' : 'Archivo local';
}

function persistStreams() {
  if (!IS_TAURI) writeStore(STORE.streams, state.stream.tracks || []);
  persistCatalog();
}

function streamIdFor(track) {
  const vid = youtubeVideoId(track?.uri || track?.path || track?.src || '');
  if (vid) return `stream-${vid}`;
  return `stream-${fnv1a(`${fold(track?.title)}|${fold(track?.artist)}|${fold(track?.album || '')}`)}`;
}

function adoptStreamTrack(raw, options = {}) {
  const incoming = raw || {};
  const uri = youtubeWatchUrl(incoming.uri || incoming.path || incoming.src || '');
  const id = incoming.id && String(incoming.id).startsWith('stream-')
    ? String(incoming.id)
    : streamIdFor({ ...incoming, uri });
  const track = normalizeTrack({
    ...incoming,
    id,
    uri,
    path: '',
    src: uri,
    cover: incoming.cover || youtubeCover(uri),
    format: incoming.format || 'Streaming',
    album: incoming.album || 'Streaming',
    album_id: incoming.album_id || `stream-album-${fnv1a(`${fold(incoming.album || 'Streaming')}|${fold(incoming.artist || '')}`)}`,
    artist_id: incoming.artist_id || `stream-artist-${fnv1a(fold(incoming.artist || 'Artista desconocido'))}`,
    added_at: incoming.added_at || Date.now(),
  }, 'stream');
  if (!Array.isArray(state.stream.tracks)) state.stream.tracks = [];
  const index = state.stream.tracks.findIndex((item) => item.id === track.id);
  if (index >= 0) {
    const previous = state.stream.tracks[index];
    state.stream.tracks[index] = {
      ...previous,
      ...track,
      cover: track.cover || previous.cover,
      uri: track.uri || previous.uri,
      duration: track.duration || previous.duration,
    };
  } else {
    state.stream.tracks.push(track);
  }
  if (!options.silent) {
    persistStreams();
    rebuildLibrary();
  }
  return state.stream.tracks.find((item) => item.id === track.id) || track;
}

function collectionsFromStream(tracks) {
  const albums = new Map();
  const artists = new Map();
  (tracks || []).forEach((track) => {
    const artistId = track.artist_id || `stream-artist-${fnv1a(fold(track.artist))}`;
    if (!artists.has(artistId)) {
      artists.set(artistId, {
        id: artistId,
        name: track.artist,
        cover: track.cover || '',
        accent: track.accent,
        accent2: track.accent2,
        genres: [],
        track_ids: [],
        album_count: 0,
        source: 'stream',
      });
    }
    const artist = artists.get(artistId);
    if (!artist.track_ids.includes(track.id)) artist.track_ids.push(track.id);
    if (!artist.cover && track.cover) artist.cover = track.cover;
    const albumId = track.album_id || `stream-album-${fnv1a(`${fold(track.album)}|${fold(track.artist)}`)}`;
    if (!albums.has(albumId)) {
      albums.set(albumId, {
        id: albumId,
        title: track.album || 'Streaming',
        artist: track.artist,
        artist_id: artistId,
        cover: track.cover || '',
        accent: track.accent,
        accent2: track.accent2,
        genre: track.genre || '',
        track_ids: [],
        added_at: track.added_at || Date.now(),
        source: 'stream',
      });
    }
    const album = albums.get(albumId);
    if (!album.track_ids.includes(track.id)) album.track_ids.push(track.id);
    if (!album.cover && track.cover) album.cover = track.cover;
  });
  artists.forEach((artist) => {
    artist.album_count = [...albums.values()].filter((album) => album.artist_id === artist.id).length;
  });
  return { albums: [...albums.values()], artists: [...artists.values()] };
}

function normalizeTrack(track, source) {
  const t = track || {};
  const resolvedSource = source || t.source || 'local';
  const uri = t.uri || (resolvedSource === 'stream' ? (t.path || t.src || '') : '');
  return {
    ...t,
    id: String(t.id || uid('track')),
    source: resolvedSource,
    title: t.title || 'Sin título',
    artist: t.artist || t.album_artist || 'Artista desconocido',
    album: t.album || (resolvedSource === 'stream' ? 'Streaming' : 'Sin álbum'),
    album_artist: t.album_artist || t.artist || 'Artista desconocido',
    year: Number(t.year) || null,
    genre: t.genre || '',
    duration: Number(t.duration) || 0,
    src: t.src || t.path || uri || '',
    path: resolvedSource === 'stream' ? '' : (t.path || (resolvedSource === 'local' ? t.src : '')),
    uri,
    cover: t.cover || youtubeCover(uri),
    accent: hex(t.accent, '#ffa094'),
    accent2: hex(t.accent2, '#80e5d2'),
    track_number: Number(t.track_number) || null,
    disc_number: Number(t.disc_number) || null,
    format: t.format || (resolvedSource === 'demo' ? 'OGG Vorbis' : resolvedSource === 'stream' ? 'Streaming' : 'Audio local'),
    sample_rate: Number(t.sample_rate) || 0,
    bit_depth: Number(t.bit_depth) || 0,
    lyrics: Array.isArray(t.lyrics) ? t.lyrics : [],
    album_id: t.album_id || '',
    artist_id: t.artist_id || '',
  };
}

function normalizeLibrary(lib) {
  const data = lib || {};
  const tracks = (data.tracks || []).map((t) => normalizeTrack(t, 'local'));
  const albums = (data.albums || []).map((a) => ({ ...a, source: 'local' }));
  const artists = (data.artists || []).map((a) => ({ ...a, source: 'local' }));
  const folders = data.folders || [];
  return { tracks, albums, artists, folders };
}

function setDemoLibrary(demo) {
  const data = demo || {};
  state.demo = {
    tracks: (data.tracks || []).map((t) => normalizeTrack({ ...t, source: 'demo' }, 'demo')),
    albums: (data.albums || []).map((a) => ({ ...a, source: 'demo' })),
    artists: (data.artists || []).map((a) => ({ ...a, source: 'demo' })),
    playlists: (data.playlists || []).map((p) => ({ ...p, source: 'demo' })),
    moods: data.moods || [],
  };
  rebuildLibrary();
}

function setLocalLibrary(lib) {
  state.local = normalizeLibrary(lib);
  rebuildLibrary();
}

function rebuildLibrary() {
  const demo = state.demo;
  const local = state.local;
  const streamTracks = (state.stream.tracks || []).map((track) => normalizeTrack(track, 'stream'));
  state.stream.tracks = streamTracks;
  const includeDemo = !IS_TAURI;
  const demoTracks = includeDemo ? demo.tracks : [];
  state.allTracks = [...demoTracks, ...local.tracks, ...streamTracks];
  const storedLyrics = state.ui.lyrics?.byId || {};
  state.allTracks.forEach((track) => {
    const cached = storedLyrics[track.id];
    if (cached?.lines?.length && (!track.lyrics || !track.lyrics.length)) {
      track.lyrics = cached.lines;
      track.lyricsSynced = cached.synced;
      track.lyricsSource = cached.source;
    }
  });
  state.tracksById = new Map(state.allTracks.map((t) => [t.id, t]));

  const demoAlbums = includeDemo ? demo.albums.map((a) => {
    const ids = demo.tracks.filter((t) => t.album === a.title && (t.album_artist === a.artist || t.artist === a.artist)).map((t) => t.id);
    return { ...a, track_ids: ids, accent: hex(a.accent) };
  }) : [];
  const localAlbums = local.albums.map((a) => ({ ...a, source: 'local' }));
  const demoArtists = includeDemo ? demo.artists.map((a) => {
    const ids = demo.tracks.filter((t) => t.artist === a.name).map((t) => t.id);
    return { ...a, track_ids: ids };
  }) : [];
  const localArtists = local.artists.map((a) => ({ ...a, source: 'local' }));
  const streamCols = collectionsFromStream(streamTracks);
  state.albums = [...demoAlbums, ...localAlbums, ...streamCols.albums];
  state.artists = [...demoArtists, ...localArtists, ...streamCols.artists];

  const moodGenres = {
    'mood-night': ['synthwave', 'dream pop', 'lo-fi', 'indie'],
    'mood-focus': ['ambient', 'downtempo', 'dream pop'],
    'mood-drive': ['indie', 'lo-fi', 'synthwave'],
    'mood-calm': ['dream pop', 'ambient', 'downtempo'],
    'mood-rain': ['ambient', 'downtempo', 'dream pop'],
    'mood-lofi': ['lo-fi', 'downtempo', 'ambient'],
  };
  const moodSource = (includeDemo && demo.moods.length) ? demo.moods : [
    { id: 'mood-night', name: 'Noche', subtitle: 'Luces bajas, mente despierta', accent: '#ff79d8' },
    { id: 'mood-focus', name: 'Concentración', subtitle: 'Texturas que no interrumpen', accent: '#9bffb8' },
    { id: 'mood-drive', name: 'Carretera', subtitle: 'Kilómetros y buen sonido', accent: '#ff9d62' },
    { id: 'mood-calm', name: 'Calma', subtitle: 'El mundo puede esperar', accent: '#ffb9a6' },
    { id: 'mood-rain', name: 'Lluvia', subtitle: 'Ventana, té y estática', accent: '#88b8c9' },
    { id: 'mood-lofi', name: 'Lo-fi', subtitle: 'Nada urgente', accent: '#ffb47a' },
  ];
  state.moods = moodSource.map((m, idx) => {
    const words = moodGenres[m.id] || [];
    let tracks = state.allTracks.filter((t) => words.some((w) => fold(t.genre).includes(w)));
    if (includeDemo && tracks.length < 4) {
      const rotated = state.allTracks.slice();
      tracks = [...tracks, ...rotated.slice(idx, idx + 5)];
    }
    const ids = [...new Set(tracks.map((t) => t.id))].slice(0, 14);
    return { ...m, mood: true, track_ids: ids };
  }).filter((mood) => includeDemo || (mood.track_ids || []).length >= 2);

  state.userPlaylists = state.userPlaylists.map((p) => ({
    ...p,
    source: p.source || 'user',
    track_ids: (p.track_ids || []).filter((id) => state.tracksById.has(id) || String(id).startsWith('stream-')),
  }));
  state.playlists = [...(includeDemo ? demo.playlists : []), ...state.userPlaylists]
    .map((p) => ({ ...p, track_ids: (p.track_ids || []).filter((id) => state.tracksById.has(id) || String(id).startsWith('stream-')) }));

  pruneSignals();
  state.recs = null;
}

function trackFromId(id) {
  return state.tracksById.get(id) || null;
}

function albumById(id) {
  return state.albums.find((a) => a.id === id) || null;
}

function artistById(id) {
  return state.artists.find((a) => a.id === id) || null;
}

function playlistById(id) {
  return state.playlists.find((p) => p.id === id) || null;
}

function userPlaylistById(id) {
  return state.playlists.find((p) => p.id === id && p.source !== 'demo') || null;
}

function moodById(id) {
  return state.moods.find((m) => m.id === id) || null;
}

function albumForTrack(track) {
  if (!track) return null;
  if (track.album_id) {
    const found = albumById(track.album_id);
    if (found) return found;
  }
  return state.albums.find((a) => a.title === track.album && (a.artist === track.album_artist || a.artist === track.artist)) || null;
}

function artistForTrack(track) {
  if (!track) return null;
  if (track.artist_id) {
    const found = artistById(track.artist_id);
    if (found) return found;
  }
  return state.artists.find((a) => a.name === track.artist) || null;
}

function collectContext(key) {
  const raw = String(key || 'library');
  const sep = raw.indexOf(':');
  const kind = sep === -1 ? raw : raw.slice(0, sep);
  const id = sep === -1 ? '' : raw.slice(sep + 1);
  let tracks = [];
  let label = 'Tu biblioteca';

  if (kind === 'album') {
    const album = albumById(id);
    if (album) {
      label = album.title;
      tracks = album.track_ids.map(trackFromId).filter(Boolean);
    }
  } else if (kind === 'artist') {
    const artist = artistById(id);
    if (artist) {
      label = artist.name;
      tracks = artist.track_ids.map(trackFromId).filter(Boolean);
    }
  } else if (kind === 'playlist') {
    const playlist = playlistById(id);
    if (playlist) {
      label = playlist.name;
      tracks = (playlist.track_ids || []).map(trackFromId).filter(Boolean);
    }
  } else if (kind === 'mood') {
    const mood = moodById(id);
    if (mood) {
      label = mood.name;
      tracks = (mood.track_ids || []).map(trackFromId).filter(Boolean);
    }
  } else if (kind === 'liked') {
    label = 'Me gusta';
    tracks = state.likes.map(trackFromId).filter(Boolean);
  } else if (kind === 'recent') {
    label = 'Recientes';
    tracks = state.recents.map((r) => trackFromId(r.id)).filter(Boolean);
  } else if (kind === 'search') {
    label = `Búsqueda: ${id}`;
    const localHits = searchTracks(id);
    const onlineHits = (fold(state.ui.onlineSearch.query) === fold(id) ? state.ui.onlineSearch.results : [])
      .map((item) => trackFromId(item.id) || item)
      .filter(Boolean);
    const seen = new Set(localHits.map((track) => track.id));
    tracks = [...localHits, ...onlineHits.filter((track) => !seen.has(track.id))];
  } else if (kind === 'single') {
    tracks = [trackFromId(id)].filter(Boolean);
    label = tracks[0] ? tracks[0].title : 'Selección';
  } else if (kind === 'folder') {
    label = 'Carpeta';
    tracks = state.local.tracks;
  } else if (kind === 'foryou') {
    const snapshot = recommendationSnapshot();
    label = 'Para ti';
    tracks = snapshot.mix.map(trackFromId).filter(Boolean);
  } else if (kind === 'home') {
    label = 'Inicio';
    tracks = state.allTracks.slice(0, 20);
  } else {
    label = 'Tu biblioteca';
    tracks = sortedLocalTracks();
    if (!tracks.length) tracks = state.allTracks.slice();
  }

  return { key: raw, kind, id, label, ids: tracks.map((t) => t.id), tracks };
}

function searchTokens(query) {
  return fold(query).split(/\s+/).filter(Boolean).slice(0, 8);
}

function scoreSearchFields(fields, tokens, phrase, strict = true) {
  const normalized = fields.map((field) => fold(field || ''));
  const haystack = normalized.join(' ');
  if (!tokens.length) return 0;
  const matches = tokens.map((token) => haystack.includes(token));
  if (strict && !matches.every(Boolean)) return -1;
  const used = strict ? tokens : tokens.filter((_, index) => matches[index]);
  if (!used.length) return -1;
  let score = 0;
  used.forEach((token) => {
    if (normalized[0] === token) score += 48;
    else if (normalized[0].startsWith(token)) score += 32;
    else if (normalized[0].includes(token)) score += 21;
    normalized.slice(1).forEach((field, index) => {
      if (field === token) score += Math.max(8, 24 - index * 3);
      else if (field.startsWith(token)) score += Math.max(6, 18 - index * 3);
      else if (field.includes(token)) score += Math.max(4, 12 - index * 2);
    });
  });
  if (phrase && haystack.includes(phrase)) score += normalized[0].includes(phrase) ? 30 : 18;
  return score;
}

function rankedSearch(items, fieldsFor, query, bonusFor = null) {
  const tokens = searchTokens(query);
  if (!tokens.length) return [];
  const phrase = fold(query);
  const rank = (strict) => {
    const out = [];
    for (const item of items) {
      const score = scoreSearchFields(fieldsFor(item), tokens, phrase, strict);
      if (score < 0) continue;
      out.push({ item, score: score + (bonusFor ? Number(bonusFor(item)) || 0 : 0) });
    }
    return out;
  };
  let ranked = rank(true);
  if (!ranked.length) ranked = rank(false);
  ranked.sort((a, b) => b.score - a.score);
  return ranked.map((entry) => entry.item);
}

function trackAffinityBonus(track) {
  const signal = state.signals.tracks?.[track.id];
  const plays = Number(signal?.plays) || 0;
  const completed = Number(signal?.completes) || 0;
  return (state.likes.includes(track.id) ? 7 : 0) + Math.min(7, plays * 1.3) + Math.min(3, completed) + (track.source === 'local' ? 1 : 0);
}

function searchTracks(query) {
  return rankedSearch(state.allTracks, (track) => [track.title, track.artist, track.album, track.genre, track.album_artist], query, trackAffinityBonus);
}

function searchAlbums(query) {
  return rankedSearch(state.albums, (album) => [album.title, album.artist, album.genre], query);
}

function searchArtists(query) {
  return rankedSearch(state.artists, (artist) => [artist.name, (artist.genres || []).join(' ')], query); 
}

function searchPlaylists(query) {
  return rankedSearch(state.playlists, (playlist) => [playlist.name, playlist.description || '', playlist.source || ''], query);
}

/* ---------- motor de audio ---------- */

const browserAudio = (() => {
  const audio = new Audio();
  audio.preload = 'auto';
  const browser = {
    audio,
    async load(track) {
      audio.pause();
      audio.src = track.src;
      audio.currentTime = 0;
      audio.volume = state.player.muted ? 0 : state.player.volume;
      await audio.play();
      return { duration: Number.isFinite(audio.duration) ? audio.duration : track.duration };
    },
    async pause() { audio.pause(); },
    async resume() { await audio.play(); },
    async stop() { audio.pause(); audio.removeAttribute('src'); audio.load(); },
    async seek(seconds) { try { audio.currentTime = clamp(seconds, 0, audio.duration || 0); } catch (_) {} },
    async volume(value) { audio.volume = value; },
    read() {
      return {
        playing: !audio.paused && !audio.ended,
        position: audio.currentTime || 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : state.player.duration,
        ended: audio.ended,
      };
    },
  };
  audio.addEventListener('ended', () => {
    if (IS_TAURI) return;
    handleTrackEnded();
  });
  return browser;
})();

const nativeAudio = {
  async load(track) {
    return inv('play_track', {
      request: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        source: track.source,
        path: track.source === 'stream' ? (track.uri || track.path || track.src || '') : (track.path || track.src || ''),
        uri: track.uri || '',
        cover: track.cover || '',
        accent: track.accent || '',
      },
    });
  },
  async pause() { return inv('pause_playback'); },
  async resume() { return inv('resume_playback'); },
  async stop() { return inv('stop_playback'); },
  async seek(seconds) { return inv('seek_playback', { position: seconds }); },
  async volume(value) { return inv('set_playback_volume', { volume: value }); },
  async read() { return inv('get_player_state'); },
};

const engine = IS_TAURI ? nativeAudio : browserAudio;

/* ---------- navegación ---------- */

function currentViewKey() {
  const v = state.view;
  return `${v.name}:${v.params.id || ''}`;
}

let mainScrollResetTimer = 0;

function resetWindowScroll() {
  try {
    if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    const root = document.scrollingElement;
    if (root && (root.scrollTop || root.scrollLeft)) {
      root.scrollTop = 0;
      root.scrollLeft = 0;
    }
  } catch (_) {}
}

// La navegación siempre empieza arriba. El clase temporal desactiva
// scroll-behavior:smooth para que WebKit no conserve una animación a medias
// cuando la vista cambia (el origen del salto hacia arriba intermitente).
function resetMainScroll() {
  resetWindowScroll();
  const scroller = els.mainScroll;
  if (!scroller) return;
  scroller.classList.add('is-scroll-resetting');
  scroller.scrollTop = 0;
  scroller.scrollLeft = 0;
  window.clearTimeout(mainScrollResetTimer);
  mainScrollResetTimer = window.setTimeout(() => {
    scroller.scrollTop = 0;
    window.requestAnimationFrame(() => scroller.classList.remove('is-scroll-resetting'));
  }, 80);
}

function navigate(name, params = {}, options = {}) {
  const same = state.view.name === name && JSON.stringify(state.view.params) === JSON.stringify(params);
  if (same && !options.force) {
    if (options.focus !== false) els.view.focus({ preventScroll: true });
    return;
  }
  closeMenus();
  closeSheets();
  if (options.replace) {
    state.nav.stack[state.nav.index] = { name, params };
  } else {
    state.nav.stack = state.nav.stack.slice(0, state.nav.index + 1);
    state.nav.stack.push({ name, params });
    state.nav.index = state.nav.stack.length - 1;
  }
  state.view = { name, params };
  renderView();
  updateNavButtons();
  updateSidebarActive();
  if (!options.keepScroll) resetMainScroll();
  else resetWindowScroll();
  if (options.focus !== false) els.view.focus({ preventScroll: true });
}

function goBack() {
  if (state.nav.index <= 0) return;
  state.nav.index -= 1;
  const entry = state.nav.stack[state.nav.index];
  state.view = { name: entry.name, params: entry.params };
  renderView();
  updateNavButtons();
  updateSidebarActive();
  resetMainScroll();
}

function goForward() {
  if (state.nav.index >= state.nav.stack.length - 1) return;
  state.nav.index += 1;
  const entry = state.nav.stack[state.nav.index];
  state.view = { name: entry.name, params: entry.params };
  renderView();
  updateNavButtons();
  updateSidebarActive();
  resetMainScroll();
}

function updateNavButtons() {
  if (!els.navBack) return;
  els.navBack.disabled = state.nav.index <= 0;
  els.navForward.disabled = state.nav.index >= state.nav.stack.length - 1;
}

function openFromToken(token) {
  const raw = String(token || '');
  const sep = raw.indexOf(':');
  const kind = sep === -1 ? raw : raw.slice(0, sep);
  const id = sep === -1 ? '' : raw.slice(sep + 1);
  if (kind === 'album') navigate('album', { id });
  else if (kind === 'artist') navigate('artist', { id });
  else if (kind === 'playlist') navigate('playlist', { id });
  else if (kind === 'mood') navigate('mood', { id });
  else if (kind === 'liked') navigate('liked');
  else if (kind === 'library') navigate('library');
  else if (kind === 'recent') navigate('recent');
  else if (kind === 'explore') navigate('explore');
  else if (kind === 'home') navigate('home');
  else if (kind === 'foryou') navigate('foryou');
  else if (kind === 'radio') navigate('radio');
  else if (kind === 'search') navigate('search', { q: id || state.ui.query || '' });
}

/* ---------- render raíz ---------- */

function renderView() {
  if (!els.view) return;
  const v = state.view;
  let html = '';
  if (v.name === 'home') html = renderHome();
  else if (v.name === 'foryou') html = renderForYou();
  else if (v.name === 'explore') html = renderExplore();
  else if (v.name === 'library') html = renderLibrary();
  else if (v.name === 'liked') html = renderLiked();
  else if (v.name === 'recent') html = renderRecent();
  else if (v.name === 'radio') html = renderRadio();
  else if (v.name === 'search') html = renderSearch(v.params.q || '');
  else if (v.name === 'album') html = renderAlbum(v.params.id);
  else if (v.name === 'artist') html = renderArtist(v.params.id);
  else if (v.name === 'playlist') html = renderPlaylist(v.params.id);
  else if (v.name === 'mood') html = renderMood(v.params.id);
  else html = emptyState('compass', 'Nada por aquí', 'Esta vista no existe. Vuelve al inicio.', '<button class="btn btn--primary" data-open="home">Volver al inicio</button>');

  els.view.innerHTML = html;
  document.title = viewTitle();
  updatePlaybackClasses();
  updateLyricsHighlight();
  updateSidebarActive();
  if (v.name === 'search') {
    state.ui.query = v.params.q || '';
    if (els.searchInput.value !== state.ui.query) els.searchInput.value = state.ui.query;
    updateSearchBox();
  }
}

function viewTitle() {
  const v = state.view;
  if (v.name === 'home') return 'Davusic — tu música, sin ruido';
  if (v.name === 'foryou') return 'Para ti — Davusic';
  if (v.name === 'library') return 'Biblioteca — Davusic';
  if (v.name === 'explore') return 'Explorar — Davusic';
  if (v.name === 'liked') return 'Me gusta — Davusic';
  if (v.name === 'recent') return 'Recientes — Davusic';
  if (v.name === 'radio') return 'Radio local — Davusic';
  if (v.name === 'search') return `${v.params.q ? v.params.q + ' — ' : ''}Buscar — Davusic`;
  if (v.name === 'album') return `${albumById(v.params.id)?.title || 'Álbum'} — Davusic`;
  if (v.name === 'artist') return `${artistById(v.params.id)?.name || 'Artista'} — Davusic`;
  if (v.name === 'playlist') return `${playlistById(v.params.id)?.name || 'Playlist'} — Davusic`;
  if (v.name === 'mood') return `${moodById(v.params.id)?.name || 'Momento'} — Davusic`;
  return 'Davusic';
}

/* ---------- piezas de interfaz ---------- */

function emptyState(iconName, title, text, actions = '', extra = '') {
  return `<div class="empty-state ${extra}">
    <span class="empty-state__icon">${icon(iconName)}</span>
    <h3>${title}</h3>
    <p>${text}</p>
    ${actions}
  </div>`;
}

function sectionHead(kicker, title, actions = '') {
  return `<div class="section-head">
    <div class="section-head__left">
      ${kicker ? `<div class="section-kicker">${kicker}</div>` : ''}
      <h2 class="section-title">${title}</h2>
    </div>
    ${actions ? `<div class="section-head__actions">${actions}</div>` : ''}
  </div>`;
}

function pageHead(kicker, title, sub = '', aside = '') {
  return `<header class="page-head">
    <div class="page-head__copy">
      <div class="eyebrow">${kicker}</div>
      <h1>${title}</h1>
      ${sub ? `<p class="page-head__sub">${sub}</p>` : ''}
    </div>
    ${aside ? `<div class="page-head__aside">${aside}</div>` : ''}
  </header>`;
}

function quickCard({ open, play, cover, title, sub, accent = '#ffa094', playing = false }) {
  return `<div class="quick-card ${playing ? 'is-playing' : ''}" data-open="${esc(open)}" tabindex="0" role="link" aria-label="${esc(title)}">
    <img class="quick-card__art" src="${esc(cover)}" alt="" loading="lazy" draggable="false">
    <span class="quick-card__copy"><strong>${esc(title)}</strong><span>${esc(sub)}</span></span>
    ${play ? `<button class="quick-card__play" data-play-context="${esc(play)}" aria-label="Reproducir ${esc(title)}">${icon('play')}</button>` : ''}
  </div>`;
}

function mediaCard(item, type, options = {}) {
  const isArtist = type === 'artist';
  const key = `${type}:${item.id}`;
  const ctx = collectContext(key);
  const playing = isContextPlaying(key);
  const cover = options.mosaic ? playlistMosaic(item.track_ids || []) : coverImg(item, '', item.title || item.name);
  const title = esc(item.title || item.name || 'Sin título');
  const sub = esc(options.sub || (isArtist ? (item.genres || []).slice(0, 2).join(' · ') || plural(ctx.ids.length, 'canción', 'canciones') : `${item.artist || ''}${item.year ? ` · ${item.year}` : ''}`));
  const badge = options.badge ? `<span class="media-card__badge">${esc(options.badge)}</span>` : '';
  return `<article class="media-card ${isArtist ? 'media-card--artist' : ''} ${playing ? 'is-playing' : ''}" data-open="${esc(key)}" data-card-context="${esc(key)}" tabindex="0" aria-label="${title}">
    <div class="media-card__art" style="--card-accent-rgb:${rgbTriplet(item.accent)}">
      ${cover}
      ${badge}
      <span class="media-card__eq"><span class="equalizer"><span></span><span></span><span></span><span></span></span></span>
      <button class="media-card__play" data-play-context="${esc(key)}" aria-label="Reproducir ${title}">${icon('play')}</button>
    </div>
    <div class="media-card__title">${title}</div>
    <div class="media-card__sub">${sub}</div>
  </article>`;
}

function trackRow(track, index, contextKey, options = {}) {
  if (!track) return '';
  const current = state.player.trackId === track.id;
  const liked = state.likes.includes(track.id);
  const number = options.number != null ? options.number : (track.track_number || index + 1);
  const compact = options.compact ? 'tracklist--compact' : '';
  return `<div class="track-row ${current ? 'is-current' : ''}" data-row-track="${esc(track.id)}" data-context-key="${esc(contextKey)}" draggable="true" tabindex="0" aria-label="${esc(track.title)} de ${esc(track.artist)}">
    <div class="track-row__index">
      <span class="track-num">${number}</span>
      <svg class="ico player-glyph"><use href="#i-play"/></svg>
      <span class="equalizer"><span></span><span></span><span></span><span></span></span>
    </div>
    <div class="track-row__cover">${coverImg(track, '', track.title)}</div>
    <div class="track-row__main">
      <div class="track-row__title">${esc(track.title)}</div>
      <div class="track-row__artist">${esc(track.artist)}${options.showGenre && track.genre ? ` · ${esc(track.genre)}` : ''}</div>
    </div>
    ${options.hideAlbum ? '' : `<div class="track-row__album">${esc(track.album)}</div>`}
    <div class="track-row__duration">${fmtTime(track.duration)}</div>
    <div class="track-row__actions">
      <button class="icon-btn ${liked ? 'is-liked' : ''}" data-like="${esc(track.id)}" aria-label="${liked ? 'Quitar de Me gusta' : 'Me gusta'}" title="Me gusta">
        <svg class="ico"><use href="#i-${liked ? 'heart-fill' : 'heart'}"/></svg>
      </button>
      <button class="icon-btn" data-more-track="${esc(track.id)}" aria-label="Más opciones" title="Más opciones">${icon('more')}</button>
    </div>
  </div>`;
}

function tracklist(tracks, contextKey, options = {}) {
  const list = (tracks || []).filter(Boolean);
  if (!list.length) {
    return options.emptyHtml || `<div class="inline-empty">${options.emptyText || 'No hay canciones aquí todavía.'}</div>`;
  }
  const windowSize = options.window || 80;
  const shown = options.limit
    ? Math.min(options.limit, list.length)
    : Math.min(list.length, state.ui.listWindow[contextKey] || windowSize);
  const visible = list.slice(0, shown);
  const simple = options.simple !== false;
  const head = simple
    ? `<div class="tracklist__head"><span>#</span><span></span><span>Título</span><span style="text-align:right">Duración</span><span></span></div>`
    : `<div class="tracklist__head"><span>#</span><span></span><span>Título</span><span>Álbum</span><span>Duración</span><span></span></div>`;
  const more = shown < list.length
    ? `<div class="list-more"><button class="btn btn--soft" data-list-more="${esc(contextKey)}" data-list-total="${list.length}">Mostrar más (${shown} de ${list.length})</button></div>`
    : '';
  return `<div class="tracklist ${simple ? 'tracklist--simple' : ''} ${options.compact ? 'tracklist--compact' : ''}">
    ${options.hideHead ? '' : head}
    ${visible.map((track, idx) => trackRow(track, idx, contextKey, { ...options, hideAlbum: simple })).join('')}
  </div>${more}`;
}

function playableContextButton(key, label, cls = 'btn btn--primary', iconName = 'play') {
  const playing = isContextPlaying(key) && state.player.playing;
  return `<button class="${cls}" data-play-context="${esc(key)}">${icon(playing ? 'pause' : iconName)}<span>${esc(label)}</span></button>`;
}

function shuffleButton(key, cls = 'icon-btn') {
  const on = state.player.shuffle;
  return `<button class="${cls} ${on ? 'is-on' : ''}" data-shuffle-context="${esc(key)}" aria-label="Aleatorio" title="Aleatorio">${icon('shuffle')}</button>`;
}

/* ---------- inicio ---------- */

function featuredAlbum() {
  const pool = state.albums.filter((a) => a.source !== 'demo' && (a.track_ids || []).length);
  if (!pool.length) return state.albums[0] || null;
  const day = Math.floor(Date.now() / 86400000);
  return pool[day % pool.length];
}

function renderHome() {
  if (!state.allTracks.length) {
    return `<section class="hero" style="--hero-accent:#ffa094;--hero-accent-rgb:255,160,148">
      <div class="hero__copy">
        <div class="hero__eyebrow">${icon('sparkle')}<span>Davusic</span></div>
        <h1 class="hero__title">Tu música,<em>sin ruido.</em></h1>
        <p class="hero__lede">Importa tus playlists de Spotify, busca en YouTube o añade una carpeta. Nada se descarga de golpe: las canciones se streamean cuando las pones.</p>
        <div class="hero__actions">
          <button class="btn btn--primary" data-import>${icon('spotify')} Importar playlists</button>
          <button class="btn btn--ghost" data-open="search">${icon('search')} Buscar canciones</button>
        </div>
      </div>
    </section>
    <section class="section">
      ${emptyState('folder-plus', 'La biblioteca está en calma', 'Trae un ZIP, conecta Spotify o busca una canción para streamearla ahora.', `<button class="btn btn--primary" data-import>${icon('plus')} Importar</button>`)}
    </section>`;
  }
  const album = featuredAlbum();
  const featuredTracks = album ? (album.track_ids || []).map(trackFromId).filter(Boolean) : [];
  const feature = featuredTracks[0] || state.allTracks[0];
  const featureCover = album ? coverSrc(album) : coverSrc(feature, 'Davusic');
  const accent = album?.accent || feature?.accent || '#ffa094';
  const accent2 = feature?.accent2 || '#80e5d2';
  const recent = state.recents.map((r) => trackFromId(r.id)).filter(Boolean).slice(0, 6);
  const albums = state.albums.slice(0, 6);
  const playlists = state.playlists.slice(0, 4);
  const artists = state.artists.slice(0, 6);
  const quick = [
    { open: 'liked', play: 'liked', cover: likedCover(), title: 'Me gusta', sub: plural(state.likes.length, 'canción', 'canciones'), playing: isContextPlaying('liked') },
    { open: 'library', play: 'library', cover: placeholderCover('Biblioteca', '#ffa094', '#80e5d2'), title: 'Biblioteca', sub: plural(state.local.tracks.length, 'pista local', 'pistas locales'), playing: isContextPlaying('library') },
    ...playlists.map((p) => ({ open: `playlist:${p.id}`, play: `playlist:${p.id}`, cover: playlistCover(p), title: p.name, sub: plural((p.track_ids || []).length, 'canción', 'canciones'), playing: isContextPlaying(`playlist:${p.id}`) })),
    ...albums.slice(0, 2).map((a) => ({ open: `album:${a.id}`, play: `album:${a.id}`, cover: coverSrc(a), title: a.title, sub: a.artist, playing: isContextPlaying(`album:${a.id}`) })),
  ].slice(0, 6);

  const hero = `<section class="hero" style="--hero-cover:${cssUrl(featureCover)};--hero-accent:${hex(accent)};--hero-accent-rgb:${rgbTriplet(accent)}">
    <div class="hero__copy">
      <div class="hero__eyebrow">
        ${icon('sparkle')}<span>Selección de hoy</span><span class="hero__eyebrow-divider"></span><span class="dim">${esc(album?.year || 'Siempre a mano')}</span>
      </div>
      <h1 class="hero__title">Tu música,<em>sin ruido.</em></h1>
      <p class="hero__lede">${album ? `${esc(album.title)} es el punto de partida. ${esc(album.artist)} suena mejor cuando nadie más decide por ti.` : 'Tu biblioteca, tus reglas. Sin anuncios, sin cuentas y sin telemetría.'}</p>
      <div class="hero__actions">
        ${featuresButton(album, feature)}
        <button class="btn btn--ghost" data-open="explore">${icon('compass')} Explorar</button>
      </div>
      <div class="hero__meta">
        ${album ? `<img src="${esc(coverSrc(album))}" alt=""><strong>${esc(album.artist)}</strong><span class="hero__meta-divider"></span><span>${esc(album.title)}</span><span class="hero__meta-divider"></span><span>${plural((album.track_ids || []).length, 'canción', 'canciones')}</span>` : `<strong>Davusic</strong><span class="hero__meta-divider"></span><span>Local-first</span><span class="hero__meta-divider"></span><span>Sin anuncios</span>`}
      </div>
    </div>
    <div class="hero__visual">
      <div class="hero__orbit"></div>
      <button class="hero__cover" data-open="${album ? `album:${esc(album.id)}` : 'explore'}" aria-label="Abrir ${esc(album?.title || 'Explorar')}">
        <img src="${esc(featureCover)}" alt="" draggable="false">
      </button>
      <span class="hero__sticker"><span class="status-dot"></span> Sin anuncios</span>
      ${feature ? `<button class="hero__now-card" data-play-track="${esc(feature.id)}" data-context-key="${album ? `album:${esc(album.id)}` : 'home'}" aria-label="Reproducir ${esc(feature.title)}">
        <img src="${esc(coverSrc(feature))}" alt="">
        <span class="hero__now-copy"><small>Ahora en tu biblioteca</small><strong>${esc(feature.title)}</strong><span>${esc(feature.artist)} · ${fmtTime(feature.duration)}</span></span>
        <span class="hero__now-play">${icon('play')}</span>
      </button>` : ''}
    </div>
  </section>`;

  return `${hero}
  <section class="section section--tight">
    ${sectionHead('A mano', 'Empieza por <em>aquí</em>', `<button class="section-head__link" data-open="library">Ver biblioteca ${icon('arrow-right')}</button>`)}
    <div class="quick-grid">${quick.map(quickCard).join('')}</div>
  </section>
  <section class="section">
    ${sectionHead('Recomendado sin algoritmo', 'Hecho para <em>tus oídos</em>', `<button class="section-head__link" data-open="library">Ver todo ${icon('arrow-right')}</button>`)}
    <div class="media-grid media-grid--six">${albums.map((a) => mediaCard(a, 'album')).join('')}</div>
  </section>
  ${recent.length ? `<section class="section">
    ${sectionHead('Escuchado hace poco', 'Retoma el <em>hilo</em>', `<button class="section-head__link" data-open="recent">Recientes ${icon('arrow-right')}</button>`)}
    <div class="tracklist-wrap">${tracklist(recent, 'recent', { simple: true, hideAlbum: true })}</div>
  </section>` : ''}
  ${renderRecommendationSpotlight()}
  <section class="editorial">
    <img class="editorial__bg" src="${esc(coverSrc(album || feature, 'Davusic'))}" alt="">
    <div class="editorial__copy">
      <div class="editorial__eyebrow"><span class="status-dot"></span> Davusic · privado por diseño</div>
      <h2>Escuchar debería ser <em>tan simple</em> como respirar.</h2>
      <p>Sin anuncios, sin recomendaciones que te empujan y sin enviar un solo dato. Solo tú y tu música, en tu escritorio.</p>
      <div class="editorial__actions">
        <button class="btn btn--primary" data-play-context="${playlists[0] ? `playlist:${esc(playlists[0].id)}` : 'library'}">${icon('play')} Poner algo</button>
        <button class="btn btn--ghost" data-open-settings>${icon('shield')} Privacidad</button>
      </div>
    </div>
    <div class="editorial__wave" aria-hidden="true">${Array.from({ length: 21 }, (_, i) => `<span style="--h:${18 + ((i * 17) % 72)}px"></span>`).join('')}</div>
  </section>
  <section class="section">
    ${sectionHead('Voces cercanas', 'Artistas que te <em>acompañan</em>', `<button class="section-head__link" data-open="library">Ver artistas ${icon('arrow-right')}</button>`)}
    <div class="media-grid media-grid--six">${artists.map((a) => mediaCard(a, 'artist')).join('')}</div>
  </section>
  <section class="section">
    ${sectionHead('Listas con intención', 'Tus <em>playlists</em>', `<button class="section-head__link" data-open="library">Gestionar ${icon('arrow-right')}</button>`)}
    <div class="quick-grid">${playlists.map((p) => quickCard({
      open: `playlist:${p.id}`, play: `playlist:${p.id}`,
      cover: playlistCover(p),
      title: p.name, sub: `${plural((p.track_ids || []).length, 'canción', 'canciones')} · ${p.source === 'demo' ? 'Demo incluida' : 'Tuya'}`,
      playing: isContextPlaying(`playlist:${p.id}`),
    })).join('')}</div>
  </section>`;
}

function featuresButton(album, feature) {
  if (album) return playableContextButton(`album:${album.id}`, 'Reproducir', 'btn btn--primary');
  if (feature) return `<button class="btn btn--primary" data-play-track="${esc(feature.id)}" data-context-key="home">${icon('play')} Reproducir</button>`;
  return `<button class="btn btn--primary" data-open="library">${icon('folder-plus')} Importar música</button>`;
}

/* ---------- explorar ---------- */

function renderExplore() {
  const moodCards = state.moods.filter((mood) => (mood.track_ids || []).length).map((mood) => {
    const playing = isContextPlaying(`mood:${mood.id}`);
    return `<button class="mood-card ${playing ? 'is-playing' : ''}" data-open="mood:${esc(mood.id)}" style="--mood-rgb:${rgbTriplet(mood.accent)}">
      <img class="mood-card__bg" src="${esc(coverSrc(mood))}" alt="" loading="lazy">
      <span class="mood-card__eyebrow">${esc(mood.subtitle || 'Momento')}</span>
      <span class="mood-card__name">${esc(mood.name)}</span>
      <span class="mood-card__sub">${plural((mood.track_ids || []).length, 'canción', 'canciones')}</span>
      <span class="mood-card__play" data-play-context="mood:${esc(mood.id)}" role="button" aria-label="Reproducir ${esc(mood.name)}">${icon('play')}</span>
    </button>`;
  }).join('');

  const stations = state.artists.slice(0, 5).map((artist) => `<button class="station-card" data-play-context="artist:${esc(artist.id)}" data-shuffle-context="true">
    <span class="station-card__art"><img src="${esc(coverSrc(artist))}" alt=""></span>
    <span class="station-card__copy"><strong>Radio ${esc(artist.name)}</strong><span>${esc((artist.genres || [])[0] || 'Mezcla de artista')} · sin fin</span></span>
    <span class="station-card__live">Local</span>
  </button>`);
  if (state.local.tracks.length) {
    stations.unshift(`<button class="station-card" data-play-context="library" data-shuffle-context="true">
      <span class="station-card__art"><img src="${esc(placeholderCover('Mezcla', '#ffa094', '#80e5d2'))}" alt=""></span>
      <span class="station-card__copy"><strong>Mezcla de tu biblioteca</strong><span>Todo lo local, en orden imprevisible</span></span>
      <span class="station-card__live">En vivo</span>
    </button>`);
  }

  const genres = [...new Set(state.allTracks.map((t) => t.genre).filter(Boolean))].slice(0, 12);
  const localAlbums = state.albums.filter((a) => a.source === 'local');
  const newAlbums = (localAlbums.length ? localAlbums : state.albums).slice(0, 6);

  return `${pageHead('Explorar sin algoritmo', 'Deja que el oído <em>decida</em>', 'Nada de feeds infinitos. Solo música, momentos y tu propia biblioteca.', `<button class="btn btn--soft" data-import>${icon('folder-plus')} Importar música</button>`)}
  <section class="section section--tight">
    ${moodCards ? `${sectionHead('Estados de ánimo', '¿Cómo suena <em>ahora</em>?', '')}
    <div class="mood-grid">${moodCards}</div>` : `${sectionHead('Estados de ánimo', '¿Cómo suena <em>ahora</em>?', '')}
    <div class="inline-empty">Importa música o busca canciones para armar momentos.</div>`}
  </section>
  <section class="section">
    ${sectionHead('Radio local', 'Sin fin, sin <em>suscripción</em>', `<span class="section-head__link">Beta ${icon('radio')}</span>`)}
    <div class="station-grid">${stations.slice(0, 6).join('')}</div>
  </section>
  <section class="section">
    ${sectionHead('Géneros en tu biblioteca', 'Encuentra tu <em>textura</em>', '')}
    <div class="genre-wrap">${genres.map((g) => `<button class="genre-pill" data-genre="${esc(g)}">${esc(g)}</button>`).join('')}</div>
  </section>
  <section class="section">
    ${sectionHead('Recién llegado', 'Nuevo en tu <em>biblioteca</em>', `<button class="section-head__link" data-open="library">Ver álbumes ${icon('arrow-right')}</button>`)}
    <div class="media-grid media-grid--six">${newAlbums.map((a) => mediaCard(a, 'album')).join('')}</div>
  </section>
  <section class="section">
    ${sectionHead('Para cualquier plan', 'Playlists <em>listas</em>', '')}
    <div class="quick-grid">${state.playlists.slice(0, 6).map((p) => quickCard({
      open: `playlist:${p.id}`, play: `playlist:${p.id}`,
      cover: playlistCover(p),
      title: p.name, sub: p.description || plural((p.track_ids || []).length, 'canción', 'canciones'),
      playing: isContextPlaying(`playlist:${p.id}`),
    })).join('')}</div>
  </section>`;
}

/* ---------- biblioteca ---------- */

function sortedLocalTracks() {
  const seen = new Set();
  const tracks = [];
  [...state.local.tracks, ...state.allTracks.filter((track) => track.source === 'stream')].forEach((track) => {
    if (!track || seen.has(track.id)) return;
    seen.add(track.id);
    tracks.push(track);
  });
  const mode = state.ui.librarySort;
  if (mode === 'artist') tracks.sort((a, b) => a.artist.localeCompare(b.artist) || a.album.localeCompare(b.album) || (a.track_number || 0) - (b.track_number || 0));
  else if (mode === 'album') tracks.sort((a, b) => a.album.localeCompare(b.album) || (a.track_number || 0) - (b.track_number || 0));
  else if (mode === 'recent') tracks.sort((a, b) => (b.added_at || 0) - (a.added_at || 0));
  else tracks.sort((a, b) => a.title.localeCompare(b.title));
  return tracks;
}

function renderLibrary() {
  const tracks = sortedLocalTracks();
  const albums = state.albums.filter((a) => a.source === 'local' || a.source === 'stream');
  const artists = state.artists.filter((a) => a.source === 'local' || a.source === 'stream');
  const folders = state.local.folders || [];
  const filter = state.ui.libraryFilter;
  const totalSeconds = tracks.reduce((sum, t) => sum + t.duration, 0);
  const chips = [
    ['all', 'Todo'], ['tracks', 'Canciones'], ['albums', 'Álbumes'], ['artists', 'Artistas'],
  ].map(([id, label]) => `<button class="chip ${filter === id ? 'is-active' : ''}" data-library-filter="${id}">${label}</button>`).join('');

  const summary = `<div class="library-summary">
    <span class="library-summary__item">${icon('music')}<strong>${tracks.length}</strong> pistas</span>
    <span class="library-summary__item">${icon('disc')}<strong>${albums.length}</strong> álbumes</span>
    <span class="library-summary__item">${icon('mic')}<strong>${artists.length}</strong> artistas</span>
    <span class="library-summary__item">${icon('clock')}<strong>${fmtLong(totalSeconds)}</strong> de música</span>
    <span class="library-summary__spacer"></span>
    ${folders.length ? `<span class="library-summary__item">${icon('folder')}<strong>${folders.length}</strong> ${folders.length === 1 ? 'carpeta' : 'carpetas'}</span>` : ''}
  </div>`;

  const folderList = folders.length ? `<section class="section section--tight">
    ${sectionHead('Orígenes', 'Carpetas <em>indexadas</em>', `<button class="section-head__link" data-rescan>${icon('refresh')} Reescanear</button>`)}
    <div class="folder-list">${folders.map((folder) => `<div class="folder-row">
      <span class="folder-row__icon">${icon('folder')}</span>
      <span class="folder-row__copy"><strong>${esc(folder.name || folder.path.split('/').pop())}</strong><span>${esc(folder.path)}</span></span>
      <span class="folder-row__count">${plural(folder.track_count || 0, 'pista', 'pistas')}</span>
      <button class="icon-btn icon-btn--small" data-open-folder="${esc(folder.path)}" title="Abrir carpeta" aria-label="Abrir carpeta">${icon('folder')}</button>
      <button class="icon-btn icon-btn--small" data-remove-folder="${esc(folder.path)}" title="Quitar carpeta" aria-label="Quitar carpeta">${icon('x')}</button>
    </div>`).join('')}</div>
  </section>` : '';

  const emptyLibrary = `<section class="section section--tight">${emptyState('folder-plus', 'Tu biblioteca empieza aquí', 'Añade una carpeta, importa un ZIP o conecta Spotify. Las playlists se guardan como referencia y se streamean al pulsar play.', `<button class="btn btn--primary" data-import>${icon('folder-plus')} Importar música</button><button class="btn btn--ghost" data-open="search">${icon('search')} Buscar canciones</button>`)}</section>`;

  const albumsSection = albums.length ? `<section class="section">
    ${sectionHead('Colecciones', 'Álbumes <em>locales</em>', '')}
    <div class="media-grid media-grid--six">${albums.map((a) => mediaCard(a, 'album')).join('')}</div>
  </section>` : '';

  const artistsSection = artists.length ? `<section class="section">
    ${sectionHead('Cercanos', 'Artistas <em>locales</em>', '')}
    <div class="media-grid media-grid--six">${artists.map((a) => mediaCard(a, 'artist')).join('')}</div>
  </section>` : '';

  const tracksSection = tracks.length ? `<section class="section">
    ${sectionHead('Todas las pistas', 'Canciones <em>locales</em>', `<span class="section-head__link">${plural(tracks.length, 'pista', 'pistas')}</span>`)}
    <div class="filter-row">
      <select class="sort-select" data-library-sort aria-label="Ordenar canciones">
        <option value="title" ${state.ui.librarySort === 'title' ? 'selected' : ''}>Título A–Z</option>
        <option value="artist" ${state.ui.librarySort === 'artist' ? 'selected' : ''}>Artista</option>
        <option value="album" ${state.ui.librarySort === 'album' ? 'selected' : ''}>Álbum</option>
        <option value="recent" ${state.ui.librarySort === 'recent' ? 'selected' : ''}>Añadido recientemente</option>
      </select>
      <span class="filter-row__spacer"></span>
      <span class="section-head__link">${icon('shield')} Solo en tu equipo</span>
    </div>
    <div class="tracklist-wrap">${tracklist(tracks, 'library', { simple: true, showGenre: true })}</div>
  </section>` : '';

  let body = '';
  if (filter === 'tracks') body = tracksSection || emptyLibrary;
  else if (filter === 'albums') body = albumsSection || emptyLibrary;
  else if (filter === 'artists') body = artistsSection || emptyLibrary;
  else body = `${tracks.length || albums.length ? '' : emptyLibrary}${albumsSection}${artistsSection}${tracksSection}`;

  return `${pageHead('Tu música, sin intermediarios', 'La <em>biblioteca</em>', 'Archivos locales, etiquetas reales y ninguna nube mirando por encima del hombro.', `<button class="btn btn--primary" data-import>${icon('folder-plus')} Importar</button>`)}
  ${summary}
  <div class="filter-row">${chips}<span class="filter-row__spacer"></span>${folders.length ? `<button class="btn btn--soft" data-rescan>${icon('refresh')} Actualizar</button>` : ''}</div>
  ${body}
  ${folderList}`;
}

/* ---------- me gusta y recientes ---------- */

function likedTracks() {
  return state.likes.map(trackFromId).filter(Boolean);
}

function renderLiked() {
  const tracks = likedTracks();
  const seconds = tracks.reduce((s, t) => s + t.duration, 0);
  if (!tracks.length) {
    return `${pageHead('Guardado para ti', 'Me <em>gusta</em>', 'Las canciones que marques con el corazón aparecerán aquí, en el orden en que las guardaste.')}
      ${emptyState('heart', 'Todavía no hay corazones', 'Pulsa el corazón de cualquier canción, álbum o en el reproductor. Nada se sube a ninguna parte.', `<button class="btn btn--primary" data-open="home">${icon('home')} Volver al inicio</button><button class="btn btn--ghost" data-open="explore">${icon('compass')} Descubrir algo</button>`)}`;
  }
  return `${pageHead('Tu selección personal', 'Me <em>gusta</em>', 'Lo que has guardado, sin mezclas automáticas ni canciones que no pediste.')}
  <section class="detail-hero liked-hero" style="--detail-cover:${cssUrl(likedCover())}">
    <div class="liked-cover">${icon('heart-fill')}</div>
    <div class="detail-hero__copy">
      <div class="detail-type"><span class="status-dot"></span> Colección personal</div>
      <h1 class="detail-title">Me gusta</h1>
      <p class="detail-desc">Una lista que solo crece cuando tú quieres. Sin sugerencias, sin anuncios y sin fecha de caducidad.</p>
      <div class="detail-meta"><strong>${plural(tracks.length, 'canción', 'canciones')}</strong><span class="detail-meta__dot"></span><span>${fmtLong(seconds)}</span><span class="detail-meta__dot"></span><span>Local-first</span></div>
      <div class="detail-actions">
        ${playableContextButton('liked', 'Reproducir')}
        ${shuffleButton('liked')}
        <span class="detail-actions__separator"></span>
        <span class="detail-meta">${icon('shield')} Nada sale de tu equipo</span>
      </div>
    </div>
  </section>
  <section class="detail-body"><div class="tracklist-wrap">${tracklist(tracks, 'liked', { simple: true })}</div></section>`;
}

function renderRecent() {
  const tracks = state.recents.map((r) => trackFromId(r.id)).filter(Boolean);
  if (!tracks.length) {
    return `${pageHead('Memoria local', 'Recientes', 'Tu historial vive solo en este equipo. Aquí verás lo último que sonó.')}
      ${emptyState('clock', 'Aún no has escuchado nada', 'Pon una canción y aparecerá aquí. No hay cuentas ni servidores guardando tu historial.', `<button class="btn btn--primary" data-play-context="library">${icon('play')} Reproducir biblioteca</button><button class="btn btn--ghost" data-open="explore">${icon('compass')} Explorar</button>`)}`;
  }
  return `${pageHead('Solo en tu equipo', 'Escuchado <em>reciente</em>', 'El orden real de tus últimas escuchas. Sin filtros invisibles ni perfil publicitario.')}
  <div class="library-summary">
    <span class="library-summary__item">${icon('clock')}<strong>${tracks.length}</strong> pistas recientes</span>
    <span class="library-summary__item">${icon('shield')} Historial local</span>
    <span class="library-summary__spacer"></span>
    <button class="link-btn" data-clear-recents>Borrar historial</button>
  </div>
  <section class="detail-body"><div class="tracklist-wrap">${tracklist(tracks, 'recent', { simple: true, showGenre: true })}</div></section>`;
}

/* ---------- radio ---------- */

function renderRadio() {
  const stations = [];
  if (state.local.tracks.length) {
    stations.push({
      key: 'library', name: 'Mezcla de tu biblioteca', sub: `${plural(state.local.tracks.length, 'pista local', 'pistas locales')} en orden imprevisible`,
      cover: placeholderCover('Mezcla', '#ffa094', '#80e5d2'), live: 'En vivo',
    });
  }
  state.artists.slice(0, 8).forEach((artist) => {
    const ids = (artist.track_ids || []).map(trackFromId).filter(Boolean);
    if (!ids.length) return;
    stations.push({
      key: `artist:${artist.id}`, name: `Radio ${artist.name}`, sub: `${(artist.genres || [])[0] || 'Mezcla de artista'} · ${plural(ids.length, 'pista', 'pistas')}`,
      cover: coverSrc(artist), live: 'Local',
    });
  });
  state.moods.filter((m) => (m.track_ids || []).length).slice(0, 3).forEach((mood) => {
    stations.push({ key: `mood:${mood.id}`, name: `Radio ${mood.name}`, sub: mood.subtitle || 'Selección por ambiente', cover: coverSrc(mood), live: 'Beta' });
  });
  if (!stations.length) {
    return `${pageHead('Radio local', 'Sin <em>algoritmo</em>', 'Cuando tu biblioteca tenga música, aquí aparecerán mezclas infinitas hechas con tus propios archivos.')}
      ${emptyState('radio', 'La radio necesita combustible', 'Importa playlists o busca canciones. Las radios se construyen con tus artistas y estados de ánimo.', `<button class="btn btn--primary" data-import>${icon('folder-plus')} Importar música</button><button class="btn btn--ghost" data-open="search">${icon('search')} Buscar</button>`)}`;
  }
  return `${pageHead('Radio local · beta', 'Sin fin, sin <em>suscripción</em>', 'Mezclas generadas en tu equipo a partir de artistas, géneros y momentos. Cada sesión suena distinta porque es tuya.')}
  <section class="section section--tight">
    ${sectionHead('Estaciones', 'Elige una <em>frecuencia</em>', '')}
    <div class="station-grid">${stations.map((s) => `<button class="station-card" data-play-context="${esc(s.key)}" data-shuffle-context="true" data-station-start="${esc(s.key)}">
      <span class="station-card__art"><img src="${esc(s.cover)}" alt=""></span>
      <span class="station-card__copy"><strong>${esc(s.name)}</strong><span>${esc(s.sub)}</span></span>
      <span class="station-card__live">${esc(s.live)}</span>
    </button>`).join('')}</div>
  </section>
  <section class="editorial">
    <img class="editorial__bg" src="${esc(coverSrc(state.albums[0], 'Davusic'))}" alt="">
    <div class="editorial__copy">
      <div class="editorial__eyebrow"><span class="status-dot"></span> Cómo funciona</div>
      <h2>Sin nube. Sin <em>perfil</em>. Sin repetir.</h2>
      <p>La radio baraja tus pistas y evita lo que acabas de oír. Todo ocurre en memoria: al cerrar Davusic, no queda rastro en ningún servidor.</p>
      <div class="editorial__actions"><button class="btn btn--ghost" data-open-settings>${icon('sliders')} Ajustes</button></div>
    </div>
    <div class="editorial__wave" aria-hidden="true">${Array.from({ length: 19 }, (_, i) => `<span style="--h:${20 + ((i * 23) % 68)}px"></span>`).join('')}</div>
  </section>`;
}

/* ---------- búsqueda ---------- */

function searchChip(label, query) {
  return `<button class="chip" data-search-chip="${esc(query)}">${esc(label)}</button>`;
}

let onlineSearchToken = 0;
let onlineSearchTimer = 0;
let ytdlpToolsPromise = null;

function onlineSearchBlock(query) {
  const online = state.ui.onlineSearch || {};
  const same = fold(online.query) === fold(query);
  const results = same ? (online.results || []) : [];
  const loading = same && online.loading;
  const error = same ? (online.error || '') : '';
  const blocked = IS_TAURI && state.import.tools && !state.import.tools.ytdlp;
  if (!IS_TAURI) {
    return `<section class="search-results-section">
      ${sectionHead('En línea', 'Disponible en la <em>app</em>', '')}
      <div class="inline-empty">La búsqueda en YouTube y el streaming están en la app de escritorio.</div>
    </section>`;
  }
  if (blocked) {
    return `<section class="search-results-section">
      ${sectionHead('En línea', 'Para reproducir <em>ahora</em>', '')}
      <div class="import-warning">${icon('youtube')}<span>Instala yt-dlp para buscar en YouTube y streamear canciones al instante.</span></div>
      <div class="import-actions"><button class="btn btn--primary" data-install-ytdlp>${icon('download')} Instalar yt-dlp</button></div>
    </section>`;
  }
  if (loading && !results.length) {
    return `<section class="search-results-section">
      ${sectionHead('En línea', 'Buscando en <em>YouTube</em>', '')}
      <div class="import-busy"><span class="spinner"></span> Buscando canciones para reproducir ahora…</div>
    </section>`;
  }
  if (error && !results.length) {
    return `<section class="search-results-section">
      ${sectionHead('En línea', 'Para reproducir <em>ahora</em>', '')}
      <div class="import-warning">${icon('bell')}<span>${esc(error)}</span></div>
    </section>`;
  }
  if (!results.length) {
    return loading ? '' : `<section class="search-results-section">
      ${sectionHead('En línea', 'Para reproducir <em>ahora</em>', '')}
      <div class="inline-empty">No encontré esa canción en YouTube. Prueba con artista y título.</div>
    </section>`;
  }
  const keyQuery = String(query || '').replace(/:/g, ' ');
  return `<section class="search-results-section">
    ${sectionHead('En línea', 'Para reproducir <em>ahora</em>', `<button class="section-head__link" data-play-context="search:${esc(keyQuery)}">Reproducir resultados ${icon('play')}</button>`)}
    ${loading ? `<div class="search-online-status"><span class="spinner"></span> Actualizando coincidencias…</div>` : ''}
    <div class="tracklist-wrap">${tracklist(results.slice(0, 12), `search:${keyQuery}`, { simple: true })}</div>
  </section>`;
}

function fetchOnlineSearch(query) {
  if (!IS_TAURI) return;
  const q = String(query || '').trim();
  if (!q) {
    onlineSearchToken += 1;
    window.clearTimeout(onlineSearchTimer);
    state.ui.onlineSearch = { query: '', loading: false, results: [], error: '', settled: false };
    return;
  }
  const current = state.ui.onlineSearch || {};
  if (fold(current.query) === fold(q) && (current.loading || current.settled)) return;
  const token = ++onlineSearchToken;
  state.ui.onlineSearch = { query: q, loading: true, results: [], error: '', settled: false };
  if (state.view.name === 'search') renderView();
  if (els.palette && !els.palette.hidden) renderPalette(els.paletteInput?.value || q);
  window.clearTimeout(onlineSearchTimer);
  onlineSearchTimer = window.setTimeout(() => runOnlineSearch(q, token), 260);
}

async function runOnlineSearch(query, token) {
  if (token !== onlineSearchToken) return;
  const q = String(query || '').trim();
  try {
    await refreshYtdlpTools(false);
    if (token !== onlineSearchToken) return;
    if (!state.import.tools?.ytdlp) {
      state.ui.onlineSearch = {
        query: q,
        loading: false,
        results: [],
        error: 'yt-dlp no está instalado. Instálalo para buscar y streamear canciones.',
        settled: true,
      };
    } else {
      const results = await inv('search_online', { query: q });
      if (token !== onlineSearchToken) return;
      state.ui.onlineSearch = {
        query: q,
        loading: false,
        results: Array.isArray(results) ? results.map((item) => normalizeTrack(item, 'stream')) : [],
        error: '',
        settled: true,
      };
    }
  } catch (error) {
    if (token !== onlineSearchToken) return;
    state.ui.onlineSearch = {
      query: q,
      loading: false,
      results: [],
      error: `No se pudo buscar en línea. ${error?.message || error || ''}`,
      settled: true,
    };
  }
  if (state.view.name === 'search' && fold(state.view.params.q || state.ui.query) === fold(q)) renderView();
  if (els.palette && !els.palette.hidden) renderPalette(els.paletteInput?.value || q);
}

function renderSearch(query) {
  const q = String(query || '').trim();
  if (q) fetchOnlineSearch(q);
  if (!q) {
    const feature = featuredAlbum() || state.albums[0];
    const tracks = state.recents.map((r) => trackFromId(r.id)).filter(Boolean).slice(0, 6);
    const suggestions = state.artists.slice(0, 5);
    const genres = [...new Set(state.allTracks.map((t) => t.genre).filter(Boolean))].slice(0, 8);
    return `<div class="search-head">
      <div><div class="eyebrow">Buscar</div><h1>Encuentra tu <span>frecuencia</span></h1><p>Busca en tu biblioteca y en YouTube. Pulsa una canción para streamearla al instante.</p></div>
      <span class="library-pill"><span class="status-dot"></span> ${plural(state.allTracks.length, 'pista', 'pistas')} indexadas</span>
    </div>
    <div class="search-chip-row">
      ${searchChip('Noche', 'synthwave')}${searchChip('Calma', 'ambient')}${searchChip('Dream pop', 'dream')}${searchChip('Lo-fi', 'lo-fi')}${searchChip('Carretera', 'indie')}
      <span class="filter-row__spacer"></span>
      <button class="chip" data-open="explore">${icon('compass')} Ver estados de ánimo</button>
    </div>
    ${renderRecentSearches()}
    <div class="search-top-grid">
      ${feature ? `<article class="search-feature" data-open="album:${esc(feature.id)}" tabindex="0" aria-label="${esc(feature.title)}">
        <img class="search-feature__bg" src="${esc(coverSrc(feature))}" alt="">
        <span class="search-feature__type">Álbum destacado</span>
        <h2>${esc(feature.title)}</h2>
        <span>${esc(feature.artist)} · ${esc(feature.year || '')}</span>
        <span class="search-feature__play" data-play-context="album:${esc(feature.id)}" role="button" aria-label="Reproducir">${icon('play')}</span>
      </article>` : ''}
      <div class="search-side">
        <div class="search-side__head"><span>${tracks.length ? 'Sigue sonando' : 'Artistas'}</span><span>${tracks.length ? 'Recientes' : 'Tu biblioteca'}</span></div>
        ${(tracks.length ? tracks : suggestions).slice(0, 5).map((item) => tracks.length
          ? `<button class="search-suggestion" data-play-track="${esc(item.id)}" data-context-key="recent"><img src="${esc(coverSrc(item))}" alt=""><span class="search-suggestion__copy"><strong>${esc(item.title)}</strong><span>${esc(item.artist)}</span></span></button>`
          : `<button class="search-suggestion" data-open="artist:${esc(item.id)}"><img src="${esc(coverSrc(item))}" alt=""><span class="search-suggestion__copy"><strong>${esc(item.name)}</strong><span>${esc((item.genres || [])[0] || 'Artista')}</span></span></button>`).join('')}
      </div>
    </div>
    <section class="search-results-section">
      ${sectionHead('Vocabulario', 'Explora por <em>género</em>', '')}
      <div class="genre-wrap">${genres.map((g) => `<button class="genre-pill" data-search-chip="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    </section>
    <section class="search-results-section">
      ${sectionHead('Saltos rápidos', 'Playlists <em>listas</em>', '')}
      <div class="quick-grid">${state.playlists.slice(0, 4).map((p) => quickCard({
        open: `playlist:${p.id}`, play: `playlist:${p.id}`, cover: playlistCover(p),
        title: p.name, sub: p.description || plural((p.track_ids || []).length, 'canción', 'canciones'), playing: isContextPlaying(`playlist:${p.id}`),
      })).join('')}</div>
    </section>`;
  }

  const tracks = searchTracks(q);
  const albums = searchAlbums(q);
  const artists = searchArtists(q);
  const playlists = searchPlaylists(q);
  const online = fold(state.ui.onlineSearch.query) === fold(q) ? (state.ui.onlineSearch.results || []) : [];
  const total = tracks.length + albums.length + artists.length + playlists.length + online.length;
  const top = albums[0] || artists[0] || online[0] || null;
  const keyQuery = q.replace(/:/g, ' ');
  const onlinePending = state.ui.onlineSearch.loading && fold(state.ui.onlineSearch.query) === fold(q);
  if (!total && !onlinePending) {
    return `<div class="search-head"><div><div class="eyebrow">Buscar</div><h1>Resultados para <span>${esc(q)}</span></h1><p>Tu biblioteca y YouTube, en el mismo sitio.</p></div></div>
      <div class="search-no-results">${icon('search')}<h2>Nada por aquí</h2><p>Prueba con otro título o artista. Si yt-dlp está listo, la búsqueda en línea aparece debajo.</p></div>
      ${onlineSearchBlock(q)}`;
  }
  const topIsOnline = top && online[0] && top.id === online[0].id;
  return `<div class="search-head">
    <div><div class="eyebrow">Buscar</div><h1>Resultados para <span>${esc(q)}</span></h1><p>${plural(total, 'coincidencia', 'coincidencias')}${onlinePending ? ' · buscando en YouTube…' : ''}</p></div>
    <button class="btn btn--soft" data-clear-search>${icon('x')} Limpiar</button>
  </div>
  <div class="search-top-grid">
    ${top ? `<article class="search-feature" data-open="${topIsOnline ? '' : (albums[0] ? `album:${esc(albums[0].id)}` : `artist:${esc(artists[0].id)}`)}" ${topIsOnline ? `data-play-track="${esc(top.id)}" data-context-key="search:${esc(keyQuery)}"` : ''} tabindex="0">
      <img class="search-feature__bg" src="${esc(coverSrc(top))}" alt="">
      <span class="search-feature__type">${topIsOnline ? 'Streaming' : albums[0] ? 'Álbum' : 'Artista'}</span>
      <h2>${esc(top.title || top.name)}</h2>
      <span>${esc(top.artist || (top.genres || [])[0] || 'Resultado principal')}</span>
      <span class="search-feature__play" ${topIsOnline ? `data-play-track="${esc(top.id)}" data-context-key="search:${esc(keyQuery)}"` : `data-play-context="${albums[0] ? `album:${esc(albums[0].id)}` : `artist:${esc(artists[0].id)}`}"`} role="button" aria-label="Reproducir">${icon('play')}</span>
    </article>` : `<div class="search-side"><div class="search-side__head"><span>Buscando</span></div><div class="inline-empty">${onlinePending ? 'Consultando YouTube…' : 'La búsqueda encontró canciones, pero no colecciones.'}</div></div>`}
    <div class="search-side">
      <div class="search-side__head"><span>Canciones</span><span>${tracks.length || online.length}</span></div>
      ${(tracks.length ? tracks : online).slice(0, 6).map((t) => `<button class="search-suggestion" data-play-track="${esc(t.id)}" data-context-key="search:${esc(keyQuery)}">
        <img src="${esc(coverSrc(t))}" alt=""><span class="search-suggestion__copy"><strong>${esc(t.title)}</strong><span>${esc(t.artist)} · ${esc(t.album || 'Streaming')}</span></span></button>`).join('') || `<div class="inline-empty">${onlinePending ? 'Buscando canciones…' : 'No hay canciones.'}</div>`}
    </div>
  </div>
  ${tracks.length ? `<section class="search-results-section">
    ${sectionHead('En tu biblioteca', 'Lo que <em>ya tienes</em>', `<button class="section-head__link" data-play-context="search:${esc(keyQuery)}">Reproducir ${icon('play')}</button>`)}
    <div class="tracklist-wrap">${tracklist(tracks.slice(0, 12), `search:${keyQuery}`, { simple: true })}</div>
  </section>` : ''}
  ${onlineSearchBlock(q)}
  ${albums.length ? `<section class="search-results-section">
    ${sectionHead('Álbumes', 'Colecciones <em>afines</em>', '')}
    <div class="media-grid media-grid--six">${albums.slice(0, 6).map((a) => mediaCard(a, 'album')).join('')}</div>
  </section>` : ''}
  ${artists.length ? `<section class="search-results-section">
    ${sectionHead('Artistas', 'Voces <em>cercanas</em>', '')}
    <div class="media-grid media-grid--six">${artists.slice(0, 6).map((a) => mediaCard(a, 'artist')).join('')}</div>
  </section>` : ''}
  ${playlists.length ? `<section class="search-results-section">
    ${sectionHead('Playlists', 'Colecciones <em>tuyas</em>', '')}
    <div class="quick-grid">${playlists.slice(0, 4).map((p) => quickCard({
      open: `playlist:${p.id}`, play: `playlist:${p.id}`, cover: playlistCover(p),
      title: p.name, sub: plural((p.track_ids || []).length, 'canción', 'canciones'), playing: isContextPlaying(`playlist:${p.id}`),
    })).join('')}</div>
  </section>` : ''}`;
}

/* ---------- detalle: álbum ---------- */

function renderAlbum(id) {
  const album = albumById(id);
  if (!album) {
    return `${pageHead('Álbum', 'No encontrado', 'Esta colección ya no está en tu biblioteca.')}${emptyState('disc', 'Álbum no disponible', 'Puede que hayas quitado la carpeta que lo contenía.', `<button class="btn btn--primary" data-open="library">${icon('library')} Ir a la biblioteca</button>`)}`;
  }
  const tracks = (album.track_ids || []).map(trackFromId).filter(Boolean)
    .sort((a, b) => (a.disc_number || 1) - (b.disc_number || 1) || (a.track_number || 0) - (b.track_number || 0));
  const seconds = tracks.reduce((s, t) => s + t.duration, 0);
  const key = `album:${album.id}`;
  const artist = artistById(album.artist_id) || state.artists.find((a) => a.name === album.artist);
  const more = state.albums.filter((a) => a.id !== album.id && (a.artist === album.artist || a.source === album.source)).slice(0, 6);
  return `<section class="detail-hero" style="--detail-cover:${cssUrl(coverSrc(album))};--hero-accent:${hex(album.accent)};--hero-accent-rgb:${rgbTriplet(album.accent)}">
    <div class="detail-cover">${coverImg(album, '', album.title)}</div>
    <div class="detail-hero__copy">
      <div class="detail-type"><span class="status-dot"></span> Álbum ${album.source === 'demo' ? '· demo' : '· local'}</div>
      <h1 class="detail-title">${esc(album.title)}</h1>
      <p class="detail-desc">${tracks.length ? `Escucha ${esc(album.title)} de principio a fin. ${album.year ? `Publicado en ${album.year}.` : ''} Sin cortes publicitarios.` : 'Esta colección aún no tiene pistas disponibles.'}</p>
      <div class="detail-meta">
        ${artist ? `<button data-open="artist:${esc(artist.id)}">${esc(album.artist)}</button><span class="detail-meta__dot"></span>` : `<strong>${esc(album.artist)}</strong><span class="detail-meta__dot"></span>`}
        ${album.year ? `<span>${album.year}</span><span class="detail-meta__dot"></span>` : ''}
        <span>${plural(tracks.length, 'canción', 'canciones')}</span>
        <span class="detail-meta__dot"></span><span>${fmtLong(seconds)}</span>
      </div>
      <div class="detail-actions">
        ${playableContextButton(key, 'Reproducir')}
        ${shuffleButton(key)}
        <span class="detail-actions__separator"></span>
        <button class="icon-btn" data-queue-context="${esc(key)}" aria-label="Añadir a la cola" title="Añadir a la cola">${icon('queue')}</button>
        <button class="icon-btn" data-open-folder="${esc((tracks[0] || {}).path ? tracks[0].path.replace(/\/[^/]*$/, '') : '')}" aria-label="Abrir carpeta" title="Abrir carpeta" ${tracks[0]?.source === 'local' ? '' : 'disabled'}>${icon('folder')}</button>
      </div>
    </div>
  </section>
  <div class="detail-body">
    ${tracks.length ? `<div class="tracklist-wrap">${tracklist(tracks, key, { simple: true, showGenre: true })}</div>` : emptyState('music', 'Sin pistas', 'Esta colección no tiene archivos disponibles ahora mismo.', '')}
    ${more.length ? `<section class="detail-section">
      ${sectionHead('Sigue explorando', 'Más de <em>tu biblioteca</em>', `<button class="section-head__link" data-open="library">Ver todo ${icon('arrow-right')}</button>`)}
      <div class="media-grid media-grid--six">${more.map((a) => mediaCard(a, 'album')).join('')}</div>
    </section>` : ''}
  </div>`;
}

/* ---------- detalle: artista ---------- */

function renderArtist(id) {
  const artist = artistById(id);
  if (!artist) {
    return `${pageHead('Artista', 'No encontrado', 'Este artista ya no está en tu biblioteca.')}${emptyState('mic', 'Artista no disponible', 'Puede que hayas quitado la carpeta que contenía sus archivos.', `<button class="btn btn--primary" data-open="library">${icon('library')} Ir a la biblioteca</button>`)}`;
  }
  const tracks = (artist.track_ids || []).map(trackFromId).filter(Boolean);
  const albums = state.albums.filter((a) => a.artist === artist.name || (tracks[0] && a.id === albumForTrack(tracks[0])?.id));
  const playlists = state.playlists.filter((p) => (p.track_ids || []).some((tid) => tracks.some((t) => t.id === tid)));
  const seconds = tracks.reduce((s, t) => s + t.duration, 0);
  const key = `artist:${artist.id}`;
  const popular = tracks.slice().sort((a, b) => {
    const ar = state.recents.findIndex((r) => r.id === a.id);
    const br = state.recents.findIndex((r) => r.id === b.id);
    return (ar === -1 ? 999 : ar) - (br === -1 ? 999 : br);
  }).slice(0, 8);
  return `<section class="detail-hero artist-hero" style="--detail-cover:${cssUrl(coverSrc(artist))};--hero-accent:${hex(artist.accent || tracks[0]?.accent)};--hero-accent-rgb:${rgbTriplet(artist.accent || tracks[0]?.accent)}">
    <div class="detail-cover detail-cover--round">${coverImg(artist, '', artist.name)}</div>
    <div class="detail-hero__copy">
      <div class="detail-type"><span class="status-dot"></span> Artista</div>
      <h1 class="detail-title">${esc(artist.name)} ${icon('check', 'artist-hero__verified')}</h1>
      <p class="detail-desc">${esc((artist.genres || []).join(' · ') || 'Música de tu biblioteca local')}. ${plural(tracks.length, 'canción', 'canciones')} en ${plural(albums.length, 'álbum', 'álbumes')}, sin intermediarios.</p>
      <div class="detail-meta"><strong>${plural(tracks.length, 'canción', 'canciones')}</strong><span class="detail-meta__dot"></span><span>${fmtLong(seconds)}</span><span class="detail-meta__dot"></span><span>${(artist.genres || [])[0] || 'Local'}</span></div>
      <div class="detail-actions">
        ${playableContextButton(key, 'Reproducir')}
        ${shuffleButton(key)}
        <span class="detail-actions__separator"></span>
        <button class="icon-btn" data-queue-context="${esc(key)}" aria-label="Añadir a la cola">${icon('queue')}</button>
      </div>
      <div class="artist-followers">${icon('shield')} Este artista no tiene seguidores que rastrear. Solo tú y tus archivos.</div>
    </div>
  </section>
  <div class="detail-body">
    ${popular.length ? `<section class="detail-section">
      ${sectionHead('Populares en tu equipo', 'Canciones <em>favoritas</em>', `<button class="section-head__link" data-play-context="${esc(key)}">Reproducir todo ${icon('play')}</button>`)}
      <div class="tracklist-wrap">${tracklist(popular, key, { simple: true, showGenre: true })}</div>
    </section>` : emptyState('music', 'Sin canciones', 'Este artista no tiene pistas disponibles.', '')}
    ${albums.length ? `<section class="detail-section">
      ${sectionHead('Discografía local', 'Álbumes <em>disponibles</em>', '')}
      <div class="media-grid media-grid--six">${albums.map((a) => mediaCard(a, 'album')).join('')}</div>
    </section>` : ''}
    ${playlists.length ? `<section class="detail-section">
      ${sectionHead('Aparece en', 'Playlists <em>con su voz</em>', '')}
      <div class="quick-grid">${playlists.map((p) => quickCard({
        open: `playlist:${p.id}`, play: `playlist:${p.id}`, cover: playlistCover(p),
        title: p.name, sub: plural((p.track_ids || []).length, 'canción', 'canciones'), playing: isContextPlaying(`playlist:${p.id}`),
      })).join('')}</div>
    </section>` : ''}
  </div>`;
}

/* ---------- detalle: playlist ---------- */

function renderPlaylist(id) {
  const playlist = playlistById(id);
  if (!playlist) {
    return `${pageHead('Playlist', 'No encontrada', 'Esta lista ya no existe.')}${emptyState('queue', 'Playlist no disponible', 'Puede que la hayas eliminado. Crea una nueva desde el botón + de la barra lateral.', `<button class="btn btn--primary" data-new-playlist>${icon('plus')} Crear playlist</button>`)}`;
  }
  const tracks = (playlist.track_ids || []).map(trackFromId).filter(Boolean);
  const key = `playlist:${playlist.id}`;
  const seconds = tracks.reduce((s, t) => s + t.duration, 0);
  const isUser = playlist.source !== 'demo';
  return `<section class="detail-hero" style="--detail-cover:${cssUrl(tracks[0] ? coverSrc(tracks[0]) : coverSrc(playlist))};--hero-accent:${hex(playlist.accent || tracks[0]?.accent)};--hero-accent-rgb:${rgbTriplet(playlist.accent || tracks[0]?.accent)}">
    <div class="detail-cover">${playlist.cover ? `<img src="${esc(playlist.cover)}" alt="">` : playlistMosaic(playlist.track_ids)}${isUser ? `<button class="btn btn--soft cover-edit" data-edit-playlist-cover="${esc(playlist.id)}">${icon('image')} Portada</button>` : ''}</div>
    <div class="detail-hero__copy">
      <div class="detail-type"><span class="status-dot"></span> Playlist ${isUser ? '· tuya' : '· incluida'}</div>
      <h1 class="detail-title detail-title--serif">${esc(playlist.name)}</h1>
      <p class="detail-desc">${esc(playlist.description || 'Una colección hecha a mano. Sin anuncios entre canción y canción.')}</p>
      <div class="detail-meta"><strong>${plural(tracks.length, 'canción', 'canciones')}</strong><span class="detail-meta__dot"></span><span>${fmtLong(seconds)}</span><span class="detail-meta__dot"></span><span>${isUser ? 'Hecha por ti' : 'Demo de Davusic'}</span></div>
      <div class="detail-actions">
        ${playableContextButton(key, 'Reproducir')}
        ${shuffleButton(key)}
        <span class="detail-actions__separator"></span>
        <button class="icon-btn" data-queue-context="${esc(key)}" aria-label="Añadir a la cola" title="Añadir a la cola">${icon('queue')}</button>
        ${isUser && tracks.length ? `<button class="icon-btn" data-exportify-playlist="${esc(playlist.id)}" aria-label="Exportar CSV compatible con Exportify" title="Exportar CSV para Exportify">${icon('download')}</button>` : ''}
        ${isUser ? `<button class="icon-btn" data-delete-playlist="${esc(playlist.id)}" aria-label="Eliminar playlist" title="Eliminar playlist">${icon('trash')}</button>` : ''}
      </div>
    </div>
  </section>
  <div class="detail-body">
    ${tracks.length ? `<div class="tracklist-wrap">${tracklist(tracks, key, { simple: true, showGenre: true })}</div>` : emptyState('music', 'Playlist vacía', 'Añade canciones desde el menú de cualquier pista. Aquí no hay relleno automático.', `<button class="btn btn--primary" data-open="library">${icon('library')} Buscar música</button><button class="btn btn--ghost" data-open="explore">${icon('compass')} Explorar</button>`)}
    ${tracks.length ? `<section class="detail-section">
      ${sectionHead('Sigue el hilo', 'Añade más <em>después</em>', '')}
      <div class="quick-grid">${state.playlists.filter((p) => p.id !== playlist.id).slice(0, 4).map((p) => quickCard({
        open: `playlist:${p.id}`, play: `playlist:${p.id}`, cover: playlistCover(p),
        title: p.name, sub: plural((p.track_ids || []).length, 'canción', 'canciones'), playing: isContextPlaying(`playlist:${p.id}`),
      })).join('')}</div>
    </section>` : ''}
  </div>`;
}

/* ---------- detalle: estado de ánimo ---------- */

function renderMood(id) {
  const mood = moodById(id);
  if (!mood) {
    return `${pageHead('Momento', 'No encontrado', 'Este estado de ánimo no está disponible.')}${emptyState('sparkle', 'Sin frecuencia', 'Prueba con otro momento desde Explorar.', `<button class="btn btn--primary" data-open="explore">${icon('compass')} Explorar</button>`)}`;
  }
  const tracks = (mood.track_ids || []).map(trackFromId).filter(Boolean);
  const key = `mood:${mood.id}`;
  const seconds = tracks.reduce((s, t) => s + t.duration, 0);
  return `<section class="detail-hero" style="--detail-cover:${cssUrl(coverSrc(mood))};--hero-accent:${hex(mood.accent)};--hero-accent-rgb:${rgbTriplet(mood.accent)}">
    <div class="detail-cover">${coverImg(mood, '', mood.name)}</div>
    <div class="detail-hero__copy">
      <div class="detail-type"><span class="status-dot"></span> Estado de ánimo · sin algoritmo</div>
      <h1 class="detail-title detail-title--serif">${esc(mood.name)}</h1>
      <p class="detail-desc">${esc(mood.subtitle || 'Una selección para este momento.')} Una mezcla hecha con tus propios archivos, sin cuentas ni perfiles.</p>
      <div class="detail-meta"><strong>${plural(tracks.length, 'canción', 'canciones')}</strong><span class="detail-meta__dot"></span><span>${fmtLong(seconds)}</span><span class="detail-meta__dot"></span><span>Mezcla local</span></div>
      <div class="detail-actions">
        ${playableContextButton(key, 'Reproducir')}
        ${shuffleButton(key)}
        <span class="detail-actions__separator"></span>
        <button class="icon-btn" data-queue-context="${esc(key)}" aria-label="Añadir a la cola">${icon('queue')}</button>
      </div>
    </div>
  </section>
  <div class="detail-body">
    ${tracks.length ? `<div class="tracklist-wrap">${tracklist(tracks, key, { simple: true, showGenre: true })}</div>` : emptyState('music', 'Sin canciones para este momento', 'Importa más música o explora otro estado de ánimo.', `<button class="btn btn--primary" data-open="explore">${icon('compass')} Volver a Explorar</button>`)}
    <section class="detail-section">
      ${sectionHead('Otros momentos', 'Cambia de <em>frecuencia</em>', '')}
      <div class="mood-grid">${state.moods.filter((m) => m.id !== mood.id).slice(0, 3).map((m) => `<button class="mood-card" data-open="mood:${esc(m.id)}" style="--mood-rgb:${rgbTriplet(m.accent)}">
        <img class="mood-card__bg" src="${esc(coverSrc(m))}" alt="" loading="lazy">
        <span class="mood-card__eyebrow">${esc(m.subtitle || 'Momento')}</span><span class="mood-card__name">${esc(m.name)}</span><span class="mood-card__sub">${plural((m.track_ids || []).length, 'canción', 'canciones')}</span>
        <span class="mood-card__play" data-play-context="mood:${esc(m.id)}" role="button" aria-label="Reproducir">${icon('play')}</span>
      </button>`).join('')}</div>
    </section>
  </div>`;
}

/* ---------- reproducción ---------- */

function currentTrack() {
  return state.player.trackId ? trackFromId(state.player.trackId) : null;
}

function isContextPlaying(key) {
  return Boolean(key && state.player.context && state.player.context.key === key && state.player.trackId);
}

function addRecent(trackId) {
  state.recents = [{ id: trackId, at: Date.now() }, ...state.recents.filter((r) => r.id !== trackId)].slice(0, 120);
  writeStore(STORE.recents, state.recents);
}

function updatePlaybackClasses() {
  const currentId = state.player.trackId;
  const contextKey = state.player.context?.key;
  qsa('[data-row-track]').forEach((row) => {
    row.classList.toggle('is-current', row.dataset.rowTrack === currentId);
  });
  qsa('[data-card-context]').forEach((card) => {
    card.classList.toggle('is-playing', card.dataset.cardContext === contextKey && Boolean(currentId));
  });
  qsa('[data-play-context]').forEach((el) => {
    const active = el.dataset.playContext === contextKey && Boolean(currentId);
    const use = el.querySelector('use');
    if (use) use.setAttribute('href', `#i-${active && state.player.playing ? 'pause' : 'play'}`);
    el.setAttribute('aria-label', active && state.player.playing ? 'Pausar' : 'Reproducir');
  });
  const liked = currentId ? state.likes.includes(currentId) : false;
  if (els.playerLike) {
    els.playerLike.classList.toggle('is-liked', liked);
    els.playerLike.disabled = !currentId;
    const use = els.playerLike.querySelector('use');
    if (use) use.setAttribute('href', `#i-${liked ? 'heart-fill' : 'heart'}`);
  }
  if (els.immersiveLike) {
    els.immersiveLike.classList.toggle('is-liked', liked);
    const use = els.immersiveLike.querySelector('use');
    if (use) use.setAttribute('href', `#i-${liked ? 'heart-fill' : 'heart'}`);
  }
}

function updatePlayerUI() {
  const track = currentTrack();
  const p = state.player;
  const pct = p.duration > 0 ? clamp((p.position / p.duration) * 100, 0, 100) : 0;
  const hasQueue = p.queue.length > 0;

  if (els.playerbar) {
    els.playerbar.classList.toggle('is-playing', p.playing);
    els.playerbar.classList.toggle('is-loading', p.loading);
  }
  if (els.playerTitle) els.playerTitle.textContent = track ? track.title : 'Elige algo para sonar';
  if (els.playerArtist) {
    if (p.loading && p.statusLabel) els.playerArtist.textContent = p.statusLabel;
    else els.playerArtist.textContent = track ? `${track.artist} · ${track.album}` : 'Tu biblioteca te espera';
  }
  if (els.playerCoverImg) {
    setImage(els.playerCoverImg, track ? coverSrc(track) : '');
    const ph = qs('.track-thumb__placeholder', els.playerCover);
    if (ph) ph.hidden = Boolean(track);
  }
  if (els.playBtn) els.playBtn.disabled = !track && !hasQueue;
  if (els.prevBtn) els.prevBtn.disabled = !hasQueue;
  if (els.nextBtn) els.nextBtn.disabled = !hasQueue;
  if (els.playerAdd) els.playerAdd.disabled = !track;
  if (els.playerLike) els.playerLike.disabled = !track;

  if (els.shuffleBtn) {
    els.shuffleBtn.classList.toggle('is-on', p.shuffle);
    els.shuffleBtn.classList.toggle('is-off', !p.shuffle);
  }
  if (els.repeatBtn) {
    els.repeatBtn.classList.toggle('is-on', p.repeat !== 'off');
    els.repeatBtn.classList.toggle('is-off', p.repeat === 'off');
    const use = els.repeatBtn.querySelector('use');
    if (use) use.setAttribute('href', `#i-${p.repeat === 'one' ? 'repeat-one' : 'repeat'}`);
    els.repeatBtn.setAttribute('aria-label', p.repeat === 'one' ? 'Repetir una canción' : p.repeat === 'all' ? 'Repetir todo' : 'Repetir');
  }
  if (els.currentTime) els.currentTime.textContent = fmtTime(p.position);
  if (els.totalTime) els.totalTime.textContent = fmtTime(p.duration);
  if (els.progressFill) els.progressFill.style.width = `${pct}%`;
  if (els.progressBuffered) els.progressBuffered.style.width = `${Math.min(100, pct + 18)}%`;
  if (els.progress) {
    els.progress.setAttribute('aria-valuenow', String(Math.round(pct)));
    els.progress.setAttribute('aria-valuetext', `${fmtTime(p.position)} de ${fmtTime(p.duration)}`);
  }

  const volPct = clamp((p.muted ? 0 : p.volume) * 100, 0, 100);
  if (els.volumeFill) els.volumeFill.style.width = `${volPct}%`;
  const volThumb = qs('.volume__thumb', els.volume);
  if (volThumb) volThumb.style.left = `${volPct}%`;
  if (els.volume) els.volume.setAttribute('aria-valuenow', String(Math.round(volPct)));
  if (els.muteBtn) {
    const use = els.muteBtn.querySelector('use');
    if (use) use.setAttribute('href', `#i-${volPct === 0 ? 'volume-x' : 'volume'}`);
    els.muteBtn.setAttribute('aria-label', volPct === 0 ? 'Activar sonido' : 'Silenciar');
  }

  if (els.immersive && !els.immersive.hidden) updateImmersive();
  updatePlaybackClasses();

  if (track) document.title = `${track.title} · ${track.artist} — Davusic`;
  else document.title = viewTitle();
}

function setPlaying(value) {
  state.player.playing = Boolean(value);
  updatePlayerUI();
  if (state.prefs.contextTab === 'queue') refreshQueueStateLabel();
}

async function ensureEngineVolume() {
  try {
    if (state.player.trackId) await engine.volume(state.player.muted ? 0 : state.player.volume);
    else if (IS_TAURI) await engine.volume(state.player.muted ? 0 : state.player.volume);
  } catch (_) {}
}

function ensurePlayableTrack(trackId) {
  if (!trackId) return trackId;
  if (trackFromId(trackId)) return trackId;
  const online = (state.ui.onlineSearch.results || []).find((item) => item.id === trackId);
  if (online) return adoptStreamTrack(online).id;
  return trackId;
}

async function startCurrent(options = {}) {
  const track = currentTrack();
  if (!track) return;
  noteTrackSwitch(track.id);
  const requested = track.id;
  const restoreSeek = Number(options.seek) || 0;
  state.player.loading = true;
  state.player.playing = false;
  state.player.position = options.restore ? restoreSeek : 0;
  state.player.duration = track.duration || 0;
  state.player.endedAt = 0;
  state.player.statusLabel = track.source === 'stream' ? 'Conectando…' : 'Cargando…';
  updatePlayerUI();
  renderContext();
  try {
    const result = await engine.load(track);
    if (state.player.trackId !== requested) return;
    if (result?.cancelled) return;
    if (result && Number(result.duration) > 0) state.player.duration = Number(result.duration);
    if (track.source === 'stream') {
      if (result?.uri) track.uri = result.uri;
      if (result?.cover) track.cover = result.cover;
      const stored = (state.stream.tracks || []).find((item) => item.id === track.id);
      if (stored) {
        if (result?.uri) stored.uri = result.uri;
        if (result?.cover) stored.cover = result.cover;
        persistStreams();
      }
    }
    state.player.playing = true;
    state.player.loading = false;
    state.player.statusLabel = '';
    if (!options.restore) {
      addRecent(track.id);
      recordPlayStart(track.id);
    }
    await ensureEngineVolume();
    if (restoreSeek > 0.8) await seekTo(restoreSeek);
    if (options.paused) {
      try { await engine.pause(); } catch (_) {}
      setPlaying(false);
    }
    updatePlayerUI();
    renderContext();
    updatePlaybackClasses();
    updateLyricsHighlight();
    ensureLyrics(track);
    if (!options.restore && wantsRadio(state.player.context)) fillRadioQueue(track.id);
    scheduleSessionSave();
  } catch (error) {
    if (state.player.trackId !== requested) return;
    state.player.loading = false;
    state.player.playing = false;
    state.player.statusLabel = '';
    updatePlayerUI();
    toast(`No se pudo reproducir <strong>${esc(track.title)}</strong>. ${esc(error?.message || error || '')}`, 'bell', 5000);
  }
}

async function startContext(key, startId = null, options = {}) {
  const context = collectContext(key);
  if (!context.ids.length) {
    toast('No hay canciones disponibles en esta colección.', 'bell');
    return;
  }
  if (options.shuffle && !state.player.shuffle) {
    state.player.shuffle = true;
    state.player.unshuffled = null;
    updatePlayerUI();
  }
  const original = context.ids.map((id) => ensurePlayableTrack(id));
  let start = startId && original.includes(ensurePlayableTrack(startId)) ? ensurePlayableTrack(startId) : original[0];
  let queue;
  if (state.player.shuffle) {
    const rest = original.filter((id) => id !== start);
    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    queue = [start, ...rest];
  } else {
    queue = original;
  }
  state.player.context = { key: context.key, label: context.label };
  state.player.unshuffled = original;
  state.player.queue = queue;
  state.player.index = queue.indexOf(start);
  if (state.player.index < 0) state.player.index = 0;
  state.player.trackId = queue[state.player.index];
  if (context.kind === 'search' && context.id) recordSearchHit(state.player.trackId, context.id);
  await startCurrent();
}

async function toggleContext(key, options = {}) {
  const context = collectContext(key);
  if (!context.ids.length) {
    toast('No hay canciones disponibles aquí todavía.', 'bell');
    return;
  }
  if (isContextPlaying(key)) {
    await togglePlay();
    return;
  }
  await startContext(key, null, options);
}

async function playFromRow(trackId, key) {
  trackId = ensurePlayableTrack(trackId);
  const track = trackFromId(trackId);
  if (!track) return;
  if (state.player.trackId === trackId) {
    await togglePlay();
    return;
  }
  if (isContextPlaying(key)) {
    const idx = state.player.queue.indexOf(trackId);
    if (idx >= 0) {
      state.player.index = idx;
      state.player.trackId = trackId;
      await startCurrent();
      return;
    }
  }
  await startContext(key, trackId);
}

async function togglePlay() {
  const p = state.player;
  if (!p.trackId) {
    if (p.queue.length) {
      p.index = clamp(p.index >= 0 ? p.index : 0, 0, p.queue.length - 1);
      p.trackId = p.queue[p.index];
      await startCurrent();
    } else {
      const key = sortedLocalTracks().length ? 'library' : (state.demo.playlists[0] ? `playlist:${state.demo.playlists[0].id}` : '');
      if (key) await startContext(key);
      else toast('Importa música, busca en línea o abre la demo para empezar.', 'folder-plus');
    }
    return;
  }
  try {
    if (p.playing) {
      await engine.pause();
      setPlaying(false);
    } else {
      if (p.duration > 0 && p.position >= p.duration - 0.2) {
        await engine.seek(0);
        p.position = 0;
      }
      await engine.resume();
      setPlaying(true);
    }
  } catch (error) {
    toast(`No se pudo cambiar la reproducción. ${esc(error?.message || '')}`, 'bell');
  }
}

async function seekTo(seconds) {
  const p = state.player;
  if (!currentTrack()) return;
  p.position = clamp(seconds, 0, p.duration || 0);
  updatePlayerUI();
  try { await engine.seek(p.position); } catch (_) {}
  scheduleSessionSave();
}

let sessionSaveTimer = 0;
function sessionSnapshot() {
  const p = state.player;
  const queue = (p.queue || []).filter((id) => typeof id === 'string').slice(0, 250);
  return {
    trackId: p.trackId || '',
    queue,
    index: Number.isFinite(p.index) ? p.index : 0,
    unshuffled: Array.isArray(p.unshuffled) ? p.unshuffled.filter((id) => typeof id === 'string').slice(0, 250) : null,
    context: p.context && p.context.key ? { key: p.context.key, label: p.context.label || '' } : null,
    position: Number(p.position) || 0,
    duration: Number(p.duration) || 0,
    shuffle: Boolean(p.shuffle),
    repeat: p.repeat === 'all' || p.repeat === 'one' ? p.repeat : 'off',
    muted: Boolean(p.muted),
    savedAt: Date.now(),
  };
}

function scheduleSessionSave() {
  window.clearTimeout(sessionSaveTimer);
  sessionSaveTimer = window.setTimeout(() => persistSession(false), 2500);
}

async function persistSession(immediate = false) {
  window.clearTimeout(sessionSaveTimer);
  if (state.ui.factoryResetting) return;
  const session = state.prefs.resumeSession === false
    ? { trackId: '', queue: [], savedAt: Date.now() }
    : sessionSnapshot();
  writeStore(STORE.session, session);
  if (!IS_TAURI) return;
  const write = () => inv('save_playback_session', { session }).catch(() => {});
  if (immediate) await write();
  else write();
}

async function restoreSession() {
  if (state.prefs.resumeSession === false) return;
  let session = readStore(STORE.session, null);
  if (IS_TAURI) {
    try {
      const disk = await inv('load_playback_session');
      if (disk && typeof disk === 'object' && (disk.trackId || (disk.queue || []).length)) session = disk;
    } catch (_) {}
  }
  if (!session || typeof session !== 'object') return;
  const queue = (Array.isArray(session.queue) ? session.queue : [])
    .map((id) => ensurePlayableTrack(id))
    .filter((id) => trackFromId(id));
  if (!queue.length) return;
  let index = Number(session.index);
  if (!Number.isFinite(index) || index < 0 || index >= queue.length) index = 0;
  const wanted = session.trackId && queue.includes(session.trackId) ? session.trackId : queue[index];
  index = queue.indexOf(wanted);
  state.player.queue = queue;
  state.player.index = index;
  state.player.trackId = wanted;
  state.player.unshuffled = Array.isArray(session.unshuffled)
    ? session.unshuffled.filter((id) => trackFromId(id))
    : null;
  state.player.context = session.context && session.context.key
    ? { key: String(session.context.key), label: String(session.context.label || '') }
    : { key: 'library', label: 'Tu biblioteca' };
  state.player.shuffle = Boolean(session.shuffle);
  state.player.repeat = session.repeat === 'all' || session.repeat === 'one' ? session.repeat : 'off';
  if (typeof session.muted === 'boolean') state.player.muted = session.muted;
  const seek = Math.max(0, Number(session.position) || 0);
  await startCurrent({ restore: true, paused: true, seek });
  const track = currentTrack();
  if (track) toast(`Sigues en <strong>${esc(track.title)}</strong>. Pulsa play para continuar.`, 'play', 3800);
}

async function setVolume(value, options = {}) {
  const p = state.player;
  p.volume = clamp(Number(value) || 0, 0, 1);
  p.muted = p.volume === 0;
  if (!p.muted) p.lastVolume = p.volume;
  state.prefs.volume = p.volume;
  if (!options.transient) savePrefs();
  updatePlayerUI();
  try { await engine.volume(p.muted ? 0 : p.volume); } catch (_) {}
}

async function toggleMute() {
  const p = state.player;
  if (p.volume > 0) {
    p.lastVolume = p.volume;
    p.volume = 0;
    p.muted = true;
  } else {
    p.volume = p.lastVolume || 0.78;
    p.muted = false;
  }
  state.prefs.volume = p.volume;
  savePrefs();
  updatePlayerUI();
  try { await engine.volume(p.muted ? 0 : p.volume); } catch (_) {}
}

async function nextTrack(manual = false) {
  const p = state.player;
  if (!p.queue.length) return;
  if (!manual && p.repeat === 'one') {
    p.position = 0;
    await startCurrent();
    return;
  }
  if (p.index + 1 < p.queue.length) {
    if (wantsRadio(p.context) && p.queue.length - p.index < 4) fillRadioQueue(p.trackId);
    p.index += 1;
    p.trackId = p.queue[p.index];
    await startCurrent();
    return;
  }
  if (p.repeat === 'all') {
    p.index = 0;
    p.trackId = p.queue[0];
    await startCurrent();
    return;
  }
  if (wantsRadio(p.context)) {
    await fillRadioQueue(p.trackId);
    if (p.index + 1 < p.queue.length) {
      p.index += 1;
      p.trackId = p.queue[p.index];
      await startCurrent();
      return;
    }
  }
  p.playing = false;
  p.position = p.duration;
  updatePlayerUI();
  renderContext();
}

function wantsRadio(context) {
  const key = String(context?.key || '');
  return key.startsWith('search:') || key.startsWith('single:') || key.startsWith('radio:');
}

function relatedTracks(seed, limit = 12) {
  if (!seed) return [];
  const seen = new Set([seed.id, ...(state.player.queue || [])]);
  const pool = sortedLocalTracks();
  const ranked = [];
  pool.forEach((track) => {
    if (!track || seen.has(track.id)) return;
    let score = 0;
    if (track.artist && seed.artist && fold(track.artist) === fold(seed.artist)) score += 8;
    if (track.album && seed.album && fold(track.album) === fold(seed.album)) score += 4;
    if (track.genre && seed.genre && fold(track.genre) === fold(seed.genre)) score += 3;
    if (score) ranked.push({ id: track.id, score });
  });
  ranked.sort((a, b) => b.score - a.score);
  const out = ranked.map((item) => item.id);
  if (out.length < limit) {
    const rest = pool.filter((track) => track && !seen.has(track.id) && !out.includes(track.id));
    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    rest.slice(0, limit - out.length).forEach((track) => out.push(track.id));
  }
  return out.slice(0, limit);
}

async function fillRadioQueue(seedId) {
  const seed = trackFromId(seedId);
  if (!seed) return;
  const p = state.player;
  const remaining = p.queue.length - p.index - 1;
  if (remaining >= 8) return;
  let extra = relatedTracks(seed, 12);
  if (IS_TAURI && extra.length < 8) {
    try {
      const query = seed.artist && seed.artist !== 'Artista desconocido' ? `${seed.artist} mix` : seed.title;
      const results = await inv('search_online', { query });
      (Array.isArray(results) ? results : []).forEach((item) => {
        const id = adoptStreamTrack(item, { silent: true }).id;
        if (id && id !== seed.id && !p.queue.includes(id) && !extra.includes(id)) extra.push(id);
      });
      persistStreams();
    } catch (_) {}
  }
  extra = extra.filter((id) => id && !p.queue.includes(id)).slice(0, 12);
  if (!extra.length) return;
  p.queue.push(...extra);
  if (p.unshuffled) p.unshuffled.push(...extra);
  if (state.prefs.contextTab === 'queue') renderContext();
}

async function previousTrack() {
  const p = state.player;
  if (!p.queue.length) return;
  if (p.position > 3) {
    await seekTo(0);
    return;
  }
  if (p.index > 0) {
    p.index -= 1;
    p.trackId = p.queue[p.index];
    await startCurrent();
  } else {
    await seekTo(0);
  }
}

function handleTrackEnded() {
  const now = Date.now();
  if (now - state.player.endedAt < 1200) return;
  state.player.endedAt = now;
  recordTrackComplete(state.player.trackId);
  if (state.player.repeat === 'one') {
    startCurrent();
    return;
  }
  nextTrack(false);
}

function startPolling() {
  let wasPlaying = false;
  const tick = async () => {
    if (!state.player.trackId) return;
    try {
      const s = await engine.read();
      if (!s) return;
      const p = state.player;
      if (Number(s.duration) > 0) p.duration = Number(s.duration);
      if (!state.ui.draggingProgress) p.position = Number(s.position) || 0;
      const nowPlaying = Boolean(s.playing);
      if (nowPlaying !== p.playing) {
        p.playing = nowPlaying;
        updatePlayerUI();
        if (state.prefs.contextTab === 'queue') refreshQueueStateLabel();
      }
      if (IS_TAURI && s.ended) {
        handleTrackEnded();
      } else if (!IS_TAURI && s.ended) {
        // El evento `ended` del navegador ya lo gestiona; este es el respaldo.
        handleTrackEnded();
      }
      wasPlaying = nowPlaying;
      updateProgressOnly();
      if ((els.immersive && !els.immersive.hidden) || state.prefs.contextTab === 'lyrics') updateLyricsHighlight();
      if (nowPlaying) scheduleSessionSave();
    } catch (_) {}
  };
  window.setInterval(tick, 480);
}

function updateProgressOnly() {
  const p = state.player;
  const pct = p.duration > 0 ? clamp((p.position / p.duration) * 100, 0, 100) : 0;
  if (els.progressFill) els.progressFill.style.width = `${pct}%`;
  if (els.currentTime) els.currentTime.textContent = fmtTime(p.position);
  if (els.totalTime) els.totalTime.textContent = fmtTime(p.duration);
  if (els.progress) {
    els.progress.setAttribute('aria-valuenow', String(Math.round(pct)));
    els.progress.setAttribute('aria-valuetext', `${fmtTime(p.position)} de ${fmtTime(p.duration)}`);
  }
  if (els.playerbar) {
    els.playerbar.classList.toggle('is-playing', p.playing);
    els.playerbar.classList.toggle('is-loading', p.loading);
  }
  if (els.immersive && !els.immersive.hidden) {
    if (els.immersiveProgressFill) els.immersiveProgressFill.style.width = `${pct}%`;
    if (els.immersiveCurrent) els.immersiveCurrent.textContent = fmtTime(p.position);
    if (els.immersiveTotal) els.immersiveTotal.textContent = fmtTime(p.duration);
  }
  const use = qs('#playBtn use');
  if (use) use.setAttribute('href', `#i-${p.playing ? 'pause' : 'play'}`);
  qsa('.media-card.is-playing .media-card__play use, .quick-card.is-playing .quick-card__play use').forEach((u) => u.setAttribute('href', `#i-${p.playing ? 'pause' : 'play'}`));
}

/* ---------- me gusta, cola ---------- */

function isLikedCollectionName(name) {
  const n = fold(name);
  return n === 'liked songs' || n === 'me gusta' || n === 'liked' || n === 'liked music'
    || n === 'canciones que te gustan' || n === 'musica que te gusta' || n === 'me gusta · spotify'
    || n.startsWith('me gusta') || n.includes('liked songs') || n.includes('liked music');
}

function addIdsToLikes(ids) {
  const set = new Set(state.likes);
  let added = 0;
  (ids || []).forEach((id) => {
    if (!id || set.has(id)) return;
    set.add(id);
    state.likes.push(id);
    added += 1;
  });
  if (added) writeStore(STORE.likes, state.likes);
  updateLikedCount();
  return added;
}

function absorbImportedLikes() {
  const likedLists = (state.userPlaylists || []).filter((playlist) => isLikedCollectionName(playlist.name));
  if (!likedLists.length) return;
  likedLists.forEach((playlist) => addIdsToLikes(playlist.track_ids || []));
}

function toggleLike(trackId) {
  if (!trackId || !trackFromId(trackId)) return;
  const i = state.likes.indexOf(trackId);
  if (i >= 0) state.likes.splice(i, 1);
  else state.likes.unshift(trackId);
  writeStore(STORE.likes, state.likes);
  state.recs = null;
  updateLikedCount();
  updatePlaybackClasses();
  updatePlayerUI();
  if (state.view.name === 'liked' || state.view.name === 'foryou') renderView();
  else {
    qsa(`[data-like="${CSS.escape(trackId)}"]`).forEach((btn) => {
      const active = state.likes.includes(trackId);
      btn.classList.toggle('is-liked', active);
      const use = btn.querySelector('use');
      if (use) use.setAttribute('href', `#i-${active ? 'heart-fill' : 'heart'}`);
      btn.setAttribute('aria-label', active ? 'Quitar de Me gusta' : 'Me gusta');
    });
  }
  if (state.ui.menuTrack === trackId && !els.trackMenu.hidden) updateTrackMenuLike(trackId);
}

function updateLikedCount() {
  if (els.likedCount) els.likedCount.textContent = String(state.likes.length);
}

async function playNext(trackId) {
  const track = trackFromId(trackId);
  if (!track) return;
  const p = state.player;
  if (!p.trackId) {
    p.queue = [trackId];
    p.index = 0;
    p.trackId = trackId;
    p.context = { key: `single:${trackId}`, label: track.title };
    await startCurrent();
    toast(`Sonando <strong>${esc(track.title)}</strong>.`, 'play');
    return;
  }
  p.queue = p.queue.filter((id, idx) => idx <= p.index || id !== trackId);
  p.index = Math.min(p.index, p.queue.length - 1);
  p.queue.splice(p.index + 1, 0, trackId);
  if (p.unshuffled) {
    p.unshuffled = p.unshuffled.filter((id) => id !== trackId);
    const cur = p.queue[p.index];
    const pos = p.unshuffled.indexOf(cur);
    if (pos >= 0) p.unshuffled.splice(pos + 1, 0, trackId);
    else p.unshuffled.push(trackId);
  }
  renderContext();
  toast(`<strong>${esc(track.title)}</strong> suena a continuación.`, 'next');
}

async function addToQueue(trackId) {
  const track = trackFromId(trackId);
  if (!track) return;
  const p = state.player;
  if (!p.trackId) {
    p.queue = [trackId];
    p.index = -1;
    p.context = { key: `single:${trackId}`, label: track.title };
    updatePlayerUI();
    toast(`<strong>${esc(track.title)}</strong> espera en la cola.`, 'queue');
    renderContext();
    return;
  }
  p.queue.push(trackId);
  if (p.unshuffled) p.unshuffled.push(trackId);
  renderContext();
  toast(`<strong>${esc(track.title)}</strong> añadida a la cola.`, 'queue');
}

function addContextToQueue(key) {
  const context = collectContext(key);
  if (!context.ids.length) return;
  const p = state.player;
  if (!p.trackId) {
    p.queue = context.ids.slice();
    p.index = -1;
    p.context = { key: context.key, label: context.label };
    updatePlayerUI();
    renderContext();
    toast(`${plural(context.ids.length, 'canción añadida', 'canciones añadidas')} a la cola.`, 'queue');
    return;
  }
  p.queue.push(...context.ids);
  if (p.unshuffled) p.unshuffled.push(...context.ids);
  renderContext();
  toast(`${plural(context.ids.length, 'canción añadida', 'canciones añadidas')} a la cola.`, 'queue');
}

async function setShuffle(value) {
  const p = state.player;
  const next = value == null ? !p.shuffle : Boolean(value);
  if (next === p.shuffle) return;
  p.shuffle = next;
  if (p.trackId && p.queue.length) {
    const cur = p.trackId;
    if (next) {
      p.unshuffled = p.queue.slice();
      const rest = p.queue.filter((id) => id !== cur);
      for (let i = rest.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      p.queue = [cur, ...rest];
      p.index = 0;
    } else if (p.unshuffled) {
      const pos = p.unshuffled.indexOf(cur);
      p.queue = p.unshuffled.slice();
      p.index = pos >= 0 ? pos : 0;
      p.unshuffled = null;
    }
  }
  savePrefs();
  updatePlayerUI();
  renderContext();
  scheduleSessionSave();
  toast(next ? 'Aleatorio activado.' : 'Aleatorio desactivado.', 'shuffle');
}

function cycleRepeat() {
  const order = ['off', 'all', 'one'];
  state.player.repeat = order[(order.indexOf(state.player.repeat) + 1) % order.length];
  savePrefs();
  updatePlayerUI();
  scheduleSessionSave();
  toast(state.player.repeat === 'off' ? 'Repetición desactivada.' : state.player.repeat === 'all' ? 'Repetir toda la cola.' : 'Repetir esta canción.', 'repeat');
}

function isQueueCurrent(index) {
  const p = state.player;
  return p.trackId === p.queue[index];
}

function queuedTracks() {
  const p = state.player;
  return p.queue.map(trackFromId).filter(Boolean);
}

/* ---------- panel contextual ---------- */

function setContextTab(tab, open = true) {
  if (tab !== 'queue' && tab !== 'lyrics') return;
  state.prefs.contextTab = tab;
  savePrefs();
  qsa('[data-context-tab]').forEach((btn) => {
    const active = btn.dataset.contextTab === tab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  renderContext();
  if (tab === 'lyrics') ensureLyrics(currentTrack());
  if (open && window.innerWidth <= 1260) {
    els.contextPanel.classList.add('is-open');
    els.scrim.classList.add('is-visible');
  }
}

function closeContextPanel() {
  els.contextPanel.classList.remove('is-open');
  els.scrim.classList.remove('is-visible');
}

function toggleContextPanel(tab) {
  const narrow = window.innerWidth <= 1260;
  const already = state.prefs.contextTab === tab && els.contextPanel.classList.contains('is-open');
  if (narrow && already) {
    closeContextPanel();
    return;
  }
  setContextTab(tab, true);
}

function renderContext() {
  if (!els.contextBody) return;
  if (state.prefs.contextTab === 'lyrics') {
    els.contextBody.innerHTML = renderLyricsPanel();
    updateLyricsHighlight(true);
  } else {
    els.contextBody.innerHTML = renderQueuePanel();
  }
}

function renderQueuePanel() {
  const p = state.player;
  const track = currentTrack();
  const upcoming = p.queue.slice(p.index + 1);
  if (!track && !upcoming.length) {
    return `<div class="now-panel__empty">
      <div class="now-panel__empty-art">${icon('waveform')}</div>
      <h3>La cola está en calma</h3>
      <p>Elige una canción y aquí verás lo que viene después. Tú decides el orden, siempre.</p>
      <button class="btn btn--primary" data-open="explore">${icon('compass')} Buscar algo</button>
    </div>`;
  }
  const accent = track?.accent || '#ffa094';
  const stateLabel = p.playing ? 'Sonando ahora' : p.loading ? 'Cargando' : 'En pausa';
  const now = track ? `<div class="now-panel ${p.playing ? 'is-playing' : ''}" style="--now-accent:${hex(accent)}">
    <div class="now-panel__top">
      <div class="now-panel__state">
        ${p.playing ? `<span class="eq-inline"><span></span><span></span><span></span><span></span></span>` : `<span class="status-dot"></span>`}
        <span>${stateLabel}</span>
      </div>
      <div class="now-panel__more">
        <button class="icon-btn icon-btn--small ${state.likes.includes(track.id) ? 'is-liked' : ''}" data-like="${esc(track.id)}" aria-label="Me gusta">${icon(state.likes.includes(track.id) ? 'heart-fill' : 'heart')}</button>
        <button class="icon-btn icon-btn--small" data-add-track="${esc(track.id)}" aria-label="Añadir a playlist">${icon('plus')}</button>
      </div>
    </div>
    <div class="now-panel__art-wrap">
      <div class="now-panel__glow"></div>
      <div class="now-panel__vinyl"></div>
      <button class="now-panel__art" data-open-immersive aria-label="Abrir reproductor inmersivo">
        ${coverImg(track, '', track.title)}
        <span class="now-panel__badge"><span class="status-dot"></span> ${sourceLabel(track)}</span>
      </button>
    </div>
    <div class="now-panel__meta">
      <div class="now-panel__title-row"><div class="now-panel__title">${esc(track.title)}</div></div>
      <div class="now-panel__artist"><button data-open="artist:${esc(artistForTrack(track)?.id || '')}">${esc(track.artist)}</button></div>
      <div class="now-panel__album"><button data-open="album:${esc(albumForTrack(track)?.id || '')}">${esc(track.album)}</button>${track.year ? ` · ${track.year}` : ''}</div>
    </div>
    <div class="now-panel__actions">
      <button class="icon-btn ${state.likes.includes(track.id) ? 'is-liked' : ''}" data-like="${esc(track.id)}" aria-label="Me gusta">${icon(state.likes.includes(track.id) ? 'heart-fill' : 'heart')}</button>
      <button class="icon-btn" data-add-track="${esc(track.id)}" aria-label="Añadir a playlist">${icon('plus')}</button>
      <span class="spacer"></span>
      <span class="now-panel__source">${icon(track.source === 'stream' ? 'youtube' : 'shield')} ${sourceLabel(track)}</span>
    </div>
    <div class="now-panel__tabs-note"></div>
  </div>` : '';

  const next = upcoming.length ? `
    <div class="now-panel__section-label"><span>A continuación</span><span>${plural(upcoming.length, 'canción', 'canciones')}</span></div>
    ${upcoming.map((tid, i) => {
      const t = trackFromId(tid);
      if (!t) return '';
      const idx = p.index + 1 + i;
      return `<div class="queue-item ${isQueueCurrent(idx) ? 'is-current' : ''}" data-queue-index="${idx}" draggable="true" tabindex="0">
        <span class="queue-item__index">${i + 1}</span>
        <span class="queue-item__art"><img src="${esc(coverSrc(t))}" alt=""></span>
        <span class="queue-item__copy"><strong>${esc(t.title)}</strong><span>${esc(t.artist)} · ${esc(t.album)}</span></span>
        <span class="queue-item__end">${fmtTime(t.duration)}</span>
        <span class="queue-item__drag">${icon('list')}</span>
      </div>`;
    }).join('')}
    <div class="queue-hint">Arrastra para reordenar. <kbd>Q</kbd> abre esta cola; <kbd>Espacio</kbd> pausa sin perder el hilo.</div>`
    : `<div class="now-panel__section-label"><span>A continuación</span><span>Sin más</span></div>
      <div class="inline-empty">No hay nada más en la cola. Cuando termine, el silencio es tuyo.<br><br><button class="btn btn--soft" data-open="library">${icon('library')} Elegir más música</button></div>`;
  return `${now}${next}`;
}

function refreshQueueStateLabel() {
  if (state.prefs.contextTab !== 'queue') return;
  const panel = qs('.now-panel', els.contextBody);
  if (!panel) return;
  const label = qs('.now-panel__state span:last-child', panel);
  if (!label) return;
  const p = state.player;
  label.textContent = p.playing ? 'Sonando ahora' : p.loading ? 'Cargando' : 'En pausa';
  panel.classList.toggle('is-playing', p.playing);
  const first = qs('.now-panel__state', panel);
  if (first) {
    const hasEq = Boolean(qs('.eq-inline', first));
    if (p.playing && !hasEq) first.insertAdjacentHTML('afterbegin', `<span class="eq-inline"><span></span><span></span><span></span><span></span></span>`);
    if (!p.playing && hasEq) qs('.eq-inline', first).remove();
  }
}

function lyricMarkup(track, cls = '') {
  if (!track || !track.lyrics || !track.lyrics.length) return '';
  const synced = track.lyricsSynced !== false && track.lyrics.some((line) => Number(line.t) >= 0);
  const extra = synced ? cls : `${cls} lyrics-list--plain`.trim();
  return `<div class="lyrics-list ${extra}">${track.lyrics.map((line) => {
    const time = Number(line.t);
    const seek = Number.isFinite(time) && time >= 0 ? `data-seek-time="${time}"` : '';
    return `<button class="lyrics-line" ${seek}>${esc(line.text)}</button>`;
  }).join('')}</div>`;
}

function persistLyrics() {
  writeStore(STORE.lyrics, state.ui.lyrics.byId || {});
}

function applyLyricsToTrack(track, result) {
  if (!track || !result) return;
  track.lyrics = Array.isArray(result.lines) ? result.lines : [];
  track.lyricsSynced = Boolean(result.synced);
  track.lyricsSource = result.source || 'LRCLIB';
  track.lyricsInstrumental = Boolean(result.instrumental);
  state.ui.lyrics.byId[track.id] = {
    lines: track.lyrics,
    synced: track.lyricsSynced,
    source: track.lyricsSource,
    instrumental: track.lyricsInstrumental,
    at: Date.now(),
  };
  persistLyrics();
  if (track.source === 'stream') {
    const stored = (state.stream.tracks || []).find((item) => item.id === track.id);
    if (stored) {
      stored.lyrics = track.lyrics;
      stored.lyricsSynced = track.lyricsSynced;
      persistStreams();
    }
  }
}

async function ensureLyrics(track, options = {}) {
  if (!track) return null;
  if (track.lyrics && track.lyrics.length) return track.lyrics;
  const cached = state.ui.lyrics.byId[track.id];
  if (cached) {
    if (cached.instrumental) {
      track.lyricsInstrumental = true;
      return [];
    }
    if (cached.lines?.length) {
      track.lyrics = cached.lines;
      track.lyricsSynced = cached.synced;
      track.lyricsSource = cached.source;
      return cached.lines;
    }
    if (cached.missing && !options.force) return [];
  }
  if (!IS_TAURI) return [];
  if (state.ui.lyrics.loading[track.id]) return null;
  state.ui.lyrics.loading[track.id] = true;
  state.ui.lyrics.error[track.id] = '';
  if (options.render !== false && state.prefs.contextTab === 'lyrics') renderContext();
  try {
    const result = await inv('fetch_lyrics', {
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      duration: Number(track.duration) || 0,
    });
    if (result?.instrumental) {
      applyLyricsToTrack(track, { ...result, lines: [] });
      return [];
    }
    if (result?.found && result.lines?.length) {
      applyLyricsToTrack(track, result);
      return result.lines;
    }
    state.ui.lyrics.byId[track.id] = { missing: true, at: Date.now() };
    persistLyrics();
    return [];
  } catch (error) {
    state.ui.lyrics.error[track.id] = error?.message || String(error || 'No se pudo buscar la letra.');
    return [];
  } finally {
    delete state.ui.lyrics.loading[track.id];
    if (options.render !== false) {
      if (state.prefs.contextTab === 'lyrics') renderContext();
      if (els.immersive && !els.immersive.hidden) {
        state.ui.immersiveTrackId = '';
        updateImmersive();
      }
    }
  }
}

function renderLyricsPanel() {
  const track = currentTrack();
  if (!track) {
    return `<div class="lyrics-empty">
      <div class="lyrics-empty__orbit">${icon('mic')}</div>
      <h3>Aquí vive la letra</h3>
      <p>Cuando suene una canción, Davusic busca la letra en línea y la sincroniza si existe.</p>
    </div>`;
  }
  if (state.ui.lyrics.loading[track.id]) {
    return `<div class="lyrics-empty">
      <div class="lyrics-empty__orbit"><span class="spinner"></span></div>
      <h3>Buscando letra</h3>
      <p>Consultando LRCLIB para ${esc(track.title)} · ${esc(track.artist)}.</p>
    </div>`;
  }
  if (track.lyricsInstrumental || state.ui.lyrics.byId[track.id]?.instrumental) {
    return `<div class="lyrics-empty">
      <div class="lyrics-empty__orbit">${icon('waveform')}</div>
      <h3>Instrumental</h3>
      <p>Esta canción no trae letra. El silencio también cuenta.</p>
    </div>`;
  }
  if (track.lyrics && track.lyrics.length) {
    const source = track.lyricsSource || (track.source === 'demo' ? 'Demo' : 'LRCLIB');
    return `<div class="lyrics-panel">
      <div class="lyrics-head"><span class="eyebrow">Letra</span><span class="lyrics-head__source">${esc(source)}${track.lyricsSynced ? ' · sincronizada' : ''}</span></div>
      <div class="lyrics-scroll">${lyricMarkup(track)}</div>
    </div>`;
  }
  const error = state.ui.lyrics.error[track.id];
  return `<div class="lyrics-empty">
    <div class="lyrics-empty__orbit">${icon('mic')}</div>
    <h3>${error ? 'No se pudo buscar' : 'Sin letra todavía'}</h3>
    <p>${error ? esc(error) : 'No encontré letra para esta canción. Puedes volver a intentarlo.'}</p>
    <button class="btn btn--soft" data-lyrics-retry>${icon('search')} Buscar de nuevo</button>
  </div>`;
}

function updateLyricsHighlight(force = false) {
  const track = currentTrack();
  if (!track || !track.lyrics || !track.lyrics.length) return;
  if (track.lyricsSynced === false || track.lyrics.every((line) => Number(line.t) < 0)) return;
  let active = -1;
  for (let i = 0; i < track.lyrics.length; i += 1) {
    if ((Number(track.lyrics[i].t) || 0) <= state.player.position + 0.15) active = i;
    else break;
  }
  if (!force && active === state.ui.lastLyricLine) {
    qsa('.lyrics-line').forEach((el, i) => {
      el.classList.toggle('is-active', i === active);
      el.classList.toggle('is-passed', i < active);
    });
    return;
  }
  state.ui.lastLyricLine = active;
  qsa('.lyrics-line').forEach((el, i) => {
    el.classList.toggle('is-active', i === active);
    el.classList.toggle('is-passed', i < active);
  });
  if (active >= 0) {
    const containers = [qs('.lyrics-scroll', els.contextBody), els.immersiveLyrics];
    containers.forEach((container) => {
      if (!container || container.offsetParent === null) return;
      const el = container.querySelectorAll('.lyrics-line')[active];
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
}

/* ---------- inmersivo ---------- */

let immersiveCloseTimer = 0;

function openImmersive() {
  const track = currentTrack();
  if (!track) {
    toast('Pon una canción primero. El modo inmersivo se lo merece.', 'expand');
    return;
  }
  window.clearTimeout(immersiveCloseTimer);
  els.immersive.hidden = false;
  els.immersive.classList.remove('is-closing');
  updateImmersive();
  updateLyricsHighlight(true);
}

function closeImmersive() {
  if (els.immersive.hidden) return;
  els.immersive.classList.add('is-closing');
  window.clearTimeout(immersiveCloseTimer);
  immersiveCloseTimer = window.setTimeout(() => {
    els.immersive.hidden = true;
    els.immersive.classList.remove('is-closing');
  }, 330);
}

function updateImmersive() {
  const track = currentTrack();
  if (!track) return;
  const p = state.player;
  const accent = track.accent || '#ffa094';
  const art = coverSrc(track);
  els.immersive.classList.toggle('is-playing', p.playing);
  els.immersive.style.setProperty('--immersive-accent', hex(accent));
  els.immersiveBackdrop.style.backgroundImage = cssUrl(art);
  setImage(els.immersiveArt, art);
  els.immersiveGlow.style.background = hex(accent);
  els.immersiveTitle.textContent = track.title;
  els.immersiveArtist.innerHTML = `<button data-open="artist:${esc(artistForTrack(track)?.id || '')}">${esc(track.artist)}</button>`;
  els.immersiveAlbum.textContent = `${track.album}${track.year ? ` · ${track.year}` : ''}`;
  els.immersiveSource.textContent = sourceLabel(track, { long: true });
  const pct = p.duration > 0 ? clamp((p.position / p.duration) * 100, 0, 100) : 0;
  els.immersiveProgressFill.style.width = `${pct}%`;
  els.immersiveCurrent.textContent = fmtTime(p.position);
  els.immersiveTotal.textContent = fmtTime(p.duration);
  els.immersiveShuffle.classList.toggle('is-on', p.shuffle);
  if (els.immersivePlay) els.immersivePlay.setAttribute('aria-label', p.playing ? 'Pausar' : 'Reproducir');
  const liked = state.likes.includes(track.id);
  els.immersiveLike.classList.toggle('is-liked', liked);
  const heartUse = els.immersiveLike.querySelector('use');
  if (heartUse) heartUse.setAttribute('href', `#i-${liked ? 'heart-fill' : 'heart'}`);
  if (state.ui.immersiveTrackId !== track.id) {
    state.ui.immersiveTrackId = track.id;
    if (state.ui.lyrics.loading[track.id]) {
      els.immersiveLyrics.innerHTML = `<p class="dim">Buscando letra…</p>`;
    } else if (track.lyricsInstrumental) {
      els.immersiveLyrics.innerHTML = `<p class="dim">Esta canción es instrumental.</p>`;
    } else {
      els.immersiveLyrics.innerHTML = track.lyrics && track.lyrics.length
        ? lyricMarkup(track)
        : `<p class="dim">Buscando letra en línea…</p>`;
    }
    state.ui.lastLyricLine = -1;
    ensureLyrics(track);
  }
  updateLyricsHighlight(true);
}

/* ---------- barra lateral y búsqueda ---------- */

function updateLibraryPill() {
  const local = state.local.tracks.length;
  const streamed = (state.stream.tracks || []).length;
  const demo = state.demo.tracks.length;
  const total = local + streamed;
  if (els.libraryPillText) {
    els.libraryPillText.textContent = total
      ? `${total} ${total === 1 ? 'pista' : 'pistas'}`
      : `${demo} ${demo === 1 ? 'pista demo' : 'pistas demo'}`;
  }
  if (els.titlebarStatus) {
    if (streamed && local) els.titlebarStatus.textContent = `${local} locales · ${streamed} en streaming`;
    else if (streamed) els.titlebarStatus.textContent = `Streaming · ${streamed} ${streamed === 1 ? 'pista' : 'pistas'}`;
    else if (local) els.titlebarStatus.textContent = `Biblioteca local · ${local} ${local === 1 ? 'pista' : 'pistas'}`;
    else els.titlebarStatus.textContent = 'Sin pistas todavía';
  }
}

function updateSidebarActive() {
  const name = state.view.name;
  const navMap = { home: 'home', foryou: 'foryou', explore: 'explore', radio: 'radio', library: 'library', liked: 'liked', recent: 'recent' };
  qsa('[data-nav]').forEach((btn) => {
    const active = btn.dataset.nav === navMap[name];
    btn.classList.toggle('is-active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  qsa('.playlist-nav__item').forEach((btn) => {
    const active = name === 'playlist' && btn.dataset.playlistId === state.view.params.id;
    btn.classList.toggle('is-active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
}

function playlistAccent(playlist, index = 0) {
  const colors = ['#ffa094', '#f5c77e', '#8fe3c0', '#93c9f5', '#c3a8f0', '#f39ab2', '#9ed6a8'];
  if (playlist.track_ids && playlist.track_ids.length) {
    const t = trackFromId(playlist.track_ids[0]);
    if (t?.accent) return t.accent;
  }
  return colors[index % colors.length];
}

function renderSidebar() {
  if (!els.playlistNav) return;
  const all = state.playlists;
  els.playlistNav.innerHTML = all.length
    ? all.map((p, i) => `<button class="playlist-nav__item ${state.view.name === 'playlist' && state.view.params.id === p.id ? 'is-active' : ''}" data-open="playlist:${esc(p.id)}" data-playlist-id="${esc(p.id)}" title="${esc(p.name)}">
        <span class="playlist-nav__glyph" style="--playlist-accent:${hex(playlistAccent(p, i))}"></span>
        <span class="playlist-nav__name">${esc(p.name)}</span>
      </button>`).join('')
    : `<div class="sidebar__empty">Aún no hay playlists. Crea una con el <strong>+</strong>.</div>`;
  updateLikedCount();
  updateLibraryPill();
  updateSidebarActive();
}

function updateSearchBox() {
  if (!els.searchbox || !els.searchInput) return;
  els.searchbox.classList.toggle('has-value', Boolean(els.searchInput.value.trim()));
  if (els.searchClear) els.searchClear.setAttribute('aria-hidden', els.searchInput.value.trim() ? 'false' : 'true');
}

let searchDebounce = 0;

function handleSearchInput(options = {}) {
  if (!els.searchInput) return;
  state.ui.query = els.searchInput.value;
  updateSearchBox();
  window.clearTimeout(searchDebounce);
  const run = () => {
    const q = state.ui.query.trim();
    if (!q && state.view.name !== 'search') return;
    navigate('search', { q }, { replace: true, keepScroll: true, focus: false });
  };
  if (options.immediate) run();
  else searchDebounce = window.setTimeout(run, 160);
}

function clearSearch(options = {}) {
  if (els.searchInput) els.searchInput.value = '';
  state.ui.query = '';
  updateSearchBox();
  window.clearTimeout(searchDebounce);
  if (options.keepView) return;
  if (state.view.name === 'search') navigate('home');
  else if (els.searchInput && options.focus !== false) els.searchInput.focus();
}

function runSearch(value, options = {}) {
  const q = String(value || '').trim();
  if (els.searchInput) els.searchInput.value = q;
  state.ui.query = q;
  updateSearchBox();
  if (q) {
    const history = [q, ...(state.prefs.searchHistory || []).filter((item) => fold(item) !== fold(q))].slice(0, 8);
    state.prefs.searchHistory = history.filter(Boolean);
    savePrefs();
    recordSearchSignal(q);
  }
  navigate('search', { q }, { replace: state.view.name === 'search' || options.replace });
}

/* ---------- menús flotantes ---------- */

function closeMenus() {
  if (els.trackMenu) els.trackMenu.hidden = true;
  if (els.addMenu) els.addMenu.hidden = true;
  state.ui.menuTrack = null;
  state.ui.addMenuTrack = null;
}

function placeFloating(el, x, y) {
  if (!el) return;
  const pad = 12;
  el.style.left = '0px';
  el.style.top = '0px';
  const width = el.offsetWidth || 246;
  const height = el.offsetHeight || 240;
  let left = x - width;
  let top = y + 6;
  if (left < pad) left = x + 6;
  if (left + width > window.innerWidth - pad) left = window.innerWidth - pad - width;
  if (top + height > window.innerHeight - pad) top = y - height - 6;
  left = clamp(left, pad, Math.max(pad, window.innerWidth - width - pad));
  top = clamp(top, pad, Math.max(pad, window.innerHeight - height - pad));
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
}

function anchorPoint(anchor) {
  if (anchor && anchor.getBoundingClientRect) {
    const r = anchor.getBoundingClientRect();
    return { x: r.right, y: r.bottom };
  }
  return { x: window.innerWidth - 24, y: 80 };
}

function updateTrackMenuLike(trackId) {
  if (!els.trackMenuLike) return;
  const liked = state.likes.includes(trackId);
  els.trackMenuLike.textContent = liked ? 'Quitar de Me gusta' : 'Me gusta';
  const btn = qs('[data-menu-action="like"]', els.trackMenu);
  if (btn) {
    const use = btn.querySelector('use');
    if (use) use.setAttribute('href', `#i-${liked ? 'heart-fill' : 'heart'}`);
  }
}

function openTrackMenu(trackId, anchor) {
  const track = trackFromId(trackId);
  if (!track) return;
  closeMenus();
  state.ui.menuTrack = trackId;
  const album = albumForTrack(track);
  const artist = artistForTrack(track);
  if (els.trackMenuHeader) {
    els.trackMenuHeader.innerHTML = `<span class="track-menu__cover"><img src="${esc(coverSrc(track))}" alt=""></span><span class="track-menu__copy"><strong>${esc(track.title)}</strong><span>${esc(track.artist)}</span></span>`;
  }
  updateTrackMenuLike(trackId);
  qsa('[data-menu-action]', els.trackMenu).forEach((btn) => {
    const action = btn.dataset.menuAction;
    let disabled = false;
    if (action === 'album') disabled = !album;
    if (action === 'artist') disabled = !artist;
    if (action === 'folder') disabled = track.source !== 'local' || !track.path;
    btn.disabled = disabled;
  });
  els.trackMenu.hidden = false;
  const point = anchorPoint(anchor);
  placeFloating(els.trackMenu, point.x, point.y);
}

function renderAddMenuList() {
  if (!els.addMenuList) return;
  const playlists = state.userPlaylists;
  if (!playlists.length) {
    els.addMenuList.innerHTML = `<div class="add-menu__empty">Todavía no tienes playlists propias. Crea una y añade esta canción.</div>`;
    return;
  }
  els.addMenuList.innerHTML = playlists.map((p, i) => `<button data-add-to-playlist="${esc(p.id)}">
    <span class="playlist-nav__glyph" style="--playlist-accent:${hex(playlistAccent(p, i))}"></span>
    <span class="add-menu__name">${esc(p.name)}</span>
    <span class="add-menu__count">${(p.track_ids || []).length}</span>
  </button>`).join('');
}

function openAddMenu(trackId, anchor) {
  const track = trackFromId(trackId);
  if (!track) return;
  closeMenus();
  state.ui.addMenuTrack = trackId;
  renderAddMenuList();
  els.addMenu.hidden = false;
  const point = anchorPoint(anchor);
  placeFloating(els.addMenu, point.x, point.y);
}

function closeFloatingMenusOnOutside(event) {
  if (els.trackMenu && !els.trackMenu.hidden && !els.trackMenu.contains(event.target) && !event.target.closest('[data-more-track]')) {
    els.trackMenu.hidden = true;
    state.ui.menuTrack = null;
  }
  if (els.addMenu && !els.addMenu.hidden && !els.addMenu.contains(event.target) && !event.target.closest('[data-add-track]') && !event.target.closest('#playerAdd')) {
    els.addMenu.hidden = true;
    state.ui.addMenuTrack = null;
  }
}

/* ---------- playlists ---------- */

function openPlaylistModal(trackId = null) {
  state.ui.pendingPlaylistTrack = trackId || null;
  if (els.playlistForm) els.playlistForm.reset();
  if (els.playlistName) els.playlistName.value = '';
  if (els.playlistDescription) els.playlistDescription.value = '';
  if (els.playlistModal) {
    els.playlistModal.hidden = false;
    window.setTimeout(() => els.playlistName?.focus(), 30);
  }
}

function closePlaylistModal() {
  if (els.playlistModal) els.playlistModal.hidden = true;
  state.ui.pendingPlaylistTrack = null;
}

function persistPlaylists() {
  state.recs = null;
  if (!IS_TAURI) writeStore(STORE.playlists, state.userPlaylists);
  persistCatalog();
}

let catalogSaveTimer = 0;
function persistCatalog() {
  if (!IS_TAURI) return;
  window.clearTimeout(catalogSaveTimer);
  catalogSaveTimer = window.setTimeout(() => {
    inv('save_user_catalog', {
      streams: state.stream.tracks || [],
      playlists: state.userPlaylists || [],
    }).catch((error) => {
      toast(`No se pudo guardar la biblioteca. ${esc(error?.message || error || '')}`, 'bell', 5200);
    });
  }, 120);
}

function submitPlaylistForm(event) {
  event.preventDefault();
  const name = String(els.playlistName?.value || '').trim();
  if (!name) {
    toast('Ponle un nombre a la playlist.', 'bell');
    els.playlistName?.focus();
    return;
  }
  const description = String(els.playlistDescription?.value || '').trim();
  const pending = state.ui.pendingPlaylistTrack;
  const track = pending ? trackFromId(pending) : null;
  const id = uid('playlist');
  const playlist = {
    id,
    name,
    description,
    source: 'user',
    accent: track?.accent || playlistAccent({}, state.userPlaylists.length),
    created_at: Date.now(),
    track_ids: track ? [track.id] : [],
  };
  state.userPlaylists.push(playlist);
  persistPlaylists();
  rebuildLibrary();
  renderSidebar();
  closePlaylistModal();
  navigate('playlist', { id });
  toast(`Playlist <strong>${esc(name)}</strong> creada${track ? ` con <strong>${esc(track.title)}</strong>` : ''}.`, 'plus');
}

function addTrackToPlaylist(playlistId, trackId) {
  const playlist = state.userPlaylists.find((p) => p.id === playlistId);
  const track = trackFromId(trackId);
  if (!playlist || !track) return;
  if (!Array.isArray(playlist.track_ids)) playlist.track_ids = [];
  if (playlist.track_ids.includes(trackId)) {
    toast(`<strong>${esc(track.title)}</strong> ya está en <strong>${esc(playlist.name)}</strong>.`, 'check');
    closeMenus();
    return;
  }
  playlist.track_ids.push(trackId);
  persistPlaylists();
  rebuildLibrary();
  renderSidebar();
  if (state.view.name === 'playlist' && state.view.params.id === playlistId) renderView();
  closeMenus();
  toast(`<strong>${esc(track.title)}</strong> añadida a <strong>${esc(playlist.name)}</strong>.`, 'check');
}

function deleteUserPlaylist(id) {
  const playlist = state.userPlaylists.find((p) => p.id === id);
  if (!playlist) return;
  if (!window.confirm(`¿Eliminar la playlist «${playlist.name}»? Las canciones seguirán en tu biblioteca.`)) return;
  state.userPlaylists = state.userPlaylists.filter((p) => p.id !== id);
  persistPlaylists();
  rebuildLibrary();
  renderSidebar();
  if (state.view.name === 'playlist' && state.view.params.id === id) navigate('library');
  toast(`Playlist <strong>${esc(playlist.name)}</strong> eliminada.`, 'trash');
}

/* ---------- ajustes ---------- */

const THEMES = [
  { id: 'nocturne', name: 'Nocturno', bg: '#07090d', side: '#0c1218', main: '#15202b' },
  { id: 'neon', name: 'Neón / Cyberpunk', bg: '#120016', side: '#1a0722', main: '#3a0a4a' },
  { id: 'matrix', name: 'Matrix', bg: '#020804', side: '#05140a', main: '#0b2a14' },
  { id: 'ember', name: 'Ember', bg: '#0a090d', side: '#161018', main: '#2a1c24' },
  { id: 'paper', name: 'Claro', bg: '#eef2f6', side: '#dce4ec', main: '#ffffff' },
];

const ACCENTS = [
  { id: 'cyan', name: 'Cian', color: '#3ee0e8' },
  { id: 'magenta', name: 'Magenta', color: '#ff4ad8' },
  { id: 'lime', name: 'Lima', color: '#7cff6b' },
  { id: 'gold', name: 'Oro', color: '#ffd056' },
  { id: 'coral', name: 'Coral', color: '#ffa094' },
  { id: 'ice', name: 'Hielo', color: '#93c9f5' },
];

function pickImageDataUrl() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) { resolve(''); return; }
      const reader = new FileReader();
      reader.onload = () => compressImage(String(reader.result || ''), resolve);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    }, { once: true });
    input.click();
  });
}

function compressImage(dataUrl, done) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const max = 640;
    const scale = Math.min(max / img.width, max / img.height, 1);
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    done(canvas.toDataURL('image/jpeg', 0.86));
  };
  img.onerror = () => done(dataUrl);
  img.src = dataUrl;
}

async function editPlaylistCover(playlistId) {
  const playlist = userPlaylistById(playlistId);
  if (!playlist) return;
  const dataUrl = await pickImageDataUrl();
  if (!dataUrl) return;
  playlist.cover = dataUrl;
  persistPlaylists();
  renderView();
  renderSidebar();
  toast(`Portada de <strong>${esc(playlist.name)}</strong> actualizada.`, 'image');
}

function handleProfileInput(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.id === 'profileNameInput') {
    state.profile.name = String(target.value || '').slice(0, 32) || 'Davo';
    persistProfile();
  } else if (target.id === 'profileHandleInput') {
    state.profile.handle = String(target.value || '').replace(/^@/, '').slice(0, 24);
    persistProfile();
  }
}

function persistProfile() {
  writeStore(STORE.profile, state.profile);
  updateProfileChrome();
}

function updateProfileChrome() {
  const profile = state.profile || DEFAULT_PROFILE;
  const name = profile.name || 'Davo';
  const handle = profile.handle ? (String(profile.handle).startsWith('@') ? profile.handle : `@${profile.handle}`) : '@davito_03';
  const initial = (name.trim()[0] || 'D').toUpperCase();
  const avatar = qs('#profileAvatar');
  const nameEl = qs('#profileName');
  const handleEl = qs('#profileHandle');
  if (nameEl) nameEl.textContent = name;
  if (handleEl) handleEl.textContent = handle;
  if (avatar) {
    if (profile.avatar) {
      avatar.innerHTML = `<img class="profile__avatar-img" src="${esc(profile.avatar)}" alt="">`;
    } else {
      avatar.textContent = initial;
    }
  }
}

function renderProfileSettings() {
  const profile = state.profile || DEFAULT_PROFILE;
  const handle = String(profile.handle || '').replace(/^@/, '');
  const preview = profile.avatar
    ? `<img class="profile__avatar-img" src="${esc(profile.avatar)}" alt="">`
    : esc((profile.name || 'D')[0] || 'D').toUpperCase();
  return `<div class="settings-group">
    <div class="settings-group__title">${icon('mic')} Perfil local</div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Cómo te ves aquí</strong><span>Solo en este equipo. Nada se sube a ninguna nube.</span></div>
    </div>
    <div class="settings-row">
      <span class="avatar" style="width:52px;height:52px;font-size:18px">${preview}</span>
      <div class="settings-row__copy" style="flex:1">
        <label class="field" style="margin:0"><span>Nombre</span><input id="profileNameInput" value="${esc(profile.name || '')}" maxlength="32" placeholder="Davo"></label>
      </div>
    </div>
    <div class="settings-row">
      <div class="settings-row__copy" style="flex:1">
        <label class="field" style="margin:0"><span>Usuario</span><input id="profileHandleInput" value="${esc(handle)}" maxlength="24" placeholder="davito_03"></label>
      </div>
      <button class="btn btn--soft" data-profile-avatar>${icon('image')} Foto</button>
    </div>
  </div>`;
}

function renderFontSettings() {
  const pack = state.prefs.fontPack || 'davito';
  const custom = state.ui.customFonts || {};
  const packs = FONT_PACKS.map((item) => `<button class="font-swatch ${pack === item.id ? 'is-active' : ''}" data-font-pack="${item.id}" type="button">
    <strong style="font-family:${item.id === 'terminal' ? 'ui-monospace, monospace' : item.id === 'editorial' ? 'Georgia, serif' : 'inherit'}">${esc(item.name)}</strong>
    <span>${esc(item.sans)} · ${esc(item.display)}</span>
  </button>`).join('');
  const slot = (id, label) => {
    const loaded = custom[id];
    return `<div class="settings-row">
      <div class="settings-row__copy"><strong>${label}</strong><span>${loaded ? esc(loaded.name) : 'La del pack elegido, o un TTF/OTF/WOFF de tu disco.'}</span></div>
      <div class="font-slot-row">
        <button class="btn btn--soft" data-font-load="${id}">${icon('file')} ${loaded ? 'Cambiar' : 'Cargar'}</button>
        ${loaded ? `<button class="icon-btn" data-font-clear="${id}" aria-label="Quitar fuente">${icon('x')}</button>` : ''}
      </div>
    </div>`;
  };
  return `<div class="settings-row" style="margin-top:12px">
    <div class="settings-row__copy"><strong>Fuentes</strong><span>Packs del sistema o archivos de tu PC. Nada se descarga de Google Fonts.</span></div>
  </div>
  <div class="font-grid">${packs}</div>
  ${slot('sans', 'Interfaz')}
  ${slot('display', 'Títulos')}
  ${slot('mono', 'Mono / HUD')}`;
}

function persistCustomFonts() {
  const payload = state.ui.customFonts || {};
  if (IS_TAURI) {
    inv('save_user_fonts', { fonts: payload }).catch((error) => {
      toast(`No se pudo guardar la fuente. ${esc(error?.message || error || '')}`, 'bell', 4200);
    });
  } else {
    writeStore(STORE.fonts, payload);
  }
}

function pickFontFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) { resolve(null); return; }
      if (file.size > 4 * 1024 * 1024) {
        toast('La fuente pesa más de 4 MB. Elige un archivo más ligero.', 'bell', 4200);
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        mime: file.type || 'font/ttf',
        data: String(reader.result || ''),
      });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    }, { once: true });
    input.click();
  });
}

async function loadCustomFontSlot(slot) {
  const font = await pickFontFile();
  if (!font || !font.data) return;
  state.ui.customFonts = { ...(state.ui.customFonts || {}), [slot]: font };
  state.prefs.fontPack = 'custom';
  persistCustomFonts();
  savePrefs();
  applyFonts();
  renderSettings();
  toast(`Fuente <strong>${esc(font.name)}</strong> aplicada a ${slot === 'sans' ? 'la interfaz' : slot === 'display' ? 'los títulos' : 'el HUD'}.`, 'check');
}

function clearCustomFontSlot(slot) {
  const next = { ...(state.ui.customFonts || {}) };
  delete next[slot];
  state.ui.customFonts = next;
  if (!next.sans && !next.display && !next.mono && state.prefs.fontPack === 'custom') {
    state.prefs.fontPack = 'davito';
    savePrefs();
  }
  persistCustomFonts();
  applyFonts();
  renderSettings();
}

function folderName(folder) {
  return folder.name || String(folder.path || '').split('/').filter(Boolean).pop() || folder.path;
}

function renderSettings() {
  if (!els.settingsBody) return;
  const p = state.prefs;
  const folders = state.local.folders || [];
  const themeButtons = THEMES.map((t) => `<button class="theme-swatch ${p.theme === t.id ? 'is-active' : ''}" data-theme-choice="${t.id}" aria-label="Tema ${t.name}">
    <span class="theme-swatch__preview" style="--preview-side:${t.side};--preview-main:${t.main};background:${t.bg}"></span>
    <span>${t.name}</span>
  </button>`).join('');
  const accentButtons = ACCENTS.map((a) => `<button class="accent-swatch ${p.accent === a.id || (a.id === 'cyan' && !p.accent) ? 'is-active' : ''}" style="--swatch:${a.color}" data-accent-choice="${a.id}" aria-label="Acento ${a.name}" title="${a.name}"></button>`).join('');
  const folderRows = folders.length
    ? folders.map((f) => `<div class="folder-row folder-row--settings">
        <span class="folder-row__icon">${icon('folder')}</span>
        <span class="folder-row__copy"><strong>${esc(folderName(f))}</strong><span>${esc(f.path)}</span></span>
        <span class="folder-row__count">${plural(f.track_count || 0, 'pista', 'pistas')}</span>
        <button class="icon-btn icon-btn--small" data-settings-remove-folder="${esc(f.path)}" aria-label="Quitar carpeta" title="Quitar carpeta">${icon('trash')}</button>
      </div>`).join('')
    : `<div class="inline-empty">Todavía no hay carpetas. Añade una para que Davusic lea tus archivos.</div>`;

  const isReduced = p.motion === 'reduced';
  els.settingsBody.innerHTML = `<div class="settings-group">
    <div class="settings-group__title">${icon('sun')} Apariencia</div>
    <div class="theme-grid">${themeButtons}</div>
    <div class="settings-row" style="margin-top:12px">
      <div class="settings-row__copy"><strong>Acento</strong><span>El color de los controles, el brillo y los detalles.</span></div>
      <div class="settings-row__control"><div class="accent-grid">${accentButtons}</div></div>
    </div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Animaciones</strong><span>Desactívalas si prefieres una interfaz completamente quieta.</span></div>
      <div class="settings-row__control"><button class="switch ${isReduced ? '' : 'is-on'}" data-motion-toggle role="switch" aria-checked="${isReduced ? 'false' : 'true'}" aria-label="Animaciones"></button></div>
    </div>
    ${renderFontSettings()}
  </div>

  ${renderProfileSettings()}

  ${renderSpotifySettings()}

  <div class="settings-group">
    <div class="settings-group__title">${icon('volume')} Reproducción</div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Calidad</strong><span>Se reproduce el archivo original, sin recodificar ni enviarlo a ningún sitio.</span></div>
      <div class="settings-row__control"><span class="settings-value">${icon('shield')} Original</span></div>
    </div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Volumen</strong><span>Ajusta el volumen desde la barra inferior; se recuerda entre sesiones.</span></div>
      <div class="settings-row__control"><span class="settings-value">${Math.round(p.volume * 100)}%</span></div>
    </div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Continuar al abrir</strong><span>Guarda la cola, la pista y el punto exacto al cerrar Davusic.</span></div>
      <div class="settings-row__control"><button class="switch ${p.resumeSession === false ? '' : 'is-on'}" data-resume-toggle role="switch" aria-checked="${p.resumeSession === false ? 'false' : 'true'}" aria-label="Continuar al abrir"></button></div>
    </div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Reproductor inmersivo</strong><span>Carátula grande, letra sincronizada y controles sin distracciones.</span></div>
      <div class="settings-row__control"><button class="link-btn" data-settings-open-immersive>Probar ${icon('arrow-right')}</button></div>
    </div>
  </div>

  <div class="settings-group">
    <div class="settings-group__title">${icon('folder')} Biblioteca local</div>
    <div class="settings-folders">${folderRows}</div>
    <div class="settings-actions">
      <button class="btn btn--soft" data-settings-import>${icon('folder-plus')} Añadir carpeta</button>
      <button class="btn btn--ghost" data-settings-rescan>${icon('refresh')} Reescanear</button>
    </div>
    <p class="settings-note">${plural(state.local.tracks.length + (state.stream.tracks || []).length, 'pista disponible', 'pistas disponibles')} · ${plural(state.local.folders?.length || 0, 'carpeta', 'carpetas')} · nada sale de tu equipo.</p>
  </div>

  <div class="settings-group">
    <div class="settings-group__title">${icon('shield')} Privacidad y datos</div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Historial de escucha</strong><span>${state.recents.length ? plural(state.recents.length, 'pista reciente', 'pistas recientes') : 'Vacío'} guardado solo en este equipo.</span></div>
      <div class="settings-row__control"><button class="link-btn" data-settings-clear-recents ${state.recents.length ? '' : 'disabled'}>Borrar</button></div>
    </div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Me gusta</strong><span>${plural(state.likes.length, 'canción guardada', 'canciones guardadas')} en local.</span></div>
      <div class="settings-row__control"><button class="link-btn" data-settings-clear-likes ${state.likes.length ? '' : 'disabled'}>Borrar</button></div>
    </div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Playlists propias</strong><span>${plural(state.userPlaylists.length, 'playlist creada', 'playlists creadas')} en este equipo.</span></div>
      <div class="settings-row__control"><button class="link-btn" data-settings-clear-playlists ${state.userPlaylists.length ? '' : 'disabled'}>Borrar</button></div>
    </div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Preferencias</strong><span>Tema, acento, volumen y animaciones.</span></div>
      <div class="settings-row__control"><button class="link-btn" data-settings-reset-prefs>Restablecer</button></div>
    </div>
    <div class="privacy-line">${icon('shield')}<span>Sin anuncios · Sin telemetría · Cuenta de Spotify opcional</span></div>
  </div>

  <div class="settings-group">
    <div class="settings-group__title">${icon('globe')} Exportify</div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Importar desde Exportify</strong><span>Abre un CSV o ZIP exportado desde exportify.net. También puedes abrir la web oficial.</span></div>
      <div class="settings-row__control settings-row__control--actions">
        <button class="link-btn" data-settings-exportify-open>exportify.net ${icon('arrow-right')}</button>
        <button class="link-btn" data-settings-exportify-import>Elegir archivo</button>
      </div>
    </div>
    <div class="settings-row">
      <div class="settings-row__control settings-row__control--actions settings-row__control--wide">
        <button class="link-btn" data-settings-exportify-export>${icon('download')} Exportar todas mis playlists a ZIP</button>
      </div>
    </div>
    <p class="settings-note">El ZIP contiene un CSV por playlist con columnas compatibles con Exportify. No se envía nada a Spotify.</p>
  </div>

  <div class="settings-group settings-group--danger">
    <div class="settings-group__title">${icon('trash')} Zona de peligro</div>
    <div class="settings-danger">
      <div class="settings-danger__copy">
        <strong>Restablecer de fábrica</strong>
        <span>Borra la biblioteca indexada, playlists, historial, preferencias, sesión y cachés. No toca tus archivos de música ni yt-dlp.</span>
      </div>
      <button class="btn btn--danger" data-factory-reset>${icon('trash')} Restablecer todo</button>
    </div>
  </div>

  <div class="settings-group">
    <div class="settings-group__title">${icon('keyboard')} Rapidez</div>
    <div class="settings-row">
      <div class="settings-row__copy"><strong>Atajos de teclado</strong><span>Todo el reproductor, sin levantar las manos.</span></div>
      <div class="settings-row__control"><button class="link-btn" data-settings-shortcuts>Ver atajos ${icon('arrow-right')}</button></div>
    </div>
    <div class="settings-about">
      <div class="settings-about__brand">
        <img src="assets/logo.png" alt="">
        <strong>Davusic</strong>
        <span>v0.1.0</span>
      </div>
      <p>Reproductor local-first al estilo de davito.dev. Hecho para Niri y CachyOS, sin nube propia y sin ruido.</p>
      <div class="privacy-line">${icon('check')}<span>Hecho con Rust, Tauri y demasiado cariño</span></div>
    </div>
  </div>`;
}

function openSettings() {
  closeMenus();
  closePalette();
  closePlaylistModal();
  closeImportModal(true);
  forceCloseImmersive();
  renderSettings();
  if (els.settingsSheet) els.settingsSheet.hidden = false;
  if (els.shortcutsSheet) els.shortcutsSheet.hidden = true;
  window.setTimeout(() => qs('[data-close-sheet]', els.settingsSheet)?.focus(), 30);
  ensureWallpaperThemes();
  ensureSpotifyStatus();
}

function closeSheets() {
  if (els.settingsSheet) els.settingsSheet.hidden = true;
  if (els.shortcutsSheet) els.shortcutsSheet.hidden = true;
}

function renderShortcuts() {
  if (!els.shortcutsBody) return;
  const groups = [
    ['Reproducción', [
      ['Espacio', 'Reproducir o pausar'],
      ['← / →', 'Retroceder o avanzar 5 s'],
      ['Mayús + ← / →', 'Canción anterior / siguiente'],
      ['M', 'Silenciar'],
      ['S', 'Aleatorio'],
      ['R', 'Cambiar repetición'],
    ]],
    ['Navegación', [
      ['Ctrl + K', 'Buscar canciones (biblioteca y YouTube)'],
      ['Ctrl + P', 'Paleta de comandos'],
      ['Ctrl + F o /', 'Enfocar el buscador'],
      ['Ctrl + 1…6', 'Inicio, Para ti, Explorar, Biblioteca, Me gusta, Recientes'],
      ['Q', 'Abrir la cola'],
      ['L', 'Ver la letra'],
      ['I', 'Reproductor inmersivo'],
      ['Esc', 'Cerrar capa o panel'],
    ]],
    ['Aplicación', [
      ['Ctrl + ,', 'Abrir ajustes'],
      ['?', 'Ver estos atajos'],
      ['Ctrl + I', 'Importar carpeta'],
      ['Ctrl + R', 'Reescanear biblioteca'],
    ]],
  ];
  els.shortcutsBody.innerHTML = groups.map(([title, rows]) => `<div class="settings-group">
    <div class="settings-group__title">${esc(title)}</div>
    <div class="shortcut-list">${rows.map(([keys, label]) => `<div class="shortcut-row"><span>${esc(label)}</span><span>${keys.split(' + ').map((k) => `<kbd>${esc(k)}</kbd>`).join('')}</span></div>`).join('')}</div>
  </div>`).join('') + `<p class="shortcut-note">Los atajos se desactivan mientras escribes en un campo de texto. Nada se envía fuera del equipo: ni siquiera una pulsación.</p>`;
}

function openShortcuts() {
  closeMenus();
  closePalette();
  closePlaylistModal();
  forceCloseImmersive();
  renderShortcuts();
  if (els.shortcutsSheet) els.shortcutsSheet.hidden = false;
  if (els.settingsSheet) els.settingsSheet.hidden = true;
  window.setTimeout(() => qs('[data-close-sheet]', els.shortcutsSheet)?.focus(), 30);
}

/* ---------- paleta de comandos ---------- */

function playSingleTrack(trackId) {
  trackId = ensurePlayableTrack(trackId);
  const track = trackFromId(trackId);
  if (!track) return;
  if (state.player.trackId === trackId) return togglePlay();
  state.player.context = { key: `single:${trackId}`, label: track.title };
  state.player.queue = [trackId];
  state.player.index = 0;
  state.player.unshuffled = null;
  state.player.trackId = trackId;
  return startCurrent();
}

function paletteCommands() {
  return [
    { group: 'Reproducción', label: state.player.playing ? 'Pausar' : 'Reproducir', sub: 'Control de reproducción', hint: 'Espacio', icon: state.player.playing ? 'pause' : 'play', run: () => togglePlay() },
    { group: 'Reproducción', label: 'Siguiente canción', sub: 'Saltar a la siguiente pista', hint: 'Mayús →', icon: 'next', run: () => nextTrack(true) },
    { group: 'Reproducción', label: 'Canción anterior', sub: 'Volver al inicio o a la pista previa', hint: 'Mayús ←', icon: 'prev', run: () => previousTrack() },
    { group: 'Reproducción', label: state.player.shuffle ? 'Desactivar aleatorio' : 'Activar aleatorio', sub: 'Mezclar la cola actual', hint: 'S', icon: 'shuffle', run: () => setShuffle() },
    { group: 'Reproducción', label: 'Cambiar repetición', sub: state.player.repeat === 'off' ? 'Repetir todo' : state.player.repeat === 'all' ? 'Repetir una canción' : 'Desactivar repetición', hint: 'R', icon: 'repeat', run: () => cycleRepeat() },
    { group: 'Paneles', label: 'Abrir la cola', sub: 'Ver lo que viene después', hint: 'Q', icon: 'queue', run: () => toggleContextPanel('queue') },
    { group: 'Paneles', label: 'Ver la letra', sub: 'Letra sincronizada de la canción actual', hint: 'L', icon: 'mic', run: () => toggleContextPanel('lyrics') },
    { group: 'Paneles', label: 'Reproductor inmersivo', sub: 'Pantalla completa y carátula grande', hint: 'I', icon: 'expand', run: () => openImmersive() },
    { group: 'Navegación', label: 'Ir a Inicio', sub: 'Tu música, sin ruido', hint: 'Ctrl 1', icon: 'home', run: () => navigate('home') },
    { group: 'Navegación', label: 'Para ti', sub: 'Recomendaciones hechas con tu escucha', hint: 'Ctrl 2', icon: 'sparkle', run: () => navigate('foryou') },
    { group: 'Navegación', label: 'Explorar', sub: 'Momentos, radios y géneros', hint: 'Ctrl 3', icon: 'compass', run: () => navigate('explore') },
    { group: 'Navegación', label: 'Biblioteca', sub: 'Tus archivos y carpetas', hint: 'Ctrl 4', icon: 'library', run: () => navigate('library') },
    { group: 'Navegación', label: 'Me gusta', sub: 'Tu selección personal', hint: 'Ctrl 5', icon: 'heart', run: () => navigate('liked') },
    { group: 'Navegación', label: 'Recientes', sub: 'Historial guardado solo en tu equipo', hint: 'Ctrl 6', icon: 'clock', run: () => navigate('recent') },
    { group: 'Acciones', label: 'Importar', sub: 'Carpeta, Exportify, Spotify o YouTube Music', hint: 'Ctrl I', icon: 'download', run: () => openImportModal('library') },
    { group: 'Acciones', label: 'Exportar playlists', sub: 'ZIP compatible con Exportify', hint: '', icon: 'globe', run: () => exportExportifyLibrary() },
    { group: 'Acciones', label: 'Paleta de comandos', sub: 'Atajos, vistas y acciones', hint: 'Ctrl P', icon: 'sparkle', run: () => openPalette() },
    { group: 'Acciones', label: 'Reescanear biblioteca', sub: 'Leer de nuevo etiquetas y carátulas', hint: 'Ctrl R', icon: 'refresh', run: () => rescanLibrary() },
    { group: 'Acciones', label: 'Crear playlist', sub: 'Una colección nueva, vacía', hint: 'Nueva', icon: 'plus', run: () => openPlaylistModal() },
    { group: 'Acciones', label: 'Ajustes', sub: 'Tema, acento, biblioteca y privacidad', hint: 'Ctrl ,', icon: 'settings', run: () => openSettings() },
    { group: 'Acciones', label: 'Atajos de teclado', sub: 'Todo lo que puedes hacer sin ratón', hint: '?', icon: 'keyboard', run: () => openShortcuts() },
  ];
}

function buildPaletteItems(query) {
  const q = fold(query);
  const commands = paletteCommands()
    .filter((c) => !q || fold(`${c.label} ${c.sub || ''}`).includes(q))
    .slice(0, q ? 4 : 9)
    .map((c) => ({ ...c, type: 'command' }));
  const items = commands.slice();
  if (q) {
    const seenTracks = new Set();
    searchTracks(q).slice(0, 6).forEach((t) => {
      seenTracks.add(t.id);
      items.push({
        group: 'Canciones', type: 'track', label: t.title, sub: `${t.artist} · ${t.album}`,
        cover: coverSrc(t), hint: 'Reproducir', run: () => playSingleTrack(t.id),
      });
    });
    const online = fold(state.ui.onlineSearch.query) === q ? (state.ui.onlineSearch.results || []) : [];
    online.filter((t) => t && !seenTracks.has(t.id)).slice(0, 6).forEach((t) => {
      items.push({
        group: 'En línea', type: 'track', label: t.title, sub: `${t.artist} · Streaming`,
        cover: coverSrc(t), hint: 'Streamear', run: () => playSingleTrack(t.id),
      });
    });
    if (state.ui.onlineSearch.loading && fold(state.ui.onlineSearch.query) === q && !online.length) {
      items.push({
        group: 'En línea', type: 'command', label: 'Buscando en YouTube…', sub: 'Las coincidencias aparecen en unos segundos',
        icon: 'youtube', hint: '', run: () => {},
      });
    }
    searchAlbums(q).slice(0, 4).forEach((a) => items.push({
      group: 'Álbumes', type: 'album', label: a.title, sub: `${a.artist}${a.year ? ` · ${a.year}` : ''}`,
      cover: coverSrc(a), hint: 'Abrir', run: () => navigate('album', { id: a.id }),
    }));
    searchArtists(q).slice(0, 3).forEach((a) => items.push({
      group: 'Artistas', type: 'artist', label: a.name, sub: (a.genres || []).join(' · ') || 'Artista local',
      cover: coverSrc(a), hint: 'Abrir', run: () => navigate('artist', { id: a.id }),
    }));
    searchPlaylists(q).slice(0, 3).forEach((p) => {
      const first = p.track_ids && p.track_ids.length ? trackFromId(p.track_ids[0]) : null;
      items.push({
        group: 'Playlists', type: 'playlist', label: p.name, sub: p.description || plural((p.track_ids || []).length, 'canción', 'canciones'),
        cover: first ? coverSrc(first) : '', icon: 'queue', hint: 'Abrir', run: () => navigate('playlist', { id: p.id }),
      });
    });
  }
  return items;
}

function renderPalette(query) {
  if (!els.paletteResults) return;
  const items = buildPaletteItems(query);
  state.ui.paletteItems = items;
  state.ui.paletteIndex = clamp(state.ui.paletteIndex, 0, Math.max(0, items.length - 1));
  if (!items.length) {
    els.paletteResults.innerHTML = `<div class="palette-empty">${icon('search')}<strong>Nada por aquí</strong><span>Prueba con una canción, un álbum, un artista o un comando.</span></div>`;
    return;
  }
  let lastGroup = '';
  els.paletteResults.innerHTML = items.map((item, index) => {
    let group = '';
    if (item.group !== lastGroup) {
      lastGroup = item.group;
      group = `<div class="palette-group">${esc(item.group)}</div>`;
    }
    const iconMarkup = item.cover
      ? `<img class="palette-item__icon" src="${esc(item.cover)}" alt="">`
      : `<span class="palette-item__icon">${icon(item.icon || 'sparkle')}</span>`;
    return `${group}<button class="palette-item ${index === state.ui.paletteIndex ? 'is-selected' : ''}" data-palette-index="${index}">
      ${iconMarkup}
      <span class="palette-item__copy"><strong>${esc(item.label)}</strong><span>${esc(item.sub || '')}</span></span>
      ${item.hint ? `<span class="palette-item__action">${esc(item.hint)}</span>` : ''}
    </button>`;
  }).join('');
}

function openPalette() {
  if (!els.palette) return;
  closeMenus();
  closeSheets();
  closePlaylistModal();
  forceCloseImmersive();
  state.ui.paletteIndex = 0;
  els.palette.hidden = false;
  if (els.paletteInput) els.paletteInput.value = '';
  renderPalette('');
  window.setTimeout(() => els.paletteInput?.focus(), 20);
}

function closePalette() {
  if (!els.palette) return;
  els.palette.hidden = true;
  if (els.paletteInput) els.paletteInput.value = '';
  if (els.paletteResults) els.paletteResults.innerHTML = '';
  state.ui.paletteItems = [];
  state.ui.paletteIndex = 0;
}

function movePaletteSelection(delta) {
  const items = state.ui.paletteItems || [];
  if (!items.length) return;
  state.ui.paletteIndex = (state.ui.paletteIndex + delta + items.length) % items.length;
  qsa('.palette-item', els.paletteResults).forEach((el, i) => {
    el.classList.toggle('is-selected', i === state.ui.paletteIndex);
  });
  const selected = qs('.palette-item.is-selected', els.paletteResults);
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}

function runPaletteItem(index) {
  const item = (state.ui.paletteItems || [])[index];
  if (!item) return;
  closePalette();
  try {
    const result = item.run();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch (error) {
    toast(`No se pudo ejecutar la acción. ${esc(error?.message || '')}`, 'bell');
  }
}

function forceCloseImmersive() {
  if (!els.immersive || els.immersive.hidden) return;
  window.clearTimeout(immersiveCloseTimer);
  els.immersive.classList.remove('is-closing');
  els.immersive.hidden = true;
}

/* ---------- biblioteca, importación y arrastre ---------- */

function handleLibraryResult(result) {
  if (!result) return false;
  const library = result.library || result;
  if (!library || !Array.isArray(library.tracks)) return false;
  setLocalLibrary(library);
  renderSidebar();
  closeMenus();
  renderView();
  updateLibraryPill();
  return true;
}

async function refreshLibrary(options = {}) {
  if (!IS_TAURI) return false;
  try {
    const library = await inv('get_local_library');
    const ok = handleLibraryResult(library);
    if (!ok && !options.quiet) toast('La biblioteca devolvió un formato inesperado.', 'bell');
    return ok;
  } catch (error) {
    if (!options.quiet) toast(`No se pudo leer la biblioteca. ${esc(error?.message || error || '')}`, 'bell', 4500);
    return false;
  }
}

async function importMusicFolder() {
  if (!IS_TAURI) {
    toast('La importación de carpetas está disponible en la app de escritorio. En el navegador puedes escuchar la demo incluida.', 'folder-plus', 5200);
    return;
  }
  closeMenus();
  closeSheets();
  showScan('Esperando una carpeta…', 5);
  const before = state.local.tracks.length;
  try {
    const result = await inv('add_music_folder');
    hideScan(300);
    if (!result) return;
    const library = result.library || result;
    const added = Number(result.added_tracks ?? (Array.isArray(library?.tracks) ? library.tracks.length - before : 0));
    handleLibraryResult(result);
    if (added > 0) {
      toast(`Importadas <strong>${plural(added, 'canción', 'canciones')}</strong> a tu biblioteca.`, 'folder-plus', 4200);
      navigate('library');
    } else {
      toast('Carpeta añadida. No se encontraron archivos de audio nuevos.', 'folder', 4200);
    }
  } catch (error) {
    hideScan(100);
    toast(`No se pudo importar la carpeta. ${esc(error?.message || error || '')}`, 'bell', 5000);
  }
}

async function rescanLibrary() {
  if (!IS_TAURI) {
    toast('El reescaneo está disponible en la app de escritorio. La demo ya está indexada.', 'refresh', 4200);
    return;
  }
  closeMenus();
  closeSheets();
  showScan('Releyendo etiquetas y carátulas…', 8);
  try {
    const result = await inv('rescan_library');
    handleLibraryResult(result);
    hideScan(350);
    toast('Biblioteca actualizada. Sin mover ni copiar archivos.', 'refresh', 3600);
  } catch (error) {
    hideScan(100);
    toast(`No se pudo reescanear. ${esc(error?.message || error || '')}`, 'bell', 5000);
  }
}

async function removeMusicFolder(path) {
  if (!path || !IS_TAURI) return;
  const folder = (state.local.folders || []).find((f) => f.path === path);
  const label = folder ? folderName(folder) : path;
  if (!window.confirm(`¿Quitar «${label}» de la biblioteca? Tus archivos no se borran, solo dejan de mostrarse aquí.`)) return;
  try {
    const result = await inv('remove_music_folder', { path });
    handleLibraryResult(result);
    await refreshLibrary({ quiet: true });
    renderSettings();
    toast(`<strong>${esc(label)}</strong> ya no forma parte de la biblioteca.`, 'trash', 3800);
  } catch (error) {
    toast(`No se pudo quitar la carpeta. ${esc(error?.message || error || '')}`, 'bell');
  }
}

async function openFolderPath(path) {
  if (!path) return;
  if (!IS_TAURI) {
    toast('Abrir carpetas está disponible en la app de escritorio.', 'folder');
    return;
  }
  try {
    await inv('show_in_folder', { path });
  } catch (error) {
    toast(`No se pudo abrir la ubicación. ${esc(error?.message || error || '')}`, 'bell');
  }
}

async function handleDroppedPaths(paths) {
  if (!IS_TAURI || !Array.isArray(paths) || !paths.length) return;
  closeMenus();
  closeSheets();
  const playlistPath = paths.find((raw) => /\.(zip|csv|tsv|json|m3u8?|txt)$/i.test(String(raw)));
  if (playlistPath) {
    openImportModal('file');
    await importPlaylistPath(String(playlistPath));
    return;
  }
  showScan('Añadiendo música arrastrada…', 5);
  let last = null;
  let failed = false;
  for (const raw of paths) {
    if (!raw) continue;
    let path = String(raw);
    if (/\.(mp3|flac|ogg|oga|opus|m4a|aac|wav|aiff?|wv|ape)$/i.test(path)) path = path.replace(/\/[^/]*$/, '');
    try {
      const result = await inv('add_folder_path', { path });
      if (result) last = result;
    } catch (_) {
      failed = true;
    }
  }
  hideScan(300);
  if (last) handleLibraryResult(last);
  if (failed) toast('Alguna carpeta no se pudo añadir. Revisa que exista y tenga permisos de lectura.', 'bell', 4600);
  else toast('Música añadida a la biblioteca local.', 'folder-plus');
}

function handleScanPayload(payload) {
  if (!payload) return;
  const done = Number(payload.done ?? payload.processed ?? 0);
  const total = Number(payload.total ?? 0);
  const pct = total > 0 ? clamp((done / total) * 100, 2, 98) : 12;
  const current = String(payload.current || payload.path || '');
  const name = current.split('/').filter(Boolean).pop() || '';
  if (payload.stage === 'done') {
    hideScan(150);
    return;
  }
  showScan(name ? `Indexando ${name}…` : 'Indexando tu música…', pct);
  if (total > 0 && done >= total) hideScan(500);
}

/* ---------- ajustes: acciones ---------- */

async function handleSettingsClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest('[data-profile-avatar]')) {
    const dataUrl = await pickImageDataUrl();
    if (dataUrl) {
      state.profile.avatar = dataUrl;
      persistProfile();
      renderSettings();
      toast('Foto de perfil actualizada. Solo en este equipo.', 'image');
    }
    return;
  }

  const themeBtn = target.closest('[data-theme-choice]');
  if (themeBtn) {
    state.prefs.theme = themeBtn.dataset.themeChoice;
    applyPrefs();
    savePrefs();
    renderSettings();
    toast(`Tema <strong>${esc(THEMES.find((t) => t.id === state.prefs.theme)?.name || '')}</strong> aplicado.`, 'sun');
    return;
  }

  const accentBtn = target.closest('[data-accent-choice]');
  if (accentBtn) {
    state.prefs.accent = accentBtn.dataset.accentChoice;
    applyPrefs();
    savePrefs();
    renderSettings();
    toast('Acento actualizado.', 'sparkle');
    return;
  }

  const fontPack = target.closest('[data-font-pack]');
  if (fontPack) {
    state.prefs.fontPack = fontPack.dataset.fontPack;
    savePrefs();
    applyFonts();
    renderSettings();
    toast(`Fuentes <strong>${esc(FONT_PACKS.find((item) => item.id === state.prefs.fontPack)?.name || '')}</strong>.`, 'sparkle');
    return;
  }
  const fontLoad = target.closest('[data-font-load]');
  if (fontLoad) {
    await loadCustomFontSlot(fontLoad.dataset.fontLoad);
    return;
  }
  const fontClear = target.closest('[data-font-clear]');
  if (fontClear) {
    clearCustomFontSlot(fontClear.dataset.fontClear);
    return;
  }

  if (target.closest('[data-resume-toggle]')) {
    const enabled = state.prefs.resumeSession === false;
    state.prefs.resumeSession = enabled;
    savePrefs();
    if (enabled) scheduleSessionSave();
    else persistSession(true);
    renderSettings();
    return;
  }

  if (target.closest('[data-motion-toggle]')) {
    state.prefs.motion = state.prefs.motion === 'reduced' ? 'full' : 'reduced';
    applyPrefs();
    savePrefs();
    renderSettings();
    return;
  }

  const removeBtn = target.closest('[data-settings-remove-folder]');
  if (removeBtn) {
    await removeMusicFolder(removeBtn.dataset.settingsRemoveFolder || '');
    return;
  }

  if (target.closest('[data-settings-import]')) { await importMusicFolder(); return; }
  if (target.closest('[data-settings-rescan]')) { await rescanLibrary(); return; }
  if (target.closest('[data-settings-shortcuts]')) { closeSheets(); openShortcuts(); return; }
  if (target.closest('[data-settings-open-immersive]')) { closeSheets(); openImmersive(); return; }
  if (target.closest('[data-settings-exportify-open]')) { await openExternalUrl('https://exportify.net/'); return; }
  if (target.closest('[data-settings-exportify-import]')) {
    closeSheets();
    openImportModal('exportify');
    await importExportifyFile();
    return;
  }
  if (target.closest('[data-settings-exportify-export]')) {
    await exportExportifyLibrary();
    return;
  }
  if (target.closest('[data-factory-reset]')) {
    openFactoryResetModal();
    return;
  }

  if (target.closest('[data-settings-clear-recents]')) {
    if (!state.recents.length) return;
    if (!window.confirm('¿Borrar el historial de escucha de este equipo? No se puede deshacer.')) return;
    state.recents = [];
    state.signals.tracks = {};
    state.signals.nowPlaying = null;
    state.signals.searches = [];
    state.prefs.searchHistory = [];
    writeStore(STORE.recents, state.recents);
    saveSignals();
    savePrefs();
    state.recs = null;
    if (state.view.name === 'recent' || state.view.name === 'foryou') renderView();
    renderSettings();
    toast('Historial de escucha y búsqueda borrado.', 'trash');
    return;
  }

  if (target.closest('[data-settings-clear-likes]')) {
    if (!state.likes.length) return;
    if (!window.confirm('¿Vaciar tu colección de Me gusta? Las canciones seguirán en la biblioteca.')) return;
    state.likes = [];
    writeStore(STORE.likes, state.likes);
    state.recs = null;
    updateLikedCount();
    updatePlayerUI();
    if (state.view.name === 'liked' || state.view.name === 'foryou') renderView();
    renderSettings();
    toast('Me gusta vaciado.', 'heart');
    return;
  }

  if (target.closest('[data-settings-clear-playlists]')) {
    if (!state.userPlaylists.length) return;
    if (!window.confirm('¿Borrar todas tus playlists? Las canciones seguirán en tu biblioteca.')) return;
    const viewingDeleted = state.view.name === 'playlist' && !state.demo.playlists.some((p) => p.id === state.view.params.id);
    state.userPlaylists = [];
    persistPlaylists();
    rebuildLibrary();
    renderSidebar();
    if (viewingDeleted) navigate('library');
    else renderView();
    renderSettings();
    toast('Playlists propias eliminadas.', 'trash');
    return;
  }

  if (target.closest('[data-settings-reset-prefs]')) {
    if (!window.confirm('¿Restablecer tema, acento, animaciones y volumen?')) return;
    state.prefs = { ...DEFAULT_PREFS, searchHistory: [] };
    savePrefs();
    applyPrefs();
    updatePlayerUI();
    renderSidebar();
    renderSettings();
    ensureEngineVolume();
    toast('Preferencias restablecidas.', 'refresh');
  }
}

/* ---------- restablecimiento de fábrica ---------- */

function setFactoryResetStatus(message, tone = '') {
  if (!els.factoryResetStatus) return;
  els.factoryResetStatus.hidden = !message;
  els.factoryResetStatus.textContent = message || '';
  els.factoryResetStatus.dataset.tone = tone;
}

function syncFactoryResetSubmit() {
  if (!els.factoryResetSubmit) return;
  const confirmed = String(els.factoryResetConfirm?.value || '').trim().toUpperCase() === 'BORRAR';
  els.factoryResetSubmit.disabled = !confirmed || state.ui.factoryResetting;
}

function openFactoryResetModal() {
  if (!els.factoryResetModal) return;
  closeMenus();
  closePalette();
  closePlaylistModal();
  closeImportModal(true);
  forceCloseImmersive();
  if (els.factoryResetConfirm) els.factoryResetConfirm.value = '';
  setFactoryResetStatus('');
  syncFactoryResetSubmit();
  els.factoryResetModal.hidden = false;
  window.setTimeout(() => els.factoryResetConfirm?.focus(), 30);
}

function closeFactoryResetModal() {
  if (!els.factoryResetModal || state.ui.factoryResetting) return;
  els.factoryResetModal.hidden = true;
  setFactoryResetStatus('');
}

function clearBrowserAppData() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try { storage.clear(); } catch (_) {}
  }
  try {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  } catch (_) {}
  try {
    if (window.indexedDB?.databases) {
      window.indexedDB.databases()
        .then((databases) => databases.forEach((db) => {
          if (db?.name) window.indexedDB.deleteDatabase(db.name);
        }))
        .catch(() => {});
    }
  } catch (_) {}
}

async function performFactoryReset() {
  if (state.ui.factoryResetting) return;
  const confirmed = String(els.factoryResetConfirm?.value || '').trim().toUpperCase() === 'BORRAR';
  if (!confirmed) {
    setFactoryResetStatus('Escribe BORRAR para confirmar.', 'error');
    return;
  }

  state.ui.factoryResetting = true;
  syncFactoryResetSubmit();
  if (els.factoryResetSubmit) els.factoryResetSubmit.textContent = 'Restableciendo…';
  setFactoryResetStatus('Borrando biblioteca, playlists, historial, preferencias y cachés…');

  try {
    if (IS_TAURI) {
      const report = await inv('factory_reset');
      if (report?.warnings?.length) {
        console.warn('Davusic: avisos al restablecer', report.warnings);
      }
    }
    // La copia de WebKit puede sobrevivir unos instantes a clear_all_browsing_data.
    // Limpiamos también desde JS y evitamos que beforeunload reescriba la sesión.
    clearBrowserAppData();
    setFactoryResetStatus('Restablecido. Davusic volverá a abrir vacío…', 'ok');
    window.setTimeout(() => window.location.reload(), 700);
  } catch (error) {
    state.ui.factoryResetting = false;
    if (els.factoryResetSubmit) {
      els.factoryResetSubmit.textContent = 'Restablecer todo';
      syncFactoryResetSubmit();
    }
    setFactoryResetStatus(`No se pudo completar el restablecimiento. ${error?.message || error || ''}`, 'error');
    toast('No se pudo restablecer Davusic. No se ha borrado todo.', 'bell', 6000);
  }
}

/* ---------- acciones del menú de pista ---------- */

async function handleTrackMenuAction(action) {
  const trackId = state.ui.menuTrack;
  const track = trackFromId(trackId);
  if (!track) {
    closeMenus();
    return;
  }
  if (action === 'playlist') {
    const rect = els.trackMenu?.getBoundingClientRect();
    closeMenus();
    openAddMenu(trackId, rect ? { getBoundingClientRect: () => rect } : null);
    return;
  }
  if (action === 'like') {
    toggleLike(trackId);
    closeMenus();
    return;
  }
  closeMenus();
  if (action === 'play') {
    if (state.player.trackId === trackId) await togglePlay();
    else {
      const idx = state.player.queue.indexOf(trackId);
      if (idx >= 0 && state.player.context) {
        state.player.index = idx;
        state.player.trackId = trackId;
        await startCurrent();
      } else {
        await playSingleTrack(trackId);
      }
    }
    return;
  }
  if (action === 'next') { await playNext(trackId); return; }
  if (action === 'queue') { await addToQueue(trackId); return; }
  if (action === 'album') {
    const album = albumForTrack(track);
    if (album) navigate('album', { id: album.id });
    return;
  }
  if (action === 'artist') {
    const artist = artistForTrack(track);
    if (artist) navigate('artist', { id: artist.id });
    return;
  }
  if (action === 'folder') {
    await openFolderPath(track.source === 'local' ? track.path : '');
  }
}

/* ---------- interacciones globales ---------- */

let queueDropAt = 0;

function isEditableTarget(target) {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
}

function handleDocumentClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const inTrackMenu = target.closest('#trackMenu');
  const inAddMenu = target.closest('#addMenu');
  if (!inTrackMenu && !target.closest('[data-more-track]')) {
    if (els.trackMenu) els.trackMenu.hidden = true;
    state.ui.menuTrack = null;
  }
  if (!inAddMenu && !target.closest('[data-add-track]') && !target.closest('#playerAdd')) {
    if (els.addMenu) els.addMenu.hidden = true;
    state.ui.addMenuTrack = null;
  }

  if (handleSpotifyAction(target)) return;

  const importTab = target.closest('[data-import-tab]');
  if (importTab) {
    switchImportTab(importTab.dataset.importTab);
    return;
  }

  const wpChoice = target.closest('[data-wallpaper-theme]');
  if (wpChoice) {
    selectWallpaperTheme(wpChoice.dataset.wallpaperTheme);
    return;
  }
  if (target.closest('[data-wallpaper-discover]')) { discoverWallpapers(false); return; }
  if (target.closest('[data-wallpaper-refresh]')) { discoverWallpapers(true); return; }
  if (target.closest('[data-wallpaper-choose]')) { chooseWallpaperFolder(); return; }
  if (target.closest('[data-wallpaper-reset]')) { resetWallpaperTheme(); return; }

  if (target.closest('[data-refresh-recs]')) { refreshRecommendations(); return; }
  if (target.closest('[data-clear-search-history]')) {
    clearSearchSignals();
    if (state.view.name === 'search') renderView();
    return;
  }

  if (target.closest('[data-close-import]')) { closeImportModal(); return; }
  if (target.closest('[data-exportify-open]')) { openExternalUrl('https://exportify.net/'); return; }
  if (target.closest('[data-exportify-file]')) { importExportifyFile(); return; }
  if (target.closest('[data-exportify-export]')) { exportExportifyLibrary(); return; }
  const exportifyPlaylist = target.closest('[data-exportify-playlist]');
  if (exportifyPlaylist) {
    exportExportifyPlaylist(exportifyPlaylist.dataset.exportifyPlaylist);
    return;
  }
  if (target === els.factoryResetModal || target.closest('[data-close-factory-reset]')) {
    closeFactoryResetModal();
    return;
  }
  if (target.closest('[data-factory-reset-submit]') || target === els.factoryResetSubmit) {
    performFactoryReset();
    return;
  }
  if (target.closest('[data-import-source]')) {
    const source = target.closest('[data-import-source]').dataset.importSource;
    if (source === 'file') importPlaylistFile();
    else if (source === 'folder') importMusicFolder();
    else switchImportTab(source);
    return;
  }
  if (target.closest('[data-import-file]')) { importPlaylistFile(); return; }
  if (target.closest('[data-import-url]')) { importPlaylistUrl(); return; }
  if (target.closest('[data-import-text]')) { importPlaylistText(); return; }
  if (target.closest('[data-install-ytdlp]')) { installYtdlp(); return; }
  if (target.closest('[data-import-match]')) { startImportMatching(); return; }
  if (target.closest('[data-import-save]')) { commitImportedStreams(); return; }
  if (target.closest('[data-import-download]')) { commitImportedStreams(); return; }
  if (target.closest('[data-import-select-all]')) { selectAllImportMatches(true); return; }
  if (target.closest('[data-import-select-none]')) { selectAllImportMatches(false); return; }
  if (target.closest('[data-import-toggle-playlists]')) { toggleImportPlaylists(); return; }
  if (target.closest('[data-import-new]')) { resetImportFlow(); return; }
  if (target.closest('[data-import-open-library]')) { closeImportModal(true); navigate('library'); return; }
  if (target.closest('[data-import-open-playlist]')) {
    const id = target.closest('[data-import-open-playlist]').dataset.importOpenPlaylist;
    closeImportModal(true);
    if (id) navigate('playlist', { id });
    return;
  }

  const addToPlaylist = target.closest('[data-add-to-playlist]');
  if (addToPlaylist) {
    const trackId = state.ui.addMenuTrack;
    if (trackId) addTrackToPlaylist(addToPlaylist.dataset.addToPlaylist, trackId);
    return;
  }

  const like = target.closest('[data-like]');
  if (like) {
    toggleLike(like.dataset.like);
    return;
  }

  const more = target.closest('[data-more-track]');
  if (more) {
    openTrackMenu(more.dataset.moreTrack, more);
    return;
  }

  const addTrack = target.closest('[data-add-track]');
  if (addTrack) {
    openAddMenu(addTrack.dataset.addTrack, addTrack);
    return;
  }

  const lyricsLine = target.closest('[data-seek-time]');
  if (lyricsLine) {
    seekTo(Number(lyricsLine.dataset.seekTime) || 0);
    return;
  }

  const playContext = target.closest('[data-play-context]');
  if (playContext) {
    event.preventDefault();
    event.stopPropagation();
    const key = playContext.dataset.playContext;
    if (key) toggleContext(key, { shuffle: playContext.dataset.shuffleContext === 'true' });
    return;
  }

  const shuffleContext = target.closest('[data-shuffle-context]');
  if (shuffleContext) {
    event.preventDefault();
    const key = shuffleContext.dataset.shuffleContext;
    if (key && key !== 'true' && !isContextPlaying(key)) startContext(key, null, { shuffle: true });
    else setShuffle();
    return;
  }

  const playTrack = target.closest('[data-play-track]');
  if (playTrack) {
    event.preventDefault();
    const trackId = playTrack.dataset.playTrack;
    const key = playTrack.dataset.contextKey || state.player.context?.key || 'home';
    if (state.player.trackId === trackId) togglePlay();
    else playFromRow(trackId, key);
    return;
  }

  const queueContext = target.closest('[data-queue-context]');
  if (queueContext) {
    addContextToQueue(queueContext.dataset.queueContext);
    return;
  }

  const queueItem = target.closest('[data-queue-index]');
  if (queueItem) {
    if (Date.now() - queueDropAt < 300) return;
    const index = Number(queueItem.dataset.queueIndex);
    const p = state.player;
    if (Number.isFinite(index) && p.queue[index]) {
      if (p.queue[index] === p.trackId) togglePlay();
      else {
        p.index = index;
        p.trackId = p.queue[index];
        startCurrent();
      }
    }
    return;
  }

  const row = target.closest('[data-row-track]');
  if (row && !target.closest('button, a, input, [role="button"]')) {
    playFromRow(row.dataset.rowTrack, row.dataset.contextKey || 'library');
    return;
  }

  const menuAction = target.closest('[data-menu-action]');
  if (menuAction) {
    handleTrackMenuAction(menuAction.dataset.menuAction);
    return;
  }

  const removeFolder = target.closest('[data-remove-folder]');
  if (removeFolder) {
    removeMusicFolder(removeFolder.dataset.removeFolder);
    return;
  }

  const openFolder = target.closest('[data-open-folder]');
  if (openFolder) {
    openFolderPath(openFolder.dataset.openFolder || '');
    return;
  }

  if (target.closest('[data-lyrics-retry]')) {
    const track = currentTrack();
    if (track) {
      delete state.ui.lyrics.byId[track.id];
      persistLyrics();
      ensureLyrics(track, { force: true });
    }
    return;
  }
  const listMore = target.closest('[data-list-more]');
  if (listMore) {
    const key = listMore.dataset.listMore;
    const total = Number(listMore.dataset.listTotal) || 0;
    state.ui.listWindow[key] = Math.min(total, (state.ui.listWindow[key] || 80) + 80);
    renderView();
    return;
  }
  const coverBtn = target.closest('[data-edit-playlist-cover]');
  if (coverBtn) {
    editPlaylistCover(coverBtn.dataset.editPlaylistCover);
    return;
  }
  if (target.closest('[data-import]')) { openImportModal('library'); return; }
  if (target.closest('[data-rescan]')) { rescanLibrary(); return; }
  if (target.closest('[data-new-playlist]')) { openPlaylistModal(); return; }
  if (target.closest('[data-open-settings]')) { openSettings(); return; }
  if (target.closest('[data-open-shortcuts]')) { openShortcuts(); return; }
  if (target.closest('[data-open-immersive]')) { openImmersive(); return; }
  if (target.closest('[data-clear-search]')) { clearSearch(); return; }
  if (target.closest('[data-close-modal]')) { closePlaylistModal(); return; }
  if (target.closest('[data-close-sheet]')) { closeSheets(); return; }

  const deletePlaylist = target.closest('[data-delete-playlist]');
  if (deletePlaylist) {
    deleteUserPlaylist(deletePlaylist.dataset.deletePlaylist);
    return;
  }

  if (target.closest('[data-clear-recents]')) {
    if (window.confirm('¿Borrar tu historial de escucha local?')) {
      state.recents = [];
      writeStore(STORE.recents, state.recents);
      renderView();
      toast('Historial borrado.', 'trash');
    }
    return;
  }

  const filter = target.closest('[data-library-filter]');
  if (filter) {
    state.ui.libraryFilter = filter.dataset.libraryFilter || 'all';
    renderView();
    return;
  }

  const chip = target.closest('[data-search-chip]');
  if (chip) {
    runSearch(chip.dataset.searchChip);
    return;
  }

  const genre = target.closest('[data-genre]');
  if (genre) {
    runSearch(genre.dataset.genre);
    return;
  }

  const contextTab = target.closest('[data-context-tab]');
  if (contextTab) {
    setContextTab(contextTab.dataset.contextTab, true);
    return;
  }

  const open = target.closest('[data-open]');
  if (open && open.dataset.open) {
    event.preventDefault();
    openFromToken(open.dataset.open);
    return;
  }

  const nav = target.closest('[data-nav]');
  if (nav) {
    navigate(nav.dataset.nav);
  }
}

function bindProgressBar() {
  const bar = els.progress;
  if (!bar) return;
  let dragging = false;
  let lastRatio = 0;

  const ratioAt = (clientX) => {
    const rect = bar.getBoundingClientRect();
    return clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  };
  const tooltipAt = (ratio) => {
    if (!els.progressTooltip) return;
    els.progressTooltip.style.left = `${ratio * 100}%`;
    els.progressTooltip.textContent = fmtTime(ratio * state.player.duration);
  };
  const preview = (ratio) => {
    if (!state.player.duration) return;
    const pct = ratio * 100;
    if (els.progressFill) els.progressFill.style.width = `${pct}%`;
    if (els.currentTime) els.currentTime.textContent = fmtTime(ratio * state.player.duration);
    if (els.progress) els.progress.setAttribute('aria-valuenow', String(Math.round(pct)));
  };

  bar.addEventListener('pointerdown', (event) => {
    if (!currentTrack() || !state.player.duration) return;
    dragging = true;
    state.ui.draggingProgress = true;
    bar.classList.add('is-dragging');
    try { bar.setPointerCapture(event.pointerId); } catch (_) {}
    lastRatio = ratioAt(event.clientX);
    preview(lastRatio);
    tooltipAt(lastRatio);
    event.preventDefault();
  });
  bar.addEventListener('pointermove', (event) => {
    const ratio = ratioAt(event.clientX);
    lastRatio = ratio;
    tooltipAt(ratio);
    if (dragging) preview(ratio);
  });
  const finish = (event) => {
    if (!dragging) return;
    dragging = false;
    state.ui.draggingProgress = false;
    bar.classList.remove('is-dragging');
    const ratio = event && Number.isFinite(event.clientX) ? ratioAt(event.clientX) : lastRatio;
    seekTo(ratio * state.player.duration);
  };
  bar.addEventListener('pointerup', finish);
  bar.addEventListener('pointercancel', finish);
  bar.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'Home' ? -Infinity : event.key === 'End' ? Infinity : event.key === 'ArrowLeft' ? -5 : 5;
    seekTo(step === -Infinity ? 0 : step === Infinity ? state.player.duration : state.player.position + step);
  });
}

function bindVolumeBar() {
  const bar = els.volume;
  if (!bar) return;
  let dragging = false;
  const ratioAt = (clientX) => {
    const rect = bar.getBoundingClientRect();
    return clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  };
  bar.addEventListener('pointerdown', (event) => {
    dragging = true;
    bar.classList.add('is-dragging');
    try { bar.setPointerCapture(event.pointerId); } catch (_) {}
    setVolume(ratioAt(event.clientX), { transient: true });
    event.preventDefault();
  });
  bar.addEventListener('pointermove', (event) => {
    if (dragging) setVolume(ratioAt(event.clientX), { transient: true });
  });
  const finish = () => {
    if (!dragging) return;
    dragging = false;
    bar.classList.remove('is-dragging');
    savePrefs();
  };
  bar.addEventListener('pointerup', finish);
  bar.addEventListener('pointercancel', finish);
  bar.addEventListener('wheel', (event) => {
    event.preventDefault();
    setVolume(state.player.volume - Math.sign(event.deltaY) * 0.05);
  }, { passive: false });
  bar.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') setVolume(0);
    else if (event.key === 'End') setVolume(1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') setVolume(state.player.volume - 0.05);
    else setVolume(state.player.volume + 0.05);
  });
}

function bindImmersiveProgress() {
  const bar = els.immersiveProgress;
  if (!bar) return;
  let dragging = false;
  const ratioAt = (clientX) => {
    const rect = bar.getBoundingClientRect();
    return clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  };
  bar.addEventListener('pointerdown', (event) => {
    if (!currentTrack()) return;
    dragging = true;
    try { bar.setPointerCapture(event.pointerId); } catch (_) {}
    seekTo(ratioAt(event.clientX) * state.player.duration);
    event.preventDefault();
  });
  bar.addEventListener('pointermove', (event) => {
    if (dragging) seekTo(ratioAt(event.clientX) * state.player.duration);
  });
  bar.addEventListener('pointerup', () => { dragging = false; });
  bar.addEventListener('pointercancel', () => { dragging = false; });
}

/* ---------- teclado ---------- */

function handleGlobalKeydown(event) {
  const target = event.target;
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key;
  const lower = key.toLowerCase();

  if (els.factoryResetModal && !els.factoryResetModal.hidden) {
    if (key === 'Escape') closeFactoryResetModal();
    return;
  }

  if (mod && lower === 'k') {
    event.preventDefault();
    if (els.palette && !els.palette.hidden) closePalette();
    focusSearch();
    return;
  }
  if (mod && lower === 'p') {
    event.preventDefault();
    if (els.palette && !els.palette.hidden) closePalette();
    else openPalette();
    return;
  }
  if (mod && key === ',') { event.preventDefault(); openSettings(); return; }
  if (mod && lower === 'f') { event.preventDefault(); focusSearch(); return; }
  if (mod && lower === 'i') { event.preventDefault(); openImportModal('library'); return; }
  if (mod && lower === 'r') { event.preventDefault(); rescanLibrary(); return; }
  if (mod && /^[1-6]$/.test(key)) {
    event.preventDefault();
    const views = ['home', 'foryou', 'explore', 'library', 'liked', 'recent'];
    navigate(views[Number(key) - 1]);
    return;
  }

  if (key === 'Escape') {
    if (els.immersive && !els.immersive.hidden) { closeImmersive(); return; }
    if (els.trackMenu && !els.trackMenu.hidden) { closeMenus(); return; }
    if (els.addMenu && !els.addMenu.hidden) { closeMenus(); return; }
    if (els.importModal && !els.importModal.hidden) { closeImportModal(); return; }
    if (els.playlistModal && !els.playlistModal.hidden) { closePlaylistModal(); return; }
    if (els.palette && !els.palette.hidden) { closePalette(); return; }
    if ((els.settingsSheet && !els.settingsSheet.hidden) || (els.shortcutsSheet && !els.shortcutsSheet.hidden)) { closeSheets(); return; }
    if (els.contextPanel.classList.contains('is-open')) {
      closeContextPanel();
      return;
    }
    if (target === els.searchInput && els.searchInput.value) { clearSearch({ keepView: false }); return; }
  }

  if (isEditableTarget(target)) return;
  if (target instanceof Element && target.closest('button, a, [role="slider"], [role="button"]')) return;

  if (key === ' ' || key === 'Spacebar') {
    event.preventDefault();
    togglePlay();
    return;
  }
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    event.preventDefault();
    if (event.shiftKey) {
      if (key === 'ArrowLeft') previousTrack();
      else nextTrack(true);
    } else {
      seekTo(state.player.position + (key === 'ArrowLeft' ? -5 : 5));
    }
    return;
  }
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    event.preventDefault();
    setVolume(state.player.volume + (key === 'ArrowUp' ? 0.05 : -0.05));
    return;
  }

  if (lower === 'm') { event.preventDefault(); toggleMute(); return; }
  if (lower === 's') { event.preventDefault(); setShuffle(); return; }
  if (lower === 'r') { event.preventDefault(); cycleRepeat(); return; }
  if (lower === 'q') { event.preventDefault(); toggleContextPanel('queue'); return; }
  if (lower === 'l') { event.preventDefault(); toggleContextPanel('lyrics'); return; }
  if (lower === 'i') { event.preventDefault(); openImmersive(); return; }
  if (key === '?') { event.preventDefault(); openShortcuts(); return; }
  if (key === '/') { event.preventDefault(); focusSearch(); return; }

  if (key === 'Enter') {
    const openEl = target.closest('[data-open]');
    if (openEl && !['BUTTON', 'A'].includes(openEl.tagName) && openEl.dataset.open) {
      event.preventDefault();
      openFromToken(openEl.dataset.open);
      return;
    }
    const row = target.closest('[data-row-track]');
    if (row) {
      event.preventDefault();
      playFromRow(row.dataset.rowTrack, row.dataset.contextKey || 'library');
      return;
    }
    const queueItem = target.closest('[data-queue-index]');
    if (queueItem) {
      event.preventDefault();
      const index = Number(queueItem.dataset.queueIndex);
      const p = state.player;
      if (p.queue[index]) {
        p.index = index;
        p.trackId = p.queue[index];
        startCurrent();
      }
    }
  }
}

function focusSearch() {
  if (!els.searchInput) return;
  els.searchInput.focus();
  els.searchInput.select();
}

/* =========================================================
   Señales locales, recomendaciones, temas de wallpaper e
   importación de playlists. Todo se calcula en este equipo.
   ========================================================= */

/* ---------- señales de escucha y búsqueda ---------- */

function sanitizeSignals(raw) {
  const out = emptySignals();
  if (!raw || typeof raw !== 'object') return out;
  const sourceTracks = raw.tracks && typeof raw.tracks === 'object' ? raw.tracks : {};
  Object.entries(sourceTracks).forEach(([id, value]) => {
    if (!id || !value || typeof value !== 'object') return;
    const plays = Math.max(0, Math.round(Number(value.plays) || 0));
    const completes = Math.max(0, Math.round(Number(value.completes) || 0));
    const skips = Math.max(0, Math.round(Number(value.skips) || 0));
    const searchHits = Math.max(0, Math.round(Number(value.searchHits) || 0));
    const last = Math.max(0, Number(value.last) || 0);
    const first = Math.max(0, Number(value.first) || last || 0);
    const lastComplete = Math.max(0, Number(value.lastComplete) || 0);
    if (!plays && !completes && !skips && !searchHits) return;
    out.tracks[id] = { plays, completes, skips, searchHits, last, first, lastComplete };
  });
  const searches = Array.isArray(raw.searches) ? raw.searches : [];
  const seen = new Set();
  searches.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const q = String(entry.q || '').trim().slice(0, 120);
    const key = fold(q);
    if (!q || seen.has(key)) return;
    seen.add(key);
    out.searches.push({
      q,
      at: Math.max(0, Number(entry.at) || 0),
      count: Math.max(1, Math.round(Number(entry.count) || 1)),
    });
  });
  out.searches = out.searches.sort((a, b) => b.at - a.at).slice(0, 100);
  out.updatedAt = Math.max(0, Number(raw.updatedAt) || 0);
  return out;
}

function saveSignals() {
  state.signals.updatedAt = Date.now();
  state.recs = null;
  writeStore(STORE.signals, state.signals);
}

function pruneSignals() {
  if (!state.signals) return;
  let changed = false;
  Object.keys(state.signals.tracks || {}).forEach((id) => {
    if (!state.tracksById || !state.tracksById.has(id)) {
      delete state.signals.tracks[id];
      changed = true;
    }
  });
  if (state.signals.nowPlaying && (!state.tracksById || !state.tracksById.has(state.signals.nowPlaying.id))) {
    state.signals.nowPlaying = null;
    changed = true;
  }
  if (changed) saveSignals();
}

function bumpTrackSignal(trackId, field, amount = 1) {
  if (!trackId) return null;
  if (!state.signals.tracks) state.signals.tracks = {};
  if (!state.signals.tracks[trackId]) {
    state.signals.tracks[trackId] = { plays: 0, completes: 0, skips: 0, searchHits: 0, last: 0, first: 0, lastComplete: 0 };
  }
  const entry = state.signals.tracks[trackId];
  entry[field] = Math.max(0, (Number(entry[field]) || 0) + amount);
  return entry;
}

function recordPlayStart(trackId) {
  const entry = bumpTrackSignal(trackId, 'plays', 1);
  if (!entry) return;
  const now = Date.now();
  entry.last = now;
  if (!entry.first) entry.first = now;
  state.signals.nowPlaying = { id: trackId, startedAt: now };
  saveSignals();
}

function noteTrackSwitch(nextId) {
  const current = state.signals.nowPlaying;
  if (!current || current.id === nextId) return;
  const elapsed = Math.max(0, (Date.now() - (Number(current.startedAt) || Date.now())) / 1000);
  const track = trackFromId(current.id);
  const duration = Number(track?.duration) || 0;
  const skipBefore = Math.min(30, Math.max(9, duration * 0.24));
  if (elapsed > 1.5 && elapsed < skipBefore) bumpTrackSignal(current.id, 'skips', 1);
  state.signals.nowPlaying = null;
  saveSignals();
}

function recordTrackComplete(trackId) {
  if (!trackId) return;
  const entry = bumpTrackSignal(trackId, 'completes', 1);
  if (entry) entry.lastComplete = Date.now();
  state.signals.nowPlaying = null;
  saveSignals();
}

function recordSearchSignal(query) {
  const q = String(query || '').trim().slice(0, 120);
  if (!q) return;
  const key = fold(q);
  const existing = state.signals.searches.find((entry) => fold(entry.q) === key);
  const count = (Number(existing?.count) || 0) + 1;
  const entry = { q, at: Date.now(), count };
  state.signals.searches = [entry, ...state.signals.searches.filter((item) => fold(item.q) !== key)].slice(0, 100);
  saveSignals();
}

function recordSearchHit(trackId, query) {
  if (!trackId) return;
  const q = String(query || '').trim().slice(0, 120);
  const entry = bumpTrackSignal(trackId, 'searchHits', 1);
  if (entry && q) entry.lastSearch = q;
  saveSignals();
}

function clearSearchSignals() {
  state.signals.searches = [];
  state.prefs.searchHistory = [];
  saveSignals();
  savePrefs();
  toast('Búsquedas recientes borradas de este equipo.', 'trash');
}

function recentSearchSignals(limit = 8) {
  const seen = new Set();
  return (state.signals.searches || [])
    .filter((entry) => entry && entry.q)
    .sort((a, b) => (Number(b.at) || 0) - (Number(a.at) || 0))
    .filter((entry) => {
      const key = fold(entry.q);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function renderRecentSearches() {
  const entries = recentSearchSignals(8);
  const fallback = entries.length ? [] : (state.prefs.searchHistory || []).filter(Boolean).slice(0, 6).map((q) => ({ q, at: 0, count: 1 }));
  const history = entries.length ? entries : fallback;
  if (!history.length) return '';
  return `<section class="recent-searches">
    <div class="recent-searches__head">
      <span>${icon('clock')} Búsquedas recientes</span>
      <button class="link-btn" data-clear-search-history>Borrar</button>
    </div>
    <div class="recent-searches__row">
      ${history.map((entry) => `<button class="recent-search" data-search-chip="${esc(entry.q)}">
        ${icon('search')}<span>${esc(entry.q)}</span>${entry.count > 1 ? `<small>${entry.count}</small>` : ''}
      </button>`).join('')}
    </div>
  </section>`;
}

/* ---------- motor de recomendaciones ---------- */

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function recommendationSnapshot(force = false) {
  if (!force && state.recs) return state.recs;
  state.recs = buildRecommendations(force);
  return state.recs;
}

function buildRecommendations(force = false) {
  const now = Date.now();
  const tracks = state.allTracks || [];
  if (!tracks.length) {
    return {
      mix: [], reasons: {}, topArtist: null, topGenre: null, signalCount: 0,
      searches: [], searchSection: null, rediscover: [], fresh: [], artists: [],
      updatedAt: now, seed: now,
    };
  }

  const artistWeights = new Map();
  const genreWeights = new Map();
  const playlistCounts = new Map();
  (state.userPlaylists || []).forEach((playlist) => {
    (playlist.track_ids || []).forEach((id) => playlistCounts.set(id, (playlistCounts.get(id) || 0) + 1));
  });

  Object.entries(state.signals.tracks || {}).forEach(([id, signal]) => {
    const track = trackFromId(id);
    if (!track || !signal) return;
    const ageDays = Math.max(0, now - (Number(signal.last) || 0)) / 86400000;
    const recency = Math.exp(-ageDays / 26);
    const weight = Math.max(-2, (Number(signal.plays) || 0) + (Number(signal.completes) || 0) * 0.7 - (Number(signal.skips) || 0) * 0.85) * recency;
    if (weight === 0) return;
    if (track.artist) artistWeights.set(track.artist, (artistWeights.get(track.artist) || 0) + weight);
    if (track.genre) genreWeights.set(track.genre, (genreWeights.get(track.genre) || 0) + weight);
  });

  const maxArtistWeight = Math.max(1, ...Array.from(artistWeights.values()).map((value) => Math.abs(value)));
  const maxGenreWeight = Math.max(1, ...Array.from(genreWeights.values()).map((value) => Math.abs(value)));
  const recentIds = new Set((state.recents || []).slice(0, 28).map((entry) => entry.id));
  const searchTerms = recentSearchSignals(8)
    .filter((entry) => now - (Number(entry.at) || 0) < 86400000 * 120)
    .map((entry, index) => ({
      q: entry.q,
      tokens: searchTokens(entry.q),
      weight: Math.max(1.2, 8 - index * 0.85) * Math.exp(-Math.max(0, now - entry.at) / (86400000 * 45)),
    }))
    .filter((entry) => entry.tokens.length);

  const seed = force ? now : Math.floor(now / 3600000);
  const scored = tracks.map((track) => {
    const reasons = [];
    const signal = state.signals.tracks?.[track.id] || null;
    const daysSince = signal?.last ? (now - signal.last) / 86400000 : Infinity;
    const plays = Number(signal?.plays) || 0;
    const completes = Number(signal?.completes) || 0;
    const skips = Number(signal?.skips) || 0;
    let score = 1.25;

    if (state.likes.includes(track.id)) {
      score += 13;
      reasons.push('Te gusta');
    }
    const playlistCount = playlistCounts.get(track.id) || 0;
    if (playlistCount) {
      score += Math.min(6, playlistCount * 2.1);
      reasons.push('Está en tus playlists');
    }
    if (plays) {
      const familiarity = Math.min(8.5, plays * 1.25) + Math.min(3, completes * 0.5) - Math.min(5, skips * 1.4);
      score += familiarity * Math.exp(-Math.max(0, daysSince) / 42);
      if (playlistCount || state.likes.includes(track.id)) reasons.push('La escuchas a menudo');
      if (daysSince < 0.12) score -= 7;
      if (plays > 12) score -= 1.5;
    } else {
      score += 2.2;
      reasons.push('Aún no la has escuchado');
    }
    if (daysSince > 25 && daysSince < 400 && plays < 6) {
      score += 1.6;
      reasons.push('Para redescubrir');
    }
    if (track.source === 'local') {
      score += 1.1;
      if (!plays) reasons.push('Nueva en tu biblioteca');
    }
    if (recentIds.has(track.id)) score -= 3.2;

    const artistWeight = artistWeights.get(track.artist) || 0;
    if (artistWeight > 0) {
      score += Math.min(9.5, (artistWeight / maxArtistWeight) * 9.5);
      reasons.push(`Más de ${track.artist}`);
    }
    const genreWeight = genreWeights.get(track.genre) || 0;
    if (genreWeight > 0) {
      score += Math.min(5, (genreWeight / maxGenreWeight) * 5);
      if (track.genre) reasons.push(`${track.genre} en tu historial`);
    }

    const haystack = fold(`${track.title} ${track.artist} ${track.album} ${track.genre}`);
    searchTerms.forEach((term) => {
      if (!term.tokens.every((token) => haystack.includes(token))) return;
      const inTitle = term.tokens.every((token) => fold(track.title).includes(token));
      score += term.weight + (inTitle ? 2.4 : 0);
      reasons.push(`Buscaste «${term.q}»`);
    });

    const jitter = ((hashString(`${seed}:${track.id}`) % 1000) / 1000) * 2.8;
    return { track, score: score + jitter, reasons: [...new Set(reasons)].slice(0, 4) };
  }).sort((a, b) => b.score - a.score);

  const counts = new Map();
  const chosen = [];
  const chosenIds = new Set();
  for (const entry of scored) {
    const artist = entry.track.artist || '';
    if ((counts.get(artist) || 0) >= 3) continue;
    chosen.push(entry);
    chosenIds.add(entry.track.id);
    counts.set(artist, (counts.get(artist) || 0) + 1);
    if (chosen.length >= 18) break;
  }
  if (chosen.length < 12) {
    for (const entry of scored) {
      if (chosenIds.has(entry.track.id)) continue;
      chosen.push(entry);
      chosenIds.add(entry.track.id);
      if (chosen.length >= 18) break;
    }
  }

  const topArtistEntry = Array.from(artistWeights.entries()).filter((entry) => entry[1] > 0).sort((a, b) => b[1] - a[1])[0];
  const topGenreEntry = Array.from(genreWeights.entries()).filter((entry) => entry[1] > 0).sort((a, b) => b[1] - a[1])[0];
  const fallbackArtist = state.artists?.[0]?.name || chosen[0]?.track.artist || '';
  const fallbackGenre = chosen[0]?.track.genre || state.allTracks.find((track) => track.genre)?.genre || '';

  const searchSection = (() => {
    for (const term of searchTerms) {
      const found = searchTracks(term.q).filter((track) => !chosenIds.has(track.id)).slice(0, 8);
      if (found.length) return { query: term.q, tracks: found };
    }
    return null;
  })();

  const rediscover = scored
    .filter((entry) => {
      const signal = state.signals.tracks?.[entry.track.id];
      if (!signal) return false;
      const age = now - (Number(signal.last) || 0);
      return (Number(signal.plays) || 0) > 0 && age > 86400000 * 14;
    })
    .sort((a, b) => {
      const al = Number(state.signals.tracks?.[a.track.id]?.last) || 0;
      const bl = Number(state.signals.tracks?.[b.track.id]?.last) || 0;
      return al - bl;
    })
    .slice(0, 8)
    .map((entry) => entry.track);

  const fresh = (state.local?.tracks || [])
    .filter((track) => !(state.signals.tracks?.[track.id]?.plays))
    .sort((a, b) => (Number(b.added_at) || 0) - (Number(a.added_at) || 0))
    .slice(0, 8);

  const artists = Array.from(artistWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => state.artists.find((artist) => artist.name === name))
    .filter(Boolean)
    .slice(0, 6);

  const signalCount = Object.values(state.signals.tracks || {}).reduce((sum, signal) => sum + (Number(signal.plays) || 0), 0)
    + (state.signals.searches || []).length
    + state.likes.length;

  const reasons = {};
  chosen.forEach((entry) => { reasons[entry.track.id] = entry.reasons; });

  return {
    mix: chosen.map((entry) => entry.track.id),
    reasons,
    topArtist: topArtistEntry ? { name: topArtistEntry[0], weight: topArtistEntry[1] } : (fallbackArtist ? { name: fallbackArtist, weight: 0 } : null),
    topGenre: topGenreEntry ? { name: topGenreEntry[0], weight: topGenreEntry[1] } : (fallbackGenre ? { name: fallbackGenre, weight: 0 } : null),
    signalCount,
    searches: searchTerms.map((term) => term.q),
    searchSection,
    rediscover,
    fresh,
    artists,
    updatedAt: now,
    seed,
  };
}

function refreshRecommendations() {
  state.recs = buildRecommendations(true);
  if (state.view.name === 'foryou' || state.view.name === 'home') renderView();
  toast('Mezcla actualizada con lo último que escuchaste y buscaste.', 'sparkle', 3400);
}

function renderRecMiniRows(tracks, limit = 5) {
  return tracks.slice(0, limit).map((track, index) => `<div class="rec-mini-row" data-row-track="${esc(track.id)}" data-context-key="foryou" tabindex="0" role="button" aria-label="Reproducir ${esc(track.title)}">
    <span class="rec-mini-row__num">${index + 1}</span>
    <img src="${esc(coverSrc(track))}" alt="" loading="lazy" draggable="false">
    <span class="rec-mini-row__copy"><strong>${esc(track.title)}</strong><span>${esc(track.artist)}</span></span>
    <span class="rec-mini-row__duration">${fmtTime(track.duration)}</span>
  </div>`).join('');
}

function renderRecMix(snapshot, options = {}) {
  const tracks = (snapshot.mix || []).map(trackFromId).filter(Boolean);
  if (!tracks.length) return '';
  const limit = options.limit || 6;
  const first = tracks[0];
  const reasons = (snapshot.reasons?.[first.id] || []).slice(0, 3);
  return `<div class="rec-mix">
    <div class="rec-mix__art">
      <img src="${esc(coverSrc(first))}" alt="" draggable="false">
      <span class="rec-mix__badge">${icon('sparkle')} Mezcla local</span>
    </div>
    <div class="rec-mix__copy">
      <div class="eyebrow">${options.home ? 'Hecho para ti' : 'Tu selección de hoy'}</div>
      <h2>${options.home ? 'La mezcla de <em>hoy</em>' : 'Tu frecuencia, <em>sin nube</em>'}</h2>
      <p>Construida con tus reproducciones, tus búsquedas y tus playlists. Cambia cuando tu escucha cambia; nada se envía a un servidor.</p>
      <div class="rec-mix__reasons">${reasons.map((reason) => `<span class="reason-chip">${esc(reason)}</span>`).join('') || `<span class="reason-chip">Tu biblioteca</span>`}</div>
      <div class="rec-mix__actions">
        ${playableContextButton('foryou', 'Reproducir mezcla')}
        ${options.home ? `<button class="btn btn--ghost" data-open="foryou">${icon('arrow-right')} Ver Para ti</button>` : `<button class="btn btn--ghost" data-refresh-recs>${icon('refresh')} Actualizar</button>`}
      </div>
      <div class="rec-mix__tracks">${renderRecMiniRows(tracks, limit)}</div>
    </div>
  </div>`;
}

function renderRecommendationSpotlight() {
  if (!state.allTracks.length) return '';
  const snapshot = recommendationSnapshot();
  if (!snapshot.mix.length) return '';
  return `<section class="section">
    ${sectionHead('Privado y cambiante', 'Hecho para <em>ti</em>', `<button class="section-head__link" data-open="foryou">Abrir Para ti ${icon('arrow-right')}</button>`)}
    ${renderRecMix(snapshot, { limit: 4, home: true })}
  </section>`;
}

function renderForYou() {
  const snapshot = recommendationSnapshot();
  const mixTracks = (snapshot.mix || []).map(trackFromId).filter(Boolean);
  const first = mixTracks[0] || state.allTracks[0];
  if (!first) {
    return `${pageHead('Para ti', 'Aún no hay <em>música</em>', 'Importa tus playlists o busca una canción para que Davusic tenga algo que escuchar por ti.', `<button class="btn btn--primary" data-import>${icon('folder-plus')} Importar música</button>`)}
      ${emptyState('sparkle', 'Sin señales todavía', 'Cuando escuches o busques algo, aquí aparecerá una mezcla construida en tu equipo. Sin cuentas ni perfiles.', `<button class="btn btn--primary" data-open="explore">${icon('compass')} Explorar la demo</button>`)}`;
  }

  const hero = `<section class="foryou-hero" style="--foryou-art:${cssUrl(coverSrc(first))}">
    <div class="foryou-hero__copy">
      <div class="eyebrow">Para ti · sin nube</div>
      <h1>Tu frecuencia,<br><em>hecha contigo.</em></h1>
      <p>Davusic mira solo lo que pasa aquí: lo que escuchas, lo que buscas y las listas que haces. La mezcla se recalcula en tu equipo y nunca sale de él.</p>
      <div class="foryou-hero__signals">
        ${snapshot.topArtist ? `<span class="signal-pill">${icon('mic')} ${esc(snapshot.topArtist.name)}</span>` : ''}
        ${snapshot.topGenre ? `<span class="signal-pill">${icon('waveform')} ${esc(snapshot.topGenre.name)}</span>` : ''}
        <span class="signal-pill">${icon('play')} ${plural(snapshot.signalCount, 'señal', 'señales')}</span>
        <span class="signal-pill">${icon('shield')} Solo en tu equipo</span>
      </div>
      <div class="foryou-hero__actions">
        ${playableContextButton('foryou', 'Reproducir mezcla')}
        <button class="btn btn--ghost foryou-refresh" data-refresh-recs>${icon('refresh')} Actualizar mezcla</button>
      </div>
    </div>
  </section>`;

  const summary = `<div class="foryou-summary">
    <div class="taste-card"><span class="taste-card__icon">${icon('mic')}</span><span class="taste-card__copy"><strong>${esc(snapshot.topArtist?.name || 'Tu biblioteca')}</strong><span>Artista con más peso</span></span></div>
    <div class="taste-card"><span class="taste-card__icon">${icon('waveform')}</span><span class="taste-card__copy"><strong>${esc(snapshot.topGenre?.name || 'Sin género dominante')}</strong><span>Género que más repites</span></span></div>
    <div class="taste-card"><span class="taste-card__icon">${icon('clock')}</span><span class="taste-card__copy"><strong>${plural(snapshot.signalCount, 'señal', 'señales')}</strong><span>Escucha y búsqueda locales</span></span></div>
    <div class="taste-card"><span class="taste-card__icon">${icon('library')}</span><span class="taste-card__copy"><strong>${plural(state.allTracks.length, 'pista', 'pistas')}</strong><span>En tu biblioteca</span></span></div>
  </div>`;

  const intro = snapshot.signalCount
    ? `<div class="rec-note">${icon('shield')} La mezcla se apoya en tu historial local. Cuanto más escuchas, más precisa se vuelve.</div>`
    : `<div class="rec-empty-signals"><strong>Aún hay pocas señales.</strong> Reproduce algunas pistas y haz una búsqueda. Las recomendaciones empezarán a afinarse sin enviar nada a ningún servidor.</div>`;

  const searchSection = snapshot.searchSection ? `<section class="section">
    ${sectionHead('Porque buscaste', `«${esc(snapshot.searchSection.query)}»`, `<button class="section-head__link" data-search-chip="${esc(snapshot.searchSection.query)}">Buscar otra vez ${icon('search')}</button>`)}
    <div class="tracklist-wrap">${tracklist(snapshot.searchSection.tracks, `search:${snapshot.searchSection.query}`, { simple: true, showGenre: true })}</div>
  </section>` : '';

  const artistsSection = snapshot.artists.length ? `<section class="section">
    ${sectionHead('Afinidad local', 'Artistas que estás <em>escuchando</em>', '')}
    <div class="media-grid media-grid--six">${snapshot.artists.map((artist) => mediaCard(artist, 'artist')).join('')}</div>
  </section>` : '';

  const freshSection = snapshot.fresh.length ? `<section class="section">
    ${sectionHead('Sin estrenar', 'Nuevo en tu <em>biblioteca</em>', `<button class="section-head__link" data-open="library">Abrir biblioteca ${icon('arrow-right')}</button>`)}
    <div class="tracklist-wrap">${tracklist(snapshot.fresh, 'library', { simple: true, showGenre: true })}</div>
  </section>` : '';

  const rediscoverSection = snapshot.rediscover.length ? `<section class="section">
    ${sectionHead('Vuelve a pasar', 'Para <em>redescubrir</em>', '')}
    <div class="tracklist-wrap">${tracklist(snapshot.rediscover, 'foryou', { simple: true, showGenre: true })}</div>
  </section>` : '';

  return `${hero}${summary}
    <section class="section">
      ${sectionHead('Mezcla privada', 'Lo que suena <em>ahora</em>', `<span class="section-head__link">${plural(mixTracks.length, 'pista', 'pistas')}</span>`)}
      ${renderRecMix(snapshot, { limit: 7 })}
      ${intro}
    </section>
    ${searchSection}
    ${artistsSection}
    ${freshSection}
    ${rediscoverSection}`;
}

/* ---------- temas generados desde wallpapers ---------- */

const WALLPAPER_STYLE_VARS = [
  '--bg', '--bg-rgb', '--bg-deep', '--bg-elev', '--text', '--text-soft', '--muted', '--faint', '--ink',
  '--accent', '--accent-rgb', '--accent-2', '--accent-2-rgb', '--accent-ink',
  '--surface', '--surface-hover', '--surface-strong', '--panel', '--panel-solid',
  '--sidebar-bg', '--player-bg', '--line', '--line-strong', '--scroll-thumb',
];

function rgbaFromHex(value, alpha) {
  return `rgba(${rgbTriplet(value)}, ${alpha})`;
}

function contrastInk(value) {
  const channels = rgbTriplet(value, '255, 160, 148').split(',').map((part) => Number(part.trim()) / 255);
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.48 ? '#1c1113' : '#fff8f2';
}

function wallpaperSelection() {
  const selected = state.wallpaper?.selected;
  return selected && selected.palette ? selected : null;
}

function applyWallpaperVars(theme) {
  const palette = theme?.palette;
  if (!palette || !els.app) return;
  const values = {
    '--bg': hex(palette.bg, '#0a090d'),
    '--bg-rgb': rgbTriplet(palette.bg, '10, 9, 13'),
    '--bg-deep': hex(palette.bg_deep, '#070609'),
    '--bg-elev': hex(palette.bg_elev, '#111016'),
    '--text': hex(palette.text, '#f5eee7'),
    '--text-soft': hex(palette.text_soft, '#d0c6c2'),
    '--muted': hex(palette.muted, '#938a92'),
    '--faint': hex(palette.faint, '#6b636d'),
    '--ink': contrastInk(palette.accent),
    '--accent': hex(palette.accent, '#ffa094'),
    '--accent-rgb': rgbTriplet(palette.accent),
    '--accent-2': hex(palette.accent2, '#80e5d2'),
    '--accent-2-rgb': rgbTriplet(palette.accent2),
    '--accent-ink': contrastInk(palette.accent),
    '--surface': rgbaFromHex(palette.text, 0.045),
    '--surface-hover': rgbaFromHex(palette.text, 0.078),
    '--surface-strong': rgbaFromHex(palette.text, 0.105),
    '--panel': rgbaFromHex(palette.bg_elev, 0.78),
    '--panel-solid': hex(palette.bg_elev, '#111016'),
    '--sidebar-bg': rgbaFromHex(palette.bg, 0.5),
    '--player-bg': rgbaFromHex(palette.bg, 0.82),
    '--line': rgbaFromHex(palette.text, 0.09),
    '--line-strong': rgbaFromHex(palette.text, 0.18),
    '--scroll-thumb': rgbaFromHex(palette.text, 0.18),
  };
  Object.entries(values).forEach(([name, value]) => els.app.style.setProperty(name, value));
  if (els.wallpaperLayer) {
    const wallpaper = theme.wallpaper || palette.wallpaper;
    els.wallpaperLayer.style.backgroundImage = wallpaper ? cssUrl(wallpaper) : '';
  }
  document.documentElement.style.colorScheme = 'dark';
}

function clearWallpaperVars() {
  if (els.app) WALLPAPER_STYLE_VARS.forEach((name) => els.app.style.removeProperty(name));
  if (els.wallpaperLayer) els.wallpaperLayer.style.backgroundImage = '';
  document.documentElement.style.removeProperty('color-scheme');
}

function persistWallpaperState() {
  writeStore(STORE.wallpaper, {
    themes: state.wallpaper.themes,
    folder: state.wallpaper.folder,
    selected: state.wallpaper.selected,
    updatedAt: Date.now(),
  });
}

function applyWallpaperDiscovery(discovery) {
  if (!discovery || typeof discovery !== 'object') return;
  state.wallpaper.themes = Array.isArray(discovery.themes) ? discovery.themes.filter((theme) => theme && theme.id && theme.palette) : [];
  state.wallpaper.folder = String(discovery.folder || '');
  state.wallpaper.loaded = true;
  state.wallpaper.error = '';
  const selectedId = state.wallpaper.selected?.id;
  if (selectedId) {
    const updated = state.wallpaper.themes.find((theme) => theme.id === selectedId);
    if (updated) state.wallpaper.selected = updated;
  }
  persistWallpaperState();
  if (state.prefs.theme === 'wallpaper' && wallpaperSelection()) applyPrefs();
  if (els.settingsSheet && !els.settingsSheet.hidden) renderSettings();
}

async function discoverWallpapers(force = false, options = {}) {
  if (!IS_TAURI) {
    toast('Los temas desde wallpapers están disponibles en la app de escritorio.', 'image', 4200);
    return;
  }
  if (state.wallpaper.busy) return;
  state.wallpaper.busy = true;
  state.wallpaper.error = '';
  state.wallpaper.progress = { done: 0, total: 0, current: '', stage: 'start' };
  if (els.settingsSheet && !els.settingsSheet.hidden) renderSettings();
  try {
    const discovery = await inv('discover_wallpapers', { force: Boolean(force) });
    applyWallpaperDiscovery(discovery);
    if (!options.quiet) toast(esc(discovery?.message || 'Temas de wallpaper actualizados.'), 'image', 4200);
  } catch (error) {
    state.wallpaper.error = String(error?.message || error || 'No se pudieron analizar los wallpapers.');
    if (!options.quiet) toast(`No se pudieron crear los temas. ${esc(state.wallpaper.error)}`, 'bell', 5200);
  } finally {
    state.wallpaper.busy = false;
    if (els.settingsSheet && !els.settingsSheet.hidden) renderSettings();
  }
}

function ensureWallpaperThemes() {
  if (!IS_TAURI || state.wallpaper.attempted) return;
  state.wallpaper.attempted = true;
  discoverWallpapers(false, { quiet: true });
}

async function chooseWallpaperFolder() {
  if (!IS_TAURI) {
    toast('Elegir una carpeta de wallpapers está disponible en la app de escritorio.', 'image');
    return;
  }
  if (state.wallpaper.busy) return;
  state.wallpaper.busy = true;
  state.wallpaper.error = '';
  if (els.settingsSheet && !els.settingsSheet.hidden) renderSettings();
  try {
    const discovery = await inv('choose_wallpaper_folder');
    if (discovery) {
      applyWallpaperDiscovery(discovery);
      toast(esc(discovery.message || 'Carpeta de wallpapers actualizada.'), 'image', 4200);
    }
  } catch (error) {
    state.wallpaper.error = String(error?.message || error || 'No se pudo abrir la carpeta.');
    toast(`No se pudo analizar la carpeta. ${esc(state.wallpaper.error)}`, 'bell', 5000);
  } finally {
    state.wallpaper.busy = false;
    if (els.settingsSheet && !els.settingsSheet.hidden) renderSettings();
  }
}

function selectWallpaperTheme(id) {
  const theme = state.wallpaper.themes.find((item) => item.id === id);
  if (!theme) return;
  state.wallpaper.selected = theme;
  state.prefs.theme = 'wallpaper';
  savePrefs();
  persistWallpaperState();
  applyPrefs();
  renderSettings();
  toast(`Tema <strong>${esc(theme.name)}</strong> aplicado desde tu wallpaper.`, 'image', 3400);
}

function resetWallpaperTheme() {
  state.prefs.theme = 'obsidian';
  savePrefs();
  applyPrefs();
  renderSettings();
  toast('Vuelves a la obsidiana cálida. Tu tema de wallpaper queda guardado para después.', 'sun', 3600);
}

function handleWallpaperProgress(payload) {
  if (!payload) return;
  const total = Math.max(0, Number(payload.total) || 0);
  const done = Math.max(0, Number(payload.done) || 0);
  state.wallpaper.progress = {
    done,
    total,
    current: String(payload.current || ''),
    stage: String(payload.stage || 'scan'),
  };
  if (payload.stage === 'done') state.wallpaper.busy = false;
  const holder = qs('#wallpaperProgress');
  if (holder) {
    const bar = qs('.wallpaper-progress__bar span', holder);
    const text = qs('.wallpaper-progress__text', holder);
    const pct = total ? clamp((done / total) * 100, 0, 100) : 0;
    if (bar) bar.style.width = `${pct}%`;
    if (text) text.textContent = payload.stage === 'done' ? 'Listo' : `${done}/${total} · ${state.wallpaper.progress.current || 'analizando'}`;
  }
}

function renderWallpaperSettings() {
  const disabled = !IS_TAURI;
  const themes = state.wallpaper.themes || [];
  const activeId = state.prefs.theme === 'wallpaper' ? state.wallpaper.selected?.id : null;
  const selected = wallpaperSelection();
  const progress = state.wallpaper.progress || { done: 0, total: 0 };
  const percent = progress.total ? clamp((progress.done / progress.total) * 100, 0, 100) : 0;
  const scanning = state.wallpaper.busy;
  const folder = state.wallpaper.folder || '';

  const cards = themes.length ? `<div class="wallpaper-grid">${themes.map((theme) => {
    const palette = theme.palette || {};
    return `<button class="wp-card ${theme.id === activeId ? 'is-active' : ''}" data-wallpaper-theme="${esc(theme.id)}" title="${esc(theme.name)}">
      <span class="wp-card__art">
        <img src="${esc(theme.wallpaper || palette.wallpaper || '')}" alt="" loading="lazy">
        <span class="wp-card__check">${icon('check')}</span>
      </span>
      <span class="wp-card__copy">
        <span class="wp-card__name">${esc(theme.name)}</span>
        <span class="wp-card__dots"><i style="background:${hex(palette.accent)}"></i><i style="background:${hex(palette.accent2)}"></i><i style="background:${hex(palette.bg_elev)}"></i></span>
      </span>
    </button>`;
  }).join('')}</div>` : `<div class="wallpaper-empty">${icon('image')}<strong>${state.wallpaper.loaded ? 'No se encontraron imágenes' : 'Tus wallpapers, convertidos en temas'}</strong><br>${state.wallpaper.loaded ? 'Prueba con otra carpeta o añade imágenes JPG, PNG, WebP o AVIF.' : 'Davusic busca en tu carpeta de wallpapers y crea hasta 24 paletas oscuras. Nada se modifica.'}</div>`;

  const progressMarkup = scanning ? `<div class="wallpaper-progress" id="wallpaperProgress">
    <div class="wallpaper-progress__bar"><span style="width:${percent}%"></span></div>
    <span class="wallpaper-progress__text">${progress.total ? `${progress.done}/${progress.total} · ${esc(progress.current || 'analizando')}` : 'Buscando imágenes…'}</span>
  </div>` : '';

  return `<div class="settings-group">
    <div class="settings-group__title">${icon('image')} Temas de tus wallpapers</div>
    <div class="wallpaper-panel">
      <div class="wallpaper-panel__head">
        <span class="wallpaper-panel__icon">${icon('image')}</span>
        <span class="wallpaper-panel__copy">
          <strong>Paletas que ya son tuyas</strong>
          <span>${folder ? esc(folder) : disabled ? 'Disponible en la app de escritorio.' : 'Davusic buscará en tu carpeta de wallpapers habitual.'}</span>
        </span>
      </div>
      ${progressMarkup}
      ${state.wallpaper.error ? `<div class="import-warning" style="margin-top:9px">${icon('bell')}<span>${esc(state.wallpaper.error)}</span></div>` : ''}
      ${cards}
      ${selected && activeId ? `<div class="wp-active-banner">${icon('check')}<span><strong>${esc(selected.name)}</strong> está activo, generado desde tu wallpaper.</span><button class="link-btn" data-wallpaper-reset>Volver a obsidiana</button></div>` : ''}
      <div class="wallpaper-panel__actions">
        <button class="btn btn--soft" data-wallpaper-discover ${disabled || scanning ? 'disabled' : ''}>${icon('refresh')} ${themes.length ? 'Detectar de nuevo' : 'Detectar wallpapers'}</button>
        <button class="btn btn--ghost" data-wallpaper-choose ${disabled || scanning ? 'disabled' : ''}>${icon('folder')} Elegir carpeta</button>
        ${themes.length ? `<button class="btn btn--ghost" data-wallpaper-refresh ${disabled || scanning ? 'disabled' : ''}>${icon('sparkle')} Reanalizar</button>` : ''}
      </div>
    </div>
  </div>`;
}

/* ---------- Spotify: cuenta e importación ---------- */

const SPOTIFY_REDIRECT_FALLBACK = 'http://127.0.0.1:43827/callback';

function spotifyStatusValue() {
  return state.spotify.status || null;
}

function spotifyRedirectUri() {
  return spotifyStatusValue()?.redirectUri || SPOTIFY_REDIRECT_FALLBACK;
}

function spotifyErrorText(error) {
  const raw = error?.message ?? error;
  return String(raw || 'Spotify no respondió.')
    .replace(/^Error:\s*/i, '')
    .trim();
}

function spotifyShortId(value) {
  const id = String(value || '');
  if (!id) return 'Sin configurar';
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;
}

function spotifyAvatarMarkup(status = spotifyStatusValue()) {
  const image = String(status?.image || '');
  const safeImage = /^https:\/\//i.test(image) ? image : '';
  return `<span class="spotify-avatar">${safeImage
    ? `<img src="${esc(safeImage)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : icon('spotify')}</span>`;
}

function spotifyAlertMarkup() {
  const error = state.spotify.error
    ? `<div class="import-warning spotify-alert">${icon('bell')}<span>${esc(state.spotify.error)}</span></div>`
    : '';
  const notice = state.spotify.notice
    ? `<div class="spotify-notice">${icon('check')}<span>${esc(state.spotify.notice)}</span></div>`
    : '';
  return `${error}${notice}`;
}

function spotifySetupMarkup() {
  const status = spotifyStatusValue();
  const current = state.spotify.clientIdDraft || status?.clientId || '';
  return `<div class="spotify-card spotify-card--setup">
    <div class="spotify-card__head">
      <span class="spotify-mark">${icon('spotify')}</span>
      <span class="spotify-card__copy">
        <strong>Conecta Spotify para importar</strong>
        <span>Lee tus playlists y Me gusta con la API oficial. Davusic no reproduce el catálogo de Spotify.</span>
      </span>
      <span class="spotify-pill">Opcional</span>
    </div>
    <div class="spotify-steps">
      <div class="spotify-step">
        <span class="spotify-step__n">1</span>
        <span>Crea una app en <button type="button" class="link-btn" data-spotify-open-dashboard>Spotify Developer ${icon('arrow-right')}</button> y activa la Web API.</span>
      </div>
      <div class="spotify-step">
        <span class="spotify-step__n">2</span>
        <span>Añade este <strong>Redirect URI</strong> exacto:
          <span class="spotify-redirect"><code>${esc(spotifyRedirectUri())}</code><button type="button" class="link-btn" data-spotify-copy-redirect>${icon('link')} Copiar</button></span>
        </span>
      </div>
      <div class="spotify-step">
        <span class="spotify-step__n">3</span>
        <span>Copia el <strong>Client ID</strong> de tu app y pégalo aquí. No necesitas el Client Secret.</span>
      </div>
    </div>
    <div class="spotify-client-row">
      <input class="import-input spotify-client-input" data-spotify-client-id type="text" value="${esc(current)}" placeholder="Client ID de Spotify" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="256" aria-label="Client ID de Spotify">
      <button type="button" class="btn btn--soft" data-spotify-save-client>${icon('check')} Guardar</button>
      ${state.spotify.editClient ? `<button type="button" class="link-btn" data-spotify-edit-client>Cancelar</button>` : ''}
    </div>
    ${spotifyAlertMarkup()}
    <div class="spotify-footnote">${icon('shield')}<span>El inicio de sesión se abre en tu navegador. Davusic nunca lee cookies ni la sesión de otras webs. Spotify exige Premium a la cuenta propietaria de la app en modo desarrollo.</span></div>
  </div>`;
}

function spotifyConnectMarkup() {
  const status = spotifyStatusValue();
  return `<div class="spotify-card spotify-card--connect">
    <div class="spotify-card__head">
      <span class="spotify-mark">${icon('spotify')}</span>
      <span class="spotify-card__copy">
        <strong>Client ID listo</strong>
        <span>La app está configurada. Autoriza tu cuenta para leer playlists y Me gusta.</span>
      </span>
      <span class="spotify-pill is-ok">${icon('check')} Lista</span>
    </div>
    <div class="spotify-client-line">
      <span>Client ID</span>
      <code>${esc(spotifyShortId(status?.clientId))}</code>
      <button type="button" class="link-btn" data-spotify-edit-client>Cambiar</button>
    </div>
    <div class="spotify-actions">
      <button type="button" class="btn btn--primary" data-spotify-connect>${icon('spotify')} Conectar con Spotify</button>
    </div>
    ${spotifyAlertMarkup()}
    <div class="spotify-footnote">${icon('shield')}<span>Se abrirá la pantalla oficial de Spotify en tu navegador. Si ya tienes sesión, solo tendrás que aceptar el acceso.</span></div>
  </div>`;
}

function spotifyBusyMarkup() {
  return `<div class="spotify-card spotify-card--busy" aria-live="polite">
    <div class="spotify-wait">
      <span class="spinner"></span>
      <span class="spotify-card__copy">
        <strong>Esperando a Spotify</strong>
        <span>Inicia sesión en el navegador y pulsa «Aceptar». Esta ventana se actualizará cuando vuelvas.</span>
      </span>
    </div>
    <div class="spotify-actions">
      <button type="button" class="btn btn--ghost" data-spotify-cancel ${state.spotify.cancelBusy ? 'disabled' : ''}>${state.spotify.cancelBusy ? '<span class="spinner"></span> Cancelando…' : 'Cancelar inicio de sesión'}</button>
    </div>
  </div>`;
}

function spotifyConnectedMarkup() {
  const status = spotifyStatusValue() || {};
  const product = status.product === 'premium' ? 'Premium' : 'Cuenta conectada';
  return `<div class="spotify-account">
    ${spotifyAvatarMarkup(status)}
    <span class="spotify-account__copy">
      <strong>${esc(status.displayName || 'Tu cuenta de Spotify')}</strong>
      <span>${esc(product)} · token guardado solo en este equipo</span>
    </span>
    <span class="spotify-pill is-ok"><span class="status-dot"></span>Conectado</span>
  </div>
  <div class="spotify-actions spotify-actions--account">
    <button type="button" class="link-btn" data-spotify-refresh>${icon('refresh')} Actualizar</button>
    <button type="button" class="link-btn" data-spotify-edit-client>Cambiar Client ID</button>
    <span class="spotify-actions__spacer"></span>
    <button type="button" class="link-btn spotify-danger" data-spotify-logout>${icon('x')} Desconectar</button>
  </div>
  ${spotifyAlertMarkup()}
  <div class="spotify-footnote">${icon('shield')}<span>Davusic solo guarda tokens y metadatos. Al reproducir, streamea el audio con yt-dlp; no descarga tu biblioteca de Spotify.</span></div>`;
}

function renderSpotifySettings() {
  let body;
  if (!IS_TAURI) {
    body = `<div class="spotify-card spotify-card--disabled">
      <div class="spotify-card__head">
        <span class="spotify-mark">${icon('spotify')}</span>
        <span class="spotify-card__copy"><strong>Cuenta de Spotify</strong><span>La conexión oficial y la lectura de playlists están disponibles en la app de escritorio.</span></span>
      </div>
    </div>`;
  } else if (!state.spotify.status) {
    if (state.spotify.loading) {
      body = `<div class="spotify-card spotify-card--loading"><span class="spinner"></span><span>Comprobando tu cuenta de Spotify…</span></div>`;
    } else {
      body = `<div class="spotify-card">
        <div class="spotify-card__head">
          <span class="spotify-mark">${icon('spotify')}</span>
          <span class="spotify-card__copy"><strong>No se pudo leer la cuenta</strong><span>${esc(state.spotify.error || 'La sesión local de Spotify no está disponible.')}</span></span>
        </div>
        <div class="spotify-actions"><button type="button" class="btn btn--soft" data-spotify-refresh>${icon('refresh')} Reintentar</button></div>
      </div>`;
    }
  } else if (state.spotify.authBusy) {
    body = spotifyBusyMarkup();
  } else if (!state.spotify.status.configured || state.spotify.editClient) {
    body = spotifySetupMarkup();
  } else if (!state.spotify.status.connected) {
    body = spotifyConnectMarkup();
  } else {
    body = spotifyConnectedMarkup();
  }
  return `<div class="settings-group">
    <div class="settings-group__title">${icon('spotify')} Cuenta de Spotify</div>
    ${body}
  </div>`;
}

function spotifyPlaylistRow(playlist) {
  const image = /^https:\/\//i.test(String(playlist?.image || '')) ? String(playlist.image) : '';
  const count = Math.max(0, Number(playlist?.trackCount) || 0);
  const tags = [];
  if (playlist.collaborative) tags.push('Colaborativa');
  if (playlist.public) tags.push('Pública');
  const action = `<button type="button" class="btn btn--soft spotify-row__action" data-spotify-import-playlist="${esc(playlist.id)}" data-spotify-playlist-name="${esc(playlist.name)}">${icon('plus')} Traer</button>`;
  return `<div class="spotify-row">
    <span class="spotify-row__art">${image ? `<img src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : icon('queue')}</span>
    <span class="spotify-row__copy">
      <strong>${esc(playlist.name || 'Playlist de Spotify')}</strong>
      <span>${esc(playlist.owner || 'Spotify')} · ${plural(count, 'canción', 'canciones')}${tags.length ? ` · ${esc(tags.join(' · '))}` : ''}</span>
    </span>
    ${action}
  </div>`;
}

function spotifyPublicUrlMarkup(disabled) {
  return `<div class="spotify-public">
    <div class="spotify-public__head">
      <strong>Enlace de Spotify</strong>
      <span>También puedes pegar una playlist pública, o una privada si ya conectaste tu cuenta.</span>
    </div>
    <div class="import-url-row">
      <input class="import-input" id="importUrlInput" data-import-url-input type="url" placeholder="https://open.spotify.com/playlist/…" value="${esc(state.import.urlDraft || '')}" autocomplete="off" spellcheck="false" ${disabled ? 'disabled' : ''}>
      <button type="button" class="btn btn--primary" data-import-url ${disabled ? 'disabled' : ''}>${icon('link')} Importar</button>
    </div>
    <div class="import-note">${icon('shield')} Los enlaces públicos se leen sin cuenta. Si inicias sesión, Davusic usa la API para tus playlists y Me gusta.</div>
  </div>`;
}

function spotifyImportPane(warning, error, tools, disabled) {
  const s = state.spotify;
  const publicUrl = spotifyPublicUrlMarkup(disabled);

  if (!IS_TAURI) {
    return `<div class="import-pane">${warning}${publicUrl}${tools}</div>`;
  }

  if (!s.status) {
    const retry = s.loading
      ? `<div class="spotify-card spotify-card--loading"><span class="spinner"></span><span>Comprobando tu cuenta de Spotify…</span></div>`
      : `<div class="spotify-card">
          <div class="spotify-card__head">
            <span class="spotify-mark">${icon('spotify')}</span>
            <span class="spotify-card__copy"><strong>No se pudo comprobar la cuenta</strong><span>${esc(s.error || 'La sesión local no está disponible.')}</span></span>
          </div>
          <div class="spotify-actions"><button type="button" class="btn btn--soft" data-spotify-refresh>${icon('refresh')} Reintentar</button></div>
        </div>`;
    return `<div class="import-pane">${warning}${error}${retry}${publicUrl}${tools}</div>`;
  }

  if (s.authBusy) {
    return `<div class="import-pane">${warning}${error}${spotifyBusyMarkup()}${tools}</div>`;
  }

  if (!s.status.configured || s.editClient) {
    return `<div class="import-pane">${warning}${error}${spotifySetupMarkup()}${publicUrl}${tools}</div>`;
  }

  if (!s.status.connected) {
    return `<div class="import-pane">${warning}${error}${spotifyConnectMarkup()}${publicUrl}${tools}</div>`;
  }

  const listError = s.playlistsError
    ? `<div class="import-warning spotify-alert">${icon('bell')}<span>${esc(s.playlistsError)}</span></div>`
    : '';
  const rows = (s.playlists || []).map(spotifyPlaylistRow).join('');
  const listBody = rows
    ? `<div class="spotify-list">${rows}</div>`
    : s.playlistsLoading
      ? `<div class="spotify-loading"><span class="spinner"></span><span>Leyendo tus playlists…</span></div>`
      : s.playlistsLoaded
        ? `<div class="import-empty">${icon('queue')}<strong>No hay playlists en esta cuenta</strong><br>Crea una en Spotify o importa Me gusta.</div>`
        : `<div class="spotify-loading"><span class="spinner"></span><span>Preparando tus playlists…</span></div>`;
  const more = s.playlistsNextOffset !== null && s.playlistsNextOffset !== undefined
    ? `<div class="spotify-more-row"><button type="button" class="btn btn--ghost" data-spotify-load-more ${s.playlistsLoading ? 'disabled' : ''}>${s.playlistsLoading ? '<span class="spinner"></span> Cargando…' : `${icon('arrow-down')} Cargar más`}</button><span>${s.playlists.length} de ${s.playlistsTotal || s.playlists.length}</span></div>`
    : '';
  const liked = `<div class="spotify-liked">
    <span class="spotify-mark">${icon('heart')}</span>
    <span class="spotify-card__copy"><strong>Me gusta de Spotify</strong><span>Se creará una playlist local con las canciones que guardaste, listas para streamearlas.</span></span>
    <button type="button" class="btn btn--soft" data-spotify-import-liked>${icon('plus')} Traer</button>
  </div>`;

  return `<div class="import-pane">
    ${warning}${error}
    <div class="spotify-account spotify-account--import">
      ${spotifyAvatarMarkup(s.status)}
      <span class="spotify-account__copy"><strong>${esc(s.status.displayName || 'Tu cuenta de Spotify')}</strong><span>${esc(s.status.product === 'premium' ? 'Premium' : 'Cuenta conectada')} · sesión oficial</span></span>
      <span class="spotify-account__actions">
        <button type="button" class="link-btn" data-spotify-refresh>${icon('refresh')} Actualizar</button>
        <button type="button" class="link-btn spotify-danger" data-spotify-logout>${icon('x')} Desconectar</button>
      </span>
    </div>
    ${spotifyAlertMarkup()}
    <div class="import-actions" style="margin-bottom:8px">
      <button type="button" class="btn btn--primary" data-spotify-import-all ${s.importBusy ? 'disabled' : ''}>${icon('download')} Importar todas</button>
      <span class="import-actions__spacer"></span>
      <span class="dim" style="font-size:9px">Como Exportify: Me gusta y todas las playlists, guardadas como referencia.</span>
    </div>
    ${liked}
    <div class="spotify-section">
      <div class="spotify-section__head">
        <span class="spotify-section__title"><strong>Tus playlists</strong><span>${s.playlistsLoaded ? `${s.playlists.length} de ${s.playlistsTotal || s.playlists.length}` : 'Cargando desde Spotify'}</span></span>
        <button type="button" class="link-btn" data-spotify-refresh ${s.playlistsLoading ? 'disabled' : ''}>${icon('refresh')} Actualizar</button>
      </div>
      ${listError}
      ${listBody}
      ${more}
      <div class="spotify-follow-note">${icon('shield')} Lee playlists propias, colaborativas y las que sigues, con la API oficial. Algunas listas editoriales de Spotify pueden venir vacías.</div>
    </div>
    ${publicUrl}
    ${tools}
  </div>`;
}

function ensureSpotifyStatus() {
  if (!IS_TAURI || state.spotify.status || state.spotify.loading) return;
  refreshSpotifyStatus({ quiet: true });
}

function ensureSpotifyImport() {
  if (!IS_TAURI) return;
  if (!state.spotify.status) {
    refreshSpotifyStatus({ quiet: true });
    return;
  }
  maybeLoadSpotifyPlaylists();
}

function isSpotifyImportOpen() {
  return Boolean(els.importModal && !els.importModal.hidden && state.import.step === 'source' && state.import.tab === 'spotify');
}

function refreshSpotifyViews() {
  if (els.settingsSheet && !els.settingsSheet.hidden) {
    const scroll = els.settingsBody?.scrollTop || 0;
    renderSettings();
    if (els.settingsBody) els.settingsBody.scrollTop = scroll;
  }
  if (isSpotifyImportOpen()) rerenderImportPreserveScroll();
}

function resetSpotifyPlaylists() {
  const s = state.spotify;
  s.playlists = [];
  s.playlistsLoading = false;
  s.playlistsError = '';
  s.playlistsOffset = 0;
  s.playlistsNextOffset = null;
  s.playlistsTotal = 0;
  s.playlistsLoaded = false;
}

function applySpotifyStatus(status) {
  if (!status) return;
  const s = state.spotify;
  s.status = status;
  if (!status.configured) {
    s.clientIdDraft = '';
    s.editClient = false;
  } else if (!s.editClient) {
    s.clientIdDraft = status.clientId || s.clientIdDraft || '';
  }
  if (!status.connected) resetSpotifyPlaylists();
}

async function refreshSpotifyStatus({ quiet = false } = {}) {
  if (!IS_TAURI) return null;
  if (state.spotify.loading) return state.spotify.status;
  state.spotify.loading = true;
  if (!quiet) refreshSpotifyViews();
  let status = null;
  try {
    status = await inv('spotify_status');
    applySpotifyStatus(status);
    state.spotify.error = '';
  } catch (error) {
    state.spotify.error = `No se pudo consultar la cuenta de Spotify. ${spotifyErrorText(error)}`;
    if (!quiet) toast(esc(state.spotify.error), 'bell', 5200);
  } finally {
    state.spotify.loading = false;
    refreshSpotifyViews();
    maybeLoadSpotifyPlaylists();
  }
  return status;
}

function maybeLoadSpotifyPlaylists() {
  if (!IS_TAURI || !isSpotifyImportOpen()) return;
  if (!state.spotify.status?.connected) return;
  if (state.spotify.playlistsLoaded || state.spotify.playlistsLoading) return;
  loadSpotifyPlaylists(true);
}

async function loadSpotifyPlaylists(reset = false) {
  if (!IS_TAURI || !state.spotify.status?.connected) return;
  const s = state.spotify;
  if (s.playlistsLoading) return;
  if (!reset && (s.playlistsLoaded || s.playlistsNextOffset === null || s.playlistsNextOffset === undefined)) return;

  const offset = reset ? 0 : Math.max(0, Number(s.playlistsNextOffset) || 0);
  if (reset) {
    s.playlists = [];
    s.playlistsTotal = 0;
    s.playlistsNextOffset = null;
    s.playlistsLoaded = false;
    s.playlistsError = '';
  }
  s.playlistsLoading = true;
  refreshSpotifyViews();
  try {
    const page = await inv('spotify_playlists', { offset });
    const items = Array.isArray(page?.items) ? page.items : [];
    if (reset) {
      s.playlists = items;
    } else {
      const seen = new Set(s.playlists.map((playlist) => playlist.id));
      s.playlists = s.playlists.concat(items.filter((playlist) => playlist && !seen.has(playlist.id)));
    }
    s.playlistsTotal = Math.max(0, Number(page?.total) || s.playlists.length);
    const next = page?.nextOffset;
    s.playlistsNextOffset = next === null || next === undefined ? null : Number(next);
    if (!Number.isFinite(s.playlistsNextOffset)) s.playlistsNextOffset = null;
    s.playlistsOffset = s.playlistsNextOffset ?? s.playlists.length;
    s.playlistsLoaded = true;
    s.playlistsError = '';
  } catch (error) {
    s.playlistsError = spotifyErrorText(error);
    toast(`No se pudieron leer tus playlists. ${esc(s.playlistsError)}`, 'bell', 5600);
  } finally {
    s.playlistsLoading = false;
    refreshSpotifyViews();
  }
}

function spotifyClientIdField() {
  const scopes = [];
  if (els.settingsSheet && !els.settingsSheet.hidden) scopes.push(els.settingsBody);
  if (els.importModal && !els.importModal.hidden) scopes.push(els.importBody);
  for (const scope of scopes) {
    const field = scope ? qs('[data-spotify-client-id]', scope) : null;
    if (field) return field;
  }
  return qs('[data-spotify-client-id]', document);
}

async function saveSpotifyClientId() {
  if (!IS_TAURI) {
    toast('Configurar Spotify está disponible en la app de escritorio.', 'spotify');
    return;
  }
  const s = state.spotify;
  const field = spotifyClientIdField();
  const clientId = String(field?.value ?? s.clientIdDraft ?? '').trim();
  s.clientIdDraft = clientId;
  s.error = '';
  s.notice = '';
  if (!clientId) {
    s.error = 'Pega el Client ID de tu app de Spotify.';
    refreshSpotifyViews();
    return;
  }
  try {
    const status = await inv('spotify_save_client_id', { clientId });
    applySpotifyStatus(status);
    s.editClient = false;
    if (!status.connected) resetSpotifyPlaylists();
    s.notice = status.connected
      ? 'Client ID actualizado. Tu sesión de Spotify sigue activa.'
      : 'Client ID guardado. Ahora conecta tu cuenta.';
    toast('Client ID de Spotify guardado.', 'check', 3600);
  } catch (error) {
    s.error = `No se pudo guardar el Client ID. ${spotifyErrorText(error)}`;
    toast(esc(s.error), 'bell', 5600);
  } finally {
    refreshSpotifyViews();
  }
}

async function connectSpotify() {
  if (!IS_TAURI) {
    toast('Conectar Spotify está disponible en la app de escritorio.', 'spotify');
    return;
  }
  const s = state.spotify;
  if (s.authBusy) return;
  if (!s.status?.configured) {
    s.error = 'Configura primero el Client ID de tu app de Spotify.';
    refreshSpotifyViews();
    return;
  }
  s.authBusy = true;
  s.cancelBusy = false;
  s.error = '';
  s.notice = '';
  s.importProgress = { done: 0, total: 0 };
  refreshSpotifyViews();
  try {
    const status = await inv('spotify_login');
    applySpotifyStatus(status);
    resetSpotifyPlaylists();
    s.notice = `Conectado como ${status.displayName || 'tu cuenta de Spotify'}.`;
    toast(`Spotify conectado${status.displayName ? ` como <strong>${esc(status.displayName)}</strong>` : ''}.`, 'check', 4800);
  } catch (error) {
    const message = spotifyErrorText(error);
    if (/cancelad/i.test(message)) {
      s.notice = 'Inicio de sesión de Spotify cancelado.';
    } else {
      s.error = `No se pudo conectar Spotify. ${message}`;
      toast(esc(s.error), 'bell', 6200);
    }
  } finally {
    s.authBusy = false;
    s.cancelBusy = false;
    refreshSpotifyViews();
    maybeLoadSpotifyPlaylists();
  }
}

async function cancelSpotifyLogin() {
  if (!IS_TAURI || !state.spotify.authBusy || state.spotify.cancelBusy) return;
  state.spotify.cancelBusy = true;
  refreshSpotifyViews();
  try {
    await inv('spotify_login_cancel');
  } catch (error) {
    state.spotify.cancelBusy = false;
    state.spotify.error = `No se pudo cancelar el inicio de sesión. ${spotifyErrorText(error)}`;
    refreshSpotifyViews();
  }
}

async function disconnectSpotify() {
  if (!IS_TAURI || !state.spotify.status?.connected) return;
  if (!window.confirm('¿Desconectar tu cuenta de Spotify de Davusic? Se borrará el token local; las playlists que ya importaste se quedan en este equipo.')) return;
  const s = state.spotify;
  s.error = '';
  s.notice = '';
  try {
    const status = await inv('spotify_logout');
    applySpotifyStatus(status);
    resetSpotifyPlaylists();
    s.notice = 'Cuenta de Spotify desconectada. El token local se ha borrado.';
    toast('Cuenta de Spotify desconectada.', 'check', 3800);
  } catch (error) {
    s.error = `No se pudo desconectar Spotify. ${spotifyErrorText(error)}`;
    toast(esc(s.error), 'bell', 5600);
  } finally {
    refreshSpotifyViews();
  }
}

async function refreshSpotifyAccount() {
  state.spotify.error = '';
  const status = await refreshSpotifyStatus({ quiet: false });
  if (isSpotifyImportOpen() && status?.connected) await loadSpotifyPlaylists(true);
}

async function importSpotifyPlaylist(playlistId, playlistName = '') {
  if (!IS_TAURI) {
    toast('Importar desde Spotify está disponible en la app de escritorio.', 'spotify');
    return;
  }
  const s = state.spotify;
  if (!playlistId || s.importBusy) return;
  s.importBusy = `playlist:${playlistId}`;
  s.importProgress = { done: 0, total: 0 };
  s.error = '';
  state.import.loading = true;
  state.import.loadingMessage = playlistName ? `Leyendo «${playlistName}» de Spotify…` : 'Leyendo la playlist de Spotify…';
  state.import.error = '';
  state.import.step = 'source';
  state.import.tab = 'spotify';
  renderImport();
  try {
    const bundle = await inv('spotify_import_playlist', { playlistId });
    handleImportBundle(bundle);
  } catch (error) {
    const message = spotifyErrorText(error);
    state.import.loading = false;
    state.import.error = `No se pudo leer la playlist de Spotify. ${message}`;
    toast(`No se pudo importar la playlist. ${esc(message)}`, 'bell', 6200);
  } finally {
    s.importBusy = '';
    s.importProgress = { done: 0, total: 0 };
    if (!state.import.loading) renderImport();
  }
}

async function importSpotifyLibrary() {
  if (!IS_TAURI) {
    toast('Importar desde Spotify está disponible en la app de escritorio.', 'spotify');
    return;
  }
  const s = state.spotify;
  if (s.importBusy) return;
  s.importBusy = 'library';
  s.importProgress = { done: 0, total: 0 };
  s.error = '';
  state.import.loading = true;
  state.import.loadingMessage = 'Leyendo todas tus playlists de Spotify, como Exportify…';
  state.import.error = '';
  state.import.step = 'source';
  state.import.tab = 'spotify';
  renderImport();
  try {
    const bundle = await inv('spotify_import_library');
    handleImportBundle(bundle);
  } catch (error) {
    const message = spotifyErrorText(error);
    state.import.loading = false;
    state.import.error = `No se pudieron leer las playlists de Spotify. ${message}`;
    toast(`No se pudo importar la biblioteca de Spotify. ${esc(message)}`, 'bell', 6200);
  } finally {
    s.importBusy = '';
    s.importProgress = { done: 0, total: 0 };
    if (!state.import.loading) renderImport();
  }
}

async function importSpotifySaved() {
  if (!IS_TAURI) {
    toast('Importar Me gusta de Spotify está disponible en la app de escritorio.', 'spotify');
    return;
  }
  const s = state.spotify;
  if (s.importBusy) return;
  s.importBusy = 'saved';
  s.importProgress = { done: 0, total: 0 };
  s.error = '';
  state.import.loading = true;
  state.import.loadingMessage = 'Leyendo tus Me gusta de Spotify…';
  state.import.error = '';
  state.import.step = 'source';
  state.import.tab = 'spotify';
  renderImport();
  try {
    const bundle = await inv('spotify_import_saved');
    handleImportBundle(bundle);
  } catch (error) {
    const message = spotifyErrorText(error);
    state.import.loading = false;
    state.import.error = `No se pudieron leer tus Me gusta de Spotify. ${message}`;
    toast(`No se pudo importar Me gusta. ${esc(message)}`, 'bell', 6200);
  } finally {
    s.importBusy = '';
    s.importProgress = { done: 0, total: 0 };
    if (!state.import.loading) renderImport();
  }
}

function handleSpotifyImportProgress(payload) {
  const s = state.spotify;
  if (!s.importBusy) return;
  const done = Math.max(0, Number(payload?.done) || 0);
  const total = Math.max(0, Number(payload?.total) || 0);
  s.importProgress = { done, total };
  if (!state.import.loading) return;
  const name = payload?.name ? ` «${payload.name}»` : '';
  const label = total ? `Leyendo Spotify${name}… ${Math.min(done, total)} de ${total}` : `Leyendo Spotify${name}…`;
  state.import.loadingMessage = label;
  const holder = els.importBody ? qs('.import-progress strong', els.importBody) : null;
  if (holder) holder.textContent = label;
}

function handleSpotifyInput(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.matches('[data-spotify-client-id]')) {
    state.spotify.clientIdDraft = target.value;
    state.spotify.error = '';
  }
}

function handleSpotifyKeydown(event) {
  const target = event.target;
  if (!(target instanceof Element) || !target.matches('[data-spotify-client-id]')) return;
  if (event.key !== 'Enter') return;
  event.preventDefault();
  event.stopPropagation();
  saveSpotifyClientId();
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch (_) {
    return false;
  }
}

async function copySpotifyRedirect() {
  const ok = await copyTextToClipboard(spotifyRedirectUri());
  if (ok) toast('Redirect URI copiado. Pégalo exactamente en Spotify Developer.', 'check', 4000);
  else toast('No se pudo copiar. Selecciona el Redirect URI manualmente.', 'bell', 4200);
}

async function openExternalUrl(url) {
  const target = String(url || '').trim();
  if (!target) return;
  if (IS_TAURI) {
    try {
      await inv('open_external', { url: target });
    } catch (error) {
      toast(`No se pudo abrir el enlace. ${esc(spotifyErrorText(error))}`, 'bell', 5000);
    }
  } else {
    window.open(target, '_blank', 'noopener');
  }
}

function handleSpotifyAction(target) {
  if (target.closest('[data-spotify-open-dashboard]')) {
    openExternalUrl('https://developer.spotify.com/dashboard');
    return true;
  }
  if (target.closest('[data-spotify-copy-redirect]')) {
    copySpotifyRedirect();
    return true;
  }
  if (target.closest('[data-spotify-save-client]')) {
    saveSpotifyClientId();
    return true;
  }
  if (target.closest('[data-spotify-connect]')) {
    connectSpotify();
    return true;
  }
  if (target.closest('[data-spotify-cancel]')) {
    cancelSpotifyLogin();
    return true;
  }
  if (target.closest('[data-spotify-logout]')) {
    disconnectSpotify();
    return true;
  }
  if (target.closest('[data-spotify-refresh]')) {
    refreshSpotifyAccount();
    return true;
  }
  if (target.closest('[data-spotify-edit-client]')) {
    const s = state.spotify;
    s.editClient = !s.editClient;
    s.clientIdDraft = s.editClient ? (s.status?.clientId || s.clientIdDraft || '') : (s.status?.clientId || '');
    s.error = '';
    s.notice = '';
    refreshSpotifyViews();
    return true;
  }
  const playlistButton = target.closest('[data-spotify-import-playlist]');
  if (playlistButton) {
    importSpotifyPlaylist(
      playlistButton.dataset.spotifyImportPlaylist,
      playlistButton.dataset.spotifyPlaylistName || '',
    );
    return true;
  }
  if (target.closest('[data-spotify-import-liked]')) {
    importSpotifySaved();
    return true;
  }
  if (target.closest('[data-spotify-import-all]')) {
    importSpotifyLibrary();
    return true;
  }
  if (target.closest('[data-spotify-load-more]')) {
    loadSpotifyPlaylists(false);
    return true;
  }
  return false;
}

/* ---------- importación de playlists ---------- */

function importOriginLabel(origin) {
  const value = String(origin || '').toLowerCase();
  if (value.includes('exportify')) return 'Exportify';
  if (value.includes('spotify')) return 'Spotify';
  if (value.includes('youtube')) return 'YouTube Music';
  if (value.includes('zip')) return 'ZIP';
  if (value.includes('m3u')) return 'M3U';
  if (value.includes('csv')) return 'CSV';
  if (value.includes('json')) return 'JSON';
  if (value.includes('text')) return 'Texto pegado';
  return origin ? String(origin) : 'Archivo local';
}

function selectedImportPlaylists() {
  const bundle = state.import.bundle;
  if (!bundle || !Array.isArray(bundle.playlists)) return [];
  return bundle.playlists.filter((playlist) => state.import.selectedPlaylists.includes(playlist.id));
}

function openImportModal(tab = 'library') {
  if (!els.importModal) return;
  closeMenus();
  closeSheets();
  closePlaylistModal();
  forceCloseImmersive();
  if (state.import.step === 'source' && tab) state.import.tab = tab;
  els.importModal.hidden = false;
  state.import.error = '';
  renderImport();
  window.setTimeout(() => qs('[data-close-import]', els.importModal)?.focus(), 30);
  if (IS_TAURI) {
    refreshYtdlpTools(false);
    if (state.import.tab === 'spotify') ensureSpotifyImport();
  }
}

function closeImportModal(force = false) {
  if (!els.importModal || els.importModal.hidden) return;
  if (!force && (state.import.matching || state.import.downloading)) {
    if (!window.confirm('Hay una importación en curso. ¿Cerrar la ventana de todos modos?')) return;
  }
  els.importModal.hidden = true;
}

function resetImportFlow() {
  if (state.import.matching || state.import.downloading) return;
  const tools = state.import.tools;
  state.import = newImportState();
  state.import.tools = tools;
  state.import.error = '';
  renderImport();
  if (IS_TAURI) refreshYtdlpTools(false);
}

function switchImportTab(tab) {
  if (!['library', 'file', 'exportify', 'spotify', 'youtube', 'text'].includes(tab)) return;
  if (state.import.matching || state.import.downloading) return;
  state.import.tab = tab;
  state.import.step = 'source';
  state.import.error = '';
  renderImport();
  if (tab === 'spotify') ensureSpotifyImport();
  const target = tab === 'text' ? '#importTextInput'
    : tab === 'file' ? '[data-import-file]'
    : tab === 'exportify' ? '[data-exportify-file]'
    : tab === 'library' ? '[data-import-source="folder"]'
    : tab === 'spotify' ? '[data-spotify-client-id], #importUrlInput'
    : '#importUrlInput';
  window.setTimeout(() => qs(target, els.importBody)?.focus(), 30);
}

function importToolsInner() {
  if (!IS_TAURI) {
    return `<span class="import-tools__item">${icon('shield')} El streaming en línea está en la app de escritorio.</span>`;
  }
  if (state.import.installing) {
    return `<span class="import-tools__item is-work"><span class="spinner"></span> Instalando yt-dlp… puede tardar un poco</span>`;
  }
  if (state.import.toolsLoading) {
    return `<span class="import-tools__item"><span class="spinner"></span> Comprobando yt-dlp y ffmpeg…</span>`;
  }
  const tools = state.import.tools;
  if (!tools) {
    return `<span class="import-tools__item">${icon('clock')} Herramientas sin comprobar.</span><span class="import-tools__spacer"></span><button class="btn btn--ghost" data-install-ytdlp>${icon('download')} Instalar yt-dlp</button>`;
  }
  const yt = tools.ytdlp
    ? `<span class="import-tools__item is-ok">${icon('check')} yt-dlp</span>`
    : `<span class="import-tools__item is-bad">${icon('x')} yt-dlp no instalado</span>`;
  const ff = tools.ffmpeg
    ? `<span class="import-tools__item is-ok">${icon('check')} ffmpeg</span>`
    : `<span class="import-tools__item is-bad">${icon('x')} ffmpeg no disponible</span>`;
  const install = !tools.ytdlp && tools.can_install
    ? `<button class="btn btn--ghost" data-install-ytdlp>${icon('download')} Instalar yt-dlp</button>`
    : '';
  return `${yt}${ff}<span class="import-tools__spacer"></span>${install}`;
}

function renderImportTools() {
  return `<div class="import-tools" id="importTools">${importToolsInner()}</div>`;
}

function updateImportToolsDom() {
  const holder = qs('#importTools');
  if (holder) holder.innerHTML = importToolsInner();
}

async function refreshYtdlpTools(force = false) {
  if (!IS_TAURI) return state.import.tools;
  if (state.import.tools && !force) return state.import.tools;
  if (ytdlpToolsPromise && !force) return ytdlpToolsPromise;
  state.import.toolsLoading = true;
  updateImportToolsDom();
  ytdlpToolsPromise = (async () => {
    try {
      state.import.tools = await inv('youtube_tools_status');
    } catch (error) {
      state.import.tools = {
        ytdlp: false, ytdlp_path: '', ffmpeg: false, ffmpeg_path: '',
        download_dir: '', can_install: false,
        message: `No se pudo comprobar yt-dlp: ${error?.message || error || ''}`,
      };
    } finally {
      state.import.toolsLoading = false;
      ytdlpToolsPromise = null;
      updateImportToolsDom();
      if ((state.import.step === 'review' || state.import.step === 'matches') && !state.import.matching && !state.import.downloading) {
        renderImport();
      }
    }
    return state.import.tools;
  })();
  return ytdlpToolsPromise;
}

async function installYtdlp() {
  if (!IS_TAURI) {
    toast('La instalación de yt-dlp está disponible en la app de escritorio.', 'download');
    return;
  }
  if (state.import.installing) return;
  state.import.installing = true;
  updateImportToolsDom();
  toast('Descargando yt-dlp en tu carpeta local de herramientas. Sin permisos de administrador.', 'download', 5000);
  try {
    state.import.tools = await inv('install_ytdlp');
    if (state.import.tools?.ytdlp) toast('yt-dlp listo. Ya puedes buscar en línea y streamear canciones.', 'check', 4200);
    else toast(esc(state.import.tools?.message || 'yt-dlp no quedó disponible.'), 'bell', 5000);
  } catch (error) {
    toast(`No se pudo instalar yt-dlp. ${esc(error?.message || error || '')}`, 'bell', 6000);
  } finally {
    state.import.installing = false;
    updateImportToolsDom();
    if (state.import.step === 'review' || state.import.step === 'matches') renderImport();
  }
}

function importProgressPayload(stage, label, done, total, extra = {}) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeDone = Math.max(0, Number(done) || 0);
  return {
    stage,
    label: String(label || ''),
    done: safeDone,
    total: safeTotal,
    percent: safeTotal ? clamp((safeDone / safeTotal) * 100, 0, 100) : 0,
    ...extra,
  };
}

function renderImportProgressBlock() {
  const progress = state.import.progress;
  const label = progress.label || (state.import.matching ? 'Buscando coincidencias…' : 'Preparando la descarga…');
  return `<div class="import-progress">
    <div class="import-progress__top">
      <span class="spinner"></span>
      <strong id="importProgressText">${esc(label)}</strong>
      <span id="importProgressCount">${progress.total ? `${progress.done} / ${progress.total}` : ''}</span>
    </div>
    <div class="import-progress__bar"><span id="importProgressBar" style="width:${clamp(Number(progress.percent) || 0, 0, 100)}%"></span></div>
  </div>`;
}

function updateImportProgressDom() {
  const progress = state.import.progress;
  const bar = qs('#importProgressBar');
  const label = qs('#importProgressText');
  const count = qs('#importProgressCount');
  if (bar) bar.style.width = `${clamp(Number(progress.percent) || 0, 0, 100)}%`;
  if (label) label.textContent = progress.label || (state.import.matching ? 'Buscando coincidencias…' : 'Preparando la descarga…');
  if (count) count.textContent = progress.total ? `${progress.done} / ${progress.total}` : '';
}

function updateImportToolsAndBody() {
  updateImportToolsDom();
}

function renderImport() {
  if (!els.importBody || !els.importModal) return;
  if (els.importTabs) {
    els.importTabs.hidden = state.import.step !== 'source';
    qsa('[data-import-tab]', els.importTabs).forEach((button) => {
      const active = button.dataset.importTab === state.import.tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }
  els.importModal.setAttribute('aria-busy', state.import.matching || state.import.downloading ? 'true' : 'false');
  const step = state.import.step;
  let html = '';
  if (step === 'source') html = renderImportSource();
  else if (step === 'review') html = renderImportReview();
  else if (step === 'matches') html = renderImportMatches();
  else if (step === 'downloading') html = renderImportDownloading();
  else if (step === 'done') html = renderImportDone();
  else html = renderImportSource();
  els.importBody.innerHTML = html;
}

function renderImportSource() {
  const disabled = !IS_TAURI;
  const warning = disabled ? `<div class="import-warning">${icon('shield')}<span>Estás en la vista de navegador. La importación real de carpetas, ZIP, Spotify, YouTube y el streaming funcionan en la app de escritorio.</span></div>` : '';
  const tools = `<div class="import-note">${icon('shield')} Davusic guarda referencias y streamea el audio en este equipo. Usa solo música que tengas derecho a reproducir.</div>${renderImportTools()}`;

  if (state.import.loading) {
    return `<div class="import-pane">
      ${warning}
      <div class="import-progress"><div class="import-progress__top"><span class="spinner"></span><strong>${esc(state.import.loadingMessage || 'Leyendo la playlist…')}</strong></div></div>
      ${tools}
    </div>`;
  }

  const error = state.import.error ? `<div class="import-warning">${icon('bell')}<span>${esc(state.import.error)}</span></div>` : '';

  if (state.import.tab === 'library') {
    return `<div class="import-pane">
      ${warning}${error}
      <p class="import-pane__lede">Añade una carpeta con archivos de audio. Davusic lee etiquetas, carátulas y duración, pero no mueve ni copia tus archivos originales.</p>
      <button class="import-source" data-import-source="folder" ${disabled ? 'disabled' : ''}>
        <span class="import-source__icon">${icon('folder-plus')}</span>
        <span class="import-source__copy"><strong>Añadir carpeta de música</strong><span>MP3, FLAC, OGG, Opus, M4A, WAV y más. Se puede repetir cuando quieras.</span></span>
      </button>
      <div class="import-note">${icon('sparkle')} ¿Tienes una playlist? Usa <button class="link-btn" data-import-tab="file">Archivo / ZIP</button>, <button class="link-btn" data-import-tab="exportify">Exportify</button>, <button class="link-btn" data-import-tab="spotify">Spotify</button> o <button class="link-btn" data-import-tab="youtube">YouTube Music</button>.</div>
      <div class="import-note">${icon('shield')} ${plural(state.local.tracks.length, 'pista local', 'pistas locales')} en ${plural(state.local.folders?.length || 0, 'carpeta', 'carpetas')}. Nada sale de tu equipo.</div>
    </div>`;
  }

  if (state.import.tab === 'file') {
    return `<div class="import-pane">
      ${warning}${error}
      <p class="import-pane__lede">Importa un ZIP de Exportify o Google Takeout, o un archivo CSV, JSON, M3U o TXT. Davusic guarda las playlists como referencia para streamearlas, sin descargar las canciones.</p>
      <div class="import-drop">
        <span class="import-drop__icon">${icon('file')}</span>
        <span class="import-drop__copy"><strong>Selecciona un archivo de playlist</strong><span>ZIP, CSV, TSV, JSON, M3U, M3U8 o TXT · también puedes arrastrarlo sobre la ventana</span></span>
        <button class="btn btn--primary" data-import-file ${disabled ? 'disabled' : ''}>${icon('folder')} Elegir archivo</button>
      </div>
      <div class="import-note">${icon('sparkle')} Si vienes de Exportify, el ZIP contiene las playlists. Si vienes de Google Takeout, Davusic reconoce los CSV de YouTube Music y puede streamear los vídeos directamente.</div>
      ${tools}
    </div>`;
  }

  if (state.import.tab === 'exportify') {
    const exportable = exportifyLibraryPayload();
    const totalTracks = exportable.reduce((sum, playlist) => sum + playlist.tracks.length, 0);
    return `<div class="import-pane">
      ${warning}${error}
      <p class="import-pane__lede">Exportify extrae tus playlists de Spotify a CSV o ZIP. Davusic lee esos archivos de forma nativa y, si quieres, también puede exportar tu biblioteca local en el mismo formato.</p>
      <div class="import-source-grid">
        <button class="import-source" data-exportify-open>
          <span class="import-source__icon">${icon('globe')}</span>
          <span class="import-source__copy"><strong>Abrir exportify.net</strong><span>La web oficial. Inicia sesión con Spotify y descarga tus playlists.</span></span>
        </button>
        <button class="import-source" data-exportify-file ${disabled ? 'disabled' : ''}>
          <span class="import-source__icon">${icon('file')}</span>
          <span class="import-source__copy"><strong>Importar CSV o ZIP</strong><span>Selecciona lo que hayas descargado. Se lee en tu equipo.</span></span>
        </button>
      </div>
      <div class="import-note">${icon('sparkle')} En Exportify: <strong>Get Started</strong> → elige playlists → <strong>Export</strong>. Si descargas un ZIP, Davusic lo separa por playlist automáticamente.</div>
      <div class="import-callout">
        <div class="import-callout__copy">
          <strong>Exportar desde Davusic</strong>
          <span>${exportable.length ? `${plural(exportable.length, 'playlist', 'playlists')} · ${plural(totalTracks, 'canción', 'canciones')} listas para llevar.` : 'Aún no tienes playlists propias para exportar.'}</span>
        </div>
        <button class="btn btn--soft" data-exportify-export ${disabled || !exportable.length ? 'disabled' : ''}>${icon('download')} Exportar ZIP compatible</button>
      </div>
      <div class="import-note">${icon('shield')} Davusic no comparte cookies ni la sesión de tu navegador. Exportify es un proyecto independiente; se abre en tu navegador.</div>
      ${tools}
    </div>`;
  }

  if (state.import.tab === 'spotify') {
    return spotifyImportPane(warning, error, tools, disabled);
  }

  if (state.import.tab === 'youtube') {
    return `<div class="import-pane">
      ${warning}${error}
      <p class="import-pane__lede">Pega un enlace de YouTube Music o YouTube. Davusic leerá la lista y guardará cada pista para streamearla desde este equipo.</p>
      <div class="import-url-row">
        <input class="import-input" id="importUrlInput" data-import-url-input type="url" placeholder="https://music.youtube.com/playlist?list=…" value="${esc(state.import.urlDraft || '')}" autocomplete="off" spellcheck="false" ${disabled ? 'disabled' : ''}>
        <button class="btn btn--primary" data-import-url ${disabled ? 'disabled' : ''}>${icon('youtube')} Importar</button>
      </div>
      <div class="import-note">${icon('youtube')} No se descarga la biblioteca. Al reproducir, yt-dlp abre el audio en streaming. Puedes instalarlo desde aquí si hace falta.</div>
      ${tools}
    </div>`;
  }

  return `<div class="import-pane">
    ${warning}${error}
    <p class="import-pane__lede">Pega una lista con una canción por línea, por ejemplo <strong>Artista - Título</strong> o <strong>Título · Artista</strong>. También acepta líneas con «1. » o comentarios con #.</p>
    <textarea class="import-textarea" id="importTextInput" data-import-text-input placeholder="Artista - Canción&#10;Otra canción · Otro artista&#10;…" spellcheck="false" ${disabled ? 'disabled' : ''}>${esc(state.import.textDraft || '')}</textarea>
    <div class="import-actions">
      <span class="import-actions__spacer"></span>
      <button class="btn btn--primary" data-import-text ${disabled ? 'disabled' : ''}>${icon('list')} Leer lista</button>
    </div>
    ${tools}
  </div>`;
}

function importBundleTracks(playlists) {
  const items = [];
  playlists.forEach((playlist) => {
    (playlist.tracks || []).forEach((track) => {
      if (!track || !track.title) return;
      items.push({
        key: String(track.id || `${playlist.id}:${items.length}`),
        track: {
          id: String(track.id || `${playlist.id}:${items.length}`),
          title: String(track.title || ''),
          artist: String(track.artist || ''),
          album: String(track.album || ''),
          duration: Number(track.duration) || 0,
          uri: String(track.uri || ''),
        },
        playlist: playlist.name,
        playlistId: playlist.id,
        progressBest: null,
        matchDone: false,
      });
    });
  });
  return items;
}

function renderImportReview() {
  const bundle = state.import.bundle;
  if (!bundle) return renderImportSource();
  const playlists = bundle.playlists || [];
  const selected = selectedImportPlaylists();
  const total = selected.reduce((sum, playlist) => sum + (playlist.tracks || []).length, 0);
  const cover = bundle.cover || '';
  const warnings = Array.isArray(bundle.warnings) && bundle.warnings.length
    ? `<div class="import-warning">${icon('bell')}<span>${bundle.warnings.slice(0, 4).map(esc).join('<br>')}</span></div>`
    : '';
  const error = state.import.error ? `<div class="import-warning">${icon('bell')}<span>${esc(state.import.error)}</span></div>` : '';
  return `<div class="import-pane">
    <div class="import-bundle-head">
      ${cover ? `<img class="import-bundle-head__cover" src="${esc(cover)}" alt="">` : `<span class="import-source__icon">${icon('file')}</span>`}
      <span class="import-bundle-head__copy"><strong>${esc(importOriginLabel(bundle.origin))} · ${plural(playlists.length, 'playlist', 'playlists')}</strong><span>${plural(playlists.reduce((sum, playlist) => sum + (playlist.tracks || []).length, 0), 'pista', 'pistas')} leídas · se guardan como referencia para streamearlas</span></span>
      <button class="link-btn" data-import-new>Empezar de nuevo</button>
    </div>
    ${warnings}${error}
    <div class="import-playlist-pick">
      ${playlists.map((playlist) => `<label class="import-playlist-option">
        <input type="checkbox" data-import-playlist="${esc(playlist.id)}" ${selected.some((item) => item.id === playlist.id) ? 'checked' : ''}>
        <span class="import-playlist-option__copy"><strong>${esc(playlist.name)}</strong><span>${esc(playlist.description || (playlist.source ? `Origen: ${importOriginLabel(playlist.source)}` : 'Lista importada'))}</span></span>
        <span class="import-playlist-option__count">${plural((playlist.tracks || []).length, 'pista', 'pistas')}</span>
      </label>`).join('')}
    </div>
    <div class="import-actions">
      <button class="link-btn" data-import-toggle-playlists>${selected.length === playlists.length ? 'Quitar todas' : 'Seleccionar todas'}</button>
      <span class="import-actions__spacer"></span>
      <button class="btn btn--ghost" data-import-new>Cancelar</button>
      <button class="btn btn--soft" data-import-match ${total ? '' : 'disabled'}>${icon('search')} Buscar coincidencias</button>
      <button class="btn btn--primary" data-import-save ${total ? '' : 'disabled'}>${icon('plus')} Añadir a la biblioteca${total ? ` (${total})` : ''}</button>
    </div>
    ${renderImportTools()}
    <div class="import-note">${icon('sparkle')} No se descargan archivos. Davusic guarda título, artista y enlace para reproducirlas en streaming, como en Spotify. Buscar coincidencias es opcional y deja el enlace de YouTube listo para un arranque más rápido.</div>
  </div>`;
}

function matchForItem(item, matches = state.import.matches) {
  return (matches || []).find((match) => match.track_id === item.key) || null;
}

function selectedImportCount() {
  return state.import.items.reduce((sum, item) => sum + (state.import.selection[item.key] ? 1 : 0), 0);
}

function renderImportMatchRow(item, index, matching) {
  const match = matchForItem(item);
  const candidates = match?.candidates || [];
  const chosen = state.import.selection[item.key] || '';
  const best = match?.best || null;
  const error = match?.error || '';
  const rowClass = chosen ? 'is-selected' : '';
  let status = '';
  if (matching) {
    status = item.matchDone
      ? `<span class="import-match-status ${item.progressBest ? 'is-work' : 'is-bad'}">${item.progressBest ? icon('check') + ' Posible' : 'Sin resultado'}</span>`
      : `<span class="import-match-status is-work"><span class="spinner"></span> Buscando</span>`;
  } else if (chosen) {
    status = `<span class="import-match-status is-ok">${icon('check')} Lista</span>`;
  } else if (candidates.length) {
    status = `<span class="import-match-status">${icon('sliders')} Elegir</span>`;
  } else {
    status = `<span class="import-match-status is-bad" title="${esc(error)}">${icon('x')} Sin resultado</span>`;
  }
  return `<div class="import-match-row ${rowClass} ${!candidates.length && !matching ? 'is-missing' : ''}" data-import-match-row="${esc(item.key)}">
    <span class="import-match-row__num">${index + 1}</span>
    <span class="import-match-row__copy"><strong>${esc(item.track.title)}</strong><span>${esc(item.track.artist || 'Artista desconocido')} · ${esc(item.playlist)}</span></span>
    ${matching
      ? `<span class="import-match-select">Buscando en YouTube…</span>`
      : `<select class="import-match-select" data-import-candidate="${esc(item.key)}" aria-label="Coincidencia para ${esc(item.track.title)}">
          <option value="" ${chosen ? '' : 'selected'}>${candidates.length ? 'Elegir coincidencia…' : 'Omitir / sin resultado'}</option>
          ${candidates.map((candidate, candidateIndex) => `<option value="${esc(candidate.url)}" ${chosen === candidate.url ? 'selected' : ''}>${candidateIndex === 0 && best ? '★ ' : ''}${esc(candidate.title)} · ${esc(candidate.channel || 'YouTube')} (${candidate.score})</option>`).join('')}
        </select>`}
    ${status}
  </div>`;
}

function renderImportMatches() {
  const items = state.import.items || [];
  const matching = state.import.matching;
  const selected = selectedImportCount();
  const ready = items.filter((item) => matchForItem(item)?.best).length;
  const blocked = IS_TAURI && state.import.tools && !state.import.tools.ytdlp;
  const error = state.import.error ? `<div class="import-warning">${icon('bell')}<span>${esc(state.import.error)}</span></div>` : '';
  return `<div class="import-pane">
    <div class="import-match-head"><strong>${matching ? 'Buscando coincidencias en YouTube' : 'Revisa y elige las coincidencias'}</strong><span>${items.length ? `${plural(ready, 'pista con propuesta', 'pistas con propuesta')} · ${plural(selected, 'seleccionada', 'seleccionadas')}` : 'Sin pistas'}</span></div>
    ${matching ? renderImportProgressBlock() : ''}
    ${error}
    ${blocked ? `<div class="import-warning">${icon('youtube')}<span>yt-dlp no está instalado. Instálalo para adelantar coincidencias; o guarda las playlists y Davusic resolverá cada canción al reproducirla.</span></div>` : ''}
    ${items.length ? `<div class="import-match-list">${items.map((item, index) => renderImportMatchRow(item, index, matching)).join('')}</div>` : `<div class="import-empty">${icon('music')}No hay pistas seleccionadas.</div>`}
    <div class="import-actions">
      <button class="link-btn" data-import-select-all ${matching ? 'disabled' : ''}>Marcar las propuestas</button>
      <button class="link-btn" data-import-select-none ${matching ? 'disabled' : ''}>Quitar todas</button>
      <span class="import-actions__spacer"></span>
      <button class="btn btn--ghost" data-import-new ${matching ? 'disabled' : ''}>Volver</button>
      ${!matching && !state.import.matches.length ? `<button class="btn btn--soft" data-import-match>${icon('search')} Reintentar búsqueda</button>` : ''}
      <button class="btn btn--primary" data-import-save><span id="importDownloadLabel">${icon('plus')} Guardar referencias${items.length ? ` (${items.length})` : ''}</span></button>
    </div>
    ${renderImportTools()}
    <div class="import-note">${icon('sparkle')} Se guarda el enlace de YouTube, no el archivo. Al pulsar play, Davusic streamea la canción.</div>
  </div>`;
}

function renderImportDownloading() {
  const selected = state.import.items.filter((item) => state.import.selection[item.key]);
  return `<div class="import-pane">
    ${renderImportProgressBlock()}
    <div class="import-busy"><span class="spinner"></span> Descargando y añadiendo a tu biblioteca. Puedes seguir usando Davusic.</div>
    <div class="import-match-list">${selected.map((item) => `<div class="import-match-row is-selected">
      <span class="import-match-row__num">${icon('download')}</span>
      <span class="import-match-row__copy"><strong>${esc(item.track.title)}</strong><span>${esc(item.track.artist)} · ${esc(item.playlist)}</span></span>
      <span class="import-match-status is-work"><span class="spinner"></span> Descargando</span>
    </div>`).join('')}</div>
    <div class="import-note">${icon('shield')} No cierres la app hasta que termine. Si alguna pista falla, el resto continúa.</div>
  </div>`;
}

function renderImportDone() {
  const result = state.import.result || { downloaded: [], errors: [] };
  const created = result.createdPlaylists || [];
  const playlistLinks = created.map((playlist) => `<button class="btn btn--ghost" data-import-open-playlist="${esc(playlist.id)}">${icon('queue')} ${esc(playlist.name)}</button>`).join('');
  const errors = Array.isArray(result.errors) && result.errors.length
    ? `<div class="import-warning" style="text-align:left;margin-top:12px">${icon('bell')}<span>${result.errors.slice(0, 6).map(esc).join('<br>')}${result.errors.length > 6 ? `<br>… y ${result.errors.length - 6} más.` : ''}</span></div>`
    : '';
  return `<div class="import-pane">
    <div class="import-success">
      <span class="import-success__icon">${icon('check')}</span>
      <h3>${result.downloaded?.length ? 'Playlists listas para reproducir' : 'No se guardó ninguna pista'}</h3>
      <p>${result.downloaded?.length ? 'Las canciones se han guardado como referencia. Púlsalas para streamearlas desde este equipo, sin descargar la biblioteca entera.' : 'Revisa las playlists y vuelve a intentarlo.'}</p>
      <div class="import-success__stats">
        <span>${plural(result.downloaded?.length || 0, 'pista añadida', 'pistas añadidas')}</span>
        <span>${plural(created.length, 'playlist creada', 'playlists creadas')}</span>
        ${result.errors?.length ? `<span>${plural(result.errors.length, 'error', 'errores')}</span>` : ''}
      </div>
      ${errors}
      <div class="import-success__actions">
        ${created.length ? `<button class="btn btn--primary" data-import-open-playlist="${esc(created[0].id)}">${icon('play')} Abrir playlist</button>` : `<button class="btn btn--primary" data-import-open-library>${icon('library')} Abrir biblioteca</button>`}
        ${playlistLinks}
        <button class="btn btn--ghost" data-import-new>${icon('plus')} Importar otra</button>
      </div>
    </div>
    ${renderImportTools()}
  </div>`;
}

function exportifyTrackPayload(track) {
  if (!track) return null;
  return {
    title: String(track.title || ''),
    artist: String(track.artist || ''),
    album: String(track.album || ''),
    duration: Number(track.duration) || 0,
    uri: String(track.uri || track.path || ''),
  };
}

function exportifyPlaylistPayload(playlist) {
  if (!playlist) return null;
  const tracks = (playlist.track_ids || [])
    .map((id) => exportifyTrackPayload(trackFromId(id)))
    .filter(Boolean);
  if (!tracks.length) return null;
  return { name: String(playlist.name || 'Playlist'), tracks };
}

function exportifyLibraryPayload() {
  const out = [];
  const liked = (state.likes || [])
    .map((id) => exportifyTrackPayload(trackFromId(id)))
    .filter(Boolean);
  if (liked.length) out.push({ name: 'Me gusta', tracks: liked });
  (state.userPlaylists || []).forEach((playlist) => {
    const payload = exportifyPlaylistPayload(playlist);
    if (payload) out.push(payload);
  });
  return out;
}

async function exportExportifyLibrary() {
  if (!IS_TAURI) {
    toast('La exportación está disponible en la app de escritorio.', 'download');
    return;
  }
  const playlists = exportifyLibraryPayload();
  if (!playlists.length) {
    toast('No hay playlists con canciones para exportar.', 'bell', 4200);
    return;
  }
  try {
    const path = await inv('export_exportify_zip', { playlists });
    if (path) toast(`Exportadas <strong>${plural(playlists.length, 'playlist', 'playlists')}</strong> en formato Exportify.`, 'download', 5000);
  } catch (error) {
    toast(`No se pudo exportar. ${esc(error?.message || error || '')}`, 'bell', 5600);
  }
}

async function exportExportifyPlaylist(id) {
  if (!IS_TAURI) {
    toast('La exportación está disponible en la app de escritorio.', 'download');
    return;
  }
  const playlist = playlistById(id);
  const payload = exportifyPlaylistPayload(playlist);
  if (!payload) {
    toast('Esta playlist no tiene canciones para exportar.', 'bell', 4200);
    return;
  }
  try {
    const path = await inv('export_exportify_csv', { playlist: payload });
    if (path) toast(`Playlist <strong>${esc(payload.name)}</strong> exportada como CSV.`, 'download', 4600);
  } catch (error) {
    toast(`No se pudo exportar. ${esc(error?.message || error || '')}`, 'bell', 5600);
  }
}

async function importExportifyFile() {
  if (!IS_TAURI) {
    toast('Importar archivos está disponible en la app de escritorio.', 'file');
    return;
  }
  state.import.tab = 'exportify';
  state.import.step = 'source';
  state.import.error = '';
  state.import.loading = true;
  state.import.loadingMessage = 'Esperando el archivo de Exportify…';
  renderImport();
  try {
    const bundle = await inv('import_exportify_file');
    if (!bundle) {
      state.import.loading = false;
      renderImport();
      return;
    }
    handleImportBundle(bundle);
  } catch (error) {
    state.import.loading = false;
    state.import.error = `No se pudo importar el archivo de Exportify. ${error?.message || error || ''}`;
    renderImport();
    toast(`No se pudo importar el archivo. ${esc(error?.message || error || '')}`, 'bell', 5400);
  }
}

async function importPlaylistPath(path) {
  if (!IS_TAURI) {
    toast('Importar archivos está disponible en la app de escritorio.', 'file');
    return;
  }
  if (!path) return;
  state.import.step = 'source';
  state.import.tab = 'file';
  state.import.loading = true;
  state.import.loadingMessage = 'Leyendo la playlist…';
  state.import.error = '';
  renderImport();
  try {
    const bundle = await inv('parse_playlist_path', { path: String(path) });
    handleImportBundle(bundle);
  } catch (error) {
    state.import.loading = false;
    state.import.error = `No se pudo leer el archivo. ${error?.message || error || ''}`;
    renderImport();
    toast(`No se pudo leer la playlist. ${esc(error?.message || error || '')}`, 'bell', 5200);
  }
}

async function importPlaylistFile() {
  if (!IS_TAURI) {
    toast('Importar archivos está disponible en la app de escritorio.', 'file');
    return;
  }
  state.import.error = '';
  state.import.loading = true;
  state.import.loadingMessage = 'Esperando el archivo…';
  renderImport();
  try {
    const bundle = await inv('import_playlist_file');
    if (!bundle) {
      state.import.loading = false;
      renderImport();
      return;
    }
    handleImportBundle(bundle);
  } catch (error) {
    state.import.loading = false;
    state.import.error = `No se pudo importar el archivo. ${error?.message || error || ''}`;
    renderImport();
    toast(`No se pudo importar el archivo. ${esc(error?.message || error || '')}`, 'bell', 5200);
  }
}

async function importPlaylistUrl() {
  if (!IS_TAURI) {
    toast('Importar enlaces está disponible en la app de escritorio.', 'link');
    return;
  }
  const input = qs('#importUrlInput');
  const url = String(input?.value ?? state.import.urlDraft ?? '').trim();
  state.import.urlDraft = url;
  if (!url) {
    state.import.error = 'Pega un enlace de Spotify o YouTube Music.';
    renderImport();
    return;
  }
  if (!/(spotify\.com|spotify:|youtube\.com|youtu\.be)/i.test(url)) {
    state.import.error = 'El enlace no parece de Spotify ni de YouTube. Revisa que sea público.';
    renderImport();
    return;
  }
  state.import.loading = true;
  state.import.loadingMessage = state.import.tab === 'spotify' ? 'Leyendo la playlist de Spotify…' : 'Leyendo la lista de YouTube…';
  state.import.error = '';
  renderImport();
  try {
    const bundle = await inv('import_playlist_url', { url });
    handleImportBundle(bundle);
  } catch (error) {
    state.import.loading = false;
    state.import.error = `No se pudo leer el enlace. ${error?.message || error || ''}`;
    renderImport();
    toast(`No se pudo importar el enlace. ${esc(error?.message || error || '')}`, 'bell', 5600);
  }
}

async function importPlaylistText() {
  if (!IS_TAURI) {
    toast('Importar texto está disponible en la app de escritorio.', 'list');
    return;
  }
  const textarea = qs('#importTextInput');
  const text = String(textarea?.value ?? state.import.textDraft ?? '').trim();
  state.import.textDraft = text;
  if (!text) {
    state.import.error = 'Pega al menos una canción para poder buscarla.';
    renderImport();
    return;
  }
  state.import.loading = true;
  state.import.loadingMessage = 'Leyendo la lista pegada…';
  state.import.error = '';
  renderImport();
  try {
    const bundle = await inv('parse_playlist_text', { text, name: 'Playlist pegada' });
    handleImportBundle(bundle);
  } catch (error) {
    state.import.loading = false;
    state.import.error = `No se pudo leer el texto. ${error?.message || error || ''}`;
    renderImport();
    toast(`No se pudo leer la lista. ${esc(error?.message || error || '')}`, 'bell', 5200);
  }
}

function handleImportBundle(bundle) {
  state.import.loading = false;
  if (!bundle || !Array.isArray(bundle.playlists) || !bundle.playlists.length) {
    state.import.step = 'source';
    state.import.error = 'No se encontraron playlists con canciones en ese origen.';
    renderImport();
    toast('No se encontraron canciones en la playlist.', 'bell', 4800);
    return;
  }
  state.import.bundle = bundle;
  state.import.step = 'review';
  state.import.selectedPlaylists = bundle.playlists.map((playlist) => playlist.id);
  state.import.items = [];
  state.import.matches = [];
  state.import.selection = {};
  state.import.result = null;
  state.import.error = '';
  state.import.urlDraft = '';
  state.import.textDraft = '';
  renderImport();
  toast(`<strong>${esc(importOriginLabel(bundle.origin))}</strong>: ${plural(bundle.playlists.length, 'playlist leída', 'playlists leídas')}. Elige cuáles traer.`, 'check', 3800);
}

function toggleImportPlaylists() {
  const playlists = state.import.bundle?.playlists || [];
  const allIds = playlists.map((playlist) => playlist.id);
  const allSelected = allIds.every((id) => state.import.selectedPlaylists.includes(id));
  state.import.selectedPlaylists = allSelected ? [] : allIds;
  rerenderImportPreserveScroll();
}

function rerenderImportPreserveScroll() {
  const scroll = els.importBody?.scrollTop || 0;
  renderImport();
  if (els.importBody) els.importBody.scrollTop = scroll;
}

function commitImportedStreams() {
  if (state.import.downloading) return;
  state.import.matching = false;
  const fromMatches = state.import.step === 'matches' && (state.import.items || []).length;
  const items = fromMatches
    ? state.import.items.filter((item) => state.import.selection[item.key] || item.track)
    : importBundleTracks(selectedImportPlaylists());
  const usable = fromMatches
    ? items.filter((item) => state.import.selection[item.key] || item.track?.title)
    : items;
  if (!usable.length) {
    toast('Selecciona al menos una playlist con canciones.', 'bell');
    return;
  }
  const groups = new Map();
  usable.forEach((item) => {
    const chosen = fromMatches ? (state.import.selection[item.key] || item.track.uri || '') : (item.track.uri || '');
    const adopted = adoptStreamTrack({
      title: item.track.title,
      artist: item.track.artist,
      album: item.track.album,
      duration: item.track.duration,
      uri: chosen,
    }, { silent: true });
    const name = item.playlist || 'Playlist importada';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(adopted.id);
  });
  persistStreams();
  const created = [];
  groups.forEach((ids, name) => {
    if (isLikedCollectionName(name)) {
      addIdsToLikes(ids);
      created.push({ id: 'liked', name: 'Me gusta', count: state.likes.length });
      return;
    }
    let playlist = state.userPlaylists.find((entry) => fold(entry.name) === fold(name) && entry.source !== 'demo');
    if (!playlist) {
      playlist = {
        id: uid('playlist'),
        name: String(name).slice(0, 80),
        description: `Importada desde ${importOriginLabel(state.import.bundle?.origin)} · streaming`,
        source: 'user',
        accent: '#ffa094',
        created_at: Date.now(),
        track_ids: [],
      };
      state.userPlaylists.push(playlist);
    }
    const existing = new Set(playlist.track_ids || []);
    ids.forEach((id) => {
      if (existing.has(id)) return;
      playlist.track_ids.push(id);
      existing.add(id);
    });
    created.push({ id: playlist.id, name: playlist.name, count: playlist.track_ids.length });
  });
  persistPlaylists();
  rebuildLibrary();
  renderSidebar();
  state.import.downloading = false;
  state.import.result = {
    downloaded: usable.map((item) => ({
      key: item.key,
      title: item.track.title,
      artist: item.track.artist,
      playlist: item.playlist,
    })),
    errors: [],
    createdPlaylists: created,
  };
  state.import.step = 'done';
  state.import.progress = importProgressPayload('done', 'Playlists guardadas', usable.length, usable.length);
  renderImport();
  if (state.view.name === 'foryou' || state.view.name === 'library' || state.view.name === 'home') renderView();
  toast(`<strong>${plural(usable.length, 'pista guardada', 'pistas guardadas')}</strong> para streamear · ${plural(created.length, 'playlist lista', 'playlists listas')}.`, 'check', 4800);
}

async function startImportMatching() {
  if (!IS_TAURI) {
    toast('Buscar coincidencias está disponible en la app de escritorio.', 'search');
    return;
  }
  if (state.import.matching || state.import.downloading) return;
  const playlists = selectedImportPlaylists();
  const items = importBundleTracks(playlists);
  if (!items.length) {
    toast('Selecciona al menos una playlist con canciones.', 'bell');
    return;
  }
  state.import.items = items;
  state.import.matches = [];
  state.import.selection = {};
  state.import.matching = true;
  state.import.step = 'matches';
  state.import.error = '';
  state.import.progress = importProgressPayload('match', 'Preparando la búsqueda en YouTube…', 0, items.length);
  renderImport();
  toast('Buscando coincidencias. Puedes guardar las playlists cuando quieras; el resto se resuelve al pulsar play.', 'search', 4200);
  try {
    await refreshYtdlpTools(false);
    if (!state.import.matching || state.import.step !== 'matches') return;
    if (!state.import.tools?.ytdlp) {
      state.import.matching = false;
      state.import.step = 'review';
      state.import.error = 'yt-dlp no está instalado. Instálalo para adelantar coincidencias, o pulsa «Añadir a la biblioteca» y Davusic resolverá cada canción al reproducirla.';
      renderImport();
      toast('Puedes guardar las playlists ahora. yt-dlp solo hace falta para adelantar las coincidencias.', 'youtube', 5600);
      return;
    }
    const results = await inv('match_import_tracks', { tracks: items.map((item) => item.track) });
    if (!state.import.matching || state.import.step !== 'matches') return;
    const normalized = (Array.isArray(results) ? results : []).map((match, index) => ({
      ...match,
      track_id: match.track_id || items[index]?.key || '',
    }));
    state.import.matches = normalized;
    state.import.selection = {};
    normalized.forEach((match) => {
      if (match.best?.url) state.import.selection[match.track_id] = match.best.url;
    });
    state.import.progress = importProgressPayload('match-done', 'Búsqueda completada', items.length, items.length);
    const found = normalized.filter((match) => match.best).length;
    toast(`<strong>${plural(found, 'coincidencia propuesta', 'coincidencias propuestas')}</strong> de ${items.length}. Guarda las referencias para streamearlas.`, 'search', 4500);
  } catch (error) {
    if (state.import.step !== 'matches') return;
    state.import.error = `No se pudo completar la búsqueda. ${error?.message || error || ''}`;
    toast(`La búsqueda falló. ${esc(error?.message || error || '')}`, 'bell', 5600);
  } finally {
    if (state.import.step === 'matches') {
      state.import.matching = false;
      renderImport();
    }
  }
}

function handleImportMatchProgress(payload) {
  if (!payload || state.import.step !== 'matches') return;
  const total = Math.max(0, Number(payload.total) || 0);
  const done = Math.max(0, Number(payload.done) || 0);
  state.import.progress = importProgressPayload(
    'match',
    `${payload.title || 'Buscando'}${payload.artist ? ` · ${payload.artist}` : ''}`,
    done,
    total,
  );
  const item = state.import.items.find((entry) => entry.key === payload.track_id);
  if (item) {
    item.matchDone = true;
    item.progressBest = payload.best || null;
    const row = qs(`[data-import-match-row="${CSS.escape(item.key)}"]`);
    const status = row ? qs('.import-match-status', row) : null;
    if (status) {
      status.className = `import-match-status ${item.progressBest ? 'is-work' : 'is-bad'}`;
      status.innerHTML = item.progressBest ? `${icon('check')} Posible` : `${icon('x')} Sin resultado`;
    }
  }
  updateImportProgressDom();
}

function handleImportChange(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const playlist = target.closest('[data-import-playlist]');
  if (playlist) {
    const id = playlist.dataset.importPlaylist;
    if (playlist.checked) {
      if (!state.import.selectedPlaylists.includes(id)) state.import.selectedPlaylists.push(id);
    } else {
      state.import.selectedPlaylists = state.import.selectedPlaylists.filter((item) => item !== id);
    }
    rerenderImportPreserveScroll();
    return;
  }
  const candidate = target.closest('[data-import-candidate]');
  if (candidate) {
    const key = candidate.dataset.importCandidate;
    if (candidate.value) state.import.selection[key] = candidate.value;
    else delete state.import.selection[key];
    updateImportSelectionUI();
  }
}

function handleImportInput(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.matches('[data-import-url-input]')) state.import.urlDraft = target.value;
  else if (target.matches('[data-import-text-input]')) state.import.textDraft = target.value;
  handleSpotifyInput(event);
}

function updateImportSelectionUI() {
  const count = selectedImportCount();
  qsa('[data-import-match-row]', els.importBody).forEach((row) => {
    const key = row.dataset.importMatchRow;
    const chosen = Boolean(state.import.selection[key]);
    row.classList.toggle('is-selected', chosen);
    const status = qs('.import-match-status', row);
    const select = qs('[data-import-candidate]', row);
    const hasCandidates = select ? select.options.length > 1 : false;
    if (status) {
      if (chosen) {
        status.className = 'import-match-status is-ok';
        status.innerHTML = `${icon('check')} Lista`;
      } else if (hasCandidates) {
        status.className = 'import-match-status';
        status.innerHTML = `${icon('sliders')} Elegir`;
      } else {
        status.className = 'import-match-status is-bad';
        status.innerHTML = `${icon('x')} Sin resultado`;
      }
    }
  });
  const meta = qs('.import-match-head span', els.importBody);
  if (meta) {
    const ready = (state.import.items || []).filter((item) => matchForItem(item)?.best).length;
    meta.textContent = `${plural(ready, 'pista con propuesta', 'pistas con propuesta')} · ${plural(count, 'seleccionada', 'seleccionadas')}`;
  }
  const label = qs('#importDownloadLabel');
  const total = (state.import.items || []).length;
  if (label) label.innerHTML = `${icon('plus')} Guardar referencias${total ? ` (${total})` : ''}`;
  const button = qs('[data-import-save]');
  if (button) button.disabled = false;
}

function selectAllImportMatches(all) {
  if (state.import.matching) return;
  state.import.selection = {};
  if (all) {
    state.import.items.forEach((item) => {
      const match = matchForItem(item);
      if (match?.best?.url) state.import.selection[item.key] = match.best.url;
    });
  }
  rerenderImportPreserveScroll();
}

async function startImportDownload() {
  if (!IS_TAURI) {
    toast('Las descargas están disponibles en la app de escritorio.', 'download');
    return;
  }
  if (state.import.downloading || state.import.matching) return;
  const items = state.import.items.filter((item) => state.import.selection[item.key]).map((item) => ({
    key: item.key,
    url: state.import.selection[item.key],
    title: item.track.title,
    artist: item.track.artist,
    playlist: item.playlist,
  }));
  if (!items.length) {
    toast('No hay ninguna pista seleccionada para descargar.', 'bell');
    return;
  }
  if (!state.import.tools?.ytdlp) {
    state.import.error = 'yt-dlp no está instalado. Instálalo para descargar las pistas.';
    renderImport();
    toast('Instala yt-dlp para descargar las coincidencias.', 'youtube', 4600);
    return;
  }
  state.import.downloading = true;
  state.import.step = 'downloading';
  state.import.error = '';
  state.import.progress = importProgressPayload('download', 'Preparando las descargas…', 0, items.length);
  renderImport();
  try {
    const result = await inv('download_import_tracks', { items });
    handleImportDownloadResult(result);
  } catch (error) {
    state.import.downloading = false;
    state.import.step = 'matches';
    state.import.error = `La descarga no se pudo completar. ${error?.message || error || ''}`;
    renderImport();
    toast(`No se pudo completar la descarga. ${esc(error?.message || error || '')}`, 'bell', 6000);
  }
}

function normalizedPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function fileBaseName(value) {
  return normalizedPath(value).split('/').filter(Boolean).pop() || '';
}

function findLocalTrackForFile(file) {
  const target = normalizedPath(file?.path);
  if (!target) return null;
  const exact = state.local.tracks.find((track) => normalizedPath(track.path) === target);
  if (exact) return exact;
  const base = fileBaseName(target).toLowerCase();
  if (!base) return null;
  return state.local.tracks.find((track) => fileBaseName(track.path).toLowerCase() === base) || null;
}

function createImportedPlaylists(result) {
  const downloaded = new Map((result.downloaded || []).map((file) => [file.key, file]));
  const groups = new Map();
  state.import.items.forEach((item) => {
    const file = downloaded.get(item.key);
    if (!file) return;
    const track = findLocalTrackForFile(file);
    if (!track) return;
    const name = item.playlist || 'Playlist importada';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(track.id);
  });
  const created = [];
  groups.forEach((ids, name) => {
    let playlist = state.userPlaylists.find((entry) => fold(entry.name) === fold(name) && entry.source !== 'demo');
    if (!playlist) {
      playlist = {
        id: uid('playlist'),
        name: String(name).slice(0, 80),
        description: `Importada desde ${importOriginLabel(state.import.bundle?.origin)}`,
        source: 'user',
        accent: '#ffa094',
        created_at: Date.now(),
        track_ids: [],
      };
      state.userPlaylists.push(playlist);
    }
    const existing = new Set(playlist.track_ids || []);
    ids.forEach((id) => {
      if (existing.has(id)) return;
      playlist.track_ids.push(id);
      existing.add(id);
    });
    created.push({ id: playlist.id, name: playlist.name, count: playlist.track_ids.length });
  });
  if (groups.size) {
    persistPlaylists();
    rebuildLibrary();
    renderSidebar();
  }
  return created;
}

function handleImportDownloadResult(result) {
  state.import.downloading = false;
  if (!result) {
    state.import.step = 'matches';
    state.import.error = 'La descarga terminó sin devolver resultados.';
    renderImport();
    return;
  }
  const libraryHandled = handleLibraryResult(result);
  if (!libraryHandled && result.library) setLocalLibrary(result.library);
  const created = createImportedPlaylists(result);
  result.createdPlaylists = created;
  state.import.result = result;
  state.import.step = 'done';
  state.import.progress = importProgressPayload('done', 'Importación completada', state.import.items.length, state.import.items.length);
  renderSidebar();
  if (state.view.name === 'foryou' || state.view.name === 'library') renderView();
  renderImport();
  const downloadedCount = result.downloaded?.length || 0;
  toast(`<strong>${plural(downloadedCount, 'pista descargada', 'pistas descargadas')}</strong> y ${plural(created.length, 'playlist actualizada', 'playlists actualizadas')}.`, 'download', 4800);
}

function handleImportDownloadProgress(payload) {
  if (!payload) return;
  const total = Math.max(0, Number(payload.total) || 0);
  const done = Math.max(0, Number(payload.done) || 0);
  const stage = String(payload.stage || 'download');
  let label = payload.title || '';
  if (stage === 'file') label = `Descargada: ${payload.title || ''}`;
  else if (stage === 'error') label = `Error en: ${payload.title || ''}`;
  else if (stage === 'download') label = `Descargando: ${payload.title || ''}`;
  else if (stage === 'done') label = 'Terminando y actualizando la biblioteca…';
  state.import.progress = importProgressPayload(stage, label, done, total);
  updateImportProgressDom();
}


/* ---------- ventana y Tauri ---------- */

function bindWindowControls() {
  const minimize = qs('#winMinimize');
  const maximize = qs('#winMaximize');
  const close = qs('#winClose');
  if (!IS_TAURI) {
    [minimize, maximize, close].forEach((btn) => { if (btn) btn.hidden = true; });
    return;
  }
  let win = null;
  try { win = TAURI.window?.getCurrentWindow?.(); } catch (_) {}
  if (!win) {
    [minimize, maximize, close].forEach((btn) => { if (btn) btn.hidden = true; });
    return;
  }
  minimize?.addEventListener('click', () => win.minimize().catch(() => {}));
  maximize?.addEventListener('click', () => win.toggleMaximize().catch(() => {}));
  close?.addEventListener('click', async () => {
    await persistSession(true);
    win.close().catch(() => {});
  });
  try {
    win.onCloseRequested(async () => {
      await persistSession(true);
    });
  } catch (_) {}
  window.addEventListener('beforeunload', () => {
    if (state.ui.factoryResetting) return;
    persistSession(false);
  });
}

function bindNativeDragDrop() {
  if (!IS_TAURI) return;
  try {
    const webview = TAURI.webview?.getCurrentWebview?.();
    if (webview && typeof webview.onDragDropEvent === 'function') {
      webview.onDragDropEvent((event) => {
        const payload = event?.payload || {};
        if (payload.type === 'drop' && Array.isArray(payload.paths) && payload.paths.length) {
          handleDroppedPaths(payload.paths);
        } else if (payload.type === 'over') {
          if (!state.ui.scanVisible) showScan('Suelta para añadir a tu biblioteca', 3);
        } else if (payload.type === 'leave') {
          if (state.ui.scanVisible) hideScan(120);
        }
      });
    }
  } catch (_) {}
}

async function bindTauriEvents() {
  if (!IS_TAURI) return;
  onEvent('library-scan-progress', (event) => handleScanPayload(event?.payload));
  onEvent('library-scan-finished', () => hideScan(250));
  onEvent('library-updated', (event) => {
    const payload = event?.payload;
    if (!handleLibraryResult(payload)) refreshLibrary({ quiet: true });
    ensureWallpaperThemes();
  });
  onEvent('playback-ended', () => handleTrackEnded());
  onEvent('playback-status', (event) => {
    const payload = event?.payload || {};
    if (payload.track_id && payload.track_id !== state.player.trackId) return;
    state.player.statusLabel = String(payload.message || '');
    updatePlayerUI();
  });
  onEvent('playback-error', (event) => {
    const message = event?.payload?.message || event?.payload || 'Error de reproducción';
    toast(esc(message), 'bell', 4500);
  });
  onEvent('wallpaper-progress', (event) => handleWallpaperProgress(event?.payload));
  onEvent('import-match-progress', (event) => handleImportMatchProgress(event?.payload));
  onEvent('import-download-progress', (event) => handleImportDownloadProgress(event?.payload));
  onEvent('spotify-import-progress', (event) => handleSpotifyImportProgress(event?.payload));
  onEvent('mpris-volume', (event) => {
    const volume = clamp(Number(event?.payload?.volume ?? event?.payload ?? 0), 0, 1);
    state.player.volume = volume;
    state.player.muted = volume === 0;
    if (volume > 0) state.player.lastVolume = volume;
    state.prefs.volume = volume;
    savePrefs();
    updatePlayerUI();
  });
  onEvent('mpris-action', (event) => {
    const payload = event?.payload || {};
    const action = String(payload.action || payload || '');
    if (action === 'play') { if (!state.player.playing) togglePlay(); }
    else if (action === 'pause') { if (state.player.playing) togglePlay(); }
    else if (action === 'playpause') togglePlay();
    else if (action === 'next') nextTrack(true);
    else if (action === 'previous') previousTrack();
    else if (action === 'stop') {
      state.player.playing = false;
      engine.pause().catch(() => {});
      updatePlayerUI();
    }
    else if (action === 'seek') seekTo(Number(payload.position) || 0);
    else if (action === 'loop-off') { state.player.repeat = 'off'; updatePlayerUI(); }
    else if (action === 'loop-all') { state.player.repeat = 'all'; updatePlayerUI(); }
    else if (action === 'loop-one') { state.player.repeat = 'one'; updatePlayerUI(); }
    else if (action === 'shuffle-on') setShuffle(true);
    else if (action === 'shuffle-off') setShuffle(false);
  });
}

/* ---------- arrastre de cola y pistas ---------- */

function bindDragAndDrop() {
  const body = els.contextBody;
  if (!body) return;

  document.addEventListener('dragstart', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const queueItem = target.closest('[data-queue-index]');
    if (queueItem) {
      state.ui.draggedQueue = Number(queueItem.dataset.queueIndex);
      queueItem.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', `queue:${state.ui.draggedQueue}`);
      }
      return;
    }
    const row = target.closest('[data-row-track]');
    if (row) {
      state.ui.draggedTrack = row.dataset.rowTrack;
      row.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', state.ui.draggedTrack || '');
      }
    }
  });

  body.addEventListener('dragover', (event) => {
    if (state.ui.draggedQueue == null && !state.ui.draggedTrack) return;
    event.preventDefault();
    body.classList.add('is-drop-target');
    qsa('.queue-item.is-dragover', body).forEach((el) => el.classList.remove('is-dragover'));
    const item = event.target instanceof Element ? event.target.closest('[data-queue-index]') : null;
    if (item && state.ui.draggedQueue != null) item.classList.add('is-dragover');
  });

  body.addEventListener('dragleave', (event) => {
    if (event.target === body || !body.contains(event.relatedTarget)) {
      body.classList.remove('is-drop-target');
      qsa('.queue-item.is-dragover', body).forEach((el) => el.classList.remove('is-dragover'));
    }
  });

  body.addEventListener('drop', (event) => {
    if (state.ui.draggedQueue == null && !state.ui.draggedTrack) return;
    event.preventDefault();
    body.classList.remove('is-drop-target');
    qsa('.queue-item.is-dragover', body).forEach((el) => el.classList.remove('is-dragover'));
    const targetItem = event.target instanceof Element ? event.target.closest('[data-queue-index]') : null;
    const to = targetItem ? Number(targetItem.dataset.queueIndex) : state.player.queue.length;
    if (state.ui.draggedQueue != null) {
      const from = state.ui.draggedQueue;
      const p = state.player;
      if (Number.isFinite(from) && Number.isFinite(to) && p.queue[from] && from !== to) {
        const currentId = p.queue[p.index];
        const [moved] = p.queue.splice(from, 1);
        const insertAt = clamp(from < to ? to : to, 0, p.queue.length);
        p.queue.splice(insertAt, 0, moved);
        p.index = currentId ? p.queue.indexOf(currentId) : p.index;
        if (p.unshuffled) p.unshuffled = p.queue.slice();
        queueDropAt = Date.now();
        renderContext();
      }
    } else if (state.ui.draggedTrack) {
      const trackId = state.ui.draggedTrack;
      const p = state.player;
      if (p.trackId && p.queue.length) {
        p.queue = p.queue.filter((id, idx) => idx <= p.index || id !== trackId);
        let insertAt = targetItem ? Number(targetItem.dataset.queueIndex) + 1 : p.queue.length;
        insertAt = clamp(insertAt, p.index + 1, p.queue.length);
        p.queue.splice(insertAt, 0, trackId);
        if (p.unshuffled) p.unshuffled = p.queue.slice();
        queueDropAt = Date.now();
        renderContext();
        toast(`<strong>${esc(trackFromId(trackId)?.title || 'Canción')}</strong> colocada en la cola.`, 'queue');
      } else {
        addToQueue(trackId);
      }
    }
    state.ui.draggedQueue = null;
    state.ui.draggedTrack = null;
  });

  document.addEventListener('dragend', () => {
    state.ui.draggedQueue = null;
    state.ui.draggedTrack = null;
    body.classList.remove('is-drop-target');
    qsa('.is-dragging, .is-dragover').forEach((el) => el.classList.remove('is-dragging', 'is-dragover'));
  });
}

/* ---------- eventos de interfaz ---------- */

function bindUI() {
  bindWindowControls();

  els.navBack?.addEventListener('click', goBack);
  els.navForward?.addEventListener('click', goForward);

  els.searchInput?.addEventListener('input', () => handleSearchInput());
  els.searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      runSearch(els.searchInput.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (els.searchInput.value) clearSearch();
      else els.searchInput.blur();
    }
  });
  els.searchClear?.addEventListener('click', () => clearSearch());
  els.searchbox?.addEventListener('click', (event) => {
    if (!event.target.closest('button') && event.target !== els.searchInput) focusSearch();
  });

  els.playBtn?.addEventListener('click', () => togglePlay());
  els.prevBtn?.addEventListener('click', () => previousTrack());
  els.nextBtn?.addEventListener('click', () => nextTrack(true));
  els.shuffleBtn?.addEventListener('click', () => setShuffle());
  els.repeatBtn?.addEventListener('click', () => cycleRepeat());
  els.playerLike?.addEventListener('click', () => { if (state.player.trackId) toggleLike(state.player.trackId); });
  els.playerAdd?.addEventListener('click', () => {
    if (state.player.trackId) openAddMenu(state.player.trackId, els.playerAdd);
  });
  els.playerCover?.addEventListener('click', openImmersive);
  els.muteBtn?.addEventListener('click', toggleMute);
  els.queueBtn?.addEventListener('click', () => toggleContextPanel('queue'));
  els.lyricsBtn?.addEventListener('click', () => toggleContextPanel('lyrics'));
  els.immersiveBtn?.addEventListener('click', openImmersive);

  els.contextClose?.addEventListener('click', closeContextPanel);
  els.scrim?.addEventListener('click', closeContextPanel);

  els.settingsBtn?.addEventListener('click', openSettings);
  els.shortcutsBtn?.addEventListener('click', openShortcuts);
  els.profileBtn?.addEventListener('click', openSettings);
  els.profileTopBtn?.addEventListener('click', openSettings);
  els.newPlaylistBtn?.addEventListener('click', () => openPlaylistModal());
  els.newPlaylistBtn2?.addEventListener('click', () => openPlaylistModal());
  els.importBtn?.addEventListener('click', () => openImportModal('library'));
  els.importTopBtn?.addEventListener('click', () => openImportModal('file'));

  els.addMenuCreate?.addEventListener('click', () => {
    const trackId = state.ui.addMenuTrack;
    closeMenus();
    openPlaylistModal(trackId);
  });

  els.playlistForm?.addEventListener('submit', submitPlaylistForm);
  els.playlistModal?.addEventListener('click', (event) => {
    if (event.target === els.playlistModal) closePlaylistModal();
  });
  els.settingsSheet?.addEventListener('click', (event) => {
    if (event.target === els.settingsSheet) closeSheets();
  });
  els.importModal?.addEventListener('click', (event) => {
    if (event.target === els.importModal) closeImportModal();
  });
  els.shortcutsSheet?.addEventListener('click', (event) => {
    if (event.target === els.shortcutsSheet) closeSheets();
  });

  els.settingsBody?.addEventListener('click', handleSettingsClick);
  els.settingsBody?.addEventListener('input', (event) => {
    handleProfileInput(event);
    handleSpotifyInput(event);
  });
  els.settingsBody?.addEventListener('keydown', handleSpotifyKeydown);
  els.importBody?.addEventListener('change', handleImportChange);
  els.importBody?.addEventListener('input', handleImportInput);
  els.importBody?.addEventListener('keydown', handleSpotifyKeydown);
  els.factoryResetConfirm?.addEventListener('input', syncFactoryResetSubmit);
  els.factoryResetConfirm?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !els.factoryResetSubmit?.disabled) {
      event.preventDefault();
      performFactoryReset();
    }
  });

  els.palette?.addEventListener('click', (event) => {
    if (event.target === els.palette) closePalette();
  });
  els.paletteInput?.addEventListener('input', () => {
    state.ui.paletteIndex = 0;
    const value = els.paletteInput.value;
    renderPalette(value);
    if (String(value || '').trim().length >= 2) fetchOnlineSearch(value);
  });
  els.paletteInput?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); event.stopPropagation(); movePaletteSelection(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); event.stopPropagation(); movePaletteSelection(-1); }
    else if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); runPaletteItem(state.ui.paletteIndex); }
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePalette(); }
  });
  els.paletteResults?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-palette-index]') : null;
    if (target) runPaletteItem(Number(target.dataset.paletteIndex));
  });

  els.immersiveClose?.addEventListener('click', closeImmersive);
  els.immersivePlay?.addEventListener('click', () => togglePlay());
  els.immersivePrev?.addEventListener('click', () => previousTrack());
  els.immersiveNext?.addEventListener('click', () => nextTrack(true));
  els.immersiveShuffle?.addEventListener('click', () => setShuffle());
  els.immersiveLike?.addEventListener('click', () => { if (state.player.trackId) toggleLike(state.player.trackId); });
  els.immersiveMenu?.addEventListener('click', () => {
    if (state.player.trackId) openTrackMenu(state.player.trackId, els.immersiveMenu);
  });

  els.view?.addEventListener('change', (event) => {
    const select = event.target instanceof Element ? event.target.closest('[data-library-sort]') : null;
    if (!select) return;
    state.ui.librarySort = select.value;
    state.prefs.librarySort = select.value;
    savePrefs();
    renderView();
  });

  bindProgressBar();
  bindVolumeBar();
  bindImmersiveProgress();
  bindDragAndDrop();

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('resize', () => {
    closeMenus();
    if (window.innerWidth > 1260) els.scrim.classList.remove('is-visible');
  });
  els.mainScroll?.addEventListener('scroll', () => {
    if ((els.trackMenu && !els.trackMenu.hidden) || (els.addMenu && !els.addMenu.hidden)) closeMenus();
  }, { passive: true });
}

/* ---------- arranque ---------- */

function hydrateState() {
  migrateLegacyStore();
  const storedPrefs = readStore(STORE.prefs, {}) || {};
  const prefs = { ...DEFAULT_PREFS, ...storedPrefs };
  const wallpaperStored = readStore(STORE.wallpaper, null);
  state.wallpaper = {
    ...state.wallpaper,
    themes: Array.isArray(wallpaperStored?.themes) ? wallpaperStored.themes.filter((t) => t && t.id && t.palette) : [],
    folder: typeof wallpaperStored?.folder === 'string' ? wallpaperStored.folder : '',
    selected: wallpaperStored?.selected && wallpaperStored.selected.palette ? wallpaperStored.selected : null,
    loaded: Array.isArray(wallpaperStored?.themes) && wallpaperStored.themes.length > 0,
  };
  if (prefs.theme === 'obsidian' || prefs.theme === 'grafito' || prefs.theme === 'wallpaper') prefs.theme = 'nocturne';
  if (prefs.theme === 'marfil') prefs.theme = 'paper';
  prefs.theme = THEMES.some((t) => t.id === prefs.theme) ? prefs.theme : DEFAULT_PREFS.theme;
  if (prefs.accent === 'coral' && prefs.theme === 'nocturne') prefs.accent = 'cyan';
  prefs.accent = ACCENTS.some((a) => a.id === prefs.accent) ? prefs.accent : DEFAULT_PREFS.accent;
  prefs.motion = prefs.motion === 'reduced' ? 'reduced' : 'full';
  prefs.volume = clamp(Number(prefs.volume), 0, 1);
  if (!Number.isFinite(Number(prefs.volume))) prefs.volume = DEFAULT_PREFS.volume;
  prefs.contextTab = prefs.contextTab === 'lyrics' ? 'lyrics' : 'queue';
  prefs.searchHistory = Array.isArray(prefs.searchHistory) ? prefs.searchHistory.filter((s) => typeof s === 'string').slice(0, 8) : [];
  prefs.librarySort = ['title', 'artist', 'album', 'recent'].includes(prefs.librarySort) ? prefs.librarySort : 'title';
  prefs.fontPack = FONT_PACKS.some((item) => item.id === prefs.fontPack) ? prefs.fontPack : DEFAULT_PREFS.fontPack;
  prefs.resumeSession = prefs.resumeSession === false ? false : true;
  state.prefs = prefs;

  const likes = readStore(STORE.likes, []);
  state.likes = Array.isArray(likes) ? likes.filter((id) => typeof id === 'string') : [];

  const streams = readStore(STORE.streams, []);
  state.stream.tracks = Array.isArray(streams)
    ? streams.filter((track) => track && track.title).map((track) => normalizeTrack(track, 'stream'))
    : [];

  const lyricsStore = readStore(STORE.lyrics, {});
  state.ui.lyrics.byId = lyricsStore && typeof lyricsStore === 'object' ? lyricsStore : {};

  const playlists = readStore(STORE.playlists, []);
  state.userPlaylists = Array.isArray(playlists)
    ? playlists.filter((p) => p && typeof p.id === 'string' && p.name).map((p) => ({
        ...p,
        source: 'user',
        name: String(p.name).slice(0, 80),
        description: String(p.description || '').slice(0, 200),
        track_ids: Array.isArray(p.track_ids) ? p.track_ids.filter((id) => typeof id === 'string') : [],
        created_at: Number(p.created_at) || Date.now(),
      }))
    : [];

  const recents = readStore(STORE.recents, []);
  state.recents = Array.isArray(recents)
    ? recents.filter((r) => r && typeof r.id === 'string').map((r) => ({ id: r.id, at: Number(r.at) || 0 })).slice(0, 120)
    : [];

  const signals = readStore(STORE.signals, null);
  state.signals = sanitizeSignals(signals);

  const storedProfile = readStore(STORE.profile, null);
  state.profile = {
    ...DEFAULT_PROFILE,
    ...(storedProfile && typeof storedProfile === 'object' ? storedProfile : {}),
    name: String(storedProfile?.name || DEFAULT_PROFILE.name).slice(0, 32),
    handle: String(storedProfile?.handle || DEFAULT_PROFILE.handle).replace(/^@/, '').slice(0, 24),
    avatar: typeof storedProfile?.avatar === 'string' ? storedProfile.avatar : '',
  };

  state.ui.librarySort = prefs.librarySort;
  state.player.volume = prefs.volume;
  state.player.lastVolume = prefs.volume || 0.78;
  state.player.muted = prefs.volume === 0;
}

async function loadDemo() {
  if (IS_TAURI) {
    state.demo = { tracks: [], albums: [], artists: [], playlists: [], moods: [] };
    rebuildLibrary();
    return true;
  }
  try {
    const response = await fetch('assets/demo.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    setDemoLibrary(data);
    return true;
  } catch (error) {
    console.error('Davusic: no se pudo cargar la demo', error);
    return false;
  }
}

async function boot() {
  try {
    hydrateState();
    applyPrefs();
    document.body.classList.add(IS_TAURI ? 'is-tauri' : 'is-browser');
    bindUI();

    if (IS_TAURI) {
      try {
        const catalog = await inv('load_user_catalog');
        if (Array.isArray(catalog?.streams) && catalog.streams.length) {
          state.stream.tracks = catalog.streams
            .filter((track) => track && track.title)
            .map((track) => normalizeTrack(track, 'stream'));
        }
        if (Array.isArray(catalog?.playlists) && catalog.playlists.length) {
          state.userPlaylists = catalog.playlists.filter((p) => p && typeof p.id === 'string' && p.name).map((p) => ({
            ...p,
            source: 'user',
            name: String(p.name).slice(0, 80),
            description: String(p.description || '').slice(0, 200),
            track_ids: Array.isArray(p.track_ids) ? p.track_ids.filter((id) => typeof id === 'string') : [],
            created_at: Number(p.created_at) || Date.now(),
          }));
        }
      } catch (error) {
        console.error('Davusic: no se pudo leer el catálogo en disco', error);
      }
      try {
        const fonts = await inv('load_user_fonts');
        if (fonts && typeof fonts === 'object') state.ui.customFonts = fonts;
      } catch (error) {
        console.error('Davusic: no se pudieron leer las fuentes', error);
      }
    } else {
      const storedFonts = readStore(STORE.fonts, {});
      if (storedFonts && typeof storedFonts === 'object') state.ui.customFonts = storedFonts;
    }
    applyFonts();

    const demoLoaded = await loadDemo();
    absorbImportedLikes();
    renderSidebar();
    updateProfileChrome();
    setContextTab(state.prefs.contextTab, false);
    renderView();
    resetMainScroll();
    updateNavButtons();
    updateSearchBox();
    updatePlayerUI();
    startPolling();

    if (!IS_TAURI && !demoLoaded) {
      toast('No se pudo cargar la vista previa. Abre la app de escritorio para importar tu música.', 'bell', 5200);
    }

    if (IS_TAURI) {
      state.player.loading = false;
      ensureEngineVolume();
      await refreshLibrary({ quiet: true });
      bindTauriEvents();
      bindNativeDragDrop();
      await restoreSession();
    } else {
      await restoreSession();
    }

    state.ui.booted = true;
    window.setTimeout(() => els.app.classList.add('is-ready'), 30);
  } catch (error) {
    console.error('Davusic: fallo al arrancar', error);
    if (els.view) {
      els.view.innerHTML = emptyState('bell', 'Algo no ha ido bien', 'La interfaz no pudo arrancar. Revisa la consola o reinicia Davusic.', '<button class="btn btn--primary" onclick="location.reload()">Reintentar</button>');
    }
    toast(`No se pudo iniciar Davusic. ${esc(error?.message || error || '')}`, 'bell', 6000);
  }
}

boot();

window.addEventListener('pageshow', () => {
  resetWindowScroll();
  if (state.ui.booted) resetMainScroll();
});
