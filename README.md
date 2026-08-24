# ✠ SHIN MORENI TENSEI — L'Epica del Maiale del Mondo

**Un RPG demenziale di collezionismo di mostri**, parodia affettuosa di Shin Megami Tensei.
Esplora Morenopoli in 3D, combatti a turni, convinci i Moreni offrendo loro *morenini* croccanti… e salva il Nonno.

> «I MORENINI NON SONO BISCOTTI. SONO UN ATTO D'AMORE CROCCANTE.» — Don Moreno

---

## 🍪 La trama

Morenopoli, anno 666 del Crunch. Il **MAIALE DEL MONDO** ha ingoiato la Croccantezza Eterna: i morenini escono dal forno **molli**, e un morenino molle è una catastrofe cosmica.

Tu — evocatore mediocre con un COMP-OS v6.66 crackato — devi:

1. Radunare gli **Otto Croccanti** (le specie dei Moreni)
2. Placare la Tribù dei Facoceri e le tre ideologie sulla cura del male del mondo
3. Estrarre la **Spada dell'Amore** dal Grande Morenino
4. Risvegliare **Clomp**, il cavaliere sacro dai lunghi capelli blu
5. Attraversare il portale e affrontare il Maiale del Mondo… **che è il nonno di Don Moreno** (colpo di scena)

## 🎭 Personaggi memorabili

| Chi | Chi è davvero |
|---|---|
| **DON MORENO** | Il Capo dei Moreni. Corona, catenaccio, baffi. Piange solo quando non guarda nessuno. |
| **CINGHIA ALE** | Capo tribù dei Morenofacoceri. Si unisce a te se lo convinci in battaglia — a botte o col morenino giusto. |
| **MICO NOSCA** | Capo della Rivolta Sociale: il male si cura mettendo al centro i rapporti umani. Ti processa con tre domande. |
| **COIZIO** | Apostolo del Contatto Fisico. Ti dona l'Abbraccio Eterno… se sai abbracciare (tieni SPAZIO). |
| **GINO SATRI** | Filosofo del Male Omeopatico: il male si cura col male. La sua cantina contiene un'Essenza che non doveva stappare. |
| **MALE DEL MONDO** | L'Essenza del male. Boss. Catturabile. Attualmente vive in un cassetto. |
| **CLOMP** | Il ragazzino dai lunghi capelli blu. Dorme finché 8 specie non ti riconoscono amico. Solo lui brandisce la Spada dell'Amore. |
| **MAIALE DEL MONDO** | Il facocemoreno finale. Gonfio di male e di mollica. Si purifica, non si cattura. |
| **MICA RIZZI** | Archivista demoniaca part-time. Il suo PC ha 100 slot e non ha mai perso un Moreno. |

## ⚔️ Sistemi di gioco

- **Mondo esplorabile in Three.js** — 6 zone procedurali: Morenopoli, Valle dei Facoceri, Accampamento della Rivolta, Terme del Contatto, Abisso di Gino, Antro del Maiale.
- **Battaglie a turni** — ATTACCA / OFFRI MORENINO / cambia MORENO / FUGGI, con log, HP bar e animazioni di affondo.
- **Cattura in due fasi** — offri il morenino del gusto preferito per *ammorbidire* il Moreno, poi tenta la cattura. Ogni selvatico ha un **nome generato proceduralmente** (alternanza vocale/consonante, rare doppie).
- **Economia** — i morenini **non sono infiniti**: si comprano al **Forno** con le briciole (la valuta), si vincono in battaglia o al Morenopong.
- **MORENOPONG** — la Sala Giochi: un tetris × pong a pagamento (10 briciole). I pezzi si impilano, la pallina li sbriciola, le righe si cancellano. Ogni 120 punti = 1 morenino.
- **PC di Mica Rizzi** — 100 slot per depositare, ritirare o liberare i Moreni. A squadra piena, i reclutati finiscono lì in automatico.
- **Menu RPG** — Formazione, Stato, Zaino (oggetti chiave + dolci curativi).
- **Cura ad inerzia** — lontano dallo schermo i Moreni recuperano **1 HP al minuto**; dopo 60 minuti rinascono con 1 HP e riprendono a curarsi. Se un morenino va a 0 HP, il gioco te lo spiega con affetto: *vai fuori a socializzare*.
- **Moreni speciali** (Re Morenone, Cinghia Ale, Male del Mondo) catturabili **una sola volta** per partita.
- **Salvataggi** — autosave + 3 slot manuali con protezione da sovrascrittura (localStorage).

## 🎮 Comandi

| Tasto | Azione |
|---|---|
| `WASD` / frecce | Muoviti nel mondo |
| `E` | Interagisci (NPC, Forno, Sala Giochi, PC, monumento) |
| `1–4` | Offri morenino (cioccolato / fragola / pistacchio / liscio) |
| `TAB` o `I` | Menu Moreni (Formazione / Stato / Zaino) |
| `P` / `ESC` | Pausa |
| `M` | Audio on/off |
| `SPAZIO` | Avanza nei dialoghi · tieni premuto per l'abbraccio |

## 🛠️ Tech

- **React + TypeScript + Vite**
- **Three.js** — renderer WebGL, scena mondo e camera da battaglia interamente procedurali (nessun asset esterno: texture canvas, geometrie primitive, sprite label)
- **WebAudio API** — blip e jingle 8-bit sintetizzati al volo
- **Tailwind CSS v4** + CRT overlay custom (scanline, vignette, flicker)
- Font: **Grenze Gotisch** (display) + **VT323** (terminale)

## 🚀 Sviluppo

```bash
npm install
npm run dev      # sviluppo
npm run build    # produzione (dist/)
```

## 📁 Struttura

```
src/
  main.tsx          bootstrap React
  App.tsx           tutta la logica di gioco (storia, battaglie, menu, minigioco, save)
  index.css         tema CRT, dialoghi JRPG, HUD
  game/
    data.ts         specie, personaggi, zone, dialoghi, economia, generatore di nomi
    engine.ts       engine Three.js (mondo esplorabile + camera da battaglia)
    audio.ts        synth WebAudio procedurale
```

---

*Fatto con croccantezza. Nessun morenino è stato sprecato, tranne quelli offerti ai Moreni.*
