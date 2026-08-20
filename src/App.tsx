import { useEffect, useRef, useState } from "react";
import { MoreniEngine } from "./game/engine";
import { sfx } from "./game/audio";
import {
  SPECIES,
  FLAVORS,
  FLAVOR_LIST,
  BOOT_LINES,
  buildDemandText,
  pick,
  type SpeciesDef,
  type FlavorId,
} from "./game/data";

type Screen = "title" | "playing" | "gameover" | "victory";
type Phase = "idle" | "entering" | "demanding" | "resolve";

interface RoundInfo {
  species: SpeciesDef;
  flavor: FlavorId;
  qty: number;
  text: string;
}
interface Pop {
  id: number;
  text: string;
  x: number;
}

/* ------------------------------- icone SVG ------------------------------- */

function Crescent({ state }: { state: "full" | "half" | "empty" }) {
  const fill = state === "full" ? "#ffc94d" : state === "half" ? "rgba(255,201,77,0.32)" : "rgba(155,139,184,0.1)";
  const stroke = state === "empty" ? "#5a4a7a" : "#ffc94d";
  return (
    <svg viewBox="0 0 40 40" className="w-7 h-7 md:w-8 md:h-8" style={{ filter: state === "empty" ? "none" : "drop-shadow(0 0 6px rgba(255,201,77,0.55))" }}>
      <path d="M20 4 A16 16 0 1 0 20 36 A22 22 0 0 1 20 4 Z" fill={fill} stroke={stroke} strokeWidth="2.4" />
    </svg>
  );
}

function CookieIcon({ flavor, size = 44, dim = false }: { flavor: FlavorId; size?: number; dim?: boolean }) {
  const f = FLAVORS[flavor];
  const base = dim ? "#3c3550" : f.css;
  const dark = dim ? "#2a2440" : f.cssDark;
  const chip = dim ? "#241f38" : f.chip;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r="20" fill={base} stroke={dark} strokeWidth="3.5" />
      <circle cx="17" cy="17" r="3.4" fill={chip} />
      <circle cx="30" cy="14" r="2.6" fill={chip} />
      <circle cx="33" cy="27" r="3.2" fill={chip} />
      <circle cx="21" cy="31" r="2.8" fill={chip} />
      <circle cx="13" cy="26" r="2.2" fill={chip} />
      <circle cx="28" cy="21" r="1.8" fill={chip} />
    </svg>
  );
}

function BlobAvatar({ species, size = 56 }: { species: SpeciesDef; size?: number }) {
  const css = "#" + species.bodyColor.toString(16).padStart(6, "0");
  return (
    <div
      className="relative rounded-full border-2 border-black/70"
      style={{ width: size, height: size, background: css, boxShadow: `0 0 16px ${css}55, inset -4px -6px 0 rgba(0,0,0,0.28)` }}
    >
      {species.parts.crown && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft: `${size * 0.16}px solid transparent`, borderRight: `${size * 0.16}px solid transparent`, borderBottom: `${size * 0.2}px solid #ffd700` }} />
      )}
      {species.parts.horns && (
        <>
          <div className="absolute -top-2 left-[12%] w-0 h-0" style={{ borderLeft: `${size * 0.08}px solid transparent`, borderRight: `${size * 0.08}px solid transparent`, borderBottom: `${size * 0.22}px solid #ffe066`, transform: "rotate(-18deg)" }} />
          <div className="absolute -top-2 right-[12%] w-0 h-0" style={{ borderLeft: `${size * 0.08}px solid transparent`, borderRight: `${size * 0.08}px solid transparent`, borderBottom: `${size * 0.22}px solid #ffe066`, transform: "rotate(18deg)" }} />
        </>
      )}
      <div className="absolute rounded-full bg-white" style={{ width: size * 0.22, height: size * 0.24, left: size * 0.2, top: size * 0.32 }}>
        <div className="absolute rounded-full bg-black" style={{ width: size * 0.09, height: size * 0.09, left: size * 0.07, top: size * 0.09 }} />
      </div>
      <div className="absolute rounded-full bg-white" style={{ width: size * 0.22, height: size * 0.24, right: size * 0.2, top: size * 0.32 }}>
        <div className="absolute rounded-full bg-black" style={{ width: size * 0.09, height: size * 0.09, left: size * 0.06, top: size * 0.09 }} />
      </div>
      <div className="absolute rounded-full bg-[#47101f]" style={{ width: size * 0.2, height: size * 0.1, left: size * 0.4, top: size * 0.66 }} />
    </div>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <rect x="5" y="4" width="5" height="16" />
      <rect x="14" y="4" width="5" height="16" />
    </svg>
  );
}
function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      {muted ? <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2.4" fill="none" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" />}
    </svg>
  );
}

/* --------------------------------- App --------------------------------- */

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MoreniEngine | null>(null);

  const [screen, setScreenState] = useState<Screen>("title");
  const [paused, setPausedState] = useState(false);
  const [muted, setMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [turns, setTurns] = useState(8); // mezzi press turn (4 pieni)
  const [round, setRound] = useState(1);
  const [album, setAlbum] = useState<Record<string, number>>({});
  const [demand, setDemand] = useState<RoundInfo | null>(null);
  const [fulfilled, setFulfilled] = useState(0);
  const [phase, setPhaseState] = useState<Phase>("idle");
  const [dialogue, setDialogue] = useState("");
  const [card, setCard] = useState<{ species: SpeciesDef; isNew: boolean } | null>(null);
  const [flash, setFlash] = useState<{ type: "red" | "gold"; key: number } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [pops, setPops] = useState<Pop[]>([]);
  const [bootText, setBootText] = useState("");

  const screenRef = useRef<Screen>("title");
  const pausedRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const demandRef = useRef<RoundInfo | null>(null);
  const fulfilledRef = useRef(0);
  const turnsRef = useRef(8);
  const comboRef = useRef(0);
  const albumRef = useRef<Record<string, number>>({});
  const roundRef = useRef(0);
  const timerMsRef = useRef(0);
  const timerMaxRef = useRef(1);
  const lastTickRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const tickIntRef = useRef<number | null>(null);
  const typeIntRef = useRef<number | null>(null);
  const popIdRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const barWrapRef = useRef<HTMLDivElement>(null);

  const setScreen = (s: Screen) => {
    screenRef.current = s;
    setScreenState(s);
  };
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };
  const setPaused = (p: boolean) => {
    pausedRef.current = p;
    setPausedState(p);
    engineRef.current?.setPaused(p);
  };

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };
  const clearAllTimers = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
    if (tickIntRef.current !== null) window.clearInterval(tickIntRef.current);
    tickIntRef.current = null;
    if (typeIntRef.current !== null) window.clearInterval(typeIntRef.current);
    typeIntRef.current = null;
  };

  /* ------------------------------ engine 3D ------------------------------ */
  useEffect(() => {
    if (!mountRef.current) return;
    const engine = new MoreniEngine(mountRef.current);
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => () => clearAllTimers(), []);

  /* ------------------------------ boot log ------------------------------- */
  useEffect(() => {
    if (screen !== "title") return;
    const full = BOOT_LINES.join("\n");
    let i = 0;
    setBootText("");
    const id = window.setInterval(() => {
      i++;
      setBootText(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [screen]);

  /* ------------------------------- game flow ------------------------------ */

  const typewrite = (text: string) => {
    if (typeIntRef.current !== null) window.clearInterval(typeIntRef.current);
    let i = 0;
    setDialogue("");
    typeIntRef.current = window.setInterval(() => {
      if (pausedRef.current || screenRef.current !== "playing") return;
      i++;
      setDialogue(text.slice(0, i));
      if (i % 4 === 0) sfx.type();
      if (i >= text.length && typeIntRef.current !== null) {
        window.clearInterval(typeIntRef.current);
        typeIntRef.current = null;
      }
    }, 20);
  };

  const tickTimer = () => {
    if (screenRef.current !== "playing" || pausedRef.current || phaseRef.current !== "demanding") return;
    timerMsRef.current -= 100;
    const ms = Math.max(0, timerMsRef.current);
    const pct = ms / timerMaxRef.current;
    if (barRef.current) {
      barRef.current.style.width = `${pct * 100}%`;
      barRef.current.style.background = pct > 0.5 ? "#4dffa6" : pct > 0.25 ? "#ffc94d" : "#ff2e5f";
    }
    barWrapRef.current?.classList.toggle("low-timer", pct <= 0.25 && pct > 0);
    if (ms <= 2000 && ms > 0) {
      const step = Math.ceil(ms / 500);
      if (step !== lastTickRef.current) {
        lastTickRef.current = step;
        sfx.tick();
      }
    }
    if (ms <= 0) {
      setPhase("resolve");
      onTimeout();
    }
  };

  const startTimer = () => {
    if (tickIntRef.current !== null) window.clearInterval(tickIntRef.current);
    lastTickRef.current = 0;
    tickIntRef.current = window.setInterval(tickTimer, 100);
    if (barRef.current) {
      barRef.current.style.width = "100%";
      barRef.current.style.background = "#4dffa6";
    }
  };
  const stopTimer = () => {
    if (tickIntRef.current !== null) window.clearInterval(tickIntRef.current);
    tickIntRef.current = null;
  };

  const nextRound = () => {
    if (screenRef.current !== "playing") return;
    const r = ++roundRef.current;
    setRound(r);
    const missing = SPECIES.filter((s) => !albumRef.current[s.id]);
    const sp = missing.length > 0 && Math.random() < 0.68 ? pick(missing) : pick(SPECIES);
    let qty = Math.min(3, 1 + Math.floor((r - 1) / 3) + (sp.big ? 1 : 0));
    if (r <= 2) qty = sp.big ? 2 : 1;
    const flavor: FlavorId = Math.random() < 0.65 ? sp.favorite : pick(FLAVOR_LIST);
    const info: RoundInfo = { species: sp, flavor, qty, text: buildDemandText(r, flavor, qty) };
    demandRef.current = info;
    setDemand(info);
    fulfilledRef.current = 0;
    setFulfilled(0);
    setPhase("entering");
    setCard(null);
    sfx.appear();
    engineRef.current?.spawnMoreno(sp, qty, flavor);
    typewrite(info.text);
    later(() => {
      if (phaseRef.current !== "entering" || screenRef.current !== "playing") return;
      setPhase("demanding");
      const ms = Math.max(4200, 9800 - (r - 1) * 430 - (qty - 1) * 750);
      timerMaxRef.current = ms;
      timerMsRef.current = ms;
      startTimer();
    }, 1150);
  };

  const addScore = (n: number) => setScore((s) => s + n);
  const addPop = (text: string) => {
    const id = ++popIdRef.current;
    setPops((p) => [...p.slice(-5), { id, text, x: 36 + Math.random() * 28 }]);
    later(() => setPops((p) => p.filter((q) => q.id !== id)), 1000);
  };

  const resolveRecruit = () => {
    const d = demandRef.current;
    if (!d) return;
    sfx.recruit();
    const isNew = !albumRef.current[d.species.id];
    albumRef.current = { ...albumRef.current, [d.species.id]: (albumRef.current[d.species.id] ?? 0) + 1 };
    setAlbum({ ...albumRef.current });
    turnsRef.current = Math.min(8, turnsRef.current + 1);
    setTurns(turnsRef.current);
    comboRef.current += 1;
    setCombo(comboRef.current);
    setBestCombo((b) => Math.max(b, comboRef.current));
    const timeBonus = Math.max(0, Math.round(timerMsRef.current / 100) * 10);
    const gain = (isNew ? 500 : 150) + comboRef.current * 75 + timeBonus;
    addScore(gain);
    addPop(`+${gain}`);
    setFlash({ type: "gold", key: Date.now() });
    setCard({ species: d.species, isNew });
    later(() => setCard(null), 1750);
    engineRef.current?.recruit(() => {
      if (screenRef.current !== "playing") return;
      const collected = Object.keys(albumRef.current).length;
      if (isNew && collected >= SPECIES.length) {
        setScreen("victory");
        sfx.victory();
        return;
      }
      later(nextRound, 600);
    });
  };

  const afterFail = () => {
    turnsRef.current -= 1;
    setTurns(turnsRef.current);
    if (turnsRef.current <= 0) {
      setScreen("gameover");
      sfx.gameover();
      return;
    }
    later(nextRound, 550);
  };

  const resolveWrong = () => {
    if (phaseRef.current !== "demanding") return;
    stopTimer();
    setPhase("resolve");
    const d = demandRef.current;
    sfx.wrong();
    engineRef.current?.shake(0.5);
    setFlash({ type: "red", key: Date.now() });
    setShakeKey((k) => k + 1);
    comboRef.current = 0;
    setCombo(0);
    if (d) setDialogue(pick(d.species.angryLines));
    engineRef.current?.angry(afterFail);
  };

  const onTimeout = () => {
    stopTimer();
    const d = demandRef.current;
    sfx.wrong();
    engineRef.current?.shake(0.3);
    setFlash({ type: "red", key: Date.now() });
    setShakeKey((k) => k + 1);
    comboRef.current = 0;
    setCombo(0);
    if (d) setDialogue(pick(d.species.timeoutLines));
    engineRef.current?.sulk(afterFail);
  };

  const offer = (flavor: FlavorId) => {
    sfx.unlock();
    if (screenRef.current !== "playing" || pausedRef.current) return;
    if (phaseRef.current !== "demanding" || !demandRef.current) return;
    const d = demandRef.current;
    if (flavor === d.flavor) {
      sfx.chomp();
      engineRef.current?.feed(flavor);
      const f = ++fulfilledRef.current;
      setFulfilled(f);
      engineRef.current?.markFulfilled(f);
      addScore(75);
      addPop("+75");
      if (f >= d.qty) {
        stopTimer();
        setPhase("resolve");
        later(resolveRecruit, 420);
      }
    } else {
      resolveWrong();
    }
  };

  const startGame = () => {
    sfx.unlock();
    sfx.start();
    clearAllTimers();
    setScreen("playing");
    setPaused(false);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    turnsRef.current = 8;
    setTurns(8);
    albumRef.current = {};
    setAlbum({});
    roundRef.current = 0;
    comboRef.current = 0;
    setCard(null);
    setPops([]);
    setDemand(null);
    setDialogue("");
    setPhase("idle");
    engineRef.current?.clearDemon();
    engineRef.current?.attractMode(false);
    later(nextRound, 450);
  };

  const continueEndless = () => {
    sfx.start();
    setScreen("playing");
    setCard(null);
    later(nextRound, 500);
  };

  const goMenu = () => {
    clearAllTimers();
    setScreen("title");
    setPaused(false);
    setCard(null);
    setDemand(null);
    setPhase("idle");
    engineRef.current?.clearDemon();
    engineRef.current?.attractMode(true);
  };

  const togglePause = () => {
    if (screenRef.current !== "playing") return;
    sfx.pause();
    setPaused(!pausedRef.current);
  };
  const toggleMute = () => {
    sfx.unlock();
    setMuted((m) => {
      sfx.setMuted(!m);
      return !m;
    });
  };

  /* ------------------------------- tastiera ------------------------------- */
  const actionsRef = useRef({ offer, togglePause, toggleMute, startGame, continueEndless });
  actionsRef.current = { offer, togglePause, toggleMute, startGame, continueEndless };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const a = actionsRef.current;
      sfx.unlock();
      if (e.key >= "1" && e.key <= "4") {
        a.offer(FLAVOR_LIST[Number(e.key) - 1]);
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "m") a.toggleMute();
      if (k === "p" || k === "escape") a.togglePause();
      if ((k === "enter" || k === " ") && screenRef.current === "title") a.startGame();
      if (k === "enter" && screenRef.current === "gameover") a.startGame();
      if (k === "enter" && screenRef.current === "victory") a.continueEndless();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* -------------------------------- render -------------------------------- */
  const collected = Object.keys(album).length;
  const inGame = screen === "playing";

  return (
    <div className="fixed inset-0 overflow-hidden bg-void font-term text-bone">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="scanlines crt-flicker absolute inset-0 z-20" />
      <div className="vignette absolute inset-0 z-20" />
      {flash && <div key={flash.key} className={`pointer-events-none absolute inset-0 z-30 ${flash.type === "red" ? "flash-red" : "flash-gold"}`} />}

      {/* ------------------------- HUD di gioco ------------------------- */}
      {inGame && (
        <div key={shakeKey > 0 ? `shk-${shakeKey}` : "hud"} className={shakeKey > 0 ? "hud-shake absolute inset-0 z-40" : "absolute inset-0 z-40"}>
          {/* barra superiore */}
          <div className="absolute top-0 inset-x-0 flex items-start justify-between gap-3 p-3 md:p-4 pointer-events-none">
            <div>
              <div className="text-[11px] tracking-[0.3em] text-dim mb-1">PRESS TURN</div>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <Crescent key={i} state={turns >= (i + 1) * 2 ? "full" : turns === i * 2 + 1 ? "half" : "empty"} />
                ))}
              </div>
              <div className="mt-1.5 inline-block border border-edge bg-black/50 px-2 py-0.5 text-sm text-dim">
                ROUND <span className="text-toxic text-lg">{round}</span>
              </div>
            </div>
            <div className="text-center pt-1">
              <div className="text-[11px] tracking-[0.4em] text-dim">CARISMA</div>
              <div className="font-display font-black text-4xl md:text-6xl leading-none text-gold" style={{ textShadow: "0 0 22px rgba(255,201,77,0.45), 3px 3px 0 #2a1450" }}>
                {String(score).padStart(6, "0")}
              </div>
              {combo >= 2 && (
                <div key={combo} className="pop-in mt-1 inline-block border-2 border-blood bg-black/60 px-2.5 py-0.5 font-display text-xl text-blood font-bold">
                  CATENA x{combo}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 pointer-events-auto">
              <div className="border border-edge bg-black/50 px-2.5 py-1.5">
                <div className="text-[11px] tracking-[0.3em] text-dim text-right">ALBUM {collected}/8</div>
                <div className="flex gap-1 mt-1 justify-end">
                  {SPECIES.map((s) => (
                    <div
                      key={s.id}
                      className="w-2.5 h-2.5 rounded-full border border-black/60"
                      style={{ background: album[s.id] ? "#" + s.bodyColor.toString(16).padStart(6, "0") : "#241f38", boxShadow: album[s.id] ? `0 0 6px #${s.bodyColor.toString(16).padStart(6, "0")}` : "none" }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={togglePause} className="btn-hard bg-panel2 border-2 border-edge px-3 py-2 text-toxic hover:border-toxic" aria-label="Pausa">
                  <PauseIcon />
                </button>
                <button onClick={toggleMute} className={`btn-hard bg-panel2 border-2 border-edge px-3 py-2 hover:border-toxic ${muted ? "text-dim" : "text-toxic"}`} aria-label="Audio">
                  <SoundIcon muted={muted} />
                </button>
              </div>
            </div>
          </div>

          {/* pannello dialogo + comandi */}
          <div className="absolute bottom-0 inset-x-0 p-2.5 md:p-4">
            <div className="max-w-5xl mx-auto flex flex-col gap-2">
              <div ref={barWrapRef} className="h-2.5 bg-black/70 border border-edge overflow-hidden">
                <div ref={barRef} className="h-full" style={{ width: "100%", background: "#4dffa6" }} />
              </div>
              <div className="border-2 border-edge bg-panel/90 px-3 md:px-4 py-2.5 flex items-center gap-3 md:gap-4 min-h-[86px]">
                {demand && (
                  <div className="shrink-0 border-2 border-blood bg-black/50 px-2.5 md:px-3 py-1 -rotate-1">
                    <div className="font-display text-lg md:text-2xl font-bold text-blood leading-none">{demand.species.name}</div>
                    <div className="text-[10px] md:text-[11px] text-dim tracking-widest mt-0.5">{demand.species.title}</div>
                  </div>
                )}
                <p className="flex-1 text-lg md:text-2xl text-toxic leading-snug min-h-[2.6rem]" style={{ textShadow: "0 0 10px rgba(77,255,166,0.4)" }}>
                  {dialogue}
                  <span className="blink text-toxic">▌</span>
                </p>
                {demand && (
                  <div className="shrink-0 flex gap-1.5 items-center">
                    {Array.from({ length: demand.qty }).map((_, i) => (
                      <div key={`${i}-${i < fulfilled}`} className={i < fulfilled && i === fulfilled - 1 ? "chip-pop" : ""}>
                        <CookieIcon flavor={demand.flavor} size={i < fulfilled ? 38 : 34} dim={i >= fulfilled} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {FLAVOR_LIST.map((f, i) => {
                  const fl = FLAVORS[f];
                  const enabled = phase === "demanding";
                  return (
                    <button
                      key={f}
                      onClick={() => offer(f)}
                      disabled={!enabled}
                      className="btn-hard relative bg-panel2/95 border-2 px-1 py-2 md:py-2.5 flex flex-col items-center gap-0.5"
                      style={{ borderColor: enabled ? fl.css + "77" : "#3a2160" }}
                    >
                      <span className="absolute top-1 left-1.5 text-[11px] text-dim border border-edge bg-black/50 px-1 leading-tight">{i + 1}</span>
                      <span className="transition group-hover:brightness-125">
                        <CookieIcon flavor={f} size={40} />
                      </span>
                      <span className="text-sm md:text-lg tracking-wider leading-none" style={{ color: fl.css }}>
                        {fl.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* punteggi fluttuanti */}
          <div className="absolute bottom-56 inset-x-0 pointer-events-none">
            {pops.map((p) => (
              <div key={p.id} className="float-up absolute font-display font-black text-3xl text-gold text-outline" style={{ left: `${p.x}%` }}>
                {p.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------- card reclutamento ------------------------- */}
      {card && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="card-in relative border-4 border-gold bg-[#1a0510] px-8 md:px-10 py-5 md:py-6 text-center" style={{ boxShadow: "0 0 70px rgba(255,201,77,0.35)" }}>
            {card.isNew && (
              <div className="stamp-in absolute -top-5 -right-7 bg-blood text-black font-display font-black text-2xl px-3 py-0.5 border-2 border-black">
                NUOVO!
              </div>
            )}
            <div className="flex justify-center mb-2">
              <BlobAvatar species={card.species} size={74} />
            </div>
            <div className="text-[11px] tracking-[0.4em] text-dim">MORENO RECLUTATO</div>
            <div className="font-display font-black text-3xl md:text-5xl text-gold leading-tight" style={{ textShadow: "2px 2px 0 #2a1450" }}>
              {card.species.name}
            </div>
            <div className="text-toxic text-lg md:text-xl mt-1.5 max-w-md">"{pick(card.species.recruitLines)}"</div>
          </div>
        </div>
      )}

      {/* ------------------------------ titolo ------------------------------ */}
      {screen === "title" && (
        <div className="absolute inset-0 z-40" style={{ background: "linear-gradient(180deg, rgba(6,3,12,0.82) 0%, rgba(6,3,12,0.55) 45%, rgba(6,3,12,0.85) 100%)" }}>
          <div className="h-full max-w-6xl mx-auto px-5 md:px-10 py-5 md:py-8 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-4">
              <div className="text-toxic text-xs md:text-sm tracking-[0.3em] border border-toxic/40 bg-black/60 px-3 py-1.5">
                COMP v6.66 — PROGRAMMA DI EVOCAZIONE MORENI
              </div>
              <div className="hidden md:block text-right text-dim text-sm leading-tight border border-edge bg-black/60 px-3 py-1.5">
                MORENI REGISTRATI: 8<br />MORENINI DISPONIBILI: ∞
              </div>
            </div>

            <div className="grid md:grid-cols-[1.25fr_1fr] gap-6 md:gap-10 items-end">
              <div className="title-float">
                <div className="font-display text-2xl md:text-4xl text-toxic leading-none" style={{ textShadow: "0 0 18px rgba(77,255,166,0.6)" }}>
                  SHIN
                </div>
                <div className="pulse-glow font-display font-black text-7xl md:text-[10rem] leading-[0.82] text-blood text-outline">MORENI</div>
                <div className="font-display font-bold text-4xl md:text-6xl text-bone leading-none mt-1" style={{ textShadow: "3px 3px 0 #2a1450" }}>
                  TENSEI
                </div>
                <div className="mt-3 text-lg md:text-2xl text-gold tracking-wide">
                  Evocatore Digitale di Moreni — Edizione Demenziale
                </div>
              </div>
              <div className="border-2 border-toxic/60 bg-black/75 p-3.5 md:p-4 text-toxic text-base md:text-xl leading-snug h-fit max-h-56 overflow-hidden whitespace-pre-wrap" style={{ boxShadow: "0 0 34px rgba(77,255,166,0.14)" }}>
                {bootText}
                <span className="blink">▌</span>
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="border-2 border-edge bg-black/60 px-4 py-3 text-base md:text-lg leading-snug max-w-xl">
                <div className="text-gold tracking-[0.25em] text-sm mb-1.5">REGOLE DELL'EVOCATORE</div>
                <div><span className="text-blood">■</span> IL MORENO CHIEDE MORENINI: DAGLIELI DEL GUSTO GIUSTO</div>
                <div><span className="text-blood">■</span> GUSTO SBAGLIATO O SCADENZA = PERDI UN PRESS TURN</div>
                <div><span className="text-blood">■</span> COLLEZIONA GLI 8 MORENI PER COMPLETARE L'ALBUM</div>
                <div className="text-dim mt-1.5 text-sm md:text-base">TASTI [1][2][3][4] OFFRI · [P] PAUSA · [M] AUDIO</div>
              </div>
              <button onClick={startGame} className="btn-hard bg-blood text-black font-display font-black text-2xl md:text-4xl px-8 md:px-12 py-3 md:py-4 border-2 border-[#ff8aa8] tracking-wide">
                EVOCA — INVIO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------ pausa ------------------------------ */}
      {inGame && paused && (
        <div className="absolute inset-0 z-[60] bg-black/70 flex items-center justify-center p-6">
          <div className="pop-in border-4 border-toxic bg-panel px-8 md:px-12 py-8 text-center max-w-md w-full" style={{ boxShadow: "0 0 60px rgba(77,255,166,0.25)" }}>
            <div className="font-display font-black text-6xl text-toxic" style={{ textShadow: "3px 3px 0 #123324" }}>PAUSA</div>
            <div className="text-dim text-lg mt-1 mb-5">IL MORENO ASPETTA. CHE MALEDUCATO.</div>
            <div className="text-left text-lg leading-relaxed mb-6 border border-edge bg-black/40 px-4 py-3">
              <div><span className="text-gold">[1-4]</span> OFFRI IL MORENINO DEL GUSTO</div>
              <div><span className="text-gold">[P]</span> PAUSA / RIPRENDI</div>
              <div><span className="text-gold">[M]</span> AUDIO ON/OFF</div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={togglePause} className="btn-hard bg-toxic text-black font-display font-black text-2xl px-8 py-2.5 border-2 border-[#a8ffd4]">
                RIPRENDI
              </button>
              <button onClick={goMenu} className="btn-hard bg-panel2 text-dim font-display font-bold text-2xl px-6 py-2.5 border-2 border-edge hover:text-bone">
                ABBANDONA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------- game over ---------------------------- */}
      {screen === "gameover" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6" style={{ background: "radial-gradient(ellipse at center, rgba(60,4,18,0.82) 0%, rgba(10,2,6,0.94) 100%)" }}>
          <div className="text-center max-w-2xl w-full">
            <div className="font-display font-black text-6xl md:text-8xl text-blood leading-none pulse-glow text-outline">SEI STATO</div>
            <div className="font-display font-black text-6xl md:text-8xl text-blood leading-none pulse-glow text-outline mt-1">MORENIZZATO</div>
            <div className="text-dim text-lg md:text-xl mt-3">I PRESS TURN SONO FINITI. I MORENI TI HANNO TROLLATO.</div>
            <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-6 text-lg">
              <div className="border border-edge bg-black/50 px-4 py-2">CARISMA <span className="text-gold text-2xl">{score}</span></div>
              <div className="border border-edge bg-black/50 px-4 py-2">CATENA MAX <span className="text-toxic text-2xl">x{bestCombo}</span></div>
              <div className="border border-edge bg-black/50 px-4 py-2">ROUND <span className="text-toxic text-2xl">{round}</span></div>
              <div className="border border-edge bg-black/50 px-4 py-2">ALBUM <span className="text-toxic text-2xl">{collected}/8</span></div>
            </div>
            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              {SPECIES.map((s) =>
                album[s.id] ? (
                  <div key={s.id} className="flex flex-col items-center gap-1">
                    <BlobAvatar species={s} size={52} />
                    <div className="text-[10px] text-dim tracking-wider">{s.name}</div>
                  </div>
                ) : (
                  <div key={s.id} className="flex flex-col items-center gap-1 opacity-30">
                    <div className="w-[52px] h-[52px] rounded-full border-2 border-dashed border-dim flex items-center justify-center text-dim text-2xl">?</div>
                    <div className="text-[10px] text-dim tracking-wider">???</div>
                  </div>
                )
              )}
            </div>
            <div className="flex gap-4 justify-center mt-8">
              <button onClick={startGame} className="btn-hard bg-blood text-black font-display font-black text-2xl md:text-3xl px-10 py-3 border-2 border-[#ff8aa8]">
                RIPROVA — INVIO
              </button>
              <button onClick={goMenu} className="btn-hard bg-panel2 text-dim font-display font-bold text-2xl px-8 py-3 border-2 border-edge hover:text-bone">
                MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------ vittoria ------------------------------ */}
      {screen === "victory" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6" style={{ background: "radial-gradient(ellipse at center, rgba(58,42,6,0.85) 0%, rgba(12,7,2,0.95) 100%)" }}>
          <div className="text-center max-w-2xl w-full">
            <div className="font-display font-black text-7xl md:text-9xl text-gold leading-none text-outline" style={{ textShadow: "0 0 40px rgba(255,201,77,0.6)" }}>
              ALBUM COMPLETO
            </div>
            <div className="text-toxic text-xl md:text-2xl mt-4">
              IL CONSIGLIO DEGLI 8 MORENI TI NOMINA<br />MORENO ONORARIO AD HONOREM
            </div>
            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              {SPECIES.map((s) => (
                <div key={s.id} className="pop-in" style={{ animationDelay: `${SPECIES.indexOf(s) * 0.08}s` }}>
                  <BlobAvatar species={s} size={54} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-6 text-lg">
              <div className="border border-gold/50 bg-black/50 px-4 py-2">CARISMA <span className="text-gold text-2xl">{score}</span></div>
              <div className="border border-gold/50 bg-black/50 px-4 py-2">CATENA MAX <span className="text-toxic text-2xl">x{bestCombo}</span></div>
              <div className="border border-gold/50 bg-black/50 px-4 py-2">ROUND <span className="text-toxic text-2xl">{round}</span></div>
            </div>
            <div className="flex gap-4 justify-center mt-8 flex-wrap">
              <button onClick={continueEndless} className="btn-hard bg-gold text-black font-display font-black text-2xl md:text-3xl px-10 py-3 border-2 border-[#ffe3a3]">
                CONTINUA — INVIO
              </button>
              <button onClick={goMenu} className="btn-hard bg-panel2 text-dim font-display font-bold text-2xl px-8 py-3 border-2 border-edge hover:text-bone">
                MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
