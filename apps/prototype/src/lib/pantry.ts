import type { PantryItem } from "@/lib/types";

export const PANTRY_UNITS = [
  "Stück",
  "Packung",
  "Flasche",
  "Dose",
  "Liter",
  "kg",
  "Beutel",
] as const;

export type PantryUnit = (typeof PANTRY_UNITS)[number];

export function statusFromAmount(
  amount: number,
  minAmount = 1,
): PantryItem["status"] {
  if (amount <= 0) return "empty";
  if (amount < Math.max(1, minAmount)) return "low";
  return "ok";
}

export function estimateFromAmount(
  amount: number,
  unit: string,
  minAmount = 1,
): string {
  if (amount <= 0) return "leer / nachkaufen";
  const label = pluralLabel(amount, unit);
  const min = Math.max(1, minAmount);
  if (amount < min) {
    return `${amount} ${label} · unter Mindestvorrat (${min})`;
  }
  return `${amount} ${label}`;
}

export function pluralLabel(amount: number, unit: string): string {
  if (amount === 1) return unit;
  if (unit === "Packung") return "Packungen";
  if (unit === "Flasche") return "Flaschen";
  if (unit === "Dose") return "Dosen";
  return unit;
}

/** "6 St." / "1 L" / "2×" → Menge + Einheit */
export function parseQtyHint(
  qty?: string,
): { amount: number; unit: string } | null {
  if (!qty) return null;
  const t = qty.trim().toLowerCase();
  const m = t.match(/^(\d+[.,]?\d*)\s*(.*)$/);
  if (!m) return null;
  const amount = Math.max(0, Math.round(Number(m[1].replace(",", "."))) || 0);
  if (!amount) return null;
  const raw = m[2].replace(/[×x]/gi, "").trim();
  let unit: string = "Stück";
  if (/pack|pkg|pck/i.test(raw)) unit = "Packung";
  else if (/flasch/i.test(raw)) unit = "Flasche";
  else if (/dose/i.test(raw)) unit = "Dose";
  else if (/^(l|liter)$/i.test(raw)) unit = "Liter";
  else if (/^(kg|kilo)/i.test(raw)) unit = "kg";
  else if (/beutel|tüte/i.test(raw)) unit = "Beutel";
  else if (/st|stk|stück|pcs/i.test(raw) || raw === "") unit = "Stück";
  return { amount, unit };
}

export function guessDefaultMin(name: string, unit: string): number {
  const n = name.toLowerCase();
  if (/\beier?\b/.test(n)) return 6;
  if (unit === "Liter" || unit === "Flasche") return 1;
  if (unit === "Packung") return 2;
  return 1;
}

export function normalizePantryItem(
  item: Partial<PantryItem> & { id: string; name: string },
): PantryItem {
  const amount =
    typeof item.amount === "number" && Number.isFinite(item.amount)
      ? Math.max(0, Math.round(item.amount))
      : item.status === "empty"
        ? 0
        : item.status === "low"
          ? 1
          : 2;
  const unit = item.unit?.trim() || guessDefaultUnit(item.name);
  const minAmount =
    typeof item.minAmount === "number" && Number.isFinite(item.minAmount)
      ? Math.max(1, Math.round(item.minAmount))
      : guessDefaultMin(item.name, unit);
  const status = statusFromAmount(amount, minAmount);
  return {
    id: item.id,
    name: item.name,
    barcode: item.barcode,
    amount,
    minAmount,
    unit,
    status,
    estimate: estimateFromAmount(amount, unit, minAmount),
  };
}

export function guessDefaultUnit(name: string): string {
  const n = name.toLowerCase();
  if (/\beier?\b|banane|apfel|tomate|zwiebel/.test(n)) return "Stück";
  if (/milch|saft|\böl\b|essig|wasser/.test(n)) return "Liter";
  if (/nudeln|reis|mehl|zucker|kaffee|tee|wasch|spül/.test(n)) return "Packung";
  if (/reiniger/.test(n)) return "Flasche";
  if (/dose|mais|bohnen|thunfisch/.test(n)) return "Dose";
  return "Stück";
}
