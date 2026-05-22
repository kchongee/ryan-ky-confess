"use client";

import Link from "next/link";
import { ArrowLeft, Check, Plus, RefreshCw, Save, Shield, Sparkles, Trash2 } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  clearCosmosData,
  COSMOS_DATE_CHOICES,
  DEFAULT_COSMOS_CONTENT,
  DEFAULT_COSMOS_CONFIG,
  readCosmosContent,
  readCosmosConfig,
  readCosmosSnapshot,
  readSiteMode,
  writeCosmosContent,
  writeCosmosConfig,
  writeCosmosSnapshot,
  writeSiteMode,
  type CosmosConfig,
  type CosmosContent,
  type CosmosEvent,
  type CosmosMemory,
  type CosmosNote,
  type CosmosPlace,
  type CosmosSnapshot,
  type DateChoiceId,
  type SiteMode
} from "../lib/cosmos-storage";

const enableRemoteAdmin = process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true";

function isLocalAdminHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="noise min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(255,138,191,.18),transparent_24rem),linear-gradient(135deg,#050817,#111937_52%,#261733)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}

function AdminUnavailable() {
  return (
    <AdminShell>
      <div className="glass mx-auto mt-20 max-w-xl rounded-[28px] p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[#161126]">
          <Shield size={18} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Admin 没有公开开启</h1>
        <p className="mt-3 leading-7 text-white/58">这个入口默认只在 localhost 可用。要临时远端调试，可以设置 `NEXT_PUBLIC_ENABLE_ADMIN=true` 后重新部署。</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#fff7ee] px-5 text-sm font-medium text-[#121123]">
          回到页面
        </Link>
      </div>
    </AdminShell>
  );
}

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [config, setConfig] = useState<CosmosConfig>(DEFAULT_COSMOS_CONFIG);
  const [content, setContent] = useState<CosmosContent>(DEFAULT_COSMOS_CONTENT);
  const [siteMode, setSiteMode] = useState<SiteMode>(DEFAULT_COSMOS_CONFIG.siteMode);
  const [snapshot, setSnapshot] = useState<CosmosSnapshot | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [placeDraft, setPlaceDraft] = useState({ name: "", note: "" });
  const [eventDraft, setEventDraft] = useState({ date: DEFAULT_COSMOS_CONFIG.confessionDate, title: "", body: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const canUseAdmin = enableRemoteAdmin || isLocalAdminHost(window.location.hostname);
    setAllowed(canUseAdmin);

    if (canUseAdmin) {
      const storedConfig = readCosmosConfig();
      setConfig(storedConfig);
      setContent(readCosmosContent());
      setSiteMode(readSiteMode() ?? storedConfig.siteMode);
      setSnapshot(readCosmosSnapshot());
    }

    setReady(true);
  }, []);

  const selectedDate = useMemo(() => {
    const choiceId = snapshot?.firstDateChoice ?? config.firstDateChoice;
    return COSMOS_DATE_CHOICES.find((choice) => choice.id === choiceId);
  }, [config.firstDateChoice, snapshot?.firstDateChoice]);

  const updateConfig = <Key extends keyof CosmosConfig>(key: Key, value: CosmosConfig[Key]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const updateMemory = <Key extends keyof CosmosMemory>(id: string, key: Key, value: CosmosMemory[Key]) => {
    setContent((current) => ({
      ...current,
      memories: current.memories.map((memory) => (memory.id === id ? { ...memory, [key]: value } : memory))
    }));
  };

  const addNote = () => {
    const body = noteDraft.trim();
    if (!body) return;
    const nextNote: CosmosNote = {
      id: makeLocalId("note"),
      body,
      isPinned: false,
      createdAt: new Date().toISOString()
    };
    setContent((current) => ({ ...current, notes: [nextNote, ...current.notes].slice(0, 40) }));
    setNoteDraft("");
  };

  const removeNote = (id: string) => {
    setContent((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }));
  };

  const togglePinnedNote = (id: string) => {
    setContent((current) => ({
      ...current,
      notes: current.notes.map((note) => (note.id === id ? { ...note, isPinned: !note.isPinned } : note))
    }));
  };

  const addPlace = () => {
    const name = placeDraft.name.trim();
    if (!name) return;
    const nextPlace: CosmosPlace = {
      id: makeLocalId("place"),
      name,
      note: placeDraft.note.trim() || "想和你一起去。",
      status: "maybe",
      createdAt: new Date().toISOString()
    };
    setContent((current) => ({ ...current, places: [nextPlace, ...current.places].slice(0, 30) }));
    setPlaceDraft({ name: "", note: "" });
  };

  const removePlace = (id: string) => {
    setContent((current) => ({ ...current, places: current.places.filter((place) => place.id !== id) }));
  };

  const addEvent = () => {
    const title = eventDraft.title.trim();
    if (!title) return;
    const nextEvent: CosmosEvent = {
      id: makeLocalId("event"),
      date: eventDraft.date,
      title,
      body: eventDraft.body.trim() || "这一天也值得被记住。",
      type: "memory"
    };
    setContent((current) => ({ ...current, events: [nextEvent, ...current.events].slice(0, 40) }));
    setEventDraft({ date: config.confessionDate, title: "", body: "" });
  };

  const removeEvent = (id: string) => {
    setContent((current) => ({ ...current, events: current.events.filter((event) => event.id !== id) }));
  };

  const saveCurrentState = () => {
    const nextConfig: CosmosConfig = {
      ...config,
      siteMode,
      uploadEnabled: false,
      passcodeEnabled: false
    };
    const configOk = writeCosmosConfig(nextConfig);
    const contentOk = writeCosmosContent(content);
    const modeOk = writeSiteMode(siteMode);
    let snapshotOk = true;

    if (snapshot) {
      snapshotOk = writeCosmosSnapshot({
        ...snapshot,
        nickname: nextConfig.herNickname || snapshot.nickname,
        firstDateChoice: nextConfig.firstDateChoice ?? snapshot.firstDateChoice,
        confessionDate: nextConfig.confessionDate
      });
    }

    setConfig(nextConfig);
    setStatus(configOk && contentOk && modeOk && snapshotOk ? "已保存到这个浏览器" : "保存失败，请检查浏览器是否阻止 localStorage");
  };

  const saveConfig = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveCurrentState();
  };

  const resetSafe = () => {
    const shouldReset = window.confirm("这会清掉本机预览状态，并把 admin config 回到安全默认值。确定吗？");
    if (!shouldReset) return;

    clearCosmosData({ includeConfig: true });
    setConfig(DEFAULT_COSMOS_CONFIG);
    setContent(DEFAULT_COSMOS_CONTENT);
    setSiteMode(DEFAULT_COSMOS_CONFIG.siteMode);
    setSnapshot(null);
    setStatus("已回到安全默认值");
  };

  if (!ready) {
    return (
      <AdminShell>
        <div className="glass mx-auto mt-20 max-w-xl rounded-[28px] p-6 text-center text-white/62">读取本机设置中</div>
      </AdminShell>
    );
  }

  if (!allowed) return <AdminUnavailable />;

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-white/52 transition hover:text-white">
            <ArrowLeft size={16} />
            回到网站
          </Link>
          <p className="text-sm text-white/48">本机控制台</p>
          <h1 className="mt-2 text-[clamp(2rem,8vw,4.5rem)] font-semibold leading-tight">小宇宙 Admin</h1>
        </div>
        <button
          type="button"
          onClick={resetSafe}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.07] px-5 text-sm text-white/78 transition hover:bg-white/12"
        >
          <RefreshCw size={16} />
          安全重置
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="grid gap-6">
          <form onSubmit={saveConfig} className="glass rounded-[28px] p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/48">站点模式</p>
              <h2 className="mt-1 text-2xl font-semibold">控制她现在看到哪里</h2>
            </div>
            {status ? <p className="rounded-full bg-white/[0.08] px-3 py-1 text-xs text-white/62">{status}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["confession", "cosmos"] as SiteMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSiteMode(mode)}
                className={`min-h-14 rounded-2xl border px-4 text-sm transition ${
                  siteMode === mode ? "border-[#ffd6e7]/70 bg-[#ffd6e7]/16 text-white" : "border-white/12 bg-white/[0.05] text-white/56 hover:bg-white/[0.09]"
                }`}
              >
                {mode === "confession" ? "告白模式" : "小宇宙模式"}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-white/58">
              小宇宙标题
              <input
                value={config.coupleTitle}
                onChange={(event) => updateConfig("coupleTitle", event.target.value)}
                className="min-h-12 rounded-2xl border border-white/12 bg-white/[0.07] px-4 text-white outline-none focus:border-white/34"
              />
            </label>
            <label className="grid gap-2 text-sm text-white/58">
              私密称呼
              <input
                value={config.herNickname}
                onChange={(event) => updateConfig("herNickname", event.target.value)}
                placeholder="比如 小朋友"
                className="min-h-12 rounded-2xl border border-white/12 bg-white/[0.07] px-4 text-white outline-none placeholder:text-white/30 focus:border-white/34"
              />
            </label>
            <label className="grid gap-2 text-sm text-white/58">
              认识日期
              <input
                type="date"
                value={config.startDate}
                onChange={(event) => updateConfig("startDate", event.target.value)}
                className="min-h-12 rounded-2xl border border-white/12 bg-white/[0.07] px-4 text-white outline-none focus:border-white/34"
              />
            </label>
            <label className="grid gap-2 text-sm text-white/58">
              告白日期
              <input
                type="date"
                value={config.confessionDate}
                onChange={(event) => updateConfig("confessionDate", event.target.value)}
                className="min-h-12 rounded-2xl border border-white/12 bg-white/[0.07] px-4 text-white outline-none focus:border-white/34"
              />
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm text-white/58">
            第一场正式约会
            <select
              value={config.firstDateChoice ?? ""}
              onChange={(event) => updateConfig("firstDateChoice", (event.target.value || null) as DateChoiceId | null)}
              className="min-h-12 rounded-2xl border border-white/12 bg-[#12162c] px-4 text-white outline-none focus:border-white/34"
            >
              <option value="">跟随她的选择</option>
              {COSMOS_DATE_CHOICES.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-sm text-white/72">
            显示本机 reset/debug 工具
            <input
              type="checkbox"
              checked={config.debugEnabled}
              onChange={(event) => updateConfig("debugEnabled", event.target.checked)}
              className="h-5 w-5 accent-[#ffd6e7]"
            />
          </label>

          <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.045] p-4">
            <p className="text-sm font-medium text-white/76">未来功能已收起</p>
            <p className="mt-2 text-sm leading-6 text-white/48">上传照片和密码保护会放到 Supabase 长期版。当前 admin 不显示这些开关，也会固定保存为关闭，避免误以为已经上线。</p>
          </div>

          <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#fff7ee] px-6 text-sm font-medium text-[#121123] shadow-[0_0_38px_rgba(255,138,191,.22)]">
            <Save size={16} />
            保存设置
          </button>
          </form>

          <section className="glass rounded-[28px] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm text-white/48">本地内容管理</p>
              <h2 className="mt-1 text-2xl font-semibold">先把小宇宙撑起来</h2>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/12 bg-white/[0.045] p-4">
                <p className="mb-3 text-sm font-medium text-white/72">回忆卡片</p>
                <div className="grid gap-3">
                  {content.memories.map((memory) => (
                    <div key={memory.id} className="grid gap-2 rounded-2xl bg-white/[0.05] p-3 sm:grid-cols-[.8fr_1fr]">
                      <input
                        value={memory.title}
                        onChange={(event) => updateMemory(memory.id, "title", event.target.value)}
                        className="min-h-11 rounded-xl border border-white/12 bg-white/[0.07] px-3 text-sm text-white outline-none focus:border-white/34"
                      />
                      <input
                        value={memory.note}
                        onChange={(event) => updateMemory(memory.id, "note", event.target.value)}
                        className="min-h-11 rounded-xl border border-white/12 bg-white/[0.07] px-3 text-sm text-white outline-none focus:border-white/34"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/[0.045] p-4">
                <p className="mb-3 text-sm font-medium text-white/72">小纸条</p>
                <div className="flex gap-2">
                  <input
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="写一张以后会被她看到的小纸条"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.07] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/34"
                  />
                  <button type="button" onClick={addNote} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff7ee] text-[#121123]">
                    <Plus size={17} />
                  </button>
                </div>
                <div className="mt-3 grid gap-2">
                  {content.notes.map((note) => (
                    <div key={note.id} className="flex items-start gap-2 rounded-xl bg-white/[0.05] p-3 text-sm text-white/68">
                      <button type="button" onClick={() => togglePinnedNote(note.id)} className={`mt-0.5 rounded-full px-2 py-1 text-xs ${note.isPinned ? "bg-[#ffd6e7] text-[#171225]" : "bg-white/[0.08] text-white/52"}`}>
                        置顶
                      </button>
                      <p className="min-w-0 flex-1 leading-6">{note.body}</p>
                      <button type="button" onClick={() => removeNote(note.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/54">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/12 bg-white/[0.045] p-4">
                  <p className="mb-3 text-sm font-medium text-white/72">想一起去的地方</p>
                  <div className="grid gap-2">
                    <input
                      value={placeDraft.name}
                      onChange={(event) => setPlaceDraft((current) => ({ ...current, name: event.target.value }))}
                      placeholder="地方名字"
                      className="min-h-11 rounded-xl border border-white/12 bg-white/[0.07] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/34"
                    />
                    <input
                      value={placeDraft.note}
                      onChange={(event) => setPlaceDraft((current) => ({ ...current, note: event.target.value }))}
                      placeholder="为什么想去"
                      className="min-h-11 rounded-xl border border-white/12 bg-white/[0.07] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/34"
                    />
                    <button type="button" onClick={addPlace} className="min-h-11 rounded-full bg-white/[0.09] text-sm text-white/76 transition hover:bg-white/[0.14]">
                      加进小宇宙
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {content.places.map((place) => (
                      <div key={place.id} className="flex items-start gap-2 rounded-xl bg-white/[0.05] p-3 text-sm text-white/64">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">{place.name}</p>
                          <p className="mt-1 leading-5">{place.note}</p>
                        </div>
                        <button type="button" onClick={() => removePlace(place.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/54">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/12 bg-white/[0.045] p-4">
                  <p className="mb-3 text-sm font-medium text-white/72">时间线</p>
                  <div className="grid gap-2">
                    <input
                      type="date"
                      value={eventDraft.date}
                      onChange={(event) => setEventDraft((current) => ({ ...current, date: event.target.value }))}
                      className="min-h-11 rounded-xl border border-white/12 bg-white/[0.07] px-3 text-sm text-white outline-none focus:border-white/34"
                    />
                    <input
                      value={eventDraft.title}
                      onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="发生了什么"
                      className="min-h-11 rounded-xl border border-white/12 bg-white/[0.07] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/34"
                    />
                    <input
                      value={eventDraft.body}
                      onChange={(event) => setEventDraft((current) => ({ ...current, body: event.target.value }))}
                      placeholder="那天想记住的细节"
                      className="min-h-11 rounded-xl border border-white/12 bg-white/[0.07] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/34"
                    />
                    <button type="button" onClick={addEvent} className="min-h-11 rounded-full bg-white/[0.09] text-sm text-white/76 transition hover:bg-white/[0.14]">
                      加到时间线
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {content.events.map((event) => (
                      <div key={event.id} className="flex items-start gap-2 rounded-xl bg-white/[0.05] p-3 text-sm text-white/64">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white/38">{event.date}</p>
                          <p className="mt-1 font-medium text-white">{event.title}</p>
                        </div>
                        <button type="button" onClick={() => removeEvent(event.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/54">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={saveCurrentState}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#fff7ee] px-6 text-sm font-medium text-[#121123] shadow-[0_0_38px_rgba(255,138,191,.22)]"
            >
              <Save size={16} />
              保存内容
            </button>
          </section>
        </div>

        <aside className="grid gap-6">
          <section className="glass rounded-[28px] p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-white/52">
              <Sparkles size={16} />
              当前小宇宙
            </div>
            <h2 className="text-2xl font-semibold">{config.coupleTitle}</h2>
            <div className="mt-5 grid gap-3 text-sm text-white/62">
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-white/42">模式</p>
                <p className="mt-1 text-white">{siteMode === "cosmos" ? "小宇宙模式" : "告白模式"}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-white/42">称呼</p>
                <p className="mt-1 text-white">{snapshot?.nickname || config.herNickname || "还没有解锁"}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-white/42">第一场约会</p>
                <p className="mt-1 text-white">{selectedDate?.label ?? "跟随她的选择"}</p>
              </div>
            </div>
          </section>

          <section className="glass rounded-[28px] p-5 sm:p-6">
            <p className="text-sm text-white/48">上线前检查</p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-white/62">
              {[
                "Admin 设置只存在这个浏览器，不会同步到她的手机",
                "真正给她扫码时保持告白模式，点我愿意后她的手机会自己开启小宇宙",
                "分享前关掉 debug 工具",
                "音乐文件需要自己放进 public/music，并确认有使用权限",
                "远端 admin 默认关闭，不要把它当成安全后台"
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-white/[0.05] p-3">
                  <Check size={16} className="mt-1 shrink-0 text-[#ffd6e7]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
