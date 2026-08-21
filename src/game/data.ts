export type FlavorId = "cioccolato" | "fragola" | "pistacchio" | "liscio";

export interface FlavorDef {
  id: FlavorId;
  name: string;
  color: number;
  css: string;
  cssDark: string;
  chip: string;
  slang: string[];
}

export const FLAVOR_LIST: FlavorId[] = ["cioccolato", "fragola", "pistacchio", "liscio"];

export const FLAVORS: Record<FlavorId, FlavorDef> = {
  cioccolato: {
    id: "cioccolato",
    name: "CIOCCOLATO",
    color: 0x8a4b2a,
    css: "#8a4b2a",
    cssDark: "#5c2f17",
    chip: "#3d1e0c",
    slang: ["QUELLO SCURO", "IL CICCIOSO", "IL MARRONE MISTICO"],
  },
  fragola: {
    id: "fragola",
    name: "FRAGOLA",
    color: 0xff6fa5,
    css: "#ff6fa5",
    cssDark: "#c23a6e",
    chip: "#b81e57",
    slang: ["QUELLO ROSA", "IL ROMANTICO", "IL FRAGOLONE"],
  },
  pistacchio: {
    id: "pistacchio",
    name: "PISTACCHIO",
    color: 0x9bd84b,
    css: "#9bd84b",
    cssDark: "#5f8f24",
    chip: "#4a7317",
    slang: ["QUELLO VERDE", "IL PRATOSO", "L'ERETICO VERDE"],
  },
  liscio: {
    id: "liscio",
    name: "LISCIO",
    color: 0xf2d8a7,
    css: "#f2d8a7",
    cssDark: "#c4a265",
    chip: "#a67c3f",
    slang: ["IL CLASSICO", "QUELLO LISCIO", "IL VANIGLIOSO"],
  },
};

export interface MorenoParts {
  horns?: boolean;
  catEars?: boolean;
  antenna?: boolean;
  sunglasses?: boolean;
  chain?: boolean;
  crown?: boolean;
  bolts?: boolean;
  bun?: boolean;
  glasses?: boolean;
  tears?: boolean;
  tail?: boolean;
}

export interface SpeciesDef {
  id: string;
  name: string;
  title: string;
  radius: number;
  bodyColor: number;
  bellyColor: number;
  accentColor: number;
  parts: MorenoParts;
  favorite: FlavorId;
  big?: boolean;
  recruitLines: string[];
  angryLines: string[];
  timeoutLines: string[];
}

export const SPECIES: SpeciesDef[] = [
  {
    id: "morenozzo",
    name: "MORENOZZO",
    title: "IL BASIC DELL'OLTRETOMBA",
    radius: 0.95,
    bodyColor: 0xff5fa2,
    bellyColor: 0xffd1e8,
    accentColor: 0xffd166,
    parts: {},
    favorite: "liscio",
    recruitLines: ["OK, MI PIACI. ORA VIVO NEL TUO TELEFONO.", "CONTRATTO FIRMATO. HO IL WI-FI ANCH'IO?"],
    angryLines: ["MA COSA MI DAI?! È UN INSULTO!", "IL MIO AVVOCATO SENTIRÀ PARLARE DI TE!"],
    timeoutLines: ["TROPPO LENTO, MORTALE. TORNO NEL MIO DIMENSIONE."],
  },
  {
    id: "morenello",
    name: "MORENELLO CORNUTO",
    title: "DUE CORNA, ZERO PAZIENZA",
    radius: 0.9,
    bodyColor: 0xff4757,
    bellyColor: 0xffb3b3,
    accentColor: 0xffe066,
    parts: { horns: true, tail: true },
    favorite: "cioccolato",
    recruitLines: ["LE MIE CORNA BRILLANO DI GIOIA. SONO TUO.", "ACCETTO. MA LE CORNA NON SI TOCCANO."],
    angryLines: ["MI HAI FATTO INCAVOLARE. E HO LE CORNA!", "TI INCORNO LA MACCHINA!"],
    timeoutLines: ["LE CORNA MI PRUDONO. ME NE VADO."],
  },
  {
    id: "morenilla",
    name: "MORENILLA DRAMMATICA",
    title: "PIANGE ANCHE QUANDO VINCE",
    radius: 0.85,
    bodyColor: 0xb98aff,
    bellyColor: 0xe6d5ff,
    accentColor: 0x7ee8fa,
    parts: { catEars: true, tears: true },
    favorite: "fragola",
    recruitLines: ["*SNIFF* NESSUNO MI HA MAI OFFERTO MORENINI... *SNIFF* VERRÒ CON TE.", "SONO COSÌ FELICE CHE PIANGO. PIÙ DI PRIMA."],
    angryLines: ["*PIANTO DRAMMATICO* IL GUSTO SBAGLIATO?! *SINGHIOZZO*", "ORA PIANGO PER 300 ANNI. GRAZIE, EH."],
    timeoutLines: ["*SNIFF* NEMMENO UN MORENINO... *SINGHIOZZO DRAMMATICO*"],
  },
  {
    id: "tamarro",
    name: "MORENO TAMARRO",
    title: "OCCHIALI DA SOLE ANCHE AL BUIO",
    radius: 1.0,
    bodyColor: 0xff9f43,
    bellyColor: 0xffd9a0,
    accentColor: 0xffd700,
    parts: { sunglasses: true, chain: true },
    favorite: "pistacchio",
    recruitLines: ["FRA, SEI UN GRANDE. TI PRESENTO I MIEI DEMONI.", "CI STO. MA GUIDO IO LA MOTO INFERNALE."],
    angryLines: ["FRA, MI HAI OFFESO IL CATENACCIO D'ORO!", "COSÌ MI ROVINI IL CIUFFO, FRA!"],
    timeoutLines: ["FRA, LA PAZIENZA È DA SFIGATI. CIAO."],
  },
  {
    id: "morenito",
    name: "MORENITO SPRINT",
    title: "ANTENNA 5G E GAMBE A MOLLA",
    radius: 0.8,
    bodyColor: 0x4dd8ff,
    bellyColor: 0xc9f2ff,
    accentColor: 0xffe14d,
    parts: { antenna: true, tail: true },
    favorite: "liscio",
    recruitLines: ["BIP-BOP! CONNESSIONE STABILITA. SONO NEL TUO ALBUM.", "VELOCITÀ LUCE! CONTRATTO FIRMATO IN 0.3 SECONDI."],
    angryLines: ["ERRORE 404: MORENINO NON GRADITO!", "TI SCARICO LA BATTERIA AL 1% PER SEMPRE!"],
    timeoutLines: ["TIMEOUT. LA MIA ANTENNA NON ASPETTA NESSUNO."],
  },
  {
    id: "baron",
    name: "BARON MORENSTEIN",
    title: "CUCITO A MANO NEL 1818",
    radius: 1.05,
    bodyColor: 0x69d84f,
    bellyColor: 0xb8f0a8,
    accentColor: 0xc8d6e5,
    parts: { bolts: true, bun: false },
    favorite: "pistacchio",
    recruitLines: ["GRRR... BENE. IL BARONE SI ACCONTENTA.", "IL MIO CERVELLO APPROVA. QUELLO DI SCORTA PURE."],
    angryLines: ["GRRRR! I BULLONI MI FRIZZANO DI RABBIA!", "TI SMONTO E TI RIMONTO AL CONTRARIO!"],
    timeoutLines: ["IL BARONE NON ASPETTA. IL BARONE SE NE VA."],
  },
  {
    id: "morenilde",
    name: "MORENILDE NONNA",
    title: "SFERRUZZA MAGLIONI MALEDETTI",
    radius: 0.9,
    bodyColor: 0xc39bd3,
    bellyColor: 0xead9f2,
    accentColor: 0xdfe6e9,
    parts: { bun: true, glasses: true },
    favorite: "fragola",
    recruitLines: ["BRAVO TESORO. VERRÒ A STARE DA TE. TI Lavo I MAGLIONI.", "CHE CARO. TI HO GIÀ SFERRUZZATO UN MAGLIONE MALEDETTO."],
    angryLines: ["AI MIEI TEMPI I MORTALI ERAVANO PIÙ EDUCATI!", "TI FACCIO UN MAGLIONE CHE PUNGE PER L'ETERNITÀ!"],
    timeoutLines: ["SOSPIRO DA NONNA... I GIOVANI D'OGGI. ADDIO."],
  },
  {
    id: "reMorenone",
    name: "RE MORENONE III",
    title: "SOVRANO DEL REGNO DEI MORENI",
    radius: 1.25,
    bodyColor: 0xa55eea,
    bellyColor: 0xd3a6ff,
    accentColor: 0xffd700,
    parts: { crown: true, chain: true },
    favorite: "cioccolato",
    big: true,
    recruitLines: ["HAI OFFERTO BENE, SUDDITO. IL REGNO TI ACCOGLIE.", "LA CORONA APPROVA. SEI IL MIO NUOVO PASTICCERE DI CORTE."],
    angryLines: ["LESA MAESTÀ! QUESTO È UN REGICIDIO GASTRONOMICO!", "TI CONDANNO A 10.000 ANNI DI FILA ALLA MENSA INFERNALE!"],
    timeoutLines: ["UN RE NON ASPETTA. IL POPOLO MI ATTENDE."],
  },
];

export const DEMAND_TEMPLATES = [
  "EHI, MORTALE. LA PROFEZIA PARLA CHIARO: {n} MORENIN{I} AL {F}. SUBITO.",
  "SONO USCITO DAL CERCHIO PER {n} MORENIN{I} AL {F}. NON FARMI PENTIRE.",
  "IL MIO OROSCOPO DICE: {n} MORENIN{I} AL {F} O SCATTA LA MALEDIZIONE.",
  "HO FATTO 300 ANNI DI DIETA NELL'OLTRETOMBA. VOGLIO {n} MORENIN{I} AL {F}.",
  "SE MI OFFRI {n} MORENIN{I} AL {F} NON TI MORDERÒ. FORSE.",
  "IL CONDOMINIO INFERNALE È IN RIUNIONE: SERVONO {n} MORENIN{I} AL {F}.",
  "BIP BOP. SONO UN MORENO, NON UN ROBOT. DAMMI {n} MORENIN{I} AL {F}.",
  "HO SCOMMESSO CON UN DIAVOLO CHE MI DAI {n} MORENIN{I} AL {F}. NON FARMI PERDERE.",
  "HO SOGNATO {n} MORENIN{I} AL {F}. I SOGNI DEI MORENI SONO LEGGE.",
  "IL SINDACO DEI DEMONI ESIGE {n} MORENIN{I} AL {F}. IO PURE, OVVIO.",
];

export const SLANG_TEMPLATE = "VOGLIO {n}X {S}. E NON SBAGLIARE GUSTO, MORTALE.";

export const BOOT_LINES = [
  "COMP-OS v6.66 ... AVVIO SISTEMA DI EVOCAZIONE",
  "RILEVATA ANOMALIA: 8 MORENI IN CIRCOLAZIONE",
  "MORENINI SINTETIZZATI: INFINITI (FORSE)",
  "CONNESSIONE OLTRETOMBA: STABILE. PIÙ O MENO.",
  "PRESSIONE DEMONIACA: SOPPORTABILE",
  "AVVIA PROGRAMMA DI EVOCAZIONE? [INVIO]",
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildDemandText(round: number, flavor: FlavorId, qty: number): string {
  const n = String(qty);
  const plur = qty === 1 ? "O" : "I";
  if (round >= 4 && Math.random() < 0.38) {
    return SLANG_TEMPLATE.replace("{n}", n).replace("{S}", pick(FLAVORS[flavor].slang));
  }
  const tpl = pick(DEMAND_TEMPLATES);
  return tpl.replace("{n}", n).replace("{I}", plur).replace("{F}", FLAVORS[flavor].name);
}

/* ============================================================= STORIA RPG */

export interface DialogueLine {
  spk: string; // "TU" | "NARRATORE" | id specie | id boss
  text: string;
}

export const PROLOGUE: DialogueLine[] = [
  { spk: "NARRATORE", text: "Morenopoli. La città sacra della Croccantezza Eterna." },
  { spk: "NARRATORE", text: "Per mille anni i morenini — biscotti sacri — hanno nutrito uomini e Moreni in perfetta armonia." },
  { spk: "NARRATORE", text: "Finché una notte... il cielo divenne FRADICIO." },
  { spk: "morenivoth", text: "MWAHAHA! IO SONO MORENIVOTH IL FRADICIO! HO RUBATO LA CROCCANTEZZA DI TUTTI I MORENINI DEL MONDO!" },
  { spk: "NARRATORE", text: "I morenini divennero molli. I Moreni divennero irritabili. Le nonne smisero di sfornare per protesta." },
  { spk: "TU", text: "...Io sono solo un evocatore con un COMP v6.66 crackato e una confezione famiglia di morenini." },
  { spk: "NARRATORE", text: "La profezia parla chiaro: il salvatore sarà un mediocre con la confezione famiglia. Recluta gli Otto Croccanti. Affronta il Fradicio. Ridai il crunch al mondo." },
  { spk: "TU", text: "Va bene. Ma la confezione famiglia la metto in nota spese." },
];

export const BOSSES: Record<string, SpeciesDef> = {
  jr: {
    id: "jr",
    name: "MORENIVOTH JUNIOR",
    title: "APPRENDISTA FRADICIO",
    radius: 1.15,
    bodyColor: 0x6b4a33,
    bellyColor: 0x8a6a52,
    accentColor: 0x9b8bb8,
    parts: { horns: true, tears: true },
    favorite: "cioccolato",
    big: true,
    recruitLines: ["NOOO... IL CAPO MI AMMOSCIERÀ A MEEE..."],
    angryLines: ["GRRR! IL FRADICIO È PIÙ FORTE DI TE!", "TI AMMOSCIO PURE LE IDEE!"],
    timeoutLines: ["TROPPO LENTO! ORA SEI FRADICIO ANCHE TU!"],
  },
  morenivoth: {
    id: "morenivoth",
    name: "MORENIVOTH IL FRADICIO",
    title: "LADRO DELLA CROCCANTEZZA",
    radius: 1.5,
    bodyColor: 0x4a2c1a,
    bellyColor: 0x6b4a33,
    accentColor: 0xa55eea,
    parts: { horns: true, crown: true, tears: true, chain: true },
    favorite: "cioccolato",
    big: true,
    recruitLines: ["IMPOSSIBILE... IL CRUNCH..."],
    angryLines: ["LA TUA CROCCANTEZZA FINISCE QUI!", "TI RIDUCO A POLTIGLIA UMIDA!"],
    timeoutLines: ["IL TEMPO È FRADICIO! COME TE!"],
  },
};

export interface ChapterDef {
  speciesId: string;
  roman: string;
  title: string;
  qty: number;
  flavor: FlavorId;
  timerMs: number;
  turns: number;
  boss?: boolean;
  intro: DialogueLine[];
  outro: DialogueLine[];
}

export const CHAPTERS: ChapterDef[] = [
  {
    speciesId: "morenozzo",
    roman: "I",
    title: "IL BASIC DELL'OLTRETOMBA",
    qty: 2,
    flavor: "liscio",
    timerMs: 9000,
    turns: 3,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO I — Dal cerchio emerge un Moreno perfettamente normale. Sospettosamente normale." },
      { spk: "morenozzo", text: "Ehi. Sono Morenozzo. Nessun tratto particolare, nessun passato tragico. Hai dei morenini lisci?" },
      { spk: "TU", text: "La profezia inizia... in modo molto basic." },
      { spk: "morenozzo", text: "Due. Lisci. Se mi offri qualcosa di aromatizzato ti denuncio per plagio esistenziale." },
    ],
    outro: [
      { spk: "morenozzo", text: "Affare fatto. Mi unisco al party: qualcuno dovrà pure essere normale." },
      { spk: "NARRATORE", text: "MORENOZZO si è unito al party! Perk sbloccato: BASIC MA UTILE (+2s al timer di ogni capitolo)" },
    ],
  },
  {
    speciesId: "morenello",
    roman: "II",
    title: "DUE CORNA, ZERO PAZIENZA",
    qty: 2,
    flavor: "cioccolato",
    timerMs: 9500,
    turns: 3,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO II — Il cerchio fischia. Un Moreno cornuto entra a passo di carica e incorna subito un pilastro." },
      { spk: "morenello", text: "CHI HA EVOCATO MORENELLO CORNUTO?! Spero sia per morenini al cioccolato, se no mi arrabbio!" },
      { spk: "TU", text: "È per la profezia. E... sì, cioccolato." },
      { spk: "morenello", text: "DUE! E se sbagli gusto ti rigiro la macchina con le corna. Anche se non hai la macchina." },
    ],
    outro: [
      { spk: "morenello", text: "Le corna brillano di gioia! Sono dei vostri!" },
      { spk: "NARRATORE", text: "MORENELLO CORNUTO si è unito al party! Perk sbloccato: CORNA PARAFULMINE (il primo errore di gusto per capitolo è perdonato)" },
    ],
  },
  {
    speciesId: "morenilla",
    roman: "III",
    title: "PIANGE ANCHE QUANDO VINCE",
    qty: 3,
    flavor: "fragola",
    timerMs: 10000,
    turns: 3,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO III — Prima di apparire, il Moreno piange per una quarantina di secondi di riscaldamento." },
      { spk: "morenilla", text: "*SNIFF* ...mi hai evocata... nessuno mi evoca mai... *SNIFF* a meno che tu non abbia morenini alla fragola." },
      { spk: "TU", text: "Tre alla fragola. Senza piangere, per favore." },
      { spk: "morenilla", text: "*PIANTO DRAMMATICO* STO GIÀ PIANGENDO! TRE, HO DETTO TREEE!" },
    ],
    outro: [
      { spk: "morenilla", text: "*SNIFF* Sono così felice che piango più di prima. Verrò con voi." },
      { spk: "NARRATORE", text: "MORENILLA DRAMMATICA si è unita al party! Perk sbloccato: PIANTO DIETETICO (25% di probabilità: 1 offerta vale 2)" },
    ],
  },
  {
    speciesId: "tamarro",
    roman: "IV",
    title: "OCCHIALI DA SOLE ANCHE AL BUIO",
    qty: 3,
    flavor: "pistacchio",
    timerMs: 10500,
    turns: 3,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO IV — Il cerchio si illumina come una discoteca da spiaggia. Arriva il MORENO TAMARRO in sella a una moto infernale." },
      { spk: "tamarro", text: "Fra. Morenini al pistacchio. Tre. Se il crunch è giusto ti presento i miei demoni." },
      { spk: "TU", text: "I tuoi demoni hanno il casco?" },
      { spk: "tamarro", text: "Fra, i miei demoni hanno il FLOW. Tre al pistacchio, sbrigati che ho il motore acceso." },
    ],
    outro: [
      { spk: "tamarro", text: "Il catenaccio approva. Guiderò io. Tu reggi la confezione famiglia." },
      { spk: "NARRATORE", text: "MORENO TAMARRO si è unito al party! Perk sbloccato: CATENACCIO PORTAFORTUNA (+75 punti a ogni reclutamento)" },
    ],
  },
  {
    speciesId: "jr",
    roman: "V",
    title: "L'APPRENDISTA FRADICIO",
    qty: 4,
    flavor: "cioccolato",
    timerMs: 13000,
    turns: 4,
    boss: true,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO V — Il cielo gocciola fango. Un Moreno gonfio di umidità blocca il vicolo: MORENIVOTH JUNIOR." },
      { spk: "jr", text: "FERMO LÌ! Il capo dice che sei... fastidioso. Dammi 4 morenini al cioccolato e ti lascio passare!" },
      { spk: "TU", text: "Il capo ti ha dato pure un soprannome più minaccioso del tuo?" },
      { spk: "jr", text: "GRRR! IO SONO FRADICIO AL 60%! QUATTRO MORENINI O TI AMMOSCIO PURE LE SCARPE!" },
    ],
    outro: [
      { spk: "jr", text: "Nooo... il capo mi ammoscerà a meee... dite alla mamma che la mia spugna era croccante almeno una volta..." },
      { spk: "NARRATORE", text: "Junior si scioglie in una pozzanghera dignitosa. Il Fradicio ora sa dove sei." },
    ],
  },
  {
    speciesId: "morenito",
    roman: "VI",
    title: "ANTENNA 5G E GAMBE A MOLLA",
    qty: 3,
    flavor: "liscio",
    timerMs: 11000,
    turns: 3,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO VI — Il COMP aggancia un segnale 5G. MORENITO SPRINT rimbalza nel cerchio a velocità luce." },
      { spk: "morenito", text: "BIP-BOP! Evocatore veloce! Tre morenini lisci in meno di dieci secondi! VIA VIA VIA!" },
      { spk: "TU", text: "Guarda che il tempo ce l'hai tutto—" },
      { spk: "morenito", text: "IL TEMPO È UN COSTRUTTO SOCIALE! TRE LISCI! LA MIA ANTENNA SI STA GIÀ AGGIORNANDO!" },
    ],
    outro: [
      { spk: "morenito", text: "CONNESSIONE STABILITA! Sono nel tuo album, nel tuo cloud, nel tuo cuore a 144 hertz!" },
      { spk: "NARRATORE", text: "MORENITO SPRINT si è unito al party! Perk sbloccato: 5G SPIRITUALE (la penalità per errore è di soli 2,5s)" },
    ],
  },
  {
    speciesId: "baron",
    roman: "VII",
    title: "CUCITO A MANO NEL 1818",
    qty: 4,
    flavor: "pistacchio",
    timerMs: 12000,
    turns: 3,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO VII — Odore di fulmini e di 1818. BARON MORENSTEIN si alza dal cerchio, punto per punto." },
      { spk: "baron", text: "GRRR... IL BARONE È RISORTO. PISTACCHIO. QUATTRO. IL CERVELLO DI SCORTA DEL BARONE ESIGE POLIFENOLI." },
      { spk: "TU", text: "Non è che conosce il punto debole del Fradicio, per caso?" },
      { spk: "baron", text: "GRRR... IL BARONE SA MOLTE COSE. PRIMA I MORENINI. POI LA FILOSOFIA." },
    ],
    outro: [
      { spk: "baron", text: "IL BARONE SI ACCONTENTA. ANCHE IL CERVELLO DI SCORTA. SEGUIREMO TE, EVOCATORE." },
      { spk: "NARRATORE", text: "BARON MORENSTEIN si è unito al party! Perk sbloccato: CERVELLO DI SCORTA (30% di probabilità di un Press Turn extra)" },
    ],
  },
  {
    speciesId: "morenilde",
    roman: "VIII",
    title: "SFERRUZZA MAGLIONI MALEDETTI",
    qty: 4,
    flavor: "fragola",
    timerMs: 12500,
    turns: 3,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO VIII — Profumo di lana e biscotti. MORENILDE NONNA esce dal cerchio sferruzzando una riga alla volta." },
      { spk: "morenilde", text: "Oh, tesoro, come sei magro. Troppi demoni, poca merenda. Quattro morenini alla fragola, o ti sferruzzo un maglione maledetto." },
      { spk: "TU", text: "Cosa fa il maglione maledetto?" },
      { spk: "morenilde", text: "PUNGE, TESORO. PER L'ETERNITÀ. Quattro alla fragola. Subito." },
    ],
    outro: [
      { spk: "morenilde", text: "Bravo tesoro. Verrò a stare da voi. Sferruzzo per tutto il party." },
      { spk: "NARRATORE", text: "MORENILDE NONNA si è unita al party! Perk sbloccato: MAGLIONE MALEDETTO (+15% punti reclutamento)" },
    ],
  },
  {
    speciesId: "reMorenone",
    roman: "IX",
    title: "IL SOVRANO DEGLI OTTO CROCCANTI",
    qty: 5,
    flavor: "cioccolato",
    timerMs: 13500,
    turns: 3,
    intro: [
      { spk: "NARRATORE", text: "CAPITOLO IX — Le trombe steccano. RE MORENONE III scende nel cerchio col trono sospetto di chi l'ha affittato." },
      { spk: "reMorenone", text: "IN GINOCCHIO, SUDDITO! L'ultimo degli Otto Croccanti è il sottoscritto! Morenini al cioccolato, cinque, degni di un re!" },
      { spk: "TU", text: "Maestà, il mondo è fradicio. Facciamo in fretta." },
      { spk: "reMorenone", text: "APPROVO LA FRETTA! CINQUE MORENINI E L'ESERCITO REALE — CIOÈ IO — È TUO!" },
    ],
    outro: [
      { spk: "reMorenone", text: "LA CORONA APPROVA! SEI IL MIO NUOVO PASTICCERE DI CORTE... E IL MIO GENERALE!" },
      { spk: "NARRATORE", text: "RE MORENONE III si è unito al party! Perk sbloccato: DECRETO REALE (+150 punti per ogni capitolo senza errori). GLI OTTO CROCCANTI SONO AL COMPLETO." },
    ],
  },
  {
    speciesId: "morenivoth",
    roman: "FINALE",
    title: "MORENIVOTH IL FRADICIO",
    qty: 8,
    flavor: "cioccolato",
    timerMs: 15000,
    turns: 3,
    boss: true,
    intro: [
      { spk: "NARRATORE", text: "FINALE — Il cielo si apre come un pacchetto di patatine andato a male. LUI scende, grondante fango." },
      { spk: "morenivoth", text: "QUINDI SARESTI TU, L'EVOCATORE DEI MORENINI CROCCANTI? E QUESTI SAREBBERO... I MIEI OTTO CROCCANTI TRADITORI?" },
      { spk: "TU", text: "Otto su otto, Morenivoth. È finita." },
      { spk: "morenivoth", text: "FINITA?! FINITA?! IO HO RUBATO LA CROCCANTEZZA DELL'UNIVERSO! PROVA A OFFRIRMI 8 MORENINI AL CIOCCOLATO SENZA TREMARE!" },
      { spk: "TU", text: "Affare fatto. Ma il crunch... te lo faccio sentire da vicino." },
    ],
    outro: [
      { spk: "NARRATORE", text: "L'ultimo morenino si spezza. Il suono è ASSORDANTE." },
      { spk: "morenivoth", text: "NOOOO! IL CRUNCH! IL GLORIOSO CRUUUNCH! MI STO... ASCIUGANDO?!" },
      { spk: "NARRATORE", text: "Morenivoth il Fradicio evapora in una nuvola di pangrattato. Su Morenopoli torna a splendere un sole croccante." },
      { spk: "TU", text: "Missione compiuta. E la confezione famiglia è ancora mezza piena." },
      { spk: "NARRATORE", text: "La profezia aveva ragione: bastavano un evocatore mediocre, otto Moreni e un biscotto al momento giusto." },
    ],
  },
];

export interface PerkDef {
  name: string;
  desc: string;
}

export const PERKS: Record<string, PerkDef> = {
  morenozzo: { name: "BASIC MA UTILE", desc: "+2s al timer di ogni capitolo" },
  morenello: { name: "CORNA PARAFULMINE", desc: "Il primo errore di gusto per capitolo è perdonato" },
  morenilla: { name: "PIANTO DIETETICO", desc: "25% di probabilità: un'offerta vale doppio" },
  tamarro: { name: "CATENACCIO PORTAFORTUNA", desc: "+75 punti a ogni reclutamento" },
  morenito: { name: "5G SPIRITUALE", desc: "Penalità per errore: 2,5s invece di 5s" },
  baron: { name: "CERVELLO DI SCORTA", desc: "30% di probabilità di un Press Turn extra" },
  morenilde: { name: "MAGLIONE MALEDETTO", desc: "+15% punti reclutamento" },
  reMorenone: { name: "DECRETO REALE", desc: "+150 punti per ogni capitolo senza errori" },
};
