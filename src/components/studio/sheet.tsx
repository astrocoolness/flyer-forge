import { type CSSProperties, type ReactElement, type Ref } from "react";
import { getFontPair, getFormat, type FontPair } from "@/lib/flyer/catalog";
import type { FlyerDoc } from "@/lib/flyer/types";

const GRAIN = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
);
const XEROX = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="1.35" numOctaves="1" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
);

type Frame = {
  w: number;
  h: number;
  pad: number;
  compact: boolean;
  tiny: boolean;
  wide: boolean;
};

type RenderProps = {
  doc: FlyerDoc;
  fonts: FontPair;
  photoUrl: string | null;
  frame: Frame;
};

function displayFace(fonts: FontPair) {
  return `"${fonts.display}", ${fonts.displayFallback}`;
}

function bodyFace(fonts: FontPair) {
  return `"${fonts.body}", ${fonts.bodyFallback}`;
}

function headlineSize(text: string, width: number, frame: Frame, fonts: FontPair, scale: number) {
  const longest = Math.max(1, ...text.split("\n").map((line) => Math.max(1, line.trim().length)));
  const capFactor = frame.tiny ? 0.16 : frame.compact ? 0.18 : 0.2;
  const cap = width * capFactor;
  const floor = Math.max(14, width * 0.06);
  const byWidth = (width * 0.98) / (longest * fonts.em);
  return Math.round(Math.max(floor, Math.min(cap, byWidth)) * scale);
}

function photoPosition(pos: FlyerDoc["photoPos"]) {
  if (pos === "top") return "center 18%";
  if (pos === "bottom") return "center 82%";
  return "center";
}

function Bleed({
  url,
  pos,
  dim,
  scrim,
  gradient,
}: {
  url: string;
  pos: FlyerDoc["photoPos"];
  dim: number;
  scrim: string;
  gradient?: boolean;
}) {
  return (
    <>
      <img
        alt=""
        src={url}
        decoding="async"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: photoPosition(pos),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: gradient ? `linear-gradient(180deg, ${scrim}66 0%, ${scrim} 82%)` : scrim,
          opacity: gradient ? 1 : Math.min(0.86, Math.max(0, dim / 100)),
        }}
      />
    </>
  );
}

function InsetPhoto({ url, pos, style }: { url: string; pos: FlyerDoc["photoPos"]; style: CSSProperties }) {
  return (
    <img
      alt=""
      src={url}
      decoding="async"
      style={{ display: "block", objectFit: "cover", objectPosition: photoPosition(pos), ...style }}
    />
  );
}

function Kicker({
  doc,
  fonts,
  width,
  color,
}: {
  doc: FlyerDoc;
  fonts: FontPair;
  width: number;
  color?: string;
}) {
  if (!doc.copy.kicker.trim()) return null;
  return (
    <p
      style={{
        margin: 0,
        fontFamily: bodyFace(fonts),
        fontSize: Math.max(11, width * 0.034),
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: color ?? doc.colors.mute,
        textAlign: doc.align,
      }}
    >
      {doc.copy.kicker}
    </p>
  );
}

function Headline({
  doc,
  fonts,
  width,
  frame,
  color,
}: {
  doc: FlyerDoc;
  fonts: FontPair;
  width: number;
  frame: Frame;
  color?: string;
}) {
  const raw = doc.copy.headline.trim();
  const text = raw || "Headline";
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: displayFace(fonts),
        fontSize: headlineSize(text, width, frame, fonts, doc.headlineScale),
        lineHeight: fonts.leading,
        letterSpacing: `${fonts.track}em`,
        fontWeight: 700,
        textTransform: doc.uppercase ? "uppercase" : "none",
        textAlign: doc.align,
        whiteSpace: "pre-line",
        color: color ?? doc.colors.ink,
        opacity: raw ? 1 : 0.38,
        maxWidth: "100%",
        overflowWrap: "anywhere",
      }}
    >
      {text}
    </h1>
  );
}

function Subhead({ doc, fonts, width, color }: { doc: FlyerDoc; fonts: FontPair; width: number; color?: string }) {
  if (!doc.copy.subhead.trim()) return null;
  return (
    <p
      style={{
        margin: `${Math.round(width * 0.03)}px 0 0`,
        fontFamily: bodyFace(fonts),
        fontSize: Math.max(13, width * 0.042),
        lineHeight: 1.3,
        fontWeight: 500,
        textAlign: doc.align,
        color: color ?? doc.colors.ink,
      }}
    >
      {doc.copy.subhead}
    </p>
  );
}

function Body({
  doc,
  fonts,
  width,
  lines,
  color,
}: {
  doc: FlyerDoc;
  fonts: FontPair;
  width: number;
  lines: number;
  color?: string;
}) {
  if (!doc.copy.body.trim()) return null;
  return (
    <p
      style={{
        margin: `${Math.round(width * 0.04)}px 0 0`,
        fontFamily: bodyFace(fonts),
        fontSize: Math.max(12, width * 0.034),
        lineHeight: 1.4,
        textAlign: doc.align,
        color: color ?? doc.colors.ink,
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {doc.copy.body}
    </p>
  );
}

function Meta({
  doc,
  fonts,
  width,
  skip,
  color,
}: {
  doc: FlyerDoc;
  fonts: FontPair;
  width: number;
  skip?: Array<"date" | "place" | "price">;
  color?: string;
}) {
  const items = (
    [
      ["date", doc.copy.date],
      ["place", doc.copy.place],
      ["price", doc.copy.price],
    ] as const
  ).filter(([key, value]) => value.trim() && !skip?.includes(key));
  if (!items.length) return null;
  return (
    <div
      style={{
        marginTop: Math.round(width * 0.045),
        display: "flex",
        flexWrap: "wrap",
        justifyContent: doc.align === "center" ? "center" : "flex-start",
        gap: "0.35em 0.9em",
        fontFamily: bodyFace(fonts),
        fontSize: Math.max(11, width * 0.03),
        fontWeight: 650,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: color ?? doc.colors.ink,
      }}
    >
      {items.map(([key, value]) => (
        <span key={key}>{value}</span>
      ))}
    </div>
  );
}

function Cta({ doc, fonts, width }: { doc: FlyerDoc; fonts: FontPair; width: number }) {
  if (!doc.copy.cta.trim()) return null;
  return (
    <span
      style={{
        display: "inline-block",
        marginTop: Math.round(width * 0.045),
        background: doc.colors.accent,
        color: doc.colors.onAccent,
        fontFamily: bodyFace(fonts),
        fontWeight: 700,
        fontSize: Math.max(12, width * 0.032),
        letterSpacing: "0.04em",
        lineHeight: 1,
        padding: `${Math.round(width * 0.028)}px ${Math.round(width * 0.05)}px`,
      }}
    >
      {doc.copy.cta}
    </span>
  );
}

function Fine({ doc, fonts, width, color }: { doc: FlyerDoc; fonts: FontPair; width: number; color?: string }) {
  if (!doc.copy.fine.trim()) return null;
  return (
    <p
      style={{
        margin: `${Math.round(width * 0.03)}px 0 0`,
        fontFamily: bodyFace(fonts),
        fontSize: Math.max(10, width * 0.024),
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        textAlign: doc.align,
        color: color ?? doc.colors.mute,
      }}
    >
      {doc.copy.fine}
    </p>
  );
}

function Slam({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 2;
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: frame.pad }}>
      {bleed ? (
        <Bleed url={photoUrl} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} gradient />
      ) : null}
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 12 }}>
        <Kicker doc={doc} fonts={fonts} width={width} />
        {doc.copy.price.trim() ? (
          <span
            style={{
              flex: "none",
              background: doc.colors.accent,
              color: doc.colors.onAccent,
              fontFamily: bodyFace(fonts),
              fontWeight: 700,
              fontSize: Math.max(12, width * 0.03),
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "0.4em 0.6em",
            }}
          >
            {doc.copy.price}
          </span>
        ) : null}
      </div>
      <div style={{ position: "relative", marginTop: "auto" }}>
        {inset ? (
          <InsetPhoto
            url={photoUrl}
            pos={doc.photoPos}
            style={{
              width: frame.wide ? "38%" : "70%",
              height: frame.tiny ? frame.h * 0.22 : frame.h * 0.24,
              marginBottom: frame.pad * 0.6,
              marginLeft: doc.align === "center" ? "auto" : 0,
              marginRight: doc.align === "center" ? "auto" : undefined,
            }}
          />
        ) : null}
        <div
          style={{
            width: Math.round(frame.w * 0.16),
            height: Math.max(6, frame.w * 0.012),
            background: doc.colors.accent,
            marginBottom: frame.pad * 0.45,
            marginLeft: doc.align === "center" ? "auto" : 0,
            marginRight: doc.align === "center" ? "auto" : undefined,
          }}
        />
        <Headline doc={doc} fonts={fonts} width={width} frame={frame} />
        <Subhead doc={doc} fonts={fonts} width={width} />
        <Meta doc={doc} fonts={fonts} width={width} skip={["price"]} />
        <div
          style={{
            display: "flex",
            justifyContent: doc.align === "center" ? "center" : "space-between",
            alignItems: "flex-end",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Cta doc={doc} fonts={fonts} width={width} />
          <Fine doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
    </div>
  );
}

function Split({ doc, fonts, photoUrl, frame }: RenderProps) {
  const photo = doc.photoRole !== "off" ? photoUrl : null;
  if (!frame.wide) {
    const width = frame.w - frame.pad * 2;
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", height: "36%", background: doc.colors.accent, overflow: "hidden" }}>
          {photo ? (
            <img
              alt=""
              src={photo}
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: photoPosition(doc.photoPos) }}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                padding: frame.pad,
                color: doc.colors.onAccent,
                fontFamily: displayFace(fonts),
                fontSize: frame.w * 0.12,
                lineHeight: 0.9,
              }}
            >
              {doc.copy.price || doc.copy.date}
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            background: doc.colors.paper,
            color: doc.colors.ink,
            padding: frame.pad,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Kicker doc={doc} fonts={fonts} width={width} color={doc.colors.mute} />
          <Headline doc={doc} fonts={fonts} width={width} frame={frame} color={doc.colors.ink} />
          <Subhead doc={doc} fonts={fonts} width={width} />
          {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width} lines={3} /> : null}
          <Cta doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
    );
  }

  const side = Math.round(frame.w * 0.42);
  const width = frame.w - side - frame.pad * 2;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      <div style={{ width: side, position: "relative", background: doc.colors.accent, color: doc.colors.onAccent, overflow: "hidden" }}>
        {photo ? (
          <img
            alt=""
            src={photo}
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: photoPosition(doc.photoPos) }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, padding: frame.pad, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <span style={{ fontFamily: bodyFace(fonts), letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, fontSize: Math.max(12, side * 0.045) }}>
              {doc.copy.date}
            </span>
            <span style={{ fontFamily: displayFace(fonts), fontSize: side * (frame.compact ? 0.14 : 0.16), lineHeight: 0.9 }}>
              {doc.copy.price || doc.copy.place}
            </span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, background: doc.colors.paper, color: doc.colors.ink, padding: frame.pad, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Kicker doc={doc} fonts={fonts} width={width} />
        <Headline doc={doc} fonts={fonts} width={width} frame={frame} />
        <Subhead doc={doc} fonts={fonts} width={width} />
        {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width} lines={frame.compact ? 3 : 5} /> : null}
        <Meta doc={doc} fonts={fonts} width={width} skip={photo ? [] : ["date", "price"]} />
        <Cta doc={doc} fonts={fonts} width={width} />
        <Fine doc={doc} fonts={fonts} width={width} />
      </div>
    </div>
  );
}

function Ticket({ doc, fonts, photoUrl, frame }: RenderProps) {
  const margin = Math.round(frame.w * 0.055);
  const width = frame.w - margin * 2 - frame.pad * 2;
  const photo = doc.photoRole !== "off" ? photoUrl : null;
  return (
    <div style={{ position: "absolute", inset: margin, border: `2px solid ${doc.colors.ink}`, display: "flex", flexDirection: "column", background: doc.colors.bg }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          background: doc.colors.accent,
          color: doc.colors.onAccent,
          padding: `${frame.pad * 0.45}px ${frame.pad}px`,
          fontFamily: bodyFace(fonts),
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontSize: Math.max(11, width * 0.032),
        }}
      >
        <span>{doc.copy.kicker || "Ticket"}</span>
        <span>Admit one</span>
      </div>
      {photo ? (
        <img
          alt=""
          src={photo}
          decoding="async"
          style={{ width: "100%", height: frame.tiny ? "18%" : "24%", objectFit: "cover", objectPosition: photoPosition(doc.photoPos) }}
        />
      ) : null}
      <div style={{ flex: 1, padding: frame.pad, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Headline doc={doc} fonts={fonts} width={width} frame={frame} />
        <Subhead doc={doc} fonts={fonts} width={width} />
        <div style={{ height: 0, borderTop: `1px dashed ${doc.colors.ink}`, opacity: 0.45, margin: `${frame.pad * 0.55}px 0` }} />
        <Meta doc={doc} fonts={fonts} width={width} />
        {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width} lines={frame.compact ? 2 : 4} /> : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <Cta doc={doc} fonts={fonts} width={width} />
          <Fine doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
    </div>
  );
}

function Editorial({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 2;
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  const mark = Math.round(frame.w * 0.035);
  const arm = Math.round(frame.w * 0.045);
  return (
    <div style={{ position: "absolute", inset: 0, padding: frame.pad }}>
      {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={Math.max(doc.photoDim, 62)} scrim={doc.colors.bg} /> : null}
      <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {[
          [mark, mark, arm, 0, 0, arm],
          [frame.w - mark, mark, -arm, 0, 0, arm],
          [mark, frame.h - mark, arm, 0, 0, -arm],
          [frame.w - mark, frame.h - mark, -arm, 0, 0, -arm],
        ].map(([x, y, dx, dy, ex, ey], index) => (
          <path key={index} d={`M ${x + dx} ${y + dy} H ${x} V ${y + ey}`} stroke={doc.colors.accent} strokeWidth="1.5" fill="none" />
        ))}
      </svg>
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <Kicker doc={doc} fonts={fonts} width={width * 0.6} />
          {inset ? (
            <InsetPhoto
              url={photoUrl}
              pos={doc.photoPos}
              style={{ width: frame.wide ? "28%" : "34%", height: frame.tiny ? frame.h * 0.2 : frame.h * 0.18 }}
            />
          ) : (
            <span style={{ fontFamily: bodyFace(fonts), fontSize: Math.max(11, width * 0.028), letterSpacing: "0.12em", textTransform: "uppercase", color: doc.colors.mute }}>
              {doc.copy.date}
            </span>
          )}
        </div>
        <div style={{ marginTop: frame.tiny ? frame.pad * 0.4 : frame.pad }}>
          <Headline doc={doc} fonts={fonts} width={inset && frame.wide ? width * 0.7 : width} frame={frame} />
          <Subhead doc={doc} fonts={fonts} width={width} />
        </div>
        <div style={{ height: 1, background: doc.colors.accent, margin: `${frame.pad * 0.7}px 0`, opacity: 0.9 }} />
        <div style={{ display: "flex", flexDirection: frame.wide && !frame.tiny ? "row" : "column", gap: frame.pad, marginTop: "auto" }}>
          <div style={{ flex: 1.4 }}>
            {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width} lines={frame.compact ? 3 : 5} /> : null}
            <Cta doc={doc} fonts={fonts} width={width} />
          </div>
          <div style={{ flex: 0.9 }}>
            <Meta doc={doc} fonts={fonts} width={width * 0.7} skip={inset ? [] : ["date"]} />
            <Fine doc={doc} fonts={fonts} width={width * 0.7} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stage({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 2;
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: frame.pad }}>
      {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} gradient /> : null}
      <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {inset ? (
          <InsetPhoto
            url={photoUrl}
            pos={doc.photoPos}
            style={{ width: frame.wide ? "42%" : "68%", height: frame.h * (frame.tiny ? 0.24 : 0.28), marginBottom: frame.pad * 0.7 }}
          />
        ) : null}
        <Kicker doc={doc} fonts={fonts} width={width} />
        <Headline doc={doc} fonts={fonts} width={width * 0.94} frame={frame} />
        <Subhead doc={doc} fonts={fonts} width={width * 0.86} />
        <Meta doc={doc} fonts={fonts} width={width} />
        <Cta doc={doc} fonts={fonts} width={width} />
        <Fine doc={doc} fonts={fonts} width={width} />
      </div>
    </div>
  );
}

function Stack({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 2;
  const photo = doc.photoRole !== "off" ? photoUrl : null;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: doc.colors.accent,
          color: doc.colors.onAccent,
          padding: `${frame.pad * 0.7}px ${frame.pad}px`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 12,
          fontFamily: bodyFace(fonts),
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
          fontSize: Math.max(12, width * 0.032),
        }}
      >
        <span>{doc.copy.kicker}</span>
        <span>{doc.copy.date}</span>
      </div>
      <div style={{ position: "relative", flex: 1, background: doc.colors.bg, padding: frame.pad, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {photo && doc.photoRole === "background" ? (
          <Bleed url={photo} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} />
        ) : null}
        {photo && doc.photoRole === "inset" ? (
          <InsetPhoto
            url={photo}
            pos={doc.photoPos}
            style={{
              position: "absolute",
              top: frame.pad * 0.6,
              right: frame.pad,
              width: frame.wide ? "30%" : "42%",
              height: "58%",
            }}
          />
        ) : null}
        <div style={{ position: "relative", maxWidth: photo && doc.photoRole === "inset" && frame.wide ? "64%" : "100%" }}>
          <Headline doc={doc} fonts={fonts} width={photo && doc.photoRole === "inset" && frame.wide ? width * 0.62 : width} frame={frame} />
          <Subhead doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
      <div style={{ background: doc.colors.paper, color: doc.colors.ink, padding: frame.pad }}>
        {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width} lines={frame.compact ? 2 : 3} /> : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: bodyFace(fonts), fontSize: Math.max(12, width * 0.03), letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>
            <div>{doc.copy.place}</div>
            <div>{doc.copy.price}</div>
          </div>
          <Cta doc={doc} fonts={fonts} width={width} />
        </div>
        <Fine doc={doc} fonts={fonts} width={width} />
      </div>
    </div>
  );
}

function Badge({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 2;
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  const medallion = (doc.copy.date || doc.copy.price || "Date").trim();
  const size = Math.round(frame.w * (frame.wide ? 0.26 : 0.32));
  const medallionType = Math.max(12, size * (medallion.length > 18 ? 0.1 : medallion.length > 12 ? 0.12 : 0.16));
  return (
    <div style={{ position: "absolute", inset: 0, padding: frame.pad }}>
      {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} gradient /> : null}
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: doc.align === "center" ? "center" : "flex-end" }}>
          <div
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: doc.colors.accent,
              color: doc.colors.onAccent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: size * 0.14,
              fontFamily: displayFace(fonts),
              fontSize: medallionType,
              lineHeight: 0.95,
            }}
          >
            {medallion}
          </div>
        </div>
        {inset ? (
          <InsetPhoto
            url={photoUrl}
            pos={doc.photoPos}
            style={{ width: "100%", height: frame.h * (frame.tiny ? 0.18 : 0.22), marginTop: frame.pad * 0.5 }}
          />
        ) : null}
        <div style={{ marginTop: "auto" }}>
          <Kicker doc={doc} fonts={fonts} width={width} />
          <Headline doc={doc} fonts={fonts} width={width} frame={frame} />
          <Subhead doc={doc} fonts={fonts} width={width} />
          {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width} lines={2} /> : null}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: bodyFace(fonts), fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: Math.max(12, width * 0.03) }}>
              {[doc.copy.place, doc.copy.price].filter((item) => item.trim()).join("  ·  ")}
            </span>
            <Cta doc={doc} fonts={fonts} width={width} />
          </div>
          <Fine doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
    </div>
  );
}

function Marquee({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 4;
  const phrase = `${(doc.copy.kicker || "Flyer").trim()}   ·   `;
  const line = phrase.repeat(14);
  const edge = Math.max(22, Math.round(frame.w * 0.055));
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  const edgeStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    fontFamily: bodyFace(fonts),
    fontSize: Math.max(11, frame.w * 0.022),
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: doc.colors.accent,
    fontWeight: 700,
  };
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} gradient /> : null}
      <div style={{ ...edgeStyle, top: frame.pad * 0.35 }}>{line}</div>
      <div style={{ ...edgeStyle, bottom: frame.pad * 0.35 }}>{line}</div>
      <div
        style={{
          position: "absolute",
          left: edge,
          right: edge,
          top: edge,
          bottom: edge,
          border: `1px solid ${doc.colors.accent}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: frame.pad * 0.6,
        }}
      >
        {inset ? (
          <InsetPhoto
            url={photoUrl}
            pos={doc.photoPos}
            style={{ width: frame.wide ? "36%" : "58%", height: frame.h * 0.22, marginBottom: frame.pad * 0.45 }}
          />
        ) : null}
        <Headline doc={doc} fonts={fonts} width={width} frame={frame} />
        <Subhead doc={doc} fonts={fonts} width={width * 0.9} />
        <Meta doc={doc} fonts={fonts} width={width} />
        <Cta doc={doc} fonts={fonts} width={width} />
        <Fine doc={doc} fonts={fonts} width={width} />
      </div>
    </div>
  );
}

function Poster({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 2;
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  const facts = [doc.copy.date, doc.copy.place, doc.copy.price].filter((item) => item.trim());
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: frame.pad,
        }}
      >
        {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} gradient /> : null}
        <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {inset ? (
            <InsetPhoto
              url={photoUrl}
              pos={doc.photoPos}
              style={{ width: frame.wide ? "46%" : "72%", height: frame.h * 0.22, marginBottom: frame.pad * 0.5 }}
            />
          ) : null}
          <Kicker doc={doc} fonts={fonts} width={width} />
          <Headline doc={doc} fonts={fonts} width={width * 0.94} frame={frame} />
          <Subhead doc={doc} fonts={fonts} width={width * 0.82} />
          {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width * 0.78} lines={2} /> : null}
        </div>
      </div>
      {facts.length ? (
        <div
          style={{
            position: "relative",
            background: doc.colors.accent,
            color: doc.colors.onAccent,
            padding: `${frame.pad * 0.55}px ${frame.pad}px`,
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.35em 1.1em",
            fontFamily: bodyFace(fonts),
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: Math.max(11, width * 0.028),
          }}
        >
          {facts.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Rail({ doc, fonts, photoUrl, frame }: RenderProps) {
  const rail = Math.round(frame.w * (frame.wide ? 0.14 : 0.18));
  const width = frame.w - rail - frame.pad * 2;
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  const spine = [doc.copy.date, doc.copy.place].filter((item) => item.trim()).join("   ·   ") || doc.copy.kicker;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      <div
        style={{
          width: rail,
          flex: "none",
          background: doc.colors.accent,
          color: doc.colors.onAccent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          writingMode: "vertical-rl",
          fontFamily: bodyFace(fonts),
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontSize: Math.max(11, rail * 0.22),
          padding: frame.pad * 0.4,
        }}
      >
        {spine}
      </div>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", padding: frame.pad }}>
        {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} gradient /> : null}
        <div style={{ position: "relative" }}>
          <Kicker doc={doc} fonts={fonts} width={width} />
        </div>
        <div style={{ position: "relative", marginTop: "auto" }}>
          {inset ? (
            <InsetPhoto
              url={photoUrl}
              pos={doc.photoPos}
              style={{ width: "100%", height: frame.h * 0.2, marginBottom: frame.pad * 0.45 }}
            />
          ) : null}
          <Headline doc={doc} fonts={fonts} width={width} frame={frame} />
          <Subhead doc={doc} fonts={fonts} width={width} />
          {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width} lines={frame.compact ? 2 : 4} /> : null}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: bodyFace(fonts), fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: Math.max(12, width * 0.03) }}>
              {doc.copy.price}
            </span>
            <Cta doc={doc} fonts={fonts} width={width} />
          </div>
          <Fine doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
    </div>
  );
}

function Columns({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 2;
  const stacked = frame.tiny || frame.compact;
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: frame.pad }}>
      {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={Math.max(doc.photoDim, 55)} scrim={doc.colors.bg} /> : null}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <Kicker doc={doc} fonts={fonts} width={width * 0.7} />
          {inset ? (
            <InsetPhoto url={photoUrl} pos={doc.photoPos} style={{ width: "28%", height: frame.h * 0.16 }} />
          ) : null}
        </div>
        <Headline doc={doc} fonts={fonts} width={width} frame={frame} />
        <Subhead doc={doc} fonts={fonts} width={width} />
      </div>
      <div style={{ position: "relative", height: 1, background: doc.colors.accent, margin: `${frame.pad * 0.55}px 0` }} />
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: stacked ? "column" : "row", gap: frame.pad * 0.8 }}>
        <div style={{ flex: 1.35 }}>
          {!frame.tiny ? <Body doc={doc} fonts={fonts} width={stacked ? width : width * 0.58} lines={stacked ? 3 : 7} /> : null}
        </div>
        <div
          style={{
            flex: 0.8,
            borderLeft: stacked ? "none" : `1px solid ${doc.colors.mute}`,
            paddingLeft: stacked ? 0 : frame.pad * 0.6,
          }}
        >
          <Meta doc={doc} fonts={fonts} width={stacked ? width : width * 0.36} />
          <Cta doc={doc} fonts={fonts} width={width} />
          <Fine doc={doc} fonts={fonts} width={stacked ? width : width * 0.36} />
        </div>
      </div>
    </div>
  );
}

function FrameLayout({ doc, fonts, photoUrl, frame }: RenderProps) {
  const inset = Math.round(frame.w * (frame.tiny ? 0.04 : 0.05));
  const inner = Math.round(frame.w * 0.018);
  const width = frame.w - inset * 2 - frame.pad * 2;
  const bleed = doc.photoRole === "background" && photoUrl;
  const insetPhoto = doc.photoRole === "inset" && photoUrl;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} gradient /> : null}
      <div style={{ position: "absolute", inset, border: `${Math.max(2, inner)}px solid ${doc.colors.ink}` }}>
        <div style={{ position: "absolute", inset: inner * 1.6, border: `1px solid ${doc.colors.accent}` }} />
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: frame.pad * 0.7,
          }}
        >
          {insetPhoto ? (
            <InsetPhoto
              url={photoUrl}
              pos={doc.photoPos}
              style={{ width: frame.wide ? "40%" : "64%", height: frame.h * 0.2, marginBottom: frame.pad * 0.4 }}
            />
          ) : null}
          <Kicker doc={doc} fonts={fonts} width={width} />
          <Headline doc={doc} fonts={fonts} width={width * 0.9} frame={frame} />
          <Subhead doc={doc} fonts={fonts} width={width * 0.82} />
          <Meta doc={doc} fonts={fonts} width={width} />
          <Cta doc={doc} fonts={fonts} width={width} />
          <Fine doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
    </div>
  );
}

function Ribbon({ doc, fonts, photoUrl, frame }: RenderProps) {
  const width = frame.w - frame.pad * 2;
  const bleed = doc.photoRole === "background" && photoUrl;
  const inset = doc.photoRole === "inset" && photoUrl;
  const facts = [doc.copy.date, doc.copy.place, doc.copy.price].filter((item) => item.trim());
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1.15, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: frame.pad }}>
        {bleed ? <Bleed url={photoUrl} pos={doc.photoPos} dim={doc.photoDim} scrim={doc.colors.bg} gradient /> : null}
        <div style={{ position: "relative" }}>
          {inset ? (
            <InsetPhoto
              url={photoUrl}
              pos={doc.photoPos}
              style={{
                width: frame.wide ? "28%" : "42%",
                height: frame.h * 0.18,
                marginBottom: frame.pad * 0.4,
                marginLeft: doc.align === "center" ? "auto" : 0,
                marginRight: doc.align === "center" ? "auto" : undefined,
              }}
            />
          ) : null}
          <Kicker doc={doc} fonts={fonts} width={width} />
          <Headline doc={doc} fonts={fonts} width={width} frame={frame} />
          <Subhead doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
      <div
        style={{
          background: doc.colors.accent,
          color: doc.colors.onAccent,
          textAlign: "center",
          padding: `${frame.pad * 0.45}px ${frame.pad}px`,
          fontFamily: displayFace(fonts),
          fontSize: Math.max(16, width * (frame.wide ? 0.045 : 0.055)),
          letterSpacing: "0.04em",
          lineHeight: 1.15,
        }}
      >
        {facts.join("   ·   ") || doc.copy.kicker}
      </div>
      <div style={{ background: doc.colors.paper, color: doc.colors.ink, padding: frame.pad }}>
        {!frame.tiny ? <Body doc={doc} fonts={fonts} width={width} lines={frame.compact ? 2 : 3} color={doc.colors.ink} /> : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <Fine doc={doc} fonts={fonts} width={width * 0.6} color={doc.colors.mute} />
          <Cta doc={doc} fonts={fonts} width={width} />
        </div>
      </div>
    </div>
  );
}

const LAYOUTS: Record<string, (props: RenderProps) => ReactElement> = {
  slam: Slam,
  split: Split,
  ticket: Ticket,
  editorial: Editorial,
  stage: Stage,
  stack: Stack,
  badge: Badge,
  marquee: Marquee,
  poster: Poster,
  rail: Rail,
  columns: Columns,
  frame: FrameLayout,
  ribbon: Ribbon,
};

function Texture({ doc }: { doc: FlyerDoc }) {
  if (doc.texture === "clean") return null;
  const common: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4 };
  if (doc.texture === "grain") {
    return (
      <div
        style={{
          ...common,
          opacity: 0.18,
          mixBlendMode: "multiply",
          backgroundImage: `url("data:image/svg+xml;utf8,${GRAIN}")`,
          backgroundSize: "180px 180px",
        }}
      />
    );
  }
  if (doc.texture === "halftone") {
    return (
      <div
        style={{
          ...common,
          opacity: 0.16,
          backgroundImage: `radial-gradient(${doc.colors.ink} 0.7px, transparent 0.85px)`,
          backgroundSize: "7px 7px",
        }}
      />
    );
  }
  if (doc.texture === "speckle") {
    return (
      <div
        style={{
          ...common,
          opacity: 0.28,
          backgroundImage: `radial-gradient(${doc.colors.ink} 1.15px, transparent 1.35px), radial-gradient(${doc.colors.ink} 0.55px, transparent 0.75px)`,
          backgroundSize: "19px 19px, 9px 11px",
          backgroundPosition: "0 0, 5px 7px",
        }}
      />
    );
  }
  if (doc.texture === "stripes") {
    return (
      <div
        style={{
          ...common,
          opacity: 0.14,
          backgroundImage: `repeating-linear-gradient(112deg, ${doc.colors.ink} 0 2px, transparent 2px 16px)`,
        }}
      />
    );
  }
  if (doc.texture === "xerox") {
    return (
      <div
        style={{
          ...common,
          opacity: 0.34,
          mixBlendMode: "multiply",
          backgroundImage: `url("data:image/svg+xml;utf8,${XEROX}")`,
          backgroundSize: "130px 130px",
        }}
      />
    );
  }
  return (
    <div
      style={{
        ...common,
        opacity: 0.08,
        backgroundImage: `repeating-linear-gradient(-16deg, transparent, transparent 11px, ${doc.colors.ink} 11px, ${doc.colors.ink} 12px)`,
      }}
    />
  );
}

export function FlyerSheet({
  doc,
  photoUrl,
  guides,
  sheetRef,
}: {
  doc: FlyerDoc;
  photoUrl: string | null;
  guides: boolean;
  sheetRef?: Ref<HTMLElement>;
}) {
  const format = getFormat(doc.formatId);
  const fonts = getFontPair(doc.fontPairId);
  const frame: Frame = {
    w: format.w,
    h: format.h,
    pad: Math.round(format.w * (format.h < 460 ? 0.05 : 0.065)),
    compact: format.h < 620,
    tiny: format.h < 460,
    wide: format.w / format.h > 1.02,
  };
  const Layout = LAYOUTS[doc.layoutId] ?? Slam;
  return (
    <article
      ref={sheetRef}
      aria-label={`${doc.name} flyer preview`}
      className="sheet-shadow"
      style={{
        width: format.w,
        height: format.h,
        position: "relative",
        overflow: "hidden",
        background: doc.colors.bg,
        color: doc.colors.ink,
      }}
    >
      <Layout doc={doc} fonts={fonts} photoUrl={photoUrl} frame={frame} />
      <Texture doc={doc} />
      {guides ? (
        <div
          data-export="skip"
          style={{
            position: "absolute",
            inset: "5%",
            border: `1px dashed ${doc.colors.accent}`,
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      ) : null}
    </article>
  );
}
