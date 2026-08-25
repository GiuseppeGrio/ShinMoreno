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
  MINIGAME,
  MORENINI_PRICES,
  SCRIPTS,
  START_BRICIOLE,
  START_CONSUMABLES,
  START_MORENINI,
  SWORD_REQ,
  TRIAL_QUIZ,
  ZONES,
  battleBriciole,
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
const PC_CAP = 100;

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
  diff: number;
  log: { id: number; text: string; kind: "info" | "good" | "bad" }[];
}

function makeMon(spId: string, name?: string): PartyMon {
  const s = speciesById(spId);
  return { spId, hp: s.baseHp, maxHp: s.baseHp, atk: s.baseAtk, name };
}

const monName = (m: PartyMon) => m.name ?? speciesById(m.spId).name;

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

const formatWhen = (ts: number) =>
  new Date(ts).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/* ---------------- salvataggi ---------------- */
const SAVE_KEY = "shin-moreni-tensei-save-v1";
const SLOT_KEY = (n: number) => `shin-moreni-tensei-slot-${n}`;
const SLOT_COUNT = 3;

interface SaveData {
  flags: Flags;
  party: PartyMon[];
  items: string[];
  consumables?: Record<string, number>;
  capturedSpecies?: string[];
  pc?: PartyMon[];
  briciole?: number;
  morenini?: Record<FlavorId, number>;
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
    /* storage pieno o bloccato: ignora */
  }
}
function deleteSaveKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignora */
  }
}

const readSave = () => readSaveKey(SAVE_KEY);
const writeSave = (d: SaveData) => writeSaveKey(SAVE_KEY, d);
const clearSave = () => deleteSaveKey(SAVE_KEY);
const readSlot = (n: number) => readSaveKey(SLOT_KEY(n));
const writeSlot = (n: number, d: SaveData) => writeSaveKey(SLOT_KEY(n), d);
const deleteSlot = (n: number) => deleteSaveKey(SLOT_KEY(n));

/* ================================================================
   RITRATTI SVG PROCEDURALI
   ================================================================ */
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
      {p.beret && <ellipse cx="54" cy="22" rx="20" ry="7" fill="#c0392b" />}
      <circle cx="50" cy="55" r="35" fill={body} />
      <ellipse cx="50" cy="68" rx="22" ry="15" fill={belly} />
      {p.crown && (
        <polygon points="28,24 35,8 43,20 50,3 57,20 65,8 72,24 70,30 30,30" fill="#ffd700" stroke="#8a6a00" strokeWidth="2" />
      )}
      {p.hood && <path d="M16 50 Q50 2 84 50 L78 34 Q50 12 22 34 Z" fill="#12081f" />}
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
          {p.tears && (
            <>
              <ellipse cx="30" cy="62" rx="3.6" ry="6" fill="#6fd7ff" />
              <ellipse cx="70" cy="62" rx="3.6" ry="6" fill="#6fd7ff" />
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
      {p.snout && (
        <>
          <ellipse cx="50" cy="63" rx="11" ry="8" fill={belly} stroke="#47101f" strokeWidth="1.5" />
          <circle cx="46" cy="63" r="1.8" fill="#47101f" />
          <circle cx="54" cy="63" r="1.8" fill="#47101f" />
        </>
      )}
      {p.tusks && (
        <>
          <polygon points="32,72 36,82 40,72" fill="#f5e6c8" />
          <polygon points="60,72 64,82 68,72" fill="#f5e6c8" />
        </>
      )}
      {p.mustache && (
        <>
          <rect x="30" y="66" width="17" height="4" fill="#2d2438" transform="rotate(14 38 68)" />
          <rect x="53" y="66" width="17" height="4" fill="#2d2438" transform="rotate(-14 62 68)" />
        </>
      )}
      {!p.snout && !p.mustache && <ellipse cx="50" cy="70" rx="7.5" ry="5" fill="#47101f" />}
      {p.heart && <path d="M50 16 c-3 -6 -12 -6 -12 1 c0 6 8 9 12 13 c4 -4 12 -7 12 -13 c0 -7 -9 -7 -12 -1" fill="#ff4f9a" />}
      {p.chain && <ellipse cx="50" cy="86" rx="27" ry="7" fill="none" stroke={acc} strokeWidth="4" strokeDasharray="6 4" />}
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

/* ================================================================
   DIALOGO JRPG (typewriter + scelte)
   ================================================================ */
function DialogueBox({ lines, onChoice, onDone }: { lines: DialogueLine[]; onChoice?: (i: number) => void; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const line = lines[Math.min(idx, lines.length - 1)];
  const full = line.text;
  const done = chars >= full.length;
  const hasChoices = done && !!line.choices && idx === lines.length - 1;

  useEffect(() => setChars(0), [idx]);
  useEffect(() => {
    if (chars < full.length) {
      const t = window.setTimeout(() => {
        setChars((c) => c + 1);
      }, 16);
      return () => window.clearTimeout(t);
    }
  }, [chars, full]);

  const advance = () => {
    if (hasChoices) return;
    if (!done) {
      setChars(full.length);
      return;
    }
    if (idx + 1 < lines.length) {
      sfx.click();
      setIdx(idx + 1);
    } else {
      onDone();
    }
  };

  const spk = line.spk;
  const sp = speciesById(spk);
  const isNarrator = spk === "NARRATORE";
  const isTu = spk === "TU";
  const acc = !isNarrator && !isTu ? hexCss(sp.accentColor) : isTu ? "#4dffa6" : "#bfa8ff";
  const name = !isNarrator && !isTu ? sp.name : isTu ? "TU — EVOCATORE MEDIOCRE" : "PROFEZIA DI MORENOPOLI";

  return (
    <div className="dlg-root" onClick={advance}>
      <div className="dlg-box relative" style={{ "--acc": acc } as React.CSSProperties}>
        <div className="dlg-name" style={{ background: acc }}>{name}</div>
        <div className="flex gap-4 items-center">
          {!isNarrator && (
            <div className="dlg-portrait">
              {isTu ? <TuFace size={76} /> : <MorenoFace sp={sp} size={76} />}
            </div>
          )}
          <div className={`dlg-text flex-1 ${isNarrator ? "narrator" : ""}`}>
            {full.slice(0, chars)}
            <span className="blink">▌</span>
            {hasChoices && (
              <div className="dlg-choices">
                {line.choices!.map((c, i) => (
                  <button key={i} className="dlg-choice" onClick={(e) => { e.stopPropagation(); onChoice?.(i); }}>
                    ▸ {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {!hasChoices && (
          <div className="dlg-hint">[SPAZIO / CLICK] {!done ? "COMPLETA" : idx + 1 < lines.length ? "CONTINUA ▼" : "AVANTI ▼"}</div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   MICRO-COMPONENTI HUD
   ================================================================ */
function HpBar({ hp, max, w = 110 }: { hp: number; max: number; w?: number }) {
  const pct = Math.max(0, Math.min(1, hp / max));
  const col = pct > 0.5 ? "#4dffa6" : pct > 0.22 ? "#ffc94d" : "#ff2e5f";
  return (
    <div style={{ width: w, height: 10 }} className="border border-edge bg-[#120a20] overflow-hidden">
      <div style={{ width: `${pct * 100}%`, height: "100%", background: col, transition: "width 0.25s ease" }} />
    </div>
  );
}

function TurnDiamond({ state }: { state: "full" | "empty" }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" className={state === "full" ? "drop-shadow-[0_0_7px_rgba(255,46,95,0.9)]" : ""}>
      <path d="M12 2 L22 12 L12 22 L2 12 Z" fill={state === "full" ? "#ff2e5f" : "rgba(30,16,51,0.75)"} stroke={state === "full" ? "#ffd1dd" : "#4a2b6e"} strokeWidth="1.6" />
      {state === "full" && <path d="M12 6 L16 12 L12 18 L8 12 Z" fill="rgba(255,255,255,0.35)" />}
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

/* ================================================================
   MORENOPONG — minigioco (tetris × pong)
   ================================================================ */
const MCOLS = 12;
const MROWS = 14;
const MCELL = 30;
const MW = MCOLS * MCELL;
const MH = 420 + 110;
const FLAVOR_CSS = ["#d8b98a", "#8a4b2a", "#ff6fa5", "#9bd84b"];

interface PongPiece { cells: { c: number; r: number }[]; color: number; dy: number }

function Morenopong({ onExit }: { onExit: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    grid: [] as number[][],
    piece: null as PongPiece | null,
    spawnIn: 0.4,
    ball: { x: MW / 2, y: 480, vx: 2.6, vy: -4.2 },
    paddleX: MW / 2 - 40,
    paddleW: 80,
    paddleTarget: MW / 2 - 40,
    score: 0,
    lives: 3,
    combo: 1,
    over: false,
    clearing: [] as { row: number; t: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    shake: 0,
    keys: { left: false, right: false },
    time: 0,
  });
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    const S = stateRef.current;
    S.grid = Array.from({ length: MROWS }, () => Array(MCOLS).fill(-1));

    const SHAPES: { c: number; r: number }[][] = [
      [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 3, r: 0 }],
      [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }],
      [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 1, r: 1 }],
      [{ c: 1, r: 0 }, { c: 2, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }],
      [{ c: 0, r: 0 }, { c: 0, r: 1 }, { c: 0, r: 2 }, { c: 1, r: 2 }],
      [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 1, r: 1 }, { c: 1, r: 2 }],
    ];

    const spawnPiece = () => {
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const width = Math.max(...shape.map((c) => c.c)) + 1;
      const col = Math.floor(Math.random() * (MCOLS - width + 1));
      S.piece = { cells: shape.map((c) => ({ c: c.c + col, r: c.r })), color: Math.floor(Math.random() * 4), dy: 0 };
    };

    const stackTop = (c: number) => {
      for (let r = 0; r < MROWS; r++) if (S.grid[r][c] !== -1) return r;
      return MROWS;
    };

    const checkRows = () => {
      for (let r = 0; r < MROWS; r++) {
        if (S.grid[r].every((v) => v !== -1) && !S.clearing.some((c) => c.row === r)) {
          S.clearing.push({ row: r, t: 0.3 });
          S.score += 100 * S.combo;
          S.combo = Math.min(4, S.combo + 1);
          S.shake = 6;
          for (let c = 0; c < MCOLS; c++) {
            for (let i = 0; i < 3; i++) {
              S.particles.push({ x: c * MCELL + MCELL / 2, y: r * MCELL + MCELL / 2, vx: (Math.random() - 0.5) * 240, vy: (Math.random() - 0.5) * 240, life: 0.6, color: FLAVOR_CSS[S.grid[r][c]] ?? "#ffc94d" });
            }
          }
        }
      }
    };

    const lockPiece = () => {
      if (!S.piece) return;
      let overflow = false;
      for (const cell of S.piece.cells) {
        const target = stackTop(cell.c) - 1;
        if (target < 0) {
          overflow = true;
          break;
        }
        S.grid[target][cell.c] = S.piece.color;
      }
      S.piece = null;
      S.spawnIn = 0.6;
      if (overflow) S.over = true;
      else checkRows();
    };

    const collapseRows = () => {
      const done = S.clearing.filter((c) => c.t <= 0).map((c) => c.row).sort((a, b) => b - a);
      for (const row of done) {
        S.grid.splice(row, 1);
        S.grid.unshift(Array(MCOLS).fill(-1));
      }
      if (done.length) S.clearing = S.clearing.filter((c) => c.t > 0);
    };

    const resetBall = () => {
      S.ball = { x: S.paddleX + S.paddleW / 2, y: 470, vx: (Math.random() < 0.5 ? -1 : 1) * 2.6, vy: -4.4 };
    };

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = MW * dpr;
    canvas.height = MH * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let last = performance.now();

    const step = (dt: number) => {
      S.time += dt;
      if (S.keys.left) S.paddleTarget -= 420 * dt;
      if (S.keys.right) S.paddleTarget += 420 * dt;
      S.paddleTarget = Math.max(0, Math.min(MW - S.paddleW, S.paddleTarget));
      S.paddleX += (S.paddleTarget - S.paddleX) * Math.min(1, dt * 18);

      if (!S.piece && !S.over) {
        S.spawnIn -= dt;
        if (S.spawnIn <= 0) spawnPiece();
      }
      if (S.piece && !S.over) {
        const fallSpeed = 46 + Math.min(90, S.score / 14);
        S.piece.dy += fallSpeed * dt;
        let landed = false;
        for (const cell of S.piece.cells) {
          const top = stackTop(cell.c);
          const bottom = cell.r * MCELL + S.piece.dy + MCELL;
          if (bottom >= top * MCELL) landed = true;
        }
        if (landed) lockPiece();
      }

      for (const c of S.clearing) c.t -= dt;
      collapseRows();

      if (!S.over) {
        const steps = 3;
        const bSpeed = 4.4 + Math.min(3.5, S.score / 260);
        const mag = Math.hypot(S.ball.vx, S.ball.vy) || 1;
        S.ball.vx = (S.ball.vx / mag) * bSpeed;
        S.ball.vy = (S.ball.vy / mag) * bSpeed;
        for (let i = 0; i < steps; i++) {
          const b = S.ball;
          b.x += (S.ball.vx * 60 * dt) / steps;
          b.y += (S.ball.vy * 60 * dt) / steps;
          if (b.x < 7) { b.x = 7; b.vx = Math.abs(b.vx); }
          if (b.x > MW - 7) { b.x = MW - 7; b.vx = -Math.abs(b.vx); }
          if (b.y < 7) { b.y = 7; b.vy = Math.abs(b.vy); }
          if (b.vy > 0 && b.y > 482 && b.y < 500 && b.x > S.paddleX - 7 && b.x < S.paddleX + S.paddleW + 7) {
            const hit = (b.x - (S.paddleX + S.paddleW / 2)) / (S.paddleW / 2);
            b.vy = -Math.abs(b.vy);
            b.vx = hit * 4.6;
            b.y = 481;
            S.score += 5;
          }
          const gc = Math.floor(b.x / MCELL);
          const gr = Math.floor(b.y / MCELL);
          let broke = false;
          for (let dr = -1; dr <= 1 && !broke; dr++) {
            for (let dc = -1; dc <= 1 && !broke; dc++) {
              const r = gr + dr;
              const c = gc + dc;
              if (r < 0 || r >= MROWS || c < 0 || c >= MCOLS) continue;
              if (S.grid[r][c] === -1) continue;
              const bx = c * MCELL;
              const by = r * MCELL;
              const nx = Math.max(bx, Math.min(b.x, bx + MCELL));
              const ny = Math.max(by, Math.min(b.y, by + MCELL));
              const dx = b.x - nx;
              const dy = b.y - ny;
              if (dx * dx + dy * dy < 49) {
                const col = FLAVOR_CSS[S.grid[r][c]];
                S.grid[r][c] = -1;
                S.score += 10;
                S.shake = 3;
                for (let p = 0; p < 6; p++) {
                  S.particles.push({ x: bx + MCELL / 2, y: by + MCELL / 2, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, life: 0.5, color: col });
                }
                if (Math.abs(dx) > Math.abs(dy)) b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx);
                else b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy);
                broke = true;
              }
            }
          }
          if (b.y > MH + 12) {
            S.lives -= 1;
            S.combo = 1;
            S.shake = 8;
            if (S.lives <= 0) S.over = true;
            else resetBall();
          }
        }
      }

      for (let i = S.particles.length - 1; i >= 0; i--) {
        const p = S.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        if (p.life <= 0) S.particles.splice(i, 1);
      }
      S.shake = Math.max(0, S.shake - 30 * dt);
    };

    const draw = () => {
      const b = S.ball;
      ctx.save();
      ctx.clearRect(0, 0, MW, MH);
      ctx.fillStyle = "#120a20";
      ctx.fillRect(0, 0, MW, MH);
      if (S.shake > 0) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);

      ctx.strokeStyle = "rgba(58,33,96,0.5)";
      ctx.lineWidth = 1;
      for (let c = 0; c <= MCOLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * MCELL, 0);
        ctx.lineTo(c * MCELL, MROWS * MCELL);
        ctx.stroke();
      }
      for (let r = 0; r <= MROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * MCELL);
        ctx.lineTo(MW, r * MCELL);
        ctx.stroke();
      }

      for (let r = 0; r < MROWS; r++) {
        for (let c = 0; c < MCOLS; c++) {
          const v = S.grid[r][c];
          if (v === -1) continue;
          const clearing = S.clearing.some((cl) => cl.row === r);
          ctx.fillStyle = clearing && Math.floor(S.time * 12) % 2 === 0 ? "#ffffff" : FLAVOR_CSS[v];
          ctx.fillRect(c * MCELL + 2, r * MCELL + 2, MCELL - 4, MCELL - 4);
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.fillRect(c * MCELL + 2, r * MCELL + 2, MCELL - 4, 6);
        }
      }

      if (S.piece) {
        for (const cell of S.piece.cells) {
          const y = cell.r * MCELL + S.piece.dy;
          ctx.fillStyle = FLAVOR_CSS[S.piece.color];
          ctx.fillRect(cell.c * MCELL + 2, y + 2, MCELL - 4, MCELL - 4);
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fillRect(cell.c * MCELL + 2, y + 2, MCELL - 4, 6);
        }
      }

      ctx.fillStyle = "rgba(77,255,166,0.06)";
      ctx.fillRect(0, 420, MW, MH - 420);
      ctx.fillStyle = "#4dffa6";
      ctx.fillRect(S.paddleX, 486, S.paddleW, 12);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(S.paddleX, 486, S.paddleW, 4);

      ctx.fillStyle = "rgba(255,201,77,0.25)";
      ctx.beginPath();
      ctx.arc(b.x - b.vx * 1.2, b.y - b.vy * 1.2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffc94d";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
      ctx.fill();

      for (const p of S.particles) {
        ctx.globalAlpha = Math.max(0, p.life / 0.6);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#efe6d8";
      ctx.font = "bold 20px 'VT323', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`PUNTI ${S.score}`, 8, MH - 8);
      ctx.textAlign = "right";
      ctx.fillText(`VITE ${"●".repeat(Math.max(0, S.lives))}`, MW - 8, MH - 8);

      if (S.over) {
        ctx.fillStyle = "rgba(5,2,10,0.75)";
        ctx.fillRect(0, 0, MW, MH);
        ctx.fillStyle = "#ff2e5f";
        ctx.font = "bold 40px 'Grenze Gotisch', serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", MW / 2, MH / 2 - 10);
        ctx.fillStyle = "#efe6d8";
        ctx.font = "bold 22px 'VT323', monospace";
        ctx.fillText(`HAI FATTO ${S.score} PUNTI`, MW / 2, MH / 2 + 26);
      }
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!S.over) step(dt);
      draw();
      if (S.over) {
        window.setTimeout(() => onExitRef.current(S.score), 900);
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const kd = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") S.keys.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") S.keys.right = true;
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") S.keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") S.keys.right = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    resetBall();
    spawnPiece();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", maxWidth: 380, touchAction: "none" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * MW;
        stateRef.current.paddleTarget = Math.max(0, Math.min(MW - stateRef.current.paddleW, x - stateRef.current.paddleW / 2));
      }}
      onTouchMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * MW;
        stateRef.current.paddleTarget = Math.max(0, Math.min(MW - stateRef.current.paddleW, x - stateRef.current.paddleW / 2));
      }}
    />
  );
}

/* ================================================================
   APP
   ================================================================ */
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
  const [briciole, setBriciole] = useState<number>(START_BRICIOLE);
  const [morenini, setMorenini] = useState<Record<FlavorId, number>>({ ...START_MORENINI });
  const [flags, setFlags] = useState<Flags>(initialFlags);
  const [zone, setZone] = useState<ZoneDef | null>(null);
  const [nearId, setNearId] = useState<string | null>(null);
  const [bt, setBt] = useState<BattleState | null>(null);
  const [offerMode, setOfferMode] = useState(false);
  const [switchMode, setSwitchMode] = useState(false);
  const [dlgLines, setDlgLines] = useState<DialogueLine[]>([]);
  const [dlgChoice, setDlgChoice] = useState<((i: number) => void) | null>(null);
  const [banner, setBanner] = useState<{ kicker: string; title: string; boss: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ kind: "red" | "gold"; key: number } | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [hug, setHug] = useState<{ progress: number; running: boolean; done: boolean }>({ progress: 0, running: false, done: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<"formazione" | "stato" | "zaino">("formazione");
  const [menuSel, setMenuSel] = useState(0);
  const [useItemId, setUseItemId] = useState<string | null>(null);
  const [partyReleaseArm, setPartyReleaseArm] = useState<number | null>(null);
  const [pcOpen, setPcOpen] = useState(false);
  const [pcSel, setPcSel] = useState<PcSel>(null);
  const [pcReleaseArm, setPcReleaseArm] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [arcadePlaying, setArcadePlaying] = useState(false);
  const [arcadeResult, setArcadeResult] = useState<{ score: number; morenini: number; briciole: number } | null>(null);
  const [slotPanel, setSlotPanel] = useState<null | "save" | "load">(null);
  const [confirmSlot, setConfirmSlot] = useState<number | null>(null);
  const [slotTick, setSlotTick] = useState(0);
  const [inertiaNotice, setInertiaNotice] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  const phaseRef = useRef<Phase>("title");
  const pausedRef = useRef(false);
  const flagsRef = useRef<Flags>(initialFlags);
  const partyRef = useRef<PartyMon[]>([]);
  const activeIdxRef = useRef(0);
  const itemsRef = useRef<string[]>([]);
  const consumablesRef = useRef<Record<string, number>>({ ...START_CONSUMABLES });
  const capturedRef = useRef<string[]>([]);
  const pcRef = useRef<PartyMon[]>([]);
  const bricioleRef = useRef<number>(START_BRICIOLE);
  const moreniniRef = useRef<Record<FlavorId, number>>({ ...START_MORENINI });
  const btRef = useRef<BattleState | null>(null);
  const menuOpenRef = useRef(false);
  const afterDlgRef = useRef<(() => void) | null>(null);
  const logIdRef = useRef(0);
  const bannerTRef = useRef<number | null>(null);
  const toastTRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const hugHeldRef = useRef(false);
  const hugDoneRef = useRef(false);
  const koRef = useRef(false);
  const gameStartedRef = useRef(false);

  /* ---------------- sincronizzazioni ref ---------------- */
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { flagsRef.current = flags; }, [flags]);
  useEffect(() => { partyRef.current = party; }, [party]);
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { consumablesRef.current = consumables; }, [consumables]);
  useEffect(() => { capturedRef.current = capturedSpecies; }, [capturedSpecies]);
  useEffect(() => { pcRef.current = pc; }, [pc]);
  useEffect(() => { bricioleRef.current = briciole; }, [briciole]);
  useEffect(() => { moreniniRef.current = morenini; }, [morenini]);
  useEffect(() => { menuOpenRef.current = menuOpen; }, [menuOpen]);
  useEffect(() => { btRef.current = bt; }, [bt]);

  useEffect(() => {
    setHasSave(readSave() !== null);
  }, []);

  /* autosave */
  useEffect(() => {
    if (!gameStartedRef.current) return;
    const pos = engineRef.current?.getPlayerPos() ?? { x: 0, z: 9 };
    writeSave({ flags, party, items, consumables, capturedSpecies, pc, briciole, morenini, score, activeIdx, pos, savedAt: Date.now() });
  }, [flags, party, items, consumables, capturedSpecies, pc, briciole, morenini, score, activeIdx]);

  /* ---------------- helpers ---------------- */
  const hasItem = (id: string) => itemsRef.current.includes(id);

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

  const doFlash = (kind: "red" | "gold") => setFlash({ kind, key: Date.now() });

  const addScore = (n: number) => setScore((s) => s + n);

  const say = (key: string, after?: () => void) => {
    const lines = SCRIPTS[key];
    if (!lines) {
      after?.();
      return;
    }
    sayLines(lines, after);
  };

  const sayLines = (lines: DialogueLine[], after?: () => void) => {
    setDlgLines(lines);
    setDlgChoice(null);
    afterDlgRef.current = () => {
      setPhase((prev) => (prev === "dialogue" ? "world" : prev));
      after?.();
    };
    setPhase("dialogue");
  };

  const questText = () => questTextFor(flagsRef.current, new Set(capturedRef.current).size);

  /* ---------------- economia ---------------- */
  const addBriciole = (n: number) => setBriciole((v) => Math.max(0, v + n));

  const addMorenini = (flavor: FlavorId, n: number) =>
    setMorenini((m) => ({ ...m, [flavor]: Math.max(0, (m[flavor] ?? 0) + n) }));

  const spendMorenino = (flavor: FlavorId): boolean => {
    const have = moreniniRef.current[flavor] ?? 0;
    if (have <= 0) return false;
    setMorenini((m) => ({ ...m, [flavor]: Math.max(0, (m[flavor] ?? 0) - 1) }));
    return true;
  };

  const buyMorenino = (flavor: FlavorId) => {
    const price = MORENINI_PRICES[flavor];
    if (bricioleRef.current < price) {
      showToast(`TI SERVONO ${price} BRICIOLE. VINCINE ALLA SALA GIOCHI!`);
      sfx.wrong();
      return;
    }
    addBriciole(-price);
    addMorenini(flavor, 1);
    sfx.correct();
    showToast(`MORENINO AL ${FLAVORS[flavor].name} ACQUISTATO (-${price})`);
  };

  const buyConsumable = (id: string, price: number) => {
    if (bricioleRef.current < price) {
      showToast(`TI SERVONO ${price} BRICIOLE.`);
      sfx.wrong();
      return;
    }
    addBriciole(-price);
    grantConsumable(id);
    sfx.correct();
    showToast(`${CONSUMABLES[id].name} ACQUISTATO (-${price})`);
  };

  const grantConsumable = (id: string, n = 1) => {
    setConsumables((c) => ({ ...c, [id]: (c[id] ?? 0) + n }));
  };

  const addItem = (id: string) => {
    if (!itemsRef.current.includes(id)) {
      setItems((it) => [...it, id]);
      showToast(`OGGETTO CHIAVE: ${ITEMS[id].name}`);
    }
  };

  const markCaptured = (spId: string) => {
    setCapturedSpecies((c) => (c.includes(spId) ? c : [...c, spId]));
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

  /* ---------------- salvataggi ---------------- */
  const currentSnapshot = (): SaveData => ({
    flags,
    party,
    items,
    consumables,
    capturedSpecies,
    pc,
    briciole,
    morenini,
    score,
    activeIdx,
    pos: engineRef.current?.getPlayerPos() ?? { x: 0, z: 9 },
    savedAt: Date.now(),
  });

  const saveToSlot = (n: number) => {
    const existing = readSlot(n);
    if (existing && confirmSlot !== n) {
      setConfirmSlot(n);
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

  const loadFromAutosave = () => {
    const save = readSave();
    if (!save) return;
    setSlotPanel(null);
    applySave(save, "AUTOSAVE CARICATO", "LA PROFEZIA RIPRENDE");
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

  /* ---------------- avvio / caricamento ---------------- */
  const applySave = (save: SaveData, kicker: string, title: string) => {
    sfx.unlock();
    sfx.start();
    gameStartedRef.current = true;

    /* CURA AD INERZIA: 1 HP/minuto dall'ultimo salvataggio;
       dopo 60 minuti i Moreni al tappeto rinascono con 1 HP e riprendono a curarsi. */
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
    setBriciole(save.briciole ?? START_BRICIOLE);
    setMorenini(save.morenini ?? { ...START_MORENINI });
    setShopOpen(false);
    setGameOpen(false);
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
    setBriciole(START_BRICIOLE);
    setMorenini({ ...START_MORENINI });
    setShopOpen(false);
    setGameOpen(false);
    setActiveIdx(0);
    setBt(null);
    setMenuOpen(false);
    engineRef.current?.companionFollow(false);
    engineRef.current?.setPortalOpen(false);
    engineRef.current?.setSwordVisible(true);
    engineRef.current?.enterWorld(0, 9);
    say("prologue", () => {
      setPhase("starter");
    });
  };

  const continueGame = () => {
    const save = readSave();
    if (!save) {
      startGame();
      return;
    }
    applySave(save, "AUTOSAVE", "BENTORNATO, EVOCATORE");
  };

  const backToTitle = () => {
    setPaused(false);
    pausedRef.current = false;
    engineRef.current?.setPaused(false);
    engineRef.current?.attractMode(true);
    setPhase("title");
    setHasSave(readSave() !== null);
  };

  /* ---------------- motore ---------------- */
  useEffect(() => {
    const eng = new MoreniEngine(mountRef.current!);
    engineRef.current = eng;
    eng.onEncounter = (spId, diff) => {
      if (phaseRef.current !== "world") return;
      startWildBattle(spId, diff);
    };
    eng.onPortal = () => {
      if (phaseRef.current !== "world") return;
      startFinale();
    };
    eng.onZone = (id) => {
      const z = ZONES.find((zz) => zz.id === id) ?? null;
      setZone(z);
      if (z && z.id !== "morenopoli") showBanner("NUOVA ZONA", z.name, false);
    };
    eng.onNear = (id) => setNearId(id);
    eng.start();
    return () => {
      eng.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.attractMode(!(phase === "world" || phase === "battle"));
  }, [phase]);

  /* ---------------- input movimento ---------------- */
  useEffect(() => {
    const iv = window.setInterval(() => {
      if (phaseRef.current !== "world" || pausedRef.current || menuOpenRef.current) {
        engineRef.current?.setInput(0, 0);
        return;
      }
      const k = keysRef.current;
      let x = 0;
      let z = 0;
      if (k["w"] || k["arrowup"]) z -= 1;
      if (k["s"] || k["arrowdown"]) z += 1;
      if (k["a"] || k["arrowleft"]) x -= 1;
      if (k["d"] || k["arrowright"]) x += 1;
      engineRef.current?.setInput(x, z);
    }, 33);
    return () => window.clearInterval(iv);
  }, []);

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
        if (shopOpen) { closeShop(); return; }
        if (gameOpen) { closeArcade(); return; }
        if (menuOpenRef.current) closeMenu();
        else if (pcOpen) closePc();
        else if (phaseRef.current === "world" || phaseRef.current === "battle") togglePause();
        return;
      }
      if (k === "e" && phaseRef.current === "world" && !pcOpen && !shopOpen && !gameOpen) {
        const near = engineRef.current?.getNearId();
        if (near) interact(near);
        return;
      }
      if (phaseRef.current === "title" && (k === "enter" || k === " ")) {
        if (readSave()) continueGame();
        else startGame();
        return;
      }
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
  }, [offerMode, pcOpen, shopOpen, gameOpen, arcadePlaying]);

  /* ---------------- battaglie ---------------- */
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

  const displayName = (b: BattleState) => b.enemyName ?? speciesById(b.enemyId).name;

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
      diff,
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
    sfx.appear();
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
      diff: 0,
      log: [{ id: ++logIdRef.current, text: `${speciesById(spId).name} TI BARRA LA STRADA!`, kind: "bad" }],
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
  };

  const activeAtk = () => {
    const mon = partyRef.current[activeIdxRef.current];
    if (!mon) return 8;
    let atk = mon.atk;
    if (hasItem("spilla")) atk = Math.round(atk * 1.25);
    return atk;
  };

  const playerAttack = () => {
    const b = btRef.current;
    if (!b || b.busy || phaseRef.current !== "battle") return;
    setOfferMode(false);
    setSwitchMode(false);
    patchBt({ busy: true });
    engineRef.current?.battleAttack("player", () => {
      const cur = btRef.current;
      if (!cur) return;
      let dmg = activeAtk() + Math.floor(Math.random() * 5);
      let crit = false;
      if (hasItem("fiala") && Math.random() < 0.15) {
        dmg *= 2;
        crit = true;
      }
      const newHp = Math.max(0, cur.enemyHp - dmg);
      sfx.correct();
      doFlash("gold");
      bLog(`${crit ? "COLPO OMEOPATICO! " : ""}Infliggi ${dmg} danni a ${displayName(cur)}.`, crit ? "good" : "info");
      patchBt({ enemyHp: newHp, busy: false });
      if (newHp <= 0) {
        onEnemyDefeated();
        return;
      }
      // Maiale del Mondo: cutscene di purificazione a metà vita
      if (cur.enemyId === "maialedelmondo" && !cur.midPlayed && newHp <= cur.enemyMaxHp / 2) {
        patchBt({ midPlayed: true, busy: true });
        window.setTimeout(() => {
          sayLines(SCRIPTS.maiale_mid, () => {
            engineRef.current?.battlePurify(speciesById("nonnopurificato"), () => {
              patchBt({ enemyId: "nonnopurificato", enemyName: null, busy: false, convinced: false });
              sfx.recruit();
            });
          });
        }, 600);
        return;
      }
      window.setTimeout(() => enemyTurn(), 550);
    });
  };

  const enemyTurn = () => {
    const b = btRef.current;
    if (!b || phaseRef.current !== "battle") return;
    patchBt({ busy: true });
    engineRef.current?.battleAttack("enemy", () => {
      const cur = btRef.current;
      if (!cur) return;
      const mon = partyRef.current[activeIdxRef.current];
      if (!mon) return;
      const dmg = Math.max(1, cur.enemyAtk + Math.floor(Math.random() * 4) - 2);
      const newHp = Math.max(0, mon.hp - dmg);
      const healed = partyRef.current.map((m, i) => (i === activeIdxRef.current ? { ...m, hp: newHp } : m));
      partyRef.current = healed;
      setParty(healed);
      sfx.wrong();
      doFlash("red");
      engineRef.current?.shake(0.35);
      bLog(`${displayName(cur)} ti colpisce: ${dmg} danni a ${monName(mon)}!`, "bad");
      if (newHp <= 0) {
        koRef.current = true;
        engineRef.current?.battleFaint("player", () => {
          const alive = partyRef.current.findIndex((m) => m.hp > 0);
          if (alive >= 0) {
            setActiveIdx(alive);
            activeIdxRef.current = alive;
            engineRef.current?.setActiveSpecies(speciesById(partyRef.current[alive].spId));
            bLog(`VAI, ${monName(partyRef.current[alive])}!`, "info");
            window.setTimeout(() => patchBt({ busy: false }), 500);
          } else {
            wipe();
          }
        });
        return;
      }
      window.setTimeout(() => patchBt({ busy: false }), 400);
    });
  };

  const offerMorenino = (flavor: FlavorId) => {
    const b = btRef.current;
    if (!b || b.busy || phaseRef.current !== "battle") return;
    if ((moreniniRef.current[flavor] ?? 0) <= 0) {
      bLog(`NON HAI PIÙ MORENINI AL ${FLAVORS[flavor].name}! COMPRALI AL FORNO O VINCILI ALLA SALA GIOCHI.`, "bad");
      sfx.wrong();
      return;
    }
    spendMorenino(flavor);
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
      const cur = btRef.current;
      if (!cur) return;
      if (success) {
        sfx.recruit();
        doFlash("gold");
        addScore(150);
        if (cur.cinghia) {
          finishCinghia();
          return;
        }
        const capId = cur.enemyId;
        const capName = displayName(cur);
        const newMon = makeMon(capId, cur.enemyName ?? undefined);
        markCaptured(capId);
        if (partyRef.current.length < 8) {
          const newParty = [...partyRef.current, newMon];
          partyRef.current = newParty;
          setParty(newParty);
          showToast(`${capName} SI È UNITO AL PARTY!`);
        } else if (pcRef.current.length < PC_CAP) {
          const newPc = [...pcRef.current, newMon];
          pcRef.current = newPc;
          setPc(newPc);
          showToast(`PARTY PIENO: ${capName} È STATO TRASFERITO AL PC DI MICA RIZZI`);
        } else {
          addScore(75);
          showToast(`PARTY E PC PIENI: ${capName} TI SALUTA DA LONTANO (+75)`);
        }
        bLog(`${capName} È CONVINTO: AMICIZIA!`, "good");
        window.setTimeout(() => {
          engineRef.current?.endBattle();
          setBt(null);
          setPhase("world");
          maybeInertiaNotice();
        }, 700);
      } else {
        sfx.wrong();
        bLog(`${displayName(cur)} HA ANCORA LE BRICIOLE STORTE. RIPROVA O COMBATTI!`, "bad");
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
      bLog("FUGA FALLITA! IL MORENO TI RIDE DIETRO.", "bad");
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
    if (b.male && b.enemyId === "maialedelmondo") return;
    if (b.male && b.enemyId === "maledelmondo") {
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
    // fine Maiale purificato → finale
    if (b.enemyId === "nonnopurificato") {
      finishFinale();
      return;
    }
    sfx.victory();
    addScore(b.boss ? 200 : 100);
    const bric = battleBriciole(b.diff, b.boss);
    addBriciole(bric);
    bLog(`${displayName(b)} È AL TAPPETO! +${b.boss ? 200 : 100} CARISMA, +${bric} BRICIOLE`, "good");
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

  /* ---------------- quest: spada / clomp / finale ---------------- */
  const startFinale = () => {
    sayLines(SCRIPTS.antro_intro, () => {
      startScriptedBattle("maialedelmondo", { boss: true, male: true });
    });
  };

  const finishFinale = () => {
    addScore(1000);
    setFlags((fl) => ({ ...fl, finaleDone: true }));
    sfx.victory();
    engineRef.current?.endBattle();
    setBt(null);
    sayLines(SCRIPTS.finale, () => {
      deleteSaveKey(SAVE_KEY);
      setPhase("victory");
    });
  };

  /* ---------------- interazioni ---------------- */
  const interact = (id: string) => {
    const f = flagsRef.current;
    sfx.click();
    if (id === "forno") {
      setShopOpen(true);
      engineRef.current?.setPaused(true);
      return;
    }
    if (id === "arcade") {
      setGameOpen(true);
      engineRef.current?.setPaused(true);
      return;
    }
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
        bLogFallback("Il piedistallo è vuoto. La spada è con Clomp.");
        return;
      }
      const count = new Set(capturedRef.current).size;
      if (count >= SWORD_REQ) {
        setFlags((fl) => ({ ...fl, swordPulled: true }));
        engineRef.current?.pullSwordFx(() => {
          sfx.recruit();
          doFlash("gold");
          engineRef.current?.awakenClompFx(() => {
            engineRef.current?.setPortalOpen(true);
            sayLines(SCRIPTS.sword_pull);
          });
        });
      } else {
        sayLines(SCRIPTS.sword_fail);
      }
      return;
    }
    if (id === "clomp") {
      if (f.swordPulled && !f.clompAwake) {
        setFlags((fl) => ({ ...fl, clompAwake: true }));
        engineRef.current?.companionFollow(true);
        sfx.recruit();
        bLogFallback("Clomp: «La spada mi ha svegliato del tutto. Vengo con te: al Maiale penso io.»");
      } else if (!f.clompAwake) {
        bLogFallback("Clomp dorme. «Z z z... la spada... z z z...»");
      } else {
        bLogFallback("Clomp: «Il portale freme. Andiamo, evocatore.»");
      }
      return;
    }
    if (id === "cinghia") {
      if (!f.cinghiaBeaten) {
        say("cinghia_pre", () => {
          startScriptedBattle("cinghiaale", { boss: true, cinghia: true });
        });
      } else {
        bLogFallback("Cinghia Ale: «GRUF. La tribù grufola serena, grazie a te.»");
      }
      return;
    }
    if (id === "mico") {
      if (!f.micoDone) {
        say("mico1", () => {
          setQuizIdx(0);
          setHearts(3);
          setPhase("quiz");
        });
      } else {
        bLogFallback("Mico Nosca: «La rivoluzione procede. Un abbraccio ideologico alla volta.»");
      }
      return;
    }
    if (id === "coizio") {
      if (!f.coizioDone) {
        say("coizio1", () => {
          hugDoneRef.current = false;
          setHug({ progress: 0, running: true, done: false });
          setPhase("hug");
        });
      } else {
        bLogFallback("Coizio: «oh. sei tornato. ti abbraccio con gli occhi.»");
      }
      return;
    }
    if (id === "gino") {
      if (!f.ginoDone) {
        say("gino1", () => {
          startScriptedBattle("maledelmondo", { boss: true, male: true });
        });
      } else {
        bLogFallback("Gino Satri: «...ora bevo solo camomilla. il male è in cantina, tappato.»");
      }
      return;
    }
  };

  const bLogFallback = (text: string) => {
    showToast(text);
  };

  /* ---------------- quiz di Mico ---------------- */
  const answerQuiz = (choice: number) => {
    sfx.click();
    if (choice === TRIAL_QUIZ.answers[quizIdx]) {
      sfx.correct();
      if (quizIdx + 1 >= TRIAL_QUIZ.scripts.length) {
        setPhase("world");
        sayLines(SCRIPTS.mico_win, () => {
          addItem("spilla");
          addScore(200);
          setFlags((fl) => ({ ...fl, micoDone: true }));
        });
      } else {
        setQuizIdx(quizIdx + 1);
      }
    } else {
      sfx.wrong();
      doFlash("red");
      setHearts((h) => h - 1);
      if (hearts - 1 <= 0) {
        setPhase("world");
        sayLines(SCRIPTS.mico_fail);
      } else {
        showToast(`RISPOSTA SBAGLIATA! CUORI RIMASTI: ${hearts - 1}`);
      }
    }
  };

  /* ---------------- abbraccio di Coizio ---------------- */
  useEffect(() => {
    if (phase !== "hug") return;
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
        if (!h.running || h.done) return h;
        const next = Math.max(0, Math.min(100, h.progress + (hugHeldRef.current ? 2.4 : -1.4)));
        if (next >= 100 && !h.done && !hugDoneRef.current) {
          hugDoneRef.current = true;
          hugHeldRef.current = false;
          window.setTimeout(() => finishHug(), 350);
          return { ...h, progress: 100, done: true };
        }
        return { ...h, progress: next };
      });
    }, 80);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finishHug = () => {
    sfx.recruit();
    doFlash("gold");
    setPhase("world");
    sayLines(SCRIPTS.coizio_win, () => {
      addItem("abbraccio");
      addScore(200);
      setFlags((fl) => ({ ...fl, coizioDone: true }));
    });
  };

  /* ---------------- pausa ---------------- */
  const togglePause = () => {
    if (menuOpenRef.current) return;
    if (gameOpen || shopOpen || pcOpen) return;
    sfx.pause();
    setPaused((p) => {
      const np = !p;
      pausedRef.current = np;
      engineRef.current?.setPaused(np);
      return np;
    });
  };

  /* ---------------- menu di gioco RPG ---------------- */
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
        showToast("È AL TAPPETO: SERVE IL CAFFÈ DEMONIACO.");
        sfx.wrong();
        return;
      } else if (mon.hp >= mon.maxHp) {
        showToast("È GIÀ SAZIO DI HP. NON SPRECHIAMO MORENINI.");
        sfx.wrong();
        return;
      }
      const newHp = def.revive
        ? Math.round(mon.maxHp * 0.5)
        : def.fullHeal
        ? mon.maxHp
        : Math.min(mon.maxHp, mon.hp + def.heal);
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
    if (i < activeIdxRef.current) activeIdxRef.current -= 1;
    else if (i === activeIdxRef.current) activeIdxRef.current = 0;
    fixActiveIdx(newParty);
    sfx.wrong();
    showToast(`${monName(mon)} CORRE LIBERO VERSO IL TRAMONTO.`);
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
      showToast("NON PUOI DEPOSITARE L'UNICO MORENO.");
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

  const releaseFromPc = (pcIdx: number) => {
    if (partyRef.current.length === 0) {
      showToast("IL PC PROTEGGE GLI ULTIMI MORENI.");
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

  /* ---------------- Forno & Sala Giochi ---------------- */
  const closeShop = () => {
    sfx.click();
    setShopOpen(false);
    engineRef.current?.setPaused(pausedRef.current);
  };

  const closeArcade = () => {
    sfx.click();
    setGameOpen(false);
    setArcadePlaying(false);
    setArcadeResult(null);
    engineRef.current?.setPaused(pausedRef.current);
  };

  const startArcade = () => {
    if (bricioleRef.current < MINIGAME.entry) {
      showToast(`TI SERVONO ${MINIGAME.entry} BRICIOLE PER ENTRARE.`);
      sfx.wrong();
      return;
    }
    addBriciole(-MINIGAME.entry);
    sfx.appear();
    setArcadeResult(null);
    setArcadePlaying(true);
  };

  const collectArcade = (score: number) => {
    const won = Math.floor(score / MINIGAME.pointsPerMorenino);
    const bric = Math.floor(score * MINIGAME.briciolePerPunto);
    setArcadePlaying(false);
    for (let i = 0; i < won; i++) {
      addMorenini(pick(FLAVOR_LIST), 1);
    }
    addBriciole(bric);
    sfx.victory();
    setArcadeResult({ score, morenini: won, briciole: bric });
  };

  /* ---------------- notifica d'inerzia ---------------- */
  const maybeInertiaNotice = (delay = 600) => {
    if (!koRef.current) return;
    koRef.current = false;
    window.setTimeout(() => setInertiaNotice(true), delay);
  };

  /* ================================================================
     RENDER
     ================================================================ */
  const enemySp = bt ? speciesById(bt.enemyId) : null;
  const activeMon = party[activeIdx];
  const activeSp = activeMon ? speciesById(activeMon.spId) : null;
  const quest = questTextFor(flags, new Set(capturedSpecies).size);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-void font-term text-bone">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="vignette pointer-events-none absolute inset-0 z-[5]" />
      <div className="scanlines crt-flicker pointer-events-none absolute inset-0 z-[40] opacity-70" />
      {bt?.boss && phase === "battle" && <div className="boss-vignette" />}

      {flash && (
        <div key={flash.key} className={`pointer-events-none absolute inset-0 z-[35] ${flash.kind === "red" ? "flash-red" : "flash-gold"}`} />
      )}

      {toast && <div className="perk-toast">{toast}</div>}

      {banner && (
        <div className="banner-root">
          <div className="banner-inner">
            <div className={`banner-kicker ${banner.boss ? "boss" : ""}`}>{banner.kicker}</div>
            <div className="banner-title">{banner.title}</div>
            <div className="banner-rule" />
          </div>
        </div>
      )}

      {/* ================================ TITOLO ================================ */}
      {phase === "title" && (
        <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(11,6,20,0.55),rgba(11,6,20,0.93))] overflow-y-auto py-6">
          <div className="text-toxic tracking-[0.5em] text-sm md:text-base mb-2 title-float">✠ COMP-OS v6.66 PRESENTA ✠</div>
          <h1 className="font-display text-[12vw] md:text-[6.5rem] leading-[0.85] font-extrabold text-center text-bone text-outline pulse-glow">
            SHIN MORENI
            <br />
            <span className="text-blood">TENSEI</span>
          </h1>
          <p className="mt-3 text-gold tracking-[0.25em] text-lg md:text-2xl font-display">L'EPICA DEL MAIALE DEL MONDO</p>
          <p className="mt-1 text-dim text-base md:text-lg max-w-xl text-center px-4">
            Un RPG demenziale: esplora Morenopoli, combatti a turni, compra morenini al Forno, vincili al Morenopong. E salva il Nonno.
          </p>

          <div className="mt-6 flex flex-col gap-3 w-[min(420px,90vw)]">
            {hasSave && (
              <button
                onClick={continueGame}
                className="btn-hard px-10 py-4 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-2xl md:text-3xl tracking-widest"
              >
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
            <button
              onClick={startGame}
              className="btn-hard px-10 py-4 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl md:text-3xl tracking-widest"
            >
              {hasSave ? "✠ NUOVA PROFEZIA" : "▶ INIZIA LA PROFEZIA [INVIO]"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm md:text-base max-w-3xl px-4 w-full">
            <div className="border-2 border-edge bg-panel/80 p-3">
              <div className="text-toxic font-display text-lg mb-1">COME SI GIOCA</div>
              <ul className="text-dim space-y-0.5">
                <li>→ WASD per esplorare · E per interagire</li>
                <li>→ In battaglia: ATTACCA, OFFRI il morenino giusto, poi CATTURA</li>
                <li>→ I morenini SI COMPRANO al Forno o si vincono al Morenopong</li>
                <li>→ Lontano dallo schermo i Moreni guariscono: 1 HP/minuto</li>
              </ul>
            </div>
            <div className="border-2 border-edge bg-panel/80 p-3">
              <div className="text-toxic font-display text-lg mb-1">COMANDI</div>
              <ul className="text-dim space-y-0.5">
                <li><span className="text-bone">WASD/FRECCE</span> muoviti · <span className="text-bone">E</span> interagisci</li>
                <li><span className="text-bone">1-4</span> offri gusto · <span className="text-bone">TAB</span> menu Moreni</li>
                <li><span className="text-bone">P/ESC</span> pausa · <span className="text-bone">M</span> audio</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-dim text-xs tracking-widest">AUDIO CONSIGLIATO — I MORENI URLANO IN 8-BIT</div>
        </div>
      )}

      {/* ================================ SCELTA STARTER ================================ */}
      {phase === "starter" && (
        <div className="absolute inset-0 z-[25] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(11,6,20,0.6),rgba(11,6,20,0.9))] px-4">
          <div className="font-display text-4xl md:text-5xl text-gold text-outline mb-1 text-center">DON MORENO TI OFFRE UN COMPAGNO</div>
          <div className="text-dim mb-6 text-center">«Scegline uno. Gli altri due faranno finta di non essere offesi.»</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            {["morenozzo", "morenello", "morenilla"].map((id) => {
              const s = speciesById(id);
              return (
                <button
                  key={id}
                  onClick={() => {
                    sfx.recruit();
                    doFlash("gold");
                    const mon = makeMon(id, generateMorenoName());
                    const p = [mon];
                    partyRef.current = p;
                    setParty(p);
                    markCaptured(id);
                    setActiveIdx(0);
                    activeIdxRef.current = 0;
                    setPhase("world");
                    showBanner("INIZIO", `BENVENUTO, ${mon.name}`, false);
                    showToast(`${mon.name} (${s.name}) È IL TUO PRIMO MORENO!`);
                  }}
                  className="roster-card btn-hard py-5"
                  style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties}
                >
                  <MorenoFace sp={s} size={90} />
                  <div className="font-display text-2xl mt-2" style={{ color: hexCss(s.accentColor) }}>{s.name}</div>
                  <div className="text-dim text-sm">{s.title}</div>
                  <div className="text-bone text-sm mt-1">HP {s.baseHp} · ATK {s.baseAtk}</div>
                  <div className="text-gold text-xs mt-1">GUSTO: {FLAVORS[s.favorite].name}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================ DIALOGO ================================ */}
      {phase === "dialogue" && (
        <DialogueBox lines={dlgLines} onChoice={dlgChoice ?? undefined} onDone={() => afterDlgRef.current?.()} />
      )}

      {/* ================================ HUD MONDO ================================ */}
      {(phase === "world" || phase === "battle") && (
        <>
          <div className="absolute top-3 left-3 z-[15] pointer-events-none max-w-[420px]">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2">
              <div className="text-toxic text-xs tracking-[0.3em]">COMP-OS v6.66 {zone ? `// ${zone.name}` : ""}</div>
              <div className="text-gold text-lg leading-tight">🎯 {quest}</div>
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-bone">CARISMA <span className="text-gold tabular-nums">{score}</span></span>
                <span className="text-bone">🍪 <span className="text-gold tabular-nums">{briciole}</span></span>
                <span className="text-bone">AMICI <span className="text-toxic tabular-nums">{new Set(capturedSpecies).size}</span></span>
              </div>
              {zone && <div className="text-dim text-xs mt-0.5 italic">{zone.tagline}</div>}
            </div>
            {phase === "world" && (
              <>
                <button
                  onClick={() => openMenu()}
                  className="btn-hard mt-2 border-2 border-toxic bg-panel/90 px-3 py-1.5 text-toxic font-display text-lg tracking-widest pointer-events-auto"
                >
                  ☰ MENU MORENI [TAB]
                </button>
                <div className="border-2 border-edge bg-panel/85 px-3 py-1.5 mt-2 text-dim text-xs">
                  WASD MUOVI · E INTERAGISCI · P PAUSA
                </div>
              </>
            )}
          </div>

          {/* mini party */}
          <div className="absolute top-3 right-3 z-[15] flex flex-col items-end gap-2 pointer-events-none">
            <div className="border-2 border-edge bg-panel/85 px-2 py-2">
              <div className="grid grid-cols-4 gap-1.5">
                {party.map((m, i) => {
                  const s = speciesById(m.spId);
                  return (
                    <div key={i} className={`party-slot ${i === activeIdx ? "filled" : ""}`} style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties} title={monName(m)}>
                      <MorenoFace sp={s} size={34} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* prompt E */}
      {phase === "world" && nearId && !paused && !menuOpen && !pcOpen && !shopOpen && !gameOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[15] pointer-events-none">
          <div className="border-2 border-gold bg-panel/90 px-5 py-2 text-gold font-display text-xl tracking-widest pop-in">
            [E]{" "}
            {nearId === "pc"
              ? "USA IL PC DI MICA RIZZI"
              : nearId === "monument"
              ? "ESAMINA IL GRANDE MORENINO"
              : nearId === "forno"
              ? "ENTRA NEL FORNO — COMPRA MORENINI"
              : nearId === "arcade"
              ? "SALA GIOCHI — MORENOPONG"
              : `PARLA CON ${nearId.toUpperCase()}`}
          </div>
        </div>
      )}

      {/* ================================ BATTAGLIA ================================ */}
      {phase === "battle" && bt && enemySp && (
        <>
          {/* pannello nemico */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[15] w-[min(430px,92vw)] pointer-events-none">
            <div className={`border-2 bg-panel/90 px-3 py-2 ${bt.boss ? "border-blood" : "border-edge"}`}>
              <div className="flex items-center gap-2">
                <MorenoFace sp={enemySp} size={34} />
                <div className="flex-1">
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
                {bt.boss && <span className="text-blood font-display text-sm tracking-widest">BOSS</span>}
              </div>
              <HpBar hp={bt.enemyHp} max={bt.enemyMaxHp} w={9999} />
              <div className="text-dim text-xs mt-0.5">
                HP <span className="text-bone tabular-nums">{bt.enemyHp}/{bt.enemyMaxHp}</span>
                {bt.convinced && <span className="text-toxic ml-3">✓ AMMORBIDITO — PUOI CATTURARLO</span>}
              </div>
            </div>
            {/* log */}
            <div className="border-2 border-edge bg-panel/85 px-3 py-1.5 mt-2">
              {bt.log.map((l) => (
                <div key={l.id} className={`text-sm leading-tight truncate ${l.kind === "good" ? "text-toxic" : l.kind === "bad" ? "text-blood" : "text-dim"}`}>
                  &gt; {l.text}
                </div>
              ))}
            </div>
          </div>

          {/* pannello giocatore + comandi */}
          <div className="absolute bottom-3 right-3 z-[15] w-[min(480px,92vw)]">
            {activeMon && activeSp && (
              <div className="border-2 border-toxic bg-panel/90 px-3 py-2 mb-2 flex items-center gap-2">
                <MorenoFace sp={activeSp} size={34} />
                <div className="flex-1">
                  <div className="font-display text-lg leading-none text-bone">{monName(activeMon)} <span className="text-dim text-xs">({activeSp.name})</span></div>
                  <HpBar hp={activeMon.hp} max={activeMon.maxHp} w={220} />
                </div>
                <div className="text-dim text-xs">
                  HP <span className="text-bone tabular-nums">{activeMon.hp}/{activeMon.maxHp}</span>
                  <br />ATK <span className="text-bone tabular-nums">{activeMon.atk}</span>
                </div>
              </div>
            )}
            <div className="border-2 border-edge bg-panel/90 px-3 py-2">
              <div className="min-h-[40px] mb-1.5">
                {offerMode && <div className="text-gold text-sm mb-1.5">OFFRI UN MORENINO A {displayName(bt)} (GUSTO?) [1-4]</div>}
                {switchMode && <div className="text-toxic text-sm mb-1.5">SCEGLI IL MORENO DA SCHIERARE</div>}
              </div>

              {!offerMode && !switchMode && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={playerAttack} disabled={bt.busy} className="btn-hard px-2 py-3 border-2 border-blood bg-[#3d0f1c] text-[#ffd1dd] font-display text-xl tracking-widest">
                    ⚔ ATTACCA
                  </button>
                  <button onClick={() => { setOfferMode(true); sfx.click(); }} disabled={bt.busy} className="btn-hard px-2 py-3 border-2 border-gold bg-[#3a2a10] text-gold font-display text-xl tracking-widest">
                    🍪 OFFRI MORENINO
                  </button>
                  <button onClick={() => { setSwitchMode(true); sfx.click(); }} disabled={bt.busy} className="btn-hard px-2 py-3 border-2 border-toxic bg-[#0f3d2a] text-toxic font-display text-xl tracking-widest">
                    ☰ MORENO
                  </button>
                  <button onClick={tryFlee} disabled={bt.busy} className="btn-hard px-2 py-3 border-2 border-edge bg-panel2 text-dim font-display text-xl tracking-widest">
                    🏃 FUGGI
                  </button>
                </div>
              )}

              {offerMode && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {FLAVOR_LIST.map((f, i) => {
                    const have = morenini[f] ?? 0;
                    return (
                      <button
                        key={f}
                        onClick={() => offerMorenino(f)}
                        disabled={bt.busy || have <= 0}
                        className="btn-hard flex flex-col items-center gap-1 px-1 py-2 border-2 font-display text-sm tracking-wide"
                        style={{ background: FLAVORS[f].cssDark, borderColor: FLAVORS[f].css, color: "#fff6ea", opacity: have <= 0 ? 0.45 : 1 }}
                      >
                        <CookieIcon css={FLAVORS[f].css} size={20} />
                        {FLAVORS[f].name}
                        <span className="text-[10px] font-term">×{have} · [{i + 1}]</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {switchMode && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {party.map((m, i) => {
                    const s = speciesById(m.spId);
                    return (
                      <button
                        key={i}
                        onClick={() => { setSwitchMode(false); setActiveMember(i); }}
                        disabled={m.hp <= 0 || i === activeIdx}
                        className="btn-hard flex flex-col items-center gap-1 px-1 py-2 border-2 border-edge bg-panel2"
                        style={{ opacity: m.hp <= 0 || i === activeIdx ? 0.4 : 1 }}
                      >
                        <MorenoFace sp={s} size={30} />
                        <span className="text-[10px] text-dim truncate w-full text-center">{m.name ?? s.name}</span>
                        <span className="text-[10px] text-bone tabular-nums">{m.hp}/{m.maxHp}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {bt.convinced && !offerMode && !switchMode && (
                <button
                  onClick={tryCapture}
                  disabled={bt.busy}
                  className="btn-hard mt-2 w-full px-2 py-3 border-2 border-gold bg-gold text-[#241503] font-display text-2xl tracking-widest pulse-glow"
                >
                  🤝 CATTURA {displayName(bt)}!
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================================ QUIZ DI MICO ================================ */}
      {phase === "quiz" && (
        <div className="absolute inset-0 z-[30] flex items-center justify-center bg-[rgba(5,2,10,0.85)] p-4">
          <div className="w-full max-w-2xl border-2 border-[#ffe066] bg-panel p-5 pop-in">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-3xl text-[#ffe066]">IL PROCESSO DI MICO NOSCA</div>
              <div className="text-blood text-2xl">{"♥".repeat(Math.max(0, hearts))}{"♡".repeat(Math.max(0, 3 - hearts))}</div>
            </div>
            <div className="text-dim text-sm mb-2">DOMANDA {quizIdx + 1}/3 — LA RIVOLTA TI OSSERVA</div>
            <DialogueBox
              lines={SCRIPTS[TRIAL_QUIZ.scripts[quizIdx]]}
              onChoice={(i) => answerQuiz(i)}
              onDone={() => setPhase("world")}
            />
          </div>
        </div>
      )}

      {/* ================================ ABBRACCIO DI COIZIO ================================ */}
      {phase === "hug" && (
        <div className="absolute inset-0 z-[30] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,79,154,0.15),rgba(5,2,10,0.92))] p-4">
          <div className="hug-heart text-[90px] leading-none">🫂</div>
          <div className="font-display text-4xl text-[#ff7fb2] mt-3">L'ABBRACCIO ETERNO</div>
          <div className="text-dim mb-4">TIENI PREMUTO <span className="text-bone">SPAZIO</span> PER RIEMPIRE IL CUORE</div>
          <div className="w-[min(420px,85vw)] h-6 border-2 border-[#ff4f9a] bg-[#120a20] overflow-hidden">
            <div className="hug-meter-fill h-full" style={{ width: `${hug.progress}%` }} />
          </div>
          <div className="text-bone text-xl mt-2 tabular-nums">{Math.floor(hug.progress)}%</div>
          {hug.done && <div className="text-toxic font-display text-2xl mt-3 pop-in">IL CUORE È PIENO. COIZIO PIANGE DI GIOIA.</div>}
        </div>
      )}

      {/* ================================ PAUSA ================================ */}
      {paused && (phase === "world" || phase === "battle") && (
        <div className="absolute inset-0 z-[45] grid place-items-center bg-[rgba(5,2,10,0.82)]">
          <div className="border-2 border-toxic bg-panel px-10 py-8 text-center shadow-[0_0_40px_rgba(77,255,166,0.25)] w-[min(480px,92vw)]">
            <div className="font-display text-5xl text-toxic mb-1">PAUSA</div>
            <div className="text-dim mb-5">I MORENI ASPETTANO. MALVOLENTI.</div>
            <button onClick={togglePause} className="btn-hard block w-full px-8 py-3 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-2xl tracking-widest mb-3">
              RIPRENDI [P]
            </button>
            <button
              onClick={() => { sfx.click(); setPaused(false); pausedRef.current = false; openMenu(); }}
              className="btn-hard block w-full px-8 py-2.5 bg-[#7a5fd0] border-2 border-[#cfc3ff] text-[#f4f0ff] font-display text-xl tracking-widest mb-3"
            >
              ☰ MENU GIOCO — FORMAZIONE / STATO / ZAINO
            </button>
            <button
              onClick={() => { sfx.click(); setSlotPanel("save"); setConfirmSlot(null); }}
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

      {/* ================================ MENU DI GIOCO RPG ================================ */}
      {menuOpen && (
        <div className="absolute inset-0 z-[48] flex items-center justify-center bg-[rgba(5,2,10,0.85)] p-3">
          <div className="w-full max-w-4xl h-[min(640px,92vh)] flex flex-col border-2 border-toxic bg-panel shadow-[0_0_60px_rgba(77,255,166,0.18)]">
            <div className="flex items-center gap-2 border-b-2 border-edge px-4 py-2.5">
              <div className="font-display text-2xl text-toxic tracking-widest mr-2">MENU MORENI</div>
              {(["formazione", "stato", "zaino"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { sfx.click(); setMenuTab(t); setUseItemId(null); }}
                  className={`btn-hard px-4 py-1.5 border-2 font-display text-lg tracking-widest uppercase ${
                    menuTab === t ? "bg-toxic border-[#d8fff0] text-[#04150c]" : "bg-panel2 border-edge text-dim"
                  }`}
                >
                  {t}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={closeMenu} className="btn-hard px-3 py-1.5 bg-panel2 border-2 border-edge text-dim font-display text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
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
                          onKeyDown={(e) => { if (e.key === "Enter" && m.hp > 0) setActiveMember(i); }}
                          className={`btn-hard roster-card text-left p-3 cursor-pointer ${active ? "ring-2 ring-toxic" : ""} ${m.hp <= 0 ? "opacity-60" : ""}`}
                          style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties}
                        >
                          <div className="flex items-center justify-between">
                            <MorenoFace sp={s} size={56} />
                            {active && <span className="text-[10px] font-display tracking-widest bg-toxic text-[#04150c] px-1.5 py-0.5">ATTIVO</span>}
                          </div>
                          <div className="font-display text-lg mt-1 leading-tight text-gold">{m.name ?? s.name}</div>
                          {m.name && <div className="font-display text-xs leading-tight" style={{ color: hexCss(s.accentColor) }}>{s.name}</div>}
                          <HpBar hp={m.hp} max={m.maxHp} w={120} />
                          <div className="text-dim text-xs mt-1">
                            HP <span className="text-bone tabular-nums">{m.hp}/{m.maxHp}</span> · ATK <span className="text-bone tabular-nums">{m.atk}</span>
                          </div>
                          {m.hp <= 0 && <div className="text-blood text-xs mt-1 font-display">AL TAPPETO</div>}
                          <button
                            onClick={(e) => { e.stopPropagation(); releaseFromParty(i); }}
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

              {menuTab === "stato" && (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex md:flex-col gap-2 flex-wrap">
                    {party.map((m, i) => {
                      const s = speciesById(m.spId);
                      return (
                        <button
                          key={i}
                          onClick={() => { sfx.click(); setMenuSel(i); }}
                          className={`btn-hard flex items-center gap-2 px-2 py-1.5 border-2 ${menuSel === i ? "border-gold bg-[#2a1b45]" : "border-edge bg-[#160b26]"}`}
                        >
                          <MorenoFace sp={s} size={34} />
                          <span className="text-sm text-bone">{m.name ?? s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const m = party[Math.min(menuSel, party.length - 1)];
                    if (!m) return <div className="text-dim">NESSUN MORENO SELEZIONATO.</div>;
                    const s = speciesById(m.spId);
                    const lines = s.recruitLines.length ? s.recruitLines : s.hurtLines.length ? s.hurtLines : s.angryLines;
                    return (
                      <div className="flex-1 border-2 border-edge bg-panel2/70 p-4" style={{ "--pc": hexCss(s.accentColor) } as React.CSSProperties}>
                        <div className="flex items-center gap-4">
                          <MorenoFace sp={s} size={88} />
                          <div>
                            <div className="font-display text-3xl text-gold leading-none">{m.name ?? s.name}</div>
                            <div className="font-display text-sm" style={{ color: hexCss(s.accentColor) }}>{s.name} · {s.title}</div>
                            <div className="text-dim text-sm mt-1">GUSTO PREFERITO: <span style={{ color: FLAVORS[s.favorite].css }}>{FLAVORS[s.favorite].name}</span></div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-base">
                          <div className="border border-edge bg-[#160b26] px-3 py-1.5">HP <span className="text-bone tabular-nums">{m.hp}/{m.maxHp}</span></div>
                          <div className="border border-edge bg-[#160b26] px-3 py-1.5">ATK <span className="text-bone tabular-nums">{m.atk}</span></div>
                        </div>
                        <div className="mt-2"><HpBar hp={m.hp} max={m.maxHp} w={320} /></div>
                        <div className="text-dim text-sm mt-3 italic">«{lines.length ? pick(lines) : "…"}»</div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {menuTab === "zaino" && (
                <div className="space-y-4">
                  <div>
                    <div className="text-toxic text-xs tracking-[0.25em] mb-2">OGGETTI CHIAVE</div>
                    {items.length === 0 && <div className="text-dim text-sm">NIENTE. SOLO LE TUE MANI E LA PROFEZIA.</div>}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {items.map((id) => (
                        <div key={id} className="border-2 border-gold bg-panel2/70 p-3">
                          <div className="text-gold font-display text-lg leading-tight">{ITEMS[id].name}</div>
                          <div className="text-dim text-xs mt-1">{ITEMS[id].desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-toxic text-xs tracking-[0.25em] mb-2">DOLCI CURATIVI — CLICCA E POI SCEGLI IL MORENO</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {CONSUMABLE_LIST.map((def) => {
                        const n = consumables[def.id] ?? 0;
                        return (
                          <div key={def.id} className={`border-2 p-3 ${useItemId === def.id ? "border-gold bg-[#2a1b45]" : "border-edge bg-panel2/70"}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 grid place-items-center border border-edge text-xl" style={{ background: def.hue + "33", color: def.hue }}>♥</div>
                              <div className="flex-1">
                                <div className="text-bone leading-tight">{def.name} <span className="text-dim text-xs">×{n}</span></div>
                                <div className="text-dim text-xs">{def.desc}</div>
                              </div>
                              <button
                                onClick={() => { sfx.click(); setUseItemId(useItemId === def.id ? null : def.id); }}
                                disabled={n <= 0}
                                className="btn-hard px-3 py-1.5 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-sm tracking-widest"
                              >
                                USA
                              </button>
                            </div>
                            {useItemId === def.id && (
                              <div className="mt-2 grid grid-cols-4 gap-1.5">
                                {party.map((m, i) => {
                                  const s = speciesById(m.spId);
                                  const valid = def.revive ? m.hp <= 0 : !def.all && m.hp > 0 && m.hp < m.maxHp;
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => useConsumableOn(def.id, i)}
                                      disabled={!def.all && !valid}
                                      className="btn-hard flex flex-col items-center gap-0.5 px-1 py-1.5 border-2 border-edge bg-[#160b26]"
                                      style={{ opacity: !def.all && !valid ? 0.35 : 1 }}
                                    >
                                      <MorenoFace sp={s} size={28} />
                                      <span className="text-[9px] text-dim tabular-nums">{m.hp}/{m.maxHp}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-toxic text-xs tracking-[0.25em] mb-2">SCORTE DI MORENINI DA OFFERTA</div>
                    <div className="grid grid-cols-4 gap-2">
                      {FLAVOR_LIST.map((f) => (
                        <div key={f} className="border-2 border-edge bg-panel2/70 p-2 text-center">
                          <CookieIcon css={FLAVORS[f].css} size={26} />
                          <div className="text-xs mt-1" style={{ color: FLAVORS[f].css }}>{FLAVORS[f].name}</div>
                          <div className="text-bone tabular-nums">×{morenini[f] ?? 0}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-dim text-xs mt-1.5">ALTRE SCORTE AL FORNO DI MORENOPOLI (SI PAGANO IN BRICIOLE 🍪 {briciole}).</div>
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
              <div className="text-gold text-sm whitespace-nowrap">SLOT PC <span className="tabular-nums">{pc.length}/{PC_CAP}</span></div>
              <button onClick={closePc} className="btn-hard px-3 py-1.5 bg-panel2 border-2 border-edge text-dim font-display text-xl">✕</button>
            </div>
            <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 overflow-hidden">
              <div className="w-full md:w-56 flex flex-col border-2 border-edge bg-panel2/60">
                <div className="text-toxic text-xs tracking-[0.25em] px-2 py-1.5 border-b border-edge">SQUADRA ({party.length}/8)</div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {party.map((m, i) => {
                    const s = speciesById(m.spId);
                    const sel = pcSel?.kind === "party" && pcSel.idx === i;
                    return (
                      <button
                        key={i}
                        onClick={() => { sfx.click(); setPcSel({ kind: "party", idx: i }); setPcReleaseArm(false); }}
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
                          <div key={i} className="aspect-square border border-dashed border-edge/60 grid place-items-center text-edge text-xs">·</div>
                        );
                      }
                      const s = speciesById(mon.spId);
                      return (
                        <button
                          key={i}
                          onClick={() => { sfx.click(); setPcSel({ kind: "pc", idx: i }); setPcReleaseArm(false); }}
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

      {/* ================================ FORNO ================================ */}
      {shopOpen && (
        <div className="absolute inset-0 z-[46] flex items-center justify-center bg-[rgba(5,2,10,0.88)] p-3">
          <div className="w-full max-w-3xl max-h-[92vh] flex flex-col border-2 border-gold bg-panel shadow-[0_0_60px_rgba(255,201,77,0.22)]">
            <div className="flex items-center gap-3 border-b-2 border-edge px-4 py-2.5">
              <div>
                <div className="font-display text-2xl text-gold tracking-widest leading-none">FORNO DI NONNA MORENILDE</div>
                <div className="text-dim text-xs mt-0.5">«Morenini freschi, sfornati col male del mondo spento.»</div>
              </div>
              <div className="flex-1" />
              <div className="text-bone text-sm whitespace-nowrap">🍪 BRICIOLE <span className="text-gold tabular-nums text-lg">{briciole}</span></div>
              <button onClick={closeShop} className="btn-hard px-3 py-1.5 bg-panel2 border-2 border-edge text-dim font-display text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <div className="text-toxic text-xs tracking-[0.25em] mb-2">MORENINI DA OFFERTA — NON SONO INFINITI, SI COMPRANO!</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {FLAVOR_LIST.map((f) => (
                    <div key={f} className="border-2 border-edge bg-panel2/70 p-2.5 text-center">
                      <div className="flex justify-center mb-1"><CookieIcon css={FLAVORS[f].css} size={34} /></div>
                      <div className="font-display text-sm leading-tight" style={{ color: FLAVORS[f].css }}>{FLAVORS[f].name}</div>
                      <div className="text-dim text-xs mt-0.5">NE HAI <span className="text-bone tabular-nums">×{morenini[f] ?? 0}</span></div>
                      <button
                        onClick={() => buyMorenino(f)}
                        disabled={briciole < MORENINI_PRICES[f]}
                        className="btn-hard mt-1.5 w-full py-1 border-2 border-gold bg-[#3a2a10] text-gold font-display text-sm tracking-widest"
                      >
                        COMPRA · {MORENINI_PRICES[f]}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-toxic text-xs tracking-[0.25em] mb-2">DOLCI CURATIVI</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {([
                    { id: "croccantino", price: 25 },
                    { id: "crostata", price: 45 },
                    { id: "caffe", price: 60 },
                    { id: "famiglia", price: 80 },
                  ] as { id: string; price: number }[]).map(({ id, price }) => (
                    <div key={id} className="flex items-center gap-2.5 border-2 border-edge bg-panel2/70 p-2">
                      <div className="w-9 h-9 grid place-items-center border border-edge text-lg" style={{ background: CONSUMABLES[id].hue + "33", color: CONSUMABLES[id].hue }}>♥</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-bone text-sm leading-tight">{CONSUMABLES[id].name}</div>
                        <div className="text-dim text-[11px] leading-tight">{CONSUMABLES[id].desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-dim text-[11px]">×{consumables[id] ?? 0}</div>
                        <button
                          onClick={() => buyConsumable(id, price)}
                          disabled={briciole < price}
                          className="btn-hard mt-0.5 px-2 py-0.5 border-2 border-gold bg-[#3a2a10] text-gold font-display text-xs tracking-widest"
                        >
                          {price} 🍪
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-dim text-xs">LE BRICIOLE SI VINCONO IN BATTAGLIA E ALLA SALA GIOCHI (MORENOPONG).</div>
            </div>
          </div>
        </div>
      )}

      {/* ================================ SALA GIOCHI ================================ */}
      {gameOpen && (
        <div className="absolute inset-0 z-[46] flex items-center justify-center bg-[rgba(5,2,10,0.9)] p-3">
          <div className="w-full max-w-xl max-h-[94vh] flex flex-col border-2 border-blood bg-panel shadow-[0_0_60px_rgba(255,46,95,0.25)]">
            <div className="flex items-center gap-3 border-b-2 border-edge px-4 py-2.5">
              <div>
                <div className="font-display text-2xl text-blood tracking-widest leading-none">SALA GIOCHI — MORENOPONG</div>
                <div className="text-dim text-xs mt-0.5">TETRIS × PONG FUSI NEL PECCATO. SI PAGA PER ENTRARE, SI VINCONO MORENINI.</div>
              </div>
              <div className="flex-1" />
              <div className="text-bone text-sm whitespace-nowrap">🍪 <span className="text-gold tabular-nums text-lg">{briciole}</span></div>
              <button onClick={closeArcade} className="btn-hard px-3 py-1.5 bg-panel2 border-2 border-edge text-dim font-display text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!arcadePlaying && !arcadeResult && (
                <div className="text-center py-4">
                  <div className="font-display text-4xl text-gold mb-2">COME SI GIOCA</div>
                  <ul className="text-dim text-sm space-y-1 mb-4 text-left max-w-sm mx-auto">
                    <li>→ I pezzi cadono e si IMPILANO come a tetris.</li>
                    <li>→ La pallina rimbalza e SBRICIOLA i blocchi (+10).</li>
                    <li>→ Le righe complete si cancellano (+100 × combo).</li>
                    <li>→ Muovi la racchetta con ◄ ► / A D / mouse.</li>
                    <li>→ 3 vite. Ogni {MINIGAME.pointsPerMorenino} punti = 1 MORENINO in regalo.</li>
                  </ul>
                  <button
                    onClick={startArcade}
                    disabled={briciole < MINIGAME.entry}
                    className="btn-hard px-8 py-3 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl tracking-widest"
                  >
                    GIOCA · {MINIGAME.entry} 🍪
                  </button>
                  {briciole < MINIGAME.entry && <div className="text-blood text-sm mt-2">NON HAI ABBASTANZA BRICIOLE. VINCI QUALCHE BATTAGLIA!</div>}
                </div>
              )}
              {arcadePlaying && (
                <div className="flex flex-col items-center gap-3">
                  <Morenopong onExit={(s) => collectArcade(s)} />
                </div>
              )}
              {arcadeResult && (
                <div className="text-center py-6 pop-in">
                  <div className="font-display text-4xl text-gold mb-3">PUNTEGGIO: {arcadeResult.score}</div>
                  <div className="text-bone text-lg mb-1">
                    HAI VINTO <span className="text-gold">{arcadeResult.morenini} MORENINI</span> (gusti casuali)
                  </div>
                  <div className="text-dim text-base mb-5">+ <span className="text-gold tabular-nums">{arcadeResult.briciole}</span> briciole di consolazione</div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { setArcadeResult(null); startArcade(); }}
                      disabled={briciole < MINIGAME.entry}
                      className="btn-hard px-6 py-2.5 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-xl tracking-widest"
                    >
                      GIOCA ANCORA · {MINIGAME.entry} 🍪
                    </button>
                    <button onClick={closeArcade} className="btn-hard px-6 py-2.5 bg-panel2 border-2 border-edge text-dim font-display text-xl tracking-widest">
                      ESCI
                    </button>
                  </div>
                </div>
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
              onClick={() => { sfx.click(); setInertiaNotice(false); }}
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
                onClick={() => { sfx.click(); setSlotPanel(null); setConfirmSlot(null); }}
                className="btn-hard px-4 py-2 bg-panel2 border-2 border-edge text-dim font-display text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto" key={slotTick}>
              {(() => {
                const auto = readSaveKey(SAVE_KEY);
                const cnt = auto ? new Set(auto.capturedSpecies ?? []).size : 0;
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
                      <button onClick={() => loadFromAutosave()} className="btn-hard px-4 py-2 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-lg tracking-widest">
                        CARICA
                      </button>
                    )}
                  </div>
                );
              })()}
              {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).map((n) => {
                const save = readSlot(n);
                const cnt = save ? new Set(save.capturedSpecies ?? []).size : 0;
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

      {/* ================================ GAME OVER ================================ */}
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
            «Don Moreno ti raccoglie con la paletta. I tuoi Moreni guariscono... col tempo. Letteralmente.»
          </div>
          <div className="mt-2 text-gold text-xl">
            CARISMA: <span className="tabular-nums">{score}</span> · AMICI: {new Set(capturedSpecies).size}
          </div>
          <div className="mt-7 flex flex-col md:flex-row gap-3">
            <button onClick={revive} className="btn-hard px-8 py-3 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl tracking-widest">
              RIALZATI (CURA COMPLETA)
            </button>
            <button onClick={backToTitle} className="btn-hard px-8 py-3 bg-panel2 border-2 border-edge text-dim font-display text-2xl tracking-widest">
              TITOLI DI TESTA
            </button>
          </div>
        </div>
      )}

      {/* ================================ VITTORIA ================================ */}
      {phase === "victory" && (
        <div className="absolute inset-0 z-[30] overflow-y-auto bg-[radial-gradient(ellipse_at_center,rgba(20,12,4,0.78),rgba(8,5,2,0.95))]">
          <div className="min-h-full flex flex-col items-center justify-center py-8 px-4">
            <div className="text-gold tracking-[0.5em] text-sm mb-2">LA PROFEZIA È COMPIUTA</div>
            <div className="font-display text-[10vw] md:text-[5.5rem] leading-[0.9] text-center text-gold text-outline title-float">
              CROCCANTEZZA
              <br />
              RESTITUITA
            </div>
            <p className="mt-3 text-dim max-w-xl text-center text-base md:text-lg">
              Il Maiale del Mondo è di nuovo Nonno Moreno. Morenopoli cruncha in pace. E tu? Tu hai un PC pieno di amici.
            </p>
            <div className="mt-2 text-toxic text-2xl">CARISMA: <span className="tabular-nums">{score}</span></div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2.5 w-full max-w-3xl">
              {CAST.map((c) => (
                <div key={c.name} className="roster-card" style={{ "--pc": "#ffc94d" } as React.CSSProperties}>
                  <div className="font-display text-lg text-gold">{c.name}</div>
                  <div className="text-dim text-xs mt-0.5">{c.role}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <button onClick={backToTitle} className="btn-hard px-8 py-3 bg-gold border-2 border-[#fff0d1] text-[#241503] font-display text-2xl tracking-widest">
                TITOLI DI CODA
              </button>
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

/* ---------------- ErrorBoundary: niente schermi neri ---------------- */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { err: e.message };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="h-dvh w-full grid place-items-center bg-void text-bone font-mono p-6">
          <div className="border-2 border-[#ff2e5f] bg-[#160b26] p-6 max-w-lg">
            <div className="text-[#ff2e5f] text-2xl mb-2">CRASH DEMONIACO</div>
            <div className="text-sm opacity-80 break-words">{this.state.err}</div>
            <button onClick={() => location.reload()} className="mt-4 px-4 py-2 border border-[#4dffa6] text-[#4dffa6]">
              RICARICA LA PROFEZIA
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MoreniGame />
    </ErrorBoundary>
  );
}
