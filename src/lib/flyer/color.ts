export function inkOn(hex: string): string {
  const raw = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#f4efe6";
  const n = Number.parseInt(raw, 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(channels[0]) + 0.7152 * lin(channels[1]) + 0.0722 * lin(channels[2]);
  return L > 0.58 ? "#1a140c" : "#f4efe6";
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return a;
  const ch = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function parse(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const n = Number.parseInt(raw, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
