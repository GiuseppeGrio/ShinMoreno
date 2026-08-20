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
