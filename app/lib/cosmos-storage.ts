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

export const COSMOS_STORAGE_EVENT = "cosmos-storage-change";
export const COSMOS_SITE_MODE_KEY = "ryanKyConfess:cosmos:v1:siteMode";
export const COSMOS_CONFIG_KEY = "ryanKyConfess:cosmos:v1:config";
export const COSMOS_SNAPSHOT_KEY = "ryanKyConfess:cosmos:v1:snapshot";

const LEGACY_SITE_MODE_KEY = "siteMode";
const LEGACY_CONFIG_KEY = "cosmosConfig";
const LEGACY_SNAPSHOT_KEY = "cosmosSnapshot";

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
    uploadEnabled: false,
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

export function unlockCosmos(snapshot: CosmosSnapshot) {
  const snapshotSaved = writeCosmosSnapshot(snapshot);
  const modeSaved = writeSiteMode("cosmos");
  return snapshotSaved && modeSaved;
}

export function clearCosmosData({ includeConfig = false }: { includeConfig?: boolean } = {}) {
  const keys = [COSMOS_SITE_MODE_KEY, COSMOS_SNAPSHOT_KEY, LEGACY_SITE_MODE_KEY, LEGACY_SNAPSHOT_KEY];
  if (includeConfig) keys.push(COSMOS_CONFIG_KEY, LEGACY_CONFIG_KEY);
  return removeKeys(keys);
}
