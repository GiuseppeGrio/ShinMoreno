import * as THREE from "three";
import { FLAVORS, type FlavorId, type SpeciesDef } from "./data";

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

interface Demon {
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
  phase: number;
  nextBlink: number;
  mood: "idle" | "angry" | "happy" | "sad";
  demandCookies: THREE.Mesh[];
  demandMats: THREE.MeshStandardMaterial[];
  demandGroup: THREE.Group;
  flavor: FlavorId;
  shadow: THREE.Mesh;
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
  // glifi runici (caratteri a caso = massima demenzialità)
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
  // tacche esterne
  g.strokeStyle = "rgba(120,255,190,0.55)";
  g.lineWidth = 3;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    g.beginPath();
    g.moveTo(Math.cos(a) * 236, Math.sin(a) * 236);
    g.lineTo(Math.cos(a) * 246, Math.sin(a) * 246);
    g.stroke();
  }
  // pentacolo
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
  g.fillStyle = "rgba(255,201,77,0.8)";
  g.font = "bold 30px serif";
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * TAU;
    const r = 66 + Math.random() * 70;
    g.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], Math.cos(a) * r, Math.sin(a) * r);
  }
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
    g.strokeStyle = `rgba(160,140,220,${0.05 - r * 0.00008})`;
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

export class MoreniEngine {
  private mount: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private ro: ResizeObserver;
  private disposed = false;

  private time = 0;
  paused = false;
  private attract = true;
  private camLerp: { from: THREE.Vector3; k: number } | null = null;

  private circleMats: THREE.MeshBasicMaterial[] = [];
  private circleInner: THREE.MeshBasicMaterial | null = null;
  private starRing: THREE.Mesh | null = null;
  private circleTarget = new THREE.Color(0x4dffa6);
  private circleModeT = 0;
  private bossMode = false;
  private bossLight: THREE.PointLight | null = null;

  private flames: THREE.Mesh[] = [];
  private flickerLights: THREE.PointLight[] = [];
  private emberGeos: { geo: THREE.BufferGeometry; speeds: Float32Array }[] = [];

  private demon: Demon | null = null;
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
    this.scene.fog = new THREE.FogExp2(0x0b0614, 0.038);

    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 120);
    this.camera.position.set(0, 2.7, 8);
    this.camera.lookAt(0, 1.35, 0);

    this.buildLights();
    this.buildRoom();
    this.buildEmbers();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(mount);
  }

  /* ---------------------------------------------------------- scena */
  private buildLights() {
    this.scene.add(new THREE.AmbientLight(0x6a5a9a, 0.55));
    const hemi = new THREE.HemisphereLight(0x4a3a7a, 0x1a0f2e, 0.5);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xb9a6ff, 0.55);
    dir.position.set(-5, 8, 6);
    this.scene.add(dir);
    const rim = new THREE.PointLight(0x4dffa6, 26, 22, 1.7);
    rim.position.set(0, 3.4, -4.5);
    this.scene.add(rim);
    const bossLight = new THREE.PointLight(0xff2e5f, 0, 26, 1.7);
    bossLight.position.set(0, 4.2, 3.2);
    this.scene.add(bossLight);
    this.bossLight = bossLight;
  }

  private buildRoom() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.95, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // pilastri nella nebbia
    const pillarGeo = new THREE.BoxGeometry(1.3, 10, 1.3);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.35;
      const m = new THREE.Mesh(
        pillarGeo,
        new THREE.MeshStandardMaterial({ color: 0x1c1033, roughness: 1, emissive: 0x120826, emissiveIntensity: 0.6 })
      );
      m.position.set(Math.cos(a) * 13.5, 4 + (i % 3) * 0.7, Math.sin(a) * 13.5);
      m.rotation.y = -a;
      this.scene.add(m);
    }

    // cerchio di evocazione
    const circleTex = makeCircleTexture();
    const cm1 = new THREE.MeshBasicMaterial({
      map: circleTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x4dffa6,
    });
    const circle = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), cm1);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.02;
    this.scene.add(circle);
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
    this.scene.add(disc);
    this.circleInner = inner;

    // candele
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
      this.scene.add(wax);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffd27a,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 0.66, z);
      this.scene.add(flame);
      this.flames.push(flame);
      const glow = new THREE.Mesh(
        glowGeo,
        new THREE.MeshBasicMaterial({
          color: 0xff9a3d,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      glow.position.set(x, 0.68, z);
      this.scene.add(glow);
      if (i % 2 === 0) {
        const pl = new THREE.PointLight(0xff9a3d, 16, 11, 1.7);
        pl.position.set(x, 1.15, z);
        this.scene.add(pl);
        this.flickerLights.push(pl);
      }
    }
  }

  private buildEmbers() {
    const make = (count: number, color: number, size: number, opacity: number, radius: number) => {
      const n = count;
      const pos = new Float32Array(n * 3);
      const speeds = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const r = 1.5 + Math.random() * radius;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = Math.random() * 8;
        pos[i * 3 + 2] = Math.sin(a) * r;
        speeds[i] = 0.25 + Math.random() * 0.7;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      this.scene.add(new THREE.Points(geo, mat));
      this.emberGeos.push({ geo, speeds });
    };
    make(180, 0xffa64d, 0.09, 0.6, 14);
    make(110, 0x4dffa6, 0.07, 0.45, 12);
    // stelle lontane
    const s = 320;
    const sp = new Float32Array(s * 3);
    for (let i = 0; i < s; i++) {
      const a = Math.random() * TAU;
      const y = 6 + Math.random() * 30;
      const r = 20 + Math.random() * 14;
      sp[i * 3] = Math.cos(a) * r;
      sp[i * 3 + 1] = y;
      sp[i * 3 + 2] = Math.sin(a) * r;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    this.scene.add(
      new THREE.Points(
        sg,
        new THREE.PointsMaterial({
          color: 0xbfa8ff,
          size: 0.14,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
    );
  }

  /* ---------------------------------------------------------- Moreno */
  spawnMoreno(sp: SpeciesDef, qty: number, flavor: FlavorId) {
    this.clearDemon();
    const g = new THREE.Group();
    const r = sp.radius;
    const bodyCenterY = r * 1.32;

    const bodyMat = new THREE.MeshStandardMaterial({ color: sp.bodyColor, roughness: 0.55, metalness: 0.05 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: sp.accentColor,
      roughness: 0.4,
      emissive: sp.accentColor,
      emissiveIntensity: 0.25,
    });
    const bellyMat = new THREE.MeshStandardMaterial({ color: sp.bellyColor, roughness: 0.75 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 22), bodyMat);
    body.scale.set(1, 1.12, 0.95);
    body.position.y = bodyCenterY;
    g.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(r * 0.62, 20, 16), bellyMat);
    belly.scale.set(1, 1.05, 0.5);
    belly.position.set(0, bodyCenterY - r * 0.16, r * 0.56);
    g.add(belly);

    // gambe
    const legGeo = new THREE.CylinderGeometry(r * 0.16, r * 0.2, r * 0.42, 10);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(s * r * 0.42, r * 0.21, r * 0.12);
      g.add(leg);
    }

    // occhi
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

    // bocca
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0x47101f, roughness: 0.5 }));
    mouth.scale.set(1.5, 0.9, 0.55);
    mouth.position.set(0, bodyCenterY - r * 0.14, r * 0.83);
    g.add(mouth);
    const mouthBase = mouth.scale.clone();

    // braccia
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

    // accessori demenziali
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
        const s = new THREE.Mesh(spikeGeo, crownMat);
        s.position.set(Math.cos(a) * r * 0.36, top + r * 0.38, Math.sin(a) * r * 0.36);
        g.add(s);
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

    // ombra finta
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(r * 1.15, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    this.scene.add(shadow);

    // morenini richiesti fluttuanti
    const demandGroup = new THREE.Group();
    demandGroup.position.set(0, bodyCenterY + r * 0.95 + 0.3, 0);
    const demandCookies: THREE.Mesh[] = [];
    const demandMats: THREE.MeshStandardMaterial[] = [];
    const cookieGeo = new THREE.TorusGeometry(0.15, 0.06, 10, 18);
    for (let i = 0; i < qty; i++) {
      const m = new THREE.MeshStandardMaterial({ color: 0x55506a, roughness: 0.6, transparent: true, opacity: 0.9 });
      const ck = new THREE.Mesh(cookieGeo, m);
      ck.position.x = (i - (qty - 1) / 2) * 0.46;
      ck.rotation.x = -0.35;
      demandGroup.add(ck);
      demandCookies.push(ck);
      demandMats.push(m);
    }
    g.add(demandGroup);

    g.scale.setScalar(0.01);
    this.scene.add(g);

    const demon: Demon = {
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
      phase: Math.random() * TAU,
      nextBlink: this.time + 1 + Math.random() * 2,
      mood: "idle",
      demandCookies,
      demandMats,
      demandGroup,
      flavor,
      shadow,
    };
    this.demon = demon;

    // entrata trionfale
    this.animE(0.85, easeOutElastic, (k) => g.scale.setScalar(Math.max(0.01, k)));
    this.setCircleMode("spawn");
    this.pulseRing(0x4dffa6);
    this.spawnBurst(new THREE.Vector3(0, 0.4, 0), [0x4dffa6, 0xff2e5f, 0xffc94d], 22, 3.4, 2.4);
  }

  markFulfilled(count: number) {
    const d = this.demon;
    if (!d) return;
    const idx = count - 1;
    if (idx < 0 || idx >= d.demandMats.length) return;
    const f = FLAVORS[d.flavor];
    d.demandMats[idx].color.setHex(f.color);
    d.demandMats[idx].emissive = new THREE.Color(f.color);
    d.demandMats[idx].emissiveIntensity = 0.55;
    const ck = d.demandCookies[idx];
    this.anim(0.32, (k) => {
      const s = k < 0.5 ? 1 + k * 1.2 : 1.6 - (k - 0.5) * 1.2;
      ck.scale.setScalar(s);
    });
    const wp = new THREE.Vector3();
    ck.getWorldPosition(wp);
    this.spawnBurst(wp, [f.color, 0xffc94d], 8, 2, 1.6);
  }

  feed(flavor: FlavorId) {
    const d = this.demon;
    if (!d) return;
    const f = FLAVORS[flavor];
    const grp = new THREE.Group();
    const cookie = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.075, 10, 18),
      new THREE.MeshStandardMaterial({ color: f.color, roughness: 0.6 })
    );
    grp.add(cookie);
    const sprGeo = new THREE.BoxGeometry(0.035, 0.02, 0.035);
    for (let i = 0; i < 7; i++) {
      const sm = new THREE.Mesh(
        sprGeo,
        new THREE.MeshBasicMaterial({ color: [0xff2e5f, 0xffc94d, 0x4dffa6, 0xffffff][i % 4] })
      );
      const a = Math.random() * TAU;
      const rr = Math.random() * 0.14;
      sm.position.set(Math.cos(a) * rr, 0.075, Math.sin(a) * rr);
      sm.rotation.y = Math.random() * TAU;
      grp.add(sm);
    }
    const p0 = new THREE.Vector3(1.15, 0.85, 5.6);
    const p2 = d.group.localToWorld(new THREE.Vector3(0, d.mouthY, d.radius * 0.98));
    const p1 = p0.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, 1.4, 0));
    grp.position.copy(p0);
    this.scene.add(grp);
    this.flyers.push({ mesh: grp, p0, p1, p2, t: 0, dur: 0.34, onArrive: () => this.chomp(d, f.color) });
  }

  private chomp(d: Demon, flashColor: number) {
    const m = d.mouth;
    const base = d.mouthBase;
    this.anim(0.2, (k) => {
      const s = k < 0.5 ? 1 + k * 2.2 : 2.1 - (k - 0.5) * 2.2;
      m.scale.set(base.x * s, base.y * Math.max(0.5, s * 0.9), base.z * s);
    });
    this.anim(0.24, (k) => {
      const sq = k < 0.5 ? 1 - k * 0.16 : 0.92 + (k - 0.5) * 0.16;
      d.body.scale.y = 1.12 * sq;
    });
    d.bodyMat.emissive.setHex(flashColor);
    this.anim(0.28, (k) => {
      d.bodyMat.emissiveIntensity = (1 - k) * 0.65;
    });
    const wp = new THREE.Vector3();
    d.mouth.getWorldPosition(wp);
    this.spawnBurst(wp, [flashColor, 0x8a4b2a, 0xffe9c9], 12, 2.6, 2);
  }

  angry(cb: () => void) {
    const d = this.demon;
    if (!d) {
      cb();
      return;
    }
    d.mood = "angry";
    d.pupilMat.color.setHex(0xff2e5f);
    d.mouth.scale.set(d.mouthBase.x * 1.5, d.mouthBase.y * 2.1, d.mouthBase.z * 1.5);
    this.shakeAmp = Math.max(this.shakeAmp, 0.55);
    this.setCircleMode("angry");
    this.pulseRing(0xff2e5f);
    const g = d.group;
    this.anim(0.55, (k) => {
      g.position.x = Math.sin(k * 62) * 0.075 * (1 - k);
    });
    this.animAt(0.08, 0.55, (k) => {
      g.position.z = Math.sin(k * Math.PI) * 1.35;
    });
    this.spawnBurst(new THREE.Vector3(0, d.radius, 0), [0xff2e5f, 0xff7b3d], 16, 3, 2.6);
    this.animAtE(0.78, 0.5, easeInCubic, (k) => {
      g.position.y = -2.1 * k;
      const s = 1 - k * 0.65;
      g.scale.setScalar(Math.max(0.2, s));
      (d.shadow.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - k);
    });
    this.animAt(1.24, 0.06, () => {}, () => {
      this.clearDemon();
      cb();
    });
  }

  sulk(cb: () => void) {
    const d = this.demon;
    if (!d) {
      cb();
      return;
    }
    d.mood = "sad";
    this.setCircleMode("angry");
    const g = d.group;
    this.spawnBurst(new THREE.Vector3(0, d.radius, 0), [0x9b8bb8, 0x55506a], 14, 1.6, 1.4);
    this.animE(0.85, easeInCubic, (k) => {
      g.position.y = -2.0 * k;
      g.scale.setScalar(Math.max(0.2, 1 - k * 0.6));
      (d.shadow.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - k);
    });
    this.animAt(0.9, 0.06, () => {}, () => {
      this.clearDemon();
      cb();
    });
  }

  recruit(cb: () => void) {
    const d = this.demon;
    if (!d) {
      cb();
      return;
    }
    d.mood = "happy";
    d.pupilMat.color.setHex(0x12060c);
    d.mouth.scale.set(d.mouthBase.x * 1.7, d.mouthBase.y * 1.5, d.mouthBase.z * 1.7);
    this.setCircleMode("recruit");
    this.pulseRing(0xffc94d);

    // colonna di luce
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffc94d,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.35, 7, 20, 1, true), beamMat);
    beam.position.set(0, 3.4, 0);
    this.scene.add(beam);
    this.animAt(0.15, 0.3, (k) => {
      beamMat.opacity = k * 0.5;
    });
    this.animAt(0.95, 0.3, (k) => {
      beamMat.opacity = 0.5 * (1 - k);
    });
    this.animAt(1.28, 0.05, () => {}, () => {
      this.scene.remove(beam);
      beam.geometry.dispose();
      beamMat.dispose();
    });

    const g = d.group;
    this.spawnBurst(new THREE.Vector3(0, d.radius * 1.4, 0), [0xffc94d, 0x4dffa6, 0xff2e5f, 0xffffff], 30, 3.6, 3);
    this.anim(0.34, (k) => {
      g.position.y = Math.sin(k * Math.PI) * 0.75;
      g.rotation.y = k * TAU;
    });
    this.animAt(0.34, 0.85, (k) => {
      const e = easeInCubic(k);
      g.position.y = e * 4.4;
      g.scale.setScalar(Math.max(0.1, 1 - e * 0.88));
      g.rotation.y = TAU + k * TAU * 2;
    });
    this.animAt(0.7, 0.06, () => {
      const wp = new THREE.Vector3();
      g.getWorldPosition(wp);
      wp.y += 1;
      this.spawnBurst(wp, [0xffc94d, 0xffffff], 18, 3, 2.4);
    });
    this.animAt(1.2, 0.06, () => {}, () => {
      this.clearDemon();
      cb();
    });
  }

  clearDemon() {
    const d = this.demon;
    if (!d) return;
    this.scene.remove(d.group);
    d.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.scene.remove(d.shadow);
    d.shadow.geometry.dispose();
    (d.shadow.material as THREE.Material).dispose();
    this.demon = null;
  }

  shake(amp: number) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
  }

  /* ---------------------------------------------------------- helpers */
  private anim(dur: number, fn: (k: number) => void, done?: () => void) {
    this.anims.push({ t0: this.time, dur, fn, done });
  }
  private animE(dur: number, ease: (k: number) => number, fn: (k: number) => void, done?: () => void) {
    this.anims.push({ t0: this.time, dur, fn: (k) => fn(ease(k)), done });
  }
  private animAt(delay: number, dur: number, fn: (k: number) => void, done?: () => void) {
    this.anims.push({ t0: this.time + delay, dur, fn, done });
  }
  private animAtE(delay: number, dur: number, ease: (k: number) => number, fn: (k: number) => void, done?: () => void) {
    this.anims.push({ t0: this.time + delay, dur, fn: (k) => fn(ease(k)), done });
  }

  private setCircleMode(mode: "idle" | "spawn" | "recruit" | "angry") {
    this.circleModeT = 1.4;
    if (mode === "spawn" || mode === "angry") this.circleTarget.setHex(0xff2e5f);
    else if (mode === "recruit") this.circleTarget.setHex(0xffc94d);
    else this.circleTarget.setHex(0x4dffa6);
  }

  private pulseRing(color: number) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 8, 48), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.scene.add(ring);
    this.animE(0.7, easeOutCubic, (k) => {
      ring.scale.setScalar(0.4 + k * 3.4);
      mat.opacity = 0.9 * (1 - k);
    });
    this.animAt(0.7, 0.05, () => {}, () => {
      this.scene.remove(ring);
      ring.geometry.dispose();
      mat.dispose();
    });
  }

  spawnBurst(pos: THREE.Vector3, colors: number[], n: number, speed: number, up: number) {
    for (let i = 0; i < n; i++) {
      const size = 0.05 + Math.random() * 0.07;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1,
      });
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

  /* ---------------------------------------------------------- loop */
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

    // animazioni programmate
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

    // camera
    let pos: THREE.Vector3;
    if (this.attract) {
      const a = t * 0.22;
      pos = new THREE.Vector3(Math.sin(a) * 7.6, 2.7 + Math.sin(t * 0.45) * 0.45, Math.cos(a) * 7.6);
    } else {
      pos = new THREE.Vector3(Math.sin(t * 0.35) * 0.35, 2.35 + Math.sin(t * 0.8) * 0.07, 7.0);
    }
    if (this.camLerp) {
      this.camLerp.k += dt / 1.0;
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
    this.camera.lookAt(0, 1.35, 0);

    // candele
    for (let i = 0; i < this.flames.length; i++) {
      const f = this.flames[i];
      f.scale.set(1 + Math.sin(t * 15 + i * 2.1) * 0.12, 1 + Math.sin(t * 13 + i * 3.7) * 0.25 + Math.random() * 0.08, 1);
    }
    for (let i = 0; i < this.flickerLights.length; i++) {
      this.flickerLights[i].intensity = 16 + Math.sin(t * 11 + i * 4) * 4 + Math.random() * 3;
    }

    // braci
    for (const { geo, speeds } of this.emberGeos) {
      const attr = geo.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < speeds.length; i++) {
        arr[i * 3 + 1] += speeds[i] * dt;
        if (arr[i * 3 + 1] > 8.5) arr[i * 3 + 1] = 0.1;
      }
      attr.needsUpdate = true;
    }

    // cerchio
    this.circleModeT -= dt;
    if (!this.bossMode && this.circleModeT <= 0 && this.circleTarget.getHex() !== 0x4dffa6) {
      this.circleTarget.setHex(0x4dffa6);
    }
    if (this.bossLight) {
      const bl = this.bossMode ? 34 : 0;
      this.bossLight.intensity += (bl - this.bossLight.intensity) * (1 - Math.exp(-4 * dt));
      if (this.bossMode) this.bossLight.intensity += Math.sin(t * 9) * 1.4;
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

    // Moreno
    const d = this.demon;
    if (d) {
      const g = d.group;
      const idleBob = Math.sin(t * 2.1 + d.phase) * 0.085;
      if (d.mood === "idle") {
        g.position.y = idleBob;
        g.rotation.y = Math.sin(t * 0.9 + d.phase) * 0.18;
        d.armL.rotation.x = Math.sin(t * 2.6 + d.phase) * 0.3 - 0.15;
        d.armR.rotation.x = Math.sin(t * 2.6 + d.phase + 1.4) * 0.3 - 0.15;
        d.armL.rotation.z = 0;
        d.armR.rotation.z = 0;
      } else if (d.mood === "angry") {
        d.armL.rotation.x = -1.3 + Math.sin(t * 30) * 0.12;
        d.armR.rotation.x = -1.3 + Math.cos(t * 27) * 0.12;
      } else if (d.mood === "happy") {
        d.armL.rotation.z = 1.2 + Math.sin(t * 10) * 0.2;
        d.armR.rotation.z = -1.2 - Math.sin(t * 10) * 0.2;
      } else if (d.mood === "sad") {
        d.armL.rotation.x = 0.25;
        d.armR.rotation.x = 0.25;
      }
      // battito di ciglia
      if (t > d.nextBlink && d.mood !== "angry") {
        d.nextBlink = t + 1.6 + Math.random() * 3.2;
        for (const eye of d.eyes) {
          this.anim(0.2, (k) => {
            eye.scale.y = k < 0.5 ? 1 - k * 1.84 : 0.08 + (k - 0.5) * 1.84;
          });
        }
      }
      // lacrime
      for (let i = 0; i < d.tears.length; i++) {
        const tear = d.tears[i];
        const cyc = (t * 0.55 + i * 0.5) % 1;
        tear.position.y -= cyc * 0.0028;
        (tear.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - cyc);
        if (cyc < 0.02) tear.position.y = d.radius * 1.32 + d.radius * 0.02;
      }
      // morenini richiesti: dondolano
      d.demandGroup.position.y = d.radius * 1.32 + d.radius * 0.95 + 0.3 + Math.sin(t * 3 + d.phase) * 0.06;
      for (let i = 0; i < d.demandCookies.length; i++) {
        d.demandCookies[i].rotation.y += dt * 1.4;
      }
      // ombra
      const h = Math.max(0, g.position.y);
      const ss = Math.max(0.4, 1 - h * 0.12);
      d.shadow.scale.setScalar(ss * (g.scale.x || 1));
      d.shadow.position.x = g.position.x;
      d.shadow.position.z = g.position.z;
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
      const s = 0.4 + 0.6 * (p.life / p.maxLife);
      p.mesh.scale.setScalar(s);
    }
  }

  /* ---------------------------------------------------------- pubblico */
  setBossMode(on: boolean) {
    this.bossMode = on;
    if (on) {
      this.circleTarget.setHex(0xff2e5f);
      this.circleModeT = 1e9;
    } else {
      this.circleModeT = 0;
      this.circleTarget.setHex(0x4dffa6);
    }
  }

  attractMode(on: boolean) {
    if (this.attract === on) return;
    this.attract = on;
    this.camLerp = { from: this.camera.position.clone(), k: 0 };
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (!p) this.clock.getDelta(); // azzera il delta accumulato
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
      if (mesh.isMesh || pts.isPoints) {
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.mount) {
      this.mount.removeChild(this.renderer.domElement);
    }
  }
}
