import data from "@emoji-mart/data";
import { init, SearchIndex } from "emoji-mart";

init({ data });

// Build shortcode → native emoji lookup from emoji-mart's full dataset
const shortcodeLookup = new Map<string, string>();
for (const [id, emoji] of Object.entries(
  (data as any).emojis as Record<string, { skins: { native: string }[] }>
)) {
  const native = emoji.skins?.[0]?.native;
  if (native) shortcodeLookup.set(id, native);
}

export interface EmojiResult {
  id: string;
  name: string;
  native: string;
}

export async function searchEmojis(
  query: string,
  limit = 8
): Promise<EmojiResult[]> {
  if (!query || query.length < 2) return [];
  const results = await SearchIndex.search(query);
  if (!results) return [];
  return results.slice(0, limit).map((e: any) => ({
    id: e.id,
    name: e.name,
    native: e.skins[0].native,
  }));
}

export function getShortcodeQuery(
  text: string,
  cursorPos: number
): { query: string; start: number } | null {
  const before = text.slice(0, cursorPos);
  const match = before.match(/:([a-z0-9_+-]{2,})$/);
  if (!match) return null;
  return { query: match[1], start: cursorPos - match[0].length };
}

export function tryReplaceShortcodeAtCursor(
  text: string,
  cursorPos: number
): { newText: string; newCursor: number } | null {
  if (text[cursorPos - 1] !== ":") return null;
  const before = text.slice(0, cursorPos);
  const match = before.match(/:([a-z0-9_+-]+):$/);
  if (!match) return null;

  const native = shortcodeLookup.get(match[1]);
  if (!native) return null;

  const newText =
    text.slice(0, cursorPos - match[0].length) + native + text.slice(cursorPos);
  const newCursor = cursorPos - match[0].length + native.length;
  return { newText, newCursor };
}
