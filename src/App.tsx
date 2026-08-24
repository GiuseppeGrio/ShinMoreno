import React, { useEffect, useRef, useState } from "react";
import { MoreniEngine } from "./game/engine";
import { sfx } from "./game/audio";
import {
  CAST,
  CONSUMABLES,
  CONSUMABLE_LIST,
  FLAVOR_LIST,
  FLAVORS,
  ITEMS,
  SCRIPTS,
  START_CONSUMABLES,
  SWORD_REQ,
  TRIAL_QUIZ,
  ZONES,
  enemyStats,
  generateMorenoName,
  pick,
  rollWild,
  speciesById,
  type DialogueLine,
  type FlavorId,
  type SpeciesDef,
  type ZoneDef,
} from "./game/data";

type Phase = "title" | "dialogue" | "starter" | "world" | "battle" | "quiz" | "hug" | "victory" | "gameover";
type PcSel = { kind: "party" | "pc"; idx: number } | null;

const hexCss = (n: number) => "#" + n.toString(16).padStart(6, "0");

/* ================================================= RITRATTI SVG PROCEDURALI */
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

function MorenoFace({ sp, size = 72 }: { sp: SpeciesDef; size?: number }) {
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
      <circle cx="50" cy="55" r="35" fill={body} />
      <ellipse cx="50" cy="68" rx="22" ry="15" fill={belly} />
      {p.crown && (
        <polygon
          points="28,24 35,8 43,20 50,3 57,20 65,8 72,24 70,30 30,30"
          fill="#ffd700"
          stroke="#8a6a00"
          strokeWidth="2"
        />
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
      {isBoss ? (
        <path d="M34 72 L41 79 L48 72 L55 79 L62 72" stroke="#2a1208" strokeWidth="4" fill="none" />
      ) : (
        <ellipse cx="50" cy="70" rx="7.5" ry="5" fill="#47101f" />
      )}
      {p.chain && (
        <ellipse cx="50" cy="84" rx="27" ry="8" fill="none" stroke={acc} strokeWidth="4" strokeDasharray="6 4" />
      )}
      {p.mustache && (
        <>
          <rect x="33" y="57" width="13" height="3" fill="#2d2438" transform="rotate(-12 40 58)" />
          <rect x="54" y="57" width="13" height="3" fill="#2d2438" transform="rotate(12 60 58)" />
        </>
      )}
      {p.beret && <ellipse cx="50" cy="22" rx="24" ry="9" fill="#c0392b" />}
      {p.hood && <path d="M22 48 Q50 4 78 48 L74 56 Q50 22 26 56 Z" fill="#12081f" />}
      {p.heart && (
        <path
          d="M50 30 C47 26 42 26 40 29 C38 32 41 35 50 41 C59 35 62 32 60 29 C58 26 53 26 50 30 Z"
          fill="#ff4f9a"
        />
      )}
      {p.snout && <ellipse cx="50" cy="60" rx="10" ry="7" fill={belly} stroke="#8a6a45" strokeWidth="1.5" />}
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

/* ================================================= TIPI DI GIOCO */
interface PartyMon {
  spId: string;
  hp: number;
  maxHp: number;
  atk: number;
  name?: string;
}

interface BattleState {
  enemyId: string;
  enemyName: string | null;
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

function makeMon(spId: string, name?: string): PartyMon {
  const s = speciesById(spId);
  return { spId, hp: s.baseHp, maxHp: s.baseHp, atk: s.baseAtk, name };
}

function displayName(bt: { enemyId: string; enemyName: string | null }): string {
  return bt.enemyName ?? speciesById(bt.enemyId).name;
}

function monName(mon: PartyMon): string {
  return mon.name ?? speciesById(mon.spId).name;
}

/* ================================================= SALVATAGGIO LOCALSTORAGE
   Slot 0 = AUTOSAVE (mai sovrascrivibile a mano). Slot 1..N = manuali. */
const SAVE_KEY = "shin-moreni-tensei-save-v1";
const SLOT_COUNT = 3;
const slotKey = (n: number) => `${SAVE_KEY}-slot-${n}`;

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

interface SaveData {
  flags: Flags;
  party: PartyMon[];
  items: string[];
  consumables?: Record<string, number>;
  capturedSpecies?: string[];
  pc?: PartyMon[];
  score: number;
  activeIdx: number;
  pos: { x: number; z: number };
  savedAt: number;
}

function readSaveKey(key: string): SaveData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}
function writeSaveKey(key: string, data: SaveData) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota piena: ignora */
  }
}
function deleteSaveKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignora */
  }
}

const writeSave = (d: SaveData) => writeSaveKey(SAVE_KEY, d);
const loadSave = () => readSaveKey(SAVE_KEY);
const clearSave = () => deleteSaveKey(SAVE_KEY);
const readSlot = (n: number) => readSaveKey(slotKey(n));
const writeSlot = (n: number, d: SaveData) => writeSaveKey(slotKey(n), d);
const deleteSlot = (n: number) => deleteSaveKey(slotKey(n));

function formatWhen(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.toLocaleDateString("it-IT")} ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
}

function questTextFor(flags: Flags, recruits: number): string {
  if (flags.finaleDone) return "PROFEZIA COMPIUTA — GIRA LIBERO PER MORENOPOLI";
  if (flags.clompAwake) return "ATTRAVERSA IL PORTALE: SCONFIGGI IL MAIALE DEL MONDO";
  if (flags.swordPulled) return "TROVA CLOMP E PARLAGLI (PIAZZA DI MORENOPOLI)";
  if (flags.don2) return `RECLUTA MORENI PER ESTRARRE LA SPADA (${recruits}/${SWORD_REQ})`;
  if (flags.ginoDone) return "TORNA DA DON MORENO (MORENOPOLI)";
  if (flags.coizioDone) return "PARLA CON GINO SATRI (ABISSO DI GINO)";
  if (flags.micoDone) return "PARLA CON COIZIO (TERME DEL CONTATTO)";
  if (flags.cinghiaBeaten) return "PARLA CON MICO NOSCA (ACCAMPAMENTO DELLA RIVOLTA)";
  return "VAI DA CINGHIA ALE (VALLE DEI FACOCERI)";
}

/* ================================================= COMPONENTI UI */
function HpBar({ hp, max, w = 120, col = "#4dffa6" }: { hp: number; max: number; w?: number; col?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
  return (
    <div style={{ width: w, height: 10 }} className="border border-edge bg-[#120a20] overflow-hidden inline-block align-middle">
      <div
        style={{ width: `${pct * 100}%`, height: "100%", background: col, transition: "width 0.25s ease" }}
      />
    </div>
  );
}

function DialogueBox({
  lines,
  onDone,
  onChoice,
}: {
  lines: DialogueLine[];
  onDone: () => void;
  onChoice?: (choiceIdx: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const line = lines[Math.min(idx, lines.length - 1)];
  const full = line.text;

  useEffect(() => setChars(0), [idx]);
  useEffect(() => {
    if (chars < full.length) {
      const t = window.setTimeout(() => setChars((c) => Math.min(full.length, c + 1)), 16);
      return () => window.clearTimeout(t);
    }
  }, [chars, full]);

  const advance = () => {
    if (line.choices) return; // le domande si rispondono coi pulsanti
    sfx.click();
    if (chars < full.length) {
      setChars(full.length);
      return;
    }
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
  const sp = speciesById(spk);
  const isNarrator = spk === "NARRATORE";
  const acc = sp ? hexCss(sp.accentColor) : spk === "TU" ? "#4dffa6" : "#bfa8ff";
  const name = sp ? sp.name : spk === "TU" ? "TU — EVOCATORE MEDIOCRE" : "PROFEZIA DI MORENOPOLI";

  return (
    <div className="dlg-root" onClick={advance}>
      <div className="dlg-box relative" style={{ "--acc": acc } as React.CSSProperties}>
        <div className="dlg-name" style={{ background: acc }}>
          {name}
        </div>
        <div className="flex gap-4 items-center">
          {!isNarrator && (
            <div className="dlg-portrait">
              {sp ? <MorenoFace sp={sp} size={76} /> : <TuFace size={76} />}
            </div>
          )}
          <div className={`dlg-text flex-1 ${isNarrator ? "narrator" : ""}`}>
            {full.slice(0, chars)}
            <span className="blink">▌</span>
          </div>
        </div>
        {line.choices ? (
          <div className="dlg-choices" onClick={(e) => e.stopPropagation()}>
            {line.choices.map((c, i) => (
              <button key={i} className="dlg-choice" onClick={() => onChoice?.(i)}>
                ▸ {c}
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { err: e.message };
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ background: "#0b0614", color: "#efe6d8", minHeight: "100vh", padding: 40, fontFamily: "monospace" }}>
          <h1 style={{ color: "#ff2e5f" }}>CRASH DEMONIACO</h1>
          <p>Un Moreno ha mangiato un pezzo di codice.</p>
          <pre style={{ color: "#ffc94d", whiteSpace: "pre-wrap" }}>{this.state.err}</pre>
          <button onClick={() => location.reload()} style={{ padding: "10px 20px", background: "#4dffa6", border: "none", cursor: "pointer", fontFamily: "monospace" }}>
            RICOMINCIA LA PROFEZIA
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ================================================= GAME */
const PC_CAP = 100;

function MoreniGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MoreniEngine | null>(null);

  const [phase, setPhase] = useState<Phase>("title");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [party, setParty] = useState<PartyMon[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const [consumables, setConsumables] = useState<Record<string, number>>({ ...START_CONSUMABLES });
  const [capturedSpecies, setCapturedSpecies] = useState<string[]>([]);
  const [pc, setPc] = useState<PartyMon[]>([]);
  const [flags, setFlags] = useState<Flags>(initialFlags);
  const [zone, setZone] = useState<ZoneDef | null>(null);
  const [nearId, setNearId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kicker: string; title: string; boss: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ kind: "red" | "gold"; key: number } | null>(null);
  const [bt, setBt] = useState<BattleState | null>(null);
  const [offerMode, setOfferMode] = useState(false);
  const [switchMode, setSwitchMode] = useState(false);
  const [dlgLines, setDlgLines] = useState<DialogueLine[]>([]);
  const [quiz, setQuiz] = useState<{ q: number; hearts: number; done: boolean } | null>(null);
  const [hug, setHug] = useState<{ progress: number; running: boolean; done: boolean }>({ progress: 0, running: false, done: false });
  const [slotPanel, setSlotPanel] = useState<null | "save" | "load">(null);
  const [confirmSlot, setConfirmSlot] = useState<number | null>(null);
  const [slotTick, setSlotTick] = useState(0);
  const [hasSave, setHasSave] = useState(false);

  /* menu di gioco RPG */
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<"formazione" | "stato" | "zaino">("formazione");
  const [menuSel, setMenuSel] = useState(0);
  const [useItemId, setUseItemId] = useState<string | null>(null);
  const [partyReleaseArm, setPartyReleaseArm] = useState<number | null>(null);

  /* PC di Mica Rizzi + inerzia */
  const [pcOpen, setPcOpen] = useState(false);
  const [pcSel, setPcSel] = useState<PcSel>(null);
  const [pcReleaseArm, setPcReleaseArm] = useState(false);
  const [inertiaNotice, setInertiaNotice] = useState(false);

  /* refs sincronizzati */
  const phaseRef = useRef<Phase>("title");
  const pausedRef = useRef(false);
  const partyRef = useRef<PartyMon[]>([]);
  const activeIdxRef = useRef(0);
  const itemsRef = useRef<string[]>([]);
  const consumablesRef = useRef<Record<string, number>>({ ...START_CONSUMABLES });
  const capturedRef = useRef<string[]>([]);
  const pcRef = useRef<PartyMon[]>([]);
  const flagsRef = useRef<Flags>(initialFlags);
  const menuOpenRef = useRef(false);
  const btRef = useRef<BattleState | null>(null);
  const hugHeldRef = useRef(false);
  const hugDoneRef = useRef(false);
  const koRef = useRef(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const afterDlgRef = useRef<(() => void) | null>(null);
  const onChoiceRef = useRef<((i: number) => void) | null>(null);
  const logIdRef = useRef(0);
  const bannerTRef = useRef<number | null>(null);
  const toastTRef = useRef<number | null>(null);
  const gameStartedRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
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
    consumablesRef.current = consumables;
  }, [consumables]);
  useEffect(() => {
    capturedRef.current = capturedSpecies;
  }, [capturedSpecies]);
  useEffect(() => {
    pcRef.current = pc;
  }, [pc]);
  useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);
  useEffect(() => {
    btRef.current = bt;
  }, [bt]);

  /* controllo save all'avvio */
  useEffect(() => {
    setHasSave(loadSave() !== null);
  }, []);

  /* autosave */
  useEffect(() => {
    if (!gameStartedRef.current) return;
    const pos = engineRef.current?.getPlayerPos() ?? { x: 0, z: 9 };
    writeSave({ flags, party, items, consumables, capturedSpecies, pc, score, activeIdx, pos, savedAt: Date.now() });
  }, [flags, party, items, consumables, capturedSpecies, pc, score, activeIdx]);

  /* ---------------- helpers ---------------- */
  const hasItem = (id: string) => itemsRef.current.includes(id);

  const addScore = (n: number) => setScore((s) => s + n);

  const showToast = (t: string) => {
    setToast(t);
    if (toastTRef.current) window.clearTimeout(toastTRef.current);
    toastTRef.current = window.setTimeout(() => setToast(null), 2850);
  };

  const showBanner = (kicker: string, title: string, boss: boolean) => {
    setBanner({ kicker, title, boss });
    if (bannerTRef.current) window.clearTimeout(bannerTRef.current);
    bannerTRef.current = window.setTimeout(() => setBanner(null), 2250);
  };

  const doFlash = (kind: "red" | "gold") => setFlash({ kind, key: Date.now() });

  const recruitsCount = () => new Set(partyRef.current.map((m) => m.spId)).size;

  const questText = () => questTextFor(flagsRef.current, recruitsCount());

  /* ---------------- dialoghi ---------------- */
  const say = (script: string, after?: () => void) => {
    setDlgLines(SCRIPTS[script] ?? []);
    afterDlgRef.current = () => {
      setPhase("world");
      after?.();
    };
    onChoiceRef.current = null;
    setPhase("dialogue");
  };

  const sayLines = (lines: DialogueLine[], after?: () => void) => {
    setDlgLines(lines);
    afterDlgRef.current = () => {
      setPhase("world");
      after?.();
    };
    onChoiceRef.current = null;
    setPhase("dialogue");
  };

  const addItem = (id: string) => {
    setItems((it) => (it.includes(id) ? it : [...it, id]));
  };

  const grantConsumable = (id: string, n = 1) => {
    setConsumables((c) => ({ ...c, [id]: (c[id] ?? 0) + n }));
  };

  const markCaptured = (id: string) => {
    setCapturedSpecies((c) => (c.includes(id) ? c : [...c, id]));
  };

  const rollDrop = (chance: number) => {
    if (Math.random() >= chance) return;
    const pool = ["croccantino", "croccantino", "croccantino", "crostata", "caffe"];
    const id = pick(pool);
    grantConsumable(id);
    window.setTimeout(() => {
      showToast(`BOTTINO: ${CONSUMABLES[id].name}`);
      sfx.correct();
    }, 600);
  };

  const bLog = (text: string, kind: "info" | "good" | "bad" = "info") => {
    setBt((b) => (b ? { ...b, log: [...b.log.slice(-3), { id: ++logIdRef.current, text, kind }] } : b));
  };

  const patchBt = (p: Partial<BattleState>) => {
    setBt((b) => {
      if (!b) return b;
      const nb = { ...b, ...p };
      btRef.current = nb;
      return nb;
    });
  };

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
    setConsumables({ ...START_CONSUMABLES });
    setCapturedSpecies([]);
    setPc([]);
    setActiveIdx(0);
    setBt(null);
    setMenuOpen(false);
    setInertiaNotice(false);
    engineRef.current?.companionFollow(false);
    engineRef.current?.setPortalOpen(false);
    engineRef.current?.setSwordVisible(true);
    engineRef.current?.setClompAwakeState(false);
    say("prologue", () => setPhase("starter"));
  };

  /* Ripristina lo stato da un SaveData (autosave o slot manuale).
     Include la CURA AD INERZIA: 1 HP/minuto lontano dallo schermo;
     dopo 60 minuti i Moreno al tappeto rinascono con 1 HP e riprendono a curarsi. */
  const applySave = (save: SaveData, kicker: string, title: string) => {
    sfx.unlock();
    sfx.start();
    gameStartedRef.current = true;

    const now = Date.now();
    const mins = Math.max(0, Math.floor((now - (save.savedAt || now)) / 60000));
    let healedHp = 0;
    let revived = 0;
    const healed = save.party.map((m) => {
      if (m.hp <= 0) {
        if (mins >= 60) {
          const nh = Math.max(1, Math.min(m.maxHp, 1 + (mins - 60)));
          revived += 1;
          healedHp += nh;
          return { ...m, hp: nh };
        }
        return m;
      }
      const nh = Math.min(m.maxHp, m.hp + mins);
      healedHp += nh - m.hp;
      return { ...m, hp: nh };
    });

    setFlags(save.flags);
    setParty(healed);
    setActiveIdx(Math.min(save.activeIdx, Math.max(0, healed.length - 1)));
    setItems(save.items);
    setConsumables(save.consumables ?? { ...START_CONSUMABLES });
    setCapturedSpecies(save.capturedSpecies ?? []);
    setPc(save.pc ?? []);
    setScore(save.score);
    setBt(null);
    setMenuOpen(false);
    setInertiaNotice(false);
    setPaused(false);
    pausedRef.current = false;
    engineRef.current?.setPaused(false);
    engineRef.current?.companionFollow(save.flags.clompAwake);
    engineRef.current?.setPortalOpen(save.flags.clompAwake);
    engineRef.current?.setSwordVisible(!save.flags.swordPulled);
    engineRef.current?.setClompAwakeState(save.flags.clompAwake);
    engineRef.current?.enterWorld(save.pos.x, save.pos.z);
    setPhase("world");
    showBanner(kicker, title, false);

    if (mins >= 1 && healedHp > 0) {
      const lines: DialogueLine[] = [
        {
          spk: "NARRATORE",
          text: `CONTATORE D'INERZIA: ${mins} minuti lontano dallo schermo. L'inerzia rende 1 HP al minuto: i tuoi Moreni hanno recuperato ${healedHp} HP.`,
        },
      ];
      if (revived > 0) {
        lines.push({
          spk: "NARRATORE",
          text: `${revived} Moreno al tappeto ${revived > 1 ? "sono rinati" : "è rinato"} con 1 HP dopo 60 minuti di inattività. Stordit${revived > 1 ? "i" : "o"}, ma determinat${revived > 1 ? "i" : "o"}.`,
        });
      }
      sayLines(lines);
    }
  };

  const continueGame = () => {
    const save = loadSave();
    if (!save) {
      startGame();
      return;
    }
    applySave(save, "AUTOSAVE", "LA PROFEZIA RIPRENDE");
  };

  const loadFromAutosave = () => {
    const save = loadSave();
    if (save) applySave(save, "AUTOSAVE", "LA PROFEZIA RIPRENDE");
  };

  /* ---------------- slot manuali ---------------- */
  const currentSnapshot = (): SaveData => ({
    flags,
    party,
    items,
    consumables,
    capturedSpecies,
    pc,
    score,
    activeIdx,
    pos: engineRef.current?.getPlayerPos() ?? { x: 0, z: 9 },
    savedAt: Date.now(),
  });

  const saveToSlot = (n: number) => {
    const existing = readSlot(n);
    if (existing && confirmSlot !== n) {
      setConfirmSlot(n); // serve una seconda pressione per sovrascrivere
      return;
    }
    writeSlot(n, currentSnapshot());
    setConfirmSlot(null);
    setSlotTick((t) => t + 1);
    showToast(`SALVATO NELLO SLOT ${n} — AL SICURO DA SOVRASCRITTURE`);
    sfx.recruit();
  };

  const loadFromSlot = (n: number) => {
    const save = readSlot(n);
    if (!save) return;
    setSlotPanel(null);
    setConfirmSlot(null);
    applySave(save, `SLOT ${n} CARICATO`, "LA PROFEZIA RIPRENDE");
  };

  const wipeSlot = (n: number) => {
    if (confirmSlot !== -n) {
      setConfirmSlot(-n);
      return;
    }
    deleteSlot(n);
    setConfirmSlot(null);
    setSlotTick((t) => t + 1);
    showToast(`SLOT ${n} SVUOTATO`);
    sfx.wrong();
  };

  /* ---------------- interazioni mondo ---------------- */
  const interact = (id: string) => {
    const f = flagsRef.current;
    sfx.click();
    if (id === "pc") {
      say("pc_intro", () => {
        setPcOpen(true);
        setPcSel(null);
        setPcReleaseArm(false);
        engineRef.current?.setPaused(true);
      });
      return;
    }
    if (id === "don") {
      if (f.ginoDone && !f.don2) {
        say("don2", () => setFlags((fl) => ({ ...fl, don2: true })));
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
        showToast("CLOMP DORME PROFONDAMENTE. GLI «Z» FLUTTUANO COME MORENINI.");
      } else {
        showToast("CLOMP: «TI SEGUO OVUNQUE, EVOCATORE.»");
      }
      return;
    }
    if (id === "cinghia") {
      if (!f.cinghiaBeaten) {
        say("cinghia_pre", () => {
          startScriptedBattle("cinghiaale", { cinghia: true });
        });
      } else {
        say("cinghia_post");
      }
      return;
    }
    if (id === "mico") {
      if (f.micoDone) {
        say("mico_win");
        return;
      }
      say("mico1", () => {
        setQuiz({ q: 0, hearts: 3, done: false });
        setPhase("quiz");
        askQuiz(0);
      });
      return;
    }
    if (id === "coizio") {
      if (f.coizioDone) {
        say("coizio_win");
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
        say("gino_post");
        return;
      }
      say("gino1", () => {
        startScriptedBattle("maledelmondo", { boss: true });
      });
      return;
    }
  };

  /* ---------------- quiz di Mico ---------------- */
  const askQuiz = (q: number) => {
    const script = TRIAL_QUIZ.scripts[q];
    setDlgLines(SCRIPTS[script] ?? []);
    onChoiceRef.current = (i: number) => handleQuizAnswer(q, i);
    setPhase("dialogue");
  };

  const handleQuizAnswer = (q: number, choice: number) => {
    const correct = TRIAL_QUIZ.answers[q] === choice;
    setQuiz((z) => {
      if (!z) return z;
      const hearts = correct ? z.hearts : z.hearts - 1;
      if (!correct && hearts <= 0) {
        say("mico_fail", () => {
          setQuiz({ q: 0, hearts: 3, done: false });
          askQuiz(0);
        });
        return z;
      }
      const nq = q + 1;
      if (nq >= TRIAL_QUIZ.scripts.length) {
        say("mico_win", () => {
          addItem("spilla");
          setFlags((fl) => ({ ...fl, micoDone: true }));
          addScore(100);
          setQuiz(null);
        });
        return { ...z, done: true };
      }
      window.setTimeout(() => askQuiz(nq), 450);
      return { ...z, q: nq, hearts };
    });
    if (correct) sfx.correct();
    else sfx.wrong();
  };

  /* ---------------- abbraccio di Coizio ---------------- */
  const finishHug = () => {
    setFlags((fl) => ({ ...fl, coizioDone: true }));
    addItem("abbraccio");
    addScore(100);
    sfx.victory();
    doFlash("gold");
    setPhase("world");
    say("coizio_win");
  };

  useEffect(() => {
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
      if (phaseRef.current !== "hug") return;
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

  /* ---------------- battaglie ---------------- */
  const startWildBattle = (spId: string, diff: number) => {
    const st = enemyStats(spId, diff);
    const name = generateMorenoName();
    const b: BattleState = {
      enemyId: spId,
      enemyName: name,
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
      log: [{ id: ++logIdRef.current, text: `${name}, ${speciesById(spId).name} SELVATICO, TI SFIDA!`, kind: "bad" }],
    };
    btRef.current = b;
    setBt(b);
    setOfferMode(false);
    setSwitchMode(false);
    koRef.current = false;
    const active = partyRef.current[activeIdxRef.current] ?? partyRef.current[0];
    setPhase("battle");
    engineRef.current?.startBattle(speciesById(active.spId), speciesById(spId), false);
  };

  const startScriptedBattle = (spId: string, opts: { boss?: boolean; cinghia?: boolean; male?: boolean }) => {
    const st = enemyStats(spId, 0);
    const b: BattleState = {
      enemyId: spId,
      enemyName: null,
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
    koRef.current = false;
    const active = partyRef.current[activeIdxRef.current] ?? partyRef.current[0];
    setPhase("battle");
    engineRef.current?.startBattle(speciesById(active.spId), speciesById(spId), !!opts.boss);
    if (opts.boss) sfx.appear();
    if (opts.male) showBanner("BOSS FINALE", "MAIALE DEL MONDO", true);
    else if (opts.cinghia) showBanner("CAPO TRIBÙ", "CINGHIA ALE", true);
  };

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
      bLog(double ? `FIALA OMEOPATICA! ${monName(mon)} colpisce DOPPIO: ${dmg} danni!` : `${monName(mon)} colpisce: ${dmg} danni!`, "good");
      afterPlayerAction(newHp);
    });
  };

  const afterPlayerAction = (newEnemyHp: number) => {
    const b = btRef.current;
    if (!b) return;
    if (b.male && !b.midPlayed && newEnemyHp <= b.enemyMaxHp / 2) {
      patchBt({ midPlayed: true });
      sfx.victory();
      window.setTimeout(() => {
        sayLines(SCRIPTS.maiale_mid, () => {
          engineRef.current?.battlePurify(speciesById("nonnopurificato"), () => {
            window.setTimeout(() => {
              sayLines(SCRIPTS.finale, () => {
                setFlags((fl) => ({ ...fl, finaleDone: true }));
                addScore(500);
                clearSave();
                setHasSave(false);
                setBt(null);
                engineRef.current?.endBattle();
                setPhase("victory");
              });
            }, 500);
          });
        });
      }, 500);
      return;
    }
    if (newEnemyHp <= 0) {
      onEnemyDefeated();
      return;
    }
    window.setTimeout(() => enemyTurn(), 500);
  };

  const enemyTurn = () => {
    const b = btRef.current;
    if (!b || phaseRef.current !== "battle") return;
    const mon = partyRef.current[activeIdxRef.current];
    if (!mon) return;
    engineRef.current?.battleAttack("enemy", () => {
      sfx.wrong();
      doFlash("red");
      const dmg = Math.round(b.enemyAtk * (0.8 + Math.random() * 0.4));
      const newHp = Math.max(0, mon.hp - dmg);
      const newParty = partyRef.current.map((m, i) => (i === activeIdxRef.current ? { ...m, hp: newHp } : m));
      partyRef.current = newParty;
      setParty(newParty);
      bLog(`${displayName(b)} ti colpisce: ${dmg} danni a ${monName(mon)}!`, "bad");
      if (newHp <= 0) {
        koRef.current = true;
        engineRef.current?.battleFaint("player", () => {
          const next = newParty.findIndex((m) => m.hp > 0);
          if (next < 0) {
            wipe();
            return;
          }
          setActiveIdx(next);
          activeIdxRef.current = next;
          engineRef.current?.setActiveSpecies(speciesById(newParty[next].spId));
          bLog(`VAI, ${monName(newParty[next])}!`, "info");
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
      bLog(`MORENINO AL ${FLAVORS[flavor].name} ACCETTATO! ${displayName(b)} SI È AMMORBIDITO. ORA PUOI CATTURARLO!`, "good");
      window.setTimeout(() => patchBt({ busy: false }), 450);
    } else {
      sfx.wrong();
      doFlash("red");
      bLog(`${displayName(b)} SPUTA IL MORENINO AL ${FLAVORS[flavor].name}! VOLEVA ${FLAVORS[enemy.favorite].name}!`, "bad");
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
    const enemy = speciesById(b.enemyId);
    if (enemy.special && capturedRef.current.includes(enemy.id)) {
      bLog(`${enemy.name} TI RICONOSCE: «CI SONO GIÀ. UNO COME ME BASTA E AVANZA.»`, "info");
      sfx.wrong();
      return;
    }
    setOfferMode(false);
    setSwitchMode(false);
    patchBt({ busy: true });
    const chance = Math.min(95, 35 + b.captureBoost);
    const success = Math.random() * 100 < chance;
    bLog(`OFFERTA FINALE! MORENINO AL ${FLAVORS[enemy.favorite].name}... (${chance}%)`, "info");
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
        const capName = displayName(b);
        markCaptured(capId);
        setParty((p) => {
          if (p.length < 8) {
            showToast(`${capName} SI È UNITO AL PARTY!`);
            return [...p, makeMon(capId, b.enemyName ?? undefined)];
          }
          addScore(75);
          showToast(`PARTY PIENO: ${capName} TI SALUTA DA LONTANO (+75)`);
          return p;
        });
        bLog(`${capName} È CONVINTO: AMICIZIA!`, "good");
        window.setTimeout(() => {
          engineRef.current?.endBattle();
          setBt(null);
          setPhase("world");
          maybeInertiaNotice();
        }, 700);
      } else {
        sfx.wrong();
        bLog(`${displayName(b)} HA ANCORA LE BRICIOLE STORTE. RIPROVA O COMBATTI!`, "bad");
        window.setTimeout(() => enemyTurn(), 500);
      }
    });
  };

  const finishCinghia = () => {
    setFlags((fl) => ({ ...fl, cinghiaBeaten: true }));
    markCaptured("cinghiaale");
    say("cinghia_post", () => {
      setParty((p) => (p.some((m) => m.spId === "cinghiaale") || p.length >= 8 ? p : [...p, makeMon("cinghiaale")]));
      showToast("CINGHIA ALE SI È UNITO AL PARTY! LA TRIBÙ È CON TE.");
      addScore(200);
      engineRef.current?.endBattle();
      setBt(null);
      setPhase("world");
      maybeInertiaNotice();
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
        maybeInertiaNotice();
      }, 450);
    } else {
      bLog("FUGA FALLITA! IL MORENO TI BARRA LA STRADA.", "bad");
      window.setTimeout(() => enemyTurn(), 400);
    }
  };

  const onEnemyDefeated = () => {
    const b = btRef.current;
    if (!b) return;
    if (b.cinghia) {
      finishCinghia();
      return;
    }
    if (b.male) {
      // non dovrebbe accadere: il Maiale si purifica a metà HP
      return;
    }
    if (b.boss && b.enemyId === "maledelmondo") {
      sayLines(SCRIPTS.gino_post, () => {
        addItem("fiala");
        grantConsumable("famiglia");
        grantConsumable("crostata");
        addScore(200);
        setFlags((fl) => ({ ...fl, ginoDone: true }));
        engineRef.current?.endBattle();
        setBt(null);
        setPhase("world");
        maybeInertiaNotice();
      });
      return;
    }
    sfx.victory();
    addScore(b.boss ? 200 : 100);
    bLog(`${displayName(b)} È AL TAPPETO! +${b.boss ? 200 : 100} CARISMA`, "good");
    rollDrop(b.boss ? 1 : 0.6);
    engineRef.current?.battleFaint("enemy", () => {
      window.setTimeout(() => {
        engineRef.current?.endBattle();
        setBt(null);
        setPhase("world");
        maybeInertiaNotice();
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
    say("don_revive", () => maybeInertiaNotice(300));
  };

  /* ---------------- pausa & menu ---------------- */
  const togglePause = () => {
    if (menuOpenRef.current) return;
    sfx.pause();
    setPaused((p) => {
      const np = !p;
      pausedRef.current = np;
      engineRef.current?.setPaused(np);
      return np;
    });
  };

  const openMenu = (tab: "formazione" | "stato" | "zaino" = "formazione") => {
    if (phaseRef.current !== "world" && phaseRef.current !== "battle") return;
    if (btRef.current?.busy) return;
    sfx.click();
    setMenuTab(tab);
    setUseItemId(null);
    setPartyReleaseArm(null);
    setMenuSel(Math.min(activeIdxRef.current, Math.max(0, partyRef.current.length - 1)));
    setMenuOpen(true);
    engineRef.current?.setPaused(true);
  };

  const closeMenu = () => {
    sfx.click();
    setMenuOpen(false);
    setUseItemId(null);
    engineRef.current?.setPaused(pausedRef.current);
  };

  const setActiveMember = (idx: number) => {
    const mon = partyRef.current[idx];
    if (!mon || mon.hp <= 0) return;
    sfx.click();
    setActiveIdx(idx);
    activeIdxRef.current = idx;
    if (phaseRef.current === "battle") {
      engineRef.current?.setActiveSpecies(speciesById(mon.spId));
      bLog(`VAI, ${monName(mon)}!`, "info");
      setMenuOpen(false);
      engineRef.current?.setPaused(false);
      window.setTimeout(() => enemyTurn(), 500);
    } else {
      showToast(`${monName(mon)} È ORA IN PRIMA LINEA`);
    }
  };

  const useConsumableOn = (itemId: string, targetIdx: number) => {
    const def = CONSUMABLES[itemId];
    const owned = consumablesRef.current[itemId] ?? 0;
    if (!def || owned <= 0) return;

    if (def.all) {
      const healed = partyRef.current.map((m) => ({ ...m, hp: Math.min(m.maxHp, m.hp + def.heal) }));
      partyRef.current = healed;
      setParty(healed);
    } else {
      const mon = partyRef.current[targetIdx];
      if (!mon) return;
      if (def.revive) {
        if (mon.hp > 0) {
          showToast("QUEL MORENO È GIÀ IN PIEDI. IL CAFFÈ TI SERVE, SEMMAI.");
          sfx.wrong();
          return;
        }
      } else if (mon.hp <= 0) {
        showToast("È AL TAPPETO: SERVE IL CAFFÈ DEMONIACO, NON UN CROCCANTINO.");
        sfx.wrong();
        return;
      } else if (mon.hp >= mon.maxHp) {
        showToast("È GIÀ SAZIO DI HP. NON SPRECHIAMO MORENINI.");
        sfx.wrong();
        return;
      }
      const newHp = def.revive ? Math.round(mon.maxHp * 0.5) : def.fullHeal ? mon.maxHp : Math.min(mon.maxHp, mon.hp + def.heal);
      const healed = partyRef.current.map((m, i) => (i === targetIdx ? { ...m, hp: newHp } : m));
      partyRef.current = healed;
      setParty(healed);
    }

    setConsumables((c) => ({ ...c, [itemId]: Math.max(0, (c[itemId] ?? 0) - 1) }));
    sfx.correct();
    doFlash("gold");
    showToast(def.all ? `${def.name}: TUTTO IL PARTY RINGRAZIA` : `${def.name} → ${monName(partyRef.current[targetIdx])}`);
    setUseItemId(null);
  };

  /* ---------------- PC di Mica Rizzi ---------------- */
  const closePc = () => {
    sfx.click();
    setPcOpen(false);
    setPcSel(null);
    setPcReleaseArm(false);
    engineRef.current?.setPaused(pausedRef.current);
  };

  const fixActiveIdx = (newParty: PartyMon[]) => {
    let ni = activeIdxRef.current;
    if (ni >= newParty.length) ni = newParty.length - 1;
    if (ni < 0) ni = 0;
    if (newParty[ni] && newParty[ni].hp <= 0) {
      const alive = newParty.findIndex((m) => m.hp > 0);
      if (alive >= 0) ni = alive;
    }
    setActiveIdx(ni);
    activeIdxRef.current = ni;
  };

  const depositToPc = (partyIdx: number) => {
    const party = partyRef.current;
    if (pcRef.current.length >= PC_CAP) {
      showToast("IL PC DI MICA RIZZI È PIENO: 100/100 SLOT.");
      sfx.wrong();
      return;
    }
    if (party.length <= 1) {
      showToast("NON PUOI DEPOSITARE L'UNICO MORENO. LA PROFEZIA NE VUOLE ALMENO UNO.");
      sfx.wrong();
      return;
    }
    const mon = party[partyIdx];
    if (!mon) return;
    const newParty = party.filter((_, i) => i !== partyIdx);
    const newPc = [...pcRef.current, mon];
    partyRef.current = newParty;
    pcRef.current = newPc;
    setParty(newParty);
    setPc(newPc);
    fixActiveIdx(newParty);
    sfx.correct();
    showToast(`${monName(mon)} DEPOSITATO NEL PC DI MICA RIZZI`);
    setPcSel(null);
  };

  const withdrawFromPc = (pcIdx: number) => {
    if (partyRef.current.length >= 8) {
      showToast("PARTY PIENO (8/8). DEPOSITA QUALCUNO, PRIMA.");
      sfx.wrong();
      return;
    }
    const mon = pcRef.current[pcIdx];
    if (!mon) return;
    const newPc = pcRef.current.filter((_, i) => i !== pcIdx);
    const newParty = [...partyRef.current, mon];
    pcRef.current = newPc;
    partyRef.current = newParty;
    setPc(newPc);
    setParty(newParty);
    sfx.correct();
    showToast(`${monName(mon)} SI È RITIRATO NEL PARTY`);
    setPcSel(null);
  };

  const releaseFromParty = (i: number) => {
    const party = partyRef.current;
    if (party.length <= 1) {
      showToast("NON PUOI LIBERARE L'UNICO MORENO. LA PROFEZIA NE VUOLE ALMENO UNO.");
      sfx.wrong();
      return;
    }
    if (partyReleaseArm !== i) {
      setPartyReleaseArm(i);
      return;
    }
    const mon = party[i];
    const newParty = party.filter((_, k) => k !== i);
    partyRef.current = newParty;
    setParty(newParty);
    setPartyReleaseArm(null);
    fixActiveIdx(newParty);
    sfx.wrong();
    showToast(`${monName(mon)} CORRE LIBERO VERSO IL TRAMONTO. ZAMPA ALZATA, GRUGNO NOSTALGICO.`);
  };

  const releaseFromPc = (pcIdx: number) => {
    if (partyRef.current.length === 0) {
      showToast("IL PC PROTEGGE GLI ULTIMI MORENI DELLA PROFEZIA.");
      sfx.wrong();
      return;
    }
    if (!pcReleaseArm) {
      setPcReleaseArm(true);
      return;
    }
    const mon = pcRef.current[pcIdx];
    const newPc = pcRef.current.filter((_, i) => i !== pcIdx);
    pcRef.current = newPc;
    setPc(newPc);
    setPcReleaseArm(false);
    setPcSel(null);
    sfx.wrong();
    showToast(`${mon ? monName(mon) : "IL MORENO"} CORRE LIBERO VERSO IL TRAMONTO.`);
  };

  /* ---------------- notifica d'inerzia dopo un KO ---------------- */
  const maybeInertiaNotice = (delay = 600) => {
    if (!koRef.current) return;
    koRef.current = false;
    window.setTimeout(() => setInertiaNotice(true), delay);
  };

  const backToTitle = () => {
    sfx.click();
    setPaused(false);
    pausedRef.current = false;
    engineRef.current?.setPaused(false);
    engineRef.current?.attractMode(true);
    setBt(null);
    setHasSave(loadSave() !== null);
    setPhase("title");
  };

  /* ---------------- tastiera ---------------- */
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      const k = e.key.toLowerCase();
      if (k === "m") {
        setMuted((m) => {
          sfx.setMuted(!m);
          return !m;
        });
        return;
      }
      if (k === "tab" || k === "i") {
        e.preventDefault();
        if (menuOpenRef.current) closeMenu();
        else if ((phaseRef.current === "world" || phaseRef.current === "battle") && !pausedRef.current) openMenu();
        return;
      }
      if (k === "p" || k === "escape") {
        if (menuOpenRef.current) closeMenu();
        else if (pcOpen) closePc();
        else if (phaseRef.current === "world" || phaseRef.current === "battle") togglePause();
        return;
      }
      if (k === "e" && phaseRef.current === "world" && !pcOpen) {
        const near = engineRef.current?.getNearId();
        if (near) interact(near);
        return;
      }
      if (phaseRef.current === "title" && (k === "enter" || k === " ")) {
        if (loadSave()) continueGame();
        else startGame();
        return;
      }
      // offerta rapida 1-4 in battaglia
      if (phaseRef.current === "battle" && offerMode) {
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx >= 0) offerMorenino(FLAVOR_LIST[idx]);
      }
    };
    const ku = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerMode, pcOpen]);

  /* input movimento continuo */
  useEffect(() => {
    const iv = window.setInterval(() => {
      if (phaseRef.current !== "world" || pausedRef.current || menuOpenRef.current || pcOpen) {
        engineRef.current?.setInput(0, 0);
        return;
      }
      const k = keysRef.current;
      const x = (k["d"] || k["arrowright"] ? 1 : 0) - (k["a"] || k["arrowleft"] ? 1 : 0);
      const z = (k["s"] || k["arrowdown"] ? 1 : 0) - (k["w"] || k["arrowup"] ? 1 : 0);
      engineRef.current?.setInput(x, z);
    }, 33);
    return () => window.clearInterval(iv);
  }, [pcOpen]);

  /* ---------------- montaggio engine ---------------- */
  useEffect(() => {
    const eng = new MoreniEngine(mountRef.current!);
    engineRef.current = eng;
    eng.onZone = (id) => {
      const z = ZONES.find((zz) => zz.id === id) ?? null;
      if (z && phaseRef.current === "world") {
        setZone(z);
        if (z.id !== "morenopoli") showBanner("SEI ENTRATO IN", z.name, false);
      }
    };
    eng.onEncounter = (spId, diff) => {
      if (partyRef.current.length === 0) return;
      if (phaseRef.current !== "world") return;
      const zoneDef = ZONES.find((zz) => zz.wilds?.some((w) => w.id === spId));
      const id = zoneDef ? rollWild(zoneDef) : spId;
      startWildBattle(id, diff);
    };
    eng.onPortal = () => {
      if (phaseRef.current !== "world") return;
      if (flagsRef.current.finaleDone) return;
      say("antro_intro", () => {
        startScriptedBattle("maialedelmondo", { boss: true, male: true });
      });
    };
    eng.onNear = (id) => {
      setNearId(id);
    };
    eng.start();
    return () => {
      eng.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- render ---------------- */
  const inBattle = phase === "battle";
  const enemySp = bt ? speciesById(bt.enemyId) : null;
  const activeMon = party[activeIdx];

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-void font-term text-bone">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="vignette pointer-events-none absolute inset-0 z-[5]" />
      <div className="scanlines crt-flicker pointer-events-none absolute inset-0 z-[40] opacity-70" />
      {bt?.boss && inBattle && <div className="boss-vignette" />}

      {flash && (
        <div key={flash.key} className={`pointer-events-none absolute inset-0 z-[35] ${flash.kind === "red" ? "flash-red" : "flash-gold"}`} />
      )}

      {/* ================================ TITOLO ================================ */}
      {phase === "title" && (
        <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(11,6,20,0.55),rgba(11,6,20,0.93))] px-4">
          <div className="text-toxic tracking-[0.5em] text-sm md:text-base mb-2 title-float">✠ COMP-OS v6.66 PRESENTA ✠</div>
          <h1 className="font-display text-[11vw] md:text-[6.5rem] leading-[0.85] font-extrabold text-center text-bone text-outline pulse-glow">
            SHIN MORENI <span className="text-blood">TENSEI</span>
          </h1>
          <p className="mt-3 text-gold tracking-[0.25em] text-lg md:text-2xl font-display text-center">L'EPICA DEL MAIALE DEL MONDO</p>
          <p className="mt-1 text-dim text-base md:text-lg max-w-xl text-center">
            Un RPG demenziale: esplora Morenopoli, combatti a turni, offri morenini per convincere e catturare i Moreni.
          </p>

          <div className="mt-6 flex flex-col md:flex-row gap-3 items-center">
            {hasSave && (
              <button onClick={continueGame} className="btn-hard px-10 py-4 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-2xl md:text-3xl tracking-widest">
                ▶ CONTINUA LA PROFEZIA
              </button>
            )}
            <button
              onClick={() => {
                sfx.click();
                setSlotPanel("load");
                setConfirmSlot(null);
              }}
              className="btn-hard px-10 py-3 bg-panel2 border-2 border-gold text-gold font-display text-xl md:text-2xl tracking-widest"
            >
              📜 CARICA DA SLOT
            </button>
            <button onClick={startGame} className="btn-hard px-10 py-4 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl md:text-3xl tracking-widest">
              {hasSave ? "✠ NUOVA PROFEZIA" : "▶ INIZIA LA PROFEZIA [INVIO]"}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm md:text-base max-w-3xl w-full">
            <div className="border-2 border-edge bg-panel/80 p-3">
              <div className="text-toxic font-display text-lg mb-1">COME SI GIOCA</div>
              <ul className="text-dim space-y-0.5">
                <li>→ WASD/Frecce per muoverti, E per interagire</li>
                <li>→ Tocca i Moreni selvatici per combattere</li>
                <li>→ OFFRI il gusto giusto per convincere, poi CATTURA</li>
                <li>→ I Moreno si curano con l'INERZIA: stai lontano 1 min = 1 HP</li>
              </ul>
            </div>
            <div className="border-2 border-edge bg-panel/80 p-3">
              <div className="text-toxic font-display text-lg mb-1">COMANDI</div>
              <ul className="text-dim space-y-0.5">
                <li><span className="text-bone">WASD</span> MUOVI · <span className="text-bone">E</span> INTERAGISCI</li>
                <li><span className="text-bone">1-4</span> OFFRI GUSTO · <span className="text-bone">TAB/I</span> MENU</li>
                <li><span className="text-bone">P/ESC</span> PAUSA · <span className="text-bone">M</span> AUDIO</li>
                <li><span className="text-bone">SPAZIO</span> NEI DIALOGHI E NELL'ABBRACCIO</li>
              </ul>
            </div>
          </div>
          <div className="mt-5 text-dim text-xs tracking-widest">AUDIO CONSIGLIATO — I MORENI URLANO IN 8-BIT</div>
        </div>
      )}

      {/* ================================ STARTER ================================ */}
      {phase === "starter" && (
        <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-[rgba(5,2,10,0.9)] px-4">
          <div className="font-display text-4xl md:text-5xl text-gold text-center">SCEGLI IL TUO PRIMO MORENO</div>
          <div className="text-dim mt-2 mb-6 text-center">Don Moreno ti presta uno dei suoi. Trattalo bene.</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
            {["morenello", "morenilla", "morenozzo"].map((id) => {
              const s = speciesById(id);
              return (
                <button
                  key={id}
                  onClick={() => {
                    sfx.recruit();
                    const mon = makeMon(id, generateMorenoName());
                    setParty([mon]);
                    setActiveIdx(0);
                    activeIdxRef.current = 0;
                    engineRef.current?.enterWorld(0, 9);
                    setPhase("world");
                    showToast(`${mon.name ?? s.name} È CON TE!`);
                  }}
                  className="btn-hard roster-card p-4 cursor-pointer"
                  style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties}
                >
                  <MorenoFace sp={s} size={90} />
                  <div className="font-display text-2xl mt-2" style={{ color: hexCss(s.accentColor) }}>{s.name}</div>
                  <div className="text-dim text-sm">{s.title}</div>
                  <div className="text-xs mt-1">GUSTO: <span style={{ color: FLAVORS[s.favorite].css }}>{FLAVORS[s.favorite].name}</span></div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================ DIALOGO ================================ */}
      {phase === "dialogue" && (
        <DialogueBox lines={dlgLines} onDone={() => afterDlgRef.current?.()} onChoice={(i) => onChoiceRef.current?.(i)} />
      )}

      {/* ================================ BANNER ================================ */}
      {banner && (
        <div className="banner-root">
          <div className="banner-inner">
            <div className={`banner-kicker ${banner.boss ? "boss" : ""}`}>{banner.kicker}</div>
            <div className="banner-title">{banner.title}</div>
            <div className="banner-rule" />
          </div>
        </div>
      )}

      {/* ================================ TOAST ================================ */}
      {toast && <div className="perk-toast">{toast}</div>}

      {/* ================================ HUD MONDO ================================ */}
      {phase === "world" && (
        <>
          <div className="absolute top-3 left-3 z-[15] pointer-events-none">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2">
              <div className="text-toxic text-xs tracking-[0.3em]">COMP-OS v6.66</div>
              <div className="font-display text-xl leading-tight text-bone">{zone ? zone.name : "MORENOPOLI"}</div>
              <div className="text-dim text-xs">{zone ? zone.tagline : "Il cuore del mondo dei Moreni."}</div>
              <div className="mt-1 text-gold text-lg leading-none">
                CARISMA: <span className="tabular-nums">{score}</span>
              </div>
              <div className="mt-1 text-sm">🎯 <span className="text-bone">{questText()}</span></div>
            </div>
            <button
              onClick={() => openMenu()}
              className="btn-hard mt-2 border-2 border-toxic bg-panel/90 px-3 py-1.5 text-toxic font-display text-lg tracking-widest pointer-events-auto"
            >
              ☰ MENU MORENI [TAB]
            </button>
            <div className="border-2 border-edge bg-panel/85 px-3 py-1.5 mt-2 text-dim text-xs pointer-events-auto">
              WASD MUOVI · E INTERAGISCI · P PAUSA
            </div>
          </div>

          <div className="absolute top-3 right-3 z-[15] flex flex-col items-end gap-2">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2">
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
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[15] pointer-events-none">
              <div className="border-2 border-gold bg-panel/90 px-5 py-2 text-gold font-display text-xl tracking-widest pop-in">
                [E] {nearId === "pc" ? "USA IL PC DI MICA RIZZI" : nearId === "monument" ? "ESAMINA IL GRANDE MORENINO" : `PARLA CON ${nearId.toUpperCase()}`}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================ BATTAGLIA ================================ */}
      {inBattle && bt && enemySp && (
        <>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[15] pointer-events-none w-[min(460px,90vw)]">
            <div className={`border-2 bg-panel/90 px-3 py-2 ${bt.boss ? "border-blood" : "border-edge"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MorenoFace sp={enemySp} size={34} />
                  <div>
                    {bt.enemyName ? (
                      <>
                        <div className="font-display text-xl leading-none text-gold">{bt.enemyName}</div>
                        <div className="text-dim text-xs">{enemySp.name} · {enemySp.title}</div>
                      </>
                    ) : (
                      <>
                        <div className={`font-display text-xl leading-none ${bt.boss ? "text-blood" : "text-bone"}`}>{enemySp.name}</div>
                        <div className="text-dim text-xs">{enemySp.title}</div>
                      </>
                    )}
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
                <div className="mt-1 text-gold text-sm flex items-center gap-1">
                  <HeartSvg size={14} /> AMMORBIDITO — PRONTO PER L'OFFERTA FINALE
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 z-[15] pointer-events-none w-[min(430px,60vw)]">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2">
              <div className="text-toxic text-xs tracking-[0.3em] mb-1">REGISTRO DI BATTAGLIA</div>
              {bt.log.map((l) => (
                <div key={l.id} className={`text-sm md:text-base leading-tight truncate ${l.kind === "good" ? "text-toxic" : l.kind === "bad" ? "text-blood" : "text-dim"}`}>
                  &gt; {l.text}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-3 right-3 z-[15] flex flex-col gap-2 w-[min(480px,92vw)]">
            {/* party */}
            <div className="border-2 border-edge bg-panel/90 px-3 py-2">
              <div className="text-toxic text-xs tracking-[0.3em] mb-1">I TUOI MORENI</div>
              <div className="flex flex-col gap-1">
                {party.map((m, i) => {
                  const s = speciesById(m.spId);
                  const active = i === activeIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => switchMode && setActiveMember(i)}
                      disabled={bt.busy || !switchMode || active || m.hp <= 0}
                      className={`flex items-center gap-2 px-1 py-0.5 text-left transition-colors ${
                        active ? "bg-[#2a1b45]" : switchMode && m.hp > 0 && !bt.busy ? "hover:bg-[#2a1b45] cursor-pointer" : "opacity-90"
                      } ${m.hp <= 0 ? "opacity-40" : ""}`}
                    >
                      <span className={`w-3 h-3 border ${active ? "bg-toxic border-toxic" : "border-edge"}`} />
                      <MorenoFace sp={s} size={26} />
                      <span className="text-sm w-28 truncate" style={{ color: hexCss(s.accentColor) }}>
                        {m.name ?? s.name}
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
            <div className="border-2 border-edge bg-panel/90 px-3 py-2">
              <div className="min-h-[52px] mb-1.5">
                {offerMode && (
                  <div className="text-gold text-sm mb-1.5">OFFRI UN MORENINO AL {enemySp.name} (GUSTO?) [1-4]</div>
                )}
                {switchMode && <div className="text-toxic text-sm mb-1.5">SCEGLI IL MORENO DA SCHIERARE</div>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={playerAttack} disabled={bt.busy} className="btn-hard flex items-center justify-center gap-2 px-2 py-2.5 border-2 border-blood bg-[#4a1020] text-[#ffd1dd] font-display text-xl tracking-wide">
                  ⚔ ATTACCA
                </button>
                <button
                  onClick={() => {
                    sfx.click();
                    setOfferMode((o) => !o);
                    setSwitchMode(false);
                  }}
                  disabled={bt.busy}
                  className={`btn-hard flex items-center justify-center gap-2 px-2 py-2.5 border-2 font-display text-xl tracking-wide ${offerMode ? "border-gold bg-[#4a3a10] text-gold" : "border-gold bg-[#3d2f10] text-gold"}`}
                >
                  <CookieIcon css={FLAVORS[enemySp.favorite].css} size={20} /> OFFRI
                </button>
                <button
                  onClick={() => {
                    sfx.click();
                    setSwitchMode((sw) => !sw);
                    setOfferMode(false);
                  }}
                  disabled={bt.busy || party.length <= 1}
                  className={`btn-hard px-2 py-2.5 border-2 font-display text-xl tracking-wide ${switchMode ? "border-toxic bg-[#0f3d2a] text-toxic" : "border-toxic bg-[#0f2a1f] text-toxic"}`}
                >
                  ⇄ MORENO
                </button>
                <button onClick={tryFlee} disabled={bt.busy} className="btn-hard px-2 py-2.5 border-2 border-edge bg-panel2 text-dim font-display text-xl tracking-wide hover:text-bone">
                  🏃 FUGGI
                </button>
              </div>
              {offerMode && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {FLAVOR_LIST.map((f, i) => (
                    <button
                      key={f}
                      onClick={() => offerMorenino(f)}
                      disabled={bt.busy}
                      className="btn-hard flex flex-col items-center gap-1 px-1 py-2 border-2 font-display text-sm tracking-wide"
                      style={{ background: FLAVORS[f].cssDark, borderColor: FLAVORS[f].css, color: "#fff6ea" }}
                    >
                      <CookieIcon css={FLAVORS[f].css} size={20} />
                      {FLAVORS[f].name}
                      <span className="text-[10px] opacity-70 font-term">[{i + 1}]</span>
                    </button>
                  ))}
                </div>
              )}
              {bt.convinced && !offerMode && (
                <button
                  onClick={tryCapture}
                  disabled={bt.busy}
                  className="btn-hard mt-2 w-full px-2 py-3 border-2 border-gold bg-gold text-[#241503] font-display text-2xl tracking-widest pulse-glow"
                >
                  ★ CATTURA CON L'OFFERTA FINALE ★
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================================ QUIZ ================================ */}
      {phase === "quiz" && quiz && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[25] flex gap-2">
          {[0, 1, 2].map((i) => (
            <HeartSvg key={i} size={26} on={i < quiz.hearts} />
          ))}
        </div>
      )}

      {/* ================================ ABBRACCIO ================================ */}
      {phase === "hug" && (
        <div className="absolute inset-0 z-[22] flex flex-col items-center justify-center bg-[rgba(5,2,10,0.75)]">
          <div className="hug-heart">
            <HeartSvg size={120} on={hug.progress > 10} />
          </div>
          <div className="font-display text-3xl text-[#ff7fb2] mt-4">RIEMPI IL CUORE</div>
          <div className="text-dim mt-1">TIENI PREMUTO [SPAZIO] — NON MOLLARE L'ABBRACCIO</div>
          <div className="mt-4 w-[min(420px,80vw)] h-6 border-2 border-[#ff4f9a] bg-[#1e1033] overflow-hidden">
            <div className="hug-meter-fill h-full" style={{ width: `${hug.progress}%` }} />
          </div>
          <div className="text-gold tabular-nums mt-2 text-xl">{Math.round(hug.progress)}%</div>
        </div>
      )}

      {/* ================================ PAUSA ================================ */}
      {paused && !menuOpen && (phase === "world" || phase === "battle") && (
        <div className="absolute inset-0 z-[45] grid place-items-center bg-[rgba(5,2,10,0.82)]">
          <div className="border-2 border-toxic bg-panel px-10 py-8 text-center shadow-[0_0_40px_rgba(77,255,166,0.25)]">
            <div className="font-display text-5xl text-toxic mb-1">PAUSA</div>
            <div className="text-dim mb-5">I MORENI ASPETTANO. MALVOLENTI.</div>
            <button onClick={togglePause} className="btn-hard block w-full px-8 py-3 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-2xl tracking-widest mb-3">
              RIPRENDI [P]
            </button>
            <button
              onClick={() => {
                sfx.click();
                setPaused(false);
                pausedRef.current = false;
                openMenu();
              }}
              className="btn-hard block w-full px-8 py-2.5 bg-[#7a5fd0] border-2 border-[#cfc3ff] text-[#f4f0ff] font-display text-xl tracking-widest mb-3"
            >
              ☰ MENU GIOCO
            </button>
            <button
              onClick={() => {
                sfx.click();
                setSlotPanel("save");
                setConfirmSlot(null);
              }}
              className="btn-hard block w-full px-8 py-2.5 bg-gold border-2 border-[#fff0d1] text-[#241503] font-display text-xl tracking-widest mb-3"
            >
              💾 ARCHIVIO — SALVA / CARICA
            </button>
            <button onClick={backToTitle} className="btn-hard block w-full px-8 py-2 bg-panel2 border-2 border-edge text-dim font-display text-xl tracking-widest">
              TITOLI DI TESTA
            </button>
          </div>
        </div>
      )}

      {/* ================================ GAME OVER ================================ */}
      {phase === "gameover" && (
        <div className="absolute inset-0 z-[30] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(40,4,16,0.8),rgba(8,2,6,0.95))] px-4">
          <div className="font-display text-[10vw] md:text-[5.5rem] leading-none text-blood text-outline pulse-glow text-center">
            SEI STATO<br />SBRICIOLATO
          </div>
          <div className="mt-4 stamp-in border-4 border-blood px-6 py-2 font-display text-2xl md:text-3xl text-blood tracking-widest bg-[rgba(20,2,8,0.8)]">
            TUTTI I MORENI AL TAPPETO
          </div>
          <div className="mt-5 max-w-xl text-center px-6 text-lg md:text-xl text-dim">
            «I tuoi Moreni sono stanchi. Don Moreno li raccoglie col paletta. Riposati, e torna.»
          </div>
          <div className="mt-2 text-gold text-xl">
            CARISMA: <span className="tabular-nums">{score}</span>
          </div>
          <button onClick={revive} className="btn-hard mt-7 px-8 py-3 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl tracking-widest">
            RIALZATI DA DON MORENO
          </button>
        </div>
      )}

      {/* ================================ VITTORIA ================================ */}
      {phase === "victory" && (
        <div className="absolute inset-0 z-[30] overflow-y-auto bg-[radial-gradient(ellipse_at_center,rgba(20,12,4,0.78),rgba(8,5,2,0.95))]">
          <div className="min-h-full flex flex-col items-center justify-center py-8 px-4">
            <div className="text-gold tracking-[0.5em] text-sm mb-2">LA PROFEZIA È COMPIUTA</div>
            <div className="font-display text-[9vw] md:text-[5rem] leading-[0.9] text-center text-gold text-outline title-float">
              CROCCANTEZZA<br />RESTITUITA
            </div>
            <p className="mt-3 text-dim max-w-xl text-center text-base md:text-lg">
              Il Maiale del Mondo è di nuovo Nonno Moreno. Il Male del Mondo è in un cassetto. Clomp brandisce la Spada dell'Amore.
            </p>
            <div className="mt-2 text-toxic text-2xl">
              CARISMA: <span className="tabular-nums">{score}</span>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm w-full max-w-3xl">
              {CAST.map((c) => (
                <div key={c.name} className="flex justify-between gap-3 border-b border-edge/50 py-0.5">
                  <span className="text-gold whitespace-nowrap">{c.name}</span>
                  <span className="text-dim text-right">{c.role}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2 w-full max-w-4xl">
              {party.map((m, i) => {
                const s = speciesById(m.spId);
                return (
                  <div key={i} className="roster-card" style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties}>
                    <MorenoFace sp={s} size={44} />
                    <div className="font-display text-[10px] mt-1 leading-tight" style={{ color: hexCss(s.accentColor) }}>
                      {m.name ?? s.name}
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

      {/* ================================ MENU DI GIOCO RPG ================================ */}
      {menuOpen && (
        <div className="absolute inset-0 z-[48] flex items-center justify-center bg-[rgba(5,2,10,0.85)] p-3">
          <div className="w-full max-w-4xl h-[min(640px,92vh)] flex flex-col border-2 border-toxic bg-panel shadow-[0_0_60px_rgba(77,255,166,0.18)]">
            <div className="flex items-center gap-2 border-b-2 border-edge px-4 py-2.5">
              <div className="font-display text-2xl text-toxic tracking-widest mr-2">MENU MORENI</div>
              {(["formazione", "stato", "zaino"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    sfx.click();
                    setMenuTab(t);
                    setUseItemId(null);
                  }}
                  className={`btn-hard px-4 py-1.5 border-2 font-display text-lg tracking-widest uppercase ${
                    menuTab === t ? "border-toxic bg-toxic text-[#04150c]" : "border-edge bg-panel2 text-dim hover:text-bone"
                  }`}
                >
                  {t}
                </button>
              ))}
              <div className="flex-1" />
              <div className="text-gold text-lg whitespace-nowrap mr-2">
                CARISMA <span className="tabular-nums">{score}</span>
              </div>
              <button onClick={closeMenu} className="btn-hard px-3 py-1.5 bg-panel2 border-2 border-edge text-dim font-display text-xl">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* ---- FORMAZIONE ---- */}
              {menuTab === "formazione" && (
                <div>
                  <div className="text-dim mb-3 tracking-wide text-sm">
                    {phase === "battle" ? "TOCCA UN MORENO PER SCHIERARLO IN BATTAGLIA" : "TOCCA UN MORENO PER MANDARLO IN PRIMA LINEA"}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {party.map((m, i) => {
                      const s = speciesById(m.spId);
                      const active = i === activeIdx;
                      return (
                        <div
                          key={i}
                          onClick={() => m.hp > 0 && setActiveMember(i)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && m.hp > 0) setActiveMember(i);
                          }}
                          className={`btn-hard roster-card text-left p-3 cursor-pointer ${active ? "ring-2 ring-toxic" : ""} ${m.hp <= 0 ? "opacity-60" : ""}`}
                          style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties}
                        >
                          <div className="flex items-center justify-between">
                            <MorenoFace sp={s} size={56} />
                            {active && <span className="text-[10px] font-display tracking-widest bg-toxic text-[#04150c] px-1.5 py-0.5">ATTIVO</span>}
                          </div>
                          <div className="font-display text-lg mt-1 leading-tight text-gold">{m.name ?? s.name}</div>
                          {m.name && (
                            <div className="font-display text-xs leading-tight" style={{ color: hexCss(s.accentColor) }}>
                              {s.name}
                            </div>
                          )}
                          <HpBar hp={m.hp} max={m.maxHp} w={120} />
                          <div className="text-dim text-xs mt-1">
                            HP <span className="text-bone tabular-nums">{m.hp}/{m.maxHp}</span> · ATK <span className="text-bone tabular-nums">{m.atk}</span>
                          </div>
                          {m.hp <= 0 && <div className="text-blood text-xs mt-1 font-display">AL TAPPETO</div>}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              releaseFromParty(i);
                            }}
                            className={`btn-hard mt-2 w-full py-1 border-2 font-display text-sm tracking-widest ${
                              partyReleaseArm === i ? "bg-blood border-[#ffd1dd] text-[#fff0f4]" : "bg-panel2 border-edge text-dim hover:text-bone"
                            }`}
                          >
                            {partyReleaseArm === i ? "LIBERARE DAVVERO?" : "LIBERA MORENINO"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {party.length === 0 && <div className="text-dim">NESSUN MORENO. CHE PROFEZIA È?</div>}
                </div>
              )}

              {/* ---- STATO ---- */}
              {menuTab === "stato" && (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex md:flex-col gap-2 flex-wrap">
                    {party.map((m, i) => {
                      const s = speciesById(m.spId);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            sfx.click();
                            setMenuSel(i);
                          }}
                          className={`btn-hard flex items-center gap-2 px-3 py-2 border-2 ${i === menuSel ? "bg-panel2 border-toxic" : "bg-[#120a20] border-edge"}`}
                        >
                          <MorenoFace sp={s} size={34} />
                          <span className="font-display" style={{ color: hexCss(s.accentColor) }}>{m.name ?? s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const m = party[menuSel];
                    if (!m) return <div className="text-dim">NESSUN MORENO SELEZIONATO.</div>;
                    const s = speciesById(m.spId);
                    const fav = FLAVORS[s.favorite];
                    return (
                      <div className="flex-1 border-2 border-edge bg-panel2 p-4" style={{ borderColor: hexCss(s.accentColor) }}>
                        <div className="flex items-center gap-4">
                          <div className="border-2 p-2" style={{ borderColor: hexCss(s.accentColor), background: "#160b26" }}>
                            <MorenoFace sp={s} size={110} />
                          </div>
                          <div>
                            <div className="font-display text-3xl leading-none text-gold">{m.name ?? s.name}</div>
                            <div className="font-display text-lg" style={{ color: hexCss(s.accentColor) }}>{s.name}</div>
                            <div className="text-dim text-sm mt-1">{s.title}</div>
                            <div className="mt-2 text-sm">
                              GUSTO PREFERITO: <span style={{ color: fav.css }}>{fav.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-base">
                          <div className="text-dim">HP</div>
                          <div className="flex items-center gap-2">
                            <HpBar hp={m.hp} max={m.maxHp} w={140} />
                            <span className="tabular-nums text-bone">{m.hp}/{m.maxHp}</span>
                          </div>
                          <div className="text-dim">ATTACCO</div>
                          <div className="text-bone tabular-nums">{m.atk}</div>
                          <div className="text-dim">FRASE TIPICA</div>
                          <div className="text-bone text-sm italic">
                            «{(() => {
                              const lines = s.recruitLines.length ? s.recruitLines : s.hurtLines.length ? s.hurtLines : s.angryLines;
                              return lines.length ? pick(lines) : "…";
                            })()}»
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ---- ZAINO ---- */}
              {menuTab === "zaino" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gold font-display text-xl mb-2">OGGETTI CHIAVE</div>
                    {items.length === 0 && <div className="text-dim">NIENTE DI SPECIALE. ANCORA.</div>}
                    {items.map((it) => (
                      <div key={it} className="border-2 border-edge bg-panel2 px-3 py-2 mb-2">
                        <div className="text-toxic font-display text-lg">◆ {ITEMS[it].name}</div>
                        <div className="text-dim text-sm">{ITEMS[it].desc}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-gold font-display text-xl mb-2">MORENINI CURATIVI {useItemId && <span className="text-toxic text-sm">(SCEGLI IL MORENO)</span>}</div>
                    {CONSUMABLE_LIST.map((c) => {
                      const count = consumables[c.id] ?? 0;
                      const active = useItemId === c.id;
                      return (
                        <div key={c.id} className={`border-2 px-3 py-2 mb-2 ${active ? "border-gold bg-[#3d2f10]" : "border-edge bg-panel2"}`}>
                          <div className="flex items-center justify-between">
                            <div className="font-display text-lg" style={{ color: c.hue }}>
                              <CookieIcon css={c.hue} size={18} /> {c.name}
                            </div>
                            <span className="tabular-nums text-bone">×{count}</span>
                          </div>
                          <div className="text-dim text-sm">{c.desc}</div>
                          {!active ? (
                            <button
                              onClick={() => {
                                if (count <= 0) {
                                  sfx.wrong();
                                  showToast("NON NE HAI PIÙ. VINCI BATTAGLIE PER TROVARNE.");
                                  return;
                                }
                                sfx.click();
                                setUseItemId(c.id);
                              }}
                              disabled={count <= 0}
                              className="btn-hard mt-1 px-3 py-1 border-2 border-gold bg-panel2 text-gold font-display text-sm tracking-widest"
                            >
                              USA
                            </button>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {party.map((m, i) => (
                                <button
                                  key={i}
                                  onClick={() => useConsumableOn(c.id, i)}
                                  className="btn-hard px-2 py-1 border-2 border-edge bg-[#160b26] text-dim hover:text-bone text-xs flex items-center gap-1"
                                >
                                  <MorenoFace sp={speciesById(m.spId)} size={20} />
                                  {m.name ?? speciesById(m.spId).name} {m.hp}/{m.maxHp}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================ PC DI MICA RIZZI ================================ */}
      {pcOpen && (
        <div className="absolute inset-0 z-[46] flex items-center justify-center bg-[rgba(5,2,10,0.88)] p-3">
          <div className="w-full max-w-4xl h-[min(640px,94vh)] flex flex-col border-2 border-toxic bg-panel shadow-[0_0_60px_rgba(77,255,166,0.2)]">
            <div className="flex items-center gap-3 border-b-2 border-edge px-4 py-2.5">
              <div>
                <div className="font-display text-2xl text-toxic tracking-widest leading-none">PC DI MICA RIZZI</div>
                <div className="text-dim text-xs mt-0.5">«I tuoi Morenini qui sono al sicuro. Anche dal mio riordino compulsivo.» — Mica Lizzi</div>
              </div>
              <div className="flex-1" />
              <div className="text-gold text-sm whitespace-nowrap">
                SLOT PC <span className="tabular-nums">{pc.length}/{PC_CAP}</span>
              </div>
              <button onClick={closePc} className="btn-hard px-3 py-1.5 bg-panel2 border-2 border-edge text-dim font-display text-xl">
                ✕
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 overflow-hidden">
              <div className="w-full md:w-60 flex flex-col border-2 border-edge bg-panel2/60">
                <div className="text-toxic text-xs tracking-[0.25em] px-2 py-1.5 border-b border-edge">SQUADRA ({party.length}/8)</div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {party.map((m, i) => {
                    const s = speciesById(m.spId);
                    const sel = pcSel?.kind === "party" && pcSel.idx === i;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          sfx.click();
                          setPcSel({ kind: "party", idx: i });
                          setPcReleaseArm(false);
                        }}
                        className={`btn-hard w-full flex items-center gap-2 px-2 py-1.5 border-2 text-left ${sel ? "border-gold bg-[#2a1b45]" : "border-edge bg-[#160b26] hover:border-dim"}`}
                      >
                        <MorenoFace sp={s} size={30} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gold truncate">{m.name ?? s.name}</div>
                          <div className="text-[10px] text-dim truncate">{s.name}</div>
                        </div>
                        <span className={`text-[10px] tabular-nums ${m.hp <= 0 ? "text-blood" : "text-dim"}`}>{m.hp}/{m.maxHp}</span>
                      </button>
                    );
                  })}
                  {party.length === 0 && <div className="text-dim text-xs px-2">SQUADRA VUOTA.</div>}
                </div>
              </div>

              <div className="flex-1 flex flex-col border-2 border-edge bg-panel2/60">
                <div className="text-toxic text-xs tracking-[0.25em] px-2 py-1.5 border-b border-edge">MEMORIA DI MICA RIZZI ({pc.length}/{PC_CAP})</div>
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
                    {Array.from({ length: PC_CAP }, (_, i) => {
                      const mon = pc[i];
                      const sel = pcSel?.kind === "pc" && pcSel.idx === i;
                      if (!mon) {
                        return (
                          <div key={i} className="aspect-square border border-dashed border-edge/60 grid place-items-center text-edge text-xs">
                            ·
                          </div>
                        );
                      }
                      const s = speciesById(mon.spId);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            sfx.click();
                            setPcSel({ kind: "pc", idx: i });
                            setPcReleaseArm(false);
                          }}
                          title={monName(mon)}
                          className={`btn-hard aspect-square border-2 p-0.5 flex flex-col items-center justify-center ${sel ? "border-gold bg-[#2a1b45]" : "border-edge bg-[#160b26] hover:border-dim"}`}
                        >
                          <MorenoFace sp={s} size={26} />
                          <div className="text-[8px] leading-none mt-0.5 truncate w-full text-center" style={{ color: hexCss(s.accentColor) }}>
                            {mon.name ?? s.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-edge px-4 py-2.5 flex items-center gap-2 min-h-[58px]">
              {!pcSel && <div className="text-dim text-sm">SELEZIONA UN MORENINO DALLA SQUADRA (PER DEPOSITARE) O DAL PC (PER RITIRARE/LIBERARE).</div>}
              {pcSel?.kind === "party" && party[pcSel.idx] && (
                <>
                  <div className="text-bone text-sm flex-1">{monName(party[pcSel.idx])} — in squadra</div>
                  <button onClick={() => depositToPc(pcSel.idx)} className="btn-hard px-5 py-2 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-lg tracking-widest">
                    ⬇ DEPOSITA NEL PC
                  </button>
                </>
              )}
              {pcSel?.kind === "pc" && pc[pcSel.idx] && (
                <>
                  <div className="text-bone text-sm flex-1">{monName(pc[pcSel.idx])} — nel PC</div>
                  <button onClick={() => withdrawFromPc(pcSel.idx)} className="btn-hard px-5 py-2 bg-gold border-2 border-[#fff0d1] text-[#241503] font-display text-lg tracking-widest">
                    ⬆ RITIRA IN SQUADRA
                  </button>
                  <button
                    onClick={() => releaseFromPc(pcSel.idx)}
                    className={`btn-hard px-5 py-2 border-2 font-display text-lg tracking-widest ${pcReleaseArm ? "bg-blood border-[#ffd1dd] text-[#fff0f4]" : "bg-panel2 border-edge text-dim hover:text-bone"}`}
                  >
                    {pcReleaseArm ? "LIBERARE DAVVERO?" : "LIBERA"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================ NOTIFICA D'INERZIA ================================ */}
      {inertiaNotice && (
        <div className="absolute inset-0 z-[52] flex items-center justify-center bg-[rgba(5,2,10,0.85)] p-4">
          <div className="max-w-xl w-full border-2 border-toxic bg-panel p-6 text-center pop-in shadow-[0_0_60px_rgba(77,255,166,0.25)]">
            <div className="font-display text-3xl text-toxic tracking-widest mb-2">INERZIA</div>
            <div className="text-dim text-sm mb-3">UN MORENINO È ANDATO A 0 HP. IL MONDO HA QUALCOSA DA DIRTI.</div>
            <p className="text-bone text-lg leading-snug">
              «Il gioco ha un sistema di cura basato sull'inerzia. Vai fuori a socializzare o fai qualcosa di produttivo o
              bello per te stesso lontano dallo schermo. Magari diffondi anche un po' di amore. Poi torna qui.»
            </p>
            <div className="text-dim text-sm mt-3">
              I tuoi Moreni recuperano <span className="text-toxic">1 HP al minuto</span> lontano dallo schermo. Dopo{" "}
              <span className="text-gold">60 minuti</span> rinascono (con 1 HP) e riprendono a curarsi.
            </div>
            <button
              onClick={() => {
                sfx.click();
                setInertiaNotice(false);
              }}
              className="btn-hard mt-4 px-8 py-2.5 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-xl tracking-widest"
            >
              HO CAPITO
            </button>
          </div>
        </div>
      )}

      {/* ================================ ARCHIVIO SLOT ================================ */}
      {slotPanel && (
        <div className="absolute inset-0 z-[50] grid place-items-center bg-[rgba(5,2,10,0.88)] p-4">
          <div className="w-full max-w-2xl border-2 border-gold bg-panel shadow-[0_0_50px_rgba(255,201,77,0.22)]">
            <div className="flex items-center justify-between border-b-2 border-edge px-5 py-3">
              <div>
                <div className="font-display text-3xl text-gold leading-none">ARCHIVIO DEMONIACO</div>
                <div className="text-dim text-sm mt-1 tracking-widest">
                  {slotPanel === "save" ? "SALVA / CARICA — L'AUTOSAVE NON SI TOCCA, GLI SLOT SÌ" : "CARICA UNA PROFEZIA DA UNO SLOT"}
                </div>
              </div>
              <button
                onClick={() => {
                  sfx.click();
                  setSlotPanel(null);
                  setConfirmSlot(null);
                }}
                className="btn-hard px-4 py-2 bg-panel2 border-2 border-edge text-dim font-display text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto" key={slotTick}>
              {(() => {
                const auto = loadSave();
                const cnt = auto ? new Set(auto.party.map((m) => m.spId)).size : 0;
                return (
                  <div className="flex items-center gap-4 border-2 border-edge bg-panel2 px-4 py-3">
                    <div className="font-display text-3xl text-toxic w-14 text-center leading-none">
                      A<span className="block text-[10px] tracking-widest text-dim">AUTO</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {auto ? (
                        <>
                          <div className="text-bone text-base truncate">🎯 {questTextFor(auto.flags, cnt)}</div>
                          <div className="text-dim text-sm">
                            CARISMA <span className="text-gold tabular-nums">{auto.score}</span> · AMICI{" "}
                            <span className="text-toxic tabular-nums">{cnt}</span> · {formatWhen(auto.savedAt)}
                          </div>
                        </>
                      ) : (
                        <div className="text-dim">NESSUN AUTOSAVE. GIOCA UN PO'.</div>
                      )}
                    </div>
                    {auto && (
                      <button onClick={loadFromAutosave} className="btn-hard px-4 py-2 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-lg tracking-widest">
                        CARICA
                      </button>
                    )}
                  </div>
                );
              })()}

              {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).map((n) => {
                const save = readSlot(n);
                const cnt = save ? new Set(save.party.map((m) => m.spId)).size : 0;
                const occupied = !!save;
                return (
                  <div key={n} className={`flex items-center gap-4 border-2 px-4 py-3 transition-colors ${occupied ? "border-[#7a5fd0] bg-panel2" : "border-edge bg-[#120a20]"}`}>
                    <div className={`font-display text-3xl w-14 text-center leading-none ${occupied ? "text-[#b39dff]" : "text-dim"}`}>
                      {n}
                      <span className="block text-[10px] tracking-widest text-dim">SLOT</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {save ? (
                        <>
                          <div className="text-bone text-base truncate">🎯 {questTextFor(save.flags, cnt)}</div>
                          <div className="text-dim text-sm">
                            CARISMA <span className="text-gold tabular-nums">{save.score}</span> · AMICI{" "}
                            <span className="text-toxic tabular-nums">{cnt}</span> · {formatWhen(save.savedAt)}
                          </div>
                        </>
                      ) : (
                        <div className="text-dim">VUOTO — PRONTO PER UNA PROFEZIA</div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-col md:flex-row">
                      {slotPanel === "save" && (
                        <button
                          onClick={() => saveToSlot(n)}
                          className={`btn-hard px-4 py-2 border-2 font-display text-lg tracking-widest ${
                            confirmSlot === n
                              ? "bg-blood border-[#ffd1dd] text-[#fff0f4]"
                              : occupied
                              ? "bg-[#5c2f17] border-[#8a4b2a] text-[#ffd9a0]"
                              : "bg-gold border-[#fff0d1] text-[#241503]"
                          }`}
                        >
                          {confirmSlot === n ? "SOVRASCRIVI?" : occupied ? "SALVA (OCCUPATO)" : "SALVA"}
                        </button>
                      )}
                      {save && (
                        <>
                          <button onClick={() => loadFromSlot(n)} className="btn-hard px-4 py-2 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-lg tracking-widest">
                            CARICA
                          </button>
                          <button
                            onClick={() => wipeSlot(n)}
                            className={`btn-hard px-3 py-2 border-2 font-display text-lg ${confirmSlot === -n ? "bg-blood border-[#ffd1dd] text-[#fff0f4]" : "bg-panel2 border-edge text-dim"}`}
                            title="Svuota slot"
                          >
                            {confirmSlot === -n ? "CONFERMI?" : "✕"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t-2 border-edge px-5 py-2.5 text-dim text-sm tracking-wide">
              {slotPanel === "save"
                ? "L'AUTOSAVE (slot A) si aggiorna da solo. Gli slot manuali restano dove li metti."
                : "Scegli uno slot per riprendere la tua PROFEZIA."}
            </div>
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
        className="absolute top-3 left-1/2 -translate-x-1/2 z-[46] border-2 border-edge bg-panel/85 px-3 py-1 text-dim hover:text-toxic hover:border-toxic transition-colors text-sm tracking-widest"
        title="Audio [M]"
      >
        {muted ? "♪ AUDIO: OFF" : "♪ AUDIO: ON"}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MoreniGame />
    </ErrorBoundary>
  );
}
