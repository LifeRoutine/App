export type CatalogProduct = {
  barcode: string;
  name: string;
  qty: string;
};

/** Demo-Katalog für Barcode-Scan (später: Open Food Facts / Händler-API). */
export const barcodeCatalog: CatalogProduct[] = [
  { barcode: "4008400402623", name: "Milch 1,5%", qty: "1 L" },
  { barcode: "42287603", name: "Kaffee gemahlen", qty: "500 g" },
  { barcode: "4008400300128", name: "Butter", qty: "250 g" },
  { barcode: "4008400291525", name: "Joghurt Natur", qty: "500 g" },
  { barcode: "4015400548812", name: "Waschmittel", qty: "1 Pack" },
  { barcode: "4006381333931", name: "Nudeln Spaghetti", qty: "500 g" },
  { barcode: "4008400212521", name: "Eier Freiland", qty: "10 St." },
  { barcode: "4008400401015", name: "Olivenöl", qty: "500 ml" },
];

export function lookupBarcode(code: string): CatalogProduct | null {
  const normalized = code.replace(/\s/g, "");
  return (
    barcodeCatalog.find((p) => p.barcode === normalized) ??
    barcodeCatalog.find((p) => p.barcode.endsWith(normalized)) ??
    null
  );
}
