"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, Heart, LockKeyhole, Sparkles, UserRound, Volume2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  clearCosmosData,
  COSMOS_DATE_CHOICES,
  DEFAULT_COSMOS_CONTENT,
  DEFAULT_COSMOS_CONFIG,
  readCosmosContent,
  readCosmosConfig,
  readCosmosSnapshot,
  readSiteMode,
  unlockCosmos,
  writeSiteMode,
  type CosmosConfig,
  type CosmosContent,
  type CosmosSnapshot,
  type DateChoiceId,
  type PermissionChoice,
  type SiteMode
} from "./lib/cosmos-storage";

type SceneKey = "opening" | "letter" | "memories" | "confession" | "ending";
type EndingStage = "idle" | "permission" | "heartbeat" | "nickname" | "keepsake" | "date" | "couple";

const soundtrack: Record<SceneKey, { title: string; mood: string; src: string; notes: number[] }> = {
  opening: {
    title: "水星记",
    mood: "扫码进入",
    src: "/music/01-shui-xing-ji.mp3",
    notes: [196, 246.94, 293.66, 369.99]
  },
  letter: {
    title: "水星记",
    mood: "悄悄靠近",
    src: "/music/01-shui-xing-ji.mp3",
    notes: [196, 246.94, 293.66, 369.99]
  },
  memories: {
    title: "如果可以",
    mood: "回忆照片墙",
    src: "/music/02-ru-guo-ke-yi.mp3",
    notes: [220, 277.18, 329.63, 440]
  },
  confession: {
    title: "唯一",
    mood: "真正告白",
    src: "/music/03-wei-yi.mp3",
    notes: [207.65, 261.63, 329.63, 392]
  },
  ending: {
    title: "告白气球",
    mood: "成功 Ending",
    src: "/music/04-gao-bai-qi-qiu.mp3",
    notes: [261.63, 329.63, 392, 523.25]
  }
};

const confessionLines = [
  "其实我喜欢你很久了。",
  "久到连我自己都不知道是从什么时候开始。",
  "可能是你笑的时候。",
  "可能是你认真讲话的时候。",
  "又或者……",
  "只是因为，那个人是你。"
];

const permissionItems = ["每天想你", "看到好看的东西想发给你", "晚安认真说", "见到你还是会紧张", "偷偷把你放进未来计划"];
const dateChoices = COSMOS_DATE_CHOICES;
const HEARTBEAT_COMPLETE_DELAY_MS = 2600;
const START_DATE_ISO = "2026-03-25";

function parseStableDate(value: string) {
  const fallback = new Date(`${START_DATE_ISO}T00:00:00+08:00`);
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

  return candidate;
}

function formatDateDisplay(value: string) {
  return value.replace(/-/g, ".");
}

function Stars() {
  const points = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(780 * 3);
    for (let i = 0; i < 780; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.016 + state.pointer.x * 0.035;
    points.current.rotation.x = state.pointer.y * 0.03;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#fff4de" size={0.034} sizeAttenuation transparent opacity={0.82} />
    </points>
  );
}

function Starfield() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 7], fov: 68 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#070b1d"]} />
        <Stars />
      </Canvas>
    </div>
  );
}

function Typewriter() {
  const [visible, setVisible] = useState<string[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const line = confessionLines[lineIndex];
      if (!line) return;
      setCurrent(line.slice(0, charIndex + 1));
      charIndex += 1;

      if (charIndex < line.length) {
        timer = setTimeout(tick, 72);
      } else {
        timer = setTimeout(() => {
          setVisible((items) => [...items, line]);
          setCurrent("");
          lineIndex += 1;
          charIndex = 0;
          timer = setTimeout(tick, 430);
        }, 760);
      }
    };

    timer = setTimeout(tick, 520);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto flex min-h-[22rem] max-w-3xl flex-col justify-center gap-4 px-5 text-[clamp(1.35rem,7vw,3.4rem)] font-light leading-[1.45] tracking-normal sm:gap-5 sm:px-6">
      {visible.map((line) => (
        <motion.p
          key={line}
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="soft-text"
        >
          {line}
        </motion.p>
      ))}
      {current ? (
        <p className="soft-text">
          {current}
          <span className="ml-1 inline-block h-8 w-[2px] translate-y-1 animate-pulse bg-[#fff7ee]" />
        </p>
      ) : null}
    </div>
  );
}

function LoveTimer({ startDateIso = START_DATE_ISO }: { startDateIso?: string }) {
  const startDate = useMemo(() => parseStableDate(startDateIso), [startDateIso]);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = now ? Math.max(0, now.getTime() - startDate.getTime()) : 0;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className="glass mx-auto grid max-w-3xl grid-cols-4 gap-2 rounded-[24px] p-3 text-center sm:rounded-[28px] sm:p-5">
      {[
        ["天", days],
        ["小时", hours],
        ["分钟", minutes],
        ["秒", seconds]
      ].map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-2xl bg-white/[0.06] px-1 py-3 sm:px-2 sm:py-4">
          <div className="text-[clamp(1.25rem,7vw,2.5rem)] font-semibold leading-none">{now ? String(value).padStart(2, "0") : "--"}</div>
          <div className="mt-1 text-[0.68rem] text-white/58 sm:text-sm">{label}</div>
        </div>
      ))}
    </div>
  );
}

function useSceneObserver(setScene: (scene: SceneKey) => void) {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const scene = visible?.target.getAttribute("data-scene") as SceneKey | null;
        if (scene) setScene(scene);
      },
      { threshold: [0.42, 0.62, 0.78], rootMargin: "-12% 0px -18% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [setScene]);
}

function BackgroundMusic({ scene }: { scene: SceneKey }) {
  const htmlAudio = useRef<HTMLAudioElement | null>(null);
  const synthContext = useRef<AudioContext | null>(null);
  const gain = useRef<GainNode | null>(null);
  const oscillators = useRef<OscillatorNode[]>([]);
  const [playing, setPlaying] = useState(false);
  const track = soundtrack[scene];

  const stopSynth = () => {
    oscillators.current.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        return;
      }
    });
    oscillators.current = [];
  };

  const playSynth = async () => {
    stopSynth();
    const context = synthContext.current ?? new AudioContext();
    synthContext.current = context;
    if (context.state === "suspended") await context.resume();
    gain.current = context.createGain();
    gain.current.gain.value = scene === "ending" ? 0.052 : 0.035;
    gain.current.connect(context.destination);

    oscillators.current = track.notes.map((freq, index) => {
      const osc = context.createOscillator();
      const noteGain = context.createGain();
      osc.type = index % 2 ? "triangle" : "sine";
      osc.frequency.value = freq;
      noteGain.gain.value = 0.22 / (index + 1);
      osc.connect(noteGain).connect(gain.current!);
      osc.start(context.currentTime + index * 0.08);
      return osc;
    });
  };

  const start = async (fromAutoplay = false) => {
    const audio = htmlAudio.current;
    if (!audio) return;
    stopSynth();
    audio.volume = scene === "ending" ? 0.48 : 0.36;
    audio.loop = true;
    audio.src = track.src;

    try {
      await audio.play();
    } catch {
      if (fromAutoplay) return;
      await playSynth();
    }

    setPlaying(true);
  };

  const stopPlayback = () => {
    htmlAudio.current?.pause();
    stopSynth();
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    void start();
  }, [scene]);

  useEffect(() => {
    void start(true);

    const unlock = () => {
      if (!playing) void start();
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => () => stopPlayback(), []);

  return <audio ref={htmlAudio} preload="auto" aria-hidden="true" onError={() => playing && void playSynth()} />;
}

function PermissionStage({
  onAllowOnce,
  onAllowForever
}: {
  onAllowOnce: () => void;
  onAllowForever: () => void;
}) {
  return (
    <motion.div
      data-scene="ending"
      initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="glass mx-auto mt-10 max-w-xl rounded-[28px] p-5 text-left sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#171225]">
          <LockKeyhole size={18} />
        </div>
        <div>
          <p className="text-sm text-white/48">正式喜欢权限</p>
          <h3 className="text-xl font-semibold">允许我正式喜欢你吗</h3>
        </div>
      </div>
      <div className="grid gap-2">
        {permissionItems.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/78">
            <Check size={16} className="shrink-0 text-[#ffd6e7]" />
            {item}
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button onClick={onAllowOnce} className="glass min-h-12 rounded-full px-5 py-3 text-sm text-white/82 transition hover:bg-white/16">
          允许一次
        </button>
        <button onClick={onAllowForever} className="min-h-12 rounded-full bg-[#fff7ee] px-5 py-3 text-sm font-medium text-[#121123] shadow-[0_0_38px_rgba(255,138,191,.22)] transition hover:scale-[1.02]">
          永远允许
        </button>
      </div>
    </motion.div>
  );
}

function HeartbeatStage({
  count,
  permissionChoice,
  isSoftChoice,
  onBeat,
  onContinue
}: {
  count: number;
  permissionChoice: PermissionChoice;
  isSoftChoice: boolean;
  onBeat: () => void;
  onContinue: () => void;
}) {
  const progress = Math.min(count, 5);
  const complete = progress >= 5;
  const heartScale = 1 + progress * 0.16;
  const intro = isSoftChoice
    ? "一点点也很好。那让我确认一下，这不是梦。"
    : permissionChoice === "once"
      ? "一次也够我开心很久。先让我确认一下，这不是梦。"
      : "权限收到。现在，让心跳替我确认一次。";

  useEffect(() => {
    if (!complete) return;
    const timer = window.setTimeout(onContinue, HEARTBEAT_COMPLETE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [complete, onContinue]);

  return (
    <motion.div
      data-scene="ending"
      initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="glass mx-auto mt-10 max-w-xl rounded-[28px] p-5 text-center sm:p-6"
    >
      <p className="text-sm leading-6 text-white/54">{intro}</p>
      <div className="pointer-events-none mx-auto mt-6 grid max-w-56 grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className={`h-1.5 rounded-full transition ${index < progress ? "bg-[#ffd6e7]" : "bg-white/14"}`} />
        ))}
      </div>
      <motion.svg
        role="button"
        tabIndex={0}
        viewBox="0 0 200 200"
        onClick={() => {
          if (!complete) onBeat();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!complete) onBeat();
          }
        }}
        animate={{ scale: progress ? [1, 1.035, 1] : 1 }}
        transition={{ duration: 0.34 }}
        className="mx-auto mt-6 h-44 w-44 cursor-pointer overflow-visible outline-none drop-shadow-[0_0_70px_rgba(255,138,191,.28)] focus-visible:drop-shadow-[0_0_46px_rgba(255,247,238,.46)]"
        aria-label={complete ? "心跳同步完成" : "同步心跳"}
      >
        <defs>
          <filter id="heartGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 1  0 0.38 0 0 0.48  0 0 0.52 0 0.7  0 0 0 1 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          key={progress}
          d="M100 154 C92 145 61 121 51 98 C43 79 53 61 72 59 C84 58 94 65 100 77 C106 65 116 58 128 59 C147 61 157 79 149 98 C139 121 108 145 100 154 Z"
          fill="#ffd6e7"
          filter="url(#heartGlow)"
          animate={{ scale: [heartScale * 0.92, heartScale * 1.1, heartScale] }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      </motion.svg>
      {complete ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <p className="text-lg font-semibold">检测到心跳同步。</p>
          <p className="mt-2 text-sm text-white/58">匹配度：99.9%</p>
          <p className="mt-5 text-sm text-white/48">正在解锁下一步。</p>
        </motion.div>
      ) : (
        <p className="mt-5 text-sm text-white/50">点一下心形，让我确认这不是梦。</p>
      )}
    </motion.div>
  );
}

function NicknameStage({
  nicknameInput,
  onNicknameChange,
  onSubmit
}: {
  nicknameInput: string;
  onNicknameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <motion.form
      data-scene="ending"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="glass mx-auto mt-10 max-w-xl rounded-[28px] p-5 text-left sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#171225]">
          <UserRound size={18} />
        </div>
        <div>
          <p className="text-sm text-white/48">解锁私密称呼</p>
          <h3 className="text-xl font-semibold">那我以后可以怎么叫你</h3>
        </div>
      </div>
      <div className="relative">
        <input
          value={nicknameInput}
          onChange={(event) => onNicknameChange(event.target.value)}
          placeholder="比如：小朋友、宝宝、你的名字……"
          className="min-h-14 w-full rounded-2xl border border-white/12 bg-white/[0.07] py-3 pl-4 pr-14 text-base text-white outline-none placeholder:text-white/34 focus:border-white/34"
        />
        <button
          type="submit"
          aria-label="开启双人模式"
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#fff7ee] text-[#121123] shadow-[0_0_28px_rgba(255,138,191,.2)] transition hover:scale-[1.04]"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.form>
  );
}

function CoupleStage({
  nickname,
  isSoftChoice,
  dateChoice
}: {
  nickname: string;
  isSoftChoice: boolean;
  dateChoice: DateChoiceId | null;
}) {
  const displayName = nickname || "你";
  const selectedDate = dateChoices.find((choice) => choice.id === dateChoice);

  return (
    <motion.div
      data-scene="ending"
      initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="glass mx-auto mt-10 max-w-xl rounded-[28px] p-5 text-left sm:p-6"
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-sm text-white/72">
        <Sparkles size={15} />
        双人模式已开启
      </div>
      <h3 className="soft-text text-2xl font-semibold sm:text-3xl">给我们的秘密页面</h3>
      <p className="mt-4 leading-8 text-white/68">
        好，那以后这里就只属于我和 {displayName}。
      </p>
      <p className="mt-3 leading-8 text-white/62">
        {isSoftChoice
          ? "一点点也很好，我会把剩下的，慢慢变成很多很多。"
          : "从现在开始，这不再是一封我一个人的情书，是我们故事的第一页。"}
      </p>
      {selectedDate ? (
        <div className="mt-5 rounded-2xl bg-white/[0.06] p-4">
          <p className="text-sm text-white/45">第一场正式约会</p>
          <p className="mt-1 text-lg font-semibold text-white">{selectedDate.label}</p>
          <p className="mt-2 text-sm leading-6 text-white/58">{selectedDate.note}</p>
        </div>
      ) : null}
    </motion.div>
  );
}

function KeepsakeStage({
  nickname,
  isSoftChoice,
  onContinue
}: {
  nickname: string;
  isSoftChoice: boolean;
  onContinue: () => void;
}) {
  const displayName = nickname || "你";

  return (
    <motion.div
      data-scene="ending"
      initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="glass mx-auto mt-10 max-w-xl rounded-[28px] p-5 text-left sm:p-6"
    >
      <p className="text-sm text-white/48">第一页纪念卡</p>
      <div className="mt-4 rounded-[24px] border border-white/12 bg-white/[0.07] p-5 shadow-[0_0_42px_rgba(255,138,191,.12)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/42">Chapter 01</p>
            <h3 className="mt-1 text-2xl font-semibold">我们的第一页</h3>
          </div>
          <div className="rounded-full bg-[#fff7ee] px-3 py-1 text-xs font-medium text-[#171225]">99.9%</div>
        </div>
        <div className="mt-6 grid gap-3 text-sm text-white/66">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.05] px-4 py-3">
            <span>名字</span>
            <span className="text-white">{displayName}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.05] px-4 py-3">
            <span>日期</span>
            <span className="text-white">2026.05.19</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.05] px-4 py-3">
            <span>模式</span>
            <span className="text-white">双人模式</span>
          </div>
        </div>
        <p className="mt-5 leading-7 text-white/66">
          {isSoftChoice ? "从一点点开始，也会慢慢变成很多很多。" : "这一页先替我们记住，故事是从心跳同步之后开始的。"}
        </p>
      </div>
      <button onClick={onContinue} className="mt-5 min-h-12 w-full rounded-full bg-[#fff7ee] px-7 py-3 text-sm font-medium text-[#121123] shadow-[0_0_38px_rgba(255,138,191,.22)]">
        选择第一场约会
      </button>
    </motion.div>
  );
}

function DateChoiceStage({
  selectedDateChoice,
  onChoose
}: {
  selectedDateChoice: DateChoiceId | null;
  onChoose: (choice: DateChoiceId) => void;
}) {
  return (
    <motion.div
      data-scene="ending"
      initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="glass mx-auto mt-10 max-w-xl rounded-[28px] p-5 text-left sm:p-6"
    >
      <p className="text-sm leading-6 text-white/54">选一个就好，剩下的以后慢慢补上。</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {dateChoices.map((choice) => {
          const selected = selectedDateChoice === choice.id;
          return (
            <button
              key={choice.id}
              onClick={() => onChoose(choice.id)}
              className={`min-h-24 rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-[#ffd6e7]/70 bg-[#ffd6e7]/16 shadow-[0_0_34px_rgba(255,138,191,.18)]"
                  : "border-white/12 bg-white/[0.06] hover:bg-white/[0.1]"
              }`}
            >
              <span className="text-base font-semibold text-white">{choice.label}</span>
              <span className="mt-2 block text-sm leading-6 text-white/54">{choice.note}</span>
            </button>
          );
        })}
      </div>
      {selectedDateChoice ? (
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center text-sm text-white/50">
          收到 正在收进我们的小宇宙
        </motion.p>
      ) : null}
    </motion.div>
  );
}

function ModeLoading() {
  return (
    <main className="noise relative grid min-h-screen place-items-center overflow-hidden px-5 text-center">
      <Starfield />
      <div className="aurora fixed inset-[-10%] z-[1]" />
      <div className="relative z-10">
        <div className="mx-auto mb-5 grid h-11 w-11 place-items-center rounded-full bg-white text-[#171225]">
          <Sparkles size={17} />
        </div>
        <p className="soft-text text-xl font-semibold">正在打开秘密页面</p>
      </div>
    </main>
  );
}

function CosmosHome({
  config,
  content,
  snapshot,
  onReplayConfession,
  onResetPreview
}: {
  config: CosmosConfig;
  content: CosmosContent;
  snapshot: CosmosSnapshot | null;
  onReplayConfession: () => void;
  onResetPreview: () => void;
}) {
  const displayName = snapshot?.nickname || config.herNickname || "你";
  const firstDateChoice = snapshot?.firstDateChoice ?? config.firstDateChoice;
  const selectedDate = dateChoices.find((choice) => choice.id === firstDateChoice);
  const confessionDate = snapshot?.confessionDate ?? config.confessionDate;
  const heartbeatMatch = snapshot?.heartbeatMatch ?? "99.9%";
  const timelineEvents = [
    ...content.events,
    ...(selectedDate
      ? [
          {
            id: "first-date-selected",
            date: confessionDate,
            title: "第一场正式约会",
            body: `${selectedDate.label}，${selectedDate.note}`,
            type: "date" as const
          }
        ]
      : [])
  ].slice(0, 5);
  const pinnedNotes = content.notes.filter((note) => note.isPinned).slice(0, 2);
  const places = content.places.slice(0, 3);
  const photos = content.photos.slice(0, 4);

  return (
    <main className="noise relative min-h-screen overflow-hidden">
      <Starfield />
      <div className="aurora fixed inset-[-10%] z-[1]" />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,6,18,.2)_48%,rgba(3,6,18,.76)_100%)]" />

      <section className="relative z-10 flex min-h-[100svh] items-center px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9 }}>
            <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/68">
              <Sparkles size={15} />
              欢迎回来
            </div>
            <p className="mb-3 text-sm text-white/48">Chapter 02</p>
            <h1 className="soft-text whitespace-pre-line text-[clamp(2.45rem,12vw,6.5rem)] font-semibold leading-[1.05]">
              {`${config.coupleTitle}\n今天也亮着`}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/64 sm:text-lg">
              从告白那天开始，这里不再只是一封信。它会慢慢收下我们的回忆、约会和以后才会发生的小事。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#cosmos-timeline" className="min-h-12 rounded-full bg-[#fff7ee] px-6 py-3 text-sm font-medium text-[#121123] shadow-[0_0_38px_rgba(255,138,191,.2)]">
                进入小宇宙
              </a>
              <button onClick={onReplayConfession} className="glass min-h-12 rounded-full px-6 py-3 text-sm text-white/78 transition hover:bg-white/14">
                回看 Chapter 01
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.1 }}
            className="glass rounded-[28px] p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/46">我们的第一页</p>
                <h2 className="mt-2 text-2xl font-semibold">双人模式已开启</h2>
              </div>
              <div className="rounded-full bg-[#fff7ee] px-3 py-1 text-xs font-medium text-[#171225]">{heartbeatMatch}</div>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-white/66">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.06] px-4 py-3">
                <span>称呼</span>
                <span className="text-white">{displayName}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.06] px-4 py-3">
                <span>告白日期</span>
                <span className="text-white">{formatDateDisplay(confessionDate)}</span>
              </div>
              <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
                <span className="text-white/52">第一场正式约会</span>
                <p className="mt-1 text-lg font-semibold text-white">{selectedDate?.label ?? "还在认真期待"}</p>
                {selectedDate ? <p className="mt-1 text-sm leading-6 text-white/52">{selectedDate.note}</p> : null}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="cosmos-timeline" className="relative z-10 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-sm text-white/50">从 {formatDateDisplay(config.startDate)} 那天开始</p>
          <h2 className="soft-text mb-6 text-[clamp(2rem,8vw,4.4rem)] font-semibold leading-tight">时间还在继续</h2>
          <p className="mb-7 text-sm text-white/42">你的名字开始写进我的时间里</p>
          <LoveTimer startDateIso={config.startDate} />
        </div>
      </section>

      <section className="relative z-10 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-3">
            <p className="text-sm text-white/50">先把这些放进小宇宙</p>
            <h2 className="soft-text text-[clamp(2rem,8vw,4.8rem)] font-semibold leading-tight">回忆收藏</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {content.memories.map((memory, index) => (
              <motion.article
                key={memory.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.28 }}
                transition={{ delay: index * 0.06 }}
                style={{ rotate: memory.rotate }}
                className="polaroid mx-auto w-full max-w-[21rem] rounded-[8px] p-3 pb-5 sm:max-w-none"
              >
                <div className="photo-glow aspect-[4/5] rounded-[5px]" />
                <div className="mt-4 px-1">
                  <p className="text-xs text-[#7b647a]">{memory.date}</p>
                  <h3 className="mt-1 text-lg font-semibold">{memory.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f596a]">{memory.note}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[.95fr_1.05fr]">
          <div className="glass rounded-[28px] p-5 sm:p-6">
            <p className="text-sm text-white/48">时间线</p>
            <h2 className="mt-2 text-3xl font-semibold">故事继续亮着</h2>
            <div className="mt-6 grid gap-3">
              {timelineEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/12 bg-white/[0.055] p-4">
                  <p className="text-xs text-white/40">{formatDateDisplay(event.date)}</p>
                  <p className="mt-1 text-base font-semibold text-white">{event.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/52">{event.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6">
            <div className="glass rounded-[28px] p-5 sm:p-6">
              <p className="text-sm text-white/48">小纸条</p>
              <div className="mt-4 grid gap-3">
                {(pinnedNotes.length ? pinnedNotes : content.notes.slice(0, 2)).map((note) => (
                  <p key={note.id} className="rounded-2xl bg-white/[0.06] p-4 text-sm leading-7 text-white/64">
                    {note.body}
                  </p>
                ))}
              </div>
            </div>
            <div className="glass rounded-[28px] p-5 sm:p-6">
              <p className="text-sm text-white/48">想一起去的地方</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {places.map((place) => (
                  <div key={place.id} className="rounded-2xl bg-white/[0.06] p-4">
                    <p className="text-base font-semibold text-white">{place.name}</p>
                    <p className="mt-2 text-sm leading-6 text-white/50">{place.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {photos.length ? (
        <section className="relative z-10 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-3">
              <p className="text-sm text-white/50">后来收进来的照片</p>
              <h2 className="soft-text text-[clamp(2rem,8vw,4.8rem)] font-semibold leading-tight">照片收藏</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {photos.map((photo) => (
                <article key={photo.id} className="polaroid rounded-[8px] p-3 pb-5">
                  {photo.imageUrl ? (
                    <img src={photo.imageUrl} alt={photo.caption} className="aspect-[4/5] w-full rounded-[5px] object-cover" />
                  ) : (
                    <div className="photo-glow aspect-[4/5] rounded-[5px]" />
                  )}
                  <div className="mt-4 px-1">
                    <p className="text-xs text-[#7b647a]">{formatDateDisplay(photo.date)}</p>
                    <h3 className="mt-1 text-lg font-semibold">{photo.caption}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative z-10 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          <div className="glass rounded-[28px] p-5 sm:p-6 lg:col-span-2">
            <p className="text-sm text-white/48">小宇宙收藏夹</p>
            <h2 className="mt-2 text-3xl font-semibold">先放三样东西</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["第一页纪念卡", "Chapter 01"],
                ["第一场正式约会", selectedDate?.label ?? "认真期待中"],
                ["以后慢慢加的回忆", "预留给我们"]
              ].map(([title, note]) => (
                <div key={title} className="rounded-2xl border border-white/12 bg-white/[0.055] p-4">
                  <p className="text-base font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/50">{note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-[28px] p-5 sm:p-6">
            <p className="text-sm text-white/48">下一次约会</p>
            <h2 className="mt-2 text-3xl font-semibold">{selectedDate?.label ?? "等你安排"}</h2>
            <p className="mt-4 leading-7 text-white/58">{selectedDate?.note ?? "小宇宙已经亮着，下一页可以慢慢写。"}</p>
          </div>
        </div>
      </section>

      {config.debugEnabled ? (
        <button
          type="button"
          onClick={onResetPreview}
          className="fixed right-4 top-4 z-50 rounded-full border border-white/14 bg-black/20 px-4 py-2 text-xs font-medium text-white/68 backdrop-blur-xl transition hover:bg-white/12 hover:text-white"
        >
          Reset preview
        </button>
      ) : null}
      <div className="fixed left-4 top-4 z-40 hidden items-center gap-2 rounded-full border border-white/12 bg-black/10 px-4 py-2 text-sm text-white/52 backdrop-blur-xl sm:flex">
        <Volume2 size={15} />
        我们的小宇宙
      </div>
      <BackgroundMusic scene="ending" />
    </main>
  );
}

function createHearts() {
  for (let i = 0; i < 34; i += 1) {
    const heart = document.createElement("span");
    heart.className = "heart-burst";
    heart.textContent = "♥";
    heart.style.left = "50%";
    heart.style.top = "62%";
    heart.style.setProperty("--x", `${(Math.random() - 0.5) * 520}px`);
    heart.style.setProperty("--y", `${(Math.random() - 0.5) * 430}px`);
    heart.style.setProperty("--r", `${Math.random() * 360}deg`);
    heart.style.fontSize = `${16 + Math.random() * 22}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1100);
  }
}

function createPetals() {
  for (let i = 0; i < 36; i += 1) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.animationDuration = `${5 + Math.random() * 5}s`;
    petal.style.animationDelay = `${Math.random() * 2}s`;
    petal.style.setProperty("--drift", `${(Math.random() - 0.5) * 180}px`);
    document.body.appendChild(petal);
    setTimeout(() => petal.remove(), 10000);
  }
}

export default function Home() {
  const [accepted, setAccepted] = useState(false);
  const [softAccepted, setSoftAccepted] = useState(false);
  const [endingStage, setEndingStage] = useState<EndingStage>("idle");
  const [permissionChoice, setPermissionChoice] = useState<PermissionChoice>(null);
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedDateChoice, setSelectedDateChoice] = useState<DateChoiceId | null>(null);
  const [flowResetVersion, setFlowResetVersion] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [thinkCount, setThinkCount] = useState(0);
  const [escapeCount, setEscapeCount] = useState(0);
  const [escapeDone, setEscapeDone] = useState(false);
  const [secretChoiceOpen, setSecretChoiceOpen] = useState(false);
  const [teaseOffset, setTeaseOffset] = useState({ x: 0, y: 0 });
  const thinkingButtonRef = useRef<HTMLButtonElement>(null);
  const confessionSectionRef = useRef<HTMLElement>(null);
  const lastTeaseAtRef = useRef(0);
  const dateChoiceTimerRef = useRef<number | null>(null);
  const [scene, setScene] = useState<SceneKey>("opening");
  const [modeReady, setModeReady] = useState(false);
  const [siteMode, setSiteMode] = useState<SiteMode>("confession");
  const [cosmosConfig, setCosmosConfig] = useState<CosmosConfig>(DEFAULT_COSMOS_CONFIG);
  const [cosmosContent, setCosmosContent] = useState<CosmosContent>(DEFAULT_COSMOS_CONTENT);
  const [cosmosSnapshot, setCosmosSnapshot] = useState<CosmosSnapshot | null>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const hasFinalChoice = accepted || softAccepted;

  useSceneObserver(setScene);

  useEffect(() => {
    gsap.fromTo(
      ".reveal",
      { y: 34, opacity: 0, filter: "blur(14px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, stagger: 0.12, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    const syncCosmosState = () => {
      const storedConfig = readCosmosConfig();
      const storedContent = readCosmosContent();
      const storedSnapshot = readCosmosSnapshot();
      setCosmosConfig(storedConfig);
      setCosmosContent(storedContent);
      setCosmosSnapshot(storedSnapshot);
      setSiteMode(readSiteMode() ?? storedConfig.siteMode);
      setModeReady(true);
    };

    syncCosmosState();
    window.addEventListener("storage", syncCosmosState);

    return () => {
      window.removeEventListener("storage", syncCosmosState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (dateChoiceTimerRef.current) window.clearTimeout(dateChoiceTimerRef.current);
    };
  }, []);

  const goToNicknameStage = useCallback(() => {
    setEndingStage("nickname");
  }, []);

  const resetFlow = useCallback(() => {
    setAccepted(false);
    setSoftAccepted(false);
    setEndingStage("idle");
    setPermissionChoice(null);
    setHeartbeatCount(0);
    setNicknameInput("");
    setNickname("");
    setSelectedDateChoice(null);
    setFlowResetVersion((version) => version + 1);
    setThinking(false);
    setThinkCount(0);
    setEscapeCount(0);
    setEscapeDone(false);
    setSecretChoiceOpen(false);
    setTeaseOffset({ x: 0, y: 0 });
    lastTeaseAtRef.current = 0;
    setScene("confession");
    if (dateChoiceTimerRef.current) {
      window.clearTimeout(dateChoiceTimerRef.current);
      dateChoiceTimerRef.current = null;
    }
    clearCosmosData();
    writeSiteMode("confession");
    setSiteMode("confession");
    setCosmosSnapshot(null);
    document.body.style.background = "";
    window.requestAnimationFrame(() => {
      confessionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const replayConfession = useCallback(() => {
    setAccepted(false);
    setSoftAccepted(false);
    setEndingStage("idle");
    setPermissionChoice(null);
    setHeartbeatCount(0);
    setNicknameInput("");
    setNickname("");
    setSelectedDateChoice(null);
    setFlowResetVersion((version) => version + 1);
    setThinking(false);
    setThinkCount(0);
    setEscapeCount(0);
    setEscapeDone(false);
    setSecretChoiceOpen(false);
    setTeaseOffset({ x: 0, y: 0 });
    lastTeaseAtRef.current = 0;
    setScene("opening");
    setSiteMode("confession");
    document.body.style.background = "";
    if (dateChoiceTimerRef.current) {
      window.clearTimeout(dateChoiceTimerRef.current);
      dateChoiceTimerRef.current = null;
    }
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const enterEndingAtmosphere = (soft = false) => {
    setScene("ending");
    createHearts();
    createPetals();
    document.body.style.background = soft
      ? "radial-gradient(circle at 28% 18%, rgba(255, 214, 228, .34), transparent 26rem), linear-gradient(135deg, #120d24, #5e315f 56%, #f3a9c6)"
      : "radial-gradient(circle at 24% 20%, rgba(255, 214, 228, .44), transparent 28rem), linear-gradient(135deg, #1a1023, #87375f 54%, #ffc3d7)";
  };

  const acceptLove = () => {
    setAccepted(true);
    setSoftAccepted(false);
    setThinking(false);
    setSecretChoiceOpen(false);
    setTeaseOffset({ x: 0, y: 0 });
    setPermissionChoice(null);
    setHeartbeatCount(0);
    setSelectedDateChoice(null);
    setEndingStage("permission");
    enterEndingAtmosphere();
  };

  const acceptSoftly = () => {
    setSoftAccepted(true);
    setAccepted(false);
    setThinking(false);
    setSecretChoiceOpen(false);
    setTeaseOffset({ x: 0, y: 0 });
    setPermissionChoice("once");
    setHeartbeatCount(0);
    setSelectedDateChoice(null);
    setEndingStage("heartbeat");
    enterEndingAtmosphere(true);
  };

  const runAway = (far = false) => {
    const button = thinkingButtonRef.current;
    const section = confessionSectionRef.current;
    if (!button || !section || escapeDone) return;

    const margin = 20;
    const rect = button.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const bounds = {
      left: Math.max(sectionRect.left, 0) + margin,
      right: Math.min(sectionRect.right, window.innerWidth) - margin,
      top: Math.max(sectionRect.top, 0) + margin,
      bottom: Math.min(sectionRect.bottom, window.innerHeight) - margin
    };
    const baseLeft = rect.left - teaseOffset.x;
    const baseTop = rect.top - teaseOffset.y;
    const minX = bounds.left - baseLeft;
    const maxX = bounds.right - rect.width - baseLeft;
    const minY = bounds.top - baseTop;
    const maxY = bounds.bottom - rect.height - baseTop;
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const chooseFar = (min: number, max: number, ratio: number) => {
      if (min >= max) return 0;
      const leftDistance = Math.abs(min);
      const rightDistance = Math.abs(max);
      const usePositive = rightDistance > leftDistance ? Math.random() > 0.25 : Math.random() > 0.75;
      const limit = usePositive ? max : min;
      const distance = Math.abs(limit);
      if (distance < 8) return 0;
      const floor = Math.min(distance, Math.max(56, distance * ratio));
      const value = floor + Math.random() * Math.max(0, distance - floor);
      return clamp((usePositive ? 1 : -1) * value, min, max);
    };

    setTeaseOffset({
      x: chooseFar(minX, maxX, far ? 0.72 : 0.48),
      y: chooseFar(minY, maxY, far ? 0.55 : 0.32)
    });
  };

  const teaseThinking = () => {
    const now = Date.now();
    if (now - lastTeaseAtRef.current < 520) return;
    lastTeaseAtRef.current = now;

    setThinking(true);
    setThinkCount((count) => count + 1);
    if (escapeDone) {
      setTeaseOffset({ x: 0, y: 0 });
      return;
    }

    const nextEscapeCount = escapeCount + 1;
    setEscapeCount(Math.min(nextEscapeCount, 3));

    if (nextEscapeCount >= 3) {
      setTeaseOffset({ x: 0, y: 0 });
      setEscapeDone(true);
      return;
    }

    runAway(true);
  };

  const allowPermission = (choice: Exclude<PermissionChoice, null>) => {
    setPermissionChoice(choice);
    setHeartbeatCount(0);
    setEndingStage("heartbeat");
  };

  const beatHeart = () => {
    setHeartbeatCount((count) => {
      const nextCount = Math.min(count + 1, 5);
      if (nextCount === 5) createHearts();
      return nextCount;
    });
  };

  const submitNickname = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNickname(nicknameInput.trim() || "你");
    setEndingStage("keepsake");
    createPetals();
  };

  const chooseFirstDate = (choice: DateChoiceId) => {
    setSelectedDateChoice(choice);
    createPetals();
    if (dateChoiceTimerRef.current) window.clearTimeout(dateChoiceTimerRef.current);
    const nextSnapshot: CosmosSnapshot = {
      nickname: nickname || cosmosConfig.herNickname || "你",
      permissionChoice,
      firstDateChoice: choice,
      isSoftChoice: softAccepted,
      heartbeatMatch: "99.9%",
      confessionDate: cosmosConfig.confessionDate,
      unlockedAt: new Date().toISOString()
    };
    unlockCosmos(nextSnapshot);
    setCosmosSnapshot(nextSnapshot);
    dateChoiceTimerRef.current = window.setTimeout(() => {
      setEndingStage("couple");
      dateChoiceTimerRef.current = window.setTimeout(() => {
        setSiteMode("cosmos");
        document.body.style.background = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
        dateChoiceTimerRef.current = null;
      }, 4200);
    }, 850);
  };

  const endingTitle = !hasFinalChoice
    ? "你愿意让我正式喜欢你吗"
    : endingStage === "permission"
      ? "等一下\n我想认真一点"
      : endingStage === "heartbeat"
        ? "让心跳替我确认一次"
        : endingStage === "nickname"
          ? "给我们的故事起一个暗号"
          : endingStage === "keepsake"
            ? "留下我们的第一页"
            : endingStage === "date"
            ? "选择我们的第一场约会"
            : "给我们的秘密页面";

  if (!modeReady) return <ModeLoading />;

  if (siteMode === "cosmos") {
    return <CosmosHome config={cosmosConfig} content={cosmosContent} snapshot={cosmosSnapshot} onReplayConfession={replayConfession} onResetPreview={resetFlow} />;
  }

  return (
    <main className="noise relative min-h-screen overflow-hidden">
      <Starfield />
      <motion.div style={{ y }} className="aurora fixed inset-[-10%] z-[1]" />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,6,18,.16)_48%,rgba(3,6,18,.72)_100%)]" />

      <section data-scene="opening" className="mobile-section relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1 }}
          className="glass mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/70"
        >
          <Sparkles size={15} />
          你终于来了
        </motion.div>
        <p className="reveal mb-4 text-sm text-white/54">{endingStage === "couple" ? "给我们的秘密页面" : "给你的秘密页面"}</p>
        <h1 className="reveal soft-text max-w-4xl whitespace-pre-line text-[clamp(2.35rem,13vw,7rem)] font-semibold leading-[1.06] tracking-normal">
          {"我有一些话\n想偷偷告诉你"}
        </h1>
        <p className="reveal mt-6 max-w-xl text-balance text-base leading-8 text-white/64 sm:text-lg">
          这个世界上，只有你会看到这里。
        </p>
        <a
          href="#letter"
          className="reveal mt-9 min-h-12 rounded-full bg-[#fff7ee] px-7 py-4 text-sm font-medium text-[#101328] shadow-[0_0_40px_rgba(255,247,238,.28)] transition hover:scale-[1.03]"
        >
          点开看看
        </a>
        <div className="scroll-indicator absolute bottom-7 left-1/2 h-12 w-[1px] -translate-x-1/2 overflow-hidden bg-white/12">
          <span />
        </div>
      </section>

      <section id="letter" data-scene="letter" className="mobile-section relative z-10 min-h-[100svh] px-0 py-24">
        <Typewriter key={flowResetVersion} />
        <div className="mt-12 flex justify-center px-6">
          <a href="#memories" className="glass min-h-12 rounded-full px-7 py-4 text-sm text-white/84 transition hover:bg-white/16">
            继续
          </a>
        </div>
      </section>

      <section id="memories" data-scene="memories" className="relative z-10 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-3 sm:mb-16">
            <p className="text-sm text-white/50">那些普通又不普通的瞬间</p>
            <h2 className="soft-text text-[clamp(2rem,9vw,5rem)] font-semibold leading-tight">如果回忆有底片</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cosmosContent.memories.map((memory, index) => (
              <motion.article
                key={memory.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.28 }}
                whileHover={{ y: -8, scale: 1.025, rotate: "0deg" }}
                transition={{ delay: index * 0.08 }}
                style={{ rotate: memory.rotate }}
                className="polaroid mx-auto w-full max-w-[21rem] rounded-[8px] p-3 pb-5 sm:max-w-none"
              >
                <div className="photo-glow aspect-[4/5] rounded-[5px]" />
                <div className="mt-4 px-1">
                  <p className="text-xs text-[#7b647a]">{memory.date}</p>
                  <h3 className="mt-1 text-lg font-semibold">{memory.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f596a]">{memory.note}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section data-scene="memories" className="relative z-10 px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-sm text-white/50">从 {formatDateDisplay(cosmosConfig.startDate)} 那天开始</p>
          <p className="mb-6 text-sm text-white/42">你的名字开始写进我的时间里</p>
          <LoveTimer startDateIso={cosmosConfig.startDate} />
        </div>
      </section>

      <section ref={confessionSectionRef} data-scene={hasFinalChoice ? "ending" : "confession"} className="mobile-section relative z-10 flex min-h-[100svh] items-center justify-center px-5 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-lg text-white/58">
            {hasFinalChoice ? "故事开始变成我们了。" : "所以……"}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1.1 }}
            className="soft-text mt-5 whitespace-pre-line text-[clamp(2.1rem,11.5vw,6.8rem)] font-semibold leading-[1.08]"
          >
            {endingTitle}
          </motion.h2>

          {!hasFinalChoice ? (
            <div className="mx-auto mt-9 flex w-full max-w-md flex-row items-center justify-center gap-3 sm:max-w-none sm:gap-4">
              <button onClick={acceptLove} className="min-h-12 flex-1 whitespace-nowrap rounded-full bg-[#fff7ee] px-5 py-4 text-sm font-medium text-[#121123] shadow-[0_0_50px_rgba(255,138,191,.34)] transition hover:scale-[1.04] sm:flex-none sm:px-8 sm:text-base">
                我愿意 ❤️
              </button>
              <motion.button
                ref={thinkingButtonRef}
                animate={teaseOffset}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onPointerDown={(event) => {
                  if (event.pointerType !== "mouse") teaseThinking();
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse" && escapeCount < 3) teaseThinking();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") teaseThinking();
                }}
                className="glass min-h-12 flex-1 whitespace-nowrap rounded-full px-5 py-4 text-sm text-white/82 transition hover:bg-white/16 sm:flex-none sm:px-8 sm:text-base"
              >
                让我想想 🙈
              </motion.button>
            </div>
          ) : null}

          {thinking && !hasFinalChoice && secretChoiceOpen ? (
            <div className="mt-8 flex flex-col items-center gap-3">
              <motion.button
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                onClick={acceptSoftly}
                className="glass min-h-12 rounded-full px-7 py-4 text-sm text-white/86 shadow-[0_0_38px_rgba(255,138,191,.18)] transition hover:bg-white/16"
              >
                其实我也有一点点喜欢你
              </motion.button>
            </div>
          ) : null}

          {thinking && !hasFinalChoice ? (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-lg leading-8 text-white/72">
              {thinkCount <= 1
                ? "你真的要想这么久吗？"
                : thinkCount === 2
                  ? "好啦，不逗你了，我会等。"
                : "没关系，我会继续偷偷喜欢你。"}
            </motion.p>
          ) : null}

          {thinking && !hasFinalChoice && !secretChoiceOpen ? (
            <div className="mt-7 flex flex-col items-center gap-3">
              <button
                onClick={() => setSecretChoiceOpen(true)}
                className="text-xs text-white/38 underline decoration-white/18 underline-offset-4 transition hover:text-white/62"
              >
                偷偷选一个更诚实的答案
              </button>
            </div>
          ) : null}

          {accepted && endingStage === "permission" ? (
            <PermissionStage onAllowOnce={() => allowPermission("once")} onAllowForever={() => allowPermission("forever")} />
          ) : null}

          {hasFinalChoice && endingStage === "heartbeat" ? (
            <HeartbeatStage
              count={heartbeatCount}
              permissionChoice={permissionChoice}
              isSoftChoice={softAccepted}
              onBeat={beatHeart}
              onContinue={goToNicknameStage}
            />
          ) : null}

          {hasFinalChoice && endingStage === "nickname" ? (
            <NicknameStage nicknameInput={nicknameInput} onNicknameChange={setNicknameInput} onSubmit={submitNickname} />
          ) : null}

          {hasFinalChoice && endingStage === "keepsake" ? (
            <KeepsakeStage nickname={nickname} isSoftChoice={softAccepted} onContinue={() => setEndingStage("date")} />
          ) : null}

          {hasFinalChoice && endingStage === "date" ? (
            <DateChoiceStage selectedDateChoice={selectedDateChoice} onChoose={chooseFirstDate} />
          ) : null}

          {hasFinalChoice && endingStage === "couple" ? (
            <CoupleStage nickname={nickname} isSoftChoice={softAccepted} dateChoice={selectedDateChoice} />
          ) : null}
        </div>
      </section>

      <BackgroundMusic scene={scene} />
      {cosmosConfig.debugEnabled ? (
        <button
          type="button"
          onClick={resetFlow}
          className="fixed right-4 top-4 z-50 rounded-full border border-white/14 bg-black/20 px-4 py-2 text-xs font-medium text-white/68 backdrop-blur-xl transition hover:bg-white/12 hover:text-white"
        >
          Reset flow
        </button>
      ) : null}
      <div className="fixed left-4 top-4 z-40 hidden items-center gap-2 rounded-full border border-white/12 bg-black/10 px-4 py-2 text-sm text-white/52 backdrop-blur-xl sm:flex">
        <Volume2 size={15} />
        {endingStage === "couple" ? "我们的小宇宙" : "私人放映中"}
      </div>
    </main>
  );
}
