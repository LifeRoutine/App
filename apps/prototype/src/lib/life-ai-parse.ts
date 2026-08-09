/** Einfache Einkaufs-Intents aus Freitext (kein LLM). */
export function parseShopAddIntent(raw: string): string[] | null {
  const text = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!text) return null;

  const patterns: RegExp[] = [
    /^(.+?)\s+kaufen\.?$/,
    /^kauf(?:e|t)?\s+(.+)$/,
    /^setz(?:e)?\s+(.+?)\s+auf\s+(?:die\s+)?liste\.?$/,
    /^(.+?)\s+auf\s+(?:die\s+)?(?:einkaufs)?liste\.?$/,
    /^brauch(?:e)?\s+(.+)$/,
    /^noch\s+(.+)\s+holen\.?$/,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const names = splitProductNames(m[1]);
    if (names.length > 0) return names;
  }

  return null;
}

function splitProductNames(chunk: string): string[] {
  const cleaned = chunk
    .replace(/\b(bitte|mal|noch|ein|eine|einen|etwas|mir)\b/g, " ")
    .replace(/[,;]/g, " und ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  return cleaned
    .split(/\s+und\s+|\s*\+\s*/)
    .map((part) => capitalizeProduct(part.trim()))
    .filter((p) => p.length >= 2);
}

function capitalizeProduct(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
