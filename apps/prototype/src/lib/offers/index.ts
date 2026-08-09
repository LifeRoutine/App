import type { ShopOffer } from "@/lib/types";
import { demoOfferProvider } from "@/lib/offers/demo-provider";
import type { OfferLookupQuery, OfferProvider } from "@/lib/offers/types";

/**
 * Aktiver Anbieter. Später: partnerOfferProvider davorhängen.
 * Reihenfolge: explizites Item-Angebot (user/partner) schlägt Katalog.
 */
export function resolveOffer(
  existing: ShopOffer | undefined,
  query: OfferLookupQuery,
  providers: OfferProvider[] = [demoOfferProvider],
): ShopOffer | null {
  if (existing?.source === "user" || existing?.source === "partner") {
    return existing;
  }
  if (existing && existing.source !== "demo") {
    // Legacy ohne source, aber gesetzt → behalten
    if (existing.source == null && existing.demo === false) return existing;
  }
  for (const p of providers) {
    const found = p.findOffer(query);
    if (found) return found;
  }
  // Fallback: am Item klebendes Demo
  if (existing) return { ...existing, source: existing.source ?? "demo", demo: true };
  return null;
}

export { demoOfferProvider };
