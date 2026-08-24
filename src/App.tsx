import React, { useEffect, useRef, useState } from "react";
import { MoreniEngine } from "./game/engine";
import { sfx } from "./game/audio";
import {
  CAST,
  FLAVOR_LIST,
  FLAVORS,
  ITEMS,
  SCRIPTS,
  SWORD_REQ,
  TRIAL_QUIZ,
  ZONES,
  enemyStats,
  pick,
  rollWild,
  speciesById,
  type DialogueLine,
  type FlavorId,
  type SpeciesDef,
  type ZoneDef,
} from "./game/data";

type Phase = "title" | "dialogue" | "starter" | "world" | "battle" | "quiz" | "hug" | "victory" | "gameover";

const hexCss = (n: number) => "#" + n.toString(16).padStart(6, "0");

/* ================================================= RITRATTI SVG */
function HeartSvg({ size = 14, on = true }: { size?: number; on?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21 C5 14.5 2 11 2 7.5 C2 4.5 4.5 2.5 7 2.5 C9 2.5 11 3.8 12 5.5 C13 3.8 15 2.5 17 2.5 C19.5 2.5 22 4.5 22 7.5 C22 11 19 14.5 12 21 Z"
        fill={on ? "#ff2e5f" : "#2a1b45"}
        stroke={on ? "#ffd1dd" : "#4a2b6e"}
        strokeWidth="1.4"
      />
    </svg>
  );
}

function MorenoFace({ sp, size = 72 }: { sp: SpeciesDef; size?: number }) {
  if (sp.id === "clomp") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <path d="M50 8 C30 8 24 34 26 60 L34 96 L66 96 L74 60 C76 34 70 8 50 8 Z" fill="#2f5fe0" />
        <ellipse cx="50" cy="52" rx="19" ry="21" fill="#f2c9a0" />
        <rect x="38" y="48" width="9" height="2.6" rx="1.3" fill="#1a0f2e" />
        <rect x="53" y="48" width="9" height="2.6" rx="1.3" fill="#1a0f2e" />
        <path d="M46 62 Q50 65 54 62" stroke="#b06a3a" strokeWidth="2" fill="none" />
        <rect x="24" y="40" width="8" height="42" rx="4" fill="#2f5fe0" />
        <rect x="68" y="40" width="8" height="42" rx="4" fill="#2f5fe0" />
      </svg>
    );
  }
  const body = hexCss(sp.bodyColor);
  const belly = hexCss(sp.bellyColor);
  const acc = hexCss(sp.accentColor);
  const p = sp.parts;
  const isBoss = sp.id === "maialedelmondo" || sp.id === "maledelmondo";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {p.horns && (
        <>
          <polygon points="26,28 33,6 41,24" fill={acc} />
          <polygon points="59,24 67,6 74,28" fill={acc} />
        </>
      )}
      {p.catEars && (
        <>
          <polygon points="24,32 31,10 41,27" fill={body} />
          <polygon points="59,27 69,10 76,32" fill={body} />
        </>
      )}
      {p.antenna && (
        <>
          <rect x="48" y="10" width="4" height="16" fill={acc} />
          <circle cx="50" cy="9" r="5" fill={acc} />
        </>
      )}
      {p.bun && <circle cx="50" cy="15" r="11" fill="#d7dde2" />}
      {p.beret && <ellipse cx="54" cy="20" rx="22" ry="8" fill="#c0392b" />}
      {p.hood && <path d="M20 55 C20 18 80 18 80 55 L80 40 C80 8 20 8 20 40 Z" fill="#12081f" />}
      <circle cx="50" cy="55" r="35" fill={body} />
      <ellipse cx="50" cy="68" rx="22" ry="15" fill={belly} />
      {p.crown && (
        <polygon points="28,24 35,8 43,20 50,3 57,20 65,8 72,24 70,30 30,30" fill="#ffd700" stroke="#8a6a00" strokeWidth="2" />
      )}
      {p.sunglasses ? (
        <>
          <rect x="24" y="42" width="52" height="13" rx="3" fill="#0d0d12" />
          <rect x="28" y="45" width="18" height="3" fill="#3a3a4a" />
        </>
      ) : (
        <>
          <circle cx="37" cy="48" r="9" fill="#ffffff" />
          <circle cx="63" cy="48" r="9" fill="#ffffff" />
          <circle cx="37" cy="49" r="4" fill={isBoss ? "#ff2e5f" : "#12060c"} />
          <circle cx="63" cy="49" r="4" fill={isBoss ? "#ff2e5f" : "#12060c"} />
          {isBoss && (
            <>
              <rect x="26" y="34" width="20" height="5" fill="#2a1208" transform="rotate(18 36 36)" />
              <rect x="54" y="34" width="20" height="5" fill="#2a1208" transform="rotate(-18 64 36)" />
            </>
          )}
          {p.tears && (
            <>
              <ellipse cx="32" cy="62" rx="3.6" ry="6" fill="#6fd7ff" />
              <ellipse cx="68" cy="62" rx="3.6" ry="6" fill="#6fd7ff" />
            </>
          )}
        </>
      )}
      {p.glasses && (
        <>
          <circle cx="37" cy="48" r="12" fill="none" stroke="#2d2438" strokeWidth="3" />
          <circle cx="63" cy="48" r="12" fill="none" stroke="#2d2438" strokeWidth="3" />
          <rect x="46" y="46" width="8" height="3" fill="#2d2438" />
        </>
      )}
      {p.bolts && (
        <>
          <rect x="6" y="46" width="11" height="6" fill="#9aa5b1" />
          <rect x="83" y="46" width="11" height="6" fill="#9aa5b1" />
        </>
      )}
      {p.mustache && (
        <>
          <rect x="32" y="66" width="16" height="4" fill="#2d2438" transform="rotate(-14 40 68)" />
          <rect x="52" y="66" width="16" height="4" fill="#2d2438" transform="rotate(14 60 68)" />
        </>
      )}
      {p.snout ? (
        <>
          <ellipse cx="50" cy="66" rx="11" ry="8" fill={belly} stroke="#8a5a30" strokeWidth="2" />
          <circle cx="46" cy="66" r="2.2" fill="#47101f" />
          <circle cx="54" cy="66" r="2.2" fill="#47101f" />
        </>
      ) : (
        <ellipse cx="50" cy="70" rx="7.5" ry="5" fill="#47101f" />
      )}
      {p.tusks && (
        <>
          <polygon points="34,72 30,60 40,68" fill="#f5e6c8" />
          <polygon points="66,72 70,60 60,68" fill="#f5e6c8" />
        </>
      )}
      {p.heart && (
        <path
          d="M50 22 C46 16 38 16 38 22 C38 27 45 31 50 35 C55 31 62 27 62 22 C62 16 54 16 50 22 Z"
          fill="#ff4f9a"
        />
      )}
      {p.chain && (
        <ellipse cx="50" cy="86" rx="27" ry="8" fill="none" stroke={acc} strokeWidth="4" strokeDasharray="6 4" />
      )}
    </svg>
  );
}

function TuFace({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <path d="M14 92 C14 42 30 10 50 10 C70 10 86 42 86 92 Z" fill="#241539" stroke="#3a2458" strokeWidth="3" />
      <ellipse cx="50" cy="58" rx="21" ry="26" fill="#0d0716" />
      <circle cx="42" cy="53" r="3.4" fill="#4dffa6" />
      <circle cx="58" cy="53" r="3.4" fill="#4dffa6" />
      <rect x="37" y="72" width="26" height="7" rx="2" fill="#4dffa6" opacity="0.55" />
    </svg>
  );
}

function CookieIcon({ css, size = 26 }: { css: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill={css} stroke="#3d2008" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.4" fill="#2a1503" />
      <circle cx="6.8" cy="9" r="1.1" fill="#ffe9c9" />
      <circle cx="16.5" cy="8" r="1.1" fill="#ff6fa5" />
      <circle cx="17" cy="15.5" r="1.1" fill="#ffe9c9" />
      <circle cx="8" cy="16" r="1.1" fill="#9bd84b" />
    </svg>
  );
}

/* ================================================= DIALOGO JRPG */
function DialogueBox({
  lines,
  onDone,
  onChoice,
}: {
  lines: DialogueLine[];
  onDone: () => void;
  onChoice?: (idx: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const line = lines[Math.min(idx, lines.length - 1)];
  const full = line.text;

  useEffect(() => setChars(0), [idx, lines]);
  useEffect(() => {
    if (chars < full.length) {
      const t = window.setTimeout(() => {
        setChars((c) => {
          if (c % 3 === 0) sfx.type();
          return c + 1;
        });
      }, 14);
      return () => window.clearTimeout(t);
    }
  }, [chars, full]);

  const advance = () => {
    sfx.click();
    if (chars < full.length) {
      setChars(full.length);
      return;
    }
    if (line.choices && onChoice) return; // aspetta la scelta
    if (idx + 1 < lines.length) setIdx(idx + 1);
    else onDone();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const spk = line.spk;
  const sp = spk === "TU" || spk === "NARRATORE" ? null : speciesById(spk);
  const isNarrator = spk === "NARRATORE";
  const acc = sp ? hexCss(sp.accentColor) : spk === "TU" ? "#4dffa6" : "#bfa8ff";
  const name = sp ? sp.name : spk === "TU" ? "TU — EVOCATORE MEDIOCRE" : "PROFEZIA DI MORENOPOLI";

  return (
    <div className="dlg-root" onClick={advance}>
      <div className="dlg-box relative" style={{ "--acc": acc } as React.CSSProperties}>
        <div className="dlg-name" style={{ background: acc, color: "#0b0614" }}>
          {name}
        </div>
        <div className="flex gap-4 items-center">
          {!isNarrator && (
            <div className="dlg-portrait">{sp ? <MorenoFace sp={sp} size={76} /> : <TuFace size={76} />}</div>
          )}
          <div className={`dlg-text flex-1 ${isNarrator ? "narrator" : ""}`}>
            {full.slice(0, chars)}
            <span className="blink">▌</span>
          </div>
        </div>
        {chars >= full.length && line.choices && onChoice ? (
          <div className="dlg-choices" onClick={(e) => e.stopPropagation()}>
            {line.choices.map((ch, i) => (
              <button key={i} className="dlg-choice" onClick={() => onChoice(i)}>
                ▸ {ch}
              </button>
            ))}
          </div>
        ) : (
          <div className="dlg-hint">
            [SPAZIO / CLICK] {chars < full.length ? "COMPLETA" : idx + 1 < lines.length ? "CONTINUA ▼" : "AVANTI ▼"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================= BARRA HP */
function HpBar({ hp, max, w = 110, col = "#4dffa6" }: { hp: number; max: number; w?: number; col?: string }) {
  const pct = Math.max(0, Math.min(1, hp / max));
  const c = pct > 0.5 ? col : pct > 0.22 ? "#ffc94d" : "#ff2e5f";
  return (
    <div style={{ width: w, height: 9 }} className="border border-edge bg-[#120a20]">
      <div style={{ width: `${pct * 100}%`, height: "100%", background: c, transition: "width 0.25s ease" }} />
    </div>
  );
}

/* ================================================= GIOCO */
interface Flags {
  cinghiaBeaten: boolean;
  micoDone: boolean;
  coizioDone: boolean;
  ginoDone: boolean;
  don2: boolean;
  swordPulled: boolean;
  clompAwake: boolean;
  finaleDone: boolean;
}
const initialFlags: Flags = {
  cinghiaBeaten: false,
  micoDone: false,
  coizioDone: false,
  ginoDone: false,
  don2: false,
  swordPulled: false,
  clompAwake: false,
  finaleDone: false,
};

interface PartyMon {
  spId: string;
  hp: number;
  maxHp: number;
  atk: number;
}

interface BattleState {
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAtk: number;
  boss: boolean;
  wild: boolean;
  cinghia: boolean;
  male: boolean;
  convinced: boolean;
  captureBoost: number;
  busy: boolean;
  midPlayed: boolean;
  log: { id: number; text: string; kind: "info" | "good" | "bad" }[];
}

function makeMon(spId: string): PartyMon {
  const s = speciesById(spId);
  return { spId, hp: s.baseHp, maxHp: s.baseHp, atk: s.baseAtk };
}

/* ================================================= SALVATAGGIO LOCALSTORAGE */
const SAVE_KEY = "shin-moreni-tensei-save-v1";

interface SaveData {
  flags: Flags;
  party: PartyMon[];
  items: string[];
  score: number;
  activeIdx: number;
  pos: { x: number; z: number };
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData;
    if (!d || typeof d !== "object" || !Array.isArray(d.party) || !d.flags) return null;
    return d;
  } catch {
    return null;
  }
}

function writeSave(d: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(d));
  } catch {
    /* storage pieno o non disponibile: ignora */
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignora */
  }
}

function MoreniGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MoreniEngine | null>(null);

  const [phase, setPhase] = useState<Phase>("title");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [flags, setFlags] = useState<Flags>(initialFlags);
  const [party, setParty] = useState<PartyMon[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const [dlgLines, setDlgLines] = useState<DialogueLine[]>([]);
  const [banner, setBanner] = useState<{ kicker: string; title: string; boss: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [zone, setZone] = useState<ZoneDef | null>(null);
  const [nearId, setNearId] = useState<string | null>(null);
  const [bt, setBt] = useState<BattleState | null>(null);
  const [offerMode, setOfferMode] = useState(false);
  const [switchMode, setSwitchMode] = useState(false);
  const [flash, setFlash] = useState<{ kind: "red" | "gold"; key: number } | null>(null);
  const [quiz, setQuiz] = useState({ q: 0, hearts: 3 });
  const [hug, setHug] = useState({ progress: 0, running: false, done: false });

  const phaseRef = useRef<Phase>("title");
  const pausedRef = useRef(false);
  const flagsRef = useRef<Flags>(initialFlags);
  const partyRef = useRef<PartyMon[]>([]);
  const activeIdxRef = useRef(0);
  const itemsRef = useRef<string[]>([]);
  const btRef = useRef<BattleState | null>(null);
  const afterDlgRef = useRef<(() => void) | null>(null);
  const onChoiceRef = useRef<((i: number) => void) | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const hugHeldRef = useRef(false);
  const hugDoneRef = useRef(false);
  const bannerTRef = useRef<number | null>(null);
  const toastTRef = useRef<number | null>(null);
  const logIdRef = useRef(0);
  const gameStartedRef = useRef(false);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);
  useEffect(() => {
    partyRef.current = party;
  }, [party]);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    btRef.current = bt;
  }, [bt]);

  /* controllo save all'avvio */
  useEffect(() => {
    setHasSave(loadSave() !== null);
  }, []);

  /* autosave: ogni progresso significativo finisce in localStorage */
  useEffect(() => {
    if (!gameStartedRef.current) return;
    const pos = engineRef.current?.getPlayerPos() ?? { x: 0, z: 9 };
    writeSave({ flags, party, items, score, activeIdx, pos });
  }, [flags, party, items, score, activeIdx]);

  /* ---------------- helpers ---------------- */
  const patchBt = (p: Partial<BattleState>) => {
    setBt((b) => (b ? { ...b, ...p } : b));
  };
  const bLog = (text: string, kind: "info" | "good" | "bad" = "info") => {
    setBt((b) => (b ? { ...b, log: [...b.log.slice(-3), { id: ++logIdRef.current, text, kind }] } : b));
  };
  const doFlash = (kind: "red" | "gold") => setFlash({ kind, key: Date.now() });
  const addScore = (n: number) => setScore((s) => s + n);

  const showBanner = (kicker: string, title: string, boss: boolean) => {
    setBanner({ kicker, title, boss });
    if (bannerTRef.current) window.clearTimeout(bannerTRef.current);
    bannerTRef.current = window.setTimeout(() => setBanner(null), 2250);
  };
  const showToast = (t: string) => {
    setToast(t);
    if (toastTRef.current) window.clearTimeout(toastTRef.current);
    toastTRef.current = window.setTimeout(() => setToast(null), 2850);
  };

  const say = (script: string, after?: () => void) => {
    setDlgLines(SCRIPTS[script]);
    // Torna sempre al mondo, poi il callback può cambiare fase (battle/quiz/hug/...).
    // Senza questo, i dialoghi senza fase di uscita (coizio_win, mico_win, don2...) bloccavano il gioco.
    afterDlgRef.current = () => {
      setPhase("world");
      after?.();
    };
    onChoiceRef.current = null;
    setPhase("dialogue");
  };

  const addItem = (id: string) => {
    setItems((it) => (it.includes(id) ? it : [...it, id]));
    showToast(`OGGETTO: ${ITEMS[id].name} — ${ITEMS[id].desc}`);
  };

  const recruitsCount = () => new Set(party.map((m) => m.spId)).size;

  /* ---------------- quest ---------------- */
  const questRingTarget = (f: Flags): string | null => {
    if (!f.cinghiaBeaten) return "cinghia";
    if (!f.micoDone) return "mico";
    if (!f.coizioDone) return "coizio";
    if (!f.ginoDone) return "gino";
    if (!f.don2) return "don";
    if (!f.swordPulled) return "monument";
    return null;
  };
  const questText = (f: Flags): string => {
    if (!f.cinghiaBeaten) return "OBIETTIVO: affronta CINGHIA ALE — Valle dei Facoceri";
    if (!f.micoDone) return "OBIETTIVO: il processo di MICO NOSCA — Accampamento della Rivolta";
    if (!f.coizioDone) return "OBIETTIVO: l'abbraccio di COIZIO — Terme del Contatto";
    if (!f.ginoDone) return "OBIETTIVO: la cantina di GINO SATRI — Abisso";
    if (!f.don2) return "OBIETTIVO: torna da DON MORENO (puzza di colpo di scena)";
    if (!f.swordPulled) return `OBIETTIVO: estrai la Spada dell'Amore (servono ${SWORD_REQ} amici: ${recruitsCount()}/${SWORD_REQ})`;
    if (!f.clompAwake) return "OBIETTIVO: sveglia CLOMP, il cavaliere sacro";
    if (!f.finaleDone) return "OBIETTIVO: entra nel PORTALE DELL'ANTRO";
    return "LA PROFEZIA È COMPIUTA. GIRA LIBERO, EROE.";
  };

  useEffect(() => {
    engineRef.current?.setQuestNpc(questRingTarget(flags));
  }, [flags]);

  /* ---------------- engine ---------------- */
  useEffect(() => {
    const eng = new MoreniEngine(mountRef.current!);
    engineRef.current = eng;
    eng.onZone = (id) => {
      const z = ZONES.find((zz) => zz.id === id) ?? null;
      setZone(z);
      if (z && z.id !== "morenopoli" && phaseRef.current === "world") {
        showBanner(z.diff >= 3 ? "ZONA PERICOLOSA" : "NUOVA ZONA", z.name, z.diff >= 3);
      }
    };
    eng.onEncounter = (spId, diff) => {
      if (phaseRef.current !== "world" || pausedRef.current) return;
      sfx.appear();
      startWildBattle(spId, diff);
    };
    eng.onPortal = () => {
      if (phaseRef.current !== "world" || pausedRef.current) return;
      say("antro_intro", () => startScriptedBattle("maialedelmondo", { boss: true, male: true }));
    };
    eng.onNear = (id) => setNearId(id);
    eng.start();
    return () => {
      eng.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- movimento ---------------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      keysRef.current[k] = true;
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    const iv = window.setInterval(() => {
      const k = keysRef.current;
      let x = 0;
      let z = 0;
      if (k["w"] || k["arrowup"]) z -= 1;
      if (k["s"] || k["arrowdown"]) z += 1;
      if (k["a"] || k["arrowleft"]) x -= 1;
      if (k["d"] || k["arrowright"]) x += 1;
      const active = phaseRef.current === "world" && !pausedRef.current;
      engineRef.current?.setInput(active ? x : 0, active ? z : 0);
    }, 40);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.clearInterval(iv);
    };
  }, []);

  /* ---------------- tastiera globale ---------------- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "m") {
        setMuted((m) => {
          sfx.setMuted(!m);
          return !m;
        });
        return;
      }
      if (k === "p" || k === "escape") {
        const ph = phaseRef.current;
        if (ph === "world" || ph === "battle") togglePause();
        return;
      }
      if (k === "e" && phaseRef.current === "world" && !pausedRef.current) {
        const near = engineRef.current?.getNearId() ?? null;
        if (near) interact(near);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- abbraccio ---------------- */
  useEffect(() => {
    if (phase !== "hug" || !hug.running || hug.done) return;
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        hugHeldRef.current = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") hugHeldRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    const iv = window.setInterval(() => {
      setHug((h) => {
        if (h.done) return h;
        const next = Math.max(0, Math.min(100, h.progress + (hugHeldRef.current ? 2.4 : -1.4)));
        if (next >= 100 && !h.done && !hugDoneRef.current) {
          hugDoneRef.current = true;
          hugHeldRef.current = false;
          window.setTimeout(() => finishHug(), 350);
          return { ...h, progress: 100, done: true };
        }
        return { ...h, progress: next };
      });
    }, 40);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, hug.running, hug.done]);

  /* ---------------- avvio ---------------- */
  const startGame = () => {
    sfx.unlock();
    sfx.start();
    clearSave();
    gameStartedRef.current = true;
    setScore(0);
    setFlags(initialFlags);
    setParty([]);
    setItems([]);
    setActiveIdx(0);
    setBt(null);
    engineRef.current?.companionFollow(false);
    engineRef.current?.setPortalOpen(false);
    engineRef.current?.setSwordVisible(true);
    engineRef.current?.setClompAwakeState(false);
    say("prologue", () => setPhase("starter"));
  };

  const continueGame = () => {
    const save = loadSave();
    if (!save) {
      startGame();
      return;
    }
    sfx.unlock();
    sfx.start();
    gameStartedRef.current = true;
    const healed = save.party.map((m) => ({ ...m, hp: m.maxHp }));
    setFlags(save.flags);
    setParty(healed);
    setActiveIdx(Math.min(save.activeIdx, Math.max(0, healed.length - 1)));
    setItems(save.items);
    setScore(save.score);
    setBt(null);
    engineRef.current?.companionFollow(save.flags.clompAwake);
    engineRef.current?.setPortalOpen(save.flags.clompAwake);
    engineRef.current?.setSwordVisible(!save.flags.swordPulled);
    engineRef.current?.setClompAwakeState(save.flags.clompAwake);
    engineRef.current?.enterWorld(save.pos.x, save.pos.z);
    setPhase("world");
    showBanner("BENTORNATO", "LA PROFEZIA CONTINUA", false);
  };

  const pickStarter = (spId: string) => {
    sfx.recruit();
    setParty([makeMon(spId)]);
    setActiveIdx(0);
    setPhase("world");
    engineRef.current?.enterWorld(0, 9);
    showBanner("MORENOPOLI", "LA PROFEZIA INIZIA", false);
  };

  /* ---------------- interazioni mondo ---------------- */
  const interact = (id: string) => {
    const f = flagsRef.current;
    sfx.click();
    if (id === "don") {
      if (f.ginoDone && !f.don2) {
        say("don2", () => {
          setFlags((fl) => ({ ...fl, don2: true }));
        });
      } else {
        say("don1");
      }
      return;
    }
    if (id === "monument") {
      if (f.swordPulled) {
        showToast("IL GRANDE MORENINO TI FA L'OCCHIOLINO. SENZA SPADA, ORMAI.");
        return;
      }
      if (recruitsCount() >= SWORD_REQ) {
        engineRef.current?.pullSwordFx(() => {
          say("sword_pull", () => {
            setFlags((fl) => ({ ...fl, swordPulled: true }));
            engineRef.current?.awakenClompFx(() => {
              const clomp = makeMon("clomp");
              setParty((p) => (p.length < 8 ? [...p, clomp] : p));
              setFlags((fl) => ({ ...fl, clompAwake: true }));
              engineRef.current?.setPortalOpen(true);
              engineRef.current?.companionFollow(true);
              showToast("CLOMP SI È UNITO AL PARTY — IL PORTALE DELL'ANTRO È APERTO");
              setPhase("world");
            });
          });
        });
      } else {
        say("sword_fail");
      }
      return;
    }
    if (id === "clomp") {
      if (!f.swordPulled) {
        showToast("DORME PROFONDAMENTE. SOGNA SPADA E MORENINI.");
      } else if (!f.clompAwake) {
        showToast("SI STA STIRACCHIANDO... DAGLI UN SECONDO.");
      } else {
        showToast("CLOMP: «TI SEGUO OVUNQUE, CAPO. ANCHE IN MENSA.»");
      }
      return;
    }
    if (id === "cinghia") {
      if (f.cinghiaBeaten) {
        showToast("CINGHIA ALE: «GRUF. IL FANGO È CALMO. VAI PURE.»");
        return;
      }
      say("cinghia_pre", () => startScriptedBattle("cinghiaale", { boss: true, cinghia: true }));
      return;
    }
    if (id === "mico") {
      if (f.micoDone) {
        showToast("MICO: «LA RIVOLTA TI SALUTA. E TI RINGRAZIA.»");
        return;
      }
      say("mico1", () => {
        setQuiz({ q: 0, hearts: 3 });
        startQuizQuestion(0);
      });
      return;
    }
    if (id === "coizio") {
      if (f.coizioDone) {
        showToast("COIZIO: «...un altro abbraccio? quando vuoi.»");
        return;
      }
      say("coizio1", () => {
        hugDoneRef.current = false;
        setHug({ progress: 0, running: true, done: false });
        setPhase("hug");
      });
      return;
    }
    if (id === "gino") {
      if (f.ginoDone) {
        showToast("GINO: «ho lo stomaco leggero. grazie. davvero.»");
        return;
      }
      say("gino1", () => startScriptedBattle("maledelmondo", { boss: true }));
      return;
    }
  };

  /* ---------------- quiz ---------------- */
  const startQuizQuestion = (q: number) => {
    setDlgLines(SCRIPTS[TRIAL_QUIZ.scripts[q]]);
    onChoiceRef.current = (i: number) => answerQuiz(q, i);
    setPhase("quiz");
  };

  const answerQuiz = (q: number, i: number) => {
    sfx.click();
    if (i === TRIAL_QUIZ.answers[q]) {
      sfx.correct();
      if (q + 1 < TRIAL_QUIZ.scripts.length) {
        startQuizQuestion(q + 1);
      } else {
        say("mico_win", () => {
          addItem("spilla");
          addScore(100);
          setFlags((fl) => ({ ...fl, micoDone: true }));
        });
      }
    } else {
      sfx.wrong();
      doFlash("red");
      const hearts = quiz.hearts - 1;
      setQuiz((z) => ({ ...z, hearts }));
      if (hearts <= 0) {
        say("mico_fail", () => setPhase("world"));
      } else {
        startQuizQuestion(q);
      }
    }
  };

  /* ---------------- abbraccio fine ---------------- */
  const finishHug = () => {
    sfx.recruit();
    doFlash("gold");
    say("coizio_win", () => {
      addItem("abbraccio");
      addScore(100);
      setFlags((fl) => ({ ...fl, coizioDone: true }));
    });
  };

  /* ---------------- battaglie ---------------- */
  const startWildBattle = (spId: string, diff: number) => {
    const st = enemyStats(spId, diff);
    const b: BattleState = {
      enemyId: spId,
      enemyHp: st.hp,
      enemyMaxHp: st.hp,
      enemyAtk: st.atk,
      boss: false,
      wild: true,
      cinghia: false,
      male: false,
      convinced: false,
      captureBoost: diff * 8,
      busy: false,
      midPlayed: false,
      log: [{ id: ++logIdRef.current, text: `${speciesById(spId).name} SELVATICO TI SFIDA!`, kind: "bad" }],
    };
    btRef.current = b;
    setBt(b);
    setOfferMode(false);
    setSwitchMode(false);
    const active = partyRef.current[activeIdxRef.current] ?? partyRef.current[0];
    setPhase("battle");
    engineRef.current?.startBattle(speciesById(active.spId), speciesById(spId), false);
  };

  const startScriptedBattle = (spId: string, opts: { boss?: boolean; cinghia?: boolean; male?: boolean }) => {
    const st = enemyStats(spId, 0);
    const b: BattleState = {
      enemyId: spId,
      enemyHp: st.hp,
      enemyMaxHp: st.hp,
      enemyAtk: st.atk,
      boss: !!opts.boss,
      wild: false,
      cinghia: !!opts.cinghia,
      male: !!opts.male,
      convinced: false,
      captureBoost: 0,
      busy: false,
      midPlayed: false,
      log: [
        {
          id: ++logIdRef.current,
          text: opts.male ? "IL FACOCEMORENO FINALE SI ERGE. GRUF COSMICO." : `${speciesById(spId).name} NON HA INTENZIONE DI TRATTARE.`,
          kind: "bad",
        },
      ],
    };
    btRef.current = b;
    setBt(b);
    setOfferMode(false);
    setSwitchMode(false);
    const active = partyRef.current[activeIdxRef.current] ?? partyRef.current[0];
    setPhase("battle");
    engineRef.current?.startBattle(speciesById(active.spId), speciesById(spId), !!opts.boss);
    if (opts.boss) sfx.appear();
    if (opts.male) showBanner("BOSS FINALE", "MAIALE DEL MONDO", true);
    else if (opts.cinghia) showBanner("CAPO TRIBÙ", "CINGHIA ALE", true);
    else showBanner("BOSS", "MALE DEL MONDO", true);
  };

  const hasItem = (id: string) => itemsRef.current.includes(id);

  const playerAttack = () => {
    const b = btRef.current;
    if (!b || b.busy || phaseRef.current !== "battle") return;
    setOfferMode(false);
    setSwitchMode(false);
    patchBt({ busy: true });
    const mon = partyRef.current[activeIdxRef.current];
    let dmg = Math.round(mon.atk * (0.85 + Math.random() * 0.3));
    if (hasItem("spilla")) dmg = Math.round(dmg * 1.25);
    let double = false;
    if (hasItem("fiala") && Math.random() < 0.15) {
      dmg *= 2;
      double = true;
    }
    sfx.click();
    engineRef.current?.battleAttack("player", () => {
      sfx.correct();
      doFlash("gold");
      const newHp = Math.max(0, b.enemyHp - dmg);
      patchBt({ enemyHp: newHp });
      bLog(double ? `FIALA OMEOPATICA! ${speciesById(mon.spId).name} colpisce DOPPIO: ${dmg} danni!` : `${speciesById(mon.spId).name} colpisce: ${dmg} danni!`, "good");
      afterPlayerAction(newHp);
    });
  };

  const afterPlayerAction = (newEnemyHp: number) => {
    const b = btRef.current;
    if (!b) return;
    if (newEnemyHp <= 0) {
      onEnemyDefeated();
      return;
    }
    if (b.male && !b.midPlayed && newEnemyHp <= b.enemyMaxHp / 2) {
      patchBt({ midPlayed: true });
      say("maiale_mid", () => {
        setPhase("battle");
        patchBt({ busy: false });
      });
      return;
    }
    // turno nemico
    window.setTimeout(() => enemyTurn(), 350);
  };

  const enemyTurn = () => {
    const b = btRef.current;
    if (!b) return;
    engineRef.current?.battleAttack("enemy", () => {
      sfx.wrong();
      doFlash("red");
      engineRef.current?.shake(0.3);
      const idx = activeIdxRef.current;
      const mon = partyRef.current[idx];
      const dmg = Math.max(1, Math.round(b.enemyAtk * (0.85 + Math.random() * 0.3)));
      const newHp = Math.max(0, mon.hp - dmg);
      const newParty = partyRef.current.map((m, i) => (i === idx ? { ...m, hp: newHp } : m));
      partyRef.current = newParty;
      setParty(newParty);
      bLog(`${speciesById(b.enemyId).name} ti colpisce: ${dmg} danni a ${speciesById(mon.spId).name}!`, "bad");
      if (newHp <= 0) {
        engineRef.current?.battleFaint("player", () => {
          const next = newParty.findIndex((m) => m.hp > 0);
          if (next < 0) {
            wipe();
            return;
          }
          setActiveIdx(next);
          activeIdxRef.current = next;
          engineRef.current?.setActiveSpecies(speciesById(newParty[next].spId));
          bLog(`VAI, ${speciesById(newParty[next].spId).name}!`, "info");
          patchBt({ busy: false });
        });
      } else {
        patchBt({ busy: false });
      }
    });
  };

  const offerMorenino = (flavor: FlavorId) => {
    const b = btRef.current;
    if (!b || b.busy || phaseRef.current !== "battle") return;
    setOfferMode(false);
    patchBt({ busy: true });
    const enemy = speciesById(b.enemyId);
    if (flavor === enemy.favorite) {
      sfx.chomp();
      doFlash("gold");
      engineRef.current?.setEnemyConvinced(true);
      let boost = b.captureBoost + 30;
      if (hasItem("abbraccio")) boost += 20;
      patchBt({ convinced: true, captureBoost: boost });
      bLog(`MORENINO AL ${FLAVORS[flavor].name} ACCETTATO! ${enemy.name} SI È AMMORBIDITO. ORA PUOI CATTURARLO!`, "good");
      window.setTimeout(() => patchBt({ busy: false }), 450);
    } else {
      sfx.wrong();
      doFlash("red");
      bLog(`${enemy.name} SPUTA IL MORENINO AL ${FLAVORS[flavor].name}! VOLEVA ${FLAVORS[enemy.favorite].name}!`, "bad");
      window.setTimeout(() => enemyTurn(), 400);
    }
  };

  const tryCapture = () => {
    const b = btRef.current;
    if (!b || b.busy || !b.convinced || phaseRef.current !== "battle") return;
    if (b.male) {
      bLog("È IL NONNO DI DON MORENO. NON SI CATTURA: SI SALVA.", "info");
      return;
    }
    setOfferMode(false);
    setSwitchMode(false);
    patchBt({ busy: true });
    const chance = Math.min(95, 35 + b.captureBoost);
    const success = Math.random() * 100 < chance;
    bLog(`OFFERTA FINALE! MORENINO AL ${FLAVORS[speciesById(b.enemyId).favorite].name}... (${chance}%)`, "info");
    engineRef.current?.battleCaptureTry(success, () => {
      if (success) {
        sfx.recruit();
        doFlash("gold");
        addScore(150);
        if (b.cinghia) {
          finishCinghia();
          return;
        }
        const capId = b.enemyId;
        setParty((p) => {
          if (p.length < 8) {
            showToast(`${speciesById(capId).name} SI È UNITO AL PARTY!`);
            return [...p, makeMon(capId)];
          }
          addScore(75);
          showToast(`PARTY PIENO: ${speciesById(capId).name} TI SALUTA DA LONTANO (+75)`);
          return p;
        });
        bLog(`${speciesById(capId).name} È CONVINTO: AMICIZIA!`, "good");
        window.setTimeout(() => {
          engineRef.current?.endBattle();
          setBt(null);
          setPhase("world");
        }, 700);
      } else {
        sfx.wrong();
        bLog(`${speciesById(b.enemyId).name} HA ANCORA LE BRICIOLE STORTE. RIPROVA O COMBATTI!`, "bad");
        window.setTimeout(() => enemyTurn(), 500);
      }
    });
  };

  const tryFlee = () => {
    const b = btRef.current;
    if (!b || b.busy || phaseRef.current !== "battle") return;
    if (b.boss) {
      bLog("DA QUESTA BATTAGLIA NON SI SCAPPA. NESSUNO SCAPPA DAL GRUF.", "bad");
      sfx.wrong();
      return;
    }
    setOfferMode(false);
    setSwitchMode(false);
    patchBt({ busy: true });
    if (Math.random() < 0.7) {
      bLog("FUGA RIUSCITA! CORRI COME UN MORENINO IN FORNO.", "info");
      window.setTimeout(() => {
        engineRef.current?.endBattle();
        setBt(null);
        setPhase("world");
      }, 450);
    } else {
      bLog("FUGA FALLITA! IL MORENO TI BLOCCA LA STRADA.", "bad");
      window.setTimeout(() => enemyTurn(), 400);
    }
  };

  const switchMon = (idx: number) => {
    const b = btRef.current;
    if (!b || b.busy || idx === activeIdxRef.current || phaseRef.current !== "battle") return;
    const mon = partyRef.current[idx];
    if (!mon || mon.hp <= 0) return;
    setSwitchMode(false);
    patchBt({ busy: true });
    setActiveIdx(idx);
    activeIdxRef.current = idx;
    engineRef.current?.setActiveSpecies(speciesById(mon.spId));
    bLog(`VAI, ${speciesById(mon.spId).name}!`, "info");
    window.setTimeout(() => enemyTurn(), 500);
  };

  const finishCinghia = () => {
    setFlags((fl) => ({ ...fl, cinghiaBeaten: true }));
    say("cinghia_post", () => {
      setParty((p) => (p.some((m) => m.spId === "cinghiaale") || p.length >= 8 ? p : [...p, makeMon("cinghiaale")]));
      showToast("CINGHIA ALE SI È UNITO AL PARTY! LA TRIBÙ È CON TE.");
      addScore(200);
      engineRef.current?.endBattle();
      setBt(null);
      setPhase("world");
    });
  };

  const onEnemyDefeated = () => {
    const b = btRef.current;
    if (!b) return;
    patchBt({ busy: true });
    if (b.male) {
      setFlags((fl) => ({ ...fl, finaleDone: true }));
      engineRef.current?.battlePurify(speciesById("nonnopurificato"), () => {
        say("finale", () => {
          addScore(500);
          sfx.victory();
          clearSave();
          gameStartedRef.current = false;
          setPhase("victory");
        });
      });
      return;
    }
    if (b.cinghia) {
      engineRef.current?.battleFaint("enemy", () => finishCinghia());
      return;
    }
    if (b.enemyId === "maledelmondo") {
      setFlags((fl) => ({ ...fl, ginoDone: true }));
      engineRef.current?.battleFaint("enemy", () => {
        say("gino_post", () => {
          addItem("fiala");
          addScore(200);
          engineRef.current?.endBattle();
          setBt(null);
          setPhase("world");
        });
      });
      return;
    }
    // selvatico normale
    sfx.victory();
    addScore(b.boss ? 200 : 100);
    bLog(`${speciesById(b.enemyId).name} È AL TAPPETO! +${b.boss ? 200 : 100} CARISMA`, "good");
    engineRef.current?.battleFaint("enemy", () => {
      window.setTimeout(() => {
        engineRef.current?.endBattle();
        setBt(null);
        setPhase("world");
      }, 350);
    });
  };

  const wipe = () => {
    sfx.gameover();
    doFlash("red");
    engineRef.current?.endBattle();
    setBt(null);
    setPhase("gameover");
  };

  const revive = () => {
    sfx.click();
    const healed = partyRef.current.map((m) => ({ ...m, hp: m.maxHp }));
    partyRef.current = healed;
    setParty(healed);
    setActiveIdx(0);
    activeIdxRef.current = 0;
    setPhase("world");
    engineRef.current?.enterWorld(-1.5, 8);
    say("don_revive");
  };

  const togglePause = () => {
    sfx.pause();
    setPaused((p) => {
      const np = !p;
      pausedRef.current = np;
      engineRef.current?.setPaused(np);
      return np;
    });
  };

  const backToTitle = () => {
    sfx.click();
    setPaused(false);
    pausedRef.current = false;
    engineRef.current?.setPaused(false);
    engineRef.current?.endBattle();
    engineRef.current?.attractMode(true);
    setBt(null);
    setHasSave(loadSave() !== null);
    setPhase("title");
  };

  /* ---------------- render ---------------- */
  const inWorld = phase === "world";
  const inBattle = phase === "battle";
  const enemySp = bt ? speciesById(bt.enemyId) : null;
  const activeMon = party[activeIdx];

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-void font-term text-bone">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0 z-[5]" />
      <div className="scanlines crt-flicker pointer-events-none absolute inset-0 z-[40] opacity-70" />
      {inBattle && bt?.boss && <div className="boss-vignette" />}
      {flash && (
        <div key={flash.key} className={`pointer-events-none absolute inset-0 z-[35] ${flash.kind === "red" ? "flash-red" : "flash-gold"}`} />
      )}

      {/* ---------------- TITOLO ---------------- */}
      {phase === "title" && (
        <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(11,6,20,0.55),rgba(11,6,20,0.93))]">
          <div className="text-toxic tracking-[0.5em] text-sm md:text-base mb-2 title-float">✠ COMP-OS v6.66 PRESENTA ✠</div>
          <h1 className="font-display text-[12vw] md:text-[7rem] leading-[0.85] font-extrabold text-center text-bone text-outline pulse-glow">
            SHIN MORENI
            <br />
            <span className="text-blood">TENSEI</span>
          </h1>
          <p className="mt-3 text-gold tracking-[0.25em] text-lg md:text-2xl font-display">L'EPICA DEL MAIALE DEL MONDO</p>
          <p className="mt-1 text-dim text-base md:text-lg max-w-2xl text-center px-4">
            Un RPG demenziale ad aree esplorabili: combatti a turni, offri morenini per convincere i Moreni, recluta gli Otto
            Croccanti, sveglia il cavaliere Clomp e purifica il facocemoreno finale.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            {hasSave && (
              <button
                onClick={continueGame}
                className="btn-hard px-10 py-4 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-2xl md:text-3xl tracking-widest"
              >
                ▶ CONTINUA LA PROFEZIA
              </button>
            )}
            <button
              onClick={startGame}
              className="btn-hard px-10 py-4 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl md:text-3xl tracking-widest"
            >
              {hasSave ? "✠ NUOVA PROFEZIA" : "▶ INIZIA LA PROFEZIA"}
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm md:text-base max-w-3xl px-4 w-full">
            <div className="border-2 border-edge bg-panel/85 p-3">
              <div className="text-toxic font-display text-lg mb-1">MONDO</div>
              <ul className="text-dim space-y-0.5">
                <li>→ <span className="text-bone">WASD / FRECCE</span> per muoverti tra le 6 zone</li>
                <li>→ <span className="text-bone">E</span> per parlare con i capi e agire sugli obiettivi</li>
                <li>→ Segui l'<span className="text-gold">ANELLO DORATO</span>: è la tua prossima meta</li>
                <li>→ Attento: i Moreni vagano e TI ASSALTANO</li>
              </ul>
            </div>
            <div className="border-2 border-edge bg-panel/85 p-3">
              <div className="text-toxic font-display text-lg mb-1">BATTAGLIE</div>
              <ul className="text-dim space-y-0.5">
                <li>→ Turni: <span className="text-bone">ATTACCA</span> / <span className="text-bone">OFFRI MORENINO</span> / cambia / fuggi</li>
                <li>→ Offri il gusto giusto → il Moreno si ammorbidisce</li>
                <li>→ Poi <span className="text-gold">CATTURA</span> con l'offerta finale</li>
                <li>→ <span className="text-bone">P</span> pausa · <span className="text-bone">M</span> audio · <span className="text-bone">SPAZIO</span> nei dialoghi</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-dim text-xs tracking-widest">AUDIO CONSIGLIATO — I MORENI GRUFOLANO IN 8-BIT</div>
        </div>
      )}

      {/* ---------------- SCELTA STARTER ---------------- */}
      {phase === "starter" && (
        <div className="absolute inset-0 z-[25] flex flex-col items-center justify-center bg-[rgba(5,2,10,0.86)] px-4">
          <div className="font-display text-3xl md:text-5xl text-gold text-outline mb-1">DON MORENO TI AFFIDA UN COMPAGNO</div>
          <div className="text-dim mb-6 text-lg">«SCEGLI CON IL CUORE. TANTO POI LI RECLUTI TUTTI.»</div>
          <div className="flex flex-col md:flex-row gap-4">
            {["morenozzo", "morenello", "morenilla"].map((id) => {
              const s = speciesById(id);
              return (
                <button
                  key={id}
                  onClick={() => pickStarter(id)}
                  className="btn-hard roster-card w-56 py-4"
                  style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties}
                >
                  <MorenoFace sp={s} size={86} />
                  <div className="font-display text-xl mt-2" style={{ color: hexCss(s.accentColor) }}>
                    {s.name}
                  </div>
                  <div className="text-dim text-sm">{s.title}</div>
                  <div className="text-bone text-sm mt-1">
                    HP {s.baseHp} · ATK {s.baseAtk} · AMA IL {FLAVORS[s.favorite].name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- DIALOGO ---------------- */}
      {phase === "dialogue" && (
        <DialogueBox lines={dlgLines} onDone={() => afterDlgRef.current?.()} onChoice={onChoiceRef.current ?? undefined} />
      )}

      {/* ---------------- QUIZ ---------------- */}
      {phase === "quiz" && (
        <>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[31] flex gap-2 border-2 border-blood bg-panel px-4 py-2">
            {[0, 1, 2].map((i) => (
              <HeartSvg key={i} size={22} on={i < quiz.hearts} />
            ))}
            <span className="text-dim ml-2 self-center text-sm">IL PROCESSO DELLA RIVOLTA</span>
          </div>
          <DialogueBox lines={dlgLines} onDone={() => {}} onChoice={(i) => onChoiceRef.current?.(i)} />
        </>
      )}

      {/* ---------------- ABBRACCIO ---------------- */}
      {phase === "hug" && (
        <div className="absolute inset-0 z-[25] flex flex-col items-center justify-center bg-[rgba(20,4,16,0.82)]">
          <div className={`text-8xl md:text-9xl ${hug.done ? "" : "hug-heart"}`}>
            <svg width="150" height="150" viewBox="0 0 24 24">
              <path
                d="M12 21 C5 14.5 2 11 2 7.5 C2 4.5 4.5 2.5 7 2.5 C9 2.5 11 3.8 12 5.5 C13 3.8 15 2.5 17 2.5 C19.5 2.5 22 4.5 22 7.5 C22 11 19 14.5 12 21 Z"
                fill="#ff4f9a"
                stroke="#ffd9e8"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div className="font-display text-3xl md:text-4xl text-[#ff9ecf] mt-2 text-outline">L'ABBRACCIO ETERNO</div>
          <div className="text-dim mt-1 text-lg">{hug.done ? "...PERFETTO. LO SENTI ANCHE TU, VERO?" : "TIENI PREMUTO [SPAZIO] — RIEMPI IL CUORE"}</div>
          <div className="w-[min(480px,80vw)] h-7 border-2 border-[#ff4f9a] bg-[#1e1033] mt-4 overflow-hidden">
            <div className="hug-meter-fill h-full" style={{ width: `${hug.progress}%` }} />
          </div>
          <div className="text-[#ff9ecf] mt-1 tabular-nums">{Math.round(hug.progress)}%</div>
        </div>
      )}

      {/* ---------------- BANNER ---------------- */}
      {banner && (
        <div className="banner-root">
          <div className="banner-inner">
            <div className={`banner-kicker ${banner.boss ? "boss" : ""}`}>{banner.kicker}</div>
            <div className="banner-title">{banner.title}</div>
            <div className="banner-rule" />
          </div>
        </div>
      )}
      {toast && <div className="perk-toast">{toast}</div>}

      {/* ---------------- HUD MONDO ---------------- */}
      {inWorld && (
        <>
          <div className="absolute top-3 left-3 z-[15] pointer-events-none">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2 max-w-xs">
              <div className="text-toxic text-xs tracking-[0.3em]">{zone ? zone.name : "MORENOPOLI"}</div>
              <div className="text-dim text-sm">{zone ? zone.tagline : "La piazza profuma di forno spento."}</div>
              <div className="text-gold text-sm mt-1">{questText(flags)}</div>
            </div>
            <div className="border-2 border-edge bg-panel/85 px-3 py-1.5 mt-2 text-dim text-xs">
              WASD MUOVI · E INTERAGISCI · P PAUSA
            </div>
          </div>

          <div className="absolute top-3 right-3 z-[15] flex flex-col items-end gap-2">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2">
              <div className="text-gold text-lg leading-none mb-1.5">
                CARISMA: <span className="tabular-nums">{score}</span>
              </div>
              <div className="text-dim text-[10px] tracking-[0.3em] text-right mb-1">
                PARTY ({party.length}/8) · AMICI {recruitsCount()}/{SWORD_REQ}
              </div>
              <div className="flex flex-col gap-1">
                {party.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 grid place-items-center text-[10px] border border-edge" style={{ color: hexCss(speciesById(m.spId).accentColor) }}>
                      {i + 1}
                    </span>
                    <MorenoFace sp={speciesById(m.spId)} size={26} />
                    <HpBar hp={m.hp} max={m.maxHp} w={90} />
                    <span className="tabular-nums text-xs text-dim w-14">
                      {m.hp}/{m.maxHp}
                    </span>
                  </div>
                ))}
              </div>
              {items.length > 0 && (
                <div className="mt-1.5 border-t border-edge pt-1">
                  {items.map((it) => (
                    <div key={it} className="text-toxic text-xs" title={ITEMS[it].desc}>
                      ◆ {ITEMS[it].name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {nearId && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[15]">
              <div className="border-2 border-gold bg-panel/90 px-5 py-2 text-gold text-lg tracking-wider animate-[popIn_0.2s_ease_both]">
                [E] {nearId === "monument" ? "ESAMINA IL GRANDE MORENINO" : nearId === "clomp" ? (flags.clompAwake ? "SALUTA CLOMP" : "OSSERVA CLOMP CHE DORME") : `PARLA CON ${nearId === "don" ? "DON MORENO" : nearId === "cinghia" ? "CINGHIA ALE" : nearId === "mico" ? "MICO NOSCA" : nearId === "coizio" ? "COIZIO" : "GINO SATRI"}`}
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------------- BATTAGLIA ---------------- */}
      {inBattle && bt && enemySp && (
        <>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[15] pointer-events-none w-[min(460px,90vw)]">
            <div className={`border-2 bg-panel/90 px-3 py-2 ${bt.boss ? "border-blood" : "border-edge"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MorenoFace sp={enemySp} size={34} />
                  <div>
                    <div className={`font-display text-xl leading-none ${bt.boss ? "text-blood" : "text-bone"}`}>{enemySp.name}</div>
                    <div className="text-dim text-xs">{enemySp.title}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <HpBar hp={bt.enemyHp} max={bt.enemyMaxHp} w={170} col="#ff2e5f" />
                  <div className="text-right text-xs text-dim tabular-nums mt-0.5">
                    {bt.enemyHp}/{bt.enemyMaxHp}
                  </div>
                </div>
              </div>
              {bt.convinced && (
                <div className="text-toxic text-xs mt-1 tracking-wider">
                  ♥ AMMORBIDITO — GUSTO PREFERITO: {FLAVORS[enemySp.favorite].name} — CATTURA PRONTA
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-[15] flex flex-col md:flex-row items-end justify-between gap-3">
            {/* party */}
            <div className="border-2 border-edge bg-panel/90 px-3 py-2 w-full md:w-auto">
              <div className="text-toxic text-xs tracking-[0.3em] mb-1">I TUOI MORENI</div>
              <div className="flex flex-col gap-1">
                {party.map((m, i) => {
                  const s = speciesById(m.spId);
                  const active = i === activeIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => switchMon(i)}
                      disabled={bt.busy || !switchMode || active || m.hp <= 0}
                      className={`flex items-center gap-2 px-1 py-0.5 text-left transition-colors ${
                        active ? "bg-[#2a1b45]" : switchMode && m.hp > 0 && !bt.busy ? "hover:bg-[#2a1b45] cursor-pointer" : "opacity-90"
                      } ${m.hp <= 0 ? "opacity-40" : ""}`}
                    >
                      <span className={`w-3 h-3 border ${active ? "bg-toxic border-toxic" : "border-edge"}`} />
                      <MorenoFace sp={s} size={26} />
                      <span className="text-sm w-24 truncate" style={{ color: hexCss(s.accentColor) }}>
                        {s.name}
                      </span>
                      <HpBar hp={m.hp} max={m.maxHp} w={80} />
                      <span className="tabular-nums text-xs text-dim w-14">
                        {m.hp}/{m.maxHp}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* comandi */}
            <div className="border-2 border-edge bg-panel/90 px-3 py-2 w-full md:w-[430px]">
              <div className="min-h-[52px] mb-1.5">
                {bt.log.map((l) => (
                  <div
                    key={l.id}
                    className={`text-sm leading-tight truncate ${l.kind === "good" ? "text-toxic" : l.kind === "bad" ? "text-blood" : "text-dim"}`}
                  >
                    &gt; {l.text}
                  </div>
                ))}
              </div>

              {offerMode ? (
                <div className="grid grid-cols-4 gap-2">
                  {FLAVOR_LIST.map((f) => (
                    <button
                      key={f}
                      disabled={bt.busy}
                      onClick={() => offerMorenino(f)}
                      className="btn-hard flex flex-col items-center gap-1 px-1 py-2 border-2 font-display text-sm"
                      style={{ background: FLAVORS[f].cssDark, borderColor: FLAVORS[f].css, color: "#fff6ea" }}
                    >
                      <CookieIcon css={FLAVORS[f].css} size={24} />
                      {FLAVORS[f].name}
                    </button>
                  ))}
                  <button
                    onClick={() => setOfferMode(false)}
                    className="btn-hard col-span-4 py-1 border-2 border-edge bg-panel2 text-dim font-display text-base"
                  >
                    ← INDIETRO
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <button
                    onClick={playerAttack}
                    disabled={bt.busy}
                    className="btn-hard py-2.5 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-lg tracking-wide"
                  >
                    ⚔ ATTACCA
                  </button>
                  <button
                    onClick={() => {
                      setOfferMode(true);
                      setSwitchMode(false);
                      sfx.click();
                    }}
                    disabled={bt.busy}
                    className="btn-hard py-2.5 bg-[#5c2f17] border-2 border-gold text-[#fff6ea] font-display text-lg tracking-wide"
                  >
                    🍪 OFFRI
                  </button>
                  <button
                    onClick={tryCapture}
                    disabled={bt.busy || !bt.convinced || bt.male}
                    title={bt.male ? "È il nonno di Don Moreno: non si cattura, si salva." : bt.convinced ? "Offerta finale!" : "Prima ammorbidiscilo col morenino giusto"}
                    className="btn-hard py-2.5 bg-[#1c4a35] border-2 border-toxic text-[#eafff4] font-display text-lg tracking-wide"
                  >
                    ✋ CATTURA
                  </button>
                  <button
                    onClick={() => {
                      setSwitchMode((s) => !s);
                      setOfferMode(false);
                      sfx.click();
                    }}
                    disabled={bt.busy}
                    className="btn-hard py-2.5 bg-panel2 border-2 border-[#7a5fd0] text-[#e8e0ff] font-display text-lg tracking-wide"
                  >
                    ⇄ MORENO
                  </button>
                  <button
                    onClick={tryFlee}
                    disabled={bt.busy}
                    className="btn-hard py-2.5 bg-panel2 border-2 border-edge text-dim font-display text-lg tracking-wide"
                  >
                    💨 FUGGI
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---------------- PAUSA ---------------- */}
      {paused && (inWorld || inBattle) && (
        <div className="absolute inset-0 z-[45] grid place-items-center bg-[rgba(5,2,10,0.82)]">
          <div className="border-2 border-toxic bg-panel px-10 py-8 text-center shadow-[0_0_40px_rgba(77,255,166,0.25)]">
            <div className="font-display text-5xl text-toxic mb-1">PAUSA</div>
            <div className="text-dim mb-5">I MORENI ASPETTANO. MALVOLENTI.</div>
            <button onClick={togglePause} className="btn-hard block w-full px-8 py-3 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-2xl tracking-widest mb-3">
              RIPRENDI [P]
            </button>
            <button onClick={backToTitle} className="btn-hard block w-full px-8 py-2 bg-panel2 border-2 border-edge text-dim font-display text-xl tracking-widest">
              TITOLI DI TESTA
            </button>
          </div>
        </div>
      )}

      {/* ---------------- GAME OVER ---------------- */}
      {phase === "gameover" && (
        <div className="absolute inset-0 z-[30] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(40,4,16,0.8),rgba(8,2,6,0.95))] px-4">
          <div className="font-display text-[11vw] md:text-[6rem] leading-none text-blood text-outline pulse-glow text-center">
            SEI STATO
            <br />
            SBRICIOLATO
          </div>
          <div className="mt-4 stamp-in border-4 border-blood px-6 py-2 font-display text-2xl md:text-3xl text-blood tracking-widest bg-[rgba(20,2,8,0.8)]">
            TUTTI I MORENI AL TAPPETO
          </div>
          <div className="mt-5 max-w-xl text-center text-lg md:text-xl text-dim">
            «Un giorno i tuoi Moreni racconteranno di questa sconfitta. Ridendo.» — Don Moreno, probabilmente
          </div>
          <div className="mt-2 text-gold text-xl">
            CARISMA: <span className="tabular-nums">{score}</span> · AMICI: {recruitsCount()}
          </div>
          <div className="mt-7 flex flex-col md:flex-row gap-3">
            <button onClick={revive} className="btn-hard px-8 py-3 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl tracking-widest">
              RIALZATI (DON TI AIUTA)
            </button>
            <button onClick={backToTitle} className="btn-hard px-8 py-3 bg-panel2 border-2 border-edge text-dim font-display text-2xl tracking-widest">
              TITOLI DI TESTA
            </button>
          </div>
        </div>
      )}

      {/* ---------------- VITTORIA ---------------- */}
      {phase === "victory" && (
        <div className="absolute inset-0 z-[30] overflow-y-auto bg-[radial-gradient(ellipse_at_center,rgba(20,12,4,0.78),rgba(8,5,2,0.95))]">
          <div className="min-h-full flex flex-col items-center justify-center py-8 px-4">
            <div className="text-gold tracking-[0.5em] text-sm mb-2">LA PROFEZIA È COMPIUTA</div>
            <div className="font-display text-[9vw] md:text-[5rem] leading-[0.9] text-center text-gold text-outline title-float">
              IL GRUF È
              <br />
              PURIFICATO
            </div>
            <p className="mt-3 text-dim max-w-xl text-center text-base md:text-lg">
              Nonno Moreno è tornato lindo e profumato. La Croccantezza Eterna scorre di nuovo. Morenopoli ti nomina
              Pasticcere Sacro Onorario.
            </p>
            <div className="mt-2 text-toxic text-2xl">
              CARISMA FINALE: <span className="tabular-nums">{score}</span>
            </div>
            <div className="mt-5 w-full max-w-3xl border-2 border-edge bg-panel/85 p-4">
              <div className="text-toxic font-display text-xl mb-2 text-center">IL CAST</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {CAST.map((c) => (
                  <div key={c.name} className="flex justify-between gap-3 border-b border-edge/50 py-0.5">
                    <span className="text-gold whitespace-nowrap">{c.name}</span>
                    <span className="text-dim text-right">{c.role}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2 w-full max-w-4xl">
              {party.map((m, i) => {
                const s = speciesById(m.spId);
                return (
                  <div key={i} className="roster-card" style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties}>
                    <MorenoFace sp={s} size={44} />
                    <div className="font-display text-[10px] mt-1 leading-tight" style={{ color: hexCss(s.accentColor) }}>
                      {s.name}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={backToTitle} className="btn-hard mt-7 px-10 py-3 bg-gold border-2 border-[#fff0d1] text-[#241503] font-display text-2xl tracking-widest">
              TITOLI DI CODA → GIOCA ANCORA
            </button>
          </div>
        </div>
      )}

      {/* ---------------- audio toggle ---------------- */}
      <button
        onClick={() => {
          sfx.unlock();
          setMuted((m) => {
            sfx.setMuted(!m);
            return !m;
          });
        }}
        className="absolute top-3 left-3 z-[46] border-2 border-edge bg-panel/85 px-3 py-1 text-dim hover:text-toxic hover:border-toxic transition-colors text-sm tracking-widest"
        title="Audio [M]"
      >
        {muted ? "♪ AUDIO: OFF" : "♪ AUDIO: ON"}
      </button>
    </div>
  );
}

/* ---------------- rete di sicurezza: mai schermo nero ---------------- */
interface BoundaryState {
  err: Error | null;
}
class MoreniBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { err: null };
  static getDerivedStateFromError(err: Error): BoundaryState {
    return { err };
  }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("MORENI-CRASH:", err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div className="h-dvh w-full grid place-items-center bg-void p-6">
          <div className="border-2 border-blood bg-panel px-8 py-6 max-w-xl text-center">
            <div className="font-display text-4xl text-blood mb-2">CRASH DEMONIACO</div>
            <div className="text-dim mb-4">Un Moreno è inciampato nel codice. Ricarica la pagina e riprova.</div>
            <div className="text-left border border-edge bg-[#120a20] p-3 text-toxic text-sm break-words">{String(this.state.err)}</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <MoreniBoundary>
      <MoreniGame />
    </MoreniBoundary>
  );
}
