import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { catalogBrief } from "@/lib/flyer/catalog";

const copySchema = z.object({
  kicker: z.string().max(80),
  headline: z.string().max(120),
  subhead: z.string().max(200),
  date: z.string().max(80),
  place: z.string().max(100),
  price: z.string().max(60),
  body: z.string().max(500),
  cta: z.string().max(80),
  fine: z.string().max(120),
});

const inkInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(8),
  sheet: z.object({
    name: z.string().max(80),
    formatId: z.string().max(40),
    themeId: z.string().max(40),
    layoutId: z.string().max(40),
    fontPairId: z.string().max(40),
    texture: z.string().max(20),
    align: z.enum(["left", "center"]),
    uppercase: z.boolean(),
    headlineScale: z.number().min(0.5).max(1.5),
    copy: copySchema,
    idea: z.string().max(4000),
  }),
  referenceImage: z.string().max(450_000).optional(),
});

export type InkResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

const hits: number[] = [];

function allowCall(): boolean {
  const now = Date.now();
  while (hits.length > 0 && now - hits[0] > 60_000) hits.shift();
  if (hits.length >= 10) return false;
  hits.push(now);
  return true;
}

function textFrom(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    })
    .join("");
}

const SYSTEM = `You are Ink, the press assistant inside Flyer Forge. You turn rough notes into flyer copy and choose a format, theme, layout, and font pairing.
Write like a good poster: short, specific, no emoji, no hashtags, no filler.
Keep every fact the user gave. Do not invent addresses, prices, dates, ages, or venues. If a fact is missing, leave that field unchanged.
Reply in 1 to 3 sentences about the choice. If you are changing the flyer, end with one fenced json block and nothing after it.
Include only keys that should change. copy fields: kicker, headline, subhead, date, place, price, body, cta, fine.
Also allowed: themeId, layoutId, formatId, fontPairId, name, texture, align, uppercase, headlineScale (0.75 to 1.25).
headline may contain one newline as \\n and is at most 6 words. kicker is at most 4 words. body is at most two sentences. cta is 2 to 5 words.
When the user asks for a mood or a style, change the theme, layout, font pairing, and texture to match, then rewrite the copy in that voice.
If the user is only asking a question, skip the json.
${catalogBrief()}`;

type ChatContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

async function complete(apiKey: string, messages: { role: string; content: ChatContent }[]): Promise<Response> {
  return fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(28_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.4,
      max_tokens: 700,
      reasoning_effort: "low",
      messages,
    }),
  });
}

export const askInk = createServerFn({ method: "POST" })
  .validator((input: unknown) => inkInput.parse(input))
  .handler(async ({ data }): Promise<InkResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Ink is not available in this preview." };
    if (!allowCall()) return { ok: false, error: "Ink needs a minute. Try again shortly." };

    const image = data.referenceImage;
    if (image && !/^data:image\/(jpeg|png);base64,[a-z0-9+/=\s]+$/i.test(image)) {
      return { ok: false, error: "That reference image could not be read." };
    }

    const history = data.messages.map((message, index) => {
      const isLast = index === data.messages.length - 1;
      if (isLast && message.role === "user" && image) {
        return {
          role: message.role,
          content: [
            { type: "text" as const, text: message.content },
            { type: "image_url" as const, image_url: { url: image } },
          ],
        };
      }
      return { role: message.role, content: message.content };
    });

    const messages = [
      { role: "system", content: SYSTEM },
      { role: "system", content: `Current sheet:\n${JSON.stringify(data.sheet)}` },
      ...history,
    ];

    try {
      let response = await complete(apiKey, messages);
      if (response.status === 400) {
        response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(28_000),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            temperature: 0.4,
            max_tokens: 700,
            messages,
          }),
        });
      }
      if (response.status >= 500 && response.status <= 503) {
        response = await complete(apiKey, messages);
      }
      if (!response.ok) {
        const busy = response.status === 429;
        return {
          ok: false,
          error: busy ? "Ink is busy. Try again in a minute." : `Ink could not answer (${response.status}).`,
        };
      }
      const body = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const text = textFrom(body.choices?.[0]?.message?.content).trim().slice(0, 4000);
      if (!text) return { ok: false, error: "Ink came back empty. Try the line again." };
      return { ok: true, text };
    } catch {
      return { ok: false, error: "Ink could not be reached. Check the sheet and try again." };
    }
  });
