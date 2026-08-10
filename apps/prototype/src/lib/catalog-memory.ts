import type { UserCatalogEntry } from "@/lib/types";

/** Stabiler Schlüssel für reine Namenseinträge (ohne Barcode). */
export function nameCatalogKey(name: string): string {
  return `name:${name.trim().toLowerCase()}`;
}

export function isNameCatalogKey(barcode: string): boolean {
  return barcode.startsWith("name:");
}

/**
 * Merkt Produktnamen im Haushaltskatalog (Hintergrund).
 * Mit Barcode: Eintrag an Code. Ohne: an Name. Bestehende Einträge werden nach vorne geholt.
 */
export function rememberInCatalog(
  catalog: UserCatalogEntry[],
  names: string[],
  meta?: { barcode?: string; qty?: string; source?: UserCatalogEntry["source"] },
): UserCatalogEntry[] {
  let next = [...catalog];
  const now = new Date().toISOString();
  const barcode = meta?.barcode?.replace(/\s/g, "") || "";
  const qty = meta?.qty?.trim() || "1×";
  const source = meta?.source ?? "list";

  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;

    const key = barcode || nameCatalogKey(name);
    const existingIdx = next.findIndex((e) => {
      if (e.barcode === key) return true;
      if (!barcode && e.name.toLowerCase() === name.toLowerCase()) return true;
      return false;
    });

    if (existingIdx >= 0) {
      const prev = next[existingIdx];
      const entry: UserCatalogEntry = {
        ...prev,
        barcode: barcode || prev.barcode,
        name,
        qty: meta?.qty?.trim() || prev.qty,
        learnedAt: now,
        source: barcode ? (meta?.source ?? prev.source) : prev.source === "openfoodfacts" || prev.source === "demo"
          ? prev.source
          : source,
      };
      next = [entry, ...next.filter((_, i) => i !== existingIdx)];
      continue;
    }

    next = [
      {
        barcode: key,
        name,
        qty,
        learnedAt: now,
        source,
      },
      ...next,
    ];
  }

  return next;
}

/** Nur fehlende Namen ergänzen — ohne learnedAt bestehender Einträge anzufassen. */
export function ensureNamesInCatalog(
  catalog: UserCatalogEntry[],
  names: string[],
): UserCatalogEntry[] {
  const known = new Set(catalog.map((e) => e.name.toLowerCase()));
  const missing = names
    .map((n) => n.trim())
    .filter((n) => n && !known.has(n.toLowerCase()));
  if (missing.length === 0) return catalog;
  return rememberInCatalog(catalog, missing, { source: "list" });
}

/** Einmalige Namen für Vorschläge, neueste zuerst. */
export function uniqueCatalogNames(catalog: UserCatalogEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const sorted = [...catalog].sort((a, b) =>
    b.learnedAt.localeCompare(a.learnedAt),
  );
  for (const e of sorted) {
    const key = e.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e.name);
  }
  return out;
}

export function filterCatalogNames(
  catalog: UserCatalogEntry[],
  query: string,
  limit = 8,
): string[] {
  const q = query.trim().toLowerCase();
  const all = uniqueCatalogNames(catalog);
  if (!q) return all.slice(0, limit);
  return all.filter((n) => n.toLowerCase().includes(q)).slice(0, limit);
}
