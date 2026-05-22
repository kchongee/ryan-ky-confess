export type SiteMode = "confession" | "cosmos";
export type PermissionChoice = "once" | "forever" | null;
export type DateChoiceId = "dinner" | "movie" | "walk" | "you";

export type CosmosConfig = {
  siteMode: SiteMode;
  startDate: string;
  confessionDate: string;
  coupleTitle: string;
  herNickname: string;
  firstDateChoice: DateChoiceId | null;
  debugEnabled: boolean;
  uploadEnabled: boolean;
  passcodeEnabled: boolean;
};

export type CosmosSnapshot = {
  nickname: string;
  permissionChoice: PermissionChoice;
  firstDateChoice: DateChoiceId | null;
  isSoftChoice: boolean;
  heartbeatMatch: string;
  confessionDate: string;
  unlockedAt: string;
};

export type CosmosMemory = {
  id: string;
  date: string;
  title: string;
  note: string;
  rotate: string;
};

export type CosmosEvent = {
  id: string;
  date: string;
  title: string;
  body: string;
  type: "chapter" | "memory" | "date";
};

export type CosmosNote = {
  id: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
};

export type CosmosPlace = {
  id: string;
  name: string;
  note: string;
  status: "planned" | "maybe" | "done";
  createdAt: string;
};

export type CosmosPhoto = {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
  createdAt: string;
  source: "mock" | "upload" | "camera";
};

export type CosmosContent = {
  memories: CosmosMemory[];
  events: CosmosEvent[];
  notes: CosmosNote[];
  places: CosmosPlace[];
  photos: CosmosPhoto[];
};

export const COSMOS_STORAGE_EVENT = "cosmos-storage-change";
export const COSMOS_SITE_MODE_KEY = "ryanKyConfess:cosmos:v1:siteMode";
export const COSMOS_CONFIG_KEY = "ryanKyConfess:cosmos:v1:config";
export const COSMOS_SNAPSHOT_KEY = "ryanKyConfess:cosmos:v1:snapshot";
export const COSMOS_CONTENT_KEY = "ryanKyConfess:cosmos:v1:content";

const LEGACY_SITE_MODE_KEY = "siteMode";
const LEGACY_CONFIG_KEY = "cosmosConfig";
const LEGACY_SNAPSHOT_KEY = "cosmosSnapshot";
const LEGACY_CONTENT_KEY = "cosmosContent";

export const COSMOS_DATE_CHOICES: Array<{ id: DateChoiceId; label: string; note: string }> = [
  { id: "dinner", label: "一起吃饭", note: "把普通晚餐变成正式开始" },
  { id: "movie", label: "看电影", note: "把故事看到灯亮以后" },
  { id: "walk", label: "散步到很晚", note: "慢慢走 慢慢靠近" },
  { id: "you", label: "你来安排", note: "我负责认真期待" }
];

export const DEFAULT_COSMOS_CONFIG: CosmosConfig = {
  siteMode: "confession",
  startDate: "2026-03-25",
  confessionDate: "2026-05-21",
  coupleTitle: "我们的秘密小宇宙",
  herNickname: "",
  firstDateChoice: null,
  debugEnabled: false,
  uploadEnabled: false,
  passcodeEnabled: false
};

export const DEFAULT_COSMOS_CONTENT: CosmosContent = {
  memories: [
    {
      id: "first-dinner",
      date: "那天傍晚",
      title: "第一次一起吃饭",
      note: "我装作很自然，其实心跳一直很大声。",
      rotate: "-2.2deg"
    },
    {
      id: "her-smile",
      date: "某个午后",
      title: "你笑起来的时候",
      note: "世界像被调低了音量，只剩下你。",
      rotate: "1.4deg"
    },
    {
      id: "late-chat",
      date: "深夜聊天",
      title: "你认真讲话",
      note: "我突然觉得，温柔原来可以这么具体。",
      rotate: "-1.1deg"
    },
    {
      id: "street-light",
      date: "普通的一天",
      title: "路灯很好看",
      note: "其实不是路灯，是你在旁边。",
      rotate: "2deg"
    }
  ],
  events: [
    {
      id: "met",
      date: "2026-03-25",
      title: "名字写进时间里",
      body: "从这一天开始，有些普通的日子变得不太一样。",
      type: "chapter"
    },
    {
      id: "chapter-01",
      date: "2026-05-21",
      title: "Chapter 01",
      body: "这一页先替我们记住，故事是从心跳同步之后开始的。",
      type: "memory"
    }
  ],
  notes: [
    {
      id: "first-note",
      body: "这里先放一张小纸条，以后慢慢把只想说给你听的话收进来。",
      isPinned: true,
      createdAt: "2026-05-21T00:00:00.000Z"
    }
  ],
  places: [
    {
      id: "first-date-place",
      name: "第一场正式约会",
      note: "先把这件事认真放进行程里。",
      status: "planned",
      createdAt: "2026-05-21T00:00:00.000Z"
    }
  ],
  photos: []
};

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function notifyStorageChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COSMOS_STORAGE_EVENT));
}

function readRaw(primaryKey: string, legacyKey?: string) {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(primaryKey) ?? (legacyKey ? storage.getItem(legacyKey) : null);
}

function readJson(primaryKey: string, legacyKey?: string): unknown {
  const raw = readRaw(primaryKey, legacyKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    notifyStorageChange();
    return true;
  } catch {
    return false;
  }
}

function writeRaw(key: string, value: string) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    notifyStorageChange();
    return true;
  } catch {
    return false;
  }
}

function removeKeys(keys: string[]) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    keys.forEach((key) => storage.removeItem(key));
    notifyStorageChange();
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSiteMode(value: unknown): value is SiteMode {
  return value === "confession" || value === "cosmos";
}

function isDateChoiceId(value: unknown): value is DateChoiceId {
  return COSMOS_DATE_CHOICES.some((choice) => choice.id === value);
}

function isPlaceStatus(value: unknown): value is CosmosPlace["status"] {
  return value === "planned" || value === "maybe" || value === "done";
}

function isEventType(value: unknown): value is CosmosEvent["type"] {
  return value === "chapter" || value === "memory" || value === "date";
}

function isPhotoSource(value: unknown): value is CosmosPhoto["source"] {
  return value === "mock" || value === "upload" || value === "camera";
}

function cleanText(value: unknown, fallback: string, maxLength = 60) {
  if (typeof value !== "string") return fallback;
  const next = value.trim().slice(0, maxLength);
  return next || fallback;
}

export function cleanDateIso(value: unknown, fallback = DEFAULT_COSMOS_CONFIG.startDate) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/[./]/g, "-");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return fallback;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(`${normalized}T00:00:00+08:00`);

  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getFullYear() !== year ||
    candidate.getMonth() + 1 !== month ||
    candidate.getDate() !== day
  ) {
    return fallback;
  }

  return normalized;
}

function cleanId(value: unknown, fallbackPrefix: string, index: number) {
  const fallback = `${fallbackPrefix}-${index + 1}`;
  if (typeof value !== "string") return fallback;
  const next = value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-").slice(0, 48);
  return next || fallback;
}

function normalizeMemory(value: unknown, index: number): CosmosMemory | null {
  if (!isRecord(value)) return null;
  return {
    id: cleanId(value.id, "memory", index),
    date: cleanText(value.date, "某一天", 40),
    title: cleanText(value.title, "一段回忆", 60),
    note: cleanText(value.note, "先把这件小事收起来。", 180),
    rotate: cleanText(value.rotate, index % 2 ? "1.2deg" : "-1.2deg", 12)
  };
}

function normalizeEvent(value: unknown, index: number): CosmosEvent | null {
  if (!isRecord(value)) return null;
  return {
    id: cleanId(value.id, "event", index),
    date: cleanDateIso(value.date, DEFAULT_COSMOS_CONFIG.startDate),
    title: cleanText(value.title, "一个新的瞬间", 70),
    body: cleanText(value.body, "这一天也值得被记住。", 220),
    type: isEventType(value.type) ? value.type : "memory"
  };
}

function normalizeNote(value: unknown, index: number): CosmosNote | null {
  if (!isRecord(value)) return null;
  return {
    id: cleanId(value.id, "note", index),
    body: cleanText(value.body, "一张小纸条。", 260),
    isPinned: value.isPinned === true,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString()
  };
}

function normalizePlace(value: unknown, index: number): CosmosPlace | null {
  if (!isRecord(value)) return null;
  return {
    id: cleanId(value.id, "place", index),
    name: cleanText(value.name, "一个想一起去的地方", 80),
    note: cleanText(value.note, "先把它放进小宇宙。", 180),
    status: isPlaceStatus(value.status) ? value.status : "maybe",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString()
  };
}

function normalizePhoto(value: unknown, index: number): CosmosPhoto | null {
  if (!isRecord(value)) return null;
  return {
    id: cleanId(value.id, "photo", index),
    imageUrl: cleanText(value.imageUrl, "", 200000),
    caption: cleanText(value.caption, "一张新的回忆", 100),
    date: cleanDateIso(value.date, DEFAULT_COSMOS_CONFIG.confessionDate),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    source: isPhotoSource(value.source) ? value.source : "upload"
  };
}

function normalizeArray<T>(value: unknown, normalizer: (item: unknown, index: number) => T | null, fallback: T[], limit: number) {
  if (!Array.isArray(value)) return fallback;
  const normalized = value.map(normalizer).filter((item): item is T => Boolean(item)).slice(0, limit);
  return normalized.length ? normalized : fallback;
}

export function normalizeCosmosConfig(value: unknown): CosmosConfig {
  if (!isRecord(value)) return DEFAULT_COSMOS_CONFIG;

  return {
    siteMode: isSiteMode(value.siteMode) ? value.siteMode : DEFAULT_COSMOS_CONFIG.siteMode,
    startDate: cleanDateIso(value.startDate, DEFAULT_COSMOS_CONFIG.startDate),
    confessionDate: cleanDateIso(value.confessionDate, DEFAULT_COSMOS_CONFIG.confessionDate),
    coupleTitle: cleanText(value.coupleTitle, DEFAULT_COSMOS_CONFIG.coupleTitle, 80),
    herNickname: cleanText(value.herNickname, DEFAULT_COSMOS_CONFIG.herNickname, 32),
    firstDateChoice: isDateChoiceId(value.firstDateChoice) ? value.firstDateChoice : null,
    debugEnabled: value.debugEnabled === true,
    uploadEnabled: value.uploadEnabled === true,
    passcodeEnabled: false
  };
}

export function normalizeCosmosSnapshot(value: unknown): CosmosSnapshot | null {
  if (!isRecord(value)) return null;

  return {
    nickname: cleanText(value.nickname, "你", 32),
    permissionChoice: value.permissionChoice === "once" || value.permissionChoice === "forever" ? value.permissionChoice : null,
    firstDateChoice: isDateChoiceId(value.firstDateChoice) ? value.firstDateChoice : null,
    isSoftChoice: value.isSoftChoice === true,
    heartbeatMatch: cleanText(value.heartbeatMatch, "99.9%", 12),
    confessionDate: cleanDateIso(value.confessionDate, DEFAULT_COSMOS_CONFIG.confessionDate),
    unlockedAt: typeof value.unlockedAt === "string" ? value.unlockedAt : new Date().toISOString()
  };
}

export function normalizeCosmosContent(value: unknown): CosmosContent {
  if (!isRecord(value)) return DEFAULT_COSMOS_CONTENT;

  return {
    memories: normalizeArray(value.memories, normalizeMemory, DEFAULT_COSMOS_CONTENT.memories, 12),
    events: normalizeArray(value.events, normalizeEvent, DEFAULT_COSMOS_CONTENT.events, 40),
    notes: normalizeArray(value.notes, normalizeNote, DEFAULT_COSMOS_CONTENT.notes, 40),
    places: normalizeArray(value.places, normalizePlace, DEFAULT_COSMOS_CONTENT.places, 30),
    photos: normalizeArray(value.photos, normalizePhoto, DEFAULT_COSMOS_CONTENT.photos, 18)
  };
}

export function readSiteMode(): SiteMode | null {
  const value = readRaw(COSMOS_SITE_MODE_KEY, LEGACY_SITE_MODE_KEY);
  return isSiteMode(value) ? value : null;
}

export function writeSiteMode(mode: SiteMode) {
  return writeRaw(COSMOS_SITE_MODE_KEY, mode);
}

export function readCosmosConfig() {
  return normalizeCosmosConfig(readJson(COSMOS_CONFIG_KEY, LEGACY_CONFIG_KEY));
}

export function writeCosmosConfig(config: CosmosConfig) {
  return writeJson(COSMOS_CONFIG_KEY, normalizeCosmosConfig(config));
}

export function readCosmosSnapshot() {
  return normalizeCosmosSnapshot(readJson(COSMOS_SNAPSHOT_KEY, LEGACY_SNAPSHOT_KEY));
}

export function writeCosmosSnapshot(snapshot: CosmosSnapshot) {
  return writeJson(COSMOS_SNAPSHOT_KEY, normalizeCosmosSnapshot(snapshot));
}

export function readCosmosContent() {
  return normalizeCosmosContent(readJson(COSMOS_CONTENT_KEY, LEGACY_CONTENT_KEY));
}

export function writeCosmosContent(content: CosmosContent) {
  return writeJson(COSMOS_CONTENT_KEY, normalizeCosmosContent(content));
}

export function unlockCosmos(snapshot: CosmosSnapshot) {
  const snapshotSaved = writeCosmosSnapshot(snapshot);
  const modeSaved = writeSiteMode("cosmos");
  return snapshotSaved && modeSaved;
}

export function clearCosmosData({ includeConfig = false }: { includeConfig?: boolean } = {}) {
  const keys = [COSMOS_SITE_MODE_KEY, COSMOS_SNAPSHOT_KEY, LEGACY_SITE_MODE_KEY, LEGACY_SNAPSHOT_KEY];
  if (includeConfig) keys.push(COSMOS_CONFIG_KEY, COSMOS_CONTENT_KEY, LEGACY_CONFIG_KEY, LEGACY_CONTENT_KEY);
  return removeKeys(keys);
}
