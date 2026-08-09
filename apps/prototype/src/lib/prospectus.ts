/** Öffentliche Online-Prospekt-Seiten der Ketten (kein Scraping — nur Link). */
const CHAIN_PROSPECTUS: Record<string, string> = {
  REWE: "https://www.rewe.de/angebote/",
  Aldi: "https://www.aldi-sued.de/de/angebote.html",
  Lidl: "https://www.lidl.de/c/billiger-wochen/s10005540",
  Edeka: "https://www.edeka.de/eh/angebote.jsp",
  Netto: "https://www.netto-online.de/angebote.chtml",
  Penny: "https://www.penny.de/angebote",
  dm: "https://www.dm.de/angebote",
  Rossmann: "https://www.rossmann.de/de/angebote.html",
};

export function prospectusUrlForChain(chain: string): string | null {
  const key = Object.keys(CHAIN_PROSPECTUS).find(
    (k) => chain.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(chain.toLowerCase()),
  );
  if (key) return CHAIN_PROSPECTUS[key];
  // OSM-Namen oft nur Markenwort
  const lower = chain.toLowerCase();
  if (lower.includes("rewe")) return CHAIN_PROSPECTUS.REWE;
  if (lower.includes("aldi")) return CHAIN_PROSPECTUS.Aldi;
  if (lower.includes("lidl")) return CHAIN_PROSPECTUS.Lidl;
  if (lower.includes("edeka") || lower.includes("marktkauf")) return CHAIN_PROSPECTUS.Edeka;
  if (lower.includes("netto")) return CHAIN_PROSPECTUS.Netto;
  if (lower.includes("penny")) return CHAIN_PROSPECTUS.Penny;
  if (lower.includes("rossmann")) return CHAIN_PROSPECTUS.Rossmann;
  if (lower === "dm" || lower.startsWith("dm ")) return CHAIN_PROSPECTUS.dm;
  return null;
}

export function prospectusUrlForStore(store: {
  chain: string;
  name: string;
}): string | null {
  return (
    prospectusUrlForChain(store.chain) || prospectusUrlForChain(store.name)
  );
}
