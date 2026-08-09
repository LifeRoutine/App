import { barcodeCatalog, type CatalogProduct } from "@/lib/barcode-catalog";

type OffProduct = {
  status: number;
  product?: {
    product_name?: string;
    product_name_de?: string;
    brands?: string;
    quantity?: string;
    product_quantity?: number;
    product_quantity_unit?: string;
  };
};

function fromLocal(code: string): CatalogProduct | null {
  const normalized = code.replace(/\s/g, "");
  return (
    barcodeCatalog.find((p) => p.barcode === normalized) ??
    barcodeCatalog.find((p) => p.barcode.endsWith(normalized)) ??
    null
  );
}

/** Open Food Facts → verständlicher Produktname. */
export async function resolveBarcode(
  rawCode: string,
): Promise<CatalogProduct | null> {
  const code = rawCode.replace(/\s/g, "");
  if (!/^\d{8,14}$/.test(code)) return null;

  const local = fromLocal(code);
  if (local) return local;

  const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "LifeRoutine/0.1 (local prototype; barcode lookup)",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as OffProduct;
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const nameBase =
    p.product_name_de?.trim() ||
    p.product_name?.trim() ||
    "Unbekanntes Produkt";
  const brand = p.brands?.split(",")[0]?.trim();
  const name = brand && !nameBase.includes(brand) ? `${brand} ${nameBase}` : nameBase;
  const qty =
    p.quantity?.trim() ||
    (p.product_quantity && p.product_quantity_unit
      ? `${p.product_quantity} ${p.product_quantity_unit}`
      : "1×");

  return { barcode: code, name, qty };
}
