import { inkOn, mixHex } from "@/lib/flyer/color";
import { fontPairs, layouts } from "@/lib/flyer/catalog";
import { isTexture, type Align, type FlyerColors, type FlyerDoc, type Texture } from "@/lib/flyer/types";

export type GeneratedStyle = {
  key: string;
  name: string;
  vibe: string;
  colors: FlyerColors;
  layoutId: string;
  fontPairId: string;
  texture: Texture;
  uppercase: boolean;
  align: Align;
  headlineScale: number;
};

type Ground = "dark" | "light" | "flood";

type Recipe = {
  name: string;
  vibe: string;
  hue: number;
  accentHue: number;
  ground: Ground;
  layoutId: string;
  fontPairId: string;
  texture: Texture;
  uppercase: boolean;
  align: Align;
  headlineScale: number;
};

const RECIPES: Recipe[] = [
  { name: "Sodium", vibe: "Night ink", hue: 32, accentHue: 8, ground: "dark", layoutId: "slam", fontPairId: "impact", texture: "grain", uppercase: true, align: "left", headlineScale: 1.08 },
  { name: "Proof", vibe: "Two-color print", hue: 226, accentHue: 332, ground: "light", layoutId: "poster", fontPairId: "brutal", texture: "speckle", uppercase: true, align: "center", headlineScale: 1.12 },
  { name: "Ledger", vibe: "Classified", hue: 42, accentHue: 48, ground: "light", layoutId: "columns", fontPairId: "newsroom", texture: "rules", uppercase: false, align: "left", headlineScale: 0.96 },
  { name: "Acid", vibe: "Night bill", hue: 140, accentHue: 78, ground: "dark", layoutId: "marquee", fontPairId: "billboard", texture: "halftone", uppercase: true, align: "center", headlineScale: 1 },
  { name: "Brass", vibe: "Seated card", hue: 36, accentHue: 32, ground: "dark", layoutId: "editorial", fontPairId: "classic", texture: "clean", uppercase: false, align: "left", headlineScale: 1 },
  { name: "Fair", vibe: "Fairground", hue: 44, accentHue: 12, ground: "flood", layoutId: "ribbon", fontPairId: "comic", texture: "stripes", uppercase: true, align: "center", headlineScale: 1.05 },
  { name: "Carbon", vibe: "Street gym", hue: 40, accentHue: 48, ground: "light", layoutId: "badge", fontPairId: "block", texture: "halftone", uppercase: true, align: "left", headlineScale: 1.06 },
  { name: "Glass", vibe: "Winter invite", hue: 204, accentHue: 196, ground: "light", layoutId: "frame", fontPairId: "deco", texture: "clean", uppercase: false, align: "center", headlineScale: 1 },
  { name: "Orchard", vibe: "Greenhouse", hue: 128, accentHue: 18, ground: "light", layoutId: "editorial", fontPairId: "book", texture: "grain", uppercase: false, align: "left", headlineScale: 0.98 },
  { name: "Signal", vibe: "One red light", hue: 350, accentHue: 356, ground: "dark", layoutId: "stage", fontPairId: "condensed", texture: "grain", uppercase: true, align: "center", headlineScale: 1.1 },
  { name: "Bag", vibe: "Shop bag", hue: 34, accentHue: 28, ground: "flood", layoutId: "rail", fontPairId: "typewriter", texture: "xerox", uppercase: false, align: "left", headlineScale: 1 },
  { name: "Dusk", vibe: "Late set", hue: 286, accentHue: 24, ground: "dark", layoutId: "stack", fontPairId: "editorial", texture: "grain", uppercase: false, align: "left", headlineScale: 1.02 },
  { name: "Handbill", vibe: "Street pass", hue: 18, accentHue: 48, ground: "light", layoutId: "split", fontPairId: "handbill", texture: "xerox", uppercase: true, align: "left", headlineScale: 1.04 },
  { name: "Stub", vibe: "Tear-off", hue: 210, accentHue: 12, ground: "light", layoutId: "ticket", fontPairId: "modern", texture: "rules", uppercase: false, align: "left", headlineScale: 0.94 },
  { name: "Floor", vibe: "Room night", hue: 268, accentHue: 322, ground: "dark", layoutId: "badge", fontPairId: "stadium", texture: "halftone", uppercase: true, align: "center", headlineScale: 1.08 },
  { name: "Morning", vibe: "Early line", hue: 24, accentHue: 8, ground: "flood", layoutId: "columns", fontPairId: "classic", texture: "clean", uppercase: false, align: "left", headlineScale: 1 },
];

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = light - c / 2;
  const channels = [r, g, b].map((channel) => Math.round((channel + m) * 255));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const raw = hex.replace("#", "");
  const n = Number.parseInt(raw, 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lin = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(channels[0]) + 0.7152 * lin(channels[1]) + 0.0722 * lin(channels[2]);
}

function contrast(a: string, b: string): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

function readable(against: string, hue: number): string {
  const candidates = [4, 8, 12, 16, 22, 86, 90, 94, 97].map((light) =>
    hslToHex(hue, light > 50 ? 14 : 28, light),
  );
  candidates.push("#14110e", "#f7f4ee");
  return candidates.reduce((best, hex) => (contrast(hex, against) > contrast(best, against) ? hex : best));
}

function accentOn(bg: string, ink: string, hue: number, sat: number): string {
  const ranked = [30, 38, 46, 54, 62, 70, 78]
    .map((light) => hslToHex(hue, sat, light))
    .map((hex) => ({ hex, onBg: contrast(hex, bg), onInk: contrast(hex, ink) }))
    .filter((item) => item.onBg >= 2.4 && item.onInk >= 1.35)
    .sort((a, b) => b.onBg - a.onBg);
  if (ranked[0]) return ranked[0].hex;
  return hslToHex(hue, sat, luminance(bg) < 0.2 ? 62 : 36);
}

function finish(bg: string, ink: string, accent: string, paper: string): FlyerColors {
  return {
    bg,
    ink,
    accent,
    paper,
    mute: mixHex(ink, bg, 0.42),
    onAccent: inkOn(accent),
  };
}

function paint(recipe: Recipe, hueShift: number): FlyerColors {
  const hue = recipe.hue + hueShift;
  const accentHue = recipe.accentHue + hueShift;
  if (recipe.ground === "dark") {
    const bg = hslToHex(hue, 22, 8);
    const ink = readable(bg, hue);
    const paper = hslToHex(hue, 14, 15);
    return finish(bg, ink, accentOn(bg, ink, accentHue, 74), paper);
  }
  if (recipe.ground === "light") {
    const bg = hslToHex(hue, 26, 93);
    const ink = readable(bg, hue);
    const paper = hslToHex(hue, 22, 86);
    return finish(bg, ink, accentOn(bg, ink, accentHue, 68), paper);
  }
  const bg = hslToHex(hue, 52, 62);
  const ink = readable(bg, hue);
  const paper = hslToHex(hue, 30, 90);
  return finish(bg, ink, accentOn(bg, ink, accentHue, 72), paper);
}

export function generateStyles(seed: number): GeneratedStyle[] {
  const start = ((seed % RECIPES.length) + RECIPES.length) % RECIPES.length;
  const hueShift = ((seed * 17) % 41) - 20;
  return [0, 1, 2].map((step) => {
    const recipe = RECIPES[(start + step * 4) % RECIPES.length];
    return {
      key: `${recipe.name}-${seed}`,
      name: recipe.name,
      vibe: recipe.vibe,
      colors: paint(recipe, hueShift),
      layoutId: recipe.layoutId,
      fontPairId: recipe.fontPairId,
      texture: recipe.texture,
      uppercase: recipe.uppercase,
      align: recipe.align,
      headlineScale: recipe.headlineScale,
    };
  });
}

const KEPT_KEY = "flyer-forge-looks";

function isKept(value: unknown): value is GeneratedStyle {
  if (!value || typeof value !== "object") return false;
  const item = value as GeneratedStyle;
  return (
    typeof item.key === "string" &&
    typeof item.name === "string" &&
    typeof item.vibe === "string" &&
    !!item.colors &&
    typeof item.colors.bg === "string" &&
    typeof item.colors.ink === "string" &&
    typeof item.colors.accent === "string" &&
    typeof item.colors.paper === "string" &&
    layouts.some((layout) => layout.id === item.layoutId) &&
    fontPairs.some((pair) => pair.id === item.fontPairId) &&
    isTexture(item.texture) &&
    (item.align === "left" || item.align === "center") &&
    typeof item.uppercase === "boolean" &&
    typeof item.headlineScale === "number"
  );
}

export function loadKept(): GeneratedStyle[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEPT_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter(isKept).slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function rememberLook(style: GeneratedStyle): GeneratedStyle[] {
  const next = [style, ...loadKept().filter((item) => item.name !== style.name || item.colors.bg !== style.colors.bg)].slice(0, 12);
  localStorage.setItem(KEPT_KEY, JSON.stringify(next));
  return next;
}

export function forgetLook(key: string): GeneratedStyle[] {
  const next = loadKept().filter((item) => item.key !== key);
  localStorage.setItem(KEPT_KEY, JSON.stringify(next));
  return next;
}

export function lookFromDoc(doc: FlyerDoc, name = "Kept"): GeneratedStyle {
  return {
    key: `kept-${Date.now()}`,
    name,
    vibe: "Saved from this sheet",
    colors: { ...doc.colors },
    layoutId: doc.layoutId,
    fontPairId: doc.fontPairId,
    texture: doc.texture,
    uppercase: doc.uppercase,
    align: doc.align,
    headlineScale: doc.headlineScale,
  };
}
