import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { inkOn, mixHex } from "@/lib/flyer/color";
import {
  centeredLayout,
  getFontPair,
  getStarter,
  getTheme,
  starters,
} from "@/lib/flyer/catalog";
import { mergePatch, type FlyerPatch } from "@/lib/flyer/patch";
import { isTexture, type Align, type FlyerCopy, type FlyerDoc, type Texture } from "@/lib/flyer/types";

const WELCOME_ID = "sheet-welcome";
const MAX_FLYERS = 24;

type Snapshot = { flyers: FlyerDoc[]; activeId: string };

type FlyerState = {
  flyers: FlyerDoc[];
  activeId: string;
  past: Snapshot[];
  future: Snapshot[];
  checkpoint: () => void;
  patchActive: (recipe: (doc: FlyerDoc) => FlyerDoc) => void;
  undo: () => void;
  redo: () => void;
  select: (id: string) => void;
  applyStarter: (starterId: string) => void;
  applyTheme: (themeId: string) => void;
  applyLayout: (layoutId: string) => void;
  applyFormat: (formatId: string) => void;
  applyFont: (fontPairId: string) => void;
  applyInk: (patch: FlyerPatch) => void;
  setCopy: (key: keyof FlyerCopy, value: string) => void;
  setIdea: (value: string) => void;
  setName: (value: string) => void;
  setColor: (key: "bg" | "ink" | "accent" | "paper", value: string) => void;
  resetColors: () => void;
  setTexture: (texture: Texture) => void;
  setAlign: (align: Align) => void;
  setUppercase: (uppercase: boolean) => void;
  setHeadlineScale: (headlineScale: number) => void;
  setPhoto: (patch: Partial<Pick<FlyerDoc, "photoId" | "photoRole" | "photoDim" | "photoPos">>) => void;
  newFlyer: () => boolean;
  duplicate: (id: string) => boolean;
  remove: (id: string) => void;
};

function docFromStarter(starterId: string, id: string, name?: string): FlyerDoc {
  const starter = getStarter(starterId);
  const theme = getTheme(starter.themeId);
  return {
    id,
    name: name ?? starter.name,
    updatedAt: 0,
    formatId: starter.formatId,
    themeId: theme.id,
    layoutId: starter.layoutId,
    fontPairId: starter.fontPairId,
    colors: { ...theme.colors },
    photoId: null,
    photoRole: "background",
    photoDim: 48,
    photoPos: "center",
    copy: { ...starter.copy },
    idea: starter.idea,
    headlineScale: 1,
    align: starter.align,
    texture: starter.texture,
    uppercase: starter.uppercase,
  };
}

function welcomeDoc(): FlyerDoc {
  return docFromStarter(starters[0].id, WELCOME_ID);
}

function blankDoc(): FlyerDoc {
  const doc = docFromStarter(starters[0].id, crypto.randomUUID(), "Untitled flyer");
  doc.updatedAt = Date.now();
  doc.copy = {
    kicker: "Kicker",
    headline: "Headline",
    subhead: "One line under the title.",
    date: "Date",
    place: "Place",
    price: "",
    body: "",
    cta: "Come through",
    fine: "",
  };
  doc.idea = "";
  return doc;
}

function normalize(doc: FlyerDoc): FlyerDoc {
  const base = welcomeDoc();
  const theme = getTheme(typeof doc.themeId === "string" ? doc.themeId : base.themeId);
  const colors = { ...theme.colors, ...(doc.colors ?? {}) };
  if (!colors.onAccent) colors.onAccent = inkOn(colors.accent);
  return {
    ...base,
    ...doc,
    themeId: theme.id,
    formatId: typeof doc.formatId === "string" ? doc.formatId : base.formatId,
    layoutId: typeof doc.layoutId === "string" ? doc.layoutId : theme.layoutId,
    fontPairId: getFontPair(typeof doc.fontPairId === "string" ? doc.fontPairId : theme.fontPairId).id,
    colors,
    copy: { ...base.copy, ...(doc.copy ?? {}) },
    idea: typeof doc.idea === "string" ? doc.idea : "",
    photoId: typeof doc.photoId === "string" ? doc.photoId : null,
    photoRole: doc.photoRole === "inset" || doc.photoRole === "off" ? doc.photoRole : "background",
    photoPos: doc.photoPos === "top" || doc.photoPos === "bottom" ? doc.photoPos : "center",
    photoDim: typeof doc.photoDim === "number" ? doc.photoDim : 48,
    headlineScale: typeof doc.headlineScale === "number" ? doc.headlineScale : 1,
    align: doc.align === "center" ? "center" : "left",
    uppercase: Boolean(doc.uppercase),
    texture: isTexture(doc.texture) ? doc.texture : "clean",
  };
}

function isDoc(value: unknown): value is FlyerDoc {
  if (!value || typeof value !== "object") return false;
  const doc = value as FlyerDoc;
  return typeof doc.id === "string" && !!doc.copy && typeof doc.copy.headline === "string";
}

export const useFlyerStore = create<FlyerState>()(
  persist(
    (set, get) => ({
      flyers: [welcomeDoc()],
      activeId: WELCOME_ID,
      past: [],
      future: [],
      checkpoint: () => {
        const { flyers, activeId, past } = get();
        set({
          past: [...past, { flyers: structuredClone(flyers), activeId }].slice(-30),
          future: [],
        });
      },
      patchActive: (recipe) => {
        const { flyers, activeId } = get();
        const current = flyers.find((flyer) => flyer.id === activeId) ?? flyers[0];
        const next = { ...recipe(current), id: current.id, updatedAt: Date.now() };
        set({
          flyers: flyers.map((flyer) => (flyer.id === current.id ? next : flyer)),
          activeId: current.id,
        });
      },
      undo: () => {
        const { past, future, flyers, activeId } = get();
        const prev = past[past.length - 1];
        if (!prev) return;
        set({
          past: past.slice(0, -1),
          future: [...future, { flyers: structuredClone(flyers), activeId }].slice(-30),
          flyers: prev.flyers,
          activeId: prev.activeId,
        });
      },
      redo: () => {
        const { past, future, flyers, activeId } = get();
        const next = future[future.length - 1];
        if (!next) return;
        set({
          future: future.slice(0, -1),
          past: [...past, { flyers: structuredClone(flyers), activeId }].slice(-30),
          flyers: next.flyers,
          activeId: next.activeId,
        });
      },
      select: (id) => set({ activeId: id }),
      applyStarter: (starterId) => {
        const starter = getStarter(starterId);
        const theme = getTheme(starter.themeId);
        get().checkpoint();
        get().patchActive((doc) => ({
          ...doc,
          name: starter.name,
          formatId: starter.formatId,
          themeId: theme.id,
          layoutId: starter.layoutId,
          fontPairId: starter.fontPairId,
          colors: { ...theme.colors },
          copy: { ...starter.copy },
          idea: starter.idea,
          align: starter.align,
          texture: starter.texture,
          uppercase: starter.uppercase,
          headlineScale: 1,
        }));
      },
      applyTheme: (themeId) => {
        const theme = getTheme(themeId);
        get().checkpoint();
        get().patchActive((doc) => ({
          ...doc,
          themeId: theme.id,
          colors: { ...theme.colors },
          layoutId: theme.layoutId,
          fontPairId: theme.fontPairId,
          texture: theme.texture,
          uppercase: theme.uppercase,
          align: centeredLayout(theme.layoutId) ? "center" : "left",
        }));
      },
      applyLayout: (layoutId) => {
        get().checkpoint();
        get().patchActive((doc) => ({
          ...doc,
          layoutId,
          align: centeredLayout(layoutId) ? "center" : "left",
        }));
      },
      applyFormat: (formatId) => {
        get().checkpoint();
        get().patchActive((doc) => ({ ...doc, formatId }));
      },
      applyFont: (fontPairId) => {
        get().checkpoint();
        get().patchActive((doc) => ({ ...doc, fontPairId }));
      },
      applyInk: (patch) => {
        get().checkpoint();
        get().patchActive((doc) => mergePatch(doc, patch));
      },
      setCopy: (key, value) => {
        get().patchActive((doc) => ({ ...doc, copy: { ...doc.copy, [key]: value } }));
      },
      setIdea: (value) => {
        get().patchActive((doc) => ({ ...doc, idea: value.slice(0, 4000) }));
      },
      setName: (value) => {
        get().patchActive((doc) => ({ ...doc, name: value.slice(0, 60) }));
      },
      setColor: (key, value) => {
        get().patchActive((doc) => {
          const next = { ...doc.colors, [key]: value };
          if (key === "accent") next.onAccent = inkOn(value);
          if (key === "bg" || key === "ink") next.mute = mixHex(next.ink, next.bg, 0.42);
          return { ...doc, colors: next };
        });
      },
      resetColors: () => {
        const theme = getTheme(selectActive(get()).themeId);
        get().checkpoint();
        get().patchActive((doc) => ({ ...doc, colors: { ...theme.colors } }));
      },
      setTexture: (texture) => {
        get().checkpoint();
        get().patchActive((doc) => ({ ...doc, texture }));
      },
      setAlign: (align) => {
        get().checkpoint();
        get().patchActive((doc) => ({ ...doc, align }));
      },
      setUppercase: (uppercase) => {
        get().checkpoint();
        get().patchActive((doc) => ({ ...doc, uppercase }));
      },
      setHeadlineScale: (headlineScale) => {
        get().patchActive((doc) => ({ ...doc, headlineScale }));
      },
      setPhoto: (patch) => {
        get().patchActive((doc) => ({ ...doc, ...patch }));
      },
      newFlyer: () => {
        if (get().flyers.length >= MAX_FLYERS) return false;
        get().checkpoint();
        const doc = blankDoc();
        set({ flyers: [doc, ...get().flyers], activeId: doc.id });
        return true;
      },
      duplicate: (id) => {
        const { flyers } = get();
        if (flyers.length >= MAX_FLYERS) return false;
        const source = flyers.find((flyer) => flyer.id === id);
        if (!source) return false;
        get().checkpoint();
        const doc: FlyerDoc = {
          ...structuredClone(source),
          id: crypto.randomUUID(),
          name: `${source.name} copy`.slice(0, 60),
          updatedAt: Date.now(),
        };
        set({ flyers: [doc, ...get().flyers], activeId: doc.id });
        return true;
      },
      remove: (id) => {
        const { flyers, activeId } = get();
        get().checkpoint();
        if (flyers.length === 1) {
          const fresh = docFromStarter(starters[0].id, flyers[0].id);
          fresh.updatedAt = Date.now();
          set({ flyers: [fresh], activeId: fresh.id });
          return;
        }
        const next = get().flyers.filter((flyer) => flyer.id !== id);
        set({
          flyers: next,
          activeId: activeId === id ? next[0].id : activeId,
        });
      },
    }),
    {
      name: "flyer-forge",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ flyers: state.flyers, activeId: state.activeId }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const raw = Array.isArray(state.flyers) ? state.flyers.filter(isDoc).map(normalize) : [];
        if (!raw.length) {
          state.flyers = [welcomeDoc()];
          state.activeId = WELCOME_ID;
          return;
        }
        state.flyers = raw;
        if (!raw.some((flyer) => flyer.id === state.activeId)) state.activeId = raw[0].id;
      },
    },
  ),
);

export function selectActive(state: Pick<FlyerState, "flyers" | "activeId">): FlyerDoc {
  return state.flyers.find((flyer) => flyer.id === state.activeId) ?? state.flyers[0];
}
