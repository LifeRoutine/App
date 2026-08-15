export type ReceiptLine = {
  id: string;
  name: string;
  qty: string;
  price?: string;
  selected: boolean;
};

const SKIP =
  /^(summe|gesamt|total|zwischensumme|mwst|ust|eur|€|karte|ec|visa|mastercard|bar|wechselgeld|bedankt|vielen dank|telefon|uid|steuernr|filiale|bon|beleg|kasse|datum|uhrzeit|opening|öffnungs|www\.|http|rewe|aldi|lidl|edeka|netto|dm |rossmann|payback)/i;

/** Spielzeug/Merch — gehört nicht in den Lebensmittel-Vorrat. */
const NOT_GROCERY =
  /\b(pokemon|pokémon|vinyl|plush|plüsch|lego|disney|hasbro|figur|figure|figures|spielzeug|console|nintendo|xbox|playstation)\b/i;

const PRICE_AT_END = /(.+?)\s+(\d{1,3}[.,]\d{2})\s*(€|eur)?\s*$/i;
const QTY_IN_NAME = /\b(\d+[.,]?\d*)\s*(kg|g|l|ml|st|stk|x|×)\b/i;

export const demoReceiptLines: Omit<ReceiptLine, "selected">[] = [
  { id: "rl1", name: "Milch 1,5%", qty: "1 L", price: "1,19 €" },
  { id: "rl2", name: "Butter", qty: "250 g", price: "2,49 €" },
  { id: "rl3", name: "Vollkornbrot", qty: "1×", price: "2,29 €" },
  { id: "rl4", name: "Bananen", qty: "6 St.", price: "1,89 €" },
  { id: "rl5", name: "Spülmittel", qty: "1×", price: "1,59 €" },
];

export function createDemoReceiptLines(): ReceiptLine[] {
  return demoReceiptLines.map((l) => ({ ...l, selected: true }));
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s{2,}/g, " ")
    .replace(/^[\d\W]+/, "")
    .trim();
}

/** OCR-Müll: Unterstriche, kaum Buchstaben, kaputte Preise im Namen. */
function looksLikeOcrJunk(name: string): boolean {
  if (NOT_GROCERY.test(name)) return true;
  if (/_{2,}/.test(name) || /x_{2,}/i.test(name)) return true;
  if (/%0|,%0|___/.test(name)) return true;
  const letters = (name.match(/[a-zäöüA-ZÄÖÜ]/g) ?? []).length;
  const weird = (name.match(/[^a-zäöüA-ZÄÖÜ0-9\s\-.,%/+]/g) ?? []).length;
  if (letters < 3) return true;
  if (weird >= 3 && weird >= letters / 2) return true;
  if (name.length > 42) return true;
  return false;
}

function extractQty(name: string): { name: string; qty: string } {
  const m = name.match(QTY_IN_NAME);
  if (!m) return { name, qty: "1×" };
  const qty = `${m[1].replace(".", ",")} ${m[2]}`.replace(/\bx\b/i, "×");
  const without = name.replace(m[0], "").replace(/\s{2,}/g, " ").trim();
  return { name: without || name, qty };
}

/** Roher OCR-Text → Belegpositionen. */
export function parseReceiptText(text: string): ReceiptLine[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);

  const result: ReceiptLine[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (SKIP.test(line)) continue;
    if (looksLikeOcrJunk(line)) continue;
    if (/^\d{1,2}[./]\d{1,2}/.test(line)) continue;
    if (/^\d+$/.test(line)) continue;

    const priced = line.match(PRICE_AT_END);
    let namePart = line;
    let price: string | undefined;

    if (priced) {
      namePart = priced[1].trim();
      price = `${priced[2].replace(".", ",")} €`;
      // Summe-Zeilen oft nur "19,99" mit kurzem Label
      if (SKIP.test(namePart) || namePart.length < 2) continue;
    } else {
      // Ohne Preis: nur behalten wenn es nach Produkt aussieht (Buchstaben)
      if (!/[a-zäöü]/i.test(line)) continue;
      if (line.length < 4 || line.length > 40) continue;
    }

    const cleaned = cleanName(namePart);
    if (cleaned.length < 2 || SKIP.test(cleaned) || looksLikeOcrJunk(cleaned))
      continue;

    const { name, qty } = extractQty(cleaned);
    if (looksLikeOcrJunk(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      id: `ocr-${result.length}-${key.slice(0, 12)}`,
      name,
      qty,
      price,
      selected: true,
    });

    if (result.length >= 25) break;
  }

  return result;
}

/** Kontrast + Graustufen + leichte Schärfung für bessere OCR. */
export async function preprocessReceiptImage(
  source: File | Blob | string,
): Promise<Blob> {
  const url =
    typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const img = await loadImage(url);
    const maxW = 1600;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      if (source instanceof Blob) return source;
      const res = await fetch(source);
      return res.blob();
    }
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    // Graustufen + Kontraststretch
    let min = 255;
    let max = 0;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    const range = Math.max(1, max - min);
    for (let i = 0; i < d.length; i += 4) {
      let v = ((d[i] - min) / range) * 255;
      // leichte Schwellwert-Nähe für Druckschrift
      v = v < 140 ? Math.max(0, v * 0.85) : Math.min(255, v * 1.08);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png", 0.95),
    );
    if (blob) return blob;
    if (source instanceof Blob) return source;
    const res = await fetch(typeof source === "string" ? source : url);
    return res.blob();
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = url;
  });
}

export async function recognizeReceiptImage(
  image: File | Blob | string,
  onProgress?: (pct: number) => void,
): Promise<{ text: string; lines: ReceiptLine[] }> {
  const { createWorker } = await import("tesseract.js");
  const prepared = await preprocessReceiptImage(image);
  const worker = await createWorker("deu", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(prepared);
    const lines = parseReceiptText(text);
    return { text, lines };
  } finally {
    await worker.terminate();
  }
}
