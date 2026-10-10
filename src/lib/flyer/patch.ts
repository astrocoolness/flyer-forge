import { centeredLayout, getFormat, getFontPair, getLayout, getTheme } from "@/lib/flyer/catalog";
import { COPY_LIMITS, isTexture, type Align, type FlyerCopy, type FlyerDoc, type Texture } from "@/lib/flyer/types";

export type FlyerPatch = {
  copy?: Partial<FlyerCopy>;
  themeId?: string;
  layoutId?: string;
  formatId?: string;
  fontPairId?: string;
  name?: string;
  texture?: Texture;
  align?: Align;
  uppercase?: boolean;
  headlineScale?: number;
};

const COPY_KEYS = Object.keys(COPY_LIMITS) as (keyof FlyerCopy)[];

export function sanitizePatch(raw: unknown): FlyerPatch | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const patch: FlyerPatch = {};

  if (typeof record.themeId === "string" && getTheme(record.themeId).id === record.themeId) {
    patch.themeId = record.themeId;
  }
  if (typeof record.layoutId === "string" && getLayout(record.layoutId).id === record.layoutId) {
    patch.layoutId = record.layoutId;
  }
  if (typeof record.formatId === "string" && getFormat(record.formatId).id === record.formatId) {
    patch.formatId = record.formatId;
  }
  if (typeof record.fontPairId === "string" && getFontPair(record.fontPairId).id === record.fontPairId) {
    patch.fontPairId = record.fontPairId;
  }
  if (typeof record.name === "string" && record.name.trim()) {
    patch.name = record.name.trim().slice(0, 60);
  }
  if (isTexture(record.texture)) patch.texture = record.texture;
  if (record.align === "left" || record.align === "center") patch.align = record.align;
  if (typeof record.uppercase === "boolean") patch.uppercase = record.uppercase;
  if (typeof record.headlineScale === "number" && Number.isFinite(record.headlineScale)) {
    patch.headlineScale = Math.min(1.25, Math.max(0.75, Math.round(record.headlineScale * 100) / 100));
  }
  if (record.copy && typeof record.copy === "object") {
    const source = record.copy as Record<string, unknown>;
    const copy: Partial<FlyerCopy> = {};
    for (const key of COPY_KEYS) {
      const value = source[key];
      if (typeof value === "string") copy[key] = value.trim().slice(0, COPY_LIMITS[key]);
    }
    if (Object.keys(copy).length > 0) patch.copy = copy;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function splitInkReply(text: string): { prose: string; patch: FlyerPatch | null } {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let jsonText: string | null = null;
  let prose = text.trim();
  if (fence && fence.index !== undefined) {
    jsonText = fence[1] ?? null;
    prose = text.slice(0, fence.index).trim();
  } else {
    const start = text.lastIndexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      jsonText = text.slice(start, end + 1);
      prose = text.slice(0, start).trim();
    }
  }
  if (!jsonText) return { prose: prose || text.trim(), patch: null };
  try {
    return { prose: prose || "Here is a pass at the sheet.", patch: sanitizePatch(JSON.parse(jsonText)) };
  } catch {
    return { prose: text.trim(), patch: null };
  }
}

export function mergePatch(doc: FlyerDoc, patch: FlyerPatch): FlyerDoc {
  const next: FlyerDoc = {
    ...doc,
    copy: { ...doc.copy, ...patch.copy },
    name: patch.name?.trim() ? patch.name.trim() : doc.name,
  };
  if (patch.themeId) {
    const theme = getTheme(patch.themeId);
    next.themeId = theme.id;
    next.colors = { ...theme.colors };
    next.texture = theme.texture;
    next.uppercase = theme.uppercase;
    if (!patch.layoutId) next.layoutId = theme.layoutId;
    if (!patch.fontPairId) next.fontPairId = theme.fontPairId;
  }
  if (patch.layoutId) next.layoutId = patch.layoutId;
  if (patch.formatId) next.formatId = patch.formatId;
  if (patch.fontPairId) next.fontPairId = patch.fontPairId;
  if (patch.layoutId || patch.themeId) {
    next.align = centeredLayout(next.layoutId) ? "center" : "left";
  }
  if (patch.texture) next.texture = patch.texture;
  if (patch.align) next.align = patch.align;
  if (typeof patch.uppercase === "boolean") next.uppercase = patch.uppercase;
  if (typeof patch.headlineScale === "number") next.headlineScale = patch.headlineScale;
  return next;
}

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  patch: FlyerPatch | null;
  applied: boolean;
};

export function sheetPayload(doc: FlyerDoc) {
  return {
    name: doc.name,
    formatId: doc.formatId,
    themeId: doc.themeId,
    layoutId: doc.layoutId,
    fontPairId: doc.fontPairId,
    texture: doc.texture,
    align: doc.align,
    uppercase: doc.uppercase,
    headlineScale: doc.headlineScale,
    copy: doc.copy,
    idea: doc.idea.slice(0, 4000),
  };
}
