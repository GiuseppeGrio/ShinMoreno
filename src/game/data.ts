export type FlavorId = "cioccolato" | "fragola" | "pistacchio" | "liscio";

export interface FlavorDef {
  id: FlavorId;
  name: string;
  color: number;
  css: string;
  cssDark: string;
  chip: string;
}

export const FLAVOR_LIST: FlavorId[] = ["cioccolato", "fragola", "pistacchio", "liscio"];

export const FLAVORS: Record<FlavorId, FlavorDef> = {
  cioccolato: { id: "cioccolato", name: "CIOCCOLATO", color: 0x8a4b2a, css: "#8a4b2a", cssDark: "#5c2f17", chip: "#3d1e0c" },
  fragola: { id: "fragola", name: "FRAGOLA", color: 0xff6fa5, css: "#ff6fa5", cssDark: "#c23a6e", chip: "#b81e57" },
  pistacchio: { id: "pistacchio", name: "PISTACCHIO", color: 0x9bd84b, css: "#9bd84b", cssDark: "#5f8f24", chip: "#4a7317" },
  liscio: { id: "liscio", name: "LISCIO", color: 0xd8b98a, css: "#d8b98a", cssDark: "#a8854f", chip: "#8a6a35" },
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
  snout?: boolean;
  tusks?: boolean;
  mustache?: boolean;
  beret?: boolean;
  heart?: boolean;
  hood?: boolean;
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
  special?: boolean;
  baseHp: number;
  baseAtk: number;
  recruitLines: string[];
  angryLines: string[];
  hurtLines: string[];
}

const sp = (o: SpeciesDef) => o;

/* ------------------------------------------ PERSONAGGI (ritratti + NPC) */
export const CHARACTERS: Record<string, SpeciesDef> = {
  donmoreno: sp({
    id: "donmoreno", name: "DON MORENO", title: "IL CAPO DEI MORENI", radius: 1.3,
    bodyColor: 0x7a3ff2, bellyColor: 0xc9a6ff, accentColor: 0xffd700,
    parts: { crown: true, chain: true, mustache: true }, favorite: "cioccolato", big: true,
    baseHp: 999, baseAtk: 99, recruitLines: [], angryLines: [], hurtLines: [],
  }),
  miconosca: sp({
    id: "miconosca", name: "MICO NOSCA", title: "CAPO DELLA RIVOLTA SOCIALE", radius: 1.0,
    bodyColor: 0xe8503a, bellyColor: 0xffc9b3, accentColor: 0xffe066,
    parts: { beret: true, antenna: true }, favorite: "fragola",
    baseHp: 120, baseAtk: 12, recruitLines: [], angryLines: [], hurtLines: [],
  }),
  coizio: sp({
    id: "coizio", name: "COIZIO", title: "APOSTOLO DEL CONTATTO FISICO", radius: 1.05,
    bodyColor: 0xff7fb2, bellyColor: 0xffd9e8, accentColor: 0xff4f9a,
    parts: { heart: true }, favorite: "fragola",
    baseHp: 130, baseAtk: 11, recruitLines: [], angryLines: [], hurtLines: [],
  }),
  ginosatri: sp({
    id: "ginosatri", name: "GINO SATRI", title: "FILOSOFO DEL MALE OMEOPATICO", radius: 1.0,
    bodyColor: 0x2e2440, bellyColor: 0x55486e, accentColor: 0x9b59ff,
    parts: { hood: true, tears: true }, favorite: "liscio",
    baseHp: 110, baseAtk: 13, recruitLines: [], angryLines: [], hurtLines: [],
  }),
  clomp: sp({
    id: "clomp", name: "CLOMP", title: "IL RAGAZZINO DAI LUNGHI CAPELLI BLU", radius: 0.9,
    bodyColor: 0x3f6df0, bellyColor: 0xf2c9a0, accentColor: 0x7fd0ff,
    parts: {}, favorite: "liscio",
    baseHp: 150, baseAtk: 20, recruitLines: [], angryLines: [], hurtLines: [],
  }),
};

/* ------------------------------------------ SPECIE COLLEZIONABILI */
export const SPECIES: SpeciesDef[] = [
  sp({
    id: "morenozzo", name: "MORENOZZO", title: "IL BASIC DELL'OLTRETOMBA", radius: 0.95,
    bodyColor: 0xff5fa2, bellyColor: 0xffd1e8, accentColor: 0xffd166, parts: {}, favorite: "liscio",
    baseHp: 36, baseAtk: 8,
    recruitLines: ["OK, MI PIACI. ORA VIVO NEL TUO TELEFONO.", "CONTRATTO FIRMATO. HO IL WI-FI ANCH'IO?"],
    angryLines: ["IL MIO AVVOCATO SENTIRÀ PARLARE DI TE!", "MA COSA MI DAI?! È UN INSULTO!"],
    hurtLines: ["AHI! IL MIO ORGOGLIO!", "QUESTO ERA IL MIO FIANCO MIGLIORE!"],
  }),
  sp({
    id: "morenello", name: "MORENELLO CORNUTO", title: "DUE CORNA, ZERO PAZIENZA", radius: 0.9,
    bodyColor: 0xff4757, bellyColor: 0xffb3b3, accentColor: 0xffe066, parts: { horns: true, tail: true }, favorite: "cioccolato",
    baseHp: 40, baseAtk: 10,
    recruitLines: ["LE MIE CORNA BRILLANO DI GIOIA. SONO TUO.", "ACCETTO. MA LE CORNA NON SI TOCCANO."],
    angryLines: ["TI INCORNO LA MACCHINA!", "MI HAI FATTO INCAVOLARE. E HO LE CORNA!"],
    hurtLines: ["LE CORNA! ATTENTO ALLE CORNA!", "GRRR, ME LA LEGO AL DITO."],
  }),
  sp({
    id: "morenilla", name: "MORENILLA DRAMMATICA", title: "PIANGE ANCHE QUANDO VINCE", radius: 0.85,
    bodyColor: 0xb98aff, bellyColor: 0xe6d5ff, accentColor: 0x7ee8fa, parts: { catEars: true, tears: true }, favorite: "fragola",
    baseHp: 30, baseAtk: 9,
    recruitLines: ["*SNIFF* NESSUNO MI AVEVA MAI CONVINTA CON LE BOTTE... *SNIFF* VERRÒ CON TE.", "SONO COSÌ FELICE CHE PIANGO. PIÙ DI PRIMA."],
    angryLines: ["*PIANTO DRAMMATICO* UN MORENINO MOLLICCIO?! *SINGHIOZZO*", "ORA PIANGO PER 300 ANNI. GRAZIE, EH."],
    hurtLines: ["*SNIFF* ANCHE LE BOTTE...", "PIANGO, MA CON DIGNITÀ."],
  }),
  sp({
    id: "tamarro", name: "MORENO TAMARRO", title: "OCCHIALI DA SOLE ANCHE AL BUIO", radius: 1.0,
    bodyColor: 0xff9f43, bellyColor: 0xffd9a0, accentColor: 0xffd700, parts: { sunglasses: true, chain: true }, favorite: "pistacchio",
    baseHp: 46, baseAtk: 11,
    recruitLines: ["FRA, MI HAI CONVINTO A SUON DI SBERLE. RISPETTO.", "CI STO. MA GUIDO IO LA MOTO INFERNALE."],
    angryLines: ["FRA, MI HAI OFFESO IL CATENACCIO D'ORO!", "COSÌ MI ROVINI IL CIUFFO, FRA!"],
    hurtLines: ["FRA! IL CIUFFO!", "OK, OK, COLPO DA UOMO..."],
  }),
  sp({
    id: "morenito", name: "MORENITO SPRINT", title: "ANTENNA 5G E GAMBE A MOLLA", radius: 0.8,
    bodyColor: 0x4dd8ff, bellyColor: 0xc9f2ff, accentColor: 0xffe14d, parts: { antenna: true, tail: true }, favorite: "liscio",
    baseHp: 32, baseAtk: 12,
    recruitLines: ["BIP-BOP! SCONFITTA RICONOSCIUTA. SONO NEL TUO ALBUM.", "VELOCITÀ LUCE! CONTRATTO FIRMATO IN 0.3 SECONDI."],
    angryLines: ["ERRORE 404: MORENINO NON GRADITO!", "TI SCARICO LA BATTERIA AL 1% PER SEMPRE!"],
    hurtLines: ["PING ALTISSIMO! CHE DOLORE!", "MI HAI ROTTO IL FIREWALL!"],
  }),
  sp({
    id: "baron", name: "BARON MORENSTEIN", title: "CUCITO A MANO NEL 1818", radius: 1.05,
    bodyColor: 0x69d84f, bellyColor: 0xb8f0a8, accentColor: 0xc8d6e5, parts: { bolts: true }, favorite: "pistacchio",
    baseHp: 56, baseAtk: 9,
    recruitLines: ["GRRR... BENE. IL BARONE SI ACCONTENTA.", "IL MIO CERVELLO APPROVA. QUELLO DI SCORTA PURE."],
    angryLines: ["GRRRR! I BULLONI MI FRIZZANO DI RABBIA!", "TI SMONTO E TI RIMONTO AL CONTRARIO!"],
    hurtLines: ["I BULLONI! STRINGI I BULLONI!", "GRRR... COLPO DEGNO."],
  }),
  sp({
    id: "morenilde", name: "MORENILDE NONNA", title: "SFERRUZZA MAGLIONI MALEDETTI", radius: 0.9,
    bodyColor: 0xc39bd3, bellyColor: 0xead9f2, accentColor: 0xdfe6e9, parts: { bun: true, glasses: true }, favorite: "fragola",
    baseHp: 42, baseAtk: 8,
    recruitLines: ["BRAVO TESORO. VERRÒ A STARE DA TE. TI LAVO I MAGLIONI.", "CHE CARO. TI HO GIÀ SFERRUZZATO UN MAGLIONE MALEDETTO."],
    angryLines: ["AI MIEI TEMPI LE BOTTE ERANO PIÙ EDUCATE!", "TI FACCIO UN MAGLIONE CHE PUNGE PER L'ETERNITÀ!"],
    hurtLines: ["SOSPIRO... CHE MANI LEGGERE.", "UNA VOLTA I FERRI ERANO PIÙ MORBIDI."],
  }),
  sp({
    id: "reMorenone", name: "RE MORENONE III", title: "SOVRANO DEL REGNO DEI MORENI", radius: 1.25,
    bodyColor: 0xa55eea, bellyColor: 0xd3a6ff, accentColor: 0xffd700, parts: { crown: true, chain: true }, favorite: "cioccolato",
    big: true, special: true, baseHp: 62, baseAtk: 13,
    recruitLines: ["HAI VINTO CON ONORE, SUDDITO. IL REGNO TI ACCOGLIE.", "LA CORONA APPROVA. SEI IL MIO NUOVO PASTICCERE DI CORTE."],
    angryLines: ["LESA MAESTÀ! QUESTO È UN REGICIDIO GASTRONOMICO!", "TI CONDANNO ALLA FILA ETERNA ALLA MENSA INFERNALE!"],
    hurtLines: ["UN RE NON SENTE IL DOLORE. AHI.", "LA CORONA MI TRATTIENE DAL CADERE."],
  }),
  sp({
    id: "facocero", name: "MORENOFACOCERO GRUFOLANTE", title: "GRUFOLA NEI CAMPI DI MORENINI", radius: 0.95,
    bodyColor: 0xb07b4f, bellyColor: 0xe0c39a, accentColor: 0xf5e6c8, parts: { snout: true, tusks: true, tail: true }, favorite: "pistacchio",
    baseHp: 44, baseAtk: 10,
    recruitLines: ["GRUF GRUF. HAI VINTO. TI SEGUIRÒ OVUNQUE CI SIA FANGO.", "OK. MA IL FANGO DEL TUO GIARDINO ME LO GESTISCO IO."],
    angryLines: ["GRUFOLATA DI PROTESTA!", "TI SCODOLO IL TERRENO SOTTO I PIEDI!"],
    hurtLines: ["GRUF! IL GRUGNO!", "LE SETOLE! SONO APPENA SPUNTATE!"],
  }),
  sp({
    id: "cinghiaale", name: "CINGHIA ALE", title: "CAPO TRIBÙ DEI MORENOFACOCERI", radius: 1.15,
    bodyColor: 0x8f5a2b, bellyColor: 0xd6b183, accentColor: 0xffd700, parts: { snout: true, tusks: true, chain: true, horns: true }, favorite: "cioccolato",
    big: true, special: true, baseHp: 105, baseAtk: 14,
    recruitLines: ["GRUF. SEI FORTE. LA TRIBÙ TI RICONOSCE... E IO PURE.", "UN CAPO CHE PERDE CON ONORE È DOPPIO CAPO. SONO TUO."],
    angryLines: ["GRUUUF! NESSUNO OFFENDE CINGHIA ALE!", "TI CARICO FINO AL CONFINE DEL MONDO!"],
    hurtLines: ["LE ZANNE! LE ZANNE SONO SACRE!", "GRUF... COLPO DA CAPO."],
  }),
  sp({
    id: "maledelmondo", name: "MALE DEL MONDO", title: "L'ESSENZA DEL MALE DEL MONDO", radius: 1.1,
    bodyColor: 0x170d26, bellyColor: 0x2e1b47, accentColor: 0xff2e5f, parts: { hood: true, tears: true }, favorite: "liscio",
    big: true, special: true, baseHp: 135, baseAtk: 15,
    recruitLines: ["...MI OFFRO VOLONTARIO. LETTERALMENTE.", "VA BENE. MA NEL CASSETTO CI STO COMODO, EH."],
    angryLines: ["IO SONO TUTTO CIÒ CHE AVANZA. ANCHE TU AVANZERAI.", "IL MALE NON SI OFFRE. IL MALE SI PRENDE."],
    hurtLines: ["...STO SOLO FACENDO FINTA.", "IL DOLORE È IL MIO HABITAT."],
  }),
  sp({
    id: "maialedelmondo", name: "MAIALE DEL MONDO", title: "IL FACOCEMORENO FINALE", radius: 1.55,
    bodyColor: 0x6e4a6e, bellyColor: 0xa97fb0, accentColor: 0xff2e5f, parts: { snout: true, tusks: true, chain: true }, favorite: "cioccolato",
    big: true, baseHp: 230, baseAtk: 18,
    recruitLines: [],
    angryLines: ["GRUUUUUF! IL MONDO È MIO E LO MANGIO A MORSI!", "NESSUNA SPADA, NESSUN AMORE. SOLO GRUGNO."],
    hurtLines: ["UN GRUGNO COSÌ NON SI TOCCA!", "IL MONDO TREMA... O SONO IO?"],
  }),
  sp({
    id: "nonnopurificato", name: "NONNO MORENO (PURIFICATO)", title: "IL FONDATORE, TORNATO LINDO", radius: 1.2,
    bodyColor: 0xfff3d6, bellyColor: 0xffffff, accentColor: 0xffd700, parts: { snout: true, tusks: true, crown: true }, favorite: "cioccolato",
    big: true, baseHp: 75, baseAtk: 15,
    recruitLines: ["GRUF... GRAZIE, GIOVANI. CHE PULIZIA PROFONDA.", "LA SPADA DELL'AMORE PROFUMA DI AMMORBIDENTE."],
    angryLines: [], hurtLines: [],
  }),
];

export function speciesById(id: string): SpeciesDef {
  return SPECIES.find((s) => s.id === id) ?? CHARACTERS[id] ?? SPECIES[0];
}

/* ------------------------------------------ MONDO */
export interface ZoneDef {
  id: string;
  name: string;
  tagline: string;
  x: number;
  z: number;
  r: number;
  color: number;
  diff: number;
  wilds?: { id: string; w: number }[];
}

export const ZONES: ZoneDef[] = [
  { id: "morenopoli", name: "MORENOPOLI", tagline: "La piazza profuma di forno spento.", x: 0, z: 2, r: 9.5, color: 0x3a2b66, diff: 0 },
  { id: "valle", name: "VALLE DEI FACOCERI", tagline: "Grufoli echeggiano tra i cardi.", x: -21, z: -14, r: 8.5, color: 0x6e4a26, diff: 1,
    wilds: [{ id: "facocero", w: 5 }, { id: "morenozzo", w: 3 }, { id: "morenello", w: 3 }] },
  { id: "rivolta", name: "ACCAMPAMENTO DELLA RIVOLTA", tagline: "Qui si abbracciano le idee, non i pugni.", x: 21, z: -14, r: 8.5, color: 0x6e2430, diff: 2,
    wilds: [{ id: "tamarro", w: 4 }, { id: "morenito", w: 4 }, { id: "morenilla", w: 3 }] },
  { id: "terme", name: "TERME DEL CONTATTO", tagline: "Vapore rosa e carezze termali.", x: 23, z: 14, r: 8, color: 0x7a2b5e, diff: 2,
    wilds: [{ id: "morenilla", w: 4 }, { id: "morenilde", w: 4 }, { id: "baron", w: 2 }] },
  { id: "abisso", name: "ABISSO DI GINO", tagline: "Il male del mondo ristagna qui. Che profumo di chiuso.", x: -23, z: 14, r: 8, color: 0x1c1030, diff: 3,
    wilds: [{ id: "baron", w: 4 }, { id: "morenito", w: 3 }, { id: "reMorenone", w: 2 }] },
  { id: "antro", name: "ANTRO DEL MAIALE", tagline: "Un grugnito cosmico fa vibrare i sassi.", x: 0, z: 31, r: 6.5, color: 0x4a1020, diff: 0 },
];

export interface NpcDef {
  id: string;
  name: string;
  speciesId: string;
  x: number;
  z: number;
}

export const NPCS: NpcDef[] = [
  { id: "don", name: "DON MORENO", speciesId: "donmoreno", x: -3.6, z: 5.4 },
  { id: "clomp", name: "CLOMP", speciesId: "clomp", x: 2.6, z: 0.6 },
  { id: "cinghia", name: "CINGHIA ALE", speciesId: "cinghiaale", x: -21, z: -12 },
  { id: "mico", name: "MICO NOSCA", speciesId: "miconosca", x: 21, z: -12 },
  { id: "coizio", name: "COIZIO", speciesId: "coizio", x: 23, z: 16 },
  { id: "gino", name: "GINO SATRI", speciesId: "ginosatri", x: -23, z: 16 },
];

/* ------------------------------------------ OGGETTI */
export const ITEMS: Record<string, { name: string; desc: string }> = {
  spilla: { name: "SPILLA DELLA RIVOLTA", desc: "ATK del party +25% (la solidarietà è un moltiplicatore)" },
  abbraccio: { name: "ABBRACCIO ETERNO DI COIZIO", desc: "Tasso di cattura +20% (il contatto convince)" },
  fiala: { name: "FIALA DI MALE OMEOPATICO", desc: "15% di colpi a danno doppio: il male cura il male" },
};

/* ------------------------------------------ CONSUMABILI (menu RPG) */
export interface ConsumableDef {
  id: string;
  name: string;
  desc: string;
  hue: string;
  heal: number;
  fullHeal?: boolean;
  all?: boolean;
  revive?: boolean;
}

export const CONSUMABLES: Record<string, ConsumableDef> = {
  croccantino: { id: "croccantino", name: "MORENINO CROCCANTE", desc: "Ridona 45 HP a un Moreno. Il crunch è terapeutico.", hue: "#d8b98a", heal: 45 },
  famiglia: { id: "famiglia", name: "MORENINO FAMIGLIA", desc: "Ripristina TUTTI gli HP di un Moreno. Formato XL.", hue: "#ffc94d", heal: 0, fullHeal: true },
  crostata: { id: "crostata", name: "CROSTATA DI NONNA MORENILDE", desc: "Ridona 60 HP a TUTTO il party. Punge un po', ma cura.", hue: "#ff6fa5", heal: 60, all: true },
  caffe: { id: "caffe", name: "CAFFÈ DEMONIACO", desc: "Rianima un Moreno al tappeto con il 50% degli HP. Doppio, ristretto, cattivo.", hue: "#8a4b2a", heal: 0, revive: true },
};

export const CONSUMABLE_LIST: ConsumableDef[] = [
  CONSUMABLES.croccantino,
  CONSUMABLES.famiglia,
  CONSUMABLES.crostata,
  CONSUMABLES.caffe,
];

export const START_CONSUMABLES: Record<string, number> = {
  croccantino: 3,
  crostata: 1,
};

/* ------------------------------------------ DIALOGHI */
export interface DialogueLine {
  spk: string;
  text: string;
  choices?: string[];
}

export const SCRIPTS: Record<string, DialogueLine[]> = {
  prologue: [
    { spk: "NARRATORE", text: "Morenopoli, anno 666 del Crunch. Da quando il MAIALE DEL MONDO ha ingoiato la Croccantezza Eterna, i morenini escono dal forno... MOLLI." },
    { spk: "NARRATORE", text: "Un morenino molle è un affronto. Due sono una crisi. Tutta la produzione è una catastrofe cosmica." },
    { spk: "donmoreno", text: "EHI. TU. SÌ, TU COL COMP-OS CRACKATO. SONO DON MORENO, IL CAPO DEI MORENI. FINALMENTE UN EVOCATORE." },
    { spk: "TU", text: "Veramente cercavo solo il bagno..." },
    { spk: "donmoreno", text: "BAGNO DOPO. PRIMA LA PROFEZIA: gli Otto Croccanti sono dispersi, la Tribù dei Facoceri è infuriata e tre ideologie litigano sulla cura del male del mondo." },
    { spk: "donmoreno", text: "SOLO CHI OFFRE MORENINI COL CUORE PUÒ CONVINCERE I MORENI. COMBATTI, CONVINCI, OFFRI. È COSÌ CHE SI CATTURA. È COSÌ CHE SI CURA." },
    { spk: "TU", text: "Quindi... la chiave di tutto sono i biscotti?" },
    { spk: "donmoreno", text: "I MORENINI NON SONO BISCOTTI. SONO UN ATTO D'AMORE CROCCANTE. ORA VAI: inizia dalla VALLE DEI FACOCERI. CINGHIA ALE ti aspetta. E non calpestare i grufoli." },
  ],

  don1: [
    { spk: "donmoreno", text: "LA PROFEZIA È CHIARA, RAGAZZO: placa la Tribù dei Facoceri, poi Rivolta, Terme e Abisso. Su, su. I morenini non si offrono da soli." },
  ],

  cinghia_pre: [
    { spk: "cinghiaale", text: "ALTOLÀ, GAMBE LISCE. SEI NELLA VALLE DEI MORENOFACOCERI. IO SONO CINGHIA ALE, CAPO TRIBÙ, E TU PESTI IL NOSTRO FANGO SACRO." },
    { spk: "TU", text: "Don Moreno mi manda. Il Maiale del Mondo ha—" },
    { spk: "cinghiaale", text: "IL MAIALE! GRUF! HA MANGIATO ANCHE I NOSTRI CAMPI DI MORENINI. DA ALLORA GRUFOLIAMO A VUOTO. VUOI PARLARE CON ME? VINCI CON ME." },
    { spk: "cinghiaale", text: "REGOLA DELLA TRIBÙ: CHI MI CONVINCE IN BATTAGLIA — CON LE BOTTE O COL MORENINO GIUSTO — GUIDA LA TRIBÙ. O QUASI. IN BOCCA AL CINGHIALE." },
  ],
  cinghia_post: [
    { spk: "cinghiaale", text: "GRUF... HAI VINTO. LA TRIBÙ È TUA ALLEATA, EVOCATORE. E TI DICO UNA COSA: il male che ha sporcato il Maiale puzza di MORENINI ABBANDONATI." },
    { spk: "cinghiaale", text: "VAI DAGLI ALTRI. RIVOLTA E TERME. POI L'ABISSO. E QUANDO TROVI IL MAIALE... DIGLI CHE CINGHIA ALE NON HA PAURA. GRUF." },
  ],

  mico1: [
    { spk: "miconosca", text: "FERMO LÌ! SEI UN AGENTE DEL MALE O UN SIMPATIZZANTE? SONO MICO NOSCA, CAPO DELLA RIVOLTA SOCIALE." },
    { spk: "miconosca", text: "LA NOSTRA IDEOLOGIA È SEMPLICE: IL MALE DEL MONDO SI CURA METTENDO AL CENTRO I RAPPORTI UMANI. NIENTE BOTTE. SOLO DOMANDE." },
    { spk: "miconosca", text: "Rispondi bene a tre domande e avrai la SPILLA DELLA RIVOLTA. Rispondi male... ti iscrivo al corso di ascolto attivo. RISPOSTE SECCHE." },
  ],
  mico_q1: [
    { spk: "miconosca", text: "DOMANDA UNO: un moreno piange da solo su una panchina di Morenopoli. Che fai?",
      choices: ["Lo lascio in pace: piangere è privato", "Mi siedo accanto, ascolto e resto", "Gli grido che piangere è da deboli"] },
  ],
  mico_q2: [
    { spk: "miconosca", text: "DOMANDA DUE: a cosa serve davvero una rivolta?",
      choices: ["A urlare più forte degli altri", "A ricordare che nessuno si salva da solo", "A ottenere il parcheggio riservato"] },
  ],
  mico_q3: [
    { spk: "miconosca", text: "ULTIMA DOMANDA: il male del mondo si cura con...",
      choices: ["Un rapporto umano alla volta", "Una spada molto grande", "Il digiuno dai sentimenti"] },
  ],
  mico_win: [
    { spk: "miconosca", text: "RISPOSTE ESATTE. TRE SU TRE. HAI IL CUORE DELLA RIVOLTA, EVOCATORE." },
    { spk: "miconosca", text: "PRENDI LA SPILLA DELLA RIVOLTA: i tuoi Moreni colpiranno più forte, perché colpiranno INSIEME. E UN CONSIGLIO: passa da COIZIO, alle Terme. Dice che la rivoluzione si fa abbracciando. Esagerato. Geniale." },
    { spk: "TU", text: "E Gino? Tutti nominano l'Abisso..." },
    { spk: "miconosca", text: "GINO SATRI... predica che il male si cura col male. Omeopatia del disastro. Stagli vicino, ma NON ascoltare troppo a lungo." },
  ],
  mico_fail: [
    { spk: "miconosca", text: "SBAGLIATO. LO SENTO DAL TONO. Il corso di ascolto attivo è al giovedì, ma per te faccio un'eccezione: RIPROVA SUBITO." },
  ],

  coizio1: [
    { spk: "coizio", text: "oh. ciao. sei nuovo. io sono COIZIO. non ti chiedo chi sei. ti chiedo come stai DAVVERO." },
    { spk: "coizio", text: "la mia ideologia: il male del mondo si cura col CONTATTO FISICO. un abbraccio ben fatto vale più di mille profezie." },
    { spk: "coizio", text: "ti do l'ABBRACCIO ETERNO se dimostri di saper abbracciare. regola unica: RIEMPI IL CUORE. premi SPAZIO come se il mondo dipendesse da un abbraccio. perché dipende da quello." },
  ],
  coizio_win: [
    { spk: "coizio", text: "...lo senti? quel calore tra le scapole? è la cura che entra. L'ABBRACCIO ETERNO è tuo: da oggi i moreni si lasceranno convincere più in fretta. il contatto convince." },
    { spk: "coizio", text: "un'ultima cosa, evocatore. GINO... era mio amico. poi ha iniziato a bere il male del mondo 'a piccole dosi'. ora gli cola dagli occhi. vai piano con lui." },
  ],

  gino1: [
    { spk: "ginosatri", text: "...sei arrivato fin quaggiù. nell'Abisso. complimenti. o condoglianze. io sono GINO SATRI." },
    { spk: "ginosatri", text: "la mia ideologia è l'unica onesta: IL MALE DEL MONDO SI CURA COL MALE DEL MONDO. omeopatia. piccole dosi. io lo bevo ogni sera, il male. un bicchierino alla volta." },
    { spk: "TU", text: "Non è... il contrario di una cura?" },
    { spk: "ginosatri", text: "è quello che dicono tutti. finché non provano. guarda: ti mostro cosa tengo in cantina. la chiamo L'ESSENZA. la chiamo... MALE DEL MONDO." },
    { spk: "NARRATORE", text: "Dalla botola dell'Abisso sale un'ombra spessa come minestra dimenticata. Gino indietreggia. «AH. FORSE HO ESAGERATO CON LE DOSI.»" },
    { spk: "ginosatri", text: "SCUSA. SCUSA. SCUSA. È DIVENTATO... TANTO. FERMALO TU, EVOCATORE. IO INTANTO RIVEDO LA MIA TESI." },
  ],
  gino_post: [
    { spk: "ginosatri", text: "...dunque l'Essenza è stata sconfitta. e io, per la prima volta in anni, ho lo stomaco LEGGERO." },
    { spk: "ginosatri", text: "ho capito l'errore, evocatore. il male non si cura col male. il male del mondo... è fatto di MORENINI LASCIATI DIVENTARE MOLLI NEL CASSETTO. è abbandono. si cura offrendo. tu lo fai ogni battaglia. per questo vinci." },
    { spk: "ginosatri", text: "tieni questa FIALA. omeopatia VERA, stavolta: una goccia di male, usata BENE, raddoppia la forza dei tuoi colpi. e adesso... torna da Don Moreno. digli che il filosofo si scusa." },
  ],

  don2: [
    { spk: "donmoreno", text: "DUNQUE: la Tribù è con te, la Rivolta ti spilla, le Terme ti abbracciano e il Filosofo si è ravveduto. IMPRESSIONANTE, PER UNO CHE CERCAVA IL BAGNO." },
    { spk: "donmoreno", text: "ora la verità che non ti ho detto. colpo di scena, reggiti: il MAIALE DEL MONDO non è un mostro qualsiasi. è MIO NONNO." },
    { spk: "TU", text: "...come, scusi?" },
    { spk: "donmoreno", text: "NONNO MORENO, il fondatore di Morenopoli. voleva assorbire il male del mondo per proteggerci. ci è riuscito. poi il male lo ha reso un MAIALE. letteralmente." },
    { spk: "donmoreno", text: "solo la SPADA DELL'AMORE può purificarlo. ma è conficcata nel GRANDE MORENINO, al centro della piazza, e nessuno riesce a estrarla." },
    { spk: "donmoreno", text: "la spada sceglie. sceglie chi i Moreni riconoscono come AMICO. fai amicizia con abbastanza Moreni — OFFRENDO, non solo vincendo — e forse... forse si muoverà." },
  ],

  sword_fail: [
    { spk: "NARRATORE", text: "Tiri la spada. La spada non si muove. Dal Grande Morenino arriva un rutto giudicante." },
    { spk: "donmoreno", text: "NON ANCORA. la spada conta i tuoi amici, non i tuoi muscoli. vai, OFFRI morenini, recluta Moreni. torna quando il tuo cuore sarà più pieno delle tue tasche." },
  ],
  sword_pull: [
    { spk: "NARRATORE", text: "Appoggi la mano all'elsa. Il Grande Morenino fa «crunch». La spada scivola fuori come burro fuso, cantando in falsetto." },
    { spk: "NARRATORE", text: "Una luce dorata avvolge la piazza. Il ragazzino dai lunghi capelli blu, che tutti credevano addormentato da secoli... apre gli occhi." },
    { spk: "clomp", text: "...quanto ho dormito? sento odore di spada. e di morenini. soprattutto di spada." },
    { spk: "clomp", text: "sono CLOMP, cavaliere sacro di Morenopoli. tu mi hai svegliato, e la spada ha scelto te... quindi ora scelgo anch'io: vengo con te. al Maiale penso io. letteralmente: SOLO IO POSSO BRANDIRLA." },
    { spk: "clomp", text: "il portale per l'ANTRO si è aperto. andiamo, evocatore. portiamo a Nonno la medicina che si merita: l'AMORE, con retrogusto di croccante." },
  ],

  antro_intro: [
    { spk: "NARRATORE", text: "L'Antro puzza di cantina cosmica. Al centro, enorme, gonfio di male e di mollica, dormicchia il MAIALE DEL MONDO." },
    { spk: "maialedelmondo", text: "GRUUUUF... sento odore di spada. e di affetto. DUE COSE CHE ODIO. (la terza è l'ammorbidente.)" },
    { spk: "clomp", text: "Nonno... non è troppo tardi. Evocatore: ammorbidiscilo con le botte, io preparo la SPADA DELL'AMORE. quando sarà pronto, lo sapremo tutti." },
  ],
  maiale_mid: [
    { spk: "NARRATORE", text: "Il Maiale del Mondo barcolla. Il male che lo gonfia inizia a perdere colpi, come una suoneria scarica." },
    { spk: "clomp", text: "ADESSO. La spada canta. Evocatore... GRAZIE. Ora guarda: si purifica così." },
    { spk: "NARRATORE", text: "Clomp alza la SPADA DELL'AMORE. Un arcobaleno a forma di cuore, ma MASCHIO, attraversa l'Antro. Il male evapora urlando «RITORNERÒ... NEL CASSETTO...»" },
  ],
  finale: [
    { spk: "NARRATORE", text: "Dove c'era il Maiale del Mondo ora c'è un anziano facocemoreno, pulito, profumato, commosso." },
    { spk: "nonnopurificato", text: "GRUF... quanti anni ho dormito nel male? ...don? quel nano con la corona che piange lì... è mio nipote?" },
    { spk: "donmoreno", text: "NONNOOOO! TI HO DETTO MILLE VOLTE DI NON FARTI CARICO DEL MALE DEL MONDO DA SOLO! SI FA IN FAMIGLIA, SI FA!" },
    { spk: "nonnopurificato", text: "ho sbagliato. ma qualcuno, battaglia dopo battaglia, morenino dopo morenino... mi ha ricordato che il male si cura offrendo. grazie, evocatore mediocre. il più mediocre che ci sia mai riuscito." },
    { spk: "NARRATORE", text: "La Croccantezza Eterna torna a Morenopoli. I forni riaccendono. I morenini tornano croccanti. Nel cassetto di Gino, una fiala vuota sorride." },
    { spk: "maledelmondo", text: "(da lontano, quasi inudibile) ...un giorno qualcuno lascerà un morenino nel cassetto... e io tornerò... con gli interessi... e il latte..." },
  ],

  don_revive: [
    { spk: "donmoreno", text: "guarda chi è tornato. SBRICIOLATO. ti ho raccattato con la paletta, eh. riposati, riparti. i tuoi Moreni sono già pronti: non sanno fare altro che volerti bene." },
  ],

  hug_hint: [
    { spk: "coizio", text: "premi SPAZIO. riempi il cuore. non fermarti: l'abbraccio non è una raffica, è una promessa." },
  ],

  pc_intro: [
    { spk: "NARRATORE", text: "Sullo schermo del PC lampeggia un logo a forma di cuore pixellato. Una voce gentile filtra dalle casse." },
    { spk: "NARRATORE", text: "«Ciao! Sono MICA LIZZI. Questo è il mio PC: 100 slot per i tuoi Morenini. Depositane, ritirane, e se proprio devi... liberali. Ma pensaci due volte.»" },
  ],
};

export const TRIAL_QUIZ = {
  answers: [1, 1, 0],
  scripts: ["mico_q1", "mico_q2", "mico_q3"],
};

export const SWORD_REQ = 8;

export const CAST: { name: string; role: string }[] = [
  { name: "DON MORENO", role: "Il Capo dei Moreni. Piange solo quando non guarda nessuno." },
  { name: "CLOMP", role: "Cavaliere sacro. Capelli blu, cuore d'oro, spada in dotazione." },
  { name: "CINGHIA ALE", role: "Capo tribù. Il fango sacro ora ha un comitato di gestione." },
  { name: "MICO NOSCA", role: "Capo della rivolta. I rapporti umani sono ora legge costituzionale." },
  { name: "COIZIO", role: "Apostolo del contatto. Abbracci erogati: incalcolabili." },
  { name: "GINO SATRI", role: "Filosofo ravveduto. Ha pubblicato «Il male, istruzioni per NON l'uso»." },
  { name: "NONNO MORENO", role: "Fondatore purificato. Ha promesso di chiedere aiuto, ogni tanto." },
  { name: "MALE DEL MONDO", role: "Attualmente in un cassetto. Tenete d'occhio i morenini avanzati." },
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollWild(zone: ZoneDef): string {
  const wilds = zone.wilds ?? [];
  const tot = wilds.reduce((a, b) => a + b.w, 0) || 1;
  let r = Math.random() * tot;
  for (const w of wilds) {
    r -= w.w;
    if (r <= 0) return w.id;
  }
  return wilds[0]?.id ?? "morenozzo";
}

export function enemyStats(id: string, diff: number): { hp: number; atk: number } {
  const s = speciesById(id);
  if (s.baseHp > 90) return { hp: s.baseHp, atk: s.baseAtk };
  return { hp: s.baseHp + diff * 10, atk: s.baseAtk + diff * 2 };
}

/* ------------------------------------------ GENERATORE DI NOMI
   Regole: lunghezza casuale, primo carattere vocale o consonante a caso,
   alternanza consonante/vocale; raramente una doppia vocale o consonante. */
const VOWELS = "aeiou";
const CONS = "bcdfglmnrstvz";

export function generateMorenoName(): string {
  const len = 4 + Math.floor(Math.random() * 6); // 4..9
  let isVowel = Math.random() < 0.5;
  let out = "";
  for (let i = 0; i < len; i++) {
    const double = i > 0 && i < len - 1 && Math.random() < 0.12; // rara doppia
    const pool = isVowel ? VOWELS : CONS;
    const ch = pool[Math.floor(Math.random() * pool.length)];
    out += double ? ch + ch : ch;
    if (double) {
      // la doppia "salta" l'alternanza di un passo in più
      isVowel = !isVowel;
    }
    isVowel = !isVowel;
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}
