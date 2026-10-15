import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  Check,
  Copy,
  ImagePlus,
  LoaderCircle,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { fontPairs, formats, getFontPair, getFormat, getLayout, getTheme, layouts, starters, themeGroups, themes } from "@/lib/flyer/catalog";
import { fileToJpeg, readTextFile } from "@/lib/flyer/photos";
import type { ChatMessage } from "@/lib/flyer/patch";
import { STYLE_COUNT, STYLE_SHELVES, forgetLook, generateStyles, loadKept, lookFromDoc, rememberLook, type GeneratedStyle } from "@/lib/flyer/style";
import { selectActive, useFlyerStore } from "@/lib/flyer/store";
import { COPY_LIMITS, TEXTURES, type FlyerCopy, type Texture } from "@/lib/flyer/types";

function useEditSession() {
  const checkpoint = useFlyerStore((state) => state.checkpoint);
  const armed = useRef(false);
  return {
    arm() {
      if (!armed.current) {
        checkpoint();
        armed.current = true;
      }
    },
    disarm() {
      armed.current = false;
    },
  };
}

function Intro({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-2xl leading-none text-paper italic">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-pretty text-mute">{body}</p>
    </div>
  );
}

const COPY_FIELDS: { key: keyof FlyerCopy; label: string; hint: string; rows?: number }[] = [
  { key: "kicker", label: "Kicker", hint: "Small line above the title" },
  { key: "headline", label: "Headline", hint: "The shout. A line break makes two lines.", rows: 2 },
  { key: "subhead", label: "Subhead", hint: "One sentence under the title", rows: 2 },
  { key: "date", label: "Date", hint: "When it happens" },
  { key: "place", label: "Place", hint: "Where to show up" },
  { key: "price", label: "Price", hint: "Door, free, or a number" },
  { key: "body", label: "Details", hint: "The short paragraph", rows: 4 },
  { key: "cta", label: "Call to action", hint: "What they should do" },
  { key: "fine", label: "Fine print", hint: "The line nobody reads, until they do" },
];

export function CopyPanel() {
  const doc = useFlyerStore(selectActive);
  const setCopy = useFlyerStore((state) => state.setCopy);
  const edit = useEditSession();

  async function copyPlain() {
    const lines = [
      doc.copy.kicker,
      doc.copy.headline,
      doc.copy.subhead,
      [doc.copy.date, doc.copy.place, doc.copy.price].filter(Boolean).join(" · "),
      doc.copy.body,
      doc.copy.cta,
      doc.copy.fine,
    ].filter((line) => line.trim());
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Copy is on the clipboard");
    } catch {
      toast.error("Could not copy from this browser");
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <Intro title="Copy" body="Every line on the sheet. Short beats clever." />
      {COPY_FIELDS.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-paper">{field.label}</span>
            <span className="text-xs text-mute">{field.hint}</span>
          </span>
          {field.rows ? (
            <textarea
              rows={field.rows}
              className="field"
              maxLength={COPY_LIMITS[field.key]}
              value={doc.copy[field.key]}
              onChange={(event) => {
                edit.arm();
                setCopy(field.key, event.target.value);
              }}
              onBlur={edit.disarm}
            />
          ) : (
            <input
              className="field"
              maxLength={COPY_LIMITS[field.key]}
              value={doc.copy[field.key]}
              onChange={(event) => {
                edit.arm();
                setCopy(field.key, event.target.value);
              }}
              onBlur={edit.disarm}
            />
          )}
        </label>
      ))}
      <Button variant="line" onClick={() => void copyPlain()}>
        <Copy className="size-4" />
        Copy as text
      </Button>
    </div>
  );
}

const TEXTURE_LABELS: Record<Texture, string> = {
  clean: "Clean",
  grain: "Grain",
  halftone: "Halftone",
  rules: "Rules",
  speckle: "Speckle",
  stripes: "Stripes",
  xerox: "Xerox",
};

export function LookPanel({ guides, onGuides }: { guides: boolean; onGuides: (value: boolean) => void }) {
  const doc = useFlyerStore(selectActive);
  const applyTheme = useFlyerStore((state) => state.applyTheme);
  const applyStyle = useFlyerStore((state) => state.applyStyle);
  const nextStyles = useFlyerStore((state) => state.nextStyles);
  const cookLook = useFlyerStore((state) => state.cookLook);
  const seed = useFlyerStore((state) => state.styleSeed);
  const shelf = useFlyerStore((state) => state.styleShelf);
  const setStyleShelf = useFlyerStore((state) => state.setStyleShelf);
  const applyLayout = useFlyerStore((state) => state.applyLayout);
  const applyFormat = useFlyerStore((state) => state.applyFormat);
  const applyFont = useFlyerStore((state) => state.applyFont);
  const setTexture = useFlyerStore((state) => state.setTexture);
  const setAlign = useFlyerStore((state) => state.setAlign);
  const setUppercase = useFlyerStore((state) => state.setUppercase);
  const setHeadlineScale = useFlyerStore((state) => state.setHeadlineScale);
  const setColor = useFlyerStore((state) => state.setColor);
  const resetColors = useFlyerStore((state) => state.resetColors);
  const edit = useEditSession();
  const styles = generateStyles(seed).filter((style) => style.shelf === shelf);
  const [kept, setKept] = useState<GeneratedStyle[]>([]);

  useEffect(() => {
    setKept(loadKept());
  }, []);

  function keepCurrent() {
    const match = styles.find(
      (style) =>
        doc.layoutId === style.layoutId &&
        doc.fontPairId === style.fontPairId &&
        doc.colors.bg === style.colors.bg &&
        doc.colors.accent === style.colors.accent,
    );
    const style = match ? { ...match, key: `kept-${Date.now()}` } : lookFromDoc(doc);
    setKept(rememberLook(style));
    toast.success("Look kept");
  }

  return (
    <div className="flex flex-col gap-5 p-3">
      <Intro title="Look" body="Browse a shelf, or step through the whole set. The words stay put." />

      <section>
        <div className="mb-2 flex items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-paper">Styles</h3>
            <p className="text-xs text-mute">
              {styles.length} on this shelf · {STYLE_COUNT} looks
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="line" onClick={keepCurrent}>
              Keep
            </Button>
            <Button size="sm" variant="line" onClick={() => nextStyles()}>
              Again
            </Button>
            <Button size="sm" variant="primary" onClick={() => cookLook()}>
              New look
            </Button>
          </div>
        </div>
        <div className="mb-2 flex gap-1.5" role="tablist" aria-label="Style shelves">
          {STYLE_SHELVES.map((item) => {
            const on = shelf === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setStyleShelf(item.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  on ? "border-press bg-panel-2 text-paper" : "border-line text-mute hover:text-paper",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((style) => {
            const on =
              doc.themeId === "custom" &&
              doc.layoutId === style.layoutId &&
              doc.fontPairId === style.fontPairId &&
              doc.texture === style.texture &&
              doc.colors.bg === style.colors.bg &&
              doc.colors.accent === style.colors.accent;
            const font = getFontPair(style.fontPairId);
            const layout = getLayout(style.layoutId);
            const headline = doc.copy.headline.split("\n")[0]?.trim() || style.name;
            return (
              <button
                key={style.key}
                type="button"
                onClick={() => applyStyle(style)}
                aria-pressed={on}
                className={cn(
                  "rounded-lg border p-2 text-left",
                  on ? "border-press bg-panel-2" : "border-line bg-panel hover:border-mute",
                )}
              >
                <span className="flex h-14 overflow-hidden rounded-sm" style={{ background: style.colors.bg }}>
                  <span className="flex min-w-0 flex-1 items-end p-2" style={{ color: style.colors.ink }}>
                    <span
                      className="truncate text-xl leading-none"
                      style={{
                        fontFamily: `"${font.display}", ${font.displayFallback}`,
                        textTransform: style.uppercase ? "uppercase" : "none",
                      }}
                    >
                      {headline}
                    </span>
                  </span>
                  <span className="w-3 shrink-0" style={{ background: style.colors.accent }} />
                </span>
                <span className="mt-2 block text-sm text-paper">{style.name}</span>
                <span className="block text-xs text-mute">{style.vibe}</span>
                <span className="mt-1 block text-xs text-mute">
                  {layout.name} · {font.name} · {style.texture}
                </span>
              </button>
            );
          })}
        </div>
        {kept.length ? (
          <div className="mt-3">
            <p className="mb-1.5 text-xs tracking-widest text-mute uppercase">Kept</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {kept.map((style) => (
                <div key={style.key} className="flex shrink-0 items-center gap-1 rounded-lg border border-line bg-panel p-1">
                  <button type="button" className="flex items-center gap-2 px-1 py-1 text-left" onClick={() => applyStyle(style)}>
                    <span className="flex h-8 w-10 overflow-hidden rounded-sm">
                      <span className="h-full w-1/2" style={{ background: style.colors.bg }} />
                      <span className="h-full w-1/4" style={{ background: style.colors.ink }} />
                      <span className="h-full w-1/4" style={{ background: style.colors.accent }} />
                    </span>
                    <span className="text-sm text-paper">{style.name}</span>
                  </button>
                  <button
                    type="button"
                    className="px-1 text-mute hover:text-paper"
                    aria-label={`Forget ${style.name}`}
                    onClick={() => setKept(forgetLook(style.key))}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-paper">Themes</h3>
        {themeGroups.map((group) => (
          <div key={group.id} className="mb-3">
            <p className="mb-1.5 text-xs tracking-widest text-mute uppercase">{group.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {themes
                .filter((theme) => theme.group === group.id)
                .map((theme) => {
                  const on = doc.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => applyTheme(theme.id)}
                      aria-pressed={on}
                      className={cn(
                        "rounded-lg border p-2 text-left",
                        on ? "border-press bg-panel-2" : "border-line bg-panel hover:border-mute",
                      )}
                    >
                      <span className="mb-2 flex h-8 overflow-hidden rounded-sm">
                        <span className="h-full w-1/2" style={{ background: theme.colors.bg }} />
                        <span className="h-full w-1/4" style={{ background: theme.colors.accent }} />
                        <span className="h-full w-1/4" style={{ background: theme.colors.paper }} />
                      </span>
                      <span className="block text-sm text-paper">{theme.name}</span>
                      <span className="block text-xs text-mute">{theme.vibe}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-paper">Layouts</h3>
        <div className="grid grid-cols-2 gap-2">
          {layouts.map((layout) => {
            const on = doc.layoutId === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => applyLayout(layout.id)}
                aria-pressed={on}
                className={cn(
                  "min-h-11 rounded-lg border px-2 py-2 text-left",
                  on ? "border-press bg-panel-2" : "border-line hover:border-mute",
                )}
              >
                <span className="block text-sm text-paper">{layout.name}</span>
                <span className="block text-xs text-mute">{layout.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-paper">Fonts</h3>
        <div className="grid grid-cols-2 gap-2">
          {fontPairs.map((pair) => {
            const on = doc.fontPairId === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => applyFont(pair.id)}
                aria-pressed={on}
                className={cn(
                  "min-h-11 rounded-lg border px-2 py-2 text-left",
                  on ? "border-press bg-panel-2" : "border-line hover:border-mute",
                )}
              >
                <span className="block text-lg leading-none text-paper" style={{ fontFamily: `"${pair.display}", ${pair.displayFallback}` }}>
                  {pair.name}
                </span>
                <span className="mt-1 block text-xs text-mute">
                  {pair.display} / {pair.body}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-paper">Formats</h3>
        <div className="grid grid-cols-2 gap-2">
          {formats.map((format) => {
            const on = doc.formatId === format.id;
            const boxH = 36;
            const boxW = Math.max(18, Math.round(boxH * (format.w / format.h)));
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => applyFormat(format.id)}
                aria-pressed={on}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg border px-2 py-2 text-left",
                  on ? "border-press bg-panel-2" : "border-line hover:border-mute",
                )}
              >
                <span className="grid h-11 w-11 place-items-center">
                  <span className="border border-mute bg-bench" style={{ width: boxW, height: boxH }} />
                </span>
                <span>
                  <span className="block text-sm text-paper">{format.name}</span>
                  <span className="block text-xs text-mute">{format.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-paper">Type</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {TEXTURES.map((texture) => (
            <Button
              key={texture}
              size="sm"
              variant={doc.texture === texture ? "primary" : "line"}
              aria-pressed={doc.texture === texture}
              onClick={() => setTexture(texture)}
            >
              {TEXTURE_LABELS[texture]}
            </Button>
          ))}
        </div>
        <div className="mb-3 flex gap-2">
          <Button size="sm" variant={doc.align === "left" ? "primary" : "line"} aria-pressed={doc.align === "left"} onClick={() => setAlign("left")}>
            <AlignLeft className="size-4" />
            Left
          </Button>
          <Button size="sm" variant={doc.align === "center" ? "primary" : "line"} aria-pressed={doc.align === "center"} onClick={() => setAlign("center")}>
            <AlignCenter className="size-4" />
            Center
          </Button>
          <Button size="sm" variant={doc.uppercase ? "primary" : "line"} aria-pressed={doc.uppercase} onClick={() => setUppercase(!doc.uppercase)}>
            Caps
          </Button>
          <Button size="sm" variant={guides ? "primary" : "line"} aria-pressed={guides} onClick={() => onGuides(!guides)}>
            Guides
          </Button>
        </div>
        <label className="block text-sm text-paper">
          Headline size
          <input
            className="mt-2 w-full accent-press"
            type="range"
            min={0.75}
            max={1.25}
            step={0.01}
            value={doc.headlineScale}
            onPointerDown={edit.arm}
            onBlur={edit.disarm}
            onChange={(event) => setHeadlineScale(Number(event.target.value))}
          />
        </label>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-paper">Ink colors</h3>
          <button type="button" className="text-sm text-mute underline-offset-2 hover:text-paper hover:underline" onClick={resetColors}>
            Reset
          </button>
        </div>
        <div className="flex gap-3">
          {(
            [
              ["bg", "Ground"],
              ["ink", "Type"],
              ["accent", "Accent"],
              ["paper", "Band"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex flex-col items-center gap-1 text-xs text-mute">
              <input
                className="swatch"
                type="color"
                aria-label={label}
                value={doc.colors[key]}
                onPointerDown={edit.arm}
                onBlur={edit.disarm}
                onChange={(event) => setColor(key, event.target.value)}
              />
              {label}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PhotoPanel({
  photoUrl,
  onPick,
  onClear,
  onAsk,
}: {
  photoUrl: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
  onAsk: () => void;
}) {
  const doc = useFlyerStore(selectActive);
  const setPhoto = useFlyerStore((state) => state.setPhoto);
  const checkpoint = useFlyerStore((state) => state.checkpoint);
  const inputRef = useRef<HTMLInputElement>(null);
  const edit = useEditSession();

  return (
    <div className="flex flex-col gap-4 p-3">
      <Intro title="Photo" body="Pictures stay in this browser. Ink only sees one if you ask." />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onPick(file);
        }}
      />
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-40 w-full rounded-lg object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-paper hover:bg-panel"
        >
          <ImagePlus className="size-5" />
          <span className="text-sm">Upload a photo</span>
          <span className="px-6 text-center text-xs text-mute">JPG, PNG, or a screenshot of the idea</span>
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="line" onClick={() => inputRef.current?.click()}>
          {photoUrl ? "Replace" : "Choose photo"}
        </Button>
        {photoUrl ? (
          <Button variant="ghost" onClick={onClear}>
            Remove
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["background", "Background"],
            ["inset", "Inset"],
            ["off", "Hidden"],
          ] as const
        ).map(([role, label]) => (
          <Button
            key={role}
            size="sm"
            variant={doc.photoRole === role ? "primary" : "line"}
            aria-pressed={doc.photoRole === role}
            onClick={() => {
              checkpoint();
              setPhoto({ photoRole: role });
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["top", "Top"],
            ["center", "Center"],
            ["bottom", "Bottom"],
          ] as const
        ).map(([pos, label]) => (
          <Button
            key={pos}
            size="sm"
            variant={doc.photoPos === pos ? "primary" : "line"}
            aria-pressed={doc.photoPos === pos}
            onClick={() => {
              checkpoint();
              setPhoto({ photoPos: pos });
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <label className="block text-sm text-paper">
        Scrim
        <input
          className="mt-2 w-full accent-press"
          type="range"
          min={0}
          max={80}
          step={1}
          value={doc.photoDim}
          disabled={!photoUrl}
          onPointerDown={edit.arm}
          onBlur={edit.disarm}
          onChange={(event) => setPhoto({ photoDim: Number(event.target.value) })}
        />
      </label>
      <Button variant="primary" disabled={!photoUrl} onClick={onAsk}>
        Ask Ink about this photo
      </Button>
    </div>
  );
}

const PROMPT_GROUPS: { label: string; items: { label: string; text: string }[] }[] = [
  {
    label: "Write",
    items: [
      {
        label: "Draft the sheet",
        text: "Using my idea notes and the current sheet, write the full flyer. Pick a theme, layout, format, and font pairing. Keep every fact I gave. Replace weak lines.",
      },
      {
        label: "Punchier headline",
        text: "Rewrite only the headline so it hits harder. Keep the facts. Change nothing else.",
      },
      {
        label: "Cut it down",
        text: "Shorten every line. Headline under five words. Body one sentence. Keep the facts.",
      },
      {
        label: "Two voices",
        text: "In the reply, offer one loud headline and one quiet headline. Put the louder one on the sheet. Keep the facts. Change only the headline.",
      },
    ],
  },
  {
    label: "Style",
    items: [
      {
        label: "Riso print",
        text: "Restyle this as a two-color risograph poster. Use theme riso, layout poster, font brutal, texture speckle, uppercase true. Rewrite the copy in that voice. Keep every fact.",
      },
      {
        label: "Noir",
        text: "Restyle this as a noir midnight poster. Use theme noir, layout frame, font condensed, texture grain, align center, uppercase true. Rewrite the copy spare and dry. Keep every fact.",
      },
      {
        label: "Record shop",
        text: "Restyle this like a record-shop handbill. Use theme vinyl, layout badge, font stadium, texture halftone, uppercase true. Keep every fact.",
      },
      {
        label: "Greenhouse",
        text: "Restyle this as a quiet greenhouse card. Use theme botanical, layout editorial, font book, texture clean, uppercase false. Keep every fact.",
      },
      {
        label: "Warehouse",
        text: "Restyle this as a warehouse flyer. Use theme rave, layout marquee, font brutal, texture halftone, uppercase true. Keep every fact. Do not invent a door policy.",
      },
      {
        label: "Fairground",
        text: "Restyle this as a fairground bill. Use theme carnival, layout ribbon, font comic, texture stripes, uppercase true. Keep every fact.",
      },
      {
        label: "Winter invite",
        text: "Restyle this as a winter invitation. Use theme ice, layout frame, font deco, texture clean, uppercase false, align center. Keep every fact.",
      },
      {
        label: "Shop bag",
        text: "Restyle this as a kraft shop-bag card. Use theme kraft, layout rail, font typewriter, texture xerox, uppercase false. Keep every fact.",
      },
      {
        label: "Newspaper",
        text: "Restyle this as a newspaper column. Use theme newsprint, layout columns, font newsroom, texture rules, uppercase false. Keep every fact.",
      },
      {
        label: "Desert dusk",
        text: "Restyle this for late sun. Use theme desert, layout stack, font editorial, texture grain, uppercase false. Keep every fact.",
      },
      {
        label: "Make it elegant",
        text: "Rewrite the copy in a quieter, more elegant register and switch to a fitting theme, layout, and font pairing. Keep the facts.",
      },
      {
        label: "Add urgency",
        text: "Rewrite the copy so it feels timely, without fake scarcity or shouting. Keep the facts.",
      },
    ],
  },
  {
    label: "Fit",
    items: [
      {
        label: "Story",
        text: "Adapt this flyer for a vertical phone story. Shorten the copy and set the format to story.",
      },
      {
        label: "Postcard",
        text: "Fit this on a postcard. Shorten every line. Set the format to postcard and the layout to ribbon.",
      },
      {
        label: "Banner",
        text: "Turn this into a wide banner. One short headline line. Set the format to banner and the layout to ribbon.",
      },
      {
        label: "Tall poster",
        text: "Make it a tall wall poster. Big type, few words. Set the format to poster and the layout to poster.",
      },
    ],
  },
];

export function InkPanel({
  messages,
  busy,
  error,
  reference,
  onSend,
  onApply,
  onClear,
  onClearReference,
  onAttach,
}: {
  messages: ChatMessage[];
  busy: boolean;
  error: string | null;
  reference: string | null;
  onSend: (text: string, image?: string | null, label?: string) => void;
  onApply: (id: string) => void;
  onClear: () => void;
  onClearReference: () => void;
  onAttach: (dataUrl: string) => void;
}) {
  const doc = useFlyerStore(selectActive);
  const setIdea = useFlyerStore((state) => state.setIdea);
  const edit = useEditSession();
  const draft = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, busy, error]);

  async function attachImage(file: File) {
    try {
      const data = await fileToJpeg(file, 768, 0.62);
      if (data.length > 440_000) {
        toast.error("That reference is too heavy. Try a smaller picture.");
        return;
      }
      onAttach(data);
    } catch {
      toast.error("Could not read that picture.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={threadRef} className="scroll-y flex min-h-0 flex-1 flex-col gap-3 p-3">
        <Intro
          title="Prompt"
          body="Ask for a line, a mood, or a new format. Ink rewrites the sheet. Notes you send leave this browser."
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-paper">Idea notes</span>
          <textarea
            rows={3}
            className="field"
            maxLength={4000}
            placeholder="Friday, three bands, twelve dollars, the room on Grace Street…"
            value={doc.idea}
            onChange={(event) => {
              edit.arm();
              setIdea(event.target.value);
            }}
            onBlur={edit.disarm}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="line" size="sm" onClick={() => noteRef.current?.click()}>
            <Paperclip className="size-4" />
            Upload notes
          </Button>
          {messages.length ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear chat
            </Button>
          ) : null}
          <input
            ref={noteRef}
            type="file"
            accept=".txt,.md,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void readTextFile(file)
                .then((text) => {
                  if (!text) return;
                  useFlyerStore.getState().checkpoint();
                  setIdea(text);
                  toast.success("Notes loaded");
                })
                .catch(() => toast.error("Could not read that file"));
            }}
          />
        </div>
        <div className="flex flex-col gap-2" aria-live="polite">
          {messages.length === 0 ? (
            <p className="rounded-lg border border-line bg-ink px-3 py-3 text-sm leading-relaxed text-mute">
              Try a style chip, or type what the flyer is for. Ink puts the edit on the sheet.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[95%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                  message.role === "user" ? "ml-auto bg-panel-2 text-paper" : "border border-line bg-ink text-paper",
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.patch ? (
                  <div className="mt-2">
                    {message.applied ? (
                      <span className="inline-flex items-center gap-1 text-xs text-mute">
                        <Check className="size-3.5" />
                        On the sheet
                      </span>
                    ) : (
                      <Button size="sm" variant="primary" onClick={() => onApply(message.id)}>
                        Put it on the sheet
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            ))
          )}
          {busy ? (
            <p className="inline-flex items-center gap-2 text-sm text-mute">
              <LoaderCircle className="size-4 animate-spin" />
              Setting type…
            </p>
          ) : null}
          {error ? <p className="text-sm text-press">{error}</p> : null}
        </div>
      </div>
      <div className="shrink-0 border-t border-line p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {PROMPT_GROUPS.flatMap((group) => group.items).map((item) => (
            <Button
              key={item.label}
              size="sm"
              variant="quiet"
              disabled={busy}
              className="shrink-0"
              onClick={() => onSend(item.text, reference, item.label)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {reference ? (
          <div className="mb-2 flex items-center gap-2">
            <img src={reference} alt="" className="h-12 w-12 rounded-md object-cover" />
            <span className="text-xs text-mute">Attached for the next message</span>
            <button type="button" className="text-sm text-paper underline-offset-2 hover:underline" onClick={onClearReference}>
              Remove
            </button>
          </div>
        ) : null}
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = draft.current?.value ?? "";
            if (!text.trim() || busy) return;
            onSend(text);
            if (draft.current) draft.current.value = "";
          }}
        >
          <textarea
            ref={draft}
            rows={2}
            className="field"
            placeholder="Ask for a headline, a mood, a different format…"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={busy}>
              Send
            </Button>
            <Button variant="line" disabled={busy} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-4" />
              Reference
            </Button>
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void attachImage(file);
              }}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export function Library({ onCreate }: { onCreate: (ok: boolean) => void }) {
  const flyers = useFlyerStore((state) => state.flyers);
  const activeId = useFlyerStore((state) => state.activeId);
  const select = useFlyerStore((state) => state.select);
  const applyStarter = useFlyerStore((state) => state.applyStarter);
  const duplicate = useFlyerStore((state) => state.duplicate);
  const remove = useFlyerStore((state) => state.remove);
  const fresh = useFlyerStore((state) => state.newFlyer);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <h2 className="font-display text-2xl text-paper italic">Sheets</h2>
        <Button
          size="sm"
          variant="primary"
          onClick={() => onCreate(fresh())}
        >
          <Plus className="size-4" />
          New
        </Button>
      </div>
      <div className="scroll-y flex min-h-0 flex-1 flex-col gap-4 p-3">
        <ul className="flex flex-col gap-1">
          {flyers
            .slice()
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((flyer) => {
              const on = flyer.id === activeId;
              const theme = getTheme(flyer.themeId);
              const format = getFormat(flyer.formatId);
              return (
                <li key={flyer.id}>
                  <div className={cn("rounded-lg border", on ? "border-press bg-panel-2" : "border-transparent hover:bg-panel")}>
                    <button type="button" onClick={() => select(flyer.id)} className="w-full px-2 py-2 text-left">
                      <span className="block truncate text-sm text-paper">{flyer.name}</span>
                      <span className="block truncate text-xs text-mute">
                        {theme.name} · {format.name}
                      </span>
                    </button>
                    {on ? (
                      <div className="flex gap-1 px-2 pb-2">
                        <Button size="sm" variant="ghost" onClick={() => onCreate(duplicate(flyer.id))}>
                          <Copy className="size-3.5" />
                          Duplicate
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(flyer.id)}>
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
        </ul>
        <section>
          <h3 className="mb-2 text-sm font-medium text-paper">Quick starts</h3>
          <div className="grid grid-cols-2 gap-2">
            {starters.map((starter) => {
              const theme = getTheme(starter.themeId);
              const pair = getFontPair(starter.fontPairId);
              return (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => applyStarter(starter.id)}
                  className="rounded-lg border border-line p-2 text-left hover:border-mute"
                >
                  <span className="mb-2 block overflow-hidden rounded-sm px-2 py-2" style={{ background: theme.colors.bg, color: theme.colors.ink }}>
                    <span className="mb-1 block h-1 w-6" style={{ background: theme.colors.accent }} />
                    <span className="block truncate text-sm leading-none" style={{ fontFamily: `"${pair.display}", ${pair.displayFallback}` }}>
                      {starter.copy.headline.split("\n")[0]}
                    </span>
                  </span>
                  <span className="block truncate text-sm text-paper">{starter.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
