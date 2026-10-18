export const TEXTURES = ["clean", "grain", "halftone", "rules", "speckle", "stripes", "xerox"] as const;
export type Texture = (typeof TEXTURES)[number];

export function isTexture(value: unknown): value is Texture {
  return typeof value === "string" && (TEXTURES as readonly string[]).includes(value);
}
export type Align = "left" | "center";
export const MARKS = ["off", "outline", "knock", "bar", "stamp"] as const;
export type Mark = (typeof MARKS)[number];

export function isMark(value: unknown): value is Mark {
  return typeof value === "string" && (MARKS as readonly string[]).includes(value);
}
export type PhotoRole = "background" | "inset" | "off";
export type PhotoPos = "center" | "top" | "bottom";

export type FlyerCopy = {
  kicker: string;
  headline: string;
  subhead: string;
  date: string;
  place: string;
  price: string;
  body: string;
  cta: string;
  fine: string;
};

export type FlyerColors = {
  bg: string;
  ink: string;
  accent: string;
  paper: string;
  mute: string;
  onAccent: string;
};

export type FlyerDoc = {
  id: string;
  name: string;
  updatedAt: number;
  formatId: string;
  themeId: string;
  layoutId: string;
  fontPairId: string;
  colors: FlyerColors;
  photoId: string | null;
  photoRole: PhotoRole;
  photoDim: number;
  photoPos: PhotoPos;
  copy: FlyerCopy;
  idea: string;
  headlineScale: number;
  align: Align;
  texture: Texture;
  uppercase: boolean;
  mark: Mark;
};

export const COPY_LIMITS: Record<keyof FlyerCopy, number> = {
  kicker: 48,
  headline: 80,
  subhead: 140,
  date: 48,
  place: 72,
  price: 32,
  body: 320,
  cta: 40,
  fine: 90,
};
