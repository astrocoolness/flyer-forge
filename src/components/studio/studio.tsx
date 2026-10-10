import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, ImagePlus, Library, MessageSquare, Palette, Printer, Redo2, Type, Undo2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { FlyerSheet } from "@/components/studio/sheet";
import { CopyPanel, InkPanel, Library as SheetLibrary, LookPanel, PhotoPanel } from "@/components/studio/panels";
import { cn } from "@/lib/cn";
import { getFormat, getTheme } from "@/lib/flyer/catalog";
import { askInk } from "@/lib/flyer/ink.functions";
import { sheetPayload, splitInkReply, type ChatMessage } from "@/lib/flyer/patch";
import { fileToJpeg, loadPhoto, savePhoto, shrinkDataUrl } from "@/lib/flyer/photos";
import { selectActive, useFlyerStore } from "@/lib/flyer/store";

type Tab = "copy" | "look" | "photo" | "ink" | "saved";

const TABS: { id: Tab; label: string; icon: typeof Type; wideOnly?: boolean }[] = [
  { id: "copy", label: "Copy", icon: Type },
  { id: "look", label: "Look", icon: Palette },
  { id: "photo", label: "Photo", icon: ImagePlus },
  { id: "ink", label: "Prompt", icon: MessageSquare },
  { id: "saved", label: "Saved", icon: Library, wideOnly: true },
];

const THREAD_KEY = "flyer-forge-threads";

function loadThreads(): Record<string, ChatMessage[]> {
  try {
    const raw = sessionStorage.getItem(THREAD_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, ChatMessage[]>;
  } catch {
    return {};
  }
}

function saveThread(id: string, messages: ChatMessage[]) {
  try {
    const all = loadThreads();
    all[id] = messages.slice(-24);
    sessionStorage.setItem(THREAD_KEY, JSON.stringify(all));
  } catch {
    // The chat still works for this visit if storage is full.
  }
}

function slug(name: string) {
  const safe = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return safe || "flyer";
}

export function Studio() {
  const doc = useFlyerStore(selectActive);
  const setName = useFlyerStore((state) => state.setName);
  const checkpoint = useFlyerStore((state) => state.checkpoint);
  const canUndo = useFlyerStore((state) => state.past.length > 0);
  const canRedo = useFlyerStore((state) => state.future.length > 0);
  const ask = useServerFn(askInk);

  const [tab, setTab] = useState<Tab>("ink");
  const [guides, setGuides] = useState(false);
  const [scale, setScale] = useState(0.35);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [drag, setDrag] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [inkError, setInkError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  function setThread(next: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[])) {
    setMessages((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      saveThread(selectActive(useFlyerStore.getState()).id, resolved);
      return resolved;
    });
  }

  useEffect(() => {
    setMessages(loadThreads()[doc.id] ?? []);
  }, [doc.id]);

  const slotRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const nameArmed = useRef(false);
  const dragDepth = useRef(0);
  const format = getFormat(doc.formatId);
  const theme = getTheme(doc.themeId);

  useEffect(() => {
    void useFlyerStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 64rem)");
    const sync = () => {
      if (media.matches) setTab((current) => (current === "saved" ? "copy" : current));
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        useFlyerStore.getState().redo();
      } else if (key === "z" || key === "y") {
        event.preventDefault();
        if (key === "y") useFlyerStore.getState().redo();
        else useFlyerStore.getState().undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancel = false;
    if (!doc.photoId) {
      setPhotoUrl(null);
      return;
    }
    void loadPhoto(doc.photoId)
      .then((url) => {
        if (!cancel) setPhotoUrl(url);
      })
      .catch(() => {
        if (!cancel) setPhotoUrl(null);
      });
    return () => {
      cancel = true;
    };
  }, [doc.photoId]);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const measure = () => {
      const rect = slot.getBoundingClientRect();
      const next = Math.min((rect.width - 28) / format.w, (rect.height - 16) / format.h);
      setScale(Number.isFinite(next) && next > 0 ? Math.min(1, next) : 0.3);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => observer.disconnect();
  }, [format.w, format.h]);

  function noteCap(ok: boolean) {
    if (!ok) toast.error("The bench holds 24 sheets. Delete one first.");
  }

  async function useDesignPhoto(file: File) {
    try {
      const data = await fileToJpeg(file, 1600, 0.72);
      const id = crypto.randomUUID();
      await savePhoto(id, data);
      const current = selectActive(useFlyerStore.getState());
      checkpoint();
      useFlyerStore.getState().setPhoto({
        photoId: id,
        photoRole: current.photoRole === "off" ? "background" : current.photoRole,
      });
      setPhotoUrl(data);
      toast.success("Photo is on the sheet");
    } catch {
      toast.error("Could not use that image. Try a JPG or PNG.");
    }
  }

  function clearPhoto() {
    checkpoint();
    useFlyerStore.getState().setPhoto({ photoId: null, photoRole: "off" });
    setPhotoUrl(null);
  }

  async function takeFiles(list: FileList) {
    for (const file of Array.from(list)) {
      if (file.type.startsWith("image/")) {
        await useDesignPhoto(file);
      } else if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
        const text = await file.text();
        const notes = text.replace(/\u0000/g, "").trim().slice(0, 4000);
        if (!notes) continue;
        checkpoint();
        useFlyerStore.getState().setIdea(notes);
        setTab("ink");
        toast.success("Notes added for Ink");
      }
    }
  }

  async function send(prompt: string, auto: boolean, image?: string | null, label?: string) {
    const full = prompt.trim();
    if (!full || busy) return;
    const attached = image === undefined ? reference : image;
    if (attached && attached.length > 440_000) {
      setInkError("That reference image is too heavy.");
      return;
    }
    const user: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: (label ?? full).slice(0, 4000),
      patch: null,
      applied: false,
    };
    const history = [...messages, user].slice(-8);
    setThread((current) => [...current, user].slice(-24));
    setBusy(true);
    setInkError(null);
    setTab("ink");
    try {
      const sheet = sheetPayload(selectActive(useFlyerStore.getState()));
      const result = await ask({
        data: {
          messages: history.map((message, index) => ({
            role: message.role,
            content: index === history.length - 1 ? full : message.content,
          })),
          sheet,
          ...(attached ? { referenceImage: attached } : {}),
        },
      });
      if (!result.ok) {
        setInkError(result.error);
        return;
      }
      const parsed = splitInkReply(result.text);
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: parsed.prose || "Done.",
        patch: parsed.patch,
        applied: false,
      };
      if (auto && parsed.patch) {
        useFlyerStore.getState().applyInk(parsed.patch);
        assistant.applied = true;
      }
      setThread((current) => [...current, assistant].slice(-24));
      if (attached) setReference(null);
    } catch {
      setInkError("Ink could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  function applyMessage(id: string) {
    const message = messages.find((item) => item.id === id);
    if (!message?.patch) return;
    useFlyerStore.getState().applyInk(message.patch);
    setThread((current) => current.map((item) => (item.id === id ? { ...item, applied: true } : item)));
    toast.success("On the sheet");
  }

  async function download() {
    const node = sheetRef.current;
    if (!node || exporting) return;
    setExporting(true);
    try {
      await document.fonts.ready;
      const { toPng } = await import("html-to-image");
      const options = {
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
        backgroundColor: doc.colors.bg,
        filter: (domNode: HTMLElement) => !(domNode instanceof HTMLElement && domNode.dataset.export === "skip"),
      };
      let data: string;
      try {
        data = await toPng(node, options);
      } catch {
        data = await toPng(node, { ...options, skipFonts: true });
      }
      const link = document.createElement("a");
      link.href = data;
      link.download = `${slug(doc.name)}.png`;
      link.click();
      toast.success("PNG downloaded");
    } catch {
      toast.error("Could not make a PNG. Use Print / PDF instead.");
    } finally {
      setExporting(false);
    }
  }

  async function askPhoto() {
    if (!photoUrl) return;
    try {
      const small = await shrinkDataUrl(photoUrl, 768, 0.62);
      setReference(small);
      await send(
        "Look at the attached photo and rewrite the flyer so the words belong with the picture. Keep every fact already on the sheet.",
        true,
        small,
        "Read the photo",
      );
    } catch {
      toast.error("Could not prepare that photo for Ink.");
    }
  }

  return (
    <div
      className="print-root relative flex h-dvh flex-col"
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setDrag(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDrag(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDrag(false);
        void takeFiles(event.dataTransfer.files);
      }}
    >
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--color-panel)",
            color: "var(--color-paper)",
            border: "1px solid var(--color-line)",
          },
        }}
      />
      {drag ? (
        <div className="no-print pointer-events-none absolute inset-0 z-30 grid place-items-center bg-ink/80">
          <p className="font-display text-3xl text-paper italic">Drop a photo or a note</p>
        </div>
      ) : null}
      <header className="no-print border-b border-line">
        <div className="flex items-center gap-2 px-3 pt-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-sm bg-paper font-display text-lg text-press italic" aria-hidden>
            F
          </div>
          <p className="hidden font-display text-lg text-paper italic sm:block">Flyer Forge</p>
          <div className="ml-auto flex shrink-0">
            <Button size="icon" variant="ghost" aria-label="Undo" title="Undo" disabled={!canUndo} onClick={() => useFlyerStore.getState().undo()}>
              <Undo2 className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Redo" title="Redo" disabled={!canRedo} onClick={() => useFlyerStore.getState().redo()}>
              <Redo2 className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Download PNG" title="Download PNG" disabled={exporting} onClick={() => void download()}>
              <Download className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Print or save PDF" title="Print or save PDF" onClick={() => window.print()}>
              <Printer className="size-4" />
            </Button>
          </div>
        </div>
        <div className="px-3 pt-2 pb-2">
          <input
            aria-label="Flyer name"
            className="field"
            maxLength={60}
            value={doc.name}
            onChange={(event) => {
              if (!nameArmed.current) {
                checkpoint();
                nameArmed.current = true;
              }
              setName(event.target.value);
            }}
            onBlur={() => {
              nameArmed.current = false;
            }}
          />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-line lg:flex">
          <SheetLibrary onCreate={noteCap} />
        </aside>
        <div className="stage-slot flex min-h-0 flex-col">
          <div ref={slotRef} className="stage relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <div className="sheet-sizer" style={{ width: format.w * scale, height: format.h * scale }}>
              <div className="sheet-scale" style={{ width: format.w, height: format.h, transform: `scale(${scale})` }}>
                <FlyerSheet doc={doc} photoUrl={photoUrl} guides={guides} sheetRef={sheetRef} />
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setTab("look")} className="no-print shrink-0 py-2 text-center text-xs tracking-widest text-mute uppercase">
            {format.name} · {theme.name}
          </button>
        </div>
        <section className="no-print flex min-h-0 flex-1 flex-col border-t border-line lg:w-96 lg:flex-none lg:border-t-0 lg:border-l">
          <div className="flex border-b border-line" role="tablist" aria-label="Flyer tools">
            {TABS.map((item) => {
              const Icon = item.icon;
              const on = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={cn(
                    "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-mute",
                    item.wideOnly && "lg:hidden",
                    on && "tab-on",
                  )}
                  onClick={() => setTab(item.id)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className={cn("min-h-0 flex-1", tab === "saved" || tab === "ink" ? "flex flex-col" : "scroll-y")}>
            {tab === "copy" ? <CopyPanel /> : null}
            {tab === "look" ? <LookPanel guides={guides} onGuides={setGuides} /> : null}
            {tab === "photo" ? (
              <PhotoPanel photoUrl={photoUrl} onPick={(file) => void useDesignPhoto(file)} onClear={clearPhoto} onAsk={() => void askPhoto()} />
            ) : null}
            {tab === "ink" ? (
              <InkPanel
                messages={messages}
                busy={busy}
                error={inkError}
                reference={reference}
                onSend={(text, auto, image, label) => void send(text, auto, image, label)}
                onApply={applyMessage}
                onClear={() => setThread([])}
                onClearReference={() => setReference(null)}
                onAttach={setReference}
              />
            ) : null}
            {tab === "saved" ? (
              <div className="flex min-h-0 flex-1 flex-col lg:hidden">
                <SheetLibrary onCreate={noteCap} />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
