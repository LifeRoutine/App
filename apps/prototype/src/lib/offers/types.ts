import type { NearbyStore, ShopOffer } from "@/lib/types";

export type OfferSourceKind = "demo" | "user" | "partner";

export type OfferLookupQuery = {
  productName: string;
  preferredStoreIds: string[];
  stores: NearbyStore[];
};

export type OfferProvider = {
  id: OfferSourceKind | "composite";
  label: string;
  /** Lookup für ein Produkt; null = nichts gefunden */
  findOffer: (query: OfferLookupQuery) => ShopOffer | null;
};

export function formatSave(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function offerBadgeLabel(offer: ShopOffer): string {
  if (offer.source === "user") return "Von dir (Prospekt)";
  if (offer.source === "partner") return "Angebot";
  if (offer.demo !== false || offer.source === "demo" || offer.source == null) {
    return "Demo-Angebot";
  }
  return "Angebot";
}
