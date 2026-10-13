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
  { name: "Pool", vibe: "Deep water", hue: 188, accentHue: 168, ground: "dark", layoutId: "stage", fontPairId: "modern", texture: "grain", uppercase: false, align: "center", headlineScale: 1.06 },
  { name: "Chili", vibe: "Hot window", hue: 8, accentHue: 42, ground: "flood", layoutId: "slam", fontPairId: "impact", texture: "clean", uppercase: true, align: "left", headlineScale: 1.14 },
  { name: "Plum", vibe: "After dark", hue: 312, accentHue: 28, ground: "dark", layoutId: "poster", fontPairId: "classic", texture: "grain", uppercase: false, align: "center", headlineScale: 1.08 },
  { name: "Sand", vibe: "Late sun", hue: 36, accentHue: 16, ground: "light", layoutId: "stack", fontPairId: "editorial", texture: "grain", uppercase: false, align: "left", headlineScale: 1 },
  { name: "Neon", vibe: "Warehouse", hue: 312, accentHue: 78, ground: "dark", layoutId: "marquee", fontPairId: "brutal", texture: "halftone", uppercase: true, align: "center", headlineScale: 1.1 },
  { name: "Lawn", vibe: "Block party", hue: 92, accentHue: 48, ground: "flood", layoutId: "badge", fontPairId: "block", texture: "stripes", uppercase: true, align: "center", headlineScale: 1.04 },
  { name: "Cream", vibe: "Shop card", hue: 40, accentHue: 210, ground: "light", layoutId: "ticket", fontPairId: "typewriter", texture: "clean", uppercase: false, align: "left", headlineScale: 0.96 },
  { name: "Rust", vibe: "Yard gate", hue: 16, accentHue: 48, ground: "dark", layoutId: "rail", fontPairId: "condensed", texture: "xerox", uppercase: true, align: "left", headlineScale: 1.06 },
  { name: "Candy", vibe: "Fair stall", hue: 340, accentHue: 48, ground: "light", layoutId: "ribbon", fontPairId: "comic", texture: "stripes", uppercase: true, align: "center", headlineScale: 1.08 },
  { name: "Bus", vibe: "Last route", hue: 232, accentHue: 48, ground: "dark", layoutId: "split", fontPairId: "billboard", texture: "grain", uppercase: true, align: "left", headlineScale: 1.02 },
  { name: "Moss", vibe: "Garden wall", hue: 110, accentHue: 28, ground: "light", layoutId: "editorial", fontPairId: "book", texture: "speckle", uppercase: false, align: "left", headlineScale: 0.98 },
  { name: "Ember", vibe: "Kitchen night", hue: 18, accentHue: 42, ground: "dark", layoutId: "frame", fontPairId: "deco", texture: "grain", uppercase: false, align: "center", headlineScale: 1.04 },
  { name: "Cobalt", vibe: "Dock night", hue: 222, accentHue: 48, ground: "dark", layoutId: "slam", fontPairId: "block", texture: "halftone", uppercase: true, align: "left", headlineScale: 1.1 },
  { name: "Honey", vibe: "Tea room", hue: 44, accentHue: 18, ground: "light", layoutId: "frame", fontPairId: "classic", texture: "clean", uppercase: false, align: "center", headlineScale: 1 },
  { name: "Lilac", vibe: "Studio wall", hue: 278, accentHue: 330, ground: "light", layoutId: "poster", fontPairId: "editorial", texture: "speckle", uppercase: false, align: "center", headlineScale: 1.06 },
  { name: "Olive", vibe: "Pantry", hue: 82, accentHue: 38, ground: "dark", layoutId: "editorial", fontPairId: "book", texture: "grain", uppercase: false, align: "left", headlineScale: 0.98 },
  { name: "Punch", vibe: "Club door", hue: 328, accentHue: 48, ground: "dark", layoutId: "marquee", fontPairId: "comic", texture: "stripes", uppercase: true, align: "center", headlineScale: 1.08 },
  { name: "Slate", vibe: "Office board", hue: 214, accentHue: 200, ground: "light", layoutId: "columns", fontPairId: "modern", texture: "rules", uppercase: false, align: "left", headlineScale: 0.96 },
  { name: "Berry", vibe: "Late bar", hue: 348, accentHue: 20, ground: "dark", layoutId: "badge", fontPairId: "stadium", texture: "xerox", uppercase: true, align: "center", headlineScale: 1.08 },
  { name: "Fog", vibe: "Harbor morning", hue: 200, accentHue: 28, ground: "light", layoutId: "split", fontPairId: "newsroom", texture: "grain", uppercase: false, align: "left", headlineScale: 1 },
  { name: "Lime", vibe: "Loading dock", hue: 96, accentHue: 48, ground: "dark", layoutId: "rail", fontPairId: "brutal", texture: "halftone", uppercase: true, align: "left", headlineScale: 1.04 },
  { name: "Brick", vibe: "Sidewalk", hue: 14, accentHue: 42, ground: "light", layoutId: "stack", fontPairId: "condensed", texture: "xerox", uppercase: true, align: "left", headlineScale: 1.02 },
  { name: "Icebox", vibe: "Cold case", hue: 196, accentHue: 210, ground: "flood", layoutId: "ticket", fontPairId: "modern", texture: "clean", uppercase: false, align: "left", headlineScale: 0.96 },
  { name: "Velvet", vibe: "Private room", hue: 332, accentHue: 42, ground: "dark", layoutId: "frame", fontPairId: "deco", texture: "grain", uppercase: false, align: "center", headlineScale: 1.04 },
  { name: "Apricot", vibe: "Bakery window", hue: 24, accentHue: 350, ground: "light", layoutId: "slam", fontPairId: "handbill", texture: "speckle", uppercase: false, align: "left", headlineScale: 1.06 },
  { name: "Glacier", vibe: "Ski lodge", hue: 198, accentHue: 210, ground: "light", layoutId: "stage", fontPairId: "condensed", texture: "clean", uppercase: true, align: "center", headlineScale: 1.1 },
  { name: "Denim", vibe: "Work shirt", hue: 218, accentHue: 28, ground: "flood", layoutId: "columns", fontPairId: "block", texture: "rules", uppercase: false, align: "left", headlineScale: 1 },
  { name: "Butter", vibe: "Market stall", hue: 48, accentHue: 8, ground: "flood", layoutId: "poster", fontPairId: "impact", texture: "stripes", uppercase: true, align: "center", headlineScale: 1.12 },
  { name: "Copper", vibe: "Workshop", hue: 22, accentHue: 48, ground: "dark", layoutId: "ticket", fontPairId: "typewriter", texture: "grain", uppercase: false, align: "left", headlineScale: 1 },
  { name: "Mint", vibe: "Soda shop", hue: 158, accentHue: 340, ground: "light", layoutId: "ribbon", fontPairId: "comic", texture: "stripes", uppercase: true, align: "center", headlineScale: 1.04 },
  { name: "Rouge", vibe: "Lipstick bill", hue: 355, accentHue: 42, ground: "flood", layoutId: "slam", fontPairId: "impact", texture: "clean", uppercase: true, align: "left", headlineScale: 1.12 },
  { name: "Bone", vibe: "Museum card", hue: 40, accentHue: 18, ground: "light", layoutId: "frame", fontPairId: "book", texture: "clean", uppercase: false, align: "center", headlineScale: 0.98 },
  { name: "Pitch", vibe: "Black box", hue: 260, accentHue: 48, ground: "dark", layoutId: "poster", fontPairId: "billboard", texture: "xerox", uppercase: true, align: "center", headlineScale: 1.1 },
  { name: "Citrus", vibe: "Juice stand", hue: 52, accentHue: 120, ground: "flood", layoutId: "badge", fontPairId: "comic", texture: "halftone", uppercase: true, align: "center", headlineScale: 1.06 },
  { name: "Smoke", vibe: "Afterparty", hue: 250, accentHue: 28, ground: "dark", layoutId: "stack", fontPairId: "editorial", texture: "grain", uppercase: false, align: "left", headlineScale: 1 },
  { name: "Pearl", vibe: "Wedding line", hue: 330, accentHue: 350, ground: "light", layoutId: "frame", fontPairId: "deco", texture: "clean", uppercase: false, align: "center", headlineScale: 1 },
  { name: "Pine", vibe: "Trailhead", hue: 140, accentHue: 42, ground: "light", layoutId: "rail", fontPairId: "condensed", texture: "grain", uppercase: true, align: "left", headlineScale: 1.02 },
  { name: "Blush", vibe: "Dance card", hue: 350, accentHue: 18, ground: "light", layoutId: "ribbon", fontPairId: "classic", texture: "speckle", uppercase: false, align: "center", headlineScale: 1 },
  { name: "Tangerine", vibe: "Noon sign", hue: 28, accentHue: 200, ground: "flood", layoutId: "marquee", fontPairId: "billboard", texture: "clean", uppercase: true, align: "center", headlineScale: 1.08 },
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
  const lights = [24, 32, 42, 52, 62, 72, 82];
  const ranked = [hue, hue + 150, hue + 200].flatMap((accentHue) =>
    lights.map((light) => {
      const hex = hslToHex(accentHue, sat, light);
      return { hex, onBg: contrast(hex, bg), onInk: contrast(hex, ink) };
    }),
  );
  const clear = ranked
    .filter((item) => item.onBg >= 2.4 && item.onInk >= 1.35)
    .sort((a, b) => b.onBg - a.onBg);
  if (clear[0]) return clear[0].hex;
  return ranked.sort((a, b) => b.onBg - a.onBg)[0].hex;
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

export const STYLE_COUNT = RECIPES.length;

export function generateStyles(seed: number): GeneratedStyle[] {
  const hueShift = ((seed * 17) % 41) - 20;
  const ranked = RECIPES.map((recipe, index) => ({ recipe, roll: mix(seed, index) }));
  ranked.sort((a, b) => a.roll - b.roll);
  return ranked.slice(0, 8).map(({ recipe }) => ({
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
  }));
}

function mix(seed: number, index: number): number {
  let h = (seed + 1) * 374761393 + index * 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
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
