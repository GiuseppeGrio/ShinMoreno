import * as THREE from "three";
import { CHARACTERS, FLAVORS, SPECIES, ZONES, type SpeciesDef } from "./data";

const TAU = Math.PI * 2;

const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3);
const easeInCubic = (k: number) => k * k * k;
const easeOutElastic = (k: number) => {
  const c4 = TAU / 3;
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * c4) + 1;
};

interface Anim {
  t0: number;
  dur: number;
  fn: (k: number) => void;
  done?: () => void;
}
interface Particle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  geo: THREE.BufferGeometry;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  grav: number;
  life: number;
  maxLife: number;
}
interface Flyer {
  mesh: THREE.Group;
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  t: number;
  dur: number;
  onArrive: () => void;
}

interface MorenoRefs {
  group: THREE.Group;
  species: SpeciesDef;
  bodyMat: THREE.MeshStandardMaterial;
  body: THREE.Mesh;
  mouth: THREE.Mesh;
  mouthBase: THREE.Vector3;
  eyes: THREE.Mesh[];
  pupilMat: THREE.MeshBasicMaterial;
  armL: THREE.Group;
  armR: THREE.Group;
  tears: THREE.Mesh[];
  radius: number;
  mouthY: number;
  mood: "idle" | "angry" | "happy" | "sad";
  phase: number;
  nextBlink: number;
  shadow: THREE.Mesh | null;
  demandCookies: THREE.Mesh[];
  demandMats: THREE.MeshStandardMaterial[];
  demandGroup: THREE.Group | null;
}

interface NpcRef {
  id: string;
  refs: MorenoRefs;
  x: number;
  z: number;
}
interface Wanderer {
  refs: MorenoRefs;
  sp: SpeciesDef;
  diff: number;
  hx: number;
  hz: number;
  t: number;
  phase: number;
  dead: boolean;
  respawnAt: number;
}

function makeCircleTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 512, 512);
  g.translate(256, 256);
  g.strokeStyle = "rgba(120,255,190,0.95)";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(0, 0, 228, 0, TAU);
  g.stroke();
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, 204, 0, TAU);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, 148, 0, TAU);
  g.stroke();
  const glyphs = "MORENIVMTENSEI✠†☿♆✶♰";
  g.font = "bold 24px serif";
  g.fillStyle = "rgba(140,255,200,0.85)";
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU;
    g.save();
    g.rotate(a);
    g.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], 208, 8);
    g.restore();
  }
  g.strokeStyle = "rgba(120,255,190,0.55)";
  g.lineWidth = 3;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    g.beginPath();
    g.moveTo(Math.cos(a) * 236, Math.sin(a) * 236);
    g.lineTo(Math.cos(a) * 246, Math.sin(a) * 246);
    g.stroke();
  }
  g.strokeStyle = "rgba(255,46,95,0.9)";
  g.lineWidth = 4;
  g.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + ((i * 4) % 5) * (TAU / 5);
    const x = Math.cos(a) * 148;
    const y = Math.sin(a) * 148;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.stroke();
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, 58, 0, TAU);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeFloorTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#120a20";
  g.fillRect(0, 0, 512, 512);
  g.translate(256, 256);
  for (let r = 30; r < 360; r += 26) {
    g.strokeStyle = `rgba(160,140,220,${Math.max(0.008, 0.05 - r * 0.00008)})`;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, r, 0, TAU);
    g.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * TAU;
    const r = Math.random() * 340;
    g.strokeStyle = "rgba(0,0,0,0.35)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    g.lineTo(Math.cos(a) * r + (Math.random() - 0.5) * 60, Math.sin(a) * r + (Math.random() - 0.5) * 60);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWorldTexture(): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const K = S / 2 / 42;
  const px = (x: number) => S / 2 + x * K;
  const pz = (z: number) => S / 2 + z * K;
  g.fillStyle = "#150e24";
  g.fillRect(0, 0, S, S);
  g.strokeStyle = "#251a3d";
  g.lineWidth = 20;
  g.lineCap = "round";
  for (const z of ZONES) {
    if (z.id === "morenopoli") continue;
    g.beginPath();
    g.moveTo(px(0), pz(2));
    g.lineTo(px(z.x * 0.92), pz(z.z * 0.92 + 2 * 0.08));
    g.stroke();
  }
  for (const z of ZONES) {
    const col = "#" + z.color.toString(16).padStart(6, "0");
    g.fillStyle = col;
    g.globalAlpha = 0.85;
    g.beginPath();
    g.arc(px(z.x), pz(z.z), z.r * K, 0, TAU);
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = col;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(px(z.x), pz(z.z), (z.r + 0.5) * K, 0, TAU);
    g.stroke();
  }
  g.strokeStyle = "#3a2b66";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(S / 2, S / 2, 40 * K, 0, TAU);
  g.stroke();
  for (let i = 0; i < 500; i++) {
    const a = Math.random() * TAU;
    const r = Math.random() * 40 * K;
    g.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.25)" : "rgba(190,170,240,0.05)";
    g.fillRect(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 3, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeLabel(text: string, color: string, big = false): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 192;
  const g = c.getContext("2d")!;
  g.font = `bold ${big ? 110 : 84}px "Grenze Gotisch", Georgia, serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 14;
  g.strokeStyle = "rgba(5,2,10,0.95)";
  g.strokeText(text, 512, 100);
  g.fillStyle = color;
  g.fillText(text, 512, 100);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(big ? 9 : 6.4, big ? 1.7 : 1.2, 1);
  return s;
}

export class MoreniEngine {
  private mount: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private ro: ResizeObserver;
  private disposed = false;

  private time = 0;
  paused = false;
  private mode: "attract" | "world" | "battle" = "attract";
  private camLerp: { from: THREE.Vector3; k: number } | null = null;

  private battleGroup = new THREE.Group();
  private worldGroup = new THREE.Group();

  // battle chamber
  private circleMats: THREE.MeshBasicMaterial[] = [];
  private circleInner: THREE.MeshBasicMaterial | null = null;
  private starRing: THREE.Mesh | null = null;
  private circleTarget = new THREE.Color(0x4dffa6);
  private circleModeT = 0;
  private bossLight: THREE.PointLight | null = null;
  private bossMode = false;
  private flames: THREE.Mesh[] = [];
  private flickerLights: THREE.PointLight[] = [];
  private emberGeos: { geo: THREE.BufferGeometry; speeds: Float32Array }[] = [];

  // world
  private player: THREE.Group | null = null;
  private playerPos = new THREE.Vector3(0, 0, 9);
  private playerHeading = 0;
  private input = { x: 0, z: 0 };
  private npcs: NpcRef[] = [];
  private wanderers: Wanderer[] = [];
  private swordMesh: THREE.Group | null = null;
  private questRing: THREE.Mesh | null = null;
  private portalRing: THREE.Mesh | null = null;
  private portalMat: THREE.MeshBasicMaterial | null = null;
  private portalOpen = false;
  private portalUsed = false;
  private steam: THREE.Mesh[] = [];
  private shards: THREE.Mesh[] = [];
  private clompRefs: { group: THREE.Group; sword: THREE.Group | null; awake: boolean } | null = null;
  private clompFollow = false;
  private clompSleepSprite: THREE.Sprite | null = null;
  private nearId: string | null = null;
  private curZone: string | null = null;
  private zoneCheckT = 0;

  // callbacks
  onZone: ((id: string) => void) | null = null;
  onEncounter: ((speciesId: string, diff: number) => void) | null = null;
  onPortal: (() => void) | null = null;
  onNear: ((id: string | null) => void) | null = null;

  // battle demons
  private playerDemon: MorenoRefs | null = null;
  private enemyDemon: MorenoRefs | null = null;

  private anims: Anim[] = [];
  private particles: Particle[] = [];
  private flyers: Flyer[] = [];
  private shakeAmp = 0;

  constructor(mount: HTMLElement) {
    this.mount = mount;
    const w = Math.max(1, mount.clientWidth);
    const h = Math.max(1, mount.clientHeight);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.style.display = "block";
    mount.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0614);
    this.scene.fog = new THREE.FogExp2(0x0b0614, 0.02);

    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 160);
    this.camera.position.set(0, 2.7, 8);
    this.camera.lookAt(0, 1.35, 0);

    this.scene.add(new THREE.AmbientLight(0x6a5a9a, 0.6));
    this.scene.add(new THREE.HemisphereLight(0x4a3a7a, 0x1a0f2e, 0.55));
    const dir = new THREE.DirectionalLight(0xb9a6ff, 0.6);
    dir.position.set(-5, 10, 6);
    this.scene.add(dir);

    this.buildBattleChamber();
    this.buildWorld();
    this.worldGroup.visible = false;
    this.scene.add(this.battleGroup);
    this.scene.add(this.worldGroup);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(mount);
  }

  /* ================================================= BATTLE CHAMBER */
  private buildBattleChamber() {
    const G = this.battleGroup;
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.95, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    G.add(floor);

    const pillarGeo = new THREE.BoxGeometry(1.3, 10, 1.3);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.35;
      const m = new THREE.Mesh(
        pillarGeo,
        new THREE.MeshStandardMaterial({ color: 0x1c1033, roughness: 1, emissive: 0x120826, emissiveIntensity: 0.6 })
      );
      m.position.set(Math.cos(a) * 13.5, 4 + (i % 3) * 0.7, Math.sin(a) * 13.5);
      m.rotation.y = -a;
      G.add(m);
    }

    const cm1 = new THREE.MeshBasicMaterial({
      map: makeCircleTexture(),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x4dffa6,
    });
    const circle = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), cm1);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.02;
    G.add(circle);
    this.starRing = circle;
    this.circleMats.push(cm1);

    const inner = new THREE.MeshBasicMaterial({
      color: 0x4dffa6,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 40), inner);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.015;
    G.add(disc);
    this.circleInner = inner;

    const waxGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.55, 10);
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xd8c9a3, roughness: 0.8 });
    const flameGeo = new THREE.ConeGeometry(0.07, 0.24, 8);
    const glowGeo = new THREE.SphereGeometry(0.12, 8, 8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.52;
      const x = Math.cos(a) * 2.75;
      const z = Math.sin(a) * 2.75;
      const wax = new THREE.Mesh(waxGeo, waxMat);
      wax.position.set(x, 0.27, z);
      G.add(wax);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffd27a,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 0.66, z);
      G.add(flame);
      this.flames.push(flame);
      const glow = new THREE.Mesh(
        glowGeo,
        new THREE.MeshBasicMaterial({ color: 0xff9a3d, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      glow.position.set(x, 0.68, z);
      G.add(glow);
      if (i % 2 === 0) {
        const pl = new THREE.PointLight(0xff9a3d, 16, 11, 1.7);
        pl.position.set(x, 1.15, z);
        G.add(pl);
        this.flickerLights.push(pl);
      }
    }

    const rim = new THREE.PointLight(0x4dffa6, 26, 22, 1.7);
    rim.position.set(0, 3.4, -4.5);
    G.add(rim);
    const bossLight = new THREE.PointLight(0xff2e5f, 0, 26, 1.7);
    bossLight.position.set(0, 4.2, 3.2);
    G.add(bossLight);
    this.bossLight = bossLight;

    this.buildEmbers(G);
  }

  private buildEmbers(G: THREE.Group) {
    const make = (count: number, color: number, size: number, opacity: number, radius: number) => {
      const pos = new Float32Array(count * 3);
      const speeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * TAU;
        const r = 1.5 + Math.random() * radius;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = Math.random() * 8;
        pos[i * 3 + 2] = Math.sin(a) * r;
        speeds[i] = 0.25 + Math.random() * 0.7;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
      G.add(new THREE.Points(geo, mat));
      this.emberGeos.push({ geo, speeds });
    };
    make(180, 0xffa64d, 0.09, 0.6, 14);
    make(110, 0x4dffa6, 0.07, 0.45, 12);
    const s = 320;
    const sp = new Float32Array(s * 3);
    for (let i = 0; i < s; i++) {
      const a = Math.random() * TAU;
      sp[i * 3] = Math.cos(a) * (20 + Math.random() * 14);
      sp[i * 3 + 1] = 6 + Math.random() * 30;
      sp[i * 3 + 2] = Math.sin(a) * (20 + Math.random() * 14);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    G.add(
      new THREE.Points(
        sg,
        new THREE.PointsMaterial({ color: 0xbfa8ff, size: 0.14, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
      )
    );
  }

  /* ================================================= WORLD */
  private buildWorld() {
    const G = this.worldGroup;

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(46, 64),
      new THREE.MeshStandardMaterial({ map: makeWorldTexture(), roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    G.add(ground);

    // valle: alberi
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 1.4, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1a, roughness: 1 });
    const leavesGeo = new THREE.ConeGeometry(1.1, 2.4, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x4e6e35, roughness: 1 });
    const valle = ZONES[1];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.4;
      const r = 4.5 + (i % 3) * 1.6;
      const x = valle.x + Math.cos(a) * r;
      const z = valle.z + Math.sin(a) * r;
      const t = new THREE.Mesh(trunkGeo, trunkMat);
      t.position.set(x, 0.7, z);
      G.add(t);
      const l = new THREE.Mesh(leavesGeo, leavesMat);
      l.position.set(x, 2.5, z);
      G.add(l);
    }

    // rivolta: tende + bandiera
    const tentGeo = new THREE.ConeGeometry(1.7, 2.3, 6);
    const tentCols = [0xc0392b, 0xe67e22, 0x8e44ad];
    const riv = ZONES[2];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 1;
      const tent = new THREE.Mesh(tentGeo, new THREE.MeshStandardMaterial({ color: tentCols[i], roughness: 0.9 }));
      tent.position.set(riv.x + Math.cos(a) * 4.4, 1.15, riv.z + Math.sin(a) * 4.4);
      G.add(tent);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 6), trunkMat);
    pole.position.set(riv.x - 1.2, 2, riv.z - 1.2);
    G.add(pole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1),
      new THREE.MeshStandardMaterial({ color: 0xff2e5f, side: THREE.DoubleSide, emissive: 0x8a1030, emissiveIntensity: 0.4 })
    );
    flag.position.set(riv.x - 0.4, 3.3, riv.z - 1.2);
    G.add(flag);

    // terme: piscine + vapore
    const ter = ZONES[3];
    const poolGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.25, 20);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.6;
      const pool = new THREE.Mesh(
        poolGeo,
        new THREE.MeshStandardMaterial({ color: 0xff9ecf, roughness: 0.2, emissive: 0xff4f9a, emissiveIntensity: 0.25, transparent: true, opacity: 0.9 })
      );
      pool.position.set(ter.x + Math.cos(a) * 4, 0.12, ter.z + Math.sin(a) * 4);
      G.add(pool);
    }
    const steamGeo = new THREE.SphereGeometry(0.5, 10, 8);
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(
        steamGeo,
        new THREE.MeshBasicMaterial({ color: 0xffd9e8, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      const a = Math.random() * TAU;
      st.position.set(ter.x + Math.cos(a) * 3.5, 1 + Math.random() * 2, ter.z + Math.sin(a) * 3.5);
      G.add(st);
      this.steam.push(st);
    }

    // abisso: rocce + schegge + luce rossa
    const abi = ZONES[4];
    const rockGeo = new THREE.DodecahedronGeometry(1.1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x241638, roughness: 1 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(abi.x + Math.cos(a) * (4 + (i % 3)), 0.5 + (i % 3) * 0.2, abi.z + Math.sin(a) * (4 + (i % 3)));
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      G.add(rock);
    }
    const shardGeo = new THREE.TetrahedronGeometry(0.4, 0);
    const shardMat = new THREE.MeshStandardMaterial({ color: 0x9b59ff, emissive: 0x6a2bd9, emissiveIntensity: 0.8, roughness: 0.3 });
    for (let i = 0; i < 5; i++) {
      const sh = new THREE.Mesh(shardGeo, shardMat);
      sh.position.set(abi.x + (Math.random() - 0.5) * 8, 2 + Math.random() * 2.5, abi.z + (Math.random() - 0.5) * 8);
      G.add(sh);
      this.shards.push(sh);
    }
    const redLight = new THREE.PointLight(0xff2e5f, 22, 16, 1.8);
    redLight.position.set(abi.x, 3, abi.z);
    G.add(redLight);

    // antro: portale + rocce
    const ant = ZONES[5];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.8;
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(ant.x + Math.cos(a) * 5.4, 0.6, ant.z + Math.sin(a) * 5.4);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      G.add(rock);
    }
    this.portalMat = new THREE.MeshBasicMaterial({
      color: 0x3a2160,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.portalRing = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.22, 12, 40), this.portalMat);
    this.portalRing.position.set(ant.x, 2.4, ant.z);
    G.add(this.portalRing);
    const portalLabel = makeLabel("ANTRO DEL MAIALE", "#ff2e5f");
    portalLabel.position.set(ant.x, 5.4, ant.z);
    G.add(portalLabel);

    // morenopoli: case + monumento + spada
    const mor = ZONES[0];
    const houseGeo = new THREE.BoxGeometry(2.2, 1.7, 2.2);
    const roofGeo = new THREE.ConeGeometry(1.9, 1.3, 4);
    const houseCols = [0x4a3b7a, 0x6e4a8e, 0x3a5a8e, 0x7a4a6e, 0x5a6e3a];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.3;
      const x = mor.x + Math.cos(a) * 6.8;
      const z = mor.z + Math.sin(a) * 6.8;
      const h = new THREE.Mesh(houseGeo, new THREE.MeshStandardMaterial({ color: houseCols[i], roughness: 0.9 }));
      h.position.set(x, 0.85, z);
      G.add(h);
      const r = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0x8e3a4a, roughness: 0.9 }));
      r.position.set(x, 2.35, z);
      r.rotation.y = Math.PI / 4;
      G.add(r);
    }

    const mon = new THREE.Group();
    mon.position.set(0, 0, 0.5);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 2.2), new THREE.MeshStandardMaterial({ color: 0x3a2b66, roughness: 0.9 }));
    ped.position.y = 0.3;
    mon.add(ped);
    const bigCookie = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.42, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xa8854f, roughness: 0.7, emissive: 0x3d2a10, emissiveIntensity: 0.3 })
    );
    bigCookie.position.y = 1.5;
    bigCookie.rotation.x = 0.35;
    mon.add(bigCookie);
    const sprGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
    for (let i = 0; i < 8; i++) {
      const sm = new THREE.Mesh(sprGeo, new THREE.MeshBasicMaterial({ color: [0xff2e5f, 0x4dffa6, 0xffc94d, 0xffffff][i % 4] }));
      const a = (i / 8) * TAU;
      sm.position.set(Math.cos(a) * 1.05, 1.5 + Math.sin(a) * 0.4, Math.sin(a) * 0.95);
      mon.add(sm);
    }
    const sword = new THREE.Group();
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.8, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xcfe8ff, emissive: 0x9fd8ff, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.8 })
    );
    blade.position.y = 1.1;
    sword.add(blade);
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.1, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 })
    );
    guard.position.y = 0.25;
    sword.add(guard);
    const hilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a4b2a, roughness: 0.8 })
    );
    sword.add(hilt);
    sword.position.y = 2.35;
    sword.rotation.z = 0.12;
    mon.add(sword);
    this.swordMesh = sword;
    const monLight = new THREE.PointLight(0xffc94d, 18, 12, 1.8);
    monLight.position.y = 3;
    mon.add(monLight);
    G.add(mon);

    // etichette zone
    for (const z of ZONES) {
      const col = "#" + z.color.toString(16).padStart(6, "0");
      const bright = this.brighten(col);
      const lab = makeLabel(z.name, z.id === "morenopoli" ? "#ffc94d" : bright, z.id === "morenopoli");
      lab.position.set(z.x, z.id === "morenopoli" ? 5.6 : 4.8, z.z);
      G.add(lab);
    }

    // anello missione
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffc94d, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.07, 8, 40), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.07;
    ring.visible = false;
    G.add(ring);
    this.questRing = ring;

    this.buildPlayer();
    this.buildNpcs();
    this.spawnWanderers();
  }

  private brighten(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + 110);
    const g = Math.min(255, ((n >> 8) & 255) + 110);
    const b = Math.min(255, (n & 255) + 110);
    return `rgb(${r},${g},${b})`;
  }

  private buildPlayer() {
    const p = new THREE.Group();
    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.35, 10), new THREE.MeshStandardMaterial({ color: 0x4a2b8f, roughness: 0.9 }));
    cloak.position.y = 0.68;
    p.add(cloak);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), new THREE.MeshStandardMaterial({ color: 0xf2c9a0, roughness: 0.7 }));
    head.position.y = 1.55;
    p.add(head);
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 10, 0, TAU, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x3a2160, roughness: 0.9 })
    );
    hood.position.y = 1.6;
    p.add(hood);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0x4dffa6 }));
    visor.position.set(0, 1.56, 0.26);
    p.add(visor);
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 6), new THREE.MeshStandardMaterial({ color: 0x6e4a2b, roughness: 0.9 }));
    staff.position.set(0.55, 0.85, 0);
    staff.rotation.z = -0.15;
    p.add(staff);
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshStandardMaterial({ color: 0x4dffa6, emissive: 0x4dffa6, emissiveIntensity: 1.2, roughness: 0.2 })
    );
    gem.position.set(0.66, 1.75, 0);
    p.add(gem);
    p.position.copy(this.playerPos);
    this.worldGroup.add(p);
    this.player = p;
  }

  private charSp(id: string): SpeciesDef {
    return CHARACTERS[id] ?? SPECIES.find((s) => s.id === id) ?? SPECIES[0];
  }

  private buildNpcs() {
    const defs = [
      { id: "don", spId: "donmoreno", x: -3.6, z: 5.4, label: "DON MORENO", labelCol: "#ffd700" },
      { id: "clomp", spId: "clomp", x: 2.6, z: 0.6, label: "CLOMP (DORME?)", labelCol: "#7fd0ff" },
      { id: "cinghia", spId: "cinghiaale", x: -21, z: -12, label: "CINGHIA ALE", labelCol: "#ffd700" },
      { id: "mico", spId: "miconosca", x: 21, z: -12, label: "MICO NOSCA", labelCol: "#ffe066" },
      { id: "coizio", spId: "coizio", x: 23, z: 16, label: "COIZIO", labelCol: "#ff7fb2" },
      { id: "gino", spId: "ginosatri", x: -23, z: 16, label: "GINO SATRI", labelCol: "#9b59ff" },
    ];
    for (const d of defs) {
      if (d.id === "clomp") {
        this.buildClomp(d.x, d.z);
        continue;
      }
      const spDef = this.charSp(d.spId);
      const refs = this.buildMoreno(spDef, { scale: 0.85, demandQty: 0, shadow: true });
      refs.group.position.set(d.x, 0, d.z);
      refs.group.rotation.y = Math.atan2(-d.x, -d.z) * 0.4;
      this.worldGroup.add(refs.group);
      if (refs.shadow) this.worldGroup.add(refs.shadow);
      const lab = makeLabel(d.label, d.labelCol);
      lab.position.set(d.x, spDef.radius * 0.85 * 2.6 + 1.4, d.z);
      this.worldGroup.add(lab);
      this.npcs.push({ id: d.id, refs, x: d.x, z: d.z });
    }
  }

  private buildClomp(x: number, z: number) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.95, 10), new THREE.MeshStandardMaterial({ color: 0x3f6df0, roughness: 0.8 }));
    body.position.y = 0.5;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), new THREE.MeshStandardMaterial({ color: 0xf2c9a0, roughness: 0.7 }));
    head.position.y = 1.28;
    g.add(head);
    const hair = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 10), new THREE.MeshStandardMaterial({ color: 0x2f5fe0, roughness: 0.9 }));
    hair.position.set(0, 1.15, -0.22);
    hair.rotation.x = 0.28;
    g.add(hair);
    const strandGeo = new THREE.BoxGeometry(0.14, 0.9, 0.08);
    const strandMat = new THREE.MeshStandardMaterial({ color: 0x2f5fe0, roughness: 0.9 });
    for (const s of [-1, 1]) {
      const st = new THREE.Mesh(strandGeo, strandMat);
      st.position.set(s * 0.3, 0.95, 0.05);
      g.add(st);
    }
    const eyeGeo = new THREE.BoxGeometry(0.11, 0.025, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a0f2e });
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(eyeGeo, eyeMat);
      e.position.set(s * 0.11, 1.3, 0.28);
      g.add(e);
    }
    g.position.set(x, 0, z);
    this.worldGroup.add(g);
    const zz = makeLabel("Z z z ...", "#7fd0ff");
    zz.position.set(x, 2.4, z);
    this.worldGroup.add(zz);
    this.clompSleepSprite = zz;
    this.clompRefs = { group: g, sword: null, awake: false };
  }

  private spawnWanderers() {
    for (const z of ZONES) {
      if (!z.wilds) continue;
      const count = z.id === "abisso" ? 4 : 5;
      for (let i = 0; i < count; i++) {
        this.spawnOneWanderer(z, i);
      }
    }
  }

  private spawnOneWanderer(z: (typeof ZONES)[number], i: number) {
    const id = z.wilds![i % z.wilds!.length].id;
    const spDef = SPECIES.find((s) => s.id === id) ?? SPECIES[0];
    const refs = this.buildMoreno(spDef, { scale: 0.55, demandQty: 0, shadow: false });
    const a = Math.random() * TAU;
    const r = 1.5 + Math.random() * (z.r - 3);
    const hx = z.x + Math.cos(a) * r;
    const hz = z.z + Math.sin(a) * r;
    refs.group.position.set(hx, 0, hz);
    this.worldGroup.add(refs.group);
    this.wanderers.push({ refs, sp: spDef, diff: z.diff, hx, hz, t: Math.random() * 10, phase: Math.random() * TAU, dead: false, respawnAt: 0 });
  }

  /* ================================================= MORENO BUILDER */
  private buildMoreno(spIn: SpeciesDef, opts: { scale: number; demandQty: number; shadow: boolean }): MorenoRefs {
    const sp = spIn;
    const g = new THREE.Group();
    const r = sp.radius * opts.scale;
    const bodyCenterY = r * 1.32;

    const bodyMat = new THREE.MeshStandardMaterial({ color: sp.bodyColor, roughness: 0.55, metalness: 0.05 });
    const accentMat = new THREE.MeshStandardMaterial({ color: sp.accentColor, roughness: 0.4, emissive: sp.accentColor, emissiveIntensity: 0.25 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: sp.bellyColor, roughness: 0.75 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 22), bodyMat);
    body.scale.set(1, 1.12, 0.95);
    body.position.y = bodyCenterY;
    g.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(r * 0.62, 20, 16), bellyMat);
    belly.scale.set(1, 1.05, 0.5);
    belly.position.set(0, bodyCenterY - r * 0.16, r * 0.56);
    g.add(belly);

    const legGeo = new THREE.CylinderGeometry(r * 0.16, r * 0.2, r * 0.42, 10);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(s * r * 0.42, r * 0.21, r * 0.12);
      g.add(leg);
    }

    const eyeGeo = new THREE.SphereGeometry(r * 0.21, 14, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x12060c });
    const pupilGeo = new THREE.SphereGeometry(r * 0.095, 10, 8);
    const eyes: THREE.Mesh[] = [];
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(s * r * 0.36, bodyCenterY + r * 0.28, r * 0.76);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = r * 0.14;
      eye.add(pupil);
      g.add(eye);
      eyes.push(eye);
    }

    const mouth = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0x47101f, roughness: 0.5 }));
    mouth.scale.set(1.5, 0.9, 0.55);
    mouth.position.set(0, bodyCenterY - r * 0.14, r * 0.83);
    g.add(mouth);
    const mouthBase = mouth.scale.clone();

    const armGeo = new THREE.CylinderGeometry(r * 0.11, r * 0.14, r * 0.72, 10);
    const handGeo = new THREE.SphereGeometry(r * 0.15, 10, 8);
    const mkArm = (s: number) => {
      const arm = new THREE.Group();
      arm.position.set(s * r * 0.92, bodyCenterY - r * 0.05, 0);
      const limb = new THREE.Mesh(armGeo, bodyMat);
      limb.position.y = -r * 0.36;
      limb.rotation.z = s * 0.25;
      arm.add(limb);
      const hand = new THREE.Mesh(handGeo, bodyMat);
      hand.position.set(s * r * 0.1, -r * 0.72, 0);
      arm.add(hand);
      g.add(arm);
      return arm;
    };
    const armL = mkArm(-1);
    const armR = mkArm(1);

    const tears: THREE.Mesh[] = [];
    const top = bodyCenterY + r * 1.02;
    const p = sp.parts;
    if (p.horns) {
      const hornGeo = new THREE.ConeGeometry(r * 0.15, r * 0.6, 8);
      for (const s of [-1, 1]) {
        const horn = new THREE.Mesh(hornGeo, accentMat);
        horn.position.set(s * r * 0.42, top + r * 0.2, 0);
        horn.rotation.z = -s * 0.35;
        g.add(horn);
      }
    }
    if (p.catEars) {
      const earGeo = new THREE.ConeGeometry(r * 0.2, r * 0.42, 4);
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(earGeo, bodyMat);
        ear.position.set(s * r * 0.45, top + r * 0.12, r * 0.05);
        ear.rotation.z = -s * 0.15;
        g.add(ear);
      }
    }
    if (p.antenna) {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.03, r * 0.03, r * 0.55, 6), accentMat);
      stick.position.set(0, top + r * 0.25, 0);
      g.add(stick);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(r * 0.1, 10, 8), accentMat);
      tip.position.set(0, top + r * 0.56, 0);
      g.add(tip);
    }
    if (p.sunglasses) {
      const gl = new THREE.Mesh(
        new THREE.BoxGeometry(r * 1.08, r * 0.26, r * 0.1),
        new THREE.MeshStandardMaterial({ color: 0x0d0d12, roughness: 0.2, metalness: 0.6 })
      );
      gl.position.set(0, bodyCenterY + r * 0.3, r * 0.82);
      g.add(gl);
    }
    if (p.chain) {
      const chain = new THREE.Mesh(new THREE.TorusGeometry(r * 0.72, r * 0.05, 8, 22), accentMat);
      chain.position.set(0, bodyCenterY - r * 0.42, r * 0.38);
      chain.rotation.x = Math.PI / 2 - 0.35;
      g.add(chain);
    }
    if (p.crown) {
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.25, metalness: 0.8, emissive: 0x8a6a00, emissiveIntensity: 0.5 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.4, r * 0.5, r * 0.3, 8), crownMat);
      base.position.set(0, top + r * 0.12, 0);
      g.add(base);
      const spikeGeo = new THREE.ConeGeometry(r * 0.12, r * 0.28, 4);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        const s2 = new THREE.Mesh(spikeGeo, crownMat);
        s2.position.set(Math.cos(a) * r * 0.36, top + r * 0.38, Math.sin(a) * r * 0.36);
        g.add(s2);
      }
    }
    if (p.bolts) {
      const boltGeo = new THREE.CylinderGeometry(r * 0.07, r * 0.07, r * 0.3, 8);
      const boltMat = new THREE.MeshStandardMaterial({ color: 0x9aa5b1, roughness: 0.3, metalness: 0.9 });
      for (const s of [-1, 1]) {
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.position.set(s * r * 0.97, bodyCenterY + r * 0.35, 0);
        bolt.rotation.z = Math.PI / 2;
        g.add(bolt);
      }
    }
    if (p.bun) {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(r * 0.28, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd7dde2, roughness: 0.9 }));
      bun.position.set(0, top + r * 0.1, -r * 0.12);
      g.add(bun);
    }
    if (p.glasses) {
      const wireMat = new THREE.MeshStandardMaterial({ color: 0x2d2438, roughness: 0.4, metalness: 0.7 });
      const ringGeo = new THREE.TorusGeometry(r * 0.23, r * 0.028, 8, 18);
      for (const s of [-1, 1]) {
        const ring = new THREE.Mesh(ringGeo, wireMat);
        ring.position.set(s * r * 0.36, bodyCenterY + r * 0.28, r * 0.95);
        g.add(ring);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(r * 0.26, r * 0.04, r * 0.04), wireMat);
      bridge.position.set(0, bodyCenterY + r * 0.32, r * 0.95);
      g.add(bridge);
    }
    if (p.tears) {
      const tearMat = new THREE.MeshBasicMaterial({ color: 0x6fd7ff, transparent: true, opacity: 0.85 });
      for (const s of [-1, 1]) {
        const tear = new THREE.Mesh(new THREE.SphereGeometry(r * 0.085, 8, 8), tearMat);
        tear.position.set(s * r * 0.5, bodyCenterY + r * 0.02, r * 0.85);
        g.add(tear);
        tears.push(tear);
      }
    }
    if (p.tail) {
      const tail = new THREE.Mesh(new THREE.ConeGeometry(r * 0.1, r * 0.85, 8), bodyMat);
      tail.position.set(0, bodyCenterY - r * 0.2, -r * 0.95);
      tail.rotation.x = -1.15;
      g.add(tail);
      const tailTip = new THREE.Mesh(new THREE.SphereGeometry(r * 0.14, 8, 8), accentMat);
      tailTip.position.set(0, bodyCenterY - r * 0.62, -r * 1.28);
      g.add(tailTip);
    }
    if (p.snout) {
      const snout = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.2, r * 0.24, r * 0.16, 12),
        new THREE.MeshStandardMaterial({ color: sp.bellyColor, roughness: 0.7 })
      );
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, bodyCenterY - r * 0.12, r * 0.96);
      g.add(snout);
      const nostrilGeo = new THREE.SphereGeometry(r * 0.045, 6, 6);
      const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x47101f });
      for (const s of [-1, 1]) {
        const n = new THREE.Mesh(nostrilGeo, nostrilMat);
        n.position.set(s * r * 0.09, bodyCenterY - r * 0.12, r * 1.06);
        g.add(n);
      }
    }
    if (p.tusks) {
      const tuskGeo = new THREE.ConeGeometry(r * 0.07, r * 0.4, 8);
      const tuskMat = new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.5 });
      for (const s of [-1, 1]) {
        const tk = new THREE.Mesh(tuskGeo, tuskMat);
        tk.position.set(s * r * 0.3, bodyCenterY - r * 0.28, r * 0.88);
        tk.rotation.x = -0.5;
        tk.rotation.z = -s * 0.25;
        g.add(tk);
      }
    }
    if (p.mustache) {
      const muMat = new THREE.MeshStandardMaterial({ color: 0x2d2438, roughness: 1 });
      for (const s of [-1, 1]) {
        const mu = new THREE.Mesh(new THREE.BoxGeometry(r * 0.3, r * 0.08, r * 0.06), muMat);
        mu.position.set(s * r * 0.16, bodyCenterY - r * 0.05, r * 0.92);
        mu.rotation.z = -s * 0.3;
        g.add(mu);
      }
    }
    if (p.beret) {
      const beret = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.52, r * 0.58, r * 0.14, 14),
        new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 })
      );
      beret.position.set(r * 0.08, top + r * 0.05, 0);
      beret.rotation.z = -0.18;
      g.add(beret);
    }
    if (p.heart) {
      const heartMat = new THREE.MeshStandardMaterial({ color: 0xff4f9a, emissive: 0xff2e7f, emissiveIntensity: 0.8, roughness: 0.4 });
      const heart = new THREE.Group();
      const lobeGeo = new THREE.SphereGeometry(r * 0.13, 10, 8);
      for (const s of [-1, 1]) {
        const lobe = new THREE.Mesh(lobeGeo, heartMat);
        lobe.position.set(s * r * 0.09, 0, 0);
        heart.add(lobe);
      }
      const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, r * 0.22, 8), heartMat);
      tip.rotation.z = Math.PI;
      tip.position.y = -r * 0.13;
      heart.add(tip);
      heart.position.set(0, top + r * 0.45, r * 0.2);
      g.add(heart);
    }
    if (p.hood) {
      const hood = new THREE.Mesh(new THREE.ConeGeometry(r * 0.75, r * 0.9, 10), new THREE.MeshStandardMaterial({ color: 0x12081f, roughness: 1 }));
      hood.position.set(0, bodyCenterY + r * 0.75, -r * 0.1);
      hood.rotation.x = 0.25;
      g.add(hood);
    }

    let shadow: THREE.Mesh | null = null;
    if (opts.shadow) {
      shadow = new THREE.Mesh(
        new THREE.CircleGeometry(r * 1.15, 24),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.012;
    }

    let demandGroup: THREE.Group | null = null;
    const demandCookies: THREE.Mesh[] = [];
    const demandMats: THREE.MeshStandardMaterial[] = [];
    if (opts.demandQty > 0) {
      demandGroup = new THREE.Group();
      demandGroup.position.set(0, bodyCenterY + r * 0.95 + 0.3, 0);
      const cookieGeo = new THREE.TorusGeometry(0.15, 0.06, 10, 18);
      for (let i = 0; i < opts.demandQty; i++) {
        const m = new THREE.MeshStandardMaterial({ color: 0x55506a, roughness: 0.6, transparent: true, opacity: 0.9 });
        const ck = new THREE.Mesh(cookieGeo, m);
        ck.position.x = (i - (opts.demandQty - 1) / 2) * 0.46;
        ck.rotation.x = -0.35;
        demandGroup.add(ck);
        demandCookies.push(ck);
        demandMats.push(m);
      }
      g.add(demandGroup);
    }

    return {
      group: g,
      species: sp,
      bodyMat,
      body,
      mouth,
      mouthBase,
      eyes,
      pupilMat,
      armL,
      armR,
      tears,
      radius: r,
      mouthY: bodyCenterY - r * 0.14,
      mood: "idle",
      phase: Math.random() * TAU,
      nextBlink: this.time + 1 + Math.random() * 2,
      shadow,
      demandCookies,
      demandMats,
      demandGroup,
    };
  }

  private removeRefs(refs: MorenoRefs) {
    this.scene.remove(refs.group);
    refs.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    if (refs.shadow) {
      this.scene.remove(refs.shadow);
      refs.shadow.geometry.dispose();
      (refs.shadow.material as THREE.Material).dispose();
    }
  }

  /* ================================================= API MONDO */
  enterWorld(spawnX: number, spawnZ: number) {
    this.mode = "world";
    this.worldGroup.visible = true;
    this.battleGroup.visible = false;
    this.playerPos.set(spawnX, 0, spawnZ);
    if (this.player) this.player.position.copy(this.playerPos);
    this.camLerp = { from: this.camera.position.clone(), k: 0 };
    this.curZone = null;
  }

  setInput(x: number, z: number) {
    const len = Math.hypot(x, z);
    this.input = len > 1 ? { x: x / len, z: z / len } : { x, z };
  }

  getNearId(): string | null {
    return this.nearId;
  }

  setQuestNpc(id: string | null) {
    if (!this.questRing) return;
    if (!id) {
      this.questRing.visible = false;
      return;
    }
    let x = 0;
    let z = 0.5;
    if (id !== "monument") {
      const npc = this.npcs.find((n) => n.id === id);
      if (npc) {
        x = npc.x;
        z = npc.z;
      }
    }
    this.questRing.position.set(x, 0.07, z);
    this.questRing.visible = true;
  }

  setPortalOpen(open: boolean) {
    this.portalOpen = open;
    this.portalUsed = false;
    if (this.portalMat) {
      this.portalMat.color.setHex(open ? 0xff2e5f : 0x3a2160);
      this.portalMat.opacity = open ? 0.9 : 0.5;
    }
  }

  companionFollow(on: boolean) {
    this.clompFollow = on;
  }

  pullSwordFx(cb: () => void) {
    if (this.swordMesh) this.swordMesh.visible = false;
    this.shakeAmp = Math.max(this.shakeAmp, 0.5);
    this.spawnBurst(new THREE.Vector3(0, 2.2, 0.5), [0xffc94d, 0xffffff, 0x9fd8ff], 34, 4, 4);
    this.pulseRingAt(new THREE.Vector3(0, 0.1, 0.5), 0xffc94d);
    this.animAt(0.9, 0.05, () => {}, cb);
  }

  awakenClompFx(cb: () => void) {
    const c = this.clompRefs;
    if (!c) {
      cb();
      return;
    }
    c.awake = true;
    if (this.clompSleepSprite) {
      this.worldGroup.remove(this.clompSleepSprite);
      (this.clompSleepSprite.material as THREE.SpriteMaterial).map?.dispose();
      (this.clompSleepSprite.material as THREE.Material).dispose();
      this.clompSleepSprite = null;
    }
    if (c.sword) {
      c.group.remove(c.sword);
      c.sword.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        }
      });
      c.sword = null;
    }
    const sword = new THREE.Group();
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.4, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xcfe8ff, emissive: 0x9fd8ff, emissiveIntensity: 1.1, roughness: 0.2, metalness: 0.8 })
    );
    blade.position.y = 0.9;
    sword.add(blade);
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 })
    );
    guard.position.y = 0.22;
    sword.add(guard);
    sword.position.set(0.5, 0.9, 0.2);
    sword.rotation.z = -0.35;
    c.group.add(sword);
    c.sword = sword;
    const g = c.group;
    this.anim(1.1, (k) => {
      g.rotation.y = k * TAU * 2;
      g.position.y = Math.sin(k * Math.PI) * 1.4;
    });
    this.spawnBurst(g.position.clone().add(new THREE.Vector3(0, 1.2, 0)), [0x7fd0ff, 0xffc94d, 0xffffff], 26, 3.4, 3.4);
    this.pulseRingAt(g.position.clone(), 0x7fd0ff);
    this.animAt(1.15, 0.05, () => {
      g.rotation.y = 0;
      g.position.y = 0;
    }, cb);
  }

  /* ================================================= API BATTLE */
  startBattle(playerSp: SpeciesDef, enemySp: SpeciesDef, boss: boolean) {
    this.mode = "battle";
    this.worldGroup.visible = false;
    this.battleGroup.visible = true;
    this.clearBattle();
    this.setBossMode(boss);

    const pd = this.buildMoreno(playerSp, { scale: 0.95, demandQty: 0, shadow: true });
    pd.group.position.set(-2.5 - (pd.radius - 1) * 0.6, 0, 0.5);
    pd.group.rotation.y = Math.PI / 2;
    this.battleGroup.add(pd.group);
    if (pd.shadow) this.battleGroup.add(pd.shadow);
    pd.group.scale.setScalar(0.01);
    this.anim(0.4, (k) => pd.group.scale.setScalar(Math.max(0.01, easeOutCubic(k))));

    const ed = this.buildMoreno(enemySp, { scale: 0.95, demandQty: 1, shadow: true });
    ed.group.position.set(2.5 + (ed.radius - 1) * 0.6, 0, 0.5);
    ed.group.rotation.y = -Math.PI / 2;
    this.battleGroup.add(ed.group);
    if (ed.shadow) this.battleGroup.add(ed.shadow);
    ed.group.scale.setScalar(0.01);
    this.animAt(0.12, 0.75, (k) => ed.group.scale.setScalar(Math.max(0.01, easeOutElastic(k))));

    this.playerDemon = pd;
    this.enemyDemon = ed;
    this.camLerp = { from: this.camera.position.clone(), k: 0 };
    this.pulseRingAt(new THREE.Vector3(2.4, 0.05, 0.5), boss ? 0xff2e5f : 0x4dffa6);
    this.spawnBurst(new THREE.Vector3(2.4, 1, 0.5), boss ? [0xff2e5f, 0x8a1030] : [0x4dffa6, 0xffc94d], 16, 3, 2.6);
  }

  setActiveSpecies(sp: SpeciesDef) {
    const old = this.playerDemon;
    if (old) this.removeRefs(old);
    const pd = this.buildMoreno(sp, { scale: 0.95, demandQty: 0, shadow: true });
    pd.group.position.set(-2.5 - (pd.radius - 1) * 0.6, 0, 0.5);
    pd.group.rotation.y = Math.PI / 2;
    this.battleGroup.add(pd.group);
    if (pd.shadow) this.battleGroup.add(pd.shadow);
    pd.group.scale.setScalar(0.01);
    this.anim(0.45, (k) => pd.group.scale.setScalar(Math.max(0.01, easeOutElastic(k))));
    this.spawnBurst(new THREE.Vector3(-2.4, 1, 0.5), [0x4dffa6, 0xffffff], 14, 3, 2.6);
    this.playerDemon = pd;
  }

  private clearBattle() {
    if (this.playerDemon) {
      this.removeRefs(this.playerDemon);
      this.playerDemon = null;
    }
    if (this.enemyDemon) {
      this.removeRefs(this.enemyDemon);
      this.enemyDemon = null;
    }
  }

  endBattle() {
    this.clearBattle();
    this.setBossMode(false);
    if (this.player) {
      this.mode = "world";
      this.worldGroup.visible = true;
      this.battleGroup.visible = false;
      this.camLerp = { from: this.camera.position.clone(), k: 0 };
    }
  }

  private setBossMode(on: boolean) {
    this.bossMode = on;
    if (on) {
      this.circleTarget.setHex(0xff2e5f);
      this.circleModeT = 1e9;
    } else {
      this.circleModeT = 0;
      this.circleTarget.setHex(0x4dffa6);
    }
  }

  setEnemyConvinced(on: boolean) {
    const d = this.enemyDemon;
    if (!d) return;
    d.mood = on ? "sad" : "idle";
    if (on && d.demandMats.length > 0) {
      const f = FLAVORS[d.species.favorite];
      d.demandMats[0].color.setHex(f.color);
      d.demandMats[0].emissive = new THREE.Color(f.color);
      d.demandMats[0].emissiveIntensity = 0.6;
    }
  }

  battleAttack(side: "player" | "enemy", onDone: () => void) {
    const atk = side === "player" ? this.playerDemon : this.enemyDemon;
    const tgt = side === "player" ? this.enemyDemon : this.playerDemon;
    if (!atk || !tgt) {
      onDone();
      return;
    }
    const g = atk.group;
    const dirSign = side === "player" ? 1 : -1;
    const baseX = g.position.x;
    let hit = false;
    this.anim(0.4, (k) => {
      const lunge = k < 0.45 ? easeInCubic(k / 0.45) : 1 - easeOutCubic((k - 0.45) / 0.55);
      g.position.x = baseX + dirSign * 1.35 * lunge;
      if (k >= 0.4 && !hit) {
        hit = true;
        this.hitFx(tgt);
      }
    });
    this.animAt(0.45, 0.05, () => {}, onDone);
  }

  private hitFx(tgt: MorenoRefs) {
    tgt.bodyMat.emissive.setHex(0xffffff);
    this.anim(0.3, (k) => {
      tgt.bodyMat.emissiveIntensity = (1 - k) * 0.8;
    });
    const baseX = tgt.group.position.x;
    this.anim(0.4, (k) => {
      tgt.group.position.x = baseX + Math.sin(k * 50) * 0.06 * (1 - k);
    });
    const wp = new THREE.Vector3();
    tgt.body.getWorldPosition(wp);
    this.spawnBurst(wp, [0xffc94d, 0xff2e5f, 0xffffff], 12, 2.8, 2.2);
    this.shakeAmp = Math.max(this.shakeAmp, 0.35);
  }

  battleFaint(side: "player" | "enemy", cb: () => void) {
    const d = side === "player" ? this.playerDemon : this.enemyDemon;
    if (!d) {
      cb();
      return;
    }
    const g = d.group;
    this.anim(0.8, (k) => {
      const e = easeInCubic(k);
      g.position.y = -2.0 * e;
      g.scale.setScalar(Math.max(0.2, 1 - e * 0.6));
      if (d.shadow) (d.shadow.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - k);
    });
    this.animAt(0.85, 0.05, () => {}, cb);
  }

  battleCaptureTry(success: boolean, cb: () => void) {
    const ed = this.enemyDemon;
    const pd = this.playerDemon;
    if (!ed || !pd) {
      cb();
      return;
    }
    const f = FLAVORS[ed.species.favorite];
    const grp = new THREE.Group();
    const cookie = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.075, 10, 18),
      new THREE.MeshStandardMaterial({ color: f.color, roughness: 0.6 })
    );
    grp.add(cookie);
    const sprGeo = new THREE.BoxGeometry(0.035, 0.02, 0.035);
    for (let i = 0; i < 7; i++) {
      const sm = new THREE.Mesh(sprGeo, new THREE.MeshBasicMaterial({ color: [0xff2e5f, 0xffc94d, 0x4dffa6, 0xffffff][i % 4] }));
      const a = Math.random() * TAU;
      const rr = Math.random() * 0.14;
      sm.position.set(Math.cos(a) * rr, 0.075, Math.sin(a) * rr);
      grp.add(sm);
    }
    const p0 = pd.group.position.clone().add(new THREE.Vector3(0.4, 1.5, 0));
    const p2 = ed.group.position.clone().add(new THREE.Vector3(0, ed.mouthY, 0));
    const p1 = p0.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, 1.5, 0));
    grp.position.copy(p0);
    this.battleGroup.add(grp);
    this.flyers.push({
      mesh: grp,
      p0,
      p1,
      p2,
      t: 0,
      dur: 0.4,
      onArrive: () => {
        const m = ed.mouth;
        const base = ed.mouthBase;
        this.anim(0.25, (k) => {
          const s = k < 0.5 ? 1 + k * 2.2 : 2.1 - (k - 0.5) * 2.2;
          m.scale.set(base.x * s, base.y * Math.max(0.5, s * 0.9), base.z * s);
        });
        ed.bodyMat.emissive.setHex(f.color);
        this.anim(0.3, (k) => {
          ed.bodyMat.emissiveIntensity = (1 - k) * 0.6;
        });
        const wp = new THREE.Vector3();
        ed.mouth.getWorldPosition(wp);
        this.spawnBurst(wp, [f.color, 0xffe9c9], 12, 2.6, 2);

        if (success) {
          this.setCircleMode("recruit");
          this.pulseRingAt(ed.group.position.clone().setY(0.05), 0xffc94d);
          ed.mood = "happy";
          const g = ed.group;
          this.animAt(0.35, 0.3, (k) => {
            g.position.y = Math.sin(k * Math.PI) * 0.7;
            g.rotation.y = -Math.PI / 2 + k * TAU;
          });
          this.animAt(0.65, 0.75, (k) => {
            const e = easeInCubic(k);
            g.position.y = e * 4.2;
            g.scale.setScalar(Math.max(0.1, 1 - e * 0.85));
            g.rotation.y = -Math.PI / 2 + TAU + k * TAU * 2;
          });
          this.animAt(0.9, 0.06, () => {
            const wp2 = new THREE.Vector3();
            g.getWorldPosition(wp2);
            wp2.y += 1;
            this.spawnBurst(wp2, [0xffc94d, 0xffffff], 18, 3, 2.4);
          });
          this.animAt(1.4, 0.06, () => {
            if (this.enemyDemon === ed) {
              this.removeRefs(ed);
              this.enemyDemon = null;
            }
          }, cb);
        } else {
          ed.mood = "angry";
          ed.pupilMat.color.setHex(0xff2e5f);
          this.spawnBurst(wp, [0xff2e5f, 0x8a1030], 14, 3, 2.6);
          this.shakeAmp = Math.max(this.shakeAmp, 0.4);
          const baseX = ed.group.position.x;
          this.animAt(0.3, 0.5, (k) => {
            ed.group.position.x = baseX + Math.sin(k * 45) * 0.05 * (1 - k);
          });
          this.animAt(1.0, 0.06, () => {
            ed.mood = ed.demandMats[0] ? "sad" : "idle";
            ed.pupilMat.color.setHex(0x12060c);
          }, cb);
        }
      },
    });
  }

  battlePurify(newSp: SpeciesDef, cb: () => void) {
    const ed = this.enemyDemon;
    if (!ed) {
      cb();
      return;
    }
    const pos = ed.group.position.clone();
    this.removeRefs(ed);
    this.enemyDemon = null;
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd9e8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 8, 20, 1, true), beamMat);
    beam.position.set(pos.x, 4, pos.z);
    this.battleGroup.add(beam);
    this.animAt(0.05, 0.25, (k) => {
      beamMat.opacity = k * 0.6;
    });
    this.animAt(1.4, 0.3, (k) => {
      beamMat.opacity = 0.6 * (1 - k);
    });
    this.animAt(1.7, 0.05, () => {
      this.battleGroup.remove(beam);
      beam.geometry.dispose();
      beamMat.dispose();
    });
    this.spawnBurst(pos.clone().setY(1.4), [0xffffff, 0xffd9e8, 0xffc94d], 36, 4, 4);
    this.pulseRingAt(pos.clone().setY(0.05), 0xffd9e8);
    this.shakeAmp = Math.max(this.shakeAmp, 0.45);
    this.animAt(0.55, 0.05, () => {
      const nd = this.buildMoreno(newSp, { scale: 0.95, demandQty: 0, shadow: true });
      nd.group.position.copy(pos);
      nd.group.rotation.y = -Math.PI / 2;
      this.battleGroup.add(nd.group);
      if (nd.shadow) this.battleGroup.add(nd.shadow);
      nd.group.scale.setScalar(0.01);
      this.anim(0.8, (k) => nd.group.scale.setScalar(Math.max(0.01, easeOutElastic(k))));
      nd.mood = "happy";
      this.enemyDemon = nd;
    }, cb);
  }

  shake(amp: number) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
  }

  /* ================================================= helpers */
  private anim(dur: number, fn: (k: number) => void, done?: () => void) {
    this.anims.push({ t0: this.time, dur, fn, done });
  }
  private animAt(delay: number, dur: number, fn: (k: number) => void, done?: () => void) {
    this.anims.push({ t0: this.time + delay, dur, fn, done });
  }

  private setCircleMode(mode: "idle" | "recruit") {
    this.circleModeT = 1.4;
    this.circleTarget.setHex(mode === "recruit" ? 0xffc94d : 0x4dffa6);
  }

  private pulseRingAt(pos: THREE.Vector3, color: number) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 8, 48), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    this.scene.add(ring);
    this.anim(0.7, (k) => {
      const e = easeOutCubic(k);
      ring.scale.setScalar(0.4 + e * 3.4);
      mat.opacity = 0.9 * (1 - k);
    });
    this.animAt(0.72, 0.05, () => {
      this.scene.remove(ring);
      ring.geometry.dispose();
      mat.dispose();
    });
  }

  spawnBurst(pos: THREE.Vector3, colors: number[], n: number, speed: number, up: number) {
    for (let i = 0; i < n; i++) {
      const size = 0.05 + Math.random() * 0.07;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const a = Math.random() * TAU;
      const r = Math.random() * speed;
      const vel = new THREE.Vector3(Math.cos(a) * r, Math.random() * up, Math.sin(a) * r);
      this.particles.push({
        mesh,
        mat,
        geo,
        vel,
        spin: new THREE.Vector3(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4),
        grav: 6,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
      });
      this.scene.add(mesh);
    }
  }

  /* ================================================= loop */
  start() {
    this.renderer.setAnimationLoop(this.loop);
  }

  private clock = new THREE.Clock();
  private loop = () => {
    if (this.disposed) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.paused) {
      this.time += dt;
      this.update(dt);
    }
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number) {
    const t = this.time;

    for (let i = this.anims.length - 1; i >= 0; i--) {
      const a = this.anims[i];
      const k = (t - a.t0) / a.dur;
      if (k < 0) continue;
      if (k >= 1) {
        a.fn(1);
        this.anims.splice(i, 1);
        a.done?.();
      } else {
        a.fn(Math.max(0, k));
      }
    }

    let pos: THREE.Vector3;
    let look: THREE.Vector3;
    if (this.mode === "world") {
      pos = new THREE.Vector3(this.playerPos.x, 10.2, this.playerPos.z + 10.6);
      look = new THREE.Vector3(this.playerPos.x, 1, this.playerPos.z);
      this.updateWorld(dt, t);
    } else if (this.mode === "battle") {
      pos = new THREE.Vector3(Math.sin(t * 0.35) * 0.25, 2.55 + Math.sin(t * 0.8) * 0.06, 7.7);
      look = new THREE.Vector3(0, 1.5, 0.3);
      this.updateBattle(dt, t);
    } else {
      const a = t * 0.22;
      pos = new THREE.Vector3(Math.sin(a) * 7.6, 2.7 + Math.sin(t * 0.45) * 0.45, Math.cos(a) * 7.6);
      look = new THREE.Vector3(0, 1.35, 0);
    }
    if (this.camLerp) {
      this.camLerp.k += dt / 0.9;
      if (this.camLerp.k >= 1) this.camLerp = null;
      else pos.lerpVectors(this.camLerp.from, pos, easeOutCubic(this.camLerp.k));
    }
    if (this.shakeAmp > 0.001) {
      pos.x += (Math.random() - 0.5) * this.shakeAmp;
      pos.y += (Math.random() - 0.5) * this.shakeAmp * 0.7;
      this.shakeAmp *= Math.exp(-5.5 * dt);
    } else {
      this.shakeAmp = 0;
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(look);

    for (let i = 0; i < this.flames.length; i++) {
      const f = this.flames[i];
      f.scale.set(1 + Math.sin(t * 15 + i * 2.1) * 0.12, 1 + Math.sin(t * 13 + i * 3.7) * 0.25 + Math.random() * 0.08, 1);
    }
    for (let i = 0; i < this.flickerLights.length; i++) {
      this.flickerLights[i].intensity = 16 + Math.sin(t * 11 + i * 4) * 4 + Math.random() * 3;
    }
    for (const { geo, speeds } of this.emberGeos) {
      const attr = geo.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < speeds.length; i++) {
        arr[i * 3 + 1] += speeds[i] * dt;
        if (arr[i * 3 + 1] > 8.5) arr[i * 3 + 1] = 0.1;
      }
      attr.needsUpdate = true;
    }
    this.circleModeT -= dt;
    if (!this.bossMode && this.circleModeT <= 0 && this.circleTarget.getHex() !== 0x4dffa6) {
      this.circleTarget.setHex(0x4dffa6);
    }
    for (const m of this.circleMats) {
      m.color.lerp(this.circleTarget, 1 - Math.exp(-5 * dt));
      m.opacity = 0.6 + Math.sin(t * 2.3) * 0.22;
    }
    if (this.circleInner) {
      this.circleInner.color.lerp(this.circleTarget, 1 - Math.exp(-5 * dt));
      this.circleInner.opacity = 0.06 + Math.sin(t * 2.3 + 1) * 0.035;
    }
    if (this.starRing) this.starRing.rotation.z += dt * 0.12;
    if (this.bossLight) {
      const bl = this.bossMode ? 34 : 0;
      this.bossLight.intensity += (bl - this.bossLight.intensity) * (1 - Math.exp(-4 * dt));
      if (this.bossMode) this.bossLight.intensity += Math.sin(t * 9) * 1.4;
    }

    // morenini in volo
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i];
      f.t += dt / f.dur;
      const k = Math.min(1, f.t);
      const e = easeInCubic(k);
      const a = 1 - e;
      f.mesh.position.set(
        a * a * f.p0.x + 2 * a * e * f.p1.x + e * e * f.p2.x,
        a * a * f.p0.y + 2 * a * e * f.p1.y + e * e * f.p2.y,
        a * a * f.p0.z + 2 * a * e * f.p1.z + e * e * f.p2.z
      );
      f.mesh.rotation.x += dt * 9;
      f.mesh.rotation.y += dt * 6;
      if (k >= 1) {
        this.scene.remove(f.mesh);
        f.mesh.traverse((o) => {
          const mm = o as THREE.Mesh;
          if (mm.isMesh) {
            mm.geometry.dispose();
            (mm.material as THREE.Material).dispose();
          }
        });
        this.flyers.splice(i, 1);
        f.onArrive();
      }
    }

    // particelle
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.geo.dispose();
        p.mat.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= p.grav * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
      p.mat.opacity = Math.min(1, p.life / (p.maxLife * 0.6));
      p.mesh.scale.setScalar(0.4 + 0.6 * (p.life / p.maxLife));
    }
  }

  /* ------------------------------------------------ world update */
  private updateWorld(dt: number, t: number) {
    const speed = 7.6;
    const moving = Math.hypot(this.input.x, this.input.z) > 0.05;
    if (moving) {
      this.playerPos.x += this.input.x * speed * dt;
      this.playerPos.z += this.input.z * speed * dt;
      const d = Math.hypot(this.playerPos.x, this.playerPos.z);
      if (d > 39) {
        this.playerPos.x *= 39 / d;
        this.playerPos.z *= 39 / d;
      }
      const push = (cx: number, cz: number, r: number) => {
        const dx = this.playerPos.x - cx;
        const dz = this.playerPos.z - cz;
        const dd = Math.hypot(dx, dz);
        if (dd < r && dd > 0.001) {
          this.playerPos.x = cx + (dx / dd) * r;
          this.playerPos.z = cz + (dz / dd) * r;
        }
      };
      push(0, 0.5, 2.6);
      for (const n of this.npcs) push(n.x, n.z, 1.3);
      if (this.clompRefs && !this.clompFollow) push(this.clompRefs.group.position.x, this.clompRefs.group.position.z, 1.1);
      const targetH = Math.atan2(this.input.x, this.input.z);
      let dh = targetH - this.playerHeading;
      while (dh > Math.PI) dh -= TAU;
      while (dh < -Math.PI) dh += TAU;
      this.playerHeading += dh * Math.min(1, dt * 12);
    }
    if (this.player) {
      this.player.position.set(this.playerPos.x, moving ? Math.abs(Math.sin(t * 11)) * 0.09 : 0, this.playerPos.z);
      this.player.rotation.y = this.playerHeading;
    }

    for (const n of this.npcs) {
      n.refs.group.position.y = Math.sin(t * 2 + n.refs.phase) * 0.06;
      n.refs.group.rotation.y += Math.sin(t * 0.7 + n.refs.phase) * 0.002;
    }

    const c = this.clompRefs;
    if (c) {
      if (this.clompFollow) {
        const behind = new THREE.Vector3(
          this.playerPos.x - Math.sin(this.playerHeading) * 1.5,
          0,
          this.playerPos.z - Math.cos(this.playerHeading) * 1.5
        );
        c.group.position.lerp(behind, 1 - Math.exp(-6 * dt));
        c.group.position.y = Math.abs(Math.sin(t * 10)) * 0.08;
      } else {
        c.group.position.y = Math.sin(t * 1.2) * 0.03;
      }
      if (c.sword) c.sword.rotation.z = -0.35 + Math.sin(t * 3) * 0.06;
    }

    for (const w of this.wanderers) {
      if (w.dead) {
        if (t >= w.respawnAt) {
          const a = Math.random() * TAU;
          w.hx += Math.cos(a) * 0.8;
          w.hz += Math.sin(a) * 0.8;
          w.refs.group.position.set(w.hx, 0, w.hz);
          w.refs.group.visible = true;
          w.dead = false;
        }
        continue;
      }
      w.t += dt;
      const spread = 2.2;
      const x = w.hx + Math.sin(w.t * 0.45 + w.phase) * spread;
      const z = w.hz + Math.cos(w.t * 0.38 + w.phase * 1.7) * spread;
      w.refs.group.position.set(x, Math.abs(Math.sin(w.t * 5)) * 0.06, z);
      w.refs.group.rotation.y = Math.cos(w.t * 0.45 + w.phase) * 0.8;
      const dp = Math.hypot(x - this.playerPos.x, z - this.playerPos.z);
      if (dp < 1.5) {
        w.dead = true;
        w.respawnAt = t + 9;
        w.refs.group.visible = false;
        this.spawnBurst(new THREE.Vector3(x, 1, z), [0xffc94d, 0xff2e5f], 10, 2.4, 2);
        this.onEncounter?.(w.sp.id, w.diff);
      }
    }

    for (let i = 0; i < this.steam.length; i++) {
      const st = this.steam[i];
      const cyc = (t * 0.25 + i * 0.25) % 1;
      st.position.y = 0.8 + cyc * 3.2;
      (st.material as THREE.MeshBasicMaterial).opacity = 0.3 * Math.sin(cyc * Math.PI);
      st.scale.setScalar(0.7 + cyc * 1.4);
    }
    for (let i = 0; i < this.shards.length; i++) {
      const sh = this.shards[i];
      sh.rotation.x += dt * (0.6 + i * 0.1);
      sh.rotation.y += dt * 0.8;
      sh.position.y += Math.sin(t * 1.5 + i) * dt * 0.4;
    }
    if (this.portalRing) {
      this.portalRing.rotation.z += dt * (this.portalOpen ? 1.2 : 0.15);
      if (this.portalMat && this.portalOpen) {
        this.portalMat.opacity = 0.7 + Math.sin(t * 6) * 0.25;
      }
      const dp = Math.hypot(this.playerPos.x - this.portalRing.position.x, this.playerPos.z - this.portalRing.position.z);
      if (this.portalOpen && !this.portalUsed && dp < 3.4) {
        this.portalUsed = true;
        this.onPortal?.();
      }
    }
    if (this.questRing && this.questRing.visible) {
      this.questRing.scale.setScalar(1 + Math.sin(t * 4) * 0.14);
      (this.questRing.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 4) * 0.3;
    }

    let near: string | null = null;
    let best = 2.5;
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - this.playerPos.x, n.z - this.playerPos.z);
      if (d < best) {
        best = d;
        near = n.id;
      }
    }
    const dm = Math.hypot(this.playerPos.x - 0, this.playerPos.z - 0.5);
    if (dm < 3.2 && dm >= 2.55) near = "monument";
    if (near !== this.nearId) {
      this.nearId = near;
      this.onNear?.(near);
    }

    this.zoneCheckT -= dt;
    if (this.zoneCheckT <= 0) {
      this.zoneCheckT = 0.25;
      let zone: string | null = null;
      for (const z of ZONES) {
        if (Math.hypot(z.x - this.playerPos.x, z.z - this.playerPos.z) < z.r + 0.5) {
          zone = z.id;
          break;
        }
      }
      if (zone !== this.curZone) {
        this.curZone = zone;
        if (zone) this.onZone?.(zone);
      }
    }
  }

  /* ------------------------------------------------ battle update */
  private updateBattle(dt: number, t: number) {
    const demons = [this.playerDemon, this.enemyDemon];
    for (const d of demons) {
      if (!d) continue;
      const g = d.group;
      if (d.mood === "idle") {
        g.position.y = Math.sin(t * 2.1 + d.phase) * 0.085;
        d.armL.rotation.x = Math.sin(t * 2.6 + d.phase) * 0.3 - 0.15;
        d.armR.rotation.x = Math.sin(t * 2.6 + d.phase + 1.4) * 0.3 - 0.15;
      } else if (d.mood === "angry") {
        d.armL.rotation.x = -1.3 + Math.sin(t * 30) * 0.12;
        d.armR.rotation.x = -1.3 + Math.cos(t * 27) * 0.12;
      } else if (d.mood === "happy") {
        d.armL.rotation.z = 1.2 + Math.sin(t * 10) * 0.2;
        d.armR.rotation.z = -1.2 - Math.sin(t * 10) * 0.2;
      }
      if (t > d.nextBlink && d.mood !== "angry") {
        d.nextBlink = t + 1.6 + Math.random() * 3.2;
        for (const eye of d.eyes) {
          this.anim(0.2, (k) => {
            eye.scale.y = k < 0.5 ? 1 - k * 1.84 : 0.08 + (k - 0.5) * 1.84;
          });
        }
      }
      for (let i = 0; i < d.tears.length; i++) {
        const tear = d.tears[i];
        const cyc = (t * 0.55 + i * 0.5) % 1;
        tear.position.y -= cyc * 0.0028;
        (tear.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - cyc);
        if (cyc < 0.02) tear.position.y = d.radius * 1.32 + d.radius * 0.02;
      }
      if (d.demandGroup) {
        d.demandGroup.position.y = d.radius * 1.32 + d.radius * 0.95 + 0.3 + Math.sin(t * 3 + d.phase) * 0.06;
        for (const ck of d.demandCookies) ck.rotation.y += dt * 1.4;
      }
      if (d.shadow) {
        const h = Math.max(0, g.position.y);
        d.shadow.scale.setScalar(Math.max(0.4, 1 - h * 0.12) * (g.scale.x || 1));
        d.shadow.position.x = g.position.x;
        d.shadow.position.z = g.position.z;
      }
    }
  }

  /* ------------------------------------------------ pubblico */
  attractMode(on: boolean) {
    if (on) {
      this.mode = "attract";
      this.worldGroup.visible = false;
      this.battleGroup.visible = true;
      this.camLerp = { from: this.camera.position.clone(), k: 0 };
    }
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (!p) this.clock.getDelta();
  }

  private resize() {
    const w = Math.max(1, this.mount.clientWidth);
    const h = Math.max(1, this.mount.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const pts = o as THREE.Points;
      const spr = o as THREE.Sprite;
      if (mesh.isMesh || pts.isPoints) {
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
      if (spr.isSprite) {
        spr.material.map?.dispose();
        spr.material.dispose();
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.mount) {
      this.mount.removeChild(this.renderer.domElement);
    }
  }
}
