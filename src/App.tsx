import React, { useEffect, useRef, useState } from "react";
import { MoreniEngine } from "./game/engine";
import { initAudio, sfx } from "./game/audio";
import {
  BOSSES,
  CHAPTERS,
  FLAVOR_LIST,
  FLAVORS,
  PERKS,
  PROLOGUE,
  SPECIES,
  buildDemandText,
  pick,
  type DialogueLine,
  type FlavorId,
  type SpeciesDef,
} from "./game/data";

type Phase = "title" | "dialogue" | "play" | "endless" | "gameover" | "victory";

const hexCss = (n: number) => "#" + n.toString(16).padStart(6, "0");

function speciesById(id: string): SpeciesDef | null {
  if (BOSSES[id]) return BOSSES[id];
  return SPECIES.find((s) => s.id === id) ?? null;
}

/* ------------------------------------------- ritratti SVG procedurali */
function MorenoFace({ sp, size = 72 }: { sp: SpeciesDef; size?: number }) {
  const body = hexCss(sp.bodyColor);
  const belly = hexCss(sp.bellyColor);
  const acc = hexCss(sp.accentColor);
  const p = sp.parts;
  const isBoss = sp.id === "jr" || sp.id === "morenivoth";
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

/* ------------------------------------------- dialogo JRPG con typewriter */
function DialogueBox({ lines, onDone }: { lines: DialogueLine[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const line = lines[Math.min(idx, lines.length - 1)];
  const full = line.text;

  useEffect(() => setChars(0), [idx]);
  useEffect(() => {
    if (chars < full.length) {
      const t = window.setTimeout(() => setChars((c) => c + 1), 15);
      return () => window.clearTimeout(t);
    }
  }, [chars, full]);

  const advance = () => {
    sfx.ui();
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
        <div className="dlg-hint">
          [SPAZIO / CLICK] {chars < full.length ? "COMPLETA" : idx + 1 < lines.length ? "CONTINUA ▼" : "AVANTI ▼"}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------- icone Press Turn */
function TurnDiamond({ state }: { state: "full" | "empty" }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" className={state === "full" ? "drop-shadow-[0_0_7px_rgba(255,46,95,0.9)]" : ""}>
      <path
        d="M12 2 L22 12 L12 22 L2 12 Z"
        fill={state === "full" ? "#ff2e5f" : "rgba(30,16,51,0.75)"}
        stroke={state === "full" ? "#ffd1dd" : "#4a2b6e"}
        strokeWidth="1.6"
      />
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

/* ================================================================ APP */
interface CurState {
  species: SpeciesDef;
  flavor: FlavorId;
  qty: number;
  demandIdx: number;
  turns: number;
  maxTurns: number;
  msLeft: number;
  msTotal: number;
  chapter: number; // -1 = endless
  boss: boolean;
  endless: boolean;
  busy: boolean;
  forgiveUsed: boolean;
  errors: number;
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MoreniEngine | null>(null);

  const [phase, setPhase] = useState<Phase>("title");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [party, setParty] = useState<string[]>([]);
  const [recruits, setRecruits] = useState(0);
  const [dlgLines, setDlgLines] = useState<DialogueLine[]>([]);
  const [banner, setBanner] = useState<{ kicker: string; title: string; boss: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [bossActive, setBossActive] = useState(false);
  const [demand, setDemand] = useState("");
  const [ms, setMs] = useState(0);
  const [turns, setTurns] = useState(3);
  const [maxTurns, setMaxTurns] = useState(3);
  const [chips, setChips] = useState<{ hit: boolean; flavor: FlavorId }[]>([]);
  const [flash, setFlash] = useState<{ kind: "red" | "gold"; key: number } | null>(null);
  const [log, setLog] = useState<{ id: number; text: string; kind: "info" | "good" | "bad" }[]>([]);
  const [defeatInfo, setDefeatInfo] = useState<{ reason: string; line: string }>({ reason: "", line: "" });

  const curRef = useRef<CurState | null>(null);
  const pausedRef = useRef(false);
  const phaseRef = useRef<Phase>("title");
  const tickIntRef = useRef<number | null>(null);
  const logIdRef = useRef(0);
  const lastTickRef = useRef(0);
  const barWrapRef = useRef<HTMLDivElement>(null);
  const afterDlgRef = useRef<(() => void) | null>(null);
  const bannerTRef = useRef<number | null>(null);
  const toastTRef = useRef<number | null>(null);

  const partyRef = useRef<string[]>([]);
  useEffect(() => {
    partyRef.current = party;
  }, [party]);
  const hasPerk = (id: string) => partyRef.current.includes(id);

  const pushLog = (text: string, kind: "info" | "good" | "bad" = "info") => {
    setLog((l) => [...l.slice(-3), { id: ++logIdRef.current, text, kind }]);
  };

  const doFlash = (kind: "red" | "gold") => setFlash({ kind, key: Date.now() });

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

  /* ---------------- engine ---------------- */
  useEffect(() => {
    const eng = new MoreniEngine(mountRef.current!);
    engineRef.current = eng;
    eng.start();
    return () => {
      eng.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.attractMode(!(phase === "play" || phase === "endless"));
    phaseRef.current = phase;
  }, [phase]);

  /* ---------------- timer ---------------- */
  const stopTimer = () => {
    if (tickIntRef.current !== null) {
      window.clearInterval(tickIntRef.current);
      tickIntRef.current = null;
    }
  };

  const tickTimer = () => {
    if (pausedRef.current) return;
    const cur = curRef.current;
    if (!cur || cur.busy) return;
    cur.msLeft -= 100;
    setMs(Math.max(0, cur.msLeft));
    const pct = Math.max(0, cur.msLeft) / cur.msTotal;
    if (barWrapRef.current) {
      const bar = barWrapRef.current.querySelector(".timer-fill") as HTMLElement | null;
      if (bar) bar.style.width = `${pct * 100}%`;
      barWrapRef.current.classList.toggle("low-timer", pct <= 0.25 && pct > 0);
    }
    if (cur.msLeft <= 2000 && cur.msLeft > 0) {
      const step = Math.ceil(cur.msLeft / 500);
      if (step !== lastTickRef.current) {
        lastTickRef.current = step;
        sfx.tick();
      }
    }
    if (cur.msLeft <= 0) {
      stopTimer();
      cur.busy = true;
      const line = pick(cur.species.timeoutLines);
      pushLog("SCADENZA! I MORENINI SONO DIVENTATI MOLLI!", "bad");
      setDefeatInfo({ reason: "SCADENZA MORENINI", line });
      sfx.gameover();
      doFlash("red");
      engineRef.current?.setBossMode(false);
      engineRef.current?.sulk(() => setPhase("gameover"));
    }
  };

  const startTimer = () => {
    stopTimer();
    lastTickRef.current = 0;
    tickIntRef.current = window.setInterval(tickTimer, 100);
  };

  useEffect(() => () => stopTimer(), []);

  /* ---------------- flusso storia ---------------- */
  const setDialogue = (lines: DialogueLine[], after: () => void) => {
    afterDlgRef.current = after;
    setDlgLines(lines);
    setPhase("dialogue");
  };

  const beginStory = () => {
    setScore(0);
    setParty([]);
    setRecruits(0);
    setLog([]);
    setDialogue(PROLOGUE, () => runChapter(0));
  };

  const runChapter = (i: number) => {
    const ch = CHAPTERS[i];
    setDialogue(ch.intro, () => startChapterPlay(i));
  };

  const startChapterPlay = (i: number) => {
    const ch = CHAPTERS[i];
    const sp = speciesById(ch.speciesId)!;
    const timerBonus = hasPerk("morenozzo") ? 2000 : 0;
    let t = ch.turns;
    if (hasPerk("baron") && Math.random() < 0.3) {
      t += 1;
      pushLog("CERVELLO DI SCORTA: +1 Press Turn, GRRR!", "good");
      sfx.power();
    }
    curRef.current = {
      species: sp,
      flavor: ch.flavor,
      qty: ch.qty,
      demandIdx: 0,
      turns: t,
      maxTurns: t,
      msLeft: ch.timerMs + timerBonus,
      msTotal: ch.timerMs + timerBonus,
      chapter: i,
      boss: !!ch.boss,
      endless: false,
      busy: false,
      forgiveUsed: false,
      errors: 0,
    };
    setMs(ch.timerMs + timerBonus);
    setTurns(t);
    setMaxTurns(t);
    setChips(Array.from({ length: ch.qty }, () => ({ hit: false, flavor: ch.flavor })));
    const demandTxt = buildDemandText(i + (ch.boss ? 8 : 0), ch.flavor, ch.qty);
    setDemand(demandTxt);
    setBossActive(!!ch.boss);
    showBanner(ch.boss ? (i === CHAPTERS.length - 1 ? "BOSS FINALE" : "MINI-BOSS") : `CAPITOLO ${ch.roman}`, ch.title, !!ch.boss);
    setPhase("play");
    engineRef.current?.spawnMoreno(sp, ch.qty, ch.flavor);
    if (ch.boss) {
      engineRef.current?.setBossMode(true);
      sfx.boss();
    } else {
      sfx.spawn();
    }
    pushLog(`${sp.name}: «${demandTxt}»`, "info");
    startTimer();
  };

  /* ---------------- endless (NG+) ---------------- */
  const beginEndless = () => {
    setPhase("endless");
    setRecruits(0);
    pushLog("MODALITÀ INFINITA (NG+): il party resta con te!", "good");
    sfx.win();
    endlessRound(0);
  };

  const endlessRound = (round: number) => {
    const sp = pick(SPECIES);
    const qty = Math.min(2 + Math.floor(round / 2), 5);
    const flavor = pick(FLAVOR_LIST);
    const timerBonus = hasPerk("morenozzo") ? 2000 : 0;
    let t = 3;
    if (hasPerk("baron") && Math.random() < 0.3) t += 1;
    const timerMs = Math.max(5500, 9500 + round * 350 - recruits * 300) + timerBonus;
    curRef.current = {
      species: sp,
      flavor,
      qty,
      demandIdx: 0,
      turns: t,
      maxTurns: t,
      msLeft: timerMs,
      msTotal: timerMs,
      chapter: -1,
      boss: false,
      endless: true,
      busy: false,
      forgiveUsed: false,
      errors: 0,
    };
    setMs(timerMs);
    setTurns(t);
    setMaxTurns(t);
    const demandTxt = buildDemandText(round + 4, flavor, qty);
    setChips(Array.from({ length: qty }, () => ({ hit: false, flavor })));
    setDemand(demandTxt);
    setBossActive(false);
    setPhase("endless");
    engineRef.current?.spawnMoreno(sp, qty, flavor);
    sfx.spawn();
    pushLog(`ROUND ${round + 1} — ${sp.name}: «${demandTxt}»`, "info");
    startTimer();
  };

  /* ---------------- offerta ---------------- */
  const onOffer = (flavor: FlavorId) => {
    const cur = curRef.current;
    if (!cur || cur.busy || pausedRef.current) return;
    const ph = phaseRef.current;
    if (ph !== "play" && ph !== "endless") return;
    const correct = flavor === cur.flavor;
    if (correct) {
      engineRef.current?.feed(flavor);
      let newIdx = cur.demandIdx + 1;
      if (hasPerk("morenilla") && Math.random() < 0.25 && newIdx < cur.qty) {
        newIdx += 1;
        window.setTimeout(() => pushLog("*SNIFF* PIANTO DIETETICO: l'offerta vale doppio!", "good"), 350);
        sfx.power();
      }
      newIdx = Math.min(newIdx, cur.qty);
      for (let k = cur.demandIdx + 1; k <= newIdx; k++) engineRef.current?.markFulfilled(k);
      cur.demandIdx = newIdx;
      setChips((c) => c.map((ch, i) => (i < newIdx ? { ...ch, hit: true } : ch)));
      if (newIdx >= cur.qty) {
        stopTimer();
        recruitFlow(cur);
      } else {
        sfx.ok();
        setScore((s) => s + 25);
      }
    } else {
      cur.errors++;
      if (hasPerk("morenello") && !cur.forgiveUsed) {
        cur.forgiveUsed = true;
        pushLog("CORNA PARAFULMINE: Morenello fa finta di niente!", "good");
        sfx.power();
        engineRef.current?.shake(0.25);
        return;
      }
      cur.turns--;
      setTurns(cur.turns);
      const penalty = cur.boss ? 3000 : hasPerk("morenito") ? 2500 : 5000;
      cur.msLeft = Math.max(400, cur.msLeft - penalty);
      setMs(cur.msLeft);
      sfx.error();
      engineRef.current?.shake(0.5);
      doFlash("red");
      pushLog(`${cur.species.name} RIFIUTA IL GUSTO! −1 Press Turn, −${penalty / 1000}s`, "bad");
      if (cur.turns <= 0) {
        stopTimer();
        cur.busy = true;
        setDefeatInfo({ reason: "PRESS TURN ESAURITI", line: pick(cur.species.angryLines) });
        sfx.gameover();
        doFlash("red");
        engineRef.current?.setBossMode(false);
        engineRef.current?.angry(() => setPhase("gameover"));
      }
    }
  };

  const recruitFlow = (cur: CurState) => {
    cur.busy = true;
    sfx.ok();
    engineRef.current?.recruit(() => {
      let pts = 150 + cur.qty * 40 + Math.round(cur.msLeft / 100);
      if (cur.boss) pts *= 2;
      if (hasPerk("morenilde")) pts = Math.round(pts * 1.15);
      if (hasPerk("tamarro")) pts += 75;
      if (hasPerk("reMorenone") && cur.errors === 0 && !cur.endless) pts += 150;
      setScore((s) => s + pts);
      setRecruits((r) => r + 1);
      doFlash("gold");
      pushLog(`${cur.species.name} RECLUTATO! +${pts} punti`, "good");

      if (cur.endless) {
        sfx.win();
        engineRef.current?.setBossMode(false);
        endlessRound(recruits);
        return;
      }

      const ch = CHAPTERS[cur.chapter];
      const isFinal = cur.chapter === CHAPTERS.length - 1;
      engineRef.current?.setBossMode(false);
      setBossActive(false);
      const afterOutro = () => {
        if (isFinal) {
          sfx.win();
          setPhase("victory");
        } else {
          if (PERKS[cur.species.id] && !partyRef.current.includes(cur.species.id)) {
            setParty((p) => [...p, cur.species.id]);
            showToast(`PERK SBLOCCATO: ${PERKS[cur.species.id].name} — ${PERKS[cur.species.id].desc}`);
          }
          sfx.win();
          runChapter(cur.chapter + 1);
        }
      };
      setDialogue(ch.outro, afterOutro);
    });
  };

  /* ---------------- tastiera ---------------- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "m" || e.key === "M") {
        setMuted((m) => {
          sfx.muted = !m;
          return !m;
        });
        return;
      }
      if (phaseRef.current === "dialogue") return; // lo spazio è del dialogo
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (phaseRef.current === "play" || phaseRef.current === "endless") togglePause();
        return;
      }
      if (phaseRef.current === "title" && (e.code === "Space" || e.code === "Enter")) {
        startFromTitle();
        return;
      }
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx >= 0 && !pausedRef.current) onOffer(FLAVOR_LIST[idx]);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const startFromTitle = () => {
    initAudio();
    sfx.ui();
    engineRef.current?.setBossMode(false);
    beginStory();
  };

  const togglePause = () => {
    setPaused((p) => {
      const np = !p;
      pausedRef.current = np;
      engineRef.current?.setPaused(np);
      sfx.ui();
      return np;
    });
  };

  /* ---------------- render ---------------- */
  const cur = curRef.current;
  const inBattle = phase === "play" || phase === "endless";
  const chapterDef = cur && !cur.endless && cur.chapter >= 0 ? CHAPTERS[cur.chapter] : null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-void font-term text-bone">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="vignette pointer-events-none absolute inset-0 z-[5]" />
      <div className="scanlines crt-flicker pointer-events-none absolute inset-0 z-[40] opacity-70" />
      {bossActive && inBattle && <div className="boss-vignette" />}

      {flash && (
        <div
          key={flash.key}
          className={`pointer-events-none absolute inset-0 z-[35] ${flash.kind === "red" ? "flash-red" : "flash-gold"}`}
        />
      )}

      {/* ================================ TITOLO ================================ */}
      {phase === "title" && (
        <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(11,6,20,0.55),rgba(11,6,20,0.93))]">
          <div className="text-toxic tracking-[0.5em] text-sm md:text-base mb-2 title-float">✠ COMP-OS v6.66 PRESENTA ✠</div>
          <h1 className="font-display text-[13vw] md:text-[7.5rem] leading-[0.85] font-extrabold text-center text-bone text-outline pulse-glow">
            SHIN MORENI
            <br />
            <span className="text-blood">TENSEI</span>
          </h1>
          <p className="mt-3 text-gold tracking-[0.25em] text-lg md:text-2xl font-display">
            LA PROFEZIA DEGLI OTTO CROCCANTI
          </p>
          <p className="mt-1 text-dim text-base md:text-lg max-w-xl text-center px-4">
            Un RPG demenziale in 9 capitoli + un finale fradicio. Offri morenini. Recluta Moreni. Ridai il crunch al mondo.
          </p>

          <button
            onClick={startFromTitle}
            className="btn-hard mt-7 px-10 py-4 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl md:text-3xl tracking-widest"
          >
            ▶ INIZIA LA PROFEZIA [INVIO]
          </button>

          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm md:text-base max-w-3xl px-4 w-full">
            <div className="border-2 border-edge bg-panel/80 p-3">
              <div className="text-toxic font-display text-lg mb-1">COME SI GIOCA</div>
              <ul className="text-dim space-y-0.5">
                <li>→ Ogni Moreno pretende N morenini di un gusto preciso</li>
                <li>→ Tasti <span className="text-bone">1-4</span> o pulsanti per offrire il gusto giusto</li>
                <li>→ Errore = −1 Press Turn e −5s dalla scadenza</li>
                <li>→ Recluta tutti gli Otto Croccanti, poi affronta IL FRADICIO</li>
              </ul>
            </div>
            <div className="border-2 border-edge bg-panel/80 p-3">
              <div className="text-toxic font-display text-lg mb-1">COMANDI</div>
              <ul className="text-dim space-y-0.5">
                <li><span className="text-bone">1</span> CIOCCOLATO · <span className="text-bone">2</span> FRAGOLA</li>
                <li><span className="text-bone">3</span> PISTACCHIO · <span className="text-bone">4</span> LISCIO</li>
                <li><span className="text-bone">P / ESC</span> PAUSA · <span className="text-bone">SPAZIO</span> NEI DIALOGHI</li>
                <li><span className="text-bone">M</span> AUDIO ON/OFF</li>
              </ul>
            </div>
          </div>
          <div className="mt-5 text-dim text-xs tracking-widest">AUDIO CONSIGLIATO — I MORENI URLANO IN 8-BIT</div>
        </div>
      )}

      {/* ================================ DIALOGO ================================ */}
      {phase === "dialogue" && (
        <DialogueBox lines={dlgLines} onDone={() => afterDlgRef.current?.()} />
      )}

      {/* ================================ BANNER CAPITOLO ================================ */}
      {banner && (
        <div className="banner-root">
          <div className="banner-inner">
            <div className={`banner-kicker ${banner.boss ? "boss" : ""}`}>{banner.kicker}</div>
            <div className="banner-title">{banner.title}</div>
            <div className="banner-rule" />
          </div>
        </div>
      )}

      {/* ================================ PERK TOAST ================================ */}
      {toast && <div className="perk-toast">{toast}</div>}

      {/* ================================ HUD BATTAGLIA ================================ */}
      {inBattle && (
        <>
          <div className="absolute top-3 left-3 z-[15] pointer-events-none">
            <div className={`border-2 border-edge bg-panel/85 px-3 py-2 ${turns === 0 ? "hud-shake" : ""}`}>
              <div className="text-toxic text-xs tracking-[0.3em]">
                COMP-OS v6.66 {bossActive ? "// ALLARME FRADICIO" : chapterDef ? `// CAP. ${chapterDef.roman}` : "// MODALITÀ INFINITA"}
              </div>
              <div className="font-display text-xl md:text-2xl leading-tight text-bone">
                {cur ? (cur.endless ? `ROUND ${recruits + 1} — ${cur.species.name}` : cur.species.name) : ""}
              </div>
              <div className="text-dim text-sm">{cur?.species.title}</div>
              <div className="mt-1 text-gold text-lg leading-none">
                CARISMA: <span className="tabular-nums">{score}</span>
              </div>
            </div>
          </div>

          <div className="absolute top-3 right-3 z-[15] flex flex-col items-end gap-2">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2 flex items-center gap-2">
              <span className="text-dim text-xs tracking-widest mr-1">PRESS TURN</span>
              {Array.from({ length: maxTurns }).map((_, i) => (
                <TurnDiamond key={i} state={i < turns ? "full" : "empty"} />
              ))}
            </div>
            <div className="border-2 border-edge bg-panel/85 px-2 py-2">
              <div className="text-dim text-[10px] tracking-[0.3em] text-right mb-1">GLI OTTO CROCCANTI</div>
              <div className="grid grid-cols-4 gap-1.5">
                {SPECIES.map((sp) => {
                  const owned = party.includes(sp.id);
                  return (
                    <div
                      key={sp.id}
                      title={owned ? `${sp.name} — ${PERKS[sp.id]?.name}: ${PERKS[sp.id]?.desc}` : "???"}
                      className={`party-slot ${owned ? "filled" : ""}`}
                      style={{ "--pc": owned ? hexCss(sp.accentColor) : undefined } as React.CSSProperties}
                    >
                      {owned ? <MorenoFace sp={sp} size={34} /> : "?"}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 z-[15] pointer-events-none w-[min(430px,60vw)]">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2">
              <div className="text-toxic text-xs tracking-[0.3em] mb-1">REGISTRO COMP</div>
              {log.map((l) => (
                <div
                  key={l.id}
                  className={`text-sm md:text-base leading-tight truncate ${
                    l.kind === "good" ? "text-toxic" : l.kind === "bad" ? "text-blood" : "text-dim"
                  }`}
                >
                  &gt; {l.text}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-3 right-3 z-[15] w-[min(480px,92vw)]">
            <div className="border-2 border-edge bg-panel/85 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-dim text-xs tracking-widest">VOGLIA DEL MORENO</span>
                <span className="text-gold text-sm">{cur ? `${cur.demandIdx}/${cur.qty}` : ""}</span>
              </div>
              <div className="text-bone text-sm md:text-base leading-tight mb-1.5">{demand}</div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {chips.map((c, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 grid place-items-center border-2 ${c.hit ? "chip-pop" : ""}`}
                    style={{
                      borderColor: c.hit ? FLAVORS[c.flavor].css : "#3a2160",
                      background: c.hit ? FLAVORS[c.flavor].cssDark : "#160b26",
                      opacity: c.hit ? 1 : 0.55,
                    }}
                  >
                    <CookieIcon css={c.hit ? FLAVORS[c.flavor].css : "#2a1b45"} size={22} />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-dim text-xs tracking-widest whitespace-nowrap">SCADENZA</span>
                <div ref={barWrapRef} className="flex-1 h-4 border-2 border-edge bg-[#120a20] overflow-hidden">
                  <div
                    className="timer-fill h-full transition-[width] duration-100 ease-linear"
                    style={{ width: "100%", background: "linear-gradient(90deg,#4dffa6,#ffc94d,#ff2e5f)" }}
                  />
                </div>
                <span className="tabular-nums text-lg w-14 text-right">{(ms / 1000).toFixed(1)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FLAVOR_LIST.map((f, i) => (
                  <button
                    key={f}
                    onClick={() => {
                      initAudio();
                      onOffer(f);
                    }}
                    disabled={paused || !inBattle}
                    className="btn-hard flex items-center justify-center gap-2 px-2 py-2.5 border-2 font-display text-lg md:text-xl tracking-wide"
                    style={{
                      background: FLAVORS[f].cssDark,
                      borderColor: FLAVORS[f].css,
                      color: "#fff6ea",
                      textShadow: "0 2px 0 rgba(0,0,0,0.6)",
                    }}
                  >
                    <CookieIcon css={FLAVORS[f].css} />
                    {FLAVORS[f].name}
                    <span className="text-xs opacity-70 font-term">[{i + 1}]</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================================ PAUSA ================================ */}
      {paused && inBattle && (
        <div className="absolute inset-0 z-[45] grid place-items-center bg-[rgba(5,2,10,0.82)]">
          <div className="border-2 border-toxic bg-panel px-10 py-8 text-center shadow-[0_0_40px_rgba(77,255,166,0.25)]">
            <div className="font-display text-5xl text-toxic mb-1">PAUSA</div>
            <div className="text-dim mb-5">I MORENI ASPETTANO. MALVOLENTI.</div>
            <button onClick={togglePause} className="btn-hard block w-full px-8 py-3 bg-toxic border-2 border-[#d8fff0] text-[#04150c] font-display text-2xl tracking-widest mb-3">
              RIPRENDI [P]
            </button>
            <button
              onClick={() => {
                stopTimer();
                setPaused(false);
                pausedRef.current = false;
                engineRef.current?.setPaused(false);
                engineRef.current?.setBossMode(false);
                engineRef.current?.clearDemon();
                setBossActive(false);
                setPhase("title");
              }}
              className="btn-hard block w-full px-8 py-2 bg-panel2 border-2 border-edge text-dim font-display text-xl tracking-widest"
            >
              ABBANDONA LA PROFEZIA
            </button>
          </div>
        </div>
      )}

      {/* ================================ GAME OVER ================================ */}
      {phase === "gameover" && (
        <div className="absolute inset-0 z-[30] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(40,4,16,0.8),rgba(8,2,6,0.95))]">
          <div className="font-display text-[11vw] md:text-[6rem] leading-none text-blood text-outline pulse-glow text-center">
            SEI STATO
            <br />
            SBRICIOLATO
          </div>
          <div className="mt-4 stamp-in border-4 border-blood px-6 py-2 font-display text-2xl md:text-3xl text-blood tracking-widest bg-[rgba(20,2,8,0.8)]">
            {defeatInfo.reason}
          </div>
          <div className="mt-5 max-w-xl text-center px-6 text-lg md:text-xl text-dim">
            «{defeatInfo.line}»
          </div>
          <div className="mt-2 text-gold text-xl">
            CARISMA FINALE: <span className="tabular-nums">{score}</span> · MORENI RECLUTATI: {party.length}/8
          </div>
          <div className="mt-7 flex flex-col md:flex-row gap-3">
            <button
              onClick={() => {
                initAudio();
                sfx.ui();
                if (cur?.endless) endlessRound(recruits);
                else runChapter(cur?.chapter ?? 0);
              }}
              className="btn-hard px-8 py-3 bg-blood border-2 border-[#ffd1dd] text-[#fff0f4] font-display text-2xl tracking-widest"
            >
              {cur?.endless ? "RIPROVA LA CORSA" : `RIPROVA DAL CAPITOLO ${CHAPTERS[cur?.chapter ?? 0].roman}`}
            </button>
            <button
              onClick={() => {
                sfx.ui();
                setPhase("title");
              }}
              className="btn-hard px-8 py-3 bg-panel2 border-2 border-edge text-dim font-display text-2xl tracking-widest"
            >
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
              Morenivoth il Fradicio è evaporato. Gli Otto Croccanti sgranocchiano in pace. La nonna ha ripreso a sfornare.
            </p>
            <div className="mt-2 text-toxic text-2xl">
              CARISMA: <span className="tabular-nums">{score}</span>
            </div>
            <div className="mt-6 grid grid-cols-4 md:grid-cols-8 gap-2.5 w-full max-w-4xl">
              {SPECIES.map((sp) => (
                <div key={sp.id} className="roster-card" style={{ "--pc": hexCss(sp.accentColor) } as React.CSSProperties}>
                  <MorenoFace sp={sp} size={54} />
                  <div className="font-display text-xs mt-1 leading-tight" style={{ color: hexCss(sp.accentColor) }}>
                    {sp.name}
                  </div>
                  <div className="text-[10px] text-dim leading-tight">{PERKS[sp.id]?.name}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-dim text-sm italic text-center">
              «{pick(["IL CRUNCH È SERVITO.", "MORENOPOLI TI RINGRAZIA. ANCHE IL SINDACO DEI DEMONI.", "LA CONFEZIONE FAMIGLIA È ETERNA."])}»
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <button
                onClick={() => {
                  initAudio();
                  beginEndless();
                }}
                className="btn-hard px-8 py-3 bg-gold border-2 border-[#fff0d1] text-[#241503] font-display text-2xl tracking-widest"
              >
                MODALITÀ INFINITA (NG+)
              </button>
              <button
                onClick={() => {
                  sfx.ui();
                  setPhase("title");
                }}
                className="btn-hard px-8 py-3 bg-panel2 border-2 border-edge text-dim font-display text-2xl tracking-widest"
              >
                TITOLI DI CODA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================ audio toggle ================================ */}
      <button
        onClick={() => {
          initAudio();
          setMuted((m) => {
            sfx.muted = !m;
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
