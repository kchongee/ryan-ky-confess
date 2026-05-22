import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_COSMOS_CONTENT,
  normalizeCosmosConfig,
  normalizeCosmosContent,
  normalizeCosmosSnapshot,
  type CosmosConfig,
  type CosmosContent,
  type CosmosEvent,
  type CosmosMemory,
  type CosmosNote,
  type CosmosPhoto,
  type CosmosPlace,
  type CosmosSnapshot
} from "@/app/lib/cosmos-storage";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminToken = process.env.COSMOS_ADMIN_TOKEN;

function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase is not configured");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseServiceKey,
      authorization: `Bearer ${supabaseServiceKey}`,
      "content-type": "application/json",
      ...init.headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function guardAdmin(request: NextRequest) {
  if (!adminToken) return false;
  return request.headers.get("x-cosmos-admin-token") === adminToken;
}

function toConfigRow(config: CosmosConfig) {
  return {
    id: "default",
    site_mode: config.siteMode,
    start_date: config.startDate,
    confession_date: config.confessionDate,
    couple_title: config.coupleTitle,
    her_nickname: config.herNickname || null,
    first_date_choice: config.firstDateChoice,
    upload_enabled: config.uploadEnabled,
    passcode_enabled: config.passcodeEnabled,
    debug_enabled: config.debugEnabled,
    updated_at: new Date().toISOString()
  };
}

function fromConfigRow(row: Record<string, unknown> | null) {
  return normalizeCosmosConfig(
    row
      ? {
          siteMode: row.site_mode,
          startDate: row.start_date,
          confessionDate: row.confession_date,
          coupleTitle: row.couple_title,
          herNickname: row.her_nickname,
          firstDateChoice: row.first_date_choice,
          uploadEnabled: row.upload_enabled,
          passcodeEnabled: row.passcode_enabled,
          debugEnabled: row.debug_enabled
        }
      : null
  );
}

function toSnapshotRow(snapshot: CosmosSnapshot | null) {
  if (!snapshot) return null;
  return {
    id: "default",
    nickname: snapshot.nickname,
    permission_choice: snapshot.permissionChoice,
    first_date_choice: snapshot.firstDateChoice,
    is_soft_choice: snapshot.isSoftChoice,
    heartbeat_match: snapshot.heartbeatMatch,
    confession_date: snapshot.confessionDate,
    unlocked_at: snapshot.unlockedAt
  };
}

function fromSnapshotRow(row: Record<string, unknown> | null) {
  return normalizeCosmosSnapshot(
    row
      ? {
          nickname: row.nickname,
          permissionChoice: row.permission_choice,
          firstDateChoice: row.first_date_choice,
          isSoftChoice: row.is_soft_choice,
          heartbeatMatch: row.heartbeat_match,
          confessionDate: row.confession_date,
          unlockedAt: row.unlocked_at
        }
      : null
  );
}

function toMemoryRow(memory: CosmosMemory, index: number) {
  return {
    id: memory.id,
    date_label: memory.date,
    title: memory.title,
    note: memory.note,
    rotate: memory.rotate,
    sort_order: index,
    updated_at: new Date().toISOString()
  };
}

function fromMemoryRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    date: row.date_label,
    title: row.title,
    note: row.note,
    rotate: row.rotate
  };
}

function toEventRow(event: CosmosEvent) {
  return {
    id: event.id,
    date: event.date,
    title: event.title,
    body: event.body,
    type: event.type
  };
}

function toNoteRow(note: CosmosNote) {
  return {
    id: note.id,
    body: note.body,
    is_pinned: note.isPinned,
    created_at: note.createdAt
  };
}

function toPlaceRow(place: CosmosPlace) {
  return {
    id: place.id,
    name: place.name,
    note: place.note,
    status: place.status,
    created_at: place.createdAt
  };
}

function toPhotoRow(photo: CosmosPhoto) {
  return {
    id: photo.id,
    image_url: photo.imageUrl,
    caption: photo.caption,
    date: photo.date,
    created_at: photo.createdAt,
    source: photo.source
  };
}

async function replaceTable(table: string, rows: unknown[]) {
  await supabaseFetch(`${table}?id=neq.__never__`, { method: "DELETE" });
  if (!rows.length) return;
  await supabaseFetch(table, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows)
  });
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return json({ configured: false }, 503);
  }

  try {
    const [configRows, snapshotRows, memoryRows, eventRows, noteRows, placeRows, photoRows] = await Promise.all([
      supabaseFetch("site_config?id=eq.default&select=*"),
      supabaseFetch("cosmos_snapshots?id=eq.default&select=*"),
      supabaseFetch("memories?select=*&order=sort_order.asc"),
      supabaseFetch("events?select=*&order=date.asc"),
      supabaseFetch("notes?select=*&order=created_at.desc"),
      supabaseFetch("places?select=*&order=created_at.desc"),
      supabaseFetch("photos?select=*&order=created_at.desc")
    ]);

    const content = normalizeCosmosContent({
      memories: Array.isArray(memoryRows) && memoryRows.length ? memoryRows.map(fromMemoryRow) : DEFAULT_COSMOS_CONTENT.memories,
      events: Array.isArray(eventRows) ? eventRows : [],
      notes: Array.isArray(noteRows)
        ? noteRows.map((note) => ({
            id: note.id,
            body: note.body,
            isPinned: note.is_pinned,
            createdAt: note.created_at
          }))
        : [],
      places: Array.isArray(placeRows) ? placeRows : [],
      photos: Array.isArray(photoRows)
        ? photoRows.map((photo) => ({
            id: photo.id,
            imageUrl: photo.image_url,
            caption: photo.caption,
            date: photo.date,
            createdAt: photo.created_at,
            source: photo.source
          }))
        : []
    });

    return json({
      configured: true,
      config: fromConfigRow(Array.isArray(configRows) ? configRows[0] : null),
      snapshot: fromSnapshotRow(Array.isArray(snapshotRows) ? snapshotRows[0] : null),
      content
    });
  } catch (error) {
    return json({ configured: true, error: error instanceof Error ? error.message : "Unknown sync error" }, 500);
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return json({ configured: false }, 503);
  if (!guardAdmin(request)) return json({ error: "Admin token required" }, 401);

  try {
    const body = (await request.json()) as {
      config?: unknown;
      content?: unknown;
      snapshot?: unknown;
    };
    const config = normalizeCosmosConfig(body.config);
    const content = normalizeCosmosContent(body.content);
    const snapshot = normalizeCosmosSnapshot(body.snapshot);
    const snapshotRow = toSnapshotRow(snapshot);

    await Promise.all([
      supabaseFetch("site_config", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(toConfigRow(config))
      }),
      snapshotRow
        ? supabaseFetch("cosmos_snapshots", {
            method: "POST",
            headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify(snapshotRow)
          })
        : Promise.resolve()
    ]);

    await Promise.all([
      replaceTable("memories", content.memories.map(toMemoryRow)),
      replaceTable("events", content.events.map(toEventRow)),
      replaceTable("notes", content.notes.map(toNoteRow)),
      replaceTable("places", content.places.map(toPlaceRow)),
      replaceTable("photos", content.photos.map(toPhotoRow))
    ]);

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown sync error" }, 500);
  }
}
