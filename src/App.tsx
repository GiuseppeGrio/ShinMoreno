import React, { useEffect, useRef, useState } from "react";
import { MoreniEngine } from "./game/engine";
import { sfx } from "./game/audio";
import {
  CAST,
  FLAVOR_LIST,
  FLAVORS,
  ITEMS,
  SCRIPTS,
  SPECIES,
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

type Phase = "title" | "dialogue" | "world" | "battle" | "quiz" | "hug" | "victory" | "gameover";

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
  const isMaiale = sp.id === "maialedelmondo" || sp.id === "nonnopurificato" || sp.id === "cinghiaale" || sp.id === "facocero";
  const dark = sp.id === "maledelmondo";
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
      {p.beret && <ellipse cx="54" cy="20" rx="22" ry="9" fill="#c0392b" />}
      {p.hood && <path d="M14 60 C14 22 30 6 50 6 C70 6 86 22 86 60 L74 60 C74 32 64 18 50 18 C36 18 26 32 26 60 Z" fill="#12081f" />}
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
          <circle cx="37" cy="49" r="4" fill={dark || sp.id === "maialedelmondo" ? "#ff2e5f" : "#12060c"} />
          <circle cx="63" cy="49" r="4" fill={dark || sp.id === "maialedelmondo" ? "#ff2e5f" : "#12060c"} />
          {sp.id === "maialedelmondo" && (
            <>
              <rect x="26" y="33" width="20" height="5" fill="#2a1208" transform="rotate(16 36 35)" />
              <rect x="54" y="33" width="20" height="5" fill="#2a1208" transform="rotate(-16 64 35)" />
            </>
          )}
          {p.tears && (
            <>
              <ellipse cx="31" cy="62" rx="3.6" ry="6" fill="#6fd7ff" />
              <ellipse cx="69" cy="62" rx="3.6" ry="6" fill="#6fd7ff" />
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
          <rect x="30" y="62" width="16" height="5" rx="2.5" fill="#2d2438" transform="rotate(-12 38 64)" />
          <rect x="54" y="62" width="16" height="5" rx="2.5" fill="#2d2438" transform="rotate(12 62 64)" />
        </>
      )}
      {p.snout && (
        <>
          <ellipse cx="50" cy="66" rx="12" ry="8.5" fill={belly} stroke="#8a5a2a" strokeWidth="1.5" />
          <circle cx="45" cy="66" r="2.4" fill="#47101f" />
          <circle cx="55" cy="66" r="2.4" fill="#47101f" />
        </>
      )}
      {p.tusks && (
        <>
          <polygon points="34,74 30,60 40,70" fill="#f5e6c8" />
          <polygon points="66,74 70,60 60,70" fill="#f5e6c8" />
        </>
      )}
      {!p.snout && !dark && <ellipse cx="50" cy="70" rx="7.5" ry="5" fill="#47101f" />}
      {dark && <path d="M38 74 L44 70 L50 74 L56 70 L62 74" stroke="#0a0512" strokeWidth="3" fill="none" />}
      {sp.id === "nonnopurificato" && <path d="M40 76 Q50 84 60 76" stroke="#8a6a3a" strokeWidth="3" fill="none" />}
      {p.heart && <path d="M50 26 C47 21 40 21 40 26 C40 30 46 33 50 37 C54 33 60 30 60 26 C60 21 53 21 50 26 Z" fill="#ff4f9a" />}
      {p.chain && <ellipse cx="50" cy="84" rx="27" ry="8" fill="none" stroke={acc} strokeWidth="4" strokeDasharray="6 4" />}
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

function CookieIcon({ css, size = 24 }: { css: string; size?: number }) {
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
function DialogueBox({ lines, onDone }: { lines: DialogueLine[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const line = lines[Math.min(idx, lines.length - 1)];
  const full = line.text;

  useEffect(() => setChars(0), [idx]);
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

  const sp = speciesById(line.spk);
  const isNarrator = line.spk === "NARRATORE";
  const isTu = line.spk === "TU";
  const acc = !isNarrator && !isTu ? hexCss(sp.accentColor) : isTu ? "#4dffa6" : "#bfa8ff";
  const name = !isNarrator && !isTu ? sp.name : isTu ? "TU — EVOCATORE MEDIOCRE" : "VOCE DELLA PROFEZIA";

  return (
    <div className="dlg-root" onClick={advance}>
      <div className="dlg-box relative" style={{ "--acc": acc } as React.CSSProperties}>
        <div className="dlg-name" style={{ background: acc }}>
          {name}
        </div>
        <div className="flex gap-4 items-center">
          {!isNarrator && (
            <div className="dlg-portrait">{isTu ? <TuFace size={76} /> : <MorenoFace sp={sp} size={76} />}</div>
          )}
          <div className={`dlg-text flex-1 ${isNarrator ? "narrator" : ""}`}>
            {full.slice(0, chars)}
            <span className="blink">▌</span>
          </div>
        </div>
        <div className="dlg-hint">
          [SPAZIO / CLICK] {chars < full.length ? "COMPLETA" : idx + 1 < lines.length ? "CONTINUA ▼" : "AVANTI ▼"}
        </div>
      </div>
    </div>
  );
}

/* ================================================= STATO PARTITA */
interface Flags {
  intro: boolean;
  cinghiaPre: boolean;
  cinghiaDone: boolean;
  micoDone: boolean;
  coizioDone: boolean;
  ginoDone: boolean;
  ginoPostDone: boolean;
  don2Done: boolean;
  swordPulled: boolean;
  clompAwake: boolean;
  maialeMid: boolean;
}
const initialFlags: Flags = {
  intro: false, cinghiaPre: false, cinghiaDone: false, micoDone: false, coizioDone: false,
  ginoDone: false, ginoPostDone: false, don2Done: false, swordPulled: false, clompAwake: false, maialeMid: false,
};

interface PartyMon {
  uid: number;
  id: string;
  hp: number;
  maxHp: number;
  atk: number;
}

interface Bt {
  enemySp: SpeciesDef;
  enemyHp: number;
  enemyMax: number;
  enemyAtk: number;
  activeIdx: number;
  stage: "menu" | "busy" | "enemy" | "switch";
  convinced: boolean;
  boss: boolean;
  isMaiale: boolean;
  wild: boolean;
  diff: number;
  log: { id: number; text: string; kind: "info" | "good" | "bad" }[];
}

function objective(f: Flags, captured: number): string {
  if (!f.intro) return "Parla con DON MORENO al centro di Morenopoli";
  if (!f.cinghiaPre) return "Valle dei Facoceri: affronta CINGHIA ALE";
  if (!f.cinghiaDone) return "Vinci contro Cinghia Ale e OFFRIGLI il morenino";
  if (!f.micoDone) return "Accampamento della Rivolta: la prova di MICO NOSCA";
  if (!f.coizioDone) return "Terme del Contatto: l'abbraccio di COIZIO";
  if (!f.ginoDone) return "Abisso di Gino: scopri cosa nasconde GINO SATRI";
  if (!f.ginoPostDone) return "Ferma il MALE DEL MONDO scatenato da Gino";
  if (!f.don2Done) return "Torna da DON MORENO: ha una rivelazione";
  if (!f.swordPulled)
    return captured >= SWORD_REQ
      ? "Estrai la SPADA DELL'AMORE dal Grande Morenino"
      : `Fai amicizia con i Moreni (${captured}/${SWORD_REQ}) — catturali con i morenini`;
  if (!f.clompAwake) return "Parla con Don Moreno: la spada ha scelto";
  return "Entra nel PORTALE all'Antro del Maiale (Clomp ti segue)";
}

function questRingTarget(f: Flags): string | null {
  if (!f.intro) return "don";
  if (!f.cinghiaPre) return "cinghia";
  if (!f.micoDone) return "mico";
  if (!f.coizioDone) return "coizio";
  if (!f.ginoDone) return "gino";
  if (!f.don2Done) return "don";
  if (!f.swordPulled) return "monument";
  return null;
}

/* ================================================= APP */
export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MoreniEngine | null>(null);

  const [phase, setPhase] = useState<Phase>("title");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [flags, setFlags] = useState<Flags>(initialFlags);
  const [party, setParty] = useState<PartyMon[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [dlgLines, setDlgLines] = useState<DialogueLine[]>([]);
  const [banner, setBanner] = useState<{ kicker: string; title: string; boss: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [zone, setZone] = useState<ZoneDef | null>(null);
  const [nearId, setNearId] = useState<string | null>(null);
  const [bt, setBt] = useState<Bt | null>(null);
  const [picker, setPicker] = useState<null | { forced: boolean }>(null);
  const [quiz, setQuiz] = useState<{ q: number; hearts: number } | null>(null);
  const [hug, setHug] = useState<{ power: number; running: boolean; done: boolean } | null>(null);
  const [defeatInfo, setDefeatInfo] = useState("");

  const phaseRef = useRef<Phase>("title");
  const pausedRef = useRef(false);
  const flagsRef = useRef<Flags>(initialFlags);
  const partyRef = useRef<PartyMon[]>([]);
  const itemsRef = useRef<string[]>([]);
  const btRef = useRef<Bt | null>(null);
  const afterDlgRef = useRef<(() => void) | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const bannerTRef = useRef<number | null>(null);
  const toastTRef = useRef<number | null>(null);
  const logIdRef = useRef(0);
  const uidRef = useRef(1);
  const hugHeldRef = useRef(false);

  phaseRef.current = phase;
  flagsRef.current = flags;
  partyRef.current = party;
  itemsRef.current = items;
  btRef.current = bt;

  const setFlag = (k: keyof Flags, v = true) => setFlags((f) => ({ ...f, [k]: v }));

  const pushLog = (text: string, kind: "info" | "good" | "bad" = "info") =>
    setBt((b) => (b ? { ...b, log: [...b.log.slice(-4), { id: ++logIdRef.current, text, kind }] } : b));

  const showToast = (t: string) => {
    setToast(t);
    if (toastTRef.current) window.clearTimeout(toastTRef.current);
    toastTRef.current = window.setTimeout(() => setToast(null), 3000);
  };
  const showBanner = (kicker: string, title: string, boss: boolean) => {
    setBanner({ kicker, title, boss });
    if (bannerTRef.current) window.clearTimeout(bannerTRef.current);
    bannerTRef.current = window.setTimeout(() => setBanner(null), 2250);
  };
  const doFlash = (kind: "red" | "gold") => setFlash({ kind, key: Date.now() });
  const [flash, setFlash] = useState<{ kind: "red" | "gold"; key: number } | null>(null);

  const capturedIds = [...new Set(party.map((m) => m.id))];

  /* ---------------- dialogo helper ---------------- */
  const say = (key: string, after?: () => void) => {
    afterDlgRef.current = after ?? null;
    setDlgLines(SCRIPTS[key]);
    setPhase("dialogue");
  };

  /* ---------------- engine init ---------------- */
  useEffect(() => {
    const eng = new MoreniEngine(mountRef.current!);
    engineRef.current = eng;
    eng.onZone = (id) => {
      const z = ZONES.find((zz) => zz.id === id) ?? null;
      setZone(z);
      if (z && z.id !== "morenopoli") showBanner(z.diff >= 3 ? "ZONA PERICOLOSA" : "NUOVA ZONA", z.name, z.diff >= 3);
    };
    eng.onEncounter = (spId, diff) => {
      if (phaseRef.current !== "world" || pausedRef.current) return;
      sfx.appear();
      startWildBattle(spId, diff);
    };
    eng.onNear = (id) => setNearId(id);
    eng.onPortal = () => {
      if (phaseRef.current !== "world") return;
      if (flagsRef.current.clompAwake) {
        say("antro_intro", () => startBossBattle("maialedelmondo"));
      }
    };
    eng.start();
    return () => {
      eng.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* quest ring */
  useEffect(() => {
    engineRef.current?.setQuestNpc(questRingTarget(flags));
  }, [flags]);

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
    let raf = 0;
    const loop = () => {
      const eng = engineRef.current;
      if (eng && phaseRef.current === "world" && !pausedRef.current) {
        const k = keysRef.current;
        let x = 0;
        let z = 0;
        if (k["w"] || k["arrowup"]) z -= 1;
        if (k["s"] || k["arrowdown"]) z += 1;
        if (k["a"] || k["arrowleft"]) x -= 1;
        if (k["d"] || k["arrowright"]) x += 1;
        eng.setInput(x, z);
      } else {
        eng?.setInput(0, 0);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      cancelAnimationFrame(raf);
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
      if (phaseRef.current === "dialogue") return;
      if (k === "p" || k === "escape") {
        if (phaseRef.current === "world" || phaseRef.current === "battle") togglePause();
        return;
      }
      if (phaseRef.current === "title" && (k === " " || k === "enter")) {
        startGame();
        return;
      }
      if (phaseRef.current === "world" && k === "e" && nearIdRef.current) {
        interact(nearIdRef.current);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  const nearIdRef = useRef<string | null>(null);
  nearIdRef.current = nearId;

  /* ---------------- avvio ---------------- */
  const startGame = () => {
    sfx.unlock();
    sfx.start();
    setFlags(initialFlags);
    setScore(0);
    setItems([]);
    const starter: PartyMon = { uid: uidRef.current++, id: "morenozzo", hp: 36, maxHp: 36, atk: 8 };
    setParty([starter]);
    setPhase("world");
    engineRef.current?.setPortalOpen(false);
    engineRef.current?.companionFollow(false);
    engineRef.current?.enterWorld(0, 9);
    showBanner("MORENOPOLI", "LA PROFEZIA INIZIA", false);
  };

  /* ---------------- interazioni ---------------- */
  const interact = (id: string) => {
    if (phaseRef.current !== "world" || pausedRef.current) return;
    const f = flagsRef.current;
    sfx.click();
    const captured = new Set(partyRef.current.map((m) => m.id)).size;
    if (id === "don") {
      if (!f.intro) {
        say("prologue", () => setFlag("intro"));
      } else if (f.ginoPostDone && !f.don2Done) {
        say("don2", () => {
          setFlag("don2Done");
          showToast("OBIETTIVO: FAI AMICIZIA CON 8 MORENI POI ESTRAI LA SPADA");
        });
      } else if (f.don2Done && f.swordPulled && !f.clompAwake) {
        say("sword_pull", () => awakenClomp());
      } else if (f.don2Done && !f.swordPulled) {
        say("don1");
      } else {
        say("don1");
      }
      return;
    }
    if (id === "cinghia") {
      if (!f.cinghiaPre) {
        say("cinghia_pre", () => {
          setFlag("cinghiaPre");
          startBossBattle("cinghiaale");
        });
      } else if (f.cinghiaDone) {
        say("cinghia_post");
      } else {
        startBossBattle("cinghiaale");
      }
      return;
    }
    if (id === "mico") {
      if (!f.micoDone) say("mico1", () => startQuiz());
      else showToast("MICO: «La spilla è tua. Vai e abbraccia il mondo.»");
      return;
    }
    if (id === "coizio") {
      if (!f.coizioDone) say("coizio1", () => startHug());
      else showToast("COIZIO: «un abbraccio non finisce mai. torna quando vuoi.»");
      return;
    }
    if (id === "gino") {
      if (!f.ginoDone) {
        say("gino1", () => {
          setFlag("ginoDone");
          startBossBattle("maledelmondo");
        });
      } else if (!f.ginoPostDone) {
        showToast("GINO: «FERMALO! L'ESSENZA È USCITA DALLA BOTOLA!»");
      } else {
        showToast("GINO: «la fiala è tua. usala con saggezza... o no.»");
      }
      return;
    }
    if (id === "monument") {
      if (!f.don2Done) {
        showToast("Un morenino enorme con una spada conficcata. Don Moreno ne saprà di più.");
      } else if (!f.swordPulled) {
        if (captured >= SWORD_REQ) {
          setFlag("swordPulled");
          sfx.recruit();
          engineRef.current?.pullSwordFx(() => {
            showToast("LA SPADA DELL'AMORE È TUA! La piazza canta in falsetto.");
          });
        } else {
          say("sword_fail");
        }
      } else {
        showToast("Il Grande Morenino ti fa l'occhiolino. Crunch.");
      }
      return;
    }
  };

  const awakenClomp = () => {
    setFlag("clompAwake");
    engineRef.current?.setPortalOpen(true);
    engineRef.current?.companionFollow(true);
    engineRef.current?.awakenClompFx(() => {
      sfx.victory();
      showToast("CLOMP SI UNISCE ALLA PROFEZIA! Verso l'Antro del Maiale!");
    });
  };

  /* ---------------- battaglie ---------------- */
  const makeBt = (spId: string, diff: number, boss: boolean): Bt => {
    const sp = speciesById(spId);
    const st = enemyStats(spId, diff);
    return {
      enemySp: sp,
      enemyHp: st.hp,
      enemyMax: st.hp,
      enemyAtk: st.atk,
      activeIdx: Math.max(0, partyRef.current.findIndex((m) => m.hp > 0)),
      stage: "menu",
      convinced: false,
      boss,
      isMaiale: spId === "maialedelmondo",
      wild: !boss,
      diff,
      log: [{ id: ++logIdRef.current, text: `${sp.name} ti sfida: «${sp.title}»`, kind: "info" }],
    };
  };

  const firstAlive = (): PartyMon | null => partyRef.current.find((m) => m.hp > 0) ?? null;

  const startWildBattle = (spId: string, diff: number) => {
    const alive = firstAlive();
    if (!alive) return;
    const b = makeBt(spId, diff, false);
    setBt(b);
    setPhase("battle");
    engineRef.current?.startBattle(speciesById(alive.id), b.enemySp, false);
  };

  const startBossBattle = (spId: string) => {
    const alive = firstAlive();
    if (!alive) return;
    const b = makeBt(spId, 0, true);
    setBt(b);
    setPhase("battle");
    engineRef.current?.startBattle(speciesById(alive.id), b.enemySp, true);
    showBanner(spId === "maialedelmondo" ? "BOSS FINALE" : spId === "maledelmondo" ? "IL MALE IN PERSONA" : "CAPO TRIBÙ", b.enemySp.name, true);
  };

  const endToWorld = () => {
    engineRef.current?.endBattle();
    setBt(null);
    setPhase("world");
  };

  const atkMult = () => (itemsRef.current.includes("spilla") ? 1.25 : 1);
  const critChance = () => (itemsRef.current.includes("fiala") ? 0.15 : 0);
  const captureBonus = () => (itemsRef.current.includes("abbraccio") ? 0.2 : 0);

  const doAttack = () => {
    const b = btRef.current;
    if (!b || b.stage !== "menu") return;
    const mon = partyRef.current[b.activeIdx];
    if (!mon || mon.hp <= 0) return;
    setBt({ ...b, stage: "busy" });
    const crit = Math.random() < critChance();
    const dmg = Math.max(2, Math.round((mon.atk + Math.floor(Math.random() * 5) - 2) * atkMult() * (crit ? 2 : 1)));
    sfx.click();
    engineRef.current?.battleAttack("player", () => {
      sfx.chomp();
      const newHp = Math.max(0, b.enemyHp - dmg);
      pushLog(`${monName(mon)} colpisce! ${dmg} danni${crit ? " — MALE OMEOPATICO RADDOPPIATO!" : ""}`, crit ? "good" : "info");
      setBt((cur) => (cur ? { ...cur, enemyHp: newHp, stage: "busy" } : cur));
      // cutscene maiale a metà vita
      if (b.isMaiale && !flagsRef.current.maialeMid && newHp <= b.enemyMax * 0.5) {
        setFlag("maialeMid");
        window.setTimeout(() => {
          say("maiale_mid", () => {
            setBt((cur) =>
              cur ? { ...cur, enemyAtk: Math.max(8, cur.enemyAtk - 5), stage: "menu", log: [...cur.log, { id: ++logIdRef.current, text: "IL MAIALE È SCOPERTO! ATK nemico ridotta.", kind: "good" }] } : cur
            );
            engineRef.current?.shake(0.5);
          });
        }, 400);
        return;
      }
      if (newHp <= 0) {
        enemyDefeated();
        return;
      }
      window.setTimeout(enemyTurn, 350);
    });
  };

  const monName = (m: PartyMon) => speciesById(m.id).name;

  const doOffer = () => {
    const b = btRef.current;
    if (!b || b.stage !== "menu") return;
    if (b.isMaiale) {
      pushLog("CLOMP: «Non si offre, si PURIFICA! Ammorbidiscilo ancora!»", "info");
      sfx.wrong();
      return;
    }
    if (!b.convinced) {
      setBt({ ...b, convinced: true, stage: "busy" });
      engineRef.current?.setEnemyConvinced(true);
      sfx.correct();
      pushLog(`Offri un morenino al ${FLAVORS[b.enemySp.favorite].name}. ${b.enemySp.name} si scioglie... ma resta fiero!`, "good");
      window.setTimeout(enemyTurn, 650);
      return;
    }
    // tentativo di cattura = la parte finale
    const rate = Math.min(0.95, 0.25 + (1 - b.enemyHp / b.enemyMax) * 0.6 + captureBonus());
    const success = Math.random() < rate;
    setBt({ ...b, stage: "busy" });
    sfx.click();
    pushLog(`Offri IL morenino al ${FLAVORS[b.enemySp.favorite].name}... ${b.enemySp.name} lo addenta!`, "info");
    engineRef.current?.battleCaptureTry(success, () => {
      if (success) captureSuccess(b);
      else {
        sfx.wrong();
        engineRef.current?.shake(0.4);
        doFlash("red");
        pushLog(`${b.enemySp.name} LO SPUTACCHIA! «${pick(b.enemySp.angryLines)}»`, "bad");
        window.setTimeout(enemyTurn, 500);
      }
    });
  };

  const captureSuccess = (b: Bt) => {
    sfx.recruit();
    doFlash("gold");
    const sp = b.enemySp;
    const already = partyRef.current.some((m) => m.id === sp.id);
    if (!already) {
      const nm: PartyMon = { uid: uidRef.current++, id: sp.id, hp: sp.baseHp + b.diff * 10, maxHp: sp.baseHp + b.diff * 10, atk: sp.baseAtk + b.diff * 2 };
      setParty((p) => [...p, nm]);
    }
    const pts = b.boss ? 400 : 150 + b.diff * 25;
    setScore((s) => s + pts);
    pushLog(`${sp.name} RECLUTATO! «${pick(sp.recruitLines)}» +${pts} CARISMA`, "good");
    window.setTimeout(() => {
      if (b.isMaiale) return; // non succede: maiale non catturabile
      endToWorld();
      if (sp.id === "cinghiaale" && !flagsRef.current.cinghiaDone) {
        setFlag("cinghiaDone");
        say("cinghia_post");
      }
    }, 900);
  };

  const enemyDefeated = () => {
    const b = btRef.current;
    if (!b) return;
    sfx.victory();
    doFlash("gold");
    const pts = b.boss ? 350 : 100 + b.diff * 20;
    setScore((s) => s + pts);
    pushLog(`${b.enemySp.name} è al tappeto! +${pts} CARISMA`, "good");
    engineRef.current?.battleFaint("enemy", () => {
      if (b.isMaiale) {
        const nonno = speciesById("nonnopurificato");
        engineRef.current?.battlePurify(nonno, () => {
          window.setTimeout(() => {
            engineRef.current?.endBattle();
            setBt(null);
            engineRef.current?.setPortalOpen(false);
            say("finale", () => setPhase("victory"));
          }, 1000);
        });
        return;
      }
      endToWorld();
      if (b.enemySp.id === "cinghiaale" && !flagsRef.current.cinghiaDone) {
        // convinto a suon di botte: si unisce comunque
        const already = partyRef.current.some((m) => m.id === "cinghiaale");
        if (!already) {
          const nm: PartyMon = { uid: uidRef.current++, id: "cinghiaale", hp: 105, maxHp: 105, atk: 14 };
          setParty((p) => [...p, nm]);
        }
        setFlag("cinghiaDone");
        say("cinghia_post");
      } else if (b.enemySp.id === "maledelmondo" && !flagsRef.current.ginoPostDone) {
        setFlag("ginoPostDone");
        setItems((it) => [...it, "fiala"]);
        say("gino_post");
      }
    });
  };

  const enemyTurn = () => {
    const b = btRef.current;
    if (!b) return;
    setBt({ ...b, stage: "enemy" });
    window.setTimeout(() => {
      engineRef.current?.battleAttack("enemy", () => {
        const cur = btRef.current;
        if (!cur) return;
        if (Math.random() < 0.3) pushLog(`${cur.enemySp.name}: «${pick(cur.enemySp.angryLines)}»`, "bad");
        const mon = partyRef.current[cur.activeIdx];
        const dmg = Math.max(2, cur.enemyAtk + Math.floor(Math.random() * 5) - 2);
        engineRef.current?.shake(0.35);
        doFlash("red");
        const newHp = Math.max(0, mon.hp - dmg);
        setParty((p) => p.map((m, i) => (i === cur.activeIdx ? { ...m, hp: newHp } : m)));
        pushLog(`${cur.enemySp.name} colpisce ${monName(mon)}: ${dmg} danni!`, "bad");
        if (newHp <= 0) {
          engineRef.current?.battleFaint("player", () => {
            const others = partyRef.current.filter((m, i) => i !== cur.activeIdx && m.hp > 0);
            if (others.length > 0) {
              pushLog(`${monName(mon)} è KO! Schiera un altro Moreno!`, "bad");
              setPicker({ forced: true });
              setBt((c) => (c ? { ...c, stage: "switch" } : c));
            } else {
              defeat();
            }
          });
        } else {
          setBt((c) => (c ? { ...c, stage: "menu" } : c));
        }
      });
    }, 450);
  };

  const defeat = () => {
    sfx.gameover();
    doFlash("red");
    setDefeatInfo(pick(btRef.current?.enemySp.angryLines ?? ["GRUF."]));
    window.setTimeout(() => {
      engineRef.current?.endBattle();
      setBt(null);
      setPhase("gameover");
    }, 700);
  };

  const respawn = () => {
    sfx.click();
    setParty((p) => p.map((m) => ({ ...m, hp: m.maxHp })));
    setPhase("world");
    engineRef.current?.enterWorld(-1.5, 8);
    engineRef.current?.setPortalOpen(flagsRef.current.clompAwake);
    say("don_revive");
  };

  const chooseSwitch = (idx: number) => {
    const b = btRef.current;
    if (!b) return;
    sfx.click();
    const mon = partyRef.current[idx];
    if (!mon || mon.hp <= 0) return;
    setPicker(null);
    engineRef.current?.setActiveSpecies(speciesById(mon.id));
    pushLog(`Vai, ${monName(mon)}!`, "good");
    if (picker?.forced) {
      setBt({ ...b, activeIdx: idx, stage: "menu" });
    } else {
      setBt({ ...b, activeIdx: idx, stage: "busy" });
      window.setTimeout(enemyTurn, 600);
    }
  };

  const doFlee = () => {
    const b = btRef.current;
    if (!b || b.stage !== "menu" || b.boss) return;
    if (Math.random() < 0.85) {
      sfx.click();
      endToWorld();
    } else {
      pushLog("Fuga fallita! Il Moreno ti blocca la strada (e il cuore).", "bad");
      setBt({ ...b, stage: "busy" });
      window.setTimeout(enemyTurn, 500);
    }
  };

  /* ---------------- minigiochi ---------------- */
  const startQuiz = () => {
    setQuiz({ q: 0, hearts: 3 });
    setPhase("quiz");
  };
  const answerQuiz = (choiceIdx: number) => {
    const qz = quiz;
    if (!qz) return;
    const correct = TRIAL_QUIZ.answers[qz.q] === choiceIdx;
    if (correct) {
      sfx.correct();
      if (qz.q + 1 >= TRIAL_QUIZ.scripts.length) {
        setQuiz(null);
        say("mico_win", () => {
          setFlag("micoDone");
          setItems((it) => [...it, "spilla"]);
          showToast("OGGETTO: SPILLA DELLA RIVOLTA — ATK party +25%");
        });
      } else {
        setQuiz({ ...qz, q: qz.q + 1 });
      }
    } else {
      sfx.wrong();
      const hearts = qz.hearts - 1;
      if (hearts <= 0) {
        setQuiz(null);
        say("mico_fail");
      } else {
        setQuiz({ ...qz, hearts });
        showToast(`RISPOSTA SBAGLIATA! Cuori rimasti: ${hearts}`);
      }
    }
  };

  const startHug = () => {
    setHug({ power: 0, running: true, done: false });
    setPhase("hug");
    hugHeldRef.current = false;
  };
  useEffect(() => {
    if (phase !== "hug" || !hug?.running || hug.done) return;
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
    const int = window.setInterval(() => {
      setHug((h) => {
        if (!h || h.done) return h;
        const next = Math.max(0, Math.min(100, h.power + (hugHeldRef.current ? 2.6 : -1.7)));
        if (next >= 100) {
          window.clearInterval(int);
          sfx.recruit();
          window.setTimeout(() => {
            setHug(null);
            say("coizio_win", () => {
              setFlag("coizioDone");
              setItems((it) => [...it, "abbraccio"]);
              showToast("OGGETTO: ABBRACCIO ETERNO — cattura +20%");
            });
          }, 450);
          return { ...h, power: 100, done: true };
        }
        if (hugHeldRef.current && Math.random() < 0.2) sfx.type();
        return { ...h, power: next };
      });
    }, 50);
    return () => {
      window.clearInterval(int);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, hug?.running, hug?.done]);

  const togglePause = () => {
    setPaused((p) => {
      const np = !p;
      pausedRef.current = np;
      engineRef.current?.setPaused(np);
      sfx.pause();
      return np;
    });
  };

  /* ================================================= RENDER */
  const activeMon = bt ? party[bt.activeIdx] : null;
  const activeSp = activeMon ? speciesById(activeMon.id) : null;
  const quest = objective(flags, capturedIds.length);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-void font-term text-bone">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0 z-[5]" />
      <div className="scanlines crt-flicker pointer-events-none absolute inset-0 z-[40] opacity-70" />
      {bt?.boss && phase === "battle" && <div className="boss-vignette" />}
      {flash && <div key={flash.key} className={`pointer-events-none absolute inset-0 z-[35] ${flash.kind === "red" ? "flash-red" : "flash-gold"}`} />}

      {/* ------------------------------ TITOLO ------------------------------ */}
      {phase === "title" && (
        <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(11,6,20,0.5),rgba(11,6,20,0.94))] px-4">
          <div className="text-toxic tracking-[0.5em] text-sm md:text-base mb-2 title-float">✠ COMP-OS v6.66 PRESENTA ✠</div>
          <h1 className="font-display text-[13vw] md:text-[7rem] leading-[0.85] font-extrabold text-center text-bone text-outline pulse-glow">
            SHIN MORENI
            <br />
            <span className="text-blood">TENSEI</span>
          </h1>
          <p className="mt-3 text-gold tracking-[0.2em] text-lg md:text-2xl font-display text-center">L'EPICA DEL MAIALE DEL MONDO</p>
          <p className="mt-1 text-dim text-base md:text-lg max-w-2xl text-center">
            Un RPG demenziale: esplora Morenopoli, combatti a turni, supera prove di ideologia e cattura i Moreni...
            <span className="text-toxic"> solo alla fine, offrendo loro i morenini giusti.</span>
          </p>
          <button
            onClick={startGame}
            className="btn-hard mt-6 px-10 py-4 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl md:text-3xl tracking-widest"
          >
            ▶ INIZIA LA PROFEZIA [INVIO]
          </button>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm md:text-base max-w-4xl w-full">
            <div className="border-2 border-edge bg-panel/85 p-3">
              <div className="text-toxic font-display text-lg mb-1">ESPLORA</div>
              <div className="text-dim">WASD / frecce per girare il mondo. L'anello dorato segna l'obiettivo. I Moreni vagano nelle zone: toccali per combatterli.</div>
            </div>
            <div className="border-2 border-edge bg-panel/85 p-3">
              <div className="text-blood font-display text-lg mb-1">COMBATTI</div>
              <div className="text-dim">Battaglie a turni: Attacca, offri un morenino per convincere, cambia Moreno, fuggi. [E] per parlare con i capi.</div>
            </div>
            <div className="border-2 border-edge bg-panel/85 p-3">
              <div className="text-gold font-display text-lg mb-1">CATTURA</div>
              <div className="text-dim">Prima convinci il Moreno col suo gusto, poi offri di nuovo: più è ammorbidito, più la cattura riesce. 8 amicizie per la Spada dell'Amore.</div>
            </div>
          </div>
          <div className="mt-4 text-dim text-xs tracking-widest">[P] PAUSA · [M] AUDIO · CONSIGLIATE LE CUFFIE: I MORENI GRUFOLANO IN 8-BIT</div>
        </div>
      )}

      {/* ------------------------------ DIALOGO ------------------------------ */}
      {phase === "dialogue" && <DialogueBox lines={dlgLines} onDone={() => afterDlgRef.current?.()} />}

      {/* ------------------------------ BANNER ------------------------------ */}
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

      {/* ------------------------------ HUD MONDO ------------------------------ */}
      {phase === "world" && (
        <>
          <div className="absolute top-3 left-3 z-[15] pointer-events-none">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2 w-[min(360px,80vw)]">
              <div className="text-toxic text-xs tracking-[0.3em]">COMP-OS v6.66 // {zone ? zone.name : "WILDERNESS"}</div>
              <div className="font-display text-xl md:text-2xl leading-tight text-bone">{zone?.name ?? "SENTIERO DI MORENOPOLI"}</div>
              <div className="text-dim text-sm italic">{zone?.tagline ?? "Il crunch tornerà. Forse."}</div>
              <div className="mt-1.5 border-t border-edge pt-1.5">
                <div className="text-gold text-[11px] tracking-[0.25em]">OBIETTIVO DELLA PROFEZIA</div>
                <div className="text-bone text-base leading-tight">{quest}</div>
              </div>
              <div className="mt-1 text-gold text-lg leading-none">
                CARISMA: <span className="tabular-nums">{score}</span>
              </div>
            </div>
          </div>

          <div className="absolute top-3 right-3 z-[15] pointer-events-none">
            <div className="border-2 border-edge bg-panel/85 px-2 py-2 w-[210px]">
              <div className="text-dim text-[10px] tracking-[0.3em] text-right mb-1">PARTY ({party.length}) · AMICI {capturedIds.length}/8</div>
              <div className="flex flex-col gap-1">
                {party.slice(0, 6).map((m) => {
                  const sp = speciesById(m.id);
                  return (
                    <div key={m.uid} className="flex items-center gap-1.5">
                      <div className="w-7 h-7 grid place-items-center border" style={{ borderColor: hexCss(sp.accentColor), background: "#160b26" }}>
                        <MorenoFace sp={sp} size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] leading-none text-bone truncate">{sp.name}</div>
                        <div className="h-1.5 mt-0.5 bg-[#120a20] border border-edge">
                          <div className="h-full" style={{ width: `${(m.hp / m.maxHp) * 100}%`, background: m.hp / m.maxHp > 0.4 ? "#4dffa6" : "#ff2e5f" }} />
                        </div>
                      </div>
                      <div className="text-[11px] tabular-nums text-dim">{m.hp}</div>
                    </div>
                  );
                })}
              </div>
              {items.length > 0 && (
                <div className="mt-1.5 border-t border-edge pt-1">
                  {items.map((it) => (
                    <div key={it} className="text-[11px] text-gold leading-tight" title={ITEMS[it].desc}>
                      ◆ {ITEMS[it].name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[15] pointer-events-none text-center">
            {nearId && (
              <div className="pop-in border-2 border-gold bg-panel/90 px-5 py-2 font-display text-xl text-gold tracking-wide shadow-[0_0_24px_rgba(255,201,77,0.35)]">
                [E] {nearId === "monument" ? "ESAMINA IL GRANDE MORENINO" : `PARLA CON ${nearId === "don" ? "DON MORENO" : nearId === "cinghia" ? "CINGHIA ALE" : nearId === "mico" ? "MICO NOSCA" : nearId === "coizio" ? "COIZIO" : "GINO SATRI"}`}
              </div>
            )}
            {!nearId && (
              <div className="text-dim text-sm tracking-widest bg-[rgba(11,6,20,0.55)] px-3 py-1 inline-block border border-edge/60">
                WASD / FRECCE — MUOVI · TOCCA I MORENI SELVATICI PER COMBATTERE
              </div>
            )}
          </div>
        </>
      )}

      {/* ------------------------------ BATTAGLIA ------------------------------ */}
      {phase === "battle" && bt && activeMon && activeSp && (
        <>
          {/* nemico */}
          <div className="absolute top-3 right-3 z-[15] w-[min(400px,86vw)]">
            <div className={`border-2 bg-panel/90 px-3 py-2 ${bt.boss ? "border-blood" : "border-edge"}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className={`font-display text-xl md:text-2xl leading-tight ${bt.boss ? "text-blood" : "text-bone"}`}>{bt.enemySp.name}</div>
                  <div className="text-dim text-sm">{bt.enemySp.title}</div>
                </div>
                {bt.convinced && (
                  <div className="flex items-center gap-1 border border-toxic px-2 py-1 text-toxic text-xs chip-pop">
                    <HeartSvg size={13} /> CONVINTO
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-4 border-2 border-edge bg-[#120a20] overflow-hidden">
                  <div
                    className="h-full transition-[width] duration-300"
                    style={{ width: `${(bt.enemyHp / bt.enemyMax) * 100}%`, background: "linear-gradient(90deg,#ff2e5f,#ff7b3d)" }}
                  />
                </div>
                <span className="tabular-nums text-lg">
                  {bt.enemyHp}/{bt.enemyMax}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-dim">
                VOGLIA:
                <span className="flex items-center gap-1.5 border px-2 py-0.5" style={{ borderColor: FLAVORS[bt.enemySp.favorite].css, color: FLAVORS[bt.enemySp.favorite].css }}>
                  <CookieIcon css={FLAVORS[bt.enemySp.favorite].css} size={18} /> MORENINO AL {FLAVORS[bt.enemySp.favorite].name}
                </span>
                {bt.isMaiale && <span className="text-blood">— NON SI CATTURA: SI PURIFICA</span>}
              </div>
            </div>
          </div>

          {/* log + turno */}
          <div className="absolute top-3 left-3 z-[15] pointer-events-none w-[min(340px,52vw)]">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2">
              <div className="text-toxic text-xs tracking-[0.3em] mb-1">
                REGISTRO COMP {bt.boss ? "// ALLARME CAPO" : ""} · CARISMA {score}
              </div>
              {bt.log.map((l) => (
                <div key={l.id} className={`text-sm md:text-base leading-tight truncate ${l.kind === "good" ? "text-toxic" : l.kind === "bad" ? "text-blood" : "text-dim"}`}>
                  &gt; {l.text}
                </div>
              ))}
              <div className="mt-1 font-display text-lg text-gold">
                {bt.stage === "menu" ? "— TOCCA A TE —" : bt.stage === "enemy" || bt.stage === "busy" ? "— IL NEMICO AGISCE... —" : "— SCHIERA UN MORENO! —"}
              </div>
            </div>
          </div>

          {/* attivo + comandi */}
          <div className="absolute bottom-3 right-3 z-[15] w-[min(480px,92vw)]">
            <div className="border-2 border-edge bg-panel/90 px-3 py-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 grid place-items-center border-2" style={{ borderColor: hexCss(activeSp.accentColor), background: "#160b26" }}>
                  <MorenoFace sp={activeSp} size={44} />
                </div>
                <div className="flex-1">
                  <div className="font-display text-xl leading-tight" style={{ color: hexCss(activeSp.accentColor) }}>
                    {activeSp.name} <span className="text-dim text-sm font-term">ATK {activeMon.atk}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3.5 border-2 border-edge bg-[#120a20] overflow-hidden">
                      <div
                        className="h-full transition-[width] duration-300"
                        style={{ width: `${(activeMon.hp / activeMon.maxHp) * 100}%`, background: activeMon.hp / activeMon.maxHp > 0.4 ? "#4dffa6" : "#ff2e5f" }}
                      />
                    </div>
                    <span className="tabular-nums text-base">
                      {activeMon.hp}/{activeMon.maxHp}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={doAttack} disabled={bt.stage !== "menu"} className="btn-hard flex items-center justify-center gap-2 px-2 py-2.5 border-2 border-blood bg-[#5c0f24] font-display text-lg md:text-xl tracking-wide text-[#ffe6ec]">
                  <svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 21 L10 14 M14 10 L21 3 L18 10 L10 18 Z" stroke="#ff2e5f" strokeWidth="2.4" fill="none" /></svg>
                  ATTACCA <span className="text-xs font-term opacity-70">[1]</span>
                </button>
                <button
                  onClick={doOffer}
                  disabled={bt.stage !== "menu" || bt.isMaiale}
                  className="btn-hard flex items-center justify-center gap-2 px-2 py-2.5 border-2 font-display text-lg md:text-xl tracking-wide text-[#fff6ea]"
                  style={{ borderColor: FLAVORS[bt.enemySp.favorite].css, background: FLAVORS[bt.enemySp.favorite].cssDark }}
                >
                  <CookieIcon css={FLAVORS[bt.enemySp.favorite].css} />
                  {bt.convinced ? "OFFRI E CATTURA!" : "OFFRI MORENINO"} <span className="text-xs font-term opacity-70">[2]</span>
                </button>
                <button onClick={() => setPicker({ forced: false })} disabled={bt.stage !== "menu"} className="btn-hard flex items-center justify-center gap-2 px-2 py-2.5 border-2 border-toxic bg-[#0c3d28] font-display text-lg md:text-xl tracking-wide text-[#d8fff0]">
                  <MorenoFace sp={activeSp} size={22} /> MORENO <span className="text-xs font-term opacity-70">[3]</span>
                </button>
                <button onClick={doFlee} disabled={bt.stage !== "menu" || bt.boss} className="btn-hard flex items-center justify-center gap-2 px-2 py-2.5 border-2 border-edge bg-panel2 font-display text-lg md:text-xl tracking-wide text-dim">
                  FUGGI <span className="text-xs font-term opacity-70">[4]</span>
                </button>
              </div>
            </div>
          </div>

          {/* picker party */}
          {picker && (
            <div className="absolute inset-0 z-[32] grid place-items-center bg-[rgba(5,2,10,0.78)]">
              <div className="border-2 border-toxic bg-panel px-6 py-5 w-[min(430px,92vw)]">
                <div className="font-display text-2xl text-toxic mb-1">{picker.forced ? "SCHIERA UN ALTRO MORENO!" : "QUALE MORENO SCENDI IN CAMPO?"}</div>
                <div className="text-dim text-sm mb-3">{picker.forced ? "Il tuo Moreno è KO. Presto!" : "Cambiare Moreno consuma il turno."}</div>
                <div className="flex flex-col gap-2">
                  {party.map((m, i) => {
                    const sp = speciesById(m.id);
                    const dead = m.hp <= 0;
                    const current = i === bt.activeIdx;
                    return (
                      <button
                        key={m.uid}
                        disabled={dead || current}
                        onClick={() => chooseSwitch(i)}
                        className="btn-hard flex items-center gap-2 px-3 py-2 border-2 text-left"
                        style={{ borderColor: dead ? "#3a2160" : hexCss(sp.accentColor), background: "#160b26", opacity: dead ? 0.4 : 1 }}
                      >
                        <MorenoFace sp={sp} size={34} />
                        <div className="flex-1">
                          <div className="font-display text-lg leading-none text-bone">
                            {sp.name} {current && <span className="text-toxic text-sm">IN CAMPO</span>} {dead && <span className="text-blood text-sm">KO</span>}
                          </div>
                          <div className="h-1.5 mt-1 bg-[#120a20] border border-edge w-full">
                            <div className="h-full" style={{ width: `${(m.hp / m.maxHp) * 100}%`, background: "#4dffa6" }} />
                          </div>
                        </div>
                        <div className="tabular-nums text-dim text-sm">
                          {m.hp}/{m.maxHp}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!picker.forced && (
                  <button onClick={() => setPicker(null)} className="btn-hard mt-3 w-full px-4 py-2 border-2 border-edge bg-panel2 text-dim font-display text-lg">
                    ANNULLA
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ------------------------------ QUIZ MICO ------------------------------ */}
      {phase === "quiz" && quiz && (
        <div className="absolute inset-0 z-[24] grid place-items-center bg-[rgba(11,6,20,0.88)] px-4">
          <div className="border-2 border-[#ffe066] bg-panel px-6 py-5 w-[min(680px,94vw)] shadow-[0_0_40px_rgba(255,224,102,0.2)]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-display text-2xl md:text-3xl text-[#ffe066]">LA RIVOLTA SOCIALE — PROVA DI IDEOLOGIA</div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <HeartSvg key={i} size={20} on={i < quiz.hearts} />
                ))}
              </div>
            </div>
            <div className="text-dim text-sm mb-3">
              DOMANDA {quiz.q + 1} DI {TRIAL_QUIZ.scripts.length} · Mico Nosca ti fissa con speranza rivoluzionaria
            </div>
            <div className="dlg-text mb-4" style={{ minHeight: "auto" }}>
              {SCRIPTS[TRIAL_QUIZ.scripts[quiz.q]][0].text}
            </div>
            <div className="flex flex-col gap-2">
              {SCRIPTS[TRIAL_QUIZ.scripts[quiz.q]][0].choices?.map((c, i) => (
                <button
                  key={i}
                  onClick={() => answerQuiz(i)}
                  className="btn-hard text-left px-4 py-2.5 border-2 border-edge bg-panel2 text-bone font-term text-lg hover:border-[#ffe066] hover:text-[#ffe066] transition-colors"
                >
                  ▸ {c}
                </button>
              ))}
            </div>
            <div className="mt-3 text-dim text-xs tracking-widest">SBAGLIARE FA MALE AL CUORE. LETTERALMENTE.</div>
          </div>
        </div>
      )}

      {/* ------------------------------ ABBRACCIO COIZIO ------------------------------ */}
      {phase === "hug" && hug && (
        <div className="absolute inset-0 z-[24] grid place-items-center bg-[rgba(11,6,20,0.88)] px-4">
          <div className="border-2 border-[#ff7fb2] bg-panel px-6 py-6 w-[min(620px,94vw)] text-center shadow-[0_0_50px_rgba(255,127,178,0.25)]">
            <div className="font-display text-2xl md:text-3xl text-[#ff7fb2]">L'ABBRACCIO ETERNO</div>
            <div className="text-dim text-sm mt-1 mb-4">
              Coizio allarga le braccia. Riempilo di contatto fisico: <span className="text-[#ff7fb2]">TIENI PREMIUTO SPAZIO</span>. Se molli, il cuore si sgonfia.
            </div>
            <div
              className="inline-block transition-transform duration-100"
              style={{ transform: `scale(${0.8 + (hug.power / 100) * 0.9})` }}
            >
              <HeartSvg size={90} on={hug.power > 5} />
            </div>
            <div className="mt-4 h-7 border-2 border-edge bg-[#120a20] overflow-hidden">
              <div
                className="h-full transition-[width] duration-100"
                style={{ width: `${hug.power}%`, background: "linear-gradient(90deg,#ff4f9a,#ff7fb2,#ffd9e8)" }}
              />
            </div>
            <div className="mt-2 tabular-nums text-2xl text-[#ff7fb2]">{Math.floor(hug.power)}%</div>
            {hug.done && <div className="pop-in mt-2 font-display text-2xl text-gold">ABBRACCIO COMPLETATO. IL MONDO È GUARITO (UN PO').</div>}
          </div>
        </div>
      )}

      {/* ------------------------------ PAUSA ------------------------------ */}
      {paused && (phase === "world" || phase === "battle") && (
        <div className="absolute inset-0 z-[45] grid place-items-center bg-[rgba(5,2,10,0.82)]">
          <div className="border-2 border-toxic bg-panel px-10 py-8 text-center shadow-[0_0_40px_rgba(77,255,166,0.25)]">
            <div className="font-display text-5xl text-toxic mb-1">PAUSA</div>
            <div className="text-dim mb-5">I MORENI ASPETTANO. GRUFOLANDO.</div>
            <button onClick={togglePause} className="btn-hard block w-full px-8 py-3 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-2xl tracking-widest mb-3">
              RIPRENDI [P]
            </button>
            <button
              onClick={() => {
                setPaused(false);
                pausedRef.current = false;
                engineRef.current?.setPaused(false);
                engineRef.current?.endBattle();
                setBt(null);
                engineRef.current?.attractMode(true);
                setPhase("title");
              }}
              className="btn-hard block w-full px-8 py-2 bg-panel2 border-2 border-edge text-dim font-display text-xl tracking-widest"
            >
              TITOLI DI TESTA
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------ GAME OVER ------------------------------ */}
      {phase === "gameover" && (
        <div className="absolute inset-0 z-[30] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(40,4,16,0.8),rgba(8,2,6,0.95))] px-4">
          <div className="font-display text-[11vw] md:text-[6rem] leading-none text-blood text-outline pulse-glow text-center">
            SEI STATO
            <br />
            SBRICIOLATO
          </div>
          <div className="mt-4 stamp-in border-4 border-blood px-6 py-2 font-display text-xl md:text-2xl text-blood tracking-widest bg-[rgba(20,2,8,0.8)] text-center">
            «{defeatInfo}»
          </div>
          <div className="mt-4 text-gold text-xl">
            CARISMA: <span className="tabular-nums">{score}</span> · AMICI: {capturedIds.length}/8
          </div>
          <button onClick={respawn} className="btn-hard mt-6 px-8 py-3 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl tracking-widest">
            DON MORENO TI RACCOGLIE — RIPARTI
          </button>
        </div>
      )}

      {/* ------------------------------ VITTORIA ------------------------------ */}
      {phase === "victory" && (
        <div className="absolute inset-0 z-[30] overflow-y-auto bg-[radial-gradient(ellipse_at_center,rgba(20,12,4,0.75),rgba(8,5,2,0.95))]">
          <div className="min-h-full flex flex-col items-center justify-center py-8 px-4">
            <div className="text-gold tracking-[0.5em] text-sm mb-2">IL MAIALE È PURIFICATO · IL CRUNCH È TORNATO</div>
            <div className="font-display text-[9vw] md:text-[5rem] leading-[0.9] text-center text-gold text-outline title-float">
              MORENOPOLI
              <br />
              RISORGE
            </div>
            <div className="mt-2 text-toxic text-2xl">
              CARISMA FINALE: <span className="tabular-nums">{score}</span>
            </div>
            <div className="mt-6 w-full max-w-3xl border-2 border-edge bg-panel/85 p-4">
              <div className="font-display text-2xl text-gold mb-2 text-center">— TITOLI DI CODA — IL CAST —</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                {CAST.map((c) => (
                  <div key={c.name} className="flex gap-2 text-base leading-tight py-0.5 border-b border-edge/40">
                    <span className="text-bone font-bold whitespace-nowrap">{c.name}</span>
                    <span className="text-dim italic">{c.role}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center text-dim text-sm italic">
                «Nessun morenino è stato lasciato nel cassetto durante le riprese. Il Male del Mondo ringrazia per la visibilità.»
              </div>
            </div>
            <div className="mt-5 grid grid-cols-4 md:grid-cols-8 gap-2.5 w-full max-w-4xl">
              {SPECIES.filter((s) => s.id !== "maledelmondo" && s.id !== "maialedelmondo").map((sp) => {
                const owned = capturedIds.includes(sp.id);
                return (
                  <div key={sp.id} className="roster-card" style={{ "--pc": owned ? hexCss(sp.accentColor) : "#2a1b45", opacity: owned ? 1 : 0.35 } as React.CSSProperties}>
                    <MorenoFace sp={sp} size={54} />
                    <div className="font-display text-[11px] mt-1 leading-tight" style={{ color: owned ? hexCss(sp.accentColor) : "#4a2b6e" }}>
                      {sp.name}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                sfx.click();
                engineRef.current?.attractMode(true);
                setPhase("title");
              }}
              className="btn-hard mt-7 px-10 py-3 bg-gold border-2 border-[#fff0d1] text-[#241503] font-display text-2xl tracking-widest"
            >
              GIOCA ANCORA
            </button>
          </div>
        </div>
      )}

      {/* audio toggle */}
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
