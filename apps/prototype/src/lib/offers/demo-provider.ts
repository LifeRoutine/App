import type { OfferProvider } from "@/lib/offers/types";

/**
 * Kein erfundener Preiskatalog.
 * Angebote kommen nur vom Nutzer (Prospekt markieren) oder später Partner-Feed.
 */
export const demoOfferProvider: OfferProvider = {
  id: "demo",
  label: "Kein Demo-Katalog",
  findOffer() {
    return null;
  },
};
